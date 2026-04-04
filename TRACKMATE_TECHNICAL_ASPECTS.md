# TrackMate Technical Aspects: What, How, and Where

This document is a code-first technical map of the TrackMate project.
It explains what technology is used, how it is used, and where it is implemented.

## 1. Repository Module Map

| Module | Purpose | Primary Entry Points |
|---|---|---|
| `Tackmate_Frontend` | Web application (role-based UI, maps, alerts, dashboards) | `Tackmate_Frontend/src/main.tsx`, `Tackmate_Frontend/src/App.tsx` |
| `Trackmate_Backend` | REST API, realtime socket engine, anomaly detection, eFIR workflow | `Trackmate_Backend/src/server.ts`, `Trackmate_Backend/src/app.ts` |
| `Trackmate_Contracts` | Smart contracts for eFIR ledger and identity registry | `Trackmate_Contracts/contracts/EFIRLedger.sol`, `Trackmate_Contracts/contracts/IdentityRegistry.sol` |
| `Trackmate_app` | Flutter mobile client (auth, role screens, live tracking) | `Trackmate_app/lib/main.dart`, `Trackmate_app/lib/core/router.dart` |
| Root workspace | Monorepo-level developer scripts | `package.json` |

## 2. Technology Matrix (What + How + Where)

### 2.1 Frontend (React Web)

| Technology | How It Is Used | Where |
|---|---|---|
| React 19 + TypeScript | Component-based role dashboards and forms | `Tackmate_Frontend/src/**/*.tsx` |
| Vite | Dev server, build pipeline, API/socket proxy | `Tackmate_Frontend/vite.config.ts` |
| React Router | Role-based route trees for tourist/resident/business/authority | `Tackmate_Frontend/src/App.tsx` |
| Axios | API client with auth interceptor + 401 redirect handling | `Tackmate_Frontend/src/lib/api.ts` |
| Socket.IO Client | Realtime connection and room joining by role/user/ward | `Tackmate_Frontend/src/context/SocketContext.tsx` |
| Leaflet + react-leaflet + leaflet-draw | Live maps, incident markers, zone overlays, authority zone drawing | `Tackmate_Frontend/src/components/maps/AuthorityMap.tsx`, `Tackmate_Frontend/src/components/maps/TouristMap.tsx` |
| React Hook Form + Zod | Auth and schema-driven form validation | `Tackmate_Frontend/package.json`, `Tackmate_Frontend/src/pages/auth/schemas.ts` |
| Recharts | Dashboard analytics visualizations | `Tackmate_Frontend/src/pages/authority/Analytics.tsx` |
| i18n custom provider | Multi-language labels and RTL support | `Tackmate_Frontend/src/i18n/index.tsx`, `Tackmate_Frontend/src/i18n/locales/*.ts` |
| Clay design system tokens | Centralized UI tokens + shared card styles | `Tackmate_Frontend/src/theme/clayTheme.ts` |

### 2.2 Backend (Node/Express)

| Technology | How It Is Used | Where |
|---|---|---|
| Node.js + Express 5 + TypeScript | Versioned REST API and middleware pipeline | `Trackmate_Backend/src/app.ts`, `Trackmate_Backend/src/server.ts` |
| Mongoose (MongoDB) | Schema models for profiles, incidents, zones, eFIR, location logs | `Trackmate_Backend/src/models/*.ts`, `Trackmate_Backend/src/config/database.ts` |
| Socket.IO Server | Realtime rooms/events for authority and users | `Trackmate_Backend/src/socket/index.ts` |
| Zod | Request validation in auth, incidents, eFIR and other routes | `Trackmate_Backend/src/routes/*.ts` |
| JWT | Authentication and role-gated access control | `Trackmate_Backend/src/routes/auth.routes.ts`, `Trackmate_Backend/src/middleware/auth.ts` |
| bcryptjs | Password hashing and password compare on profile model | `Trackmate_Backend/src/models/Profile.ts` |
| Multer | Evidence/file upload handling and storage hardening | `Trackmate_Backend/src/middleware/upload.ts` |
| Ethers v6 | On-chain eFIR anchoring and status updates | `Trackmate_Backend/src/lib/efirLedger.ts` |
| Node crypto | Blockchain ID generation and SHA-256 integrity hashes | `Trackmate_Backend/src/lib/blockchain.ts`, `Trackmate_Backend/src/lib/efirIntegrity.ts` |
| Gemini API (optional) | AI triage summaries for anomaly and voice-draft eFIR flows | `Trackmate_Backend/src/lib/geminiAnomalySummary.ts`, `Trackmate_Backend/src/routes/efir.routes.ts` |

### 2.3 Smart Contracts

