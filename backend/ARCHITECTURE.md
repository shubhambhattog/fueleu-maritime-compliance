# FuelEU Maritime Compliance - Architecture Documentation

## Table of Contents
1. [High-Level Design (HLD)](#high-level-design-hld)
2. [Low-Level Design (LLD)](#low-level-design-lld)
3. [Data Flow](#data-flow)
4. [Component Diagrams](#component-diagrams)
5. [API Documentation](#api-documentation)
6. [Business Rules](#business-rules)

---

# High-Level Design (HLD)

## Architecture Pattern: Hexagonal Architecture (Ports & Adapters)

### Overview
The backend implements **Hexagonal Architecture** (also known as Ports & Adapters), which creates a clear separation between business logic and infrastructure concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP LAYER (Inbound)                      │
│          Express Controllers + DTOs (JSON mapping)           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION SERVICES (Use Cases)                │
│   RouteService | ComplianceService | BankingService | ...   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   DOMAIN LAYER (CORE)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Entities: Route, Ship, BankEntry, Pool               │   │
│  │ - Business logic encapsulated                        │   │
│  │ - Framework-independent                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Value Objects: Year, GHGIntensity, Energy, CB        │   │
│  │ - Immutable, validated                               │   │
│  │ - Type safety                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Business Rules:                                      │   │
│  │ - FuelEU compliance calculations                     │   │
│  │ - Banking validation (Article 20)                    │   │
│  │ - Pooling with greedy allocation (Article 21)        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   PORT INTERFACES                            │
│  Repository Contracts (Outbound Ports)                       │
│  - RouteRepository                                           │
│  - BankEntryRepository                                       │
│  - PoolRepository                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            PERSISTENCE LAYER (Outbound Adapters)             │
│  ┌──────────────────┐              ┌──────────────────┐     │
│  │ Drizzle Adapters │              │ InMemory Adapters│     │
│  │ (Postgres)       │              │ (Testing/Dev)    │     │
│  └──────────────────┘              └──────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Dependency Inversion**: All dependencies point inward
   - Domain layer has ZERO external dependencies
   - Infrastructure depends on domain, never the reverse

2. **Separation of Concerns**
   - Domain: Business rules and logic
   - Application: Use case orchestration
   - Infrastructure: Technical implementation details

3. **Testability**
   - Domain can be tested without any infrastructure
   - Services can be tested with mock repositories
   - HTTP layer can be tested with mock services

4. **Swappable Adapters**
   - Drizzle (Postgres) ↔ InMemory repositories
   - Express ↔ Any other HTTP framework
   - Easy to add: MongoDB, Redis, GraphQL, gRPC, etc.

---

## System Components

### 1. Domain Layer (Core Hexagon)

**Purpose**: Contains all business logic, framework-independent

**Components**:
- **Entities**: Objects with identity and lifecycle (Route, Ship, BankEntry, Pool)
- **Value Objects**: Immutable objects defined by attributes (Year, GHGIntensity, EnergyMJ, ComplianceBalanceGrams)
- **Domain Services**: Complex business logic that doesn't fit in entities
- **Ports**: Interfaces defining contracts (Inbound = use cases, Outbound = repositories)

**No dependencies on**: Express, Drizzle, databases, HTTP, JSON, etc.

### 2. Application Layer (Services)

**Purpose**: Orchestrates use cases, coordinates domain objects

**Services**:
- `RouteServiceImpl`: Route CRUD + baseline management
- `ComplianceServiceImpl`: CB calculations and aggregations
- `BankingServiceImpl`: Banking operations with validation
- `PoolingServiceImpl`: Pool creation with greedy allocation

**Dependencies**: Only domain layer + port interfaces

### 3. Infrastructure Layer (Adapters)

**Purpose**: Technical implementation of ports

**Adapters**:
- **HTTP Inbound**: Express controllers, DTOs for JSON mapping
- **Persistence Outbound**: Drizzle (Postgres) + InMemory implementations
- **Configuration**: Dependency injection container

**Dependencies**: Domain layer, external frameworks (Express, Drizzle)

---

# Low-Level Design (LLD)

## Directory Structure

```
backend/src/
├── domain/                           # CORE HEXAGON (No external dependencies)
│   ├── entities/                     # Business objects with identity
│   │   ├── Route.ts                  # Maritime route entity
│   │   ├── Ship.ts                   # Ship + ShipComplianceBalance
│   │   ├── BankEntry.ts              # Banking entries + BankingBalance
│   │   └── Pool.ts                   # Pool + PoolMember
│   │
│   ├── valueObjects/                 # Immutable, validated types
│   │   ├── Year.ts                   # 2020-2050 validation
│   │   ├── GHGIntensity.ts           # 0-200 gCO₂e/MJ validation
│   │   ├── EnergyMJ.ts               # Energy calculations
│   │   └── ComplianceBalanceGrams.ts # CB with surplus/deficit logic
│   │
│   ├── ports/                        # Interface contracts
│   │   ├── inbound/                  # Use case interfaces
│   │   │   ├── RouteService.ts
│   │   │   ├── ComplianceService.ts
│   │   │   ├── BankingService.ts
│   │   │   └── PoolingService.ts
│   │   │
│   │   └── outbound/                 # Repository interfaces
│   │       ├── RouteRepository.ts
│   │       ├── BankEntryRepository.ts
│   │       └── PoolRepository.ts
│   │
│   └── services/                     # Use case implementations
│       ├── RouteServiceImpl.ts
│       ├── ComplianceServiceImpl.ts
│       ├── BankingServiceImpl.ts
│       └── PoolingServiceImpl.ts
│
├── infrastructure/                   # ADAPTERS (Technical implementations)
│   ├── persistence/
│   │   ├── drizzle/                  # Postgres adapters
│   │   │   ├── DrizzleRouteRepository.ts
│   │   │   ├── DrizzleBankEntryRepository.ts
│   │   │   └── DrizzlePoolRepository.ts
│   │   │
│   │   └── inMemory/                 # Testing/Development adapters
│   │       ├── InMemoryRouteRepository.ts
│   │       ├── InMemoryBankEntryRepository.ts
│   │       └── InMemoryPoolRepository.ts
│   │
│   ├── http/
│   │   └── express/
│   │       ├── routes/
│   │       │   └── hexagonalRouter.ts  # Express route handlers
│   │       │
│   │       └── dtos/                   # Data Transfer Objects
│   │           ├── RouteDTO.ts
│   │           ├── ComplianceDTO.ts
│   │           ├── BankingDTO.ts
│   │           └── PoolDTO.ts
│   │
│   └── config/
│       └── container.ts              # Dependency injection
│
├── db/                               # Database configuration
│   ├── schema.ts                     # Drizzle schema
│   ├── index.ts                      # Database connection
│   └── seed.ts                       # Database seeding
│
├── data/
│   └── seedRoutes.ts                 # In-memory seed data
│
└── index.ts                          # Application entry point
```

---

## Component Details

### Domain Layer Components

#### 1. Value Objects

**Year.ts**
```typescript
export class Year {
  private constructor(private readonly value: number) {
    if (value < 2020 || value > 2050) {
      throw new Error("Year must be between 2020 and 2050");
    }
  }
  
  static create(value: number): Year {
    return new Year(value);
  }
  
  getValue(): number {
    return this.value;
  }
}
```

**Purpose**: Prevent invalid years, type safety

---

**GHGIntensity.ts**
```typescript
export class GHGIntensity {
  private constructor(private readonly value: number) {
    if (value < 0 || value > 200) {
      throw new Error("GHG intensity must be between 0 and 200");
    }
  }
  
  static create(value: number): GHGIntensity {
    return new GHGIntensity(value);
  }
  
  isCompliant(target: GHGIntensity): boolean {
    return this.value <= target.value;
  }
  
  differenceTo(other: GHGIntensity): number {
    return other.value - this.value;
  }
}
```

**Purpose**: GHG intensity validation, compliance checks

---

**ComplianceBalanceGrams.ts**
```typescript
export class ComplianceBalanceGrams {
  private constructor(private readonly value: number) {}
  
  static create(value: number): ComplianceBalanceGrams {
    return new ComplianceBalanceGrams(value);
  }
  
  isSurplus(): boolean {
    return this.value > 0;
  }
  
  isDeficit(): boolean {
    return this.value < 0;
  }
  
  add(other: ComplianceBalanceGrams): ComplianceBalanceGrams {
    return new ComplianceBalanceGrams(this.value + other.value);
  }
  
  toTonnes(): number {
    return this.value / 1_000_000;
  }
}
```

**Purpose**: Type-safe CB operations, surplus/deficit logic

---

#### 2. Entities

**Route.ts**
```typescript
export class Route {
  private constructor(
    private readonly routeId: string,
    private readonly shipId: string,
    private readonly year: Year,
    private readonly vesselType: string,
    private readonly fuelType: string,
    private ghgIntensity: GHGIntensity,
    private fuelConsumptionTonnes: number,
    private isBaseline: boolean,
    // ... other fields
  ) {}
  
  // Business logic methods
  calculateComplianceBalance(targetIntensity: GHGIntensity): ComplianceBalanceGrams {
    const energy = this.getEnergy();
    const intensityDiff = this.ghgIntensity.differenceTo(targetIntensity);
    return ComplianceBalanceGrams.create(intensityDiff * energy.getValue());
  }
  
  setAsBaseline(): void {
    this.isBaseline = true;
  }
  
  getEnergy(): EnergyMJ {
    return EnergyMJ.fromFuelTonnes(this.fuelConsumptionTonnes);
  }
}
```

**Business Logic**:
- CB calculation: `(target - actual) × energy_MJ`
- Baseline management
- Energy conversion

---

**Pool.ts**
```typescript
export class Pool {
  constructor(
    private readonly id: string,
    private readonly year: number,
    private readonly members: PoolMember[],
    private readonly poolSum: ComplianceBalanceGrams,
    private readonly createdAt?: Date
  ) {
    // Validate pool sum
    if (poolSum.getValue() < 0) {
      throw new Error("Pool sum cannot be negative");
    }
    
    // Apply greedy allocation
    this.applyGreedyAllocation();
  }
  
  private applyGreedyAllocation(): void {
    // Separate surplus and deficits
    const surplus = this.members.filter(m => m.getCBBeforeGrams().isSurplus());
    const deficits = this.members
      .filter(m => m.getCBBeforeGrams().isDeficit())
      .sort((a, b) => a.getCBBeforeGrams().getValue() - b.getCBBeforeGrams().getValue()); // Most negative first
    
    let remainingSurplus = this.poolSum.getValue();
    
    // Allocate to deficits (greedy: highest deficit gets priority)
    for (const deficit of deficits) {
      const deficitAmount = Math.abs(deficit.getCBBeforeGrams().getValue());
      const allocation = Math.min(deficitAmount, remainingSurplus);
      
      const newCB = deficit.getCBBeforeGrams().add(ComplianceBalanceGrams.create(allocation));
      deficit.updateCBAfter(newCB);
      
      remainingSurplus -= allocation;
      if (remainingSurplus <= 0) break;
    }
  }
}
```

**Business Logic**:
- Greedy allocation algorithm (Article 21)
- Pool sum validation
- Automatic CB distribution

---

#### 3. Domain Services

**ComplianceServiceImpl.ts**
```typescript
export class ComplianceServiceImpl implements ComplianceService {
  constructor(
    private routeRepository: RouteRepository,
    private bankEntryRepository: BankEntryRepository
  ) {}
  
  async getShipComplianceBalance(
    shipId: string,
    year: number
  ): Promise<ShipComplianceBalance> {
    // Get all routes for ship in year
    const routes = await this.routeRepository.findByShipAndYear(shipId, year);
    
    // Calculate CB for each route
    const targetIntensity = GHGIntensity.create(89.3368); // 2% below 91.16
    const components = routes.map(route => ({
      routeId: route.getRouteId(),
      cbGrams: route.calculateComplianceBalance(targetIntensity).getValue()
    }));
    
    // Sum total CB
    const totalCB = components.reduce((sum, c) => sum + c.cbGrams, 0);
    
    return ShipComplianceBalance.create({
      shipId,
      year,
      cbGrams: totalCB,
      components
    });
  }
}
```

**Responsibilities**:
- Aggregate route CBs for a ship
- Use target intensity (89.3368 gCO₂e/MJ)
- Return structured compliance data

---

### Infrastructure Layer Components

#### 1. HTTP Adapters (Express)

**hexagonalRouter.ts**
```typescript
export function createRouter(
  routeService: RouteService,
  complianceService: ComplianceService,
  bankingService: BankingService,
  poolingService: PoolingService
): express.Router {
  const router = express.Router();
  
  // Routes endpoint
  router.get("/routes", async (req, res) => {
    try {
      const { shipId, year, vesselType, fuelType } = req.query;
      
      const routes = await routeService.getAllRoutes({
        shipId: shipId as string,
        year: year ? Number(year) : undefined,
        vesselType: vesselType as string,
        fuelType: fuelType as string,
      });
      
      res.json(RouteDTO.fromDomainArray(routes));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // ... more endpoints
  
  return router;
}
```

**Responsibilities**:
- HTTP request/response handling
- Query parameter parsing
- DTO mapping (domain → JSON)
- Error handling

---

**RouteDTO.ts**
```typescript
export class RouteDTO {
  static fromDomain(route: Route) {
    const plain = route.toPlainObject();
    return {
      routeId: plain.routeId,
      shipId: plain.shipId,
      year: plain.year,
      vesselType: plain.vesselType,
      fuelType: plain.fuelType,
      ghgIntensity: plain.ghgIntensity,
      fuelConsumptionTonnes: plain.fuelConsumptionTonnes,
      isBaseline: plain.isBaseline,
    };
  }
  
  static fromDomainArray(routes: Route[]) {
    return routes.map(r => this.fromDomain(r));
  }
}
```

**Purpose**: Convert domain entities to JSON (presentation layer)

---

#### 2. Persistence Adapters

**DrizzleRouteRepository.ts**
```typescript
export class DrizzleRouteRepository implements RouteRepository {
  async findAll(): Promise<Route[]> {
    const rows = await db.select().from(routes);
    return rows.map(row => this.toDomain(row));
  }
  
  async findByShipAndYear(shipId: string, year: number): Promise<Route[]> {
    const rows = await db
      .select()
      .from(routes)
      .where(and(
        eq(routes.shipId, shipId),
        eq(routes.year, year)
      ));
    
    return rows.map(row => this.toDomain(row));
  }
  
  private toDomain(row: any): Route {
    return Route.create({
      routeId: row.routeId,
      shipId: row.shipId,
      year: row.year,
      vesselType: row.vesselType,
      fuelType: row.fuelType,
      ghgIntensity: Number(row.ghgIntensity),
      fuelConsumptionTonnes: Number(row.fuelConsumption),
      isBaseline: row.isBaseline ?? false,
    });
  }
}
```

**Responsibilities**:
- Database queries (Drizzle ORM)
- Row → Domain entity mapping
- Implements RouteRepository interface

---

**InMemoryRouteRepository.ts**
```typescript
export class InMemoryRouteRepository implements RouteRepository {
  private routes: Route[] = [];
  
  constructor() {
    // Initialize with seeded data
    this.routes = seededRoutes.map(r => Route.create({
      routeId: r.routeId,
      shipId: r.shipId,
      year: r.year,
      // ... map all fields
    }));
  }
  
  async findAll(): Promise<Route[]> {
    return [...this.routes]; // Return copy
  }
  
  async findByShipAndYear(shipId: string, year: number): Promise<Route[]> {
    return this.routes.filter(r => 
      r.getShipId() === shipId && r.getYear().getValue() === year
    );
  }
}
```

**Purpose**: In-memory implementation for testing/development

---

#### 3. Dependency Injection

**container.ts**
```typescript
export interface AppContainer {
  routeService: RouteService;
  complianceService: ComplianceService;
  bankingService: BankingService;
  poolingService: PoolingService;
}

export function createContainer(): AppContainer {
  // Auto-detect environment
  const useDatabase = !!process.env.DATABASE_URL;
  
  // Choose repository implementations
  const routeRepository: RouteRepository = useDatabase
    ? new DrizzleRouteRepository()
    : new InMemoryRouteRepository();
  
  const bankEntryRepository: BankEntryRepository = useDatabase
    ? new DrizzleBankEntryRepository()
    : new InMemoryBankEntryRepository();
  
  const poolRepository: PoolRepository = useDatabase
    ? new DrizzlePoolRepository()
    : new InMemoryPoolRepository();
  
  // Wire services with dependencies
  const routeService = new RouteServiceImpl(routeRepository);
  const complianceService = new ComplianceServiceImpl(routeRepository, bankEntryRepository);
  const bankingService = new BankingServiceImpl(bankEntryRepository);
  const poolingService = new PoolingServiceImpl(poolRepository, routeRepository, bankEntryRepository);
  
  return {
    routeService,
    complianceService,
    bankingService,
    poolingService,
  };
}
```

**Responsibilities**:
- Environment detection (DATABASE_URL)
- Adapter selection (Drizzle vs InMemory)
- Service instantiation with dependency injection

---

# Data Flow

## Request Flow: GET /routes

```
1. HTTP Request
   ↓
2. Express Router (hexagonalRouter.ts)
   - Parse query params
   ↓
3. RouteService.getAllRoutes(filters)
   - Use case orchestration
   ↓
4. RouteRepository.findAll() / findByFilters()
   - DrizzleRouteRepository → Postgres query
   - OR InMemoryRouteRepository → Array filter
   ↓
5. Domain Entity Creation
   - Convert DB rows → Route entities
   - Validation via value objects (Year, GHGIntensity)
   ↓
6. Return Route[] to Service
   ↓
7. RouteDTO.fromDomainArray(routes)
   - Convert entities → JSON
   ↓
8. HTTP Response (JSON)
```

---

## Request Flow: POST /banking/bank

```
1. HTTP Request
   - Body: { shipId, year, amount_g }
   ↓
2. Express Router
   - Parse request body
   ↓
3. BankingService.bankSurplus(shipId, year, amount_g)
   ↓
4. Business Logic Validation
   - Check amount_g > 0 (can't bank deficit)
   - Create ComplianceBalanceGrams value object
   ↓
5. BankEntry Entity Creation
   - BankEntry.create({ shipId, year, amount_g, type: "bank" })
   - Validates amount is positive
   ↓
6. BankEntryRepository.create(entry)
   - Persist to database or in-memory store
   ↓
7. BankEntryDTO.fromDomain(entry)
   - Convert entity → JSON
   ↓
8. HTTP Response
   - { ok: true, entry: {...} }
```

---

## Compliance Balance Calculation Flow

```
1. GET /compliance/cb?shipId=S001&year=2024
   ↓
2. ComplianceService.getShipComplianceBalance(S001, 2024)
   ↓
3. RouteRepository.findByShipAndYear(S001, 2024)
   - Returns Route[] entities
   ↓
4. For each Route:
   - route.calculateComplianceBalance(targetIntensity)
   - Formula: (89.3368 - route.ghgIntensity) × route.energy_MJ
   ↓
5. Aggregate Components
   - Sum all route CBs
   - Track per-route breakdown
   ↓
6. Create ShipComplianceBalance Entity
   - shipId, year, total CB, components[]
   ↓
7. ComplianceDTO.fromDomain(balance)
   ↓
8. HTTP Response (JSON)
```

---

## Pool Creation Flow (Greedy Allocation)

```
1. POST /pools
   - Body: { year: 2025, members: [{ shipId, cbGrams }, ...] }
   ↓
2. PoolingService.createPool(year, members)
   ↓
3. Fetch each member's CB
   - For each shipId, get compliance balance
   ↓
4. Calculate Pool Sum
   - Sum of all member CBs
   - Validate: poolSum >= 0 (or throw error)
   ↓
5. Pool Entity Creation
   - Pool.create({ year, members, poolSum })
   ↓
6. Greedy Allocation Algorithm (in Pool constructor)
   a. Separate surplus (CB > 0) and deficits (CB < 0)
   b. Sort deficits: most negative first
   c. Distribute surplus to deficits
      - For each deficit:
        * Allocate min(deficit_amount, remaining_surplus)
        * Update member.cbAfter
        * Reduce remaining_surplus
   d. Result: Deficits covered as much as possible
   ↓
7. PoolRepository.create(pool)
   - Persist pool + members to database
   ↓
8. PoolDTO.fromDomain(pool)
   ↓
9. HTTP Response
   - { ok: true, pool: { members: [{ cbBefore, cbAfter }, ...] } }
```

---

# Component Diagrams

## Hexagonal Architecture Layers

```
┌───────────────────────────────────────────────────────────────┐
│                        HTTP LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  GET /routes                                            │  │
│  │  POST /routes/:routeId/baseline                         │  │
│  │  GET /compliance/cb                                     │  │
│  │  POST /banking/bank                                     │  │
│  │  POST /pools                                            │  │
│  └─────────────────────────────────────────────────────────┘  │
│  Express Router + DTOs (RouteDTO, ComplianceDTO, ...)         │
└───────────────────────────────┬───────────────────────────────┘
                                │ Calls use cases
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                   APPLICATION SERVICES                         │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐      │
│  │ RouteService │  │ComplianceService│  │BankingService│      │
│  └──────────────┘  └────────────────┘  └──────────────┘      │
│  Orchestrate domain logic, coordinate repositories            │
└───────────────────────────────┬───────────────────────────────┘
                                │ Uses domain entities
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ENTITIES                                                │  │
│  │ Route: calculateComplianceBalance()                     │  │
│  │ Pool: applyGreedyAllocation()                           │  │
│  │ BankEntry: validate amount > 0                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ VALUE OBJECTS                                           │  │
│  │ Year(2020-2050), GHGIntensity(0-200), CB(grams)         │  │
│  └─────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ BUSINESS RULES                                          │  │
│  │ - CB = (target - actual) × energy_MJ                    │  │
│  │ - Can only bank positive CB                             │  │
│  │ - Pool sum must be >= 0                                 │  │
│  │ - Greedy allocation: highest deficit first              │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬───────────────────────────────┘
                                │ Depends on port interfaces
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     PORT INTERFACES                            │
│  RouteRepository, BankEntryRepository, PoolRepository          │
│  - findAll(), findByShipAndYear(), create(), etc.             │
└───────────────────────────────┬───────────────────────────────┘
                                │ Implemented by adapters
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                  PERSISTENCE ADAPTERS                          │
│  ┌────────────────────┐         ┌────────────────────┐        │
│  │ DrizzleRepository  │         │ InMemoryRepository │        │
│  │ (Postgres)         │         │ (Testing/Dev)      │        │
│  │ - SQL queries      │         │ - Array operations │        │
│  │ - Row mapping      │         │ - Seeded data      │        │
│  └────────────────────┘         └────────────────────┘        │
└───────────────────────────────────────────────────────────────┘
```

---

## Dependency Injection Flow

```
index.ts (Entry Point)
    ↓
createContainer()
    ↓
    ├─ Detect DATABASE_URL?
    │    ├─ Yes → new DrizzleRouteRepository()
    │    └─ No  → new InMemoryRouteRepository()
    ↓
    ├─ new RouteServiceImpl(routeRepository)
    ├─ new ComplianceServiceImpl(routeRepository, bankEntryRepository)
    ├─ new BankingServiceImpl(bankEntryRepository)
    └─ new PoolingServiceImpl(poolRepository, routeRepository, bankEntryRepository)
    ↓
createRouter(routeService, complianceService, bankingService, poolingService)
    ↓
app.use("/", router)
    ↓
app.listen(4000)
```

---

# API Documentation

## Endpoints

### 1. Routes

#### GET /routes
Get all routes with optional filters

**Query Parameters**:
- `shipId` (optional): Filter by ship
- `year` (optional): Filter by year
- `vesselType` (optional): Filter by vessel type
- `fuelType` (optional): Filter by fuel type

**Response**:
```json
[
  {
    "routeId": "R001",
    "shipId": "S001",
    "year": 2024,
    "vesselType": "Container",
    "fuelType": "HFO",
    "ghgIntensity": 91.0,
    "fuelConsumptionTonnes": 5000,
    "isBaseline": true
  }
]
```

---

#### POST /routes/:routeId/baseline
Set a route as baseline

**URL Parameters**:
- `routeId`: Route ID

**Response**:
```json
{
  "ok": true,
  "message": "Route R001 set as baseline"
}
```

---

### 2. Comparison

#### GET /routes/comparison
Compare baseline vs other routes

**Query Parameters**:
- `year` (optional): Filter by year

**Response**:
```json
[
  {
    "baseline": { "routeId": "R001", "ghgIntensity": 91.0, ... },
    "comparison": { "routeId": "R002", "ghgIntensity": 88.0, ... },
    "intensityDiff": -3.0,
    "better": true
  }
]
```

---

### 3. Compliance

#### GET /compliance/cb
Get ship compliance balances

**Query Parameters**:
- `shipId` (required): Ship ID
- `year` (required): Year

**Response**:
```json
{
  "shipId": "S001",
  "year": 2024,
  "cbGrams": -340950000,
  "cbTonnes": -340.95,
  "components": [
    { "routeId": "R001", "cbGrams": -340950000 }
  ]
}
```

**Formula**: `CB = (89.3368 - ghgIntensity) × fuelConsumption × 41000`

---

#### GET /compliance/adjusted-cb
Get adjusted CB after banking/pooling

**Query Parameters**:
- `shipId` (required): Ship ID
- `year` (required): Year

**Response**:
```json
{
  "shipId": "S001",
  "year": 2024,
  "originalCB": -340.95,
  "bankedApplied": 100.0,
  "pooledReceived": 50.0,
  "adjustedCB": -190.95
}
```

---

### 4. Banking

#### GET /banking/records
Get bank entries

**Query Parameters**:
- `shipId` (optional): Filter by ship
- `year` (optional): Filter by year

**Response**:
```json
[
  {
    "id": "1",
    "shipId": "S001",
    "year": 2024,
    "amountGrams": 50000000,
    "amountTonnes": 50.0,
    "type": "bank",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### POST /banking/bank
Bank surplus CB (Article 20)

**Request Body**:
```json
{
  "shipId": "S001",
  "year": 2024,
  "amount_g": 50000000
}
```

**Business Rule**: `amount_g` must be > 0 (can't bank deficit)

**Response**:
```json
{
  "ok": true,
  "entry": {
    "id": "1",
    "shipId": "S001",
    "year": 2024,
    "amountGrams": 50000000,
    "type": "bank"
  }
}
```

---

#### POST /banking/apply
Apply banked CB

**Request Body**:
```json
{
  "shipId": "S001",
  "year": 2025,
  "amount_g": 30000000
}
```

**Business Rule**: `amount_g` ≤ available balance

**Response**:
```json
{
  "ok": true,
  "entry": {
    "id": "2",
    "shipId": "S001",
    "year": 2025,
    "amountGrams": 30000000,
    "type": "apply"
  }
}
```

---

### 5. Pooling

#### POST /pools
Create compliance pool (Article 21)

**Request Body**:
```json
{
  "year": 2025,
  "members": [
    { "shipId": "S001", "cbGrams": -500000 },
    { "shipId": "S002", "cbGrams": 800000 }
  ]
}
```

**Business Rules**:
- Pool sum (total of all member CBs) must be ≥ 0
- Greedy allocation: Surplus distributed to highest deficits first

**Response**:
```json
{
  "ok": true,
  "pool": {
    "id": "1",
    "year": 2025,
    "poolSum": 300000,
    "members": [
      {
        "shipId": "S001",
        "cbBeforeGrams": -500000,
        "cbAfterGrams": 0,
        "allocationGrams": 500000
      },
      {
        "shipId": "S002",
        "cbBeforeGrams": 800000,
        "cbAfterGrams": 300000,
        "allocationGrams": -500000
      }
    ]
  }
}
```

---

# Business Rules

## FuelEU Maritime Regulation

### 1. Target Intensity
```typescript
const TARGET_INTENSITY = 89.3368; // gCO₂e/MJ (2% below 91.16)
```

**Source**: FuelEU Maritime target for 2025

---

### 2. Energy Conversion
```typescript
const ENERGY_PER_TONNE = 41_000; // MJ/tonne fuel
```

**Formula**: `Energy (MJ) = Fuel Consumption (tonnes) × 41,000`

---

### 3. Compliance Balance Calculation
```typescript
CB (grams) = (Target Intensity - Actual Intensity) × Energy (MJ)
CB (tonnes) = CB (grams) / 1,000,000
```

**Example**:
- Actual GHG: 91.0 gCO₂e/MJ
- Fuel: 5,000 tonnes
- Energy: 5,000 × 41,000 = 205,000,000 MJ
- CB: (89.3368 - 91.0) × 205,000,000 = **-340,950,000 grams** (deficit)
- CB: -340,950,000 / 1,000,000 = **-340.95 tonnes**

---

### 4. Banking Rules (Article 20)

**Rule 1**: Can only bank **positive** CB (surplus)
```typescript
if (amount_g <= 0) {
  throw new Error("Can only bank positive compliance balance surplus");
}
```

**Rule 2**: Available balance = Total banked - Total applied
```typescript
const totalBanked = entries.filter(e => e.type === "bank").reduce(...);
const totalApplied = entries.filter(e => e.type === "apply").reduce(...);
const available = totalBanked - totalApplied;
```

**Rule 3**: Cannot apply more than available
```typescript
if (amount_g > available) {
  throw new Error(`Insufficient banked CB. Available: ${available}`);
}
```

---

### 5. Pooling Rules (Article 21)

**Rule 1**: Pool sum must be non-negative
```typescript
const poolSum = members.reduce((sum, m) => sum + m.cbGrams, 0);
if (poolSum < 0) {
  throw new Error("Pool sum cannot be negative");
}
```

**Rule 2**: Greedy Allocation Algorithm
```
1. Separate members into:
   - Surplus: CB > 0
   - Deficits: CB < 0

2. Sort deficits by amount (most negative first)

3. Distribute surplus to deficits:
   FOR each deficit (in sorted order):
     allocation = MIN(deficit_amount, remaining_surplus)
     deficit.cbAfter = deficit.cbBefore + allocation
     remaining_surplus -= allocation
     IF remaining_surplus == 0: BREAK

4. Result: Deficits covered as much as possible
```

**Example**:
```
Members:
- S001: -500,000 g (deficit)
- S002: +800,000 g (surplus)

Pool Sum: 300,000 g (valid, ≥ 0)

Allocation:
- S001 receives: 500,000 g → cbAfter = 0 g
- S002 gives: 500,000 g → cbAfter = 300,000 g

Result: S001's deficit fully covered, S002 keeps 300k surplus
```

---

## Validation Rules

### Year Validation
```typescript
Year must be: 2020 ≤ year ≤ 2050
```

### GHG Intensity Validation
```typescript
GHG intensity must be: 0 ≤ intensity ≤ 200 gCO₂e/MJ
```

### Fuel Consumption Validation
```typescript
Fuel consumption must be: > 0 tonnes
```

---

# Testing Guide

## Unit Testing (Domain Layer)

**Test Value Objects**:
```typescript
describe("Year", () => {
  it("should accept valid year", () => {
    const year = Year.create(2025);
    expect(year.getValue()).toBe(2025);
  });
  
  it("should reject year < 2020", () => {
    expect(() => Year.create(2019)).toThrow();
  });
});
```

**Test Entities**:
```typescript
describe("Route.calculateComplianceBalance", () => {
  it("should calculate surplus for low GHG intensity", () => {
    const route = Route.create({
      ghgIntensity: 85.0, // Below target (89.3368)
      fuelConsumptionTonnes: 1000,
      // ... other fields
    });
    
    const target = GHGIntensity.create(89.3368);
    const cb = route.calculateComplianceBalance(target);
    
    expect(cb.isSurplus()).toBe(true);
  });
});
```

---

## Integration Testing (Services + Repositories)

**Test with InMemory repositories**:
```typescript
describe("ComplianceService", () => {
  it("should calculate ship CB from multiple routes", async () => {
    const routeRepo = new InMemoryRouteRepository();
    const bankRepo = new InMemoryBankEntryRepository();
    const service = new ComplianceServiceImpl(routeRepo, bankRepo);
    
    const balance = await service.getShipComplianceBalance("S001", 2024);
    
    expect(balance.getShipId()).toBe("S001");
    expect(balance.getCBGrams()).toBeLessThan(0); // Deficit
  });
});
```

---

## E2E Testing (HTTP API)

**Test endpoints**:
```bash
# Test routes
curl http://localhost:4000/routes

# Test banking validation
curl -X POST http://localhost:4000/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId": "S001", "year": 2025, "amount_g": -1000}'
# Expected: 400 error "Can only bank positive CB"

# Test pooling
curl -X POST http://localhost:4000/pools \
  -H "Content-Type: application/json" \
  -d '{"year": 2025, "members": [...]}'
```

---

# Summary

## Key Achievements

✅ **Clean Architecture**: Hexagonal pattern with clear boundaries
✅ **Framework Independence**: Domain has zero external dependencies
✅ **Testability**: Can test business logic without infrastructure
✅ **Flexibility**: Swappable adapters (Drizzle ↔ InMemory)
✅ **Type Safety**: Value objects prevent invalid states
✅ **Business Rules**: All FuelEU compliance logic encapsulated
✅ **Production Ready**: Auto-detects environment, DI container

---

## Architecture Benefits

| Aspect | Before (Layered) | After (Hexagonal) |
|--------|------------------|-------------------|
| Domain Logic | Mixed with HTTP/DB | Isolated in entities |
| Testing | Requires Express + DB | Pure TypeScript |
| Framework Coupling | Tight (Express, Drizzle) | None (domain layer) |
| Adapter Swapping | Hard (rewrite routes) | Easy (implement interface) |
| Business Rules | Scattered | Centralized in domain |
| Type Safety | Partial | Full (value objects) |

---

**Documentation Version**: 1.0  
**Last Updated**: November 7, 2025  
**Architecture**: Hexagonal (Ports & Adapters)
