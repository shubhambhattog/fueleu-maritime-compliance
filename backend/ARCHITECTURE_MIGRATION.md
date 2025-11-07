# Architecture Migration: Layered → Hexagonal

## ✅ Migration Complete

**Date**: Completed
**Status**: Active
**Migration Type**: Layered Architecture → Hexagonal (Ports & Adapters)

---

## What Changed

### Before: Layered Architecture
```
routes/routes.ts (in-memory)     →  Directly uses seeded data
routes/routes-db.ts (database)   →  Directly uses Drizzle ORM
```

**Problems:**
- Business logic mixed with HTTP handlers
- Tightly coupled to Express and Drizzle
- Hard to test without spinning up server
- Can't swap database without rewriting routes

### After: Hexagonal Architecture
```
HTTP Controllers (Express)
    ↓ (calls)
Domain Services (use cases)
    ↓ (calls via interfaces)
Repositories (adapters)
    ↓ (implements)
Drizzle ORM / In-Memory Store
```

**Benefits:**
- ✅ Business logic framework-independent
- ✅ Easy to test (mock repositories)
- ✅ Swappable adapters (Drizzle ↔ InMemory)
- ✅ Domain layer enforces business rules
- ✅ Clean separation of concerns

---

## Architecture Layers

### 1. Domain Layer (Core Hexagon)
**Location**: `src/domain/`

**Value Objects** (immutable, validated):
- `Year.ts` - Validates 2020-2050 range
- `GHGIntensity.ts` - Validates 0-200 gCO₂e/MJ
- `EnergyMJ.ts` - Energy calculations (41,000 MJ/tonne)
- `ComplianceBalanceGrams.ts` - CB with surplus/deficit logic

**Entities** (business logic):
- `Route.ts` - CB calculation, baseline management
- `Ship.ts` - Ship and ShipComplianceBalance
- `BankEntry.ts` - Immutable banking with Article 20 rules
- `Pool.ts` - Greedy allocation algorithm

**Ports** (interfaces):
- **Inbound**: RouteService, ComplianceService, BankingService, PoolingService
- **Outbound**: RouteRepository, BankEntryRepository, PoolRepository

**Services** (use case implementations):
- `RouteServiceImpl.ts` - Route CRUD + baseline management
- `ComplianceServiceImpl.ts` - CB aggregation
- `BankingServiceImpl.ts` - Banking validation
- `PoolingServiceImpl.ts` - Pool creation with allocation

### 2. Infrastructure Layer (Adapters)
**Location**: `src/infrastructure/`

**Persistence Adapters**:
- `DrizzleRouteRepository.ts` - Postgres via Drizzle ORM
- `DrizzleBankEntryRepository.ts` - Banking persistence
- `DrizzlePoolRepository.ts` - Pool persistence
- `InMemoryRouteRepository.ts` - Testing/fallback
- `InMemoryBankEntryRepository.ts` - In-memory banking
- `InMemoryPoolRepository.ts` - In-memory pools

**HTTP Adapters**:
- `hexagonalRouter.ts` - Express route handlers
- DTOs: `RouteDTO`, `ComplianceDTO`, `BankingDTO`, `PoolDTO`

**Configuration**:
- `container.ts` - Dependency injection container

---

## Migration Steps (Completed)

### Step 1: Domain Layer ✅
- [x] Created value objects with validation
- [x] Created entities with business logic
- [x] Defined port interfaces (contracts)
- [x] Implemented domain services

### Step 2: Infrastructure Layer ✅
- [x] Created Drizzle repository adapters
- [x] Created InMemory repository adapters
- [x] Created DTOs for HTTP responses
- [x] Created Express router factory

### Step 3: Dependency Injection ✅
- [x] Created container with auto-detection
- [x] Wire services with repositories
- [x] Environment-based adapter selection

### Step 4: Integration ✅
- [x] Updated `index.ts` to use hexagonal router
- [x] Removed old route imports
- [x] Verified server starts correctly

### Step 5: Testing 🔄
- [ ] Test all API endpoints
- [ ] Verify business rules enforced
- [ ] Test both Drizzle and InMemory modes

---

## API Endpoints (Unchanged)

All endpoints remain the same, but now use hexagonal architecture:

### Routes
- `GET /routes` - Get all routes with filters
- `POST /routes/:routeId/baseline` - Set route as baseline

### Comparison
- `GET /routes/comparison` - Compare baseline vs selected routes

### Compliance
- `GET /compliance/cb` - Get ship compliance balances
- `GET /compliance/adjusted-cb` - Get adjusted CB after banking/pooling

