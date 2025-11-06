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
- **Modern Card Layouts**: Clean, organized information hierarchy
- **CB Summary Cards**: Visual display of Current CB, Available Banked, and Activity
- **Status Icons**: TrendingUp/Down icons for surplus/deficit visualization
- **Dual Action Forms**: Separate, well-designed forms for Banking and Applying surplus
- **Banking History**: Comprehensive transaction log with type badges
- **Smart Warnings**: Context-aware validation messages with icons
- **Dark Mode**: Fully theme-aware with proper color contrasts

### 🤝 Pooling (Article 21)
- **Enhanced Member Selection**: Interactive checkboxes with visual feedback
- **Year Selection Card**: Clean card-based year input
- **Member CB Display**: Detailed table showing individual balances before pooling
- **Status Badges**: Color-coded status indicators (Surplus/Deficit/Neutral)
- **Pool Validation**: Real-time validation with helpful error messages
- **Success Display**: Green-themed success card showing pool results
- **Member Shares**: Clear table showing CB distribution after pooling
- **Icon Integration**: Ship, Users, and CheckCircle icons for better UX

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

## Environment Variables

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

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
