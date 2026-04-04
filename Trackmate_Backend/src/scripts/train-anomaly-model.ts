import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/database';
import { trainAndPersistAnomalyModel } from '../lib/anomalyModel';

async function run() {
    try {
        await connectDatabase();

        const result = await trainAndPersistAnomalyModel({
            maxSamples: parseNumericArg('--maxSamples'),
            iterations: parseNumericArg('--iterations'),
            learningRate: parseNumericArg('--learningRate'),
        });

        console.log('✅ Anomaly model trained and persisted successfully');
        console.log(`   Model: ${result.modelVersion}`);
        console.log(`   Samples: ${result.sampleCount} (+: ${result.positiveCount}, -: ${result.negativeCount})`);
        console.log(`   Loss: ${result.loss.toFixed(4)}`);
        console.log(`   Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
        console.log(`   Iterations: ${result.iterations}`);
    } catch (err) {
        console.error('❌ Failed to train anomaly model:', err);
        process.exitCode = 1;
    } finally {
        await disconnectDatabase();
    }
}

function parseNumericArg(flag: string): number | undefined {
    const index = process.argv.findIndex((arg) => arg === flag);
    if (index === -1 || index === process.argv.length - 1) return undefined;

    const value = Number(process.argv[index + 1]);
    return Number.isFinite(value) ? value : undefined;
}

void run();
