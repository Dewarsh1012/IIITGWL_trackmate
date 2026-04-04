import fs from 'fs/promises';
import path from 'path';
import { Incident, LocationLog, Zone } from '../models';
import { AlertSource } from '../types';
import { calculateSpeed, distanceInMeters, findZoneForPoint } from './geofence';

const MODEL_FILE_PATH = path.join(process.cwd(), 'data', 'anomaly-model.json');
const TRAINING_WINDOW_DAYS = 45;
const RECENT_INCIDENT_WINDOW_MS = 15 * 60 * 1000;
const RECENT_USER_ANOMALY_WINDOW_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_EXCLUSION_WINDOW_MS = 30 * 60 * 1000;

const ANOMALY_TYPES = new Set(['inactivity', 'unusual_speed', 'zone_breach', 'incident_cluster']);

export const FEATURE_ORDER = [
    'inactivity_minutes_norm',
    'speed_kmh_norm',
    'outside_zone_flag',
    'nearby_incidents_norm',
    'nearby_critical_incidents_norm',
    'user_anomalies_24h_norm',
] as const;

export interface AnomalyFeatureMetrics {
    inactivityMinutes: number;
    speedKmh: number;
    isOutsideZone: boolean;
    nearbyIncidents15m: number;
    nearbyCriticalIncidents15m: number;
    userAnomalies24h: number;
}

interface TrainingSample {
    features: number[];
    label: 0 | 1;
}

export interface StoredAnomalyModel {
    model_version: string;
    trained_at: string;
    feature_order: ReadonlyArray<string>;
    weights: number[];
    bias: number;
    sample_count: number;
    positive_count: number;
    negative_count: number;
    training_loss: number;
    training_accuracy: number;
    source: 'heuristic' | 'trained';
}

export interface TrainAnomalyModelOptions {
    maxSamples?: number;
    iterations?: number;
    learningRate?: number;
}

interface ModelScoreResult {
    modelScore: number;
    modelVersion: string;
    normalizedFeatures: number[];
}

interface TrainingResult {
    weights: number[];
    bias: number;
    loss: number;
    accuracy: number;
    iterations: number;
}

interface IncidentLite {
    reporter?: unknown;
    incident_type: string;
    source?: string;
    severity?: string;
    latitude?: number;
    longitude?: number;
    created_at: Date;
}

interface LocationLogLite {
    user: unknown;
    latitude: number;
    longitude: number;
    recorded_at: Date;
}

const DEFAULT_MODEL: StoredAnomalyModel = {
    model_version: 'heuristic-v1',
    trained_at: new Date(0).toISOString(),
    feature_order: [...FEATURE_ORDER],
    weights: [1.55, 1.1, 1.75, 0.95, 0.8, 0.9],
    bias: -2.2,
    sample_count: 0,
    positive_count: 0,
    negative_count: 0,
    training_loss: 0,
    training_accuracy: 0,
    source: 'heuristic',
};

let cachedModel: StoredAnomalyModel | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60 * 1000;

export function normaliseAnomalyFeatures(metrics: AnomalyFeatureMetrics): number[] {
    const inactivity = clamp(metrics.inactivityMinutes / 60, 0, 1);
    const speed = clamp(metrics.speedKmh / 140, 0, 1);
    const outside = metrics.isOutsideZone ? 1 : 0;
    const nearby = clamp(metrics.nearbyIncidents15m / 6, 0, 1);
    const nearbyCritical = clamp(metrics.nearbyCriticalIncidents15m / 3, 0, 1);
    const userHistory = clamp(metrics.userAnomalies24h / 5, 0, 1);

    return [inactivity, speed, outside, nearby, nearbyCritical, userHistory];
}

export function combineRuleAndModelScore(ruleScore: number, modelScore: number, modelWeight = 0.35): number {
    const safeModelWeight = clamp(modelWeight, 0, 1);
    const safeRuleWeight = 1 - safeModelWeight;
    return clamp(ruleScore * safeRuleWeight + modelScore * safeModelWeight, 0, 1);
}

export async function scoreAnomalyRisk(metrics: AnomalyFeatureMetrics): Promise<ModelScoreResult> {
    const model = await loadAnomalyModel();
    const normalizedFeatures = normaliseAnomalyFeatures(metrics);
    const linear = dot(model.weights, normalizedFeatures) + model.bias;
    const modelScore = sigmoid(linear);
    return {
        modelScore,
        modelVersion: model.model_version,
        normalizedFeatures,
    };
}

