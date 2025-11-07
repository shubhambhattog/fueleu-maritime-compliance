import { BankEntry, BankingBalance } from "../../entities/BankEntry";

/**
 * Banking Service Port (Inbound)
 * Defines use cases for Article 20 - Banking and Borrowing
 */

export interface BankingService {
  /**
   * Get all banking entries for a ship in a specific year
   */
  getBankingRecords(shipId: string, year: number): Promise<BankEntry[]>;

  /**
   * Get available banking balance (total_banked - total_applied)
   */
  getAvailableBalance(shipId: string, year: number): Promise<BankingBalance>;

  /**
   * Bank positive compliance surplus
   * Business rule: CB must be positive (surplus)
   */
  bankSurplus(shipId: string, year: number, amountGrams: number): Promise<BankEntry>;

  /**
   * Apply banked surplus to cover deficit
   * Business rules:
   * - Amount must be positive
   * - Amount must not exceed available balance
   */
  applyBankedSurplus(shipId: string, year: number, amountGrams: number): Promise<BankEntry>;
}
