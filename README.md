# FuelEU Maritime Compliance Platform

This is a full-stack implementation of a **FuelEU Maritime compliance module** with routes management, compliance balance (CB) calculation, banking, and pooling features.

## 🏗️ Architecture

This project follows **Hexagonal (Ports & Adapters / Clean Architecture)** principles:

- **Core Domain**: Business logic isolated from frameworks (domain entities, use-cases, ports)
- **Adapters**: UI (React) and Infrastructure (API clients, database) adapters implement ports
- **Tech Stack**:
  - **Frontend**: Next.js 16 + TypeScript + TailwindCSS 4 + shadcn/ui (new-york) + Recharts + next-themes
  - **Backend**: Node.js 20+ + Express + TypeScript + Drizzle ORM
  - **Database**: Neon Postgres (with in-memory fallback for development)
  - **Fonts**: Geist Sans + Geist Mono (via geist package)
  - **Theme**: Dark/Light/System mode support with next-themes

```
project-root/
├── backend/           # Express API server
│   ├── src/
│   │   ├── core/      # Domain logic (computeCB, formulas)
│   │   ├── routes/    # HTTP endpoints
│   │   ├── data/      # Seed data
│   │   └── index.ts   # Server entry
│   ├── package.json
│   └── .env.example
│
├── frontend/          # Next.js app
│   ├── app/           # Pages and components
│   ├── package.json
│   └── .env.local.example
│
└── docs/              # AI agent workflow & reflection
```

---

## 🎨 Theme System

The frontend uses a comprehensive shadcn/ui theme system with:

- **Dark Mode**: Toggle between light, dark, and system themes via ThemeToggle button in dashboard
- **Fonts**: Geist Sans (body text) and Geist Mono (code/monospace) with system fallbacks
- **UI Components**: All components use shadcn/ui primitives (Button, Input, Card, Table, Badge, Tabs, Select)
- **Styling**: new-york style with rounded corners (--radius: 0.625rem)
- **Cursor Pointers**: Interactive elements have explicit cursor-pointer classes
- **Colors**: oklch-based color palette with consistent light/dark mode tokens

### Theme Toggle
Located in the dashboard header, allows switching between:
- 🌞 Light mode
- 🌙 Dark mode
- 🖥️ System mode (auto-detect)

---

## 🗄️ Database Integration

The backend supports **dual storage modes** for maximum flexibility:

### In-Memory Mode (Development)
- **Default**: Runs without database setup
- **Use Case**: Quick prototyping, testing, CI/CD
- **Setup**: No DATABASE_URL needed, uses hardcoded seed data

### Database Mode (Production)
- **Database**: Neon Postgres (serverless)
- **ORM**: Drizzle with type-safe queries
- **Setup**: Set DATABASE_URL in .env
- **Migrations**: `npm run db:push` to sync schema
- **Seeding**: `npm run db:seed` to populate initial data
- **Studio**: `npm run db:studio` for visual database browser

See **backend/DATABASE_SETUP.md** for detailed setup instructions.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or pnpm
- (Optional) Neon Postgres account for production DB

### Backend Setup

1. Navigate to backend folder:
```cmd
cd backend
```

2. Install dependencies:
```cmd
npm install
```
*(or `pnpm install`)*

3. Copy environment template:
```cmd
copy .env.example .env
```

4. Edit `.env` and set:
   - `PORT=4000` (default)
   - `FRONTEND_URL=http://localhost:3000`
   - (Optional) `DATABASE_URL` for Neon Postgres

5. Start dev server:
```cmd
npm run dev
```

Backend will run at **http://localhost:4000**

### Frontend Setup

1. Navigate to frontend folder:
```cmd
cd frontend
```

2. Install dependencies:
```cmd
npm install
```
*(or `pnpm install`)*

3. Copy environment template:
```cmd
copy .env.local.example .env.local
```

4. Edit `.env.local` and set:
   - `NEXT_PUBLIC_API_URL=http://localhost:4000`

5. Start dev server:
```cmd
npm run dev
```

Frontend will run at **http://localhost:3000**

---

## 🧪 Running Tests

### Backend Tests
```cmd
cd backend
npm test
```

### Frontend Tests
```cmd
cd frontend
npm test
```

---

## 📡 API Endpoints

