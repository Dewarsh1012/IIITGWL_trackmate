# eFIR Blockchain Integrity Setup

This backend now supports two integrity layers for eFIR records:

1. Local integrity: deterministic payload hash + evidence hash manifest.
2. Optional on-chain integrity: EFIR hash anchoring to `EFIRLedger`.

## Required for local integrity

No extra env vars are required beyond your existing backend setup.

## Optional on-chain anchoring env vars

Set these in backend runtime environment when you want live on-chain anchoring:

- `EFIR_LEDGER_RPC_URL`: JSON-RPC endpoint for the chain where `EFIRLedger` is deployed.
- `EFIR_LEDGER_CONTRACT_ADDRESS`: deployed `EFIRLedger` contract address.
- `EFIR_LEDGER_OWNER_PRIVATE_KEY`: private key of the contract owner account (required for write operations).

Read-only verification mode works with only:

- `EFIR_LEDGER_RPC_URL`
- `EFIR_LEDGER_CONTRACT_ADDRESS`

## Behavior summary

- Draft eFIR allows evidence mutation and file uploads.
- On submit, backend computes deterministic eFIR payload hash and attempts on-chain `fileFIR`.
- If ledger is not configured, eFIR still submits with local integrity data.
- `POST /efirs/:id/verify-hash` returns:
  - local payload hash verification
  - evidence-level verification details
  - manifest hash
  - on-chain hash check status (when read config is available)
