import { ShipComplianceBalance } from "../../../../domain/entities/Ship";

/**
 * Compliance Data Transfer Object
 */
export class ComplianceDTO {
  static fromDomain(shipCompliance: ShipComplianceBalance) {
    return shipCompliance.toPlainObject();
  }
}
