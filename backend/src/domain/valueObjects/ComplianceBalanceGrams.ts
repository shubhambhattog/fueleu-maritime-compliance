/**
 * Compliance Balance Value Object
 * Represents compliance balance in grams of CO₂ equivalent
 * Positive = surplus, Negative = deficit
 */
export class ComplianceBalanceGrams {
  private readonly value: number; // grams of CO₂eq

  private constructor(value: number) {
    this.value = value;
  }

  public static create(value: number): ComplianceBalanceGrams {
    return new ComplianceBalanceGrams(value);
  }

  public static zero(): ComplianceBalanceGrams {
    return new ComplianceBalanceGrams(0);
  }

  public getValue(): number {
    return this.value;
  }

  public toTonnes(): number {
    return this.value / 1_000_000;
  }

  public isSurplus(): boolean {
    return this.value > 0;
  }

  public isDeficit(): boolean {
    return this.value < 0;
  }

  public isZero(): boolean {
    return Math.abs(this.value) < 0.01; // tolerance for floating point
  }

  public add(other: ComplianceBalanceGrams): ComplianceBalanceGrams {
    return new ComplianceBalanceGrams(this.value + other.value);
  }

  public subtract(other: ComplianceBalanceGrams): ComplianceBalanceGrams {
    return new ComplianceBalanceGrams(this.value - other.value);
  }

  public abs(): ComplianceBalanceGrams {
    return new ComplianceBalanceGrams(Math.abs(this.value));
  }

  public equals(other: ComplianceBalanceGrams): boolean {
    return Math.abs(this.value - other.value) < 0.01;
  }

  public toString(): string {
    const sign = this.value >= 0 ? "+" : "";
    return `${sign}${this.toTonnes().toFixed(2)} tonnes CO₂eq`;
  }
}
