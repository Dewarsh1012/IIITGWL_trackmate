import {
    normaliseAnomalyFeatures,
    combineRuleAndModelScore,
    trainLogisticRegression,
} from '../../lib/anomalyModel';

describe('anomalyModel', () => {
    it('normalises and clamps feature metrics', () => {
        const features = normaliseAnomalyFeatures({
            inactivityMinutes: 180,
            speedKmh: 210,
            isOutsideZone: true,
            nearbyIncidents15m: 10,
            nearbyCriticalIncidents15m: 7,
            userAnomalies24h: 9,
        });

        expect(features).toHaveLength(6);
        features.forEach((value) => {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
        });
        expect(features[2]).toBe(1);
    });

    it('combines rule and model scores with bounded output', () => {
        const blended = combineRuleAndModelScore(0.8, 0.4, 0.25);
        expect(blended).toBeCloseTo(0.7, 6);

        const clamped = combineRuleAndModelScore(2, -1, 3);
        expect(clamped).toBeGreaterThanOrEqual(0);
        expect(clamped).toBeLessThanOrEqual(1);
    });

    it('trains logistic regression on a separable sample set', () => {
        const samples = [
            { features: [0, 0, 0, 0, 0, 0], label: 0 as const },
            { features: [0.1, 0.05, 0, 0.1, 0, 0], label: 0 as const },
            { features: [0.85, 0.8, 1, 0.6, 0.5, 0.6], label: 1 as const },
            { features: [0.95, 0.9, 1, 0.7, 0.6, 0.8], label: 1 as const },
        ];

        const result = trainLogisticRegression(samples, {
            iterations: 800,
            learningRate: 0.2,
        });

        expect(result.weights).toHaveLength(6);
        expect(result.loss).toBeLessThan(0.5);
        expect(result.accuracy).toBeGreaterThanOrEqual(0.75);
    });
});
