# ParkGuard Front-end

React + Vite admin dashboard for the ParkGuard vehicle-detection system.

Operators sign up / log in, review no-parking violations created by the Python detector, inspect evidence images, correct plate numbers, verify or reject cases, filter/search at scale, and view day-wise statistics.

For full-stack setup (MongoDB, Node API, Python detector), see the root guide: [`../README.md`](../README.md).

---

## What this app does

| Feature | Description |
|---------|-------------|
| **Auth** | Signup + login against `POST /api/auth/*`; JWT stored in `localStorage` |
| **Protected dashboard** | Unauthenticated users are redirected to `/login` |
| **Live list** | Polls violations about every 5 seconds without full-page flicker |
| **Filters** | Camera, zone, status, vehicle type, plate number, date from/to |
| **Pagination** | Server-side pages (default 10 rows) for large datasets |
| **Stats cards** | Totals for pending / verified / rejected within current filters |
| **Trends chart** | Timespans: 1 day, 7 days, 1 month, 3 months, 6 months |
| **Evidence** | Shows plate / vehicle / full-frame images from the API `/evidence` route |
| **Plate edit** | Admin can correct OCR mistakes (`PATCH .../plate`) |
| **Verify / Reject** | Status updates with optional rejection reason |
| **Admin activity** | Timeline of verify / reject / plate-update actions per violation |

---

## Prerequisites

- **Node.js 20+** and **npm**
- Running **ParkGuard server** (default `http://localhost:3000`)
- MongoDB available to that server

---

## Setup commands

From the repository root:

```bash
cd front-end
npm install
cp .env.example .env
```

Edit `.env` if your API is not on localhost:3000:

```env
VITE_API_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.

### Other npm scripts

```bash
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # Run oxlint
```

---

## First-time admin flow

1. Ensure the API is up: `curl http://localhost:3000/health`
2. Open the front-end → **Create account** (`/signup`)
3. You are logged in and sent to `/`
4. Later sessions use **Sign in** (`/login`)

If JWT payload fields change (e.g. admin name on activity logs), log out and log in again.

---

## Routes

| Path | Access | Component |
|------|--------|-----------|
| `/login` | Public | `pages/Login.jsx` |
| `/signup` | Public | `pages/Signup.jsx` |
| `/` | Requires JWT | `pages/Dashboard.jsx` |
| `*` | — | Redirects to `/` (then protected) |

Protection is handled by `components/ProtectedRoute.jsx` + `context/AuthContext.jsx`.

---

## Project structure

```text
front-end/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── public/
└── src/
    ├── main.jsx                 # React root
    ├── App.jsx                  # Router + AuthProvider + CSS imports
    ├── api/
    │   ├── client.js            # Axios instance + Bearer token interceptor
    │   ├── authApi.js           # signup / login
    │   └── violationApi.js      # list, status, plate, stats, activities
    ├── context/
    │   └── AuthContext.jsx      # session state + login/signup/logout
    ├── pages/
    │   ├── Login.jsx
    │   ├── Signup.jsx
    │   └── Dashboard.jsx        # main ops screen
    ├── components/
    │   ├── Layout.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── StatCards.jsx
    │   ├── StatsChart.jsx
    │   ├── ViolationFilters.jsx
    │   ├── ViolationTable.jsx
    │   ├── ViolationDetail.jsx
    │   ├── Pagination.jsx
    │   ├── ActivityTimeline.jsx
    │   └── StatusBadge.jsx
    ├── utils/
    │   └── evidenceUrl.js       # path → http://api/evidence/file.jpg
    └── styles/
        ├── global.css
        ├── auth.css
        └── dashboard.css
```

---

## How API calls work

- Base URL: `import.meta.env.VITE_API_URL` (fallback `http://localhost:3000`)
- Authenticated requests attach:

```http
Authorization: Bearer <parkguard_token>
```

Key endpoints used by the UI:

| UI action | API |
|-----------|-----|
| Signup | `POST /api/auth/signup` |
| Login | `POST /api/auth/login` |
| List + filters + page | `GET /api/violations?...` |
| Chart | `GET /api/violations/stats/timeline?range=7d` |
| Verify / Reject | `PATCH /api/violations/:id/status` |
| Edit plate | `PATCH /api/violations/:id/plate` |
| Activity timeline | `GET /api/violations/:id/activities` |
| Evidence image | `GET /evidence/<filename>.jpg` (static) |

Evidence paths stored in Mongo look like `evidence/plate_....jpg`.  
`utils/evidenceUrl.js` turns them into browser URLs under `/evidence/`.

---

## Dashboard behavior notes

- **Filters** are applied on the **server** (needed for thousands of records).
- Text text fields are **debounced** so typing does not spam the API.
- After the first load, filter/page changes update data **in place** (no full-page loader blink).
- Chart timespan **1 day** uses hourly buckets; longer ranges use day-wise stacked bars (pending / verified / rejected).

---

## Local development checklist

```bash
# 1) API
cd ../server && npm run dev

# 2) UI
cd ../front-end && npm run dev

# 3) Optional: generate new violations
cd ../python && source venv/bin/activate && python main.py
```

Then:

1. Sign up at `http://localhost:5173/signup`
2. Confirm rows appear on the dashboard after the detector posts
3. Click a row → confirm images load
4. Edit plate / verify / reject → confirm **Admin activity** updates

---

## Troubleshooting (front-end)

| Issue | Fix |
|-------|-----|
| Login works but list fails with 401 | Token missing/expired — log in again; confirm API `JWT_SECRET` |
| CORS errors in browser console | Ensure server enables `cors()` and URL matches `VITE_API_URL` |
| Images broken | File must exist in `python/evidence`; API must serve `/evidence`; restart API |
| Empty chart | No violations in selected timespan, or API stats route error |
| Env changes ignored | Restart `npm run dev` after editing `.env` (Vite reads env at startup) |

---

## Production build

```bash
cd front-end
npm run build
npm run preview
```

Deploy the `dist/` folder behind any static host (Nginx, S3+CloudFront, etc.).  
Set `VITE_API_URL` to your public API origin **at build time**.

---

## Stack

- React 19
- Vite 8
- React Router 7
- Axios
- Recharts
