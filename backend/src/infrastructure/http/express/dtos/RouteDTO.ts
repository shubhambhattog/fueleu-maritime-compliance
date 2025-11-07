import { Route } from "../../../../domain/entities/Route";

/**
 * Route Data Transfer Object
 * Maps between domain entities and HTTP responses
 */
export class RouteDTO {
  static fromDomain(route: Route) {
    const plain = route.toPlainObject();
    return {
      routeId: plain.routeId,
      shipId: plain.shipId,
      year: plain.year,
      vesselType: plain.vesselType,
      fuelType: plain.fuelType,
      ghgIntensity: plain.ghgIntensity,
      fuelConsumption: plain.fuelConsumptionTonnes,
      distance: plain.distanceKm,
      totalEmissions: plain.totalEmissions,
      isBaseline: plain.isBaseline,
    };
  }

  static fromDomainArray(routes: Route[]) {
    return routes.map(this.fromDomain);
  }
}
