# TrackMate AI Aspects: What AI Is Doing, How It Works, and Where

This document explains all AI-related behavior in TrackMate from source-code perspective.
It focuses on practical intelligence pipelines currently implemented in backend services.

## 1. AI Scope in This Project

TrackMate uses AI/ML in four major areas:

1. Anomaly risk modeling for safety incidents.
2. Automated anomaly detection job that creates actionable incidents.
3. Predictive risk pulse forecasting for authority dashboards.
4. LLM-assisted text generation for triage summaries and voice-to-eFIR drafting.

Primary implementation root:
- `Trackmate_Backend/src/lib/anomalyModel.ts`
- `Trackmate_Backend/src/lib/anomalyDetection.ts`
- `Trackmate_Backend/src/lib/riskPulse.ts`
- `Trackmate_Backend/src/lib/geminiAnomalySummary.ts`
- `Trackmate_Backend/src/routes/efir.routes.ts`

## 2. AI Pipeline Overview

## 2.1 End-to-end anomaly pipeline

1. Input signals are collected from live location logs, recent incidents, and zone context.
2. Rule-based risk candidates are generated for specific anomaly types.
3. Features are normalized and scored by a logistic-regression model.
4. Rule score and model score are blended into a hybrid score.
5. Threshold gating decides whether to create an anomaly incident.
6. Optional Gemini summary adds a concise triage recommendation.
7. Incident is stored and broadcast to operations channels.

Where:
- Candidate generation and orchestration: `Trackmate_Backend/src/lib/anomalyDetection.ts`
- Model scoring and blend utility: `Trackmate_Backend/src/lib/anomalyModel.ts`
- Optional summary text: `Trackmate_Backend/src/lib/geminiAnomalySummary.ts`

## 2.2 AI runtime schedule

The anomaly engine runs periodically via server bootstrap:

- Started from: `Trackmate_Backend/src/server.ts` via `startAnomalyDetection()`
- Frequency: every 5 minutes (`ANOMALY_INTERVAL_MS` in `anomalyDetection.ts`)

## 3. Anomaly Model: What It Learns and How

## 3.1 Model type

TrackMate uses a lightweight logistic regression model for risk scoring.

Where:
- Training logic: `trainLogisticRegression(...)` in `Trackmate_Backend/src/lib/anomalyModel.ts`
- Runtime scoring: `scoreAnomalyRisk(...)` in `Trackmate_Backend/src/lib/anomalyModel.ts`

## 3.2 Feature set

Normalized feature vector order (`FEATURE_ORDER`):

1. `inactivity_minutes_norm`
2. `speed_kmh_norm`
3. `outside_zone_flag`
4. `nearby_incidents_norm`
5. `nearby_critical_incidents_norm`
6. `user_anomalies_24h_norm`

Where:
- Feature order and normalization: `Trackmate_Backend/src/lib/anomalyModel.ts`

## 3.3 Default fallback model

If no trained model exists, system uses heuristic fallback weights.

Where:
- `DEFAULT_MODEL` in `Trackmate_Backend/src/lib/anomalyModel.ts`

## 3.4 Model persistence and versioning

Trained model metadata includes:

1. `model_version`
2. `trained_at`
3. `weights`, `bias`
4. sample counts and training metrics (`loss`, `accuracy`)
5. source (`heuristic` or `trained`)

Persistence location:
- `data/anomaly-model.json` (resolved by `MODEL_FILE_PATH`)

Where:
- Load/save/cache: `Trackmate_Backend/src/lib/anomalyModel.ts`

## 3.5 Model training entry points

1. CLI training script:
- Command: `npm run train:anomaly`
- File: `Trackmate_Backend/src/scripts/train-anomaly-model.ts`

2. API endpoint for authority/admin:
- `POST /api/v1/analytics/anomaly-model/train`
- File: `Trackmate_Backend/src/routes/analytics.routes.ts`

## 4. Anomaly Detection Engine

## 4.1 Detection classes currently implemented

