# ParkGuard Front-end

React (Vite) dashboard for parking violation review.

## Setup

```bash
cd front-end
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173` by default.

## Features

- Signup / login against `server` auth APIs
- Protected violations dashboard
- Filter, review, verify, or reject detections

## API

Set `VITE_API_URL` to your Node backend (default `http://localhost:3000`).
