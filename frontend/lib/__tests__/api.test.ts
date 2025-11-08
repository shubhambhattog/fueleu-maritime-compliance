import { api } from '../api';

// Mock siteConfig to use localhost for tests
jest.mock('@/config/site', () => ({
  siteConfig: {
    api: {
      baseUrl: 'http://localhost:4000'
    }
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoutes', () => {
    it('should fetch all routes without filters', async () => {
      const mockRoutes = [
        { routeId: 'R001', shipId: 'S001', year: 2024, vesselType: 'Container', fuelType: 'HFO', ghgIntensity: 87.0, fuelConsumption: 100 },
        { routeId: 'R002', shipId: 'S002', year: 2024, vesselType: 'Tanker', fuelType: 'LNG', ghgIntensity: 85.0, fuelConsumption: 120 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRoutes,
      } as Response);

      const result = await api.getRoutes();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/routes?');
      expect(result).toEqual(mockRoutes);
    });

    it('should fetch routes with filters', async () => {
      const mockRoutes = [
        { routeId: 'R001', shipId: 'S001', year: 2024, vesselType: 'Container', fuelType: 'HFO', ghgIntensity: 87.0, fuelConsumption: 100 },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRoutes,
      } as Response);

      const result = await api.getRoutes({ shipId: 'S001', year: 2024 });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/routes?shipId=S001&year=2024');
      expect(result).toEqual(mockRoutes);
    });

    it('should throw error on failed fetch', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      } as Response);

      await expect(api.getRoutes()).rejects.toThrow('Failed to fetch routes');
    });
  });

  describe('setBaseline', () => {
    it('should set route as baseline', async () => {
      const mockResponse = {
        ok: true,
        route: { routeId: 'R001', shipId: 'S001', year: 2024, isBaseline: true },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await api.setBaseline('R001');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/routes/R001/baseline', {
        method: 'POST',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCB', () => {
    it('should fetch compliance balance', async () => {
      const mockCB = {
        shipId: 'S001',
        year: 2024,
        cb_g: 17780880,
        cb_t: 17.78,
        components: [],
        computedAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockCB,
      } as Response);

      const result = await api.getCB('S001', 2024);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/compliance/cb?shipId=S001&year=2024');
      expect(result).toEqual(mockCB);
    });

    it('should throw error when CB fetch fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      } as Response);

      await expect(api.getCB('S001', 2024)).rejects.toThrow('Failed to fetch CB');
    });
  });

  describe('bankSurplus', () => {
    it('should successfully bank surplus', async () => {
      const mockEntry = {
        id: '1',
        shipId: 'S001',
        year: 2024,
        amount_g: 5000000,
        type: 'bank' as const,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, entry: mockEntry }),
      } as Response);

      const result = await api.bankSurplus('S001', 2024, 5000000);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/banking/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipId: 'S001', year: 2024, amount_g: 5000000 }),
      });
      expect(result.ok).toBe(true);
      expect(result.entry).toEqual(mockEntry);
    });

    it('should throw error with custom message when banking fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Cannot bank negative CB' }),
      } as Response);

      await expect(api.bankSurplus('S001', 2024, -1000)).rejects.toThrow('Cannot bank negative CB');
    });
  });

  describe('applyBanked', () => {
    it('should successfully apply banked surplus', async () => {
      const mockEntry = {
        id: '2',
        shipId: 'S002',
        year: 2024,
        amount_g: 3000000,
        type: 'apply' as const,
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, entry: mockEntry }),
      } as Response);

      const result = await api.applyBanked('S002', 2024, 3000000);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/banking/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipId: 'S002', year: 2024, amount_g: 3000000 }),
      });
      expect(result.ok).toBe(true);
      expect(result.entry).toEqual(mockEntry);
    });

    it('should throw error when insufficient banked amount', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Insufficient banked amount' }),
      } as Response);

      await expect(api.applyBanked('S002', 2024, 10000000)).rejects.toThrow('Insufficient banked amount');
    });
  });

  describe('createPool', () => {
    it('should successfully create pool', async () => {
      const mockPool = {
        year: 2024,
        poolSum: 5000000,
        members: [
          { shipId: 'S001', cb_before_g: 10000000, cb_after_g: 7500000 },
          { shipId: 'S002', cb_before_g: -5000000, cb_after_g: -2500000 },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPool,
      } as Response);

      const result = await api.createPool(2024, ['S001', 'S002']);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: 2024, members: ['S001', 'S002'] }),
      });
      expect(result).toEqual(mockPool);
    });

    it('should throw error when pool sum is negative', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Pool sum cannot be negative' }),
      } as Response);

      await expect(api.createPool(2024, ['S003', 'S004'])).rejects.toThrow('Pool sum cannot be negative');
    });
  });

  describe('getAdjustedCB', () => {
    it('should fetch adjusted CB with banking data', async () => {
      const mockAdjustedCB = {
        shipId: 'S001',
        year: 2024,
        cb_g: 17780880,
        cb_t: 17.78,
        components: [],
        computedAt: '2024-01-01T00:00:00Z',
        adjusted_g: 12780880,
        totalBanked: 5000000,
        totalApplied: 0,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockAdjustedCB,
      } as Response);

      const result = await api.getAdjustedCB('S001', 2024);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/compliance/adjusted-cb?shipId=S001&year=2024');
      expect(result).toEqual(mockAdjustedCB);
      expect(result.adjusted_g).toBe(12780880);
      expect(result.totalBanked).toBe(5000000);
    });
  });

  describe('getBankingRecords', () => {
    it('should fetch banking transaction history', async () => {
      const mockRecords = [
        {
          id: '1',
          shipId: 'S001',
          year: 2024,
          amount_g: 5000000,
          type: 'bank' as const,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          shipId: 'S001',
          year: 2024,
          amount_g: 2000000,
          type: 'apply' as const,
          createdAt: '2024-02-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRecords,
      } as Response);

      const result = await api.getBankingRecords('S001', 2024);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/banking/records?shipId=S001&year=2024');
      expect(result).toEqual(mockRecords);
      expect(result).toHaveLength(2);
    });
  });

  describe('getComparison', () => {
    it('should fetch comparison data', async () => {
      const mockComparison = {
        comparisons: [
          {
            routeId: 'R001',
            baseline_ghg: 91.16,
            comparison_ghg: 87.0,
            percentDiff: -4.56,
            compliant: true,
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockComparison,
      } as Response);

      const result = await api.getComparison(2024);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/routes/comparison?year=2024');
      expect(result).toEqual(mockComparison);
    });

    it('should fetch comparison without year filter', async () => {
      const mockComparison = { comparisons: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockComparison,
      } as Response);

      const result = await api.getComparison();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/routes/comparison?');
      expect(result).toEqual(mockComparison);
    });
  });
});
