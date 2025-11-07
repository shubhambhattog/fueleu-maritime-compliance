import { Year } from "../valueObjects/Year";
import { ComplianceBalanceGrams } from "../valueObjects/ComplianceBalanceGrams";

/**
 * Pool Member
 * Represents a ship's participation in a compliance pool
 */
export class PoolMember {
  private constructor(
    private readonly shipId: string,
    private readonly cbBeforeGrams: ComplianceBalanceGrams,
    private cbAfterGrams: ComplianceBalanceGrams
  ) {}

  public static create(props: {
    shipId: string;
    cbBeforeGrams: number;
    cbAfterGrams: number;
  }): PoolMember {
    return new PoolMember(
      props.shipId,
      ComplianceBalanceGrams.create(props.cbBeforeGrams),
      ComplianceBalanceGrams.create(props.cbAfterGrams)
    );
  }

  public getShipId(): string {
    return this.shipId;
  }

  public getCBBeforeGrams(): ComplianceBalanceGrams {
    return this.cbBeforeGrams;
  }

  public getCBAfterGrams(): ComplianceBalanceGrams {
    return this.cbAfterGrams;
  }

  public getAllocation(): ComplianceBalanceGrams {
    return this.cbAfterGrams.subtract(this.cbBeforeGrams);
  }

  public updateCBAfter(newCB: ComplianceBalanceGrams): void {
    this.cbAfterGrams = newCB;
  }

  public toPlainObject() {
    return {
      shipId: this.shipId,
      cb_before_g: this.cbBeforeGrams.getValue(),
      cb_after_g: this.cbAfterGrams.getValue(),
    };
  }
}

/**
 * Pool Entity
 * Represents a compliance pool (Article 21 - Pooling)
 * Implements greedy allocation algorithm for distributing surplus
 */
export class Pool {
  private constructor(
    private readonly id: string,
    private readonly year: Year,
    private readonly members: PoolMember[],
    private readonly poolSum: ComplianceBalanceGrams,
    private readonly createdAt: Date
  ) {}

  public static create(props: {
    id: string;
    year: number;
    members: Array<{ shipId: string; cbBeforeGrams: number }>;
    createdAt?: Date;
  }): Pool {
    const yearObj = Year.create(props.year);
    
    // Create pool members with initial CB
    const members = props.members.map(m =>
      PoolMember.create({
        shipId: m.shipId,
        cbBeforeGrams: m.cbBeforeGrams,
        cbAfterGrams: m.cbBeforeGrams, // Initially same as before
      })
    );

    // Calculate pool sum (must be >= 0 for pooling to be valid)
    const poolSum = members.reduce(
      (sum, member) => sum.add(member.getCBBeforeGrams()),
      ComplianceBalanceGrams.zero()
    );

    // Business rule: Pool sum must be non-negative
    if (poolSum.isDeficit()) {
      throw new Error(
        `Pool sum cannot be negative. Total deficit: ${poolSum.toTonnes()} tonnes`
      );
    }

    const pool = new Pool(props.id, yearObj, members, poolSum, props.createdAt || new Date());
    
    // Apply greedy allocation algorithm
    pool.applyGreedyAllocation();

    return pool;
  }

  /**
   * Greedy Allocation Algorithm
   * 1. Allocate surplus to ships with deficits in decreasing order of deficit size
   * 2. Continue until no surplus remains or all deficits are covered
   */
  private applyGreedyAllocation(): void {
    // Separate members into surplus and deficit groups
    const surplus = this.members
      .filter(m => m.getCBBeforeGrams().isSurplus())
      .sort((a, b) => b.getCBBeforeGrams().getValue() - a.getCBBeforeGrams().getValue());

    const deficits = this.members
      .filter(m => m.getCBBeforeGrams().isDeficit())
      .sort((a, b) => a.getCBBeforeGrams().getValue() - b.getCBBeforeGrams().getValue());

    // Track remaining surplus
    let remainingSurplus = this.poolSum.getValue();

    // Allocate to deficits
    for (const deficit of deficits) {
      const deficitAmount = Math.abs(deficit.getCBBeforeGrams().getValue());
      const allocation = Math.min(deficitAmount, remainingSurplus);

      // Update member's CB after allocation
      const newCB = deficit.getCBBeforeGrams().add(ComplianceBalanceGrams.create(allocation));
      deficit.updateCBAfter(newCB);

      remainingSurplus -= allocation;

      if (remainingSurplus <= 0) break;
    }

    // Distribute any remaining surplus among surplus ships (reduce their surplus)
    if (remainingSurplus > 0 && surplus.length > 0) {
      const perShip = remainingSurplus / surplus.length;
      for (const surplusMember of surplus) {
        const reduction = ComplianceBalanceGrams.create(perShip);
        const newCB = surplusMember.getCBBeforeGrams().subtract(reduction);
        surplusMember.updateCBAfter(newCB);
      }
    }
  }

  public getId(): string {
    return this.id;
  }

  public getYear(): Year {
    return this.year;
  }

  public getMembers(): ReadonlyArray<PoolMember> {
    return this.members;
  }

  public getPoolSum(): ComplianceBalanceGrams {
    return this.poolSum;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public isValid(): boolean {
    return !this.poolSum.isDeficit();
  }

  public toPlainObject() {
    return {
      id: this.id,
      year: this.year.getValue(),
      poolSum: this.poolSum.getValue(),
      members: this.members.map(m => m.toPlainObject()),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
