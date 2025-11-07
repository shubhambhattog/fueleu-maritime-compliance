/**
 * GHG Intensity Value Object
 * Represents greenhouse gas intensity in gCO₂e/MJ
 */
export class GHGIntensity {
  private readonly value: number; // gCO₂e/MJ

  private constructor(value: number) {
    this.value = value;
  }

  public static create(value: number): GHGIntensity {
    if (value < 0) {
      throw new Error("GHG Intensity cannot be negative");
    }
    if (value > 200) {
      throw new Error("GHG Intensity seems unrealistic (> 200 gCO₂e/MJ)");
    }
    return new GHGIntensity(value);
  }

  public getValue(): number {
    return this.value;
  }

  public isCompliant(target: GHGIntensity): boolean {
    return this.value <= target.value;
  }

  public differenceTo(target: GHGIntensity): number {
    return target.value - this.value;
  }

  public equals(other: GHGIntensity): boolean {
    return Math.abs(this.value - other.value) < 0.0001; // floating point tolerance
  }

  public toString(): string {
    return `${this.value.toFixed(4)} gCO₂e/MJ`;
  }
}