| Technology | How It Is Used | Where |
|---|---|---|
| Solidity 0.8.20 | On-chain evidence hash and identity state | `Trackmate_Contracts/contracts/*.sol` |
| Hardhat 3 + toolbox | Local chain/dev workflow and contract tooling | `Trackmate_Contracts/hardhat.config.ts`, `Trackmate_Contracts/package.json` |
| OpenZeppelin Ownable | Owner-gated write methods for authority actions | `Trackmate_Contracts/contracts/EFIRLedger.sol`, `Trackmate_Contracts/contracts/IdentityRegistry.sol` |

### 2.4 Mobile (Flutter)

| Technology | How It Is Used | Where |
|---|---|---|
| Flutter + Material | Cross-platform mobile UI | `Trackmate_app/lib/main.dart` |
| flutter_riverpod | Auth/location state management | `Trackmate_app/lib/features/auth/providers/auth_provider.dart`, `Trackmate_app/lib/core/services/location_service.dart` |
| go_router | Route definitions per role pages | `Trackmate_app/lib/core/router.dart` |
| http | REST API calls with token support | `Trackmate_app/lib/core/network/api_client.dart` |
| socket_io_client | Realtime socket connection and room joins | `Trackmate_app/lib/core/network/socket_service.dart` |
| geolocator | GPS tracking stream and location permission flow | `Trackmate_app/lib/core/services/location_service.dart` |
| crypto | Blockchain-style ID utility in Dart | `Trackmate_app/lib/core/utils/blockchain.dart` |
| Clay widget system | Shared clay cards/buttons/inputs in Flutter | `Trackmate_app/lib/core/widgets/clay_widgets.dart` |

## 3. Frontend Architecture Details

### 3.1 App composition and providers
- App bootstrap: `Tackmate_Frontend/src/main.tsx`
- Provider order: Language -> Router -> Auth -> Socket in `Tackmate_Frontend/src/App.tsx`
- Route protection: `Tackmate_Frontend/src/components/AuthGuard.tsx`

### 3.2 Role route structure
- Tourist routes: `Tackmate_Frontend/src/App.tsx` with pages in `Tackmate_Frontend/src/pages/tourist/*`
- Resident routes: `Tackmate_Frontend/src/App.tsx` with pages in `Tackmate_Frontend/src/pages/resident/*`
- Business routes: `Tackmate_Frontend/src/App.tsx` with pages in `Tackmate_Frontend/src/pages/business/*`
- Authority routes: `Tackmate_Frontend/src/App.tsx` with pages in `Tackmate_Frontend/src/pages/authority/*`

### 3.3 API and auth flow
- Axios instance with `Authorization: Bearer <token>` injection: `Tackmate_Frontend/src/lib/api.ts`
- 401 auto cleanup and redirect to auth page: `Tackmate_Frontend/src/lib/api.ts`
- Login/register/session bootstrap: `Tackmate_Frontend/src/context/AuthContext.tsx`

### 3.4 Realtime and location tracking
- Role room join on socket connect: `Tackmate_Frontend/src/context/SocketContext.tsx`
- Browser geolocation watch + periodic `location_update` emits: `Tackmate_Frontend/src/hooks/useLocationTracking.ts`
- Zone alert event listener (`zone_alert`): `Tackmate_Frontend/src/hooks/useLocationTracking.ts`

### 3.5 Offline SOS queue behavior
- Local queue storage in `localStorage`: `Tackmate_Frontend/src/lib/offlineSos.ts`
- Retry/flush logic posting to `/incidents`: `Tackmate_Frontend/src/lib/offlineSos.ts`

### 3.6 Mapping and geospatial rendering
- Authority map: live users, incidents, zone draw/delete: `Tackmate_Frontend/src/components/maps/AuthorityMap.tsx`
- Tourist map: personal marker, zone highlighting, popup risk metadata: `Tackmate_Frontend/src/components/maps/TouristMap.tsx`

### 3.7 Localization and UI system
- Language store and RTL/LTR direction updates: `Tackmate_Frontend/src/i18n/index.tsx`
- Clay tokens and reusable styles: `Tackmate_Frontend/src/theme/clayTheme.ts`

## 4. Backend Architecture Details

### 4.1 Server lifecycle
- Boot sequence: DB connect -> HTTP server -> Socket init -> anomaly engine -> risk pulse broadcast in `Trackmate_Backend/src/server.ts`
- Graceful shutdown with DB disconnect in `Trackmate_Backend/src/server.ts`

