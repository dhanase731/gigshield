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
