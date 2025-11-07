import { Year } from "../valueObjects/Year";
import { ComplianceBalanceGrams } from "../valueObjects/ComplianceBalanceGrams";

/**
 * Ship Entity
 * Represents a ship with compliance tracking
 */
export class Ship {
  private constructor(
    private readonly shipId: string,
    private readonly name: string | undefined
  ) {}

  public static create(shipId: string, name?: string): Ship {
    if (!shipId || shipId.trim().length === 0) {
      throw new Error("Ship ID cannot be empty");
    }
    return new Ship(shipId, name);
  }

  public getShipId(): string {
    return this.shipId;
  }

  public getName(): string | undefined {
    return this.name;
  }

  public toPlainObject() {
    return {
      shipId: this.shipId,
      name: this.name,
    };
  }
}

/**
 * Ship Compliance Balance Entity
 * Represents the aggregated compliance balance for a ship in a specific year
 */
export class ShipComplianceBalance {
  private constructor(
    private readonly shipId: string,
    private readonly year: Year,
    private readonly complianceBalanceGrams: ComplianceBalanceGrams,
    private readonly components: ComplianceComponent[],
    private readonly computedAt: Date
  ) {}

  public static create(props: {
    shipId: string;
    year: number;
    complianceBalanceGrams: number;
    components: Array<{
      routeId: string;
      ghgIntensity: number;
      fuelTonnes: number;
      energyMJ: number;
      cb_g: number;
    }>;
    computedAt?: Date;
  }): ShipComplianceBalance {
    return new ShipComplianceBalance(
      props.shipId,
      Year.create(props.year),
      ComplianceBalanceGrams.create(props.complianceBalanceGrams),
      props.components.map(c => new ComplianceComponent(
        c.routeId,
        c.ghgIntensity,
        c.fuelTonnes,
        c.energyMJ,
        ComplianceBalanceGrams.create(c.cb_g)
      )),
      props.computedAt || new Date()
    );
  }

  public getShipId(): string {
    return this.shipId;
  }

  public getYear(): Year {
    return this.year;
  }

  public getComplianceBalanceGrams(): ComplianceBalanceGrams {
    return this.complianceBalanceGrams;
  }

  public getComplianceBalanceTonnes(): number {
    return this.complianceBalanceGrams.toTonnes();
  }

  public getComponents(): ReadonlyArray<ComplianceComponent> {
    return this.components;
  }

  public getComputedAt(): Date {
    return this.computedAt;
  }

  public isSurplus(): boolean {
    return this.complianceBalanceGrams.isSurplus();
  }

  public isDeficit(): boolean {
    return this.complianceBalanceGrams.isDeficit();
  }

  public canBank(): boolean {
    return this.isSurplus();
  }

  public canApply(): boolean {
    return this.isDeficit();
  }

  public toPlainObject() {
    return {
      shipId: this.shipId,
      year: this.year.getValue(),
      cb_g: this.complianceBalanceGrams.getValue(),
      cb_t: this.getComplianceBalanceTonnes(),
      components: this.components.map(c => c.toPlainObject()),
      computedAt: this.computedAt.toISOString(),
    };
  }
}

/**
 * Compliance Component
 * Represents a single route's contribution to ship compliance balance
 */
export class ComplianceComponent {
  constructor(
    public readonly routeId: string,
    public readonly ghgIntensity: number,
    public readonly fuelTonnes: number,
    public readonly energyMJ: number,
    public readonly cb: ComplianceBalanceGrams
  ) {}

  public toPlainObject() {
    return {
      routeId: this.routeId,
      ghgIntensity: this.ghgIntensity,
      fuelTonnes: this.fuelTonnes,
      energyMJ: this.energyMJ,
      cb_g: this.cb.getValue(),
    };
  }
}
