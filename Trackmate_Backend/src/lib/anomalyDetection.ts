import { Profile, LocationLog, Incident, Zone } from '../models';
import { findZoneForPoint, distanceInMeters, calculateSpeed } from './geofence';
import { AlertSeverity, AlertSource } from '../types';

const ANOMALY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Starts the anomaly detection engine as a recurring setInterval.
 */
export function startAnomalyDetection(): void {
    console.log('🤖 Anomaly detection engine started (interval: 5 min)');
    setInterval(runAnomalyChecks, ANOMALY_INTERVAL_MS);
}

/**
 * Run all six anomaly checks.
 * Can also be called on-demand after an incident report.
 */
export async function runAnomalyChecks(): Promise<{ detected: number; incidents: string[] }> {
    console.log('🔍 Running anomaly detection...');
    const created: string[] = [];

    try {
        const cutoff = new Date(Date.now() - 60 * 60 * 1000); // active = updated in last hour
        const zones = await Zone.find({ is_active: true }).lean();

        // Get all users with recent location logs
        const recentLogs = await LocationLog.find({ recorded_at: { $gte: cutoff } })
            .populate('user', 'role')
            .sort({ user: 1, recorded_at: -1 })
            .lean();

        // Group by user
        const byUser = new Map<string, typeof recentLogs>();
        for (const log of recentLogs) {
            const uid = String((log as any).user?._id || log.user);
            if (!byUser.has(uid)) byUser.set(uid, []);
            byUser.get(uid)!.push(log);
        }

        for (const [userId, logs] of byUser.entries()) {
            const latest = logs[0];
            const userRole = (latest as any).user?.role || 'tourist';

            // ── Check 1: Prolonged Inactivity (tourist only) ──────────────
            if (userRole === 'tourist') {
                const gapMs = Date.now() - new Date(latest.recorded_at).getTime();
                if (gapMs > 30 * 60 * 1000) {
                    const exists = await Incident.findOne({
                        reporter: userId,
                        incident_type: 'inactivity',
                        status: 'active',
                    });
                    if (!exists) {
                        const inc = await Incident.create({
                            reporter: userId,
                            incident_type: 'inactivity',
                            title: 'Tourist Prolonged Inactivity',
                            description: `Tourist has not updated their location in ${Math.round(gapMs / 60000)} minutes. Last known: (${latest.latitude.toFixed(4)}, ${latest.longitude.toFixed(4)})`,
                            latitude: latest.latitude,
                            longitude: latest.longitude,
                            severity: AlertSeverity.HIGH,
                            source: AlertSource.AI_ANOMALY,
                            metadata: {
                                anomaly_type: 'inactivity',
                                confidence: 0.9,
                                gap_minutes: Math.round(gapMs / 60000),
                                last_known_lat: latest.latitude,
                                last_known_lng: latest.longitude,
                                detected_at: new Date().toISOString(),
                            },
                        });
                        created.push(String(inc._id));
                    }
                }
            }

            // ── Check 2: Unusual Speed ────────────────────────────────────
            if (logs.length >= 2) {
                const l1 = logs[0];
                const l2 = logs[1];
                const speed = calculateSpeed(
                    l1.latitude, l1.longitude, new Date(l1.recorded_at),
                    l2.latitude, l2.longitude, new Date(l2.recorded_at)
                );
                if (speed > 130) {
                    const exists = await Incident.findOne({
                        reporter: userId,
                        incident_type: 'unusual_speed',
                        status: 'active',
                    });
                    if (!exists) {
                        const inc = await Incident.create({
                            reporter: userId,
                            incident_type: 'unusual_speed',
                            title: 'Unusual Movement Speed Detected',
                            description: `User appears to be moving at ${Math.round(speed)} km/h — possible vehicle accident or device error.`,
                            latitude: l1.latitude,
                            longitude: l1.longitude,
                            severity: AlertSeverity.HIGH,
                            source: AlertSource.AI_ANOMALY,
                            metadata: {
                                anomaly_type: 'unusual_speed',
                                confidence: 0.75,
                                speed_kmh: Math.round(speed),
                                detected_at: new Date().toISOString(),
                            },
                        });
                        created.push(String(inc._id));
                    }
                }
            }

            // ── Check 3: Zone Breach ──────────────────────────────────────
            const zone = findZoneForPoint(latest.latitude, latest.longitude, zones as any);
            if (!zone) {
                const exists = await Incident.findOne({
                    reporter: userId,
                    incident_type: 'zone_breach',
                    status: 'active',
                    created_at: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
                });
                if (!exists) {
                    const inc = await Incident.create({
                        reporter: userId,
                        incident_type: 'zone_breach',
                        title: 'User Outside All Monitored Zones',
                        description: `User at (${latest.latitude.toFixed(4)}, ${latest.longitude.toFixed(4)}) is outside all active safety zones.`,
                        latitude: latest.latitude,
                        longitude: latest.longitude,
                        severity: AlertSeverity.MEDIUM,
                        source: AlertSource.AI_ANOMALY,
                        metadata: {
                            anomaly_type: 'zone_breach',
                            confidence: 0.95,
                            detected_at: new Date().toISOString(),
                        },
                    });
                    created.push(String(inc._id));
                }
            }
        }

        // ── Check 4: Incident Cluster ────────────────────────────────────
        const last15min = new Date(Date.now() - 15 * 60 * 1000);
        const recentIncidents = await Incident.find({
            created_at: { $gte: last15min },
            latitude: { $exists: true },
            longitude: { $exists: true },
        }).lean();

        // Simple clustering: group by ~500m grid cells
        const grid = new Map<string, number>();
        for (const inc of recentIncidents) {
            if (inc.latitude == null || inc.longitude == null) continue;
            const key = `${Math.round(inc.latitude! * 100)}_${Math.round(inc.longitude! * 100)}`;
            grid.set(key, (grid.get(key) || 0) + 1);
        }
        for (const [, count] of grid.entries()) {
            if (count >= 3) {
                const clusterExists = await Incident.findOne({
                    incident_type: 'incident_cluster',
                    status: 'active',
                    created_at: { $gte: last15min },
                });
                if (!clusterExists) {
                    const inc = await Incident.create({
                        incident_type: 'incident_cluster',
                        title: 'Incident Cluster Detected',
                        description: `${count} incidents reported in a 500m radius within 15 minutes — possible developing situation.`,
                        severity: AlertSeverity.CRITICAL,
                        source: AlertSource.AI_ANOMALY,
                        metadata: {
                            anomaly_type: 'incident_cluster',
                            confidence: 0.85,
                            cluster_count: count,
                            detected_at: new Date().toISOString(),
                        },
                    });
                    created.push(String(inc._id));
                }
                break;
            }
        }

        // ── Check 5: Safety Score Adjustment ────────────────────────────
        // Lower score for each active anomaly, boost for clean tourists
        const tourists = await Profile.find({ role: 'tourist', is_active: true }).lean();
        for (const tourist of tourists) {
            const activeAnomalies = await Incident.countDocuments({
                reporter: tourist._id,
                source: AlertSource.AI_ANOMALY,
                status: 'active',
            });
            const decrease = Math.min(activeAnomalies * 10, 50);

            // Boost if no anomalies in last 30 min
            const boost = activeAnomalies === 0 ? 2 : 0;

            const newScore = Math.max(0, Math.min(100, tourist.safety_score - decrease + boost));
            if (newScore !== tourist.safety_score) {
                await Profile.findByIdAndUpdate(tourist._id, { $set: { safety_score: newScore } });
            }
        }

        console.log(`✅ Anomaly detection complete. Created ${created.length} new incidents.`);
        return { detected: created.length, incidents: created };
    } catch (err) {
        console.error('❌ Anomaly detection error:', err);
        return { detected: 0, incidents: [] };
    }
}
