import { Year } from "../valueObjects/Year";
import { ComplianceBalanceGrams } from "../valueObjects/ComplianceBalanceGrams";

export type BankEntryType = "bank" | "apply";

/**
 * Bank Entry Entity
 * Represents a banking operation (Article 20 - Banking and Borrowing)
 * Immutable - banking entries cannot be modified once created
 */
export class BankEntry {
  private constructor(
    private readonly id: string,
    private readonly shipId: string,
    private readonly year: Year,
    private readonly amountGrams: ComplianceBalanceGrams,
    private readonly type: BankEntryType,
    private readonly createdAt: Date
  ) {}

  public static create(props: {
    id: string;
    shipId: string;
    year: number;
    amountGrams: number;
    type: BankEntryType;
    createdAt?: Date;
  }): BankEntry {
    const amount = ComplianceBalanceGrams.create(props.amountGrams);
    
    // Business rule validation
    if (props.type === "bank" && amount.isDeficit()) {
      throw new Error("Cannot bank a negative compliance balance");
    }
    if (props.type === "apply" && amount.isDeficit()) {
      throw new Error("Cannot apply a negative amount");
    }

    return new BankEntry(
      props.id,
      props.shipId,
      Year.create(props.year),
      amount,
      props.type,
      props.createdAt || new Date()
    );
  }

  public getId(): string {
    return this.id;
  }

  public getShipId(): string {
    return this.shipId;
  }

  public getYear(): Year {
    return this.year;
  }

  public getAmountGrams(): ComplianceBalanceGrams {
    return this.amountGrams;
  }

  public getType(): BankEntryType {
    return this.type;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public isBankOperation(): boolean {
    return this.type === "bank";
  }

  public isApplyOperation(): boolean {
    return this.type === "apply";
  }

  public toPlainObject() {
    return {
      id: this.id,
      shipId: this.shipId,
      year: this.year.getValue(),
      amount_g: this.amountGrams.getValue(),
      type: this.type,
      createdAt: this.createdAt.toISOString(),
    };
  }
}

/**
 * Banking Balance
 * Represents the calculated available banking balance for a ship in a year
 */
export class BankingBalance {
  private constructor(
    private readonly shipId: string,
    private readonly year: Year,
    private readonly totalBanked: ComplianceBalanceGrams,
    private readonly totalApplied: ComplianceBalanceGrams,
    private readonly available: ComplianceBalanceGrams
  ) {}

  public static calculate(
    shipId: string,
    year: number,
    entries: BankEntry[]
  ): BankingBalance {
    const yearObj = Year.create(year);
    
    // Sum up all banked amounts
    const totalBanked = entries
      .filter(e => e.getType() === "bank" && e.getYear().equals(yearObj))
      .reduce(
        (sum, entry) => sum.add(entry.getAmountGrams()),
        ComplianceBalanceGrams.zero()
      );

    // Sum up all applied amounts
    const totalApplied = entries
      .filter(e => e.getType() === "apply" && e.getYear().equals(yearObj))
      .reduce(
        (sum, entry) => sum.add(entry.getAmountGrams()),
        ComplianceBalanceGrams.zero()
      );

    // Calculate available
    const available = totalBanked.subtract(totalApplied);

    return new BankingBalance(shipId, yearObj, totalBanked, totalApplied, available);
  }

  public getShipId(): string {
    return this.shipId;
  }

  public getYear(): Year {
    return this.year;
  }

  public getTotalBanked(): ComplianceBalanceGrams {
    return this.totalBanked;
  }

  public getTotalApplied(): ComplianceBalanceGrams {
    return this.totalApplied;
  }

  public getAvailable(): ComplianceBalanceGrams {
    return this.available;
  }

  public canBank(amount: ComplianceBalanceGrams): boolean {
    return amount.isSurplus();
  }

  public canApply(amount: ComplianceBalanceGrams): boolean {
    if (amount.isDeficit()) return false;
    return amount.getValue() <= this.available.getValue();
  }

  public toPlainObject() {
    return {
      shipId: this.shipId,
      year: this.year.getValue(),
      totalBanked: this.totalBanked.getValue(),
      totalApplied: this.totalApplied.getValue(),
      available: this.available.getValue(),
    };
  }
}
