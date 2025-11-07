import { BankingService } from "../ports/inbound/BankingService";
import { BankEntryRepository } from "../ports/outbound/BankEntryRepository";
import { RouteRepository } from "../ports/outbound/RouteRepository";
import { BankEntry, BankingBalance } from "../entities/BankEntry";
import { ComplianceServiceImpl } from "./ComplianceServiceImpl";

/**
 * Banking Service Implementation
 * Implements Article 20 - Banking and Borrowing use cases
 */
export class BankingServiceImpl implements BankingService {
  constructor(
    private readonly bankEntryRepository: BankEntryRepository,
    private readonly routeRepository: RouteRepository
  ) {}

  async getBankingRecords(shipId: string, year: number): Promise<BankEntry[]> {
    return this.bankEntryRepository.findByShipAndYear(shipId, year);
  }

  async getAvailableBalance(shipId: string, year: number): Promise<BankingBalance> {
    const entries = await this.bankEntryRepository.findByShipAndYear(shipId, year);
    return BankingBalance.calculate(shipId, year, entries);
  }

  async bankSurplus(shipId: string, year: number, amountGrams: number): Promise<BankEntry> {
    // Validate: amount must be positive
    if (amountGrams <= 0) {
      throw new Error("Banking amount must be positive");
    }

    // Validate: ship must have surplus CB
    const complianceService = new ComplianceServiceImpl(
      this.routeRepository,
      this.bankEntryRepository
    );
    const shipCompliance = await complianceService.computeComplianceBalance(shipId, year);

    if (!shipCompliance.canBank()) {
      throw new Error(
        `Ship ${shipId} has deficit CB (${shipCompliance.getComplianceBalanceTonnes().toFixed(2)} tonnes), cannot bank surplus`
      );
    }

    // Validate: amount doesn't exceed available surplus
    const availableSurplus = shipCompliance.getComplianceBalanceGrams().getValue();
    if (amountGrams > availableSurplus) {
      throw new Error(
        `Banking amount (${amountGrams} g) exceeds available surplus (${availableSurplus} g)`
      );
    }

    // Create bank entry
    const entry = BankEntry.create({
      id: `B-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      shipId,
      year,
      amountGrams,
      type: "bank",
    });

    return this.bankEntryRepository.create(entry);
  }

  async applyBankedSurplus(shipId: string, year: number, amountGrams: number): Promise<BankEntry> {
    // Validate: amount must be positive
    if (amountGrams <= 0) {
      throw new Error("Apply amount must be positive");
    }

    // Get available balance
    const balance = await this.getAvailableBalance(shipId, year);

    // Validate: amount doesn't exceed available
    if (amountGrams > balance.getAvailable().getValue()) {
      throw new Error(
        `Apply amount (${amountGrams} g) exceeds available banked surplus (${balance.getAvailable().getValue()} g)`
      );
    }

    // Create apply entry
    const entry = BankEntry.create({
      id: `A-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      shipId,
      year,
      amountGrams,
      type: "apply",
    });

    return this.bankEntryRepository.create(entry);
  }
}