### Banking
- `GET /banking/records?shipId=...&year=...` - Get bank entries
- `POST /banking/bank` - Bank surplus CB (validates positive amount)
- `POST /banking/apply` - Apply banked CB (validates available balance)

### Pooling
- `POST /pools` - Create pool with greedy allocation

---

## Business Rules (Now Enforced in Domain)

### FuelEU Maritime Target
```typescript
const TARGET_INTENSITY = 89.3368; // 2% below 91.16 gCO₂e/MJ
const ENERGY_PER_TONNE = 41_000; // MJ/tonne fuel
```

### Banking Validation
```typescript
// Can't bank negative CB
if (!complianceBalance.isSurplus()) {
  throw new Error("Can only bank positive CB surplus");
}

// Can't apply more than available
if (amount > availableBalance) {
  throw new Error("Insufficient banked CB");
}
```

### Pooling Validation
```typescript
// Pool sum must be >= 0
const poolSum = members.reduce((sum, m) => sum + m.cbGrams, 0);
if (poolSum < 0) {
  throw new Error("Pool sum cannot be negative");
}

// Greedy allocation: prioritize highest deficits
const deficits = members.filter(m => m.cbGrams < 0)
  .sort((a, b) => a.cbGrams - b.cbGrams); // Most negative first
```

---

## Testing Strategy

### Unit Tests (Domain Layer)
```typescript
// Example: Test banking validation
const cb = ComplianceBalanceGrams.create(-1000);
expect(() => bankingService.bankSurplus(shipId, year, cb))
  .toThrow("Can only bank positive CB surplus");
```

### Integration Tests (Services + Repositories)
```typescript
// Example: Test route service with InMemory repository
const container = createContainer(); // Uses InMemory
const routes = await container.routeService.getAllRoutes({});
expect(routes).toHaveLength(10); // Seeded data
```

### E2E Tests (HTTP API)
```bash
# Test banking endpoint
curl -X POST http://localhost:4000/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId": "SHIP-001", "year": 2025, "amount_g": 5000}'
```

---

## Environment Configuration

### Use Drizzle (Postgres)
```env
DATABASE_URL=postgresql://user:pass@host/db
```

### Use InMemory (Testing/Development)
```env
# Leave DATABASE_URL empty or undefined
```

Container automatically detects and wires correct adapters!

---

## Legacy Code

Old layered architecture moved to `src/routes/legacy/`:
- `routes.ts` - In-memory implementation (deprecated)
- `routes-db.ts` - Database implementation (deprecated)

**Do not modify legacy files** - use hexagonal architecture instead.

---

## Next Steps

1. **Verify Migration**: Test all endpoints with Postman/curl
2. **Add Tests**: Write unit tests for domain services
3. **Error Handling**: Add middleware for domain errors
4. **Documentation**: Update README with new architecture
5. **Cleanup**: Remove legacy files once verified

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│         HTTP Layer (Infrastructure)             │
│  Express Controllers + DTOs                     │
└─────────────────┬───────────────────────────────┘
                  │ calls
                  ▼
┌─────────────────────────────────────────────────┐
│         Application Layer (Domain)              │
│  RouteService, ComplianceService, etc.          │
└─────────────────┬───────────────────────────────┘
                  │ calls via interfaces
                  ▼
┌─────────────────────────────────────────────────┐
│         Domain Layer (Core Hexagon)             │
│  Entities: Route, Pool, BankEntry               │
│  Value Objects: Year, GHGIntensity, Energy, CB  │
│  Business Rules: Banking, Pooling, Compliance   │
└─────────────────┬───────────────────────────────┘
                  │ depends on
                  ▼
┌─────────────────────────────────────────────────┐
│         Port Interfaces                         │
│  RouteRepository, BankEntryRepository, etc.     │
└─────────────────┬───────────────────────────────┘
                  │ implemented by
                  ▼
┌─────────────────────────────────────────────────┐
│         Persistence Layer (Infrastructure)      │
│  DrizzleRouteRepository ◄──► InMemoryRepository │
│  DrizzleBankEntryRepo   ◄──► InMemoryBankEntry  │
└─────────────────────────────────────────────────┘
```

**Dependency Rule**: Arrows point inward (infrastructure depends on domain, never reverse)

---

## Success Criteria

- [x] All domain logic framework-independent
- [x] Business rules enforced in domain layer
- [x] Adapters swappable via interfaces
- [x] No direct ORM calls in controllers
- [x] DTOs separate from domain entities
- [x] Dependency injection container working
- [ ] All endpoints tested and working
- [ ] Business rules verified (banking validation, etc.)

---

**Migration Complete!** 🎉

The backend now follows true hexagonal architecture principles.