### 4.2 HTTP middleware pipeline
- Security headers: `helmet` in `Trackmate_Backend/src/app.ts`
- CORS with explicit origin allow-list: `Trackmate_Backend/src/app.ts`
- Input sanitization (`$` and dot key stripping, script tag stripping): `Trackmate_Backend/src/middleware/sanitize.ts`
- API and auth rate limiting: `Trackmate_Backend/src/middleware/rateLimiter.ts`
- Global JSON error shape: `Trackmate_Backend/src/middleware/errorHandler.ts`

### 4.3 API module map (base `/api/v1`)
- `/auth` -> `Trackmate_Backend/src/routes/auth.routes.ts`
- `/profiles` -> `Trackmate_Backend/src/routes/profile.routes.ts`
- `/zones` -> `Trackmate_Backend/src/routes/zone.routes.ts`
- `/wards` -> `Trackmate_Backend/src/routes/ward.routes.ts`
- `/incidents` -> `Trackmate_Backend/src/routes/incident.routes.ts`
- `/locations` -> `Trackmate_Backend/src/routes/location.routes.ts`
- `/trips` -> `Trackmate_Backend/src/routes/trip.routes.ts`
- `/businesses` -> `Trackmate_Backend/src/routes/business.routes.ts`
- `/efirs` -> `Trackmate_Backend/src/routes/efir.routes.ts`
- `/emergency-contacts` -> `Trackmate_Backend/src/routes/emergency.routes.ts`
- `/analytics` -> `Trackmate_Backend/src/routes/analytics.routes.ts`
- `/verify` -> `Trackmate_Backend/src/routes/verify.routes.ts`
- `/alerts` -> `Trackmate_Backend/src/routes/alert.routes.ts`
- `/reports` -> `Trackmate_Backend/src/routes/report.routes.ts`
- `/uploads` -> `Trackmate_Backend/src/routes/upload.routes.ts`

### 4.4 Domain models and persistence
- Profile, password hashing, safety score, blockchain ID: `Trackmate_Backend/src/models/Profile.ts`
- Incident taxonomy and crisis metadata: `Trackmate_Backend/src/models/Incident.ts`
- Location logs with user/time indexes: `Trackmate_Backend/src/models/LocationLog.ts`
- Geo zones and risk-level metadata: `Trackmate_Backend/src/models/Zone.ts`
- eFIR records + evidence hashes + ledger state fields: `Trackmate_Backend/src/models/EFIR.ts`
- Alerts and targeting metadata: `Trackmate_Backend/src/models/Alert.ts`

### 4.5 Realtime socket engine
Implemented in `Trackmate_Backend/src/socket/index.ts`:
- Room joins: `join:authority`, `join:tourist`, `join:resident`, `join:business`, `join:user`, `join:ward`, `join:zone`, `join:incident`
- Location ingest event: `location_update`
- Backend emits: `zone_alert`, `zone_breach`, `red_zone_proximity`, `location:update`, `crisis:timeline`, `user_offline`
- Offline detection by heartbeat timeout and periodic sweep

### 4.6 Geofencing and movement logic
- Haversine distance, polygon tests, point-in-zone, speed calculation: `Trackmate_Backend/src/lib/geofence.ts`
- Zone entry and risk score adjustments happen in socket location handler: `Trackmate_Backend/src/socket/index.ts`

### 4.7 AI and predictive analytics
- Anomaly detector scheduler and candidate scoring: `Trackmate_Backend/src/lib/anomalyDetection.ts`
- Hybrid score merge (rules + model), dedupe checks, AI-generated triage summary: `Trackmate_Backend/src/lib/anomalyDetection.ts`
- Gemini short summary adapter: `Trackmate_Backend/src/lib/geminiAnomalySummary.ts`
- Risk pulse snapshot and authority broadcast (`risk:pulse`): `Trackmate_Backend/src/lib/riskPulse.ts`
- Trainable model script: `Trackmate_Backend/src/scripts/train-anomaly-model.ts`

### 4.8 SOS pipeline and misuse shield
- SOS thresholds, responder selection, misuse scoring, timeline append: `Trackmate_Backend/src/routes/incident.routes.ts`
- SOS tuning constants from env in same file: `Trackmate_Backend/src/routes/incident.routes.ts`

### 4.9 eFIR integrity and blockchain anchoring
- Integrity payload canonicalization and evidence hash verification: `Trackmate_Backend/src/lib/efirIntegrity.ts`
- Deterministic hash + blockchain ID generation: `Trackmate_Backend/src/lib/blockchain.ts`
- On-chain anchor/read/status update via Ethers: `Trackmate_Backend/src/lib/efirLedger.ts`
- Endpoints for create/update/evidence upload/voice draft: `Trackmate_Backend/src/routes/efir.routes.ts`

## 5. Smart Contract Layer

### 5.1 EFIRLedger contract
- File FIR (`fileFIR`) and immutable hash persistence
- Update FIR status (`updateFIRStatus`) with event trail
- Public read (`getEFIRData`) for hash verification
- File: `Trackmate_Contracts/contracts/EFIRLedger.sol`