export function trainLogisticRegression(
    samples: Array<{ features: number[]; label: 0 | 1 }>,
    options?: { iterations?: number; learningRate?: number }
): TrainingResult {
    if (samples.length === 0) {
        throw new Error('Cannot train anomaly model with zero samples.');
    }

    const featureCount = samples[0].features.length;
    const iterations = Math.max(50, options?.iterations ?? 600);
    const learningRate = clamp(options?.learningRate ?? 0.1, 0.0001, 1);

    const weights = new Array(featureCount).fill(0);
    let bias = 0;

    for (let epoch = 0; epoch < iterations; epoch += 1) {
        const gradW = new Array(featureCount).fill(0);
        let gradB = 0;

        for (const sample of samples) {
            const prediction = sigmoid(dot(weights, sample.features) + bias);
            const error = prediction - sample.label;

            for (let i = 0; i < featureCount; i += 1) {
                gradW[i] += error * sample.features[i];
            }
            gradB += error;
        }

        const invN = 1 / samples.length;
        for (let i = 0; i < featureCount; i += 1) {
            weights[i] -= learningRate * gradW[i] * invN;
        }
        bias -= learningRate * gradB * invN;
    }

    let correct = 0;
    let totalLoss = 0;
    for (const sample of samples) {
        const prediction = sigmoid(dot(weights, sample.features) + bias);
        const predictedClass = prediction >= 0.5 ? 1 : 0;
        if (predictedClass === sample.label) correct += 1;

        const clipped = clamp(prediction, 1e-6, 1 - 1e-6);
        totalLoss += -(sample.label * Math.log(clipped) + (1 - sample.label) * Math.log(1 - clipped));
    }

    return {
        weights,
        bias,
        loss: totalLoss / samples.length,
        accuracy: correct / samples.length,
        iterations,
    };
}

export async function trainAndPersistAnomalyModel(options?: TrainAnomalyModelOptions): Promise<{
    modelVersion: string;
    sampleCount: number;
    positiveCount: number;
    negativeCount: number;
    loss: number;
    accuracy: number;
    iterations: number;
    learningRate: number;
}> {
    const maxSamples = clamp(Math.floor(options?.maxSamples ?? 500), 100, 5000);
    const iterations = Math.max(100, options?.iterations ?? 700);
    const learningRate = clamp(options?.learningRate ?? 0.1, 0.0001, 1);

    const samples = await buildTrainingSamples(maxSamples);
    if (samples.length < 40) {
        throw new Error(`Not enough training samples to train model (found ${samples.length}, need at least 40).`);
    }

    const positiveCount = samples.filter((sample) => sample.label === 1).length;
    const negativeCount = samples.length - positiveCount;
    if (positiveCount < 20 || negativeCount < 20) {
        throw new Error('Training aborted. Need at least 20 positive and 20 negative samples.');
    }

    const training = trainLogisticRegression(samples, { iterations, learningRate });
    const modelVersion = `lr-${Date.now()}`;
    const model: StoredAnomalyModel = {
        model_version: modelVersion,
        trained_at: new Date().toISOString(),
        feature_order: [...FEATURE_ORDER],
        weights: training.weights,
        bias: training.bias,
        sample_count: samples.length,
        positive_count: positiveCount,
        negative_count: negativeCount,
        training_loss: training.loss,
        training_accuracy: training.accuracy,
        source: 'trained',
    };

    await persistModel(model);

    return {
        modelVersion,
        sampleCount: samples.length,
        positiveCount,
        negativeCount,
        loss: training.loss,
        accuracy: training.accuracy,
        iterations: training.iterations,
        learningRate,
    };
}

export async function getAnomalyModelStatus(): Promise<{
    hasPersistedModel: boolean;
    modelPath: string;
    activeModelVersion: string;
    trainedAt: string;
    source: 'heuristic' | 'trained';
    sampleCount: number;
    accuracy: number;
}> {
    const persisted = await readModelFromDisk();
    const active = await loadAnomalyModel();

    return {
        hasPersistedModel: Boolean(persisted),
        modelPath: MODEL_FILE_PATH,
        activeModelVersion: active.model_version,
        trainedAt: active.trained_at,
        source: active.source,
        sampleCount: active.sample_count,
        accuracy: active.training_accuracy,
    };
}

async function loadAnomalyModel(): Promise<StoredAnomalyModel> {
    const now = Date.now();
    if (cachedModel && now - cacheLoadedAt < CACHE_TTL_MS) {
        return cachedModel;
    }

    const diskModel = await readModelFromDisk();
    cachedModel = diskModel ?? DEFAULT_MODEL;
    cacheLoadedAt = now;
    return cachedModel;
}

async function persistModel(model: StoredAnomalyModel): Promise<void> {
    await fs.mkdir(path.dirname(MODEL_FILE_PATH), { recursive: true });
    await fs.writeFile(MODEL_FILE_PATH, JSON.stringify(model, null, 2), 'utf-8');
    cachedModel = model;
    cacheLoadedAt = Date.now();
}

