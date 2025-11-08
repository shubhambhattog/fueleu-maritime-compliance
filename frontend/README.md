# FuelEU Maritime Compliance - Frontend

A modern Next.js dashboard for managing and monitoring FuelEU Maritime compliance data, including routes, GHG intensity tracking, baseline comparisons, banking, and pooling.

## Features

### 📊 Routes Management
- View all maritime routes with detailed GHG intensity data
- **Quick Search**: Real-time, case-insensitive search across all fields
- **Advanced Filters**: Popover-based filtering by Ship ID, Year, Vessel Type, and Fuel Type
- **Sortable Columns**: Excel-like sorting with visual indicators (hover to see arrows)
- **Color-coded Year Badges**: Blue for 2024, Green for 2025
- **Baseline Management**: Set and track baseline routes per year

### 📈 Compare Routes
- Visual comparison of baseline vs. comparison routes
- **Interactive Bar Charts**: Elegant, responsive charts using shadcn/ui
- Color-coded bars with proper dark mode support
- Target reference line with compliance indicators
- Detailed comparison table with compliance status

### 🏦 Banking (Article 20)
- **Searchable Dropdowns**: Command-based search/filter for Ship ID and Year (300px width)
- **Smart Filtering**: Ships filtered by selected year, years filtered by selected ship
- **Reset Button**: Icon-only reset button for quick selection clearing
- **KPI Cards**: Visual display of Current CB, Available Banked Surplus, and Banking Activity
- **Status Icons**: TrendingUp/Down icons for surplus/deficit visualization
- **Dual Action Forms**: Separate, well-designed forms for Banking and Applying surplus
- **Compact Inputs**: All inputs and buttons standardized to 300px width
- **Manual Fetch**: Explicit "Fetch Data" button with validation
- **Banking History**: Comprehensive transaction log with type badges and timestamps
- **Smart Warnings**: Context-aware validation messages with emoji icons
- **Dark Mode**: Fully theme-aware with proper color contrasts
- **Toast Notifications**: Sonner toasts for all actions (success/error)

### 🤝 Pooling (Article 21)
- **Searchable Year Dropdown**: 300px dropdown with Command search component
- **Dynamic Ship Filtering**: Only shows ships with routes for selected year
- **Enhanced Member Selection**: Interactive checkboxes with visual row highlighting
- **Year Selection Card**: Clean card-based year input with calendar icon
- **Member CB Display**: Detailed table showing individual balances before pooling
- **Status Badges**: Color-coded status indicators (Surplus/Deficit/Neutral) with icons
- **Pool Validation**: Real-time sum calculation with compliance indicators
- **Pool Rules Enforced**:
  - Minimum 2 members required
  - Pool sum must be ≥ 0 (no negative pools)
  - Fair distribution ensures no member exits worse
- **Success Display**: Green-themed success card showing pool results
- **Before/After Comparison**: Clear tables showing CB changes for each member
- **Pool Summary**: Highlighted pool total with validation badge
- **Icon Integration**: Ship, Users, CheckCircle, and trend icons for better UX
- **Toast Notifications**: Success/error feedback using Sonner
- **Flicker-Free Rendering**: Optimized useEffect prevents unnecessary re-renders

## Tech Stack

- **Framework**: Next.js 16.0.1 (App Router, Turbopack)
- **Language**: TypeScript 5.x
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: shadcn charts (built on Recharts)
- **Styling**: Tailwind CSS 4
- **Theme**: next-themes with dark mode support
- **Icons**: lucide-react
- **Fonts**: Geist Sans & Geist Mono

## Getting Started

### Prerequisites

```bash
Node.js 20+ and pnpm (recommended)
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Backend Connection

The frontend connects to the backend API running on `http://localhost:4000`. Make sure the backend server is running:

```bash
cd ../backend
npm run dev
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── charts/           # Chart components
│   ├── RoutesTab.tsx     # Routes management with filters & search
│   ├── CompareTab.tsx    # Baseline comparison with charts
│   ├── BankingTab.tsx    # Banking management
│   ├── PoolingTab.tsx    # Pooling management
│   └── ThemeToggle.tsx   # Dark mode toggle
├── lib/
│   ├── api.ts            # API client
│   └── utils.ts          # Utility functions
└── public/               # Static assets
```

## Key Features Explained

### Quick Search
The routes tab includes a powerful quick search feature that searches across all fields in real-time:
- Case-insensitive matching
- Searches: Route ID, Ship ID, Vessel Type, Fuel Type, Year, and all numerical values
- No need to open filters for simple searches

### Advanced Filters
Click the "Filters" button to access advanced filtering:
- Filter by Ship ID, Year, Vessel Type, and Fuel Type
- Active filter count badge
- Clear all filters with one click
- Filters persist until cleared

### Sortable Columns
All data columns in the Routes tab are sortable:
- Click column headers to sort
- Arrows appear on hover for inactive columns
- Active sort column shows directional arrow (up/down)
- Default sort: Year (ascending)

### Chart Visualizations
The Compare tab features professional charts:
- Theme-aware colors (adapts to light/dark mode)
- Rounded bar corners for modern look
- Compact bar sizing (max 60px width)
- Reference line for target GHG intensity
- Interactive tooltips with formatted data

## Configuration

### API URL Configuration

The API URL is configured in `config/site.ts`:

```typescript
api: {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
}
```

**Local Development:** Uses `http://localhost:4000` by default

**Production (Vercel):** Set `NEXT_PUBLIC_API_URL` environment variable:
```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

This centralized configuration provides:
- ✅ Type safety with TypeScript
- ✅ Single source of truth
- ✅ Environment variable override support
- ✅ Better developer experience

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Dark Mode

The application fully supports dark mode:
- Toggle using the theme switch in the header
- Automatic system preference detection
- Persistent theme selection
- All components properly styled for both modes

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org)