### Routes
- `GET /routes` - List all routes (filters: shipId, year, vesselType, fuelType)
- `POST /routes/:routeId/baseline` - Set route as baseline
- `GET /routes/comparison` - Compare routes vs baseline

### Compliance
- `GET /compliance/cb?shipId=S001&year=2024` - Compute compliance balance
- `GET /compliance/adjusted-cb?shipId=S001&year=2024` - Adjusted CB after banking

### Banking
- `GET /banking/records?shipId=S001&year=2024` - Bank transaction history
- `POST /banking/bank` - Bank positive CB surplus (body: `{ shipId, year, amount_g }`)
- `POST /banking/apply` - Apply banked surplus to deficit (body: `{ shipId, year, amount_g }`)

### Pooling
- `POST /pools` - Create compliance pool (body: `{ year, members: ["S001", "S002"] }`)

---

## 🧮 Core Formulas

- **Target Intensity (2025)**: 89.3368 gCO₂e/MJ (2% below 91.16)
- **Energy in Scope**: `fuelConsumption (t) × 41,000 MJ/t`
- **Compliance Balance (CB)**: `(Target − Actual GHG Intensity) × Energy in Scope`
  - Positive CB = Surplus
  - Negative CB = Deficit

---

## 📋 Features

### Frontend Dashboard (4 Tabs)

1. **Routes Tab**
   - Table of all routes with filters
   - Set baseline button

2. **Compare Tab**
   - Baseline vs comparison routes
   - % difference calculation
   - Chart visualization (Recharts)

3. **Banking Tab**
   - Display current CB
   - Bank surplus action
   - Apply banked surplus action
   - Disable actions if no surplus

4. **Pooling Tab**
   - Display adjusted CB per ship
   - Create pool with member selection
   - Greedy allocation algorithm
   - Pool sum validation (must be ≥ 0)

---

## 🔗 Sample Requests

### Get all routes
```bash
curl http://localhost:4000/routes
```

### Compute CB for ship S001 in 2024
```bash
curl "http://localhost:4000/compliance/cb?shipId=S001&year=2024"
```

### Bank surplus
```bash
curl -X POST http://localhost:4000/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"S001","year":2024,"amount_g":50000000}'
```

### Create pool
```bash
curl -X POST http://localhost:4000/pools \
  -H "Content-Type: application/json" \
  -d '{"year":2024,"members":["S001","S002","S003"]}'
```

---

## 📋 Known Issues & Fixes

### Fixed in Latest Version

1. **Banking Tab Auto-Fetch Issue** (Fixed)
   - **Problem**: Ship ID and Year inputs triggered API calls on every keystroke
   - **Solution**: Removed auto-fetch useEffect, now requires manual "Fetch Data" button click
   - **Impact**: Better UX and reduced API load

2. **Pooling Tab Runtime Error** (Fixed)
   - **Problem**: `Cannot read properties of undefined` error on pool creation
   - **Root Cause**: Backend returned `cb_after_g` (snake_case) but frontend expected `cbAfter` (camelCase)
   - **Solution**: Updated frontend to match backend property names, added null coalescing for safety
   - **Impact**: Pool creation and result display now works correctly

3. **Geist Font Rendering Issue** (Fixed)
   - **Problem**: Fonts configured but not appearing in UI
   - **Root Cause**: Font CSS variables not cascading properly, font class not applied to body
   - **Solution**: 
     - Moved font variables from `<body>` to `<html>` tag for proper cascade
     - Added explicit `font-sans` class to body element
     - Updated @theme block to map font-sans/font-mono to geist variables with fallbacks
   - **Impact**: Geist Sans now renders correctly on all text, Geist Mono on code elements

4. **API Contract Consistency**
   - **Recommendation**: Use shared TypeScript types between frontend and backend to prevent property name mismatches
   - **Future**: Consider OpenAPI spec generation for automatic type synchronization

---

## �📚 Documentation

- **AGENT_WORKFLOW.md**: Detailed AI agent usage log (prompts, outputs, validations, bug fixes)
- **REFLECTION.md**: Learning outcomes, efficiency analysis, and debugging insights
- **IMPLEMENTATION_COMPLETE.md**: Testing checklist and run instructions
- **README.md**: This file (setup & architecture)

---

## 🧾 Reference

All calculations follow **FuelEU Maritime Regulation (EU) 2023/1805**, Annex IV and Articles 20–21.

---

## 📝 License

MIT (for assignment purposes)