async function readModelFromDisk(): Promise<StoredAnomalyModel | null> {
    try {
        const file = await fs.readFile(MODEL_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(file) as StoredAnomalyModel;
        if (
            !Array.isArray(parsed.weights) ||
            parsed.weights.length !== FEATURE_ORDER.length ||
            typeof parsed.bias !== 'number' ||
            !Array.isArray(parsed.feature_order)
        ) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

async function buildTrainingSamples(maxSamples: number): Promise<TrainingSample[]> {
    const cutoff = new Date(Date.now() - TRAINING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [zonesRaw, incidentsRaw, logsRaw] = await Promise.all([
        Zone.find({ is_active: true }).lean(),
        Incident.find({ created_at: { $gte: cutoff } })
            .select('reporter incident_type source severity latitude longitude created_at')
            .lean(),
        LocationLog.find({ recorded_at: { $gte: cutoff } })
            .select('user latitude longitude recorded_at')
            .sort({ user: 1, recorded_at: -1 })
            .lean(),
    ]);

    const zones = zonesRaw as any[];
    const incidents: IncidentLite[] = incidentsRaw.map((inc: any) => ({
        reporter: inc.reporter,
        incident_type: String(inc.incident_type || ''),
        source: inc.source ? String(inc.source) : undefined,
        severity: inc.severity ? String(inc.severity) : undefined,
        latitude: toFiniteOrUndefined(inc.latitude),
        longitude: toFiniteOrUndefined(inc.longitude),
        created_at: new Date(inc.created_at),
    }));

    const logs: LocationLogLite[] = logsRaw.map((log: any) => ({
        user: log.user,
        latitude: Number(log.latitude),
        longitude: Number(log.longitude),
        recorded_at: new Date(log.recorded_at),
    }));

    const logsByUser = new Map<string, LocationLogLite[]>();
    for (const log of logs) {
        const userId = toRefString(log.user);
        if (!userId) continue;
        if (!logsByUser.has(userId)) logsByUser.set(userId, []);
        logsByUser.get(userId)!.push(log);
    }

    const anomalyIncidents = incidents.filter((inc) => {
        if (!ANOMALY_TYPES.has(inc.incident_type)) return false;
        return inc.source === AlertSource.AI_ANOMALY || inc.source === AlertSource.SOS_PANIC;
    });

    const positives: TrainingSample[] = [];
    const negatives: TrainingSample[] = [];

    const shuffledPositives = shuffle(anomalyIncidents).slice(0, maxSamples);
    for (const inc of shuffledPositives) {
        const reporterId = toRefString(inc.reporter);
        const userLogs = reporterId ? logsByUser.get(reporterId) ?? [] : [];
        const metrics = buildFeatureMetricsForEvent({
            eventTime: inc.created_at,
            latitude: inc.latitude,
            longitude: inc.longitude,
            userId: reporterId,
            userLogs,
            zones,
            incidents,
        });
        positives.push({ features: normaliseAnomalyFeatures(metrics), label: 1 });
    }

    const anomalyTimesByUser = new Map<string, number[]>();
    for (const inc of anomalyIncidents) {
        const reporterId = toRefString(inc.reporter);
        if (!reporterId) continue;
        if (!anomalyTimesByUser.has(reporterId)) anomalyTimesByUser.set(reporterId, []);
        anomalyTimesByUser.get(reporterId)!.push(inc.created_at.getTime());
    }
    for (const [userId, times] of anomalyTimesByUser.entries()) {
        anomalyTimesByUser.set(userId, times.sort((a, b) => a - b));
    }

    const shuffledLogs = shuffle(logs);
    for (const log of shuffledLogs) {
        if (negatives.length >= positives.length) break;

        const userId = toRefString(log.user);
        if (!userId) continue;

        const anomalyTimes = anomalyTimesByUser.get(userId) ?? [];
        const hasNearbyAnomaly = anomalyTimes.some((ts) =>
            Math.abs(ts - log.recorded_at.getTime()) <= NEGATIVE_EXCLUSION_WINDOW_MS
        );
        if (hasNearbyAnomaly) continue;

        const userLogs = logsByUser.get(userId) ?? [];
        const metrics = buildFeatureMetricsForEvent({
            eventTime: log.recorded_at,
            latitude: log.latitude,
            longitude: log.longitude,
            userId,
            userLogs,
            zones,
            incidents,
        });

        negatives.push({ features: normaliseAnomalyFeatures(metrics), label: 0 });
    }

    return [...positives, ...negatives];
}

function buildFeatureMetricsForEvent(params: {
    eventTime: Date;
    latitude?: number;
    longitude?: number;
    userId?: string | null;
    userLogs: LocationLogLite[];
    zones: any[];
    incidents: IncidentLite[];
}): AnomalyFeatureMetrics {
    const { eventTime, latitude, longitude, userId, userLogs, zones, incidents } = params;
    const { latest, previous } = findLatestAndPreviousLogs(userLogs, eventTime);

    const refLat = Number.isFinite(latitude)
        ? Number(latitude)
        : latest
            ? latest.latitude
            : undefined;
    const refLng = Number.isFinite(longitude)
        ? Number(longitude)
        : latest
            ? latest.longitude
            : undefined;

    const inactivityMinutes = latest
        ? Math.max(0, (eventTime.getTime() - latest.recorded_at.getTime()) / 60000)
        : 60;

    let speedKmh = 0;
    if (latest && previous) {
        speedKmh = calculateSpeed(
            latest.latitude,
            latest.longitude,
            latest.recorded_at,
            previous.latitude,
            previous.longitude,
            previous.recorded_at
        );
    }

    let isOutsideZone = false;
    if (Number.isFinite(refLat) && Number.isFinite(refLng)) {
        const zone = findZoneForPoint(Number(refLat), Number(refLng), zones as any);
        isOutsideZone = !zone;
    }

    let nearbyIncidents15m = 0;
    let nearbyCriticalIncidents15m = 0;
    if (Number.isFinite(refLat) && Number.isFinite(refLng)) {
        const nearby = countNearbyIncidents({
            latitude: Number(refLat),
            longitude: Number(refLng),
            eventTime,
            incidents,
        });
        nearbyIncidents15m = nearby.total;
        nearbyCriticalIncidents15m = nearby.critical;
    }

    const userAnomalies24h = userId
        ? incidents.filter((inc) => {
            const reporterId = toRefString(inc.reporter);
            if (!reporterId || reporterId !== userId) return false;
            if (inc.source !== AlertSource.AI_ANOMALY) return false;
            if (!ANOMALY_TYPES.has(inc.incident_type)) return false;

            const diff = eventTime.getTime() - inc.created_at.getTime();
            return diff > 0 && diff <= RECENT_USER_ANOMALY_WINDOW_MS;
        }).length
        : 0;

    return {
        inactivityMinutes,
        speedKmh,
        isOutsideZone,
        nearbyIncidents15m,
        nearbyCriticalIncidents15m,
        userAnomalies24h,
    };
}

function findLatestAndPreviousLogs(
    logs: LocationLogLite[],
    eventTime: Date
): { latest: LocationLogLite | null; previous: LocationLogLite | null } {
    if (logs.length === 0) {
        return { latest: null, previous: null };
    }

    const eventMs = eventTime.getTime();
    for (let i = 0; i < logs.length; i += 1) {
        const logMs = logs[i].recorded_at.getTime();
        if (logMs <= eventMs) {
            return {
                latest: logs[i],
                previous: logs[i + 1] ?? null,
            };
        }
    }

    return {
        latest: logs[logs.length - 1],
        previous: null,
    };
}

function countNearbyIncidents(params: {
    latitude: number;
    longitude: number;
    eventTime: Date;
    incidents: IncidentLite[];
}): { total: number; critical: number } {
    const { latitude, longitude, eventTime, incidents } = params;
    let total = 0;
    let critical = 0;

    for (const inc of incidents) {
        if (!Number.isFinite(inc.latitude) || !Number.isFinite(inc.longitude)) continue;
        const timeDiff = Math.abs(eventTime.getTime() - inc.created_at.getTime());
        if (timeDiff > RECENT_INCIDENT_WINDOW_MS) continue;

        const distance = distanceInMeters(latitude, longitude, inc.latitude as number, inc.longitude as number);
        if (distance > 600) continue;

        total += 1;
        if (inc.severity === 'critical' || inc.severity === 'high') {
            critical += 1;
        }
    }

    return { total, critical };
}

function dot(weights: number[], values: number[]): number {
    let total = 0;
    const size = Math.min(weights.length, values.length);
    for (let i = 0; i < size; i += 1) {
        total += weights[i] * values[i];
    }
    return total;
}

function sigmoid(x: number): number {
    if (x >= 0) {
        const z = Math.exp(-x);
        return 1 / (1 + z);
    }
    const z = Math.exp(x);
    return z / (1 + z);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function shuffle<T>(items: T[]): T[] {
    const list = [...items];
    for (let i = list.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
    return list;
}

function toRefString(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        const maybeObject = value as Record<string, unknown>;
        if (typeof maybeObject._id === 'string') return maybeObject._id;
        if (maybeObject._id != null) return String(maybeObject._id);
    }
    return String(value);
}

function toFiniteOrUndefined(value: unknown): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}
