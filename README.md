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
- Node.js 20+ (LTS recommended)
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
   - `DATABASE_URL` for Neon Postgres (required)
   - `NODE_ENV=development`

5. Setup database:
```cmd
npm run db:push
npm run db:seed
```

6. Start dev server:
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
pnpm install
```
*(pnpm recommended for this project)*

3. The API URL is configured in `config/site.ts`:
   - Development: `http://localhost:4000` (default)
   - Production: Set `NEXT_PUBLIC_API_URL` environment variable in Vercel

4. Start dev server:
```cmd
pnpm dev
```

Frontend will run at **http://localhost:3000**

### Quick Start (Both Services)

```cmd
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
pnpm install
pnpm dev
```

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

1. **Routes Tab** 📊
   - **Quick Search**: Real-time, case-insensitive search across all fields (Route ID, Ship ID, Vessel Type, Fuel Type, Year, etc.)
   - **Advanced Filters**: Popover-based filtering with active filter count badge
   - **Sortable Columns**: Excel-like sorting with hover indicators on all data columns
   - **Color-coded Year Badges**: Blue for 2024, Green for 2025
   - **Baseline Management**: Set baseline button with year-specific tracking
   - **Dark Mode Support**: Full theme compatibility

2. **Compare Tab** 📈
   - **Interactive Bar Charts**: Modern shadcn charts with responsive design
   - Baseline vs comparison routes visualization
   - % difference calculation with compliance indicators
   - Target reference line (89.3368 gCO₂e/MJ)
   - Theme-aware colors (adapts to light/dark mode)
   - Compact bar sizing with elegant spacing
   - Detailed comparison table with compliant/non-compliant badges

3. **Banking Tab** 🏦
   - **Searchable Dropdowns**: Ship ID and Year selection with search/filter capability (300px width)
   - **Smart Filtering**: Only shows ships with data for selected year (and vice versa)
   - **Reset Button**: Quick reset icon button to clear selections and start over
   - **KPI Cards**: Current CB, Available Banked Surplus, and Banking Activity summary
   - **Bank Surplus**: Store positive CB with input validation and visual feedback
   - **Apply Banked**: Use stored CB for deficits with smart warnings
   - **Banking History**: Complete transaction log with date, type, and amounts
   - **Compact Inputs**: 300px width for all inputs and action buttons
   - **Manual Fetch**: Explicit "Fetch Data" button prevents auto-loading

4. **Pooling Tab** 🤝
   - **Searchable Year Dropdown**: 300px dropdown with search/filter (shows only available years)
   - **Dynamic Ship Filtering**: Only displays ships with routes for selected year
   - **Interactive Selection**: Checkbox-based multi-select with visual highlighting
   - **Real-time Validation**: Pool sum calculation with compliance indicators
   - **Before/After Display**: Clear comparison tables showing CB changes
   - **Pool Rules Enforcement**: 
     - Minimum 2 members required
     - Pool sum must be ≥ 0 (no negative pools)
     - Deficit ships can't exit worse
     - Surplus ships can't exit negative
   - **Success Feedback**: Green-themed result card with detailed member shares
   - **Flicker-Free**: Optimized rendering prevents table flickering

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

## 🌐 Deployment

### Live Application

- **Frontend**: https://fueleu-maritime-compliance-fe.vercel.app
- **Backend**: https://fueleu-maritime-compliance-be.vercel.app
- **Database**: Neon PostgreSQL (serverless)

### Deploy Your Own

#### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set Root Directory: `frontend`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL
5. Deploy

#### Backend (Vercel)
1. Import backend folder in Vercel
2. Set Root Directory: `backend`
3. Add environment variables:
   - `DATABASE_URL` = Neon connection string
   - `FRONTEND_URL` = your frontend URL
   - `NODE_ENV` = production
   - `PORT` = 4000
4. Deploy

See `DEPLOYMENT.md` for detailed instructions.

### Configuration

The application uses a centralized configuration approach:
- **API URL**: Configured in `frontend/config/site.ts`
- **Environment Override**: Set `NEXT_PUBLIC_API_URL` to override default
- **CORS**: Automatically configured for Vercel domains (`*.vercel.app`)
- **Health Check**: Backend status indicator on home page

---

## 🎯 Latest Features

### Backend Health Monitoring
- Real-time backend status indicator on home page
- Auto-refresh every 30 seconds
- Visual badges (Checking/Online/Offline)
- `/health` endpoint for status checks

### Loading States
- Skeleton loaders on all tabs during data fetching
- Professional loading experience
- Prevents layout shift

### Logo Navigation
- Clickable logo returns to home page
- Consistent navigation pattern

### Pre-commit Hooks
- Husky integration for code quality
- ESLint checks before commit
- Prevents deployment failures

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
