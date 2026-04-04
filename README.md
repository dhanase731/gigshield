# GigShield (Frontend + Backend)

This project now includes:

- A React + Vite frontend
- A Node.js + Express backend API in `server/index.js`

## Scripts

- `npm run dev` – Run frontend only (Vite)
- `npm run dev:api` – Run backend API only (Express)
- `npm run dev:full` – Run frontend + backend together
- `npm run build` – Build frontend for production
- `npm run lint` – Run ESLint checks

## API Endpoints

- `GET /api/health` – Backend service health
- `GET /api/dashboard-summary` – Sample dashboard summary data
- `GET /api/orders` and `POST /api/orders` – MongoDB-backed delivery orders
- `GET /api/claims` and `POST /api/claims` – list + create claims
- `GET /api/claims/:claimId` – fetch single claim detail
- `PATCH /api/claims/:claimId` – update claim fields/status/step
- `POST /api/claims/:claimId/documents` – append claim documents
- `POST /api/claims/:claimId/notes` – append timeline notes
- `POST /api/claims/:claimId/decision` – approve/reject/request more info
- `POST /api/claims/:claimId/settlement` – record settlement and close

## Admin Console

- Route: `/admin`
- Shows live MongoDB summary, recent orders, and recent claims
- Lets you create or update order and claim documents directly from the UI

## Environment Variables

Configured in `.env`:

- `API_PORT` (default `5000`)
- `MONGODB_URI` (required: your MongoDB Atlas/local connection URI)
- `MONGODB_DB_NAME` (optional, default `gigshield`)
- Existing `VITE_*` variables for frontend services

## Connect Your MongoDB Account

1. In your MongoDB Atlas project, create or use a database user.
2. In **Network Access**, allow your machine IP (or `0.0.0.0/0` for testing only).
3. Copy your connection URI from Atlas.
4. Set in `.env`:

`MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority`

After this, running `npm run dev:full` will connect backend APIs to your MongoDB account.

## Local Development

Install dependencies once:

`npm install`

Run full stack:

`npm run dev:full`
