import Twilio from 'twilio';

export interface AuthoritySmsRecipient {
    user_id?: string;
    full_name?: string;
    phone: string;
}

export interface SosSmsPayload {
    incidentId: string;
    reporterName: string;
    reporterRole: string;
    reporterPhone?: string;
    latitude?: number;
    longitude?: number;
    triggeredAt?: Date;
}

export interface SosSmsRecipientResult {
    user_id?: string;
    full_name?: string;
    phone_masked: string;
    status: 'sent' | 'failed';
    sid?: string;
    error?: string;
}

export interface SosSmsDispatchSummary {
    enabled: boolean;
    provider: 'twilio';
    attempted_count: number;
    delivered_count: number;
    failed_count: number;
    directions_url?: string;
    triggered_at: string;
    skipped_reason?: string;
    recipients: SosSmsRecipientResult[];
}

let twilioClient: ReturnType<typeof Twilio> | null = null;

function getTwilioClient(): ReturnType<typeof Twilio> {
    if (twilioClient) return twilioClient;

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

    if (!accountSid || !authToken) {
        throw new Error('TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing');
    }

    twilioClient = Twilio(accountSid, authToken);
    return twilioClient;
}

function toFiniteOrUndefined(value: unknown): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

function normalizePhone(raw: string | undefined): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const keepPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return null;

    if (keepPlus) {
        if (digits.length < 8 || digits.length > 15) return null;
        return `+${digits}`;
    }

    if (digits.length === 10) {
        return `+91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
        return `+${digits}`;
    }

    if (digits.length >= 8 && digits.length <= 15) {
        return `+${digits}`;
    }

    return null;
}

function maskPhone(phone: string): string {
    const last4 = phone.replace(/\D/g, '').slice(-4);
    return last4 ? `***${last4}` : '***';
}

function buildDirectionsUrl(latitude: number, longitude: number): string {
    const destination = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function buildSosMessage(payload: SosSmsPayload, latitude: number, longitude: number, directionsUrl: string): string {
    const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    const triggerTime = (payload.triggeredAt || new Date()).toISOString();
    const incidentRef = payload.incidentId.slice(-6).toUpperCase();

    const lines = [
        `TRACKMATE SOS ALERT #${incidentRef}`,
        `Name: ${payload.reporterName}`,
        `Role: ${payload.reporterRole}`,
        `Coordinates: ${coordinates}`,
        `Directions: ${directionsUrl}`,
        `Time: ${triggerTime}`,
    ];

    if (payload.reporterPhone) {
        lines.push(`Caller: ${payload.reporterPhone}`);
    }

    return lines.join('\n');
}

function parseFallbackRecipients(): AuthoritySmsRecipient[] {
    const configured = [
        process.env.SOS_AUTHORITY_PHONE_NUMBERS || '',
        process.env.SOS_AUTHORITY_FALLBACK_PHONE || '',
    ]
        .join(',')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    return configured.map((phone, index) => ({
        phone,
        full_name: `Authority Fallback ${index + 1}`,
    }));
}

export async function sendSosSmsNotifications(
    payload: SosSmsPayload,
    authorityRecipients: AuthoritySmsRecipient[]
): Promise<SosSmsDispatchSummary> {
    const enabled = process.env.SOS_SMS_ENABLED !== 'false';
    const latitude = toFiniteOrUndefined(payload.latitude);
    const longitude = toFiniteOrUndefined(payload.longitude);

    if (!enabled) {
        return {
            enabled: false,
            provider: 'twilio',
            attempted_count: 0,
            delivered_count: 0,
            failed_count: 0,
            skipped_reason: 'sos_sms_disabled',
            triggered_at: (payload.triggeredAt || new Date()).toISOString(),
            recipients: [],
        };
    }

    if (latitude == null || longitude == null) {
        return {
            enabled: true,
            provider: 'twilio',
            attempted_count: 0,
            delivered_count: 0,
            failed_count: 0,
            skipped_reason: 'missing_coordinates',
            triggered_at: (payload.triggeredAt || new Date()).toISOString(),
            recipients: [],
        };
    }

    const fromPhone = (process.env.TWILIO_FROM_PHONE || process.env.TWILIO_PHONE_NUMBER || '').trim();
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

    if (!fromPhone && !messagingServiceSid) {
        return {
            enabled: true,
            provider: 'twilio',
            attempted_count: 0,
            delivered_count: 0,
            failed_count: 0,
            skipped_reason: 'missing_twilio_sender',
            triggered_at: (payload.triggeredAt || new Date()).toISOString(),
            recipients: [],
        };
    }

    const mergedRecipients = [...authorityRecipients, ...parseFallbackRecipients()];
    const deduped = new Map<string, AuthoritySmsRecipient>();

    for (const recipient of mergedRecipients) {
        const normalizedPhone = normalizePhone(recipient.phone);
        if (!normalizedPhone) continue;
        if (!deduped.has(normalizedPhone)) {
            deduped.set(normalizedPhone, { ...recipient, phone: normalizedPhone });
        }
    }

    const recipients = Array.from(deduped.values());
    if (recipients.length === 0) {
        return {
            enabled: true,
            provider: 'twilio',
            attempted_count: 0,
            delivered_count: 0,
            failed_count: 0,
            skipped_reason: 'no_authority_phone_numbers',
            triggered_at: (payload.triggeredAt || new Date()).toISOString(),
            recipients: [],
        };
    }

    const directionsUrl = buildDirectionsUrl(latitude, longitude);
    const messageBody = buildSosMessage(payload, latitude, longitude, directionsUrl);

    const client = getTwilioClient();
    const results: SosSmsRecipientResult[] = [];

    for (const recipient of recipients) {
        try {
            const message = await client.messages.create({
                to: recipient.phone,
                body: messageBody,
                ...(messagingServiceSid
                    ? { messagingServiceSid }
                    : { from: fromPhone! }),
            });

            results.push({
                user_id: recipient.user_id,
                full_name: recipient.full_name,
                phone_masked: maskPhone(recipient.phone),
                status: 'sent',
                sid: message.sid,
            });
        } catch (error: any) {
            results.push({
                user_id: recipient.user_id,
                full_name: recipient.full_name,
                phone_masked: maskPhone(recipient.phone),
                status: 'failed',
                error: String(error?.message || 'SMS dispatch failed').slice(0, 220),
            });
        }
    }

    const deliveredCount = results.filter((entry) => entry.status === 'sent').length;

    return {
        enabled: true,
        provider: 'twilio',
        attempted_count: results.length,
        delivered_count: deliveredCount,
        failed_count: results.length - deliveredCount,
        directions_url: directionsUrl,
        triggered_at: (payload.triggeredAt || new Date()).toISOString(),
        recipients: results,
    };
}