`ManagedAnomalyType` in code:

1. `inactivity`
2. `unusual_speed`
3. `zone_breach`
4. `incident_cluster`

Where:
- `Trackmate_Backend/src/lib/anomalyDetection.ts`

## 4.2 Candidate generation logic

Examples:

1. Tourist inactivity when location gap crosses threshold.
2. Unusual speed when movement estimate is very high.
3. Zone breach when outside monitored zones.
4. Incident cluster when local short-window concentration spikes.

Where:
- Rule candidate creation blocks in `Trackmate_Backend/src/lib/anomalyDetection.ts`

## 4.3 Hybrid score gating

Each candidate has:

1. rule score (`RULE_SCORES`)
2. minimum required threshold (`TYPE_MIN_SCORES`)
3. model score from logistic regression
4. weighted blend via `combineRuleAndModelScore`

Final decision:
- create incident only if blended score >= max(global threshold, type threshold)

Where:
- Constants and gating logic in `Trackmate_Backend/src/lib/anomalyDetection.ts`

## 4.4 Deduplication and noise control

Before creating a new anomaly incident, dedupe query checks if equivalent active signal already exists.

Where:
- `createScoredAnomalyIncident(...)` in `Trackmate_Backend/src/lib/anomalyDetection.ts`

## 4.5 Safety score feedback loop

After anomaly processing, tourist safety scores are adjusted based on active anomaly burden.

Where:
- Tail section of `runAnomalyChecks()` in `Trackmate_Backend/src/lib/anomalyDetection.ts`

## 5. SOS Intelligence and Misuse Shield

SOS handling uses AI-style risk scoring and misuse risk heuristics.

## 5.1 SOS risk scoring

1. Build feature metrics around reporter context.
2. Score with model + rules.
3. Derive `real_danger_probability` and `false_alarm_probability`.
4. Store probabilities in incident metadata and timeline.

Where:
- `buildSosRiskMetadata(...)` and usage in `Trackmate_Backend/src/routes/incident.routes.ts`

## 5.2 Misuse shield

Computes misuse risk from behavioral signals such as:

1. recent SOS frequency
2. false alarm history
3. recency windows
4. time-window heuristics

Outputs:
- `sos_misuse_risk_score`
- `sos_misuse_risk_band`
- `sos_misuse_flagged`

Where:
- `buildMisuseShieldMetadata(...)` and related logic in `Trackmate_Backend/src/routes/incident.routes.ts`

## 5.3 Auto-assignment support

For SOS incidents, responder selection and dispatch metadata are generated and attached for operations.

Where:
- responder planning and timeline/events in `Trackmate_Backend/src/routes/incident.routes.ts`

## 6. Predictive Risk Pulse Engine

Risk Pulse is a forecast-style scoring service for command dashboards.

## 6.1 What it computes

Snapshot fields include:

1. global risk score
2. forecast risk score
3. trend (`rising`/`stable`/`falling`)
4. confidence and signal strength
5. top hotspot zones with per-zone risk score

Where:
- `buildRiskPulseSnapshot(...)` in `Trackmate_Backend/src/lib/riskPulse.ts`

## 6.2 Inputs used

1. active zones and zone base risk weights
2. recent incidents (6h) vs previous period trend
3. incident severity weighting
4. open incident load

Where:
- Aggregation logic in `Trackmate_Backend/src/lib/riskPulse.ts`

## 6.3 Delivery

1. Pull API endpoint:
- `GET /api/v1/analytics/risk-pulse`
- `Trackmate_Backend/src/routes/analytics.routes.ts`

2. Push websocket broadcast:
- Event: `risk:pulse` to `authority_room`
- `Trackmate_Backend/src/lib/riskPulse.ts`

## 7. LLM Usage (Gemini)

TrackMate uses Gemini in two places, both optional and fail-safe.

## 7.1 Anomaly triage summarization

Purpose:
- Generate short, operationally useful human summary for detected anomaly incidents.

