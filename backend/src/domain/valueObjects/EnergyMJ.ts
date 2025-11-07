/**
 * Energy Value Object
 * Represents energy in megajoules (MJ)
 */
export class EnergyMJ {
  private readonly value: number; // MJ
  private static readonly MJ_PER_TONNE = 41000; // FuelEU standard: 41,000 MJ/tonne

  private constructor(value: number) {
    this.value = value;
  }

  public static create(value: number): EnergyMJ {
    if (value < 0) {
      throw new Error("Energy cannot be negative");
    }
    return new EnergyMJ(value);
  }

  public static fromFuelTonnes(tonnes: number): EnergyMJ {
    if (tonnes < 0) {
      throw new Error("Fuel consumption cannot be negative");
    }
    return new EnergyMJ(tonnes * EnergyMJ.MJ_PER_TONNE);
  }

  public getValue(): number {
    return this.value;
  }

  public toGigajoules(): number {
    return this.value / 1000;
  }

  public add(other: EnergyMJ): EnergyMJ {
    return new EnergyMJ(this.value + other.value);
  }

  public equals(other: EnergyMJ): boolean {
    return Math.abs(this.value - other.value) < 0.01; // floating point tolerance
  }

  public toString(): string {
    return `${this.value.toLocaleString()} MJ`;
  }
}
