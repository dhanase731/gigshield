# GigShield Claim Management Architecture

## Why this design

This module is designed for fast claim filing by gig riders and transparent claim handling by operations teams.

It follows a modern insurance lifecycle inspired by industry products and UX guidance:

- Guidewire ClaimCenter lifecycle capabilities
- Duck Creek claims workflow and assignment patterns
- Allstate self-service file/track/payment/fraud support patterns
- Nielsen Norman Group heuristics (visibility of status, error prevention, recovery)

## Recommended lifecycle

1. **FNOL (First Notice of Loss)**
   - Guided intake form, minimal required fields first
   - Dynamic follow-up questions based on incident type
2. **Triage**
   - Severity scoring (weather risk, amount, rider safety impact)
   - Fraud and duplicate checks
3. **Assignment**
   - Rule-based assignment by workload, skill, and claim complexity
4. **Investigation**
   - Evidence requests, timeline notes, policy/coverage verification
5. **Decision**
   - Approve / Reject / More Info Needed with reason templates
6. **Settlement**
   - Payout mode selection, reserve tracking, audit trail
7. **Closure**
   - Mandatory completion checklist + immutable event history

## UI/UX principles used

- **Always show status clearly** (stage tracker + claim chips)
- **Recognition over recall** (visible checklists and timeline)
- **Error prevention** (structured input fields and guided flow)
- **User control** (draft saving and recoverable process)
- **Plain language** (incident-focused labels, no insurance jargon overload)

## Frontend implementation in this repo

- `src/pages/ClaimManagement.jsx`
  - Claim list panel
  - Claim detail panel with lifecycle tracker
  - Evidence checklist and timeline
  - FNOL-style new claim form
- `src/pages/Dashboard.jsx`
  - Added `Claims` section in sidebar and quick actions
- `src/styles/dashboard.css`
  - Claims-specific UI styles with responsive behavior

## Suggested backend API contract (next step)

- `GET /api/claims?uid=...` -> list claims
- `GET /api/claims/:claimId` -> claim detail
- `POST /api/claims` -> file claim
- `PATCH /api/claims/:claimId` -> update claim data/status
- `POST /api/claims/:claimId/documents` -> upload document metadata
- `POST /api/claims/:claimId/notes` -> timeline note entry
- `POST /api/claims/:claimId/decision` -> approve/reject/request-info
- `POST /api/claims/:claimId/settlement` -> payout initiation

## Data model suggestions

- `claims`
  - `claimId`, `uid`, `incidentType`, `incidentDate`, `location`, `amount`, `status`, `priority`, `currentStep`, `createdAt`
- `claim_documents`
  - `claimId`, `name`, `url`, `uploadedBy`, `uploadedAt`, `isVerified`
- `claim_events`
  - `claimId`, `eventType`, `message`, `actor`, `createdAt`
- `claim_assignments`
  - `claimId`, `adjusterId`, `assignedAt`, `assignmentRule`

## Reference links

- https://www.guidewire.com/products/core-products/insurancesuite/claimcenter-claims-management-software
- https://www.duckcreek.com/product/claims-management-software/
- https://www.allstate.com/claims/file-track
- https://www.allstate.com/claims/file-track/claim-payments
- https://www.allstate.com/claims/fight-fraud
- https://www.nngroup.com/articles/ten-usability-heuristics/
- https://www.nngroup.com/articles/visibility-system-status/
- https://www.nngroup.com/articles/error-message-guidelines/