Behavior:
- If Gemini is unavailable or API key absent, system continues without summary.

Where:
- Invocation: `Trackmate_Backend/src/lib/anomalyDetection.ts`
- Client wrapper: `Trackmate_Backend/src/lib/geminiAnomalySummary.ts`

## 7.2 Voice transcript to eFIR draft

Purpose:
- Convert voice transcript text into structured eFIR draft JSON.

Behavior:
- Attempts Gemini draft first; falls back to heuristic parser if unavailable.

Where:
- `buildGeminiVoiceDraft(...)` and heuristic fallback in `Trackmate_Backend/src/routes/efir.routes.ts`

## 8. AI Configuration and Tunables

## 8.1 Model and anomaly tuning

1. `ANOMALY_MODEL_WEIGHT`
2. `ANOMALY_MIN_SCORE`
3. `RISK_PULSE_INTERVAL_MS`

Where consumed:
- `Trackmate_Backend/src/lib/anomalyDetection.ts`
- `Trackmate_Backend/src/lib/riskPulse.ts`

## 8.2 SOS intelligence tuning

1. `SOS_RULE_SCORE`
2. `SOS_MODEL_WEIGHT` (fallback to `ANOMALY_MODEL_WEIGHT`)
3. `SOS_GUARDIAN_RADIUS_METERS`
4. `SOS_GUARDIAN_MAX_RECIPIENTS`
5. `SOS_RESPONDER_MAX`
6. `SOS_RESPONDER_RADIUS_METERS`
7. `SOS_MISUSE_THRESHOLD`
8. `LOCATION_FRESHNESS_MINUTES`

Where:
- `Trackmate_Backend/src/routes/incident.routes.ts`

## 8.3 Gemini toggles

1. `GEMINI_API_KEY`
2. `GEMINI_MODEL` (default `gemini-1.5-flash`)
3. `GEMINI_TIMEOUT_MS`

Where:
- `Trackmate_Backend/src/lib/geminiAnomalySummary.ts`
- `Trackmate_Backend/src/routes/efir.routes.ts`

## 9. AI Observability and Control Endpoints

Authority/admin endpoints:

1. `GET /api/v1/analytics/anomaly-model`
- current model status and source (`heuristic`/`trained`)

2. `POST /api/v1/analytics/anomaly-model/train`
- trigger model training and persistence

3. `POST /api/v1/analytics/anomaly-model/score`
- score a feature vector against active model

4. `GET /api/v1/analytics/risk-pulse`
- get latest risk pulse snapshot

Where:
- `Trackmate_Backend/src/routes/analytics.routes.ts`

## 10. Data Inputs AI Relies On

1. `LocationLog` history for motion and inactivity features.
2. `Incident` history for clustering, severity trend, false alarm patterns.
3. `Zone` definitions for outside-zone and hotspot context.
4. `Profile` role and safety-score update targets.

Where models are:
- `Trackmate_Backend/src/models/LocationLog.ts`
- `Trackmate_Backend/src/models/Incident.ts`
- `Trackmate_Backend/src/models/Zone.ts`
- `Trackmate_Backend/src/models/Profile.ts`

## 11. AI Output Surfaces in Product

1. Auto-created AI anomaly incidents (`source: ai_anomaly`).
2. SOS metadata with real-danger vs false-alarm probabilities.
3. Misuse risk flags for operations triage.
4. Realtime `risk:pulse` stream in authority dashboards.
5. Concise AI-generated triage text attached to anomaly descriptions.
6. Voice transcript conversion into structured eFIR draft payload.

## 12. Practical Summary

TrackMate’s AI is not a single black-box model. It is a layered intelligence system:

1. Deterministic rules for safety-critical reliability.
2. Logistic-regression scoring for calibrated risk estimation.
3. Forecast-style risk aggregation for command decisions.
4. LLM augmentation for concise operator-friendly summaries and drafting.

This gives the project both operational robustness and explainable intelligence behavior.
