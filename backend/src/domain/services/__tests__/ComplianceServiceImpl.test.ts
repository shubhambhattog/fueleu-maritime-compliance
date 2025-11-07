import { ComplianceServiceImpl } from '../ComplianceServiceImpl';
import { RouteRepository } from '../../ports/outbound/RouteRepository';
import { BankEntryRepository } from '../../ports/outbound/BankEntryRepository';
import { Route } from '../../entities/Route';
import { BankEntry } from '../../entities/BankEntry';

// Mock repositories
const mockRouteRepository: jest.Mocked<RouteRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByShipAndYear: jest.fn(),
  findBaselineByYear: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
};

const mockBankEntryRepository: jest.Mocked<BankEntryRepository> = {
  findByShipAndYear: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
};

describe('ComplianceServiceImpl', () => {
  let complianceService: ComplianceServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    complianceService = new ComplianceServiceImpl(
      mockRouteRepository,
      mockBankEntryRepository
    );
  });

  describe('computeComplianceBalance', () => {
    it('should compute positive CB for ship with low GHG intensity', async () => {
      // Arrange: Ship with GHG intensity BELOW target (surplus)
      const mockRoute = Route.create({
        routeId: 'R001',
        shipId: 'S001',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 100,
        year: 2024,
        ghgIntensity: 85.0, // Below target of 89.3368
        isBaseline: false,
      });

      mockRouteRepository.findByShipAndYear.mockResolvedValue([mockRoute]);

      // Act
      const result = await complianceService.computeComplianceBalance('S001', 2024);

      // Assert
      expect(mockRouteRepository.findByShipAndYear).toHaveBeenCalledWith('S001', 2024);
      expect(result.getShipId()).toBe('S001');
      expect(result.getYear().getValue()).toBe(2024);
      
      // CB = (Target - Actual) × Energy
      // Energy = 100 tonnes × 41,000 MJ/t = 4,100,000 MJ
      // CB = (89.3368 - 85.0) × 4,100,000 = 17,780,880 gCO₂e (positive = surplus)
      expect(result.getComplianceBalanceGrams().getValue()).toBeGreaterThan(0);
    });

    it('should compute negative CB for ship with high GHG intensity', async () => {
      // Arrange: Ship with GHG intensity ABOVE target (deficit)
      const mockRoute = Route.create({
        routeId: 'R002',
        shipId: 'S002',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 100,
        year: 2024,
        ghgIntensity: 95.0, // Above target of 89.3368
        isBaseline: false,
      });

      mockRouteRepository.findByShipAndYear.mockResolvedValue([mockRoute]);

      // Act
      const result = await complianceService.computeComplianceBalance('S002', 2024);

      // Assert
      // CB = (89.3368 - 95.0) × 4,100,000 = -23,219,120 gCO₂e (negative = deficit)
      expect(result.getComplianceBalanceGrams().getValue()).toBeLessThan(0);
    });

    it('should sum CB across multiple routes', async () => {
      // Arrange: Ship with 2 routes
      const route1 = Route.create({
        routeId: 'R001',
        shipId: 'S001',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 100,
        year: 2024,
        ghgIntensity: 85.0, // Surplus
        isBaseline: false,
      });

      const route2 = Route.create({
        routeId: 'R002',
        shipId: 'S001',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 50,
        year: 2024,
        ghgIntensity: 90.0, // Small deficit
        isBaseline: false,
      });

      mockRouteRepository.findByShipAndYear.mockResolvedValue([route1, route2]);

      // Act
      const result = await complianceService.computeComplianceBalance('S001', 2024);

      // Assert
      expect(result.getComponents()).toHaveLength(2);
      // Should have overall positive CB (route1's large surplus > route2's small deficit)
      expect(result.getComplianceBalanceGrams().getValue()).toBeGreaterThan(0);
    });

    it('should throw error when no routes found', async () => {
      // Arrange
      mockRouteRepository.findByShipAndYear.mockResolvedValue([]);

      // Act & Assert
      await expect(
        complianceService.computeComplianceBalance('S999', 2024)
      ).rejects.toThrow('No routes found for ship S999 in year 2024');
    });
  });

  describe('getAdjustedComplianceBalance', () => {
    it('should calculate adjusted CB with banking entries', async () => {
      // Arrange: Ship with positive CB that has banked some
      const mockRoute = Route.create({
        routeId: 'R001',
        shipId: 'S001',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 100,
        year: 2024,
        ghgIntensity: 85.0,
        isBaseline: false,
      });

      const mockBankEntry = BankEntry.create({
        id: 'bank-1',
        shipId: 'S001',
        year: 2024,
        amountGrams: 5000000, // Banked 5M grams
        type: 'bank',
      });

      mockRouteRepository.findByShipAndYear.mockResolvedValue([mockRoute]);
      mockBankEntryRepository.findByShipAndYear.mockResolvedValue([mockBankEntry]);

      // Act
      const result = await complianceService.getAdjustedComplianceBalance('S001', 2024);

      // Assert
      expect(result.totalBanked).toBe(5000000);
      expect(result.totalApplied).toBe(0);
      // Adjusted CB = Computed CB - Banked + Applied
      // Adjusted CB should be less than computed CB by 5M
      const computedCB = result.shipCompliance.getComplianceBalanceGrams().getValue();
      expect(result.adjusted_g).toBe(computedCB - 5000000);
    });

    it('should calculate adjusted CB with applied entries', async () => {
      // Arrange: Ship with deficit that applied banked surplus
      const mockRoute = Route.create({
        routeId: 'R002',
        shipId: 'S002',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 100,
        year: 2024,
        ghgIntensity: 95.0, // Deficit
        isBaseline: false,
      });

      const mockApplyEntry = BankEntry.create({
        id: 'apply-1',
        shipId: 'S002',
        year: 2024,
        amountGrams: 10000000, // Applied 10M grams
        type: 'apply',
      });

      mockRouteRepository.findByShipAndYear.mockResolvedValue([mockRoute]);
      mockBankEntryRepository.findByShipAndYear.mockResolvedValue([mockApplyEntry]);

      // Act
      const result = await complianceService.getAdjustedComplianceBalance('S002', 2024);

      // Assert
      expect(result.totalBanked).toBe(0);
      expect(result.totalApplied).toBe(10000000);
      // Adjusted CB = Computed CB - Banked + Applied
      const computedCB = result.shipCompliance.getComplianceBalanceGrams().getValue();
      expect(result.adjusted_g).toBe(computedCB + 10000000);
    });

    it('should handle both bank and apply entries', async () => {
      // Arrange
      const mockRoute = Route.create({
        routeId: 'R001',
        shipId: 'S001',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 100,
        year: 2024,
        ghgIntensity: 87.0,
        isBaseline: false,
      });

      const bankEntry = BankEntry.create({
        id: 'bank-2',
        shipId: 'S001',
        year: 2024,
        amountGrams: 3000000,
        type: 'bank',
      });

      const applyEntry = BankEntry.create({
        id: 'apply-2',
        shipId: 'S001',
        year: 2024,
        amountGrams: 1000000,
        type: 'apply',
      });

      mockRouteRepository.findByShipAndYear.mockResolvedValue([mockRoute]);
      mockBankEntryRepository.findByShipAndYear.mockResolvedValue([bankEntry, applyEntry]);

      // Act
      const result = await complianceService.getAdjustedComplianceBalance('S001', 2024);

      // Assert
      expect(result.totalBanked).toBe(3000000);
      expect(result.totalApplied).toBe(1000000);
      const computedCB = result.shipCompliance.getComplianceBalanceGrams().getValue();
      // Adjusted = Computed - 3M + 1M = Computed - 2M
      expect(result.adjusted_g).toBe(computedCB - 2000000);
    });

    it('should return zero banking totals when no entries exist', async () => {
      // Arrange
      const mockRoute = Route.create({
        routeId: 'R001',
        shipId: 'S001',
        vesselType: 'Container',
        fuelType: 'HFO',
        fuelConsumptionTonnes: 100,
        year: 2024,
        ghgIntensity: 87.0,
        isBaseline: false,
      });

      mockRouteRepository.findByShipAndYear.mockResolvedValue([mockRoute]);
      mockBankEntryRepository.findByShipAndYear.mockResolvedValue([]);

      // Act
      const result = await complianceService.getAdjustedComplianceBalance('S001', 2024);

      // Assert
      expect(result.totalBanked).toBe(0);
      expect(result.totalApplied).toBe(0);
      const computedCB = result.shipCompliance.getComplianceBalanceGrams().getValue();
      expect(result.adjusted_g).toBe(computedCB);
    });
  });
});
