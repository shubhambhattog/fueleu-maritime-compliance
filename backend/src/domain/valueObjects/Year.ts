/**
 * Year Value Object
 * Represents a calendar year with business rule validation
 */
export class Year {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  public static create(value: number): Year {
    if (!Number.isInteger(value)) {
      throw new Error("Year must be an integer");
    }
    if (value < 2020 || value > 2050) {
      throw new Error("Year must be between 2020 and 2050 (FuelEU regulation period)");
    }
    return new Year(value);
  }

  public getValue(): number {
    return this.value;
  }

  public equals(other: Year): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value.toString();
  }
}
