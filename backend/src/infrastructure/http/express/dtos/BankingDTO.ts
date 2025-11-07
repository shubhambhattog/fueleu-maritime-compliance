import { BankEntry, BankingBalance } from "../../../../domain/entities/BankEntry";

/**
 * Banking Data Transfer Objects
 */
export class BankEntryDTO {
  static fromDomain(entry: BankEntry) {
    return entry.toPlainObject();
  }

  static fromDomainArray(entries: BankEntry[]) {
    return entries.map(this.fromDomain);
  }
}

export class BankingBalanceDTO {
  static fromDomain(balance: BankingBalance) {
    return balance.toPlainObject();
  }
}
