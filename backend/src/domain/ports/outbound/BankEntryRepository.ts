import { BankEntry } from "../../entities/BankEntry";

/**
 * Bank Entry Repository Port (Outbound)
 * Contract for banking data persistence
 */
export interface BankEntryRepository {
  /**
   * Find all bank entries for a ship in a specific year
   */
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;

  /**
   * Find a bank entry by ID
   */
  findById(id: string): Promise<BankEntry | null>;

  /**
   * Create a new bank entry
   */
  create(entry: BankEntry): Promise<BankEntry>;

  /**
   * Find all bank entries (optional - for admin)
   */
  findAll(): Promise<BankEntry[]>;
}
