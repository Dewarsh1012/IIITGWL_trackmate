import api from './api';

const OFFLINE_SOS_QUEUE_KEY = 'trackmate.offlineSosQueue.v1';
const MAX_QUEUE_ITEMS = 24;

export interface OfflineSosQueueItem {
    id: string;
    payload: Record<string, any>;
    role: string;
    createdAt: string;
}

export function enqueueOfflineSos(payload: Record<string, any>, role: string): OfflineSosQueueItem {
    const queue = readQueue();
    const item: OfflineSosQueueItem = {
        id: `sos_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        payload,
        role,
        createdAt: new Date().toISOString(),
    };

    const nextQueue = [item, ...queue].slice(0, MAX_QUEUE_ITEMS);
    writeQueue(nextQueue);
    return item;
}

export function getOfflineSosQueueCount(): number {
    return readQueue().length;
}

export async function flushOfflineSosQueue(): Promise<{ sent: number; failed: number; queued: number }> {
    const queue = readQueue();
    if (queue.length === 0) return { sent: 0, failed: 0, queued: 0 };

    const remaining: OfflineSosQueueItem[] = [];
    let sent = 0;
    let failed = 0;

    for (const item of queue.reverse()) {
        try {
            await api.post('/incidents', item.payload);
            sent += 1;
        } catch {
            failed += 1;
            remaining.push(item);
        }
    }

    writeQueue(remaining.reverse());
    return {
        sent,
        failed,
        queued: remaining.length,
    };
}

function readQueue(): OfflineSosQueueItem[] {
    try {
        const raw = localStorage.getItem(OFFLINE_SOS_QUEUE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((item) => item && typeof item === 'object' && item.payload);
    } catch {
        return [];
    }
}

function writeQueue(queue: OfflineSosQueueItem[]): void {
    localStorage.setItem(OFFLINE_SOS_QUEUE_KEY, JSON.stringify(queue));
}
