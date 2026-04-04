import { AnomalyFeatureMetrics } from './anomalyModel';

interface GeminiAnomalySummaryInput {
    incidentType: string;
    severity: string;
    title: string;
    description: string;
    ruleScore: number;
    modelScore: number;
    hybridScore: number;
    metrics: AnomalyFeatureMetrics;
}

interface GeminiResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
}

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
const MAX_SUMMARY_CHARS = 360;

export async function generateGeminiAnomalySummary(
    payload: GeminiAnomalySummaryInput
): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const timeoutMs = parsePositiveInt(process.env.GEMINI_TIMEOUT_MS, 3500);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const prompt = buildPrompt(payload);
        const response = await fetch(
            `${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 120,
                    },
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) return null;
        const data = (await response.json()) as GeminiResponse;
        const text = data.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || '')
            .join(' ')
            .trim();

        if (!text) return null;
        return text.length > MAX_SUMMARY_CHARS
            ? `${text.slice(0, MAX_SUMMARY_CHARS - 3)}...`
            : text;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function buildPrompt(payload: GeminiAnomalySummaryInput): string {
    const { incidentType, severity, ruleScore, modelScore, hybridScore, metrics, description } = payload;
    return [
        'You are assisting an emergency-response authority dashboard.',
        'Return a concise triage summary with one recommended first action.',
        'Keep it under 70 words. No markdown, no bullets.',
        '',
        `Incident type: ${incidentType}`,
        `Severity: ${severity}`,
        `Rule score: ${ruleScore.toFixed(3)}`,
        `Model score: ${modelScore.toFixed(3)}`,
        `Hybrid score: ${hybridScore.toFixed(3)}`,
        `Description: ${description}`,
        `Metrics: inactivity=${metrics.inactivityMinutes.toFixed(1)}m, speed=${metrics.speedKmh.toFixed(1)}km/h, outsideZone=${metrics.isOutsideZone}, nearbyIncidents=${metrics.nearbyIncidents15m}, nearbyCritical=${metrics.nearbyCriticalIncidents15m}, userAnomalies24h=${metrics.userAnomalies24h}`,
    ].join('\n');
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
}
