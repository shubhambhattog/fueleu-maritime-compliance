/**
 * Dependency Injection Container
 * Wires together all dependencies for hexagonal architecture
 */

// Domain Services
import { RouteService } from "../../domain/ports/inbound/RouteService";
import { ComplianceService } from "../../domain/ports/inbound/ComplianceService";
import { BankingService } from "../../domain/ports/inbound/BankingService";
import { PoolingService } from "../../domain/ports/inbound/PoolingService";

import { RouteServiceImpl } from "../../domain/services/RouteServiceImpl";
import { ComplianceServiceImpl } from "../../domain/services/ComplianceServiceImpl";
import { BankingServiceImpl } from "../../domain/services/BankingServiceImpl";
import { PoolingServiceImpl } from "../../domain/services/PoolingServiceImpl";

// Repositories
import { RouteRepository } from "../../domain/ports/outbound/RouteRepository";
import { BankEntryRepository } from "../../domain/ports/outbound/BankEntryRepository";
import { PoolRepository } from "../../domain/ports/outbound/PoolRepository";

// Drizzle Implementations
import { DrizzleRouteRepository } from "../persistence/drizzle/DrizzleRouteRepository";
import { DrizzleBankEntryRepository } from "../persistence/drizzle/DrizzleBankEntryRepository";
import { DrizzlePoolRepository } from "../persistence/drizzle/DrizzlePoolRepository";

// In-Memory Implementations
import { InMemoryRouteRepository } from "../persistence/inMemory/InMemoryRouteRepository";
import { InMemoryBankEntryRepository } from "../persistence/inMemory/InMemoryBankEntryRepository";
import { InMemoryPoolRepository } from "../persistence/inMemory/InMemoryPoolRepository";

/**
 * Application Container
 * Contains all wired dependencies
 */
export interface AppContainer {
  // Services (Inbound Ports)
  routeService: RouteService;
  complianceService: ComplianceService;
  bankingService: BankingService;
  poolingService: PoolingService;

  // Repositories (Outbound Ports)
  routeRepository: RouteRepository;
  bankEntryRepository: BankEntryRepository;
  poolRepository: PoolRepository;
}

/**
 * Create Application Container
 * Automatically detects environment and wires appropriate implementations
 */
export function createContainer(): AppContainer {
  const useDatabase = !!process.env.DATABASE_URL;

  console.log(`
🏗️  Hexagonal Architecture Initialized
   Storage Mode: ${useDatabase ? "DATABASE (Postgres + Drizzle)" : "IN-MEMORY (Seed Data)"}
   Domain Layer: ✅ Framework-independent business logic
   Infrastructure: ✅ ${useDatabase ? "Drizzle ORM" : "In-Memory"} adapters
  `);

  // Choose repository implementations based on environment
  const routeRepository: RouteRepository = useDatabase
    ? new DrizzleRouteRepository()
    : new InMemoryRouteRepository();

  const bankEntryRepository: BankEntryRepository = useDatabase
    ? new DrizzleBankEntryRepository()
    : new InMemoryBankEntryRepository();

  const poolRepository: PoolRepository = useDatabase
    ? new DrizzlePoolRepository()
    : new InMemoryPoolRepository();

  // Wire up domain services with repositories (Dependency Injection)
  const routeService: RouteService = new RouteServiceImpl(routeRepository);

  const complianceService: ComplianceService = new ComplianceServiceImpl(
    routeRepository,
    bankEntryRepository
  );

  const bankingService: BankingService = new BankingServiceImpl(
    bankEntryRepository,
    routeRepository
  );

  const poolingService: PoolingService = new PoolingServiceImpl(
    poolRepository,
    routeRepository,
    bankEntryRepository
  );

  return {
    // Services
    routeService,
    complianceService,
    bankingService,
    poolingService,
    // Repositories
    routeRepository,
    bankEntryRepository,
    poolRepository,
  };
}
