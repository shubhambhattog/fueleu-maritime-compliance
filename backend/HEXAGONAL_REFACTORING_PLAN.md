# Hexagonal Architecture Refactoring Plan

## 📋 Current State Analysis

### Problems with Current Architecture:
1. ❌ Routes directly use Drizzle ORM - mixing infrastructure with HTTP layer
2. ❌ No port interfaces defined - just implicit contracts
3. ❌ Business logic mixed in route handlers
4. ❌ No clear domain entities - just plain types
5. ❌ Tight coupling to Express framework

### What We Have:
✅ Good separation in `core/computeCB.ts` (framework-agnostic)
✅ Dual storage mode (DB + in-memory)
✅ TypeScript with strict typing

---

## 🎯 Target Hexagonal Structure

```
backend/src/
├── domain/                    # Core Business Logic (Hexagon Center)
│   ├── entities/              # Domain entities with behavior
│   │   ├── Route.ts
│   │   ├── Ship.ts
│   │   ├── ComplianceBalance.ts
│   │   ├── BankEntry.ts
│   │   └── Pool.ts
│   ├── valueObjects/          # Immutable value objects
│   │   ├── Year.ts
│   │   ├── GHGIntensity.ts
│   │   └── EnergyMJ.ts
│   ├── ports/                 # Interfaces (contracts)
│   │   ├── inbound/           # Application use cases
│   │   │   ├── RouteService.ts
│   │   │   ├── ComplianceService.ts
│   │   │   ├── BankingService.ts
│   │   │   └── PoolingService.ts
│   │   └── outbound/          # Infrastructure contracts
│   │       ├── RouteRepository.ts
│   │       ├── BankEntryRepository.ts
│   │       └── PoolRepository.ts
│   └── services/              # Use case implementations
│       ├── RouteServiceImpl.ts
│       ├── ComplianceServiceImpl.ts
│       ├── BankingServiceImpl.ts
│       └── PoolingServiceImpl.ts
├── infrastructure/            # Adapters (Hexagon Outside)
│   ├── persistence/           # Outbound adapters
│   │   ├── drizzle/
│   │   │   ├── DrizzleRouteRepository.ts
│   │   │   ├── DrizzleBankEntryRepository.ts
│   │   │   └── DrizzlePoolRepository.ts
│   │   └── inMemory/
│   │       ├── InMemoryRouteRepository.ts
│   │       ├── InMemoryBankEntryRepository.ts
│   │       └── InMemoryPoolRepository.ts
│   ├── http/                  # Inbound adapters
│   │   ├── express/
│   │   │   ├── routes/
│   │   │   │   ├── routeController.ts
│   │   │   │   ├── complianceController.ts
│   │   │   │   ├── bankingController.ts
│   │   │   │   └── poolingController.ts
│   │   │   ├── middleware/
│   │   │   │   ├── errorHandler.ts
│   │   │   │   └── validator.ts
│   │   │   └── dtos/
│   │   │       ├── RouteDTO.ts
│   │   │       ├── ComplianceDTO.ts
│   │   │       └── BankingDTO.ts
│   │   └── server.ts
│   └── config/
│       └── container.ts       # Dependency injection setup
├── db/                        # Existing database setup
│   ├── schema.ts
│   ├── index.ts
│   └── seed.ts
└── index.ts                   # Entry point

```

---

## 🔧 Implementation Steps

### Phase 1: Domain Layer (Core)
1. ✅ Create domain entities with business rules
2. ✅ Define port interfaces (inbound + outbound)
3. ✅ Implement use case services
4. ✅ Extract formulas into domain value objects

### Phase 2: Infrastructure Layer (Adapters)
1. ✅ Create repository implementations (Drizzle + InMemory)
2. ✅ Create HTTP controllers (Express)
3. ✅ Create DTOs for request/response mapping
4. ✅ Setup dependency injection container

### Phase 3: Integration
1. ✅ Wire up dependencies in container
2. ✅ Update index.ts to use container
3. ✅ Remove old routes files
4. ✅ Add error handling middleware

### Phase 4: Testing & Validation
1. ✅ Unit tests for domain services
2. ✅ Integration tests for repositories
3. ✅ API tests for controllers
4. ✅ Verify business rules

---

## 📦 Key Hexagonal Concepts

### Ports (Interfaces)
**Inbound Ports** (driven by external actors):
```typescript
// domain/ports/inbound/RouteService.ts
export interface RouteService {
  getAllRoutes(filters?: RouteFilters): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(year: number): Promise<ComparisonResult>;
}
```

**Outbound Ports** (drive external resources):
```typescript
// domain/ports/outbound/RouteRepository.ts
export interface RouteRepository {
  findAll(filters?: RouteFilters): Promise<Route[]>;
  findById(routeId: string): Promise<Route | null>;
  update(route: Route): Promise<Route>;
}
```

### Adapters
**Inbound Adapter** (HTTP Controller):
```typescript
// infrastructure/http/express/routes/routeController.ts
export class RouteController {
  constructor(private routeService: RouteService) {}
  
  async getAllRoutes(req: Request, res: Response) {
    const filters = this.parseFilters(req.query);
    const routes = await this.routeService.getAllRoutes(filters);
    res.json(routes.map(r => RouteDTO.fromDomain(r)));
  }
}
```

**Outbound Adapter** (Repository):
```typescript
// infrastructure/persistence/drizzle/DrizzleRouteRepository.ts
export class DrizzleRouteRepository implements RouteRepository {
  async findAll(filters?: RouteFilters): Promise<Route[]> {
    const rows = await db.select().from(routes).where(...);
    return rows.map(r => Route.fromPersistence(r));
  }
}
```

### Dependency Injection
```typescript
// infrastructure/config/container.ts
export function createContainer() {
  const useDatabase = !!process.env.DATABASE_URL;
  
  // Choose repository implementation
  const routeRepo: RouteRepository = useDatabase
    ? new DrizzleRouteRepository(db)
    : new InMemoryRouteRepository();
  
  // Inject dependencies into services
  const routeService: RouteService = new RouteServiceImpl(routeRepo);
  const complianceService: ComplianceService = new ComplianceServiceImpl(routeRepo);
  
  // Inject services into controllers
  const routeController = new RouteController(routeService);
  const complianceController = new ComplianceController(complianceService);
  
  return { routeController, complianceController, ... };
}
```

---

## ✨ Benefits of This Refactoring

### 1. Testability
- ✅ Domain logic testable without database
- ✅ Easy to mock repositories with interfaces
- ✅ Controllers testable without Express

### 2. Flexibility
- ✅ Swap database (Postgres → MongoDB) by changing adapter
- ✅ Swap HTTP framework (Express → Fastify) by changing adapter
- ✅ Add new adapters (GraphQL, gRPC) without touching domain

### 3. Maintainability
- ✅ Clear separation of concerns
- ✅ Business rules in one place (domain/)
- ✅ Dependencies point inward (infrastructure → domain)

### 4. Type Safety
- ✅ Domain entities enforce business rules
- ✅ Ports ensure contract compliance
- ✅ DTOs prevent exposing internal structure

---

## 🚀 Next Steps

1. Create domain entities and value objects
2. Define port interfaces
3. Implement use case services
4. Create repository adapters
5. Create HTTP controllers
6. Setup dependency injection
7. Wire everything together
8. Test and validate

Let's start! 🎯
