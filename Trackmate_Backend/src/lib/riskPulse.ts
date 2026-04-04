import { Server as SocketIOServer } from 'socket.io';
import { Incident, Zone } from '../models';

export interface RiskPulseHotspot {
    zone_id: string;
    zone_name: string;
    risk_level: string;
    risk_score: number;
    active_incidents: number;
    recent_incidents_6h: number;
    trend: 'rising' | 'stable' | 'falling';
}

export interface RiskPulseSnapshot {
    generated_at: string;
    horizon_minutes: number;
    global_risk_score: number;
    forecast_risk_score: number;
    trend: 'rising' | 'stable' | 'falling';
    confidence: number;
    signal_strength: number;
    open_incidents: number;
    hotspots: RiskPulseHotspot[];
}

const DEFAULT_HORIZON_MINUTES = 60;
const PULSE_INTERVAL_MS = parsePositiveInt(process.env.RISK_PULSE_INTERVAL_MS, 90_000);

const SEVERITY_WEIGHT: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
};

const ZONE_BASE_WEIGHT: Record<string, number> = {
    restricted: 55,
    high: 42,
    moderate: 26,
    safe: 12,
};

export async function buildRiskPulseSnapshot(wardId?: string): Promise<RiskPulseSnapshot> {
    const now = Date.now();
    const recentStart = new Date(now - 6 * 60 * 60 * 1000);
    const previousStart = new Date(now - 12 * 60 * 60 * 1000);
    const previousEnd = new Date(now - 6 * 60 * 60 * 1000);

    const incidentMatch: Record<string, any> = {};
    if (wardId) incidentMatch.ward = wardId;

    const [zones, recentIncidents, previousIncidents, openIncidents] = await Promise.all([
        Zone.find({ is_active: true }).select('_id name risk_level').lean(),
        Incident.find({
            ...incidentMatch,
            created_at: { $gte: recentStart },
        })
            .select('zone severity created_at')
            .lean(),
        Incident.find({
            ...incidentMatch,
            created_at: { $gte: previousStart, $lt: previousEnd },
        })
            .select('zone severity created_at')
            .lean(),
        Incident.countDocuments({
            ...incidentMatch,
            status: { $in: ['active', 'acknowledged', 'assigned', 'escalated'] },
        }),
    ]);

    const recentZoneCounts = new Map<string, number>();
    const previousZoneCounts = new Map<string, number>();
    let recentSeverityWeight = 0;
    let previousSeverityWeight = 0;

    for (const incident of recentIncidents) {
        const zoneId = incident.zone ? String(incident.zone) : 'unassigned';
        recentZoneCounts.set(zoneId, (recentZoneCounts.get(zoneId) || 0) + 1);
        recentSeverityWeight += severityWeightFor(incident.severity);
    }

    for (const incident of previousIncidents) {
        const zoneId = incident.zone ? String(incident.zone) : 'unassigned';
        previousZoneCounts.set(zoneId, (previousZoneCounts.get(zoneId) || 0) + 1);
        previousSeverityWeight += severityWeightFor(incident.severity);
    }

    const hotspots: RiskPulseHotspot[] = zones
        .map((zone) => {
            const zoneId = String(zone._id);
            const recentCount = recentZoneCounts.get(zoneId) || 0;
            const previousCount = previousZoneCounts.get(zoneId) || 0;
            const trend = resolveTrend(recentCount, previousCount);

            const riskScore = clamp(
                Math.round(
                    (ZONE_BASE_WEIGHT[zone.risk_level] || 20) +
                    recentCount * 9 +
                    Math.max(0, recentCount - previousCount) * 6
                ),
                0,
                100
            );

            return {
                zone_id: zoneId,
                zone_name: zone.name,
                risk_level: zone.risk_level,
                risk_score: riskScore,
                active_incidents: 0,
                recent_incidents_6h: recentCount,
                trend,
            };
        })
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 5);

    const hotspotBase = hotspots.length
        ? hotspots.reduce((sum, item) => sum + item.risk_score, 0) / hotspots.length
        : 20;

    const trend = resolveTrend(recentSeverityWeight, previousSeverityWeight);

    const globalRiskScore = clamp(
        Math.round(
            hotspotBase * 0.55 +
            Math.min(38, recentSeverityWeight * 2.2) +
            Math.min(22, openIncidents * 1.6)
        ),
        0,
        100
    );

    const momentum = recentSeverityWeight - previousSeverityWeight;
    const trendOffset = trend === 'rising' ? 7 : trend === 'falling' ? -5 : 0;

    const forecastRiskScore = clamp(
        Math.round(globalRiskScore + momentum * 2 + trendOffset),
        0,
        100
    );

    const sampleSize = recentIncidents.length + previousIncidents.length;
    const confidence = clamp(roundTo(0.42 + Math.min(sampleSize / 180, 0.52), 3), 0.15, 0.94);
    const signalStrength = clamp(roundTo(Math.min(1, recentSeverityWeight / 30), 3), 0, 1);

    return {
        generated_at: new Date().toISOString(),
        horizon_minutes: DEFAULT_HORIZON_MINUTES,
        global_risk_score: globalRiskScore,
        forecast_risk_score: forecastRiskScore,
        trend,
        confidence,
        signal_strength: signalStrength,
        open_incidents: openIncidents,
        hotspots,
    };
}

export function startRiskPulseBroadcast(io: SocketIOServer): () => void {
    let stopped = false;

    const emitPulse = async () => {
        if (stopped) return;
        try {
            const snapshot = await buildRiskPulseSnapshot();
            io.to('authority_room').emit('risk:pulse', snapshot);
        } catch (err) {
            console.error('Risk pulse broadcast error:', err);
        }
    };

    void emitPulse();
    const timer = setInterval(emitPulse, PULSE_INTERVAL_MS);

    return () => {
        stopped = true;
        clearInterval(timer);
    };
}

function severityWeightFor(severity: unknown): number {
    const key = String(severity || '').toLowerCase();
    return SEVERITY_WEIGHT[key] || 1;
}

function resolveTrend(current: number, previous: number): 'rising' | 'stable' | 'falling' {
    if (current > previous * 1.15 + 1) return 'rising';
    if (current < previous * 0.85 - 1) return 'falling';
    return 'stable';
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.floor(value);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, digits: number): number {
    const power = 10 ** digits;
    return Math.round(value * power) / power;
}
