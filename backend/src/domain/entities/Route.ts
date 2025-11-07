import { Year } from "../valueObjects/Year";
import { GHGIntensity } from "../valueObjects/GHGIntensity";
import { EnergyMJ } from "../valueObjects/EnergyMJ";
import { ComplianceBalanceGrams } from "../valueObjects/ComplianceBalanceGrams";

/**
 * Route Entity
 * Represents a maritime route with vessel and fuel information
 * Contains business logic for compliance calculations
 */
export class Route {
  private constructor(
    private readonly routeId: string,
    private readonly shipId: string,
    private readonly year: Year,
    private readonly vesselType: string,
    private readonly fuelType: string,
    private readonly ghgIntensity: GHGIntensity,
    private readonly fuelConsumptionTonnes: number,
    private readonly distanceKm: number | undefined,
    private readonly totalEmissions: number | undefined,
    private isBaseline: boolean
  ) {}

  public static create(props: {
    routeId: string;
    shipId: string;
    year: number;
    vesselType: string;
    fuelType: string;
    ghgIntensity: number;
    fuelConsumptionTonnes: number;
    distanceKm?: number;
    totalEmissions?: number;
    isBaseline?: boolean;
  }): Route {
    return new Route(
      props.routeId,
      props.shipId,
      Year.create(props.year),
      props.vesselType,
      props.fuelType,
      GHGIntensity.create(props.ghgIntensity),
      props.fuelConsumptionTonnes,
      props.distanceKm,
      props.totalEmissions,
      props.isBaseline ?? false
    );
  }

  // Getters
  public getRouteId(): string {
    return this.routeId;
  }

  public getShipId(): string {
    return this.shipId;
  }

  public getYear(): Year {
    return this.year;
  }

  public getVesselType(): string {
    return this.vesselType;
  }

  public getFuelType(): string {
    return this.fuelType;
  }

  public getGHGIntensity(): GHGIntensity {
    return this.ghgIntensity;
  }

  public getFuelConsumptionTonnes(): number {
    return this.fuelConsumptionTonnes;
  }

  public getDistanceKm(): number | undefined {
    return this.distanceKm;
  }

  public getTotalEmissions(): number | undefined {
    return this.totalEmissions;
  }

  public getIsBaseline(): boolean {
    return this.isBaseline;
  }

  // Business logic
  public setAsBaseline(): void {
    this.isBaseline = true;
  }

  public removeBaseline(): void {
    this.isBaseline = false;
  }

  public getEnergy(): EnergyMJ {
    return EnergyMJ.fromFuelTonnes(this.fuelConsumptionTonnes);
  }

  /**
   * Calculates compliance balance for this route
   * CB = (Target GHG Intensity - Actual GHG Intensity) × Energy in scope
   */
  public calculateComplianceBalance(targetIntensity: GHGIntensity): ComplianceBalanceGrams {
    const energy = this.getEnergy();
    const intensityDiff = this.ghgIntensity.differenceTo(targetIntensity);
    const cb_g = intensityDiff * energy.getValue();
    return ComplianceBalanceGrams.create(cb_g);
  }

  /**
   * Compare this route's GHG intensity with another
   * Returns percentage difference: ((comparison / baseline) - 1) × 100
   */
  public compareIntensityWith(other: Route): number {
    const baselineValue = this.ghgIntensity.getValue();
    const comparisonValue = other.ghgIntensity.getValue();
    if (baselineValue === 0) return 0;
    return ((comparisonValue / baselineValue) - 1) * 100;
  }

  /**
   * Check if this route belongs to a ship in a specific year
   */
  public belongsToShipInYear(shipId: string, year: Year): boolean {
    return this.shipId === shipId && this.year.equals(year);
  }

  public toPlainObject() {
    return {
      routeId: this.routeId,
      shipId: this.shipId,
      year: this.year.getValue(),
      vesselType: this.vesselType,
      fuelType: this.fuelType,
      ghgIntensity: this.ghgIntensity.getValue(),
      fuelConsumptionTonnes: this.fuelConsumptionTonnes,
      distanceKm: this.distanceKm,
      totalEmissions: this.totalEmissions,
      isBaseline: this.isBaseline,
    };
  }
}
