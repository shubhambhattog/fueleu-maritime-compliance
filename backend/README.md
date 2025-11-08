# FuelEU Maritime Compliance - Backend

A robust Express.js API for FuelEU Maritime compliance calculations, implementing hexagonal architecture with domain-driven design principles.

## Features

### 🚢 Route Management
- CRUD operations for maritime routes
- GHG intensity tracking
- Baseline route management per year
- Route comparison analytics

### 📊 Compliance Balance (CB) Calculation
- Article 9: Compliance Balance calculation (CB_g and CB_t)
- Formula: Σ(GHG Intensity × Fuel Consumption × Energy per MJ)
- Adjusted CB with banking operations
- Real-time compliance status

### 🏦 Banking Operations (Article 20)
- Bank surplus compliance balance
- Apply banked balance to future years
- Transaction history tracking
- Validation: No negative CB after banking

### 🤝 Pooling Operations (Article 21)
- Create compliance pools across multiple ships
- Fair distribution algorithm
- Pool validation (minimum 2 members, non-negative sum)
- Before/after balance tracking

### 🏗️ Architecture
- **Hexagonal Architecture** (Ports & Adapters)
- **Domain-Driven Design** (DDD)
- **Dependency Injection** with manual container
- **Repository Pattern** for data access
- **Service Layer** for business logic
- **Express Routes** as adapters

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Testing**: Jest + Supertest
- **Dev Tools**: ts-node, nodemon

## Getting Started

### Prerequisites

```bash
Node.js 20+ and npm/pnpm
PostgreSQL database (Neon recommended)
```

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data (optional)
npm run db:seed
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage
```

The API will be available at `http://localhost:4000`.

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Server
PORT=4000
NODE_ENV=development

# Frontend (for CORS)
FRONTEND_URL=http://localhost:3000

# Security (optional)
JWT_SECRET=your-secret-key
```

## API Endpoints

### Health Check
```
GET /health - Check backend status
```

### Routes
```
GET    /routes                    - Get all routes (with optional filters)
GET    /routes/:id                - Get route by ID
POST   /routes                    - Create new route
PUT    /routes/:id                - Update route
DELETE /routes/:id                - Delete route
POST   /routes/:id/baseline       - Set route as baseline
GET    /routes/comparison         - Get baseline vs comparison routes
```

### Compliance
```
GET /compliance/cb                - Calculate compliance balance
GET /compliance/adjusted-cb       - Get adjusted CB (with banking)
```

### Banking
```
POST /banking/bank                - Bank surplus balance
POST /banking/apply               - Apply banked balance
GET  /banking/records             - Get banking history
```

### Pooling
```
POST /pools                       - Create compliance pool
GET  /pools/:year                 - Get pool details
```

## Project Structure

```
backend/
├── src/
│   ├── domain/                   # Domain layer (business logic)
│   │   ├── models/              # Domain models
│   │   ├── repositories/        # Repository interfaces (ports)
│   │   └── services/            # Domain services
│   ├── application/             # Application layer (use cases)
│   │   └── services/            # Application services
│   ├── infrastructure/          # Infrastructure layer (adapters)
│   │   ├── config/              # Configuration & DI container
│   │   ├── http/                # HTTP adapters (Express)
│   │   │   └── express/
│   │   │       ├── routes/      # Route handlers
│   │   │       └── middleware/  # Express middleware
│   │   └── persistence/         # Data persistence
│   │       └── drizzle/         # Drizzle ORM implementation
│   ├── db/                      # Database configuration
│   │   ├── schema.ts            # Drizzle schema
│   │   └── seed.ts              # Seed data script
│   └── index.ts                 # Application entry point
├── __tests__/                   # Integration tests
└── README.md
```

## Architecture Principles

### Hexagonal Architecture (Ports & Adapters)

**Domain Layer (Core)**
- Pure business logic
- No external dependencies
- Defines repository interfaces (ports)

**Application Layer**
- Use cases and workflows
- Orchestrates domain services
- Transaction management

**Infrastructure Layer (Adapters)**
- HTTP/REST adapter (Express)
- Database adapter (Drizzle ORM)
- External services integration

### Dependency Injection

Manual DI container creates and wires dependencies:
```typescript
const container = {
  routeRepository: new DrizzleRouteRepository(db),
  routeService: new RouteService(routeRepository),
  // ... other services
};
```

### Benefits
- ✅ **Testability**: Easy to mock dependencies
- ✅ **Flexibility**: Swap implementations without changing business logic
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Scalability**: Add new adapters without touching core

## Database Schema

### Routes Table
```typescript
{
  id: uuid (primary key),
  routeId: string (unique),
  shipId: string,
  year: integer,
  vesselType: string,
  fuelType: string,
  ghgIntensity: numeric,
  fuelConsumption: numeric,
  distance: numeric (optional),
  totalEmissions: numeric (optional),
  isBaseline: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Banking Table
```typescript
{
  id: uuid (primary key),
  shipId: string,
  year: integer,
  amount_g: numeric,
  type: 'bank' | 'apply',
  createdAt: timestamp
}
```

### Pools Table
```typescript
{
  id: uuid (primary key),
  year: integer,
  poolSum: numeric,
  members: jsonb,
  createdAt: timestamp
}
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test coverage includes:
- ✅ Route CRUD operations
- ✅ Baseline management
- ✅ Compliance balance calculations
- ✅ Banking operations
- ✅ Pooling operations
- ✅ Error handling

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (local development)
- `https://*.vercel.app` (Vercel deployments)
- Environment variable: `FRONTEND_URL`

Dynamic origin matching supports wildcard patterns for flexible deployment.

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel`
3. Set environment variables in Vercel dashboard
4. Update frontend `NEXT_PUBLIC_API_URL` to your backend URL

See `DEPLOYMENT.md` in the root directory for detailed instructions.

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed database
```

## Contributing

1. Follow hexagonal architecture principles
2. Write tests for new features
3. Update documentation
4. Use TypeScript strictly
5. Follow the existing code style

## License

MIT