### 5.2 IdentityRegistry contract
- Register, verify, suspend identity records
- Public validity check (`isIdentityValid`)
- File: `Trackmate_Contracts/contracts/IdentityRegistry.sol`

### 5.3 Backend integration path
- Contract calls and config checks: `Trackmate_Backend/src/lib/efirLedger.ts`
- eFIR route uses ledger helper and persists anchor metadata in Mongo model: `Trackmate_Backend/src/routes/efir.routes.ts`, `Trackmate_Backend/src/models/EFIR.ts`

## 6. Flutter Mobile Architecture

### 6.1 App shell and routing
- App bootstrap + theme wiring: `Trackmate_app/lib/main.dart`
- Route table by role/feature: `Trackmate_app/lib/core/router.dart`

### 6.2 Auth and session lifecycle
- Session check (`/auth/me`), login, register, logout logic: `Trackmate_app/lib/features/auth/providers/auth_provider.dart`
- Token and profile persistence (`shared_preferences`): `Trackmate_app/lib/core/network/api_client.dart`

### 6.3 Network and socket strategy
- API fallback strategy for Android emulator/device/LAN: `Trackmate_app/lib/core/network/api_client.dart`
- Socket connect and room join by role/user/ward: `Trackmate_app/lib/core/network/socket_service.dart`

### 6.4 Location stream and sync
- Geolocator stream with permission handling: `Trackmate_app/lib/core/services/location_service.dart`
- Socket emits `location_update` and periodic REST sync to `/locations`: `Trackmate_app/lib/core/services/location_service.dart`

### 6.5 Mobile UI and utility layer
- Clay components for card/input/button semantics: `Trackmate_app/lib/core/widgets/clay_widgets.dart`
- Dart-side blockchain ID utility compatibility: `Trackmate_app/lib/core/utils/blockchain.dart`

## 7. Configuration Reference

### 7.1 Frontend env keys
- `VITE_API_URL`
- Used in: `Tackmate_Frontend/src/lib/api.ts`, `Tackmate_Frontend/src/context/SocketContext.tsx`

### 7.2 Backend env keys
Core:
- `PORT`, `NODE_ENV`, `MONGODB_URI`, `FRONTEND_URL`

Auth and identity:
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `BLOCKCHAIN_SALT`, `AUTHORITY_CODE`

AI and risk:
- `RISK_PULSE_INTERVAL_MS`, `ANOMALY_MODEL_WEIGHT`, `ANOMALY_MIN_SCORE`
- `SOS_RULE_SCORE`, `SOS_MODEL_WEIGHT`, `SOS_GUARDIAN_RADIUS_METERS`, `SOS_GUARDIAN_MAX_RECIPIENTS`, `SOS_RESPONDER_MAX`, `SOS_RESPONDER_RADIUS_METERS`, `SOS_MISUSE_THRESHOLD`, `LOCATION_FRESHNESS_MINUTES`
- `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`

Ledger:
- `EFIR_LEDGER_RPC_URL`, `EFIR_LEDGER_CONTRACT_ADDRESS`, `EFIR_LEDGER_OWNER_PRIVATE_KEY`

### 7.3 Flutter dart-define keys
- `API_PORT`
- `API_BASE_URL`
- `SOCKET_BASE_URL`
- `API_LAN_HOST`
- `ANDROID_USE_LOCALHOST`
- Used in: `Trackmate_app/lib/core/network/api_client.dart`

## 8. Testing and Verification Stack

### 8.1 Frontend
- Unit/component tests with Vitest + Testing Library: `Tackmate_Frontend/vitest.config.ts`
- E2E tests with Playwright: `Tackmate_Frontend/playwright.config.ts`

### 8.2 Backend
- Jest + ts-jest with setup and coverage rules: `Trackmate_Backend/jest.config.js`
- Integration and unit test suites under: `Trackmate_Backend/src/__tests__/`

## 9. Runtime and Build Commands

Root workspace:
- `npm run dev` (runs frontend + backend concurrently)
- `npm run install:all`

Frontend:
- `npm run dev`
- `npm run build`
- `npm run test`, `npm run test:e2e`

Backend:
- `npm run dev`
- `npm run build`
- `npm run seed`
- `npm run train:anomaly`

Contracts:
- Hardhat commands from `Trackmate_Contracts`

Flutter:
- `flutter run`
- Optional network overrides via `--dart-define` values listed in section 7.3

## 10. Important Notes

1. This document is based on current source code, not marketing text.
2. Source of truth for active implementation is the files listed in this document.
3. If architecture changes, update this document together with code changes.
