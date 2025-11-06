import { db } from "./index";
import { routes, ships } from "./schema";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // Insert ships first
    console.log("Inserting ships...");
    await db.insert(ships).values([
      { shipId: "S001", name: "MV Container Express", imoNumber: "IMO1234567" },
      { shipId: "S002", name: "MV Bulk Carrier Alpha", imoNumber: "IMO2345678" },
      { shipId: "S003", name: "MV Tanker Beta", imoNumber: "IMO3456789" },
      { shipId: "S004", name: "MV RoRo Gamma", imoNumber: "IMO4567890" },
      { shipId: "S005", name: "MV Container Delta", imoNumber: "IMO5678901" },
    ]);

    // Insert routes
    console.log("Inserting routes...");
    await db.insert(routes).values([
      {
        routeId: "R001",
        shipId: "S001",
        year: 2024,
        vesselType: "Container",
        fuelType: "HFO",
        ghgIntensity: "91.0",
        fuelConsumption: "5000",
        distance: "12000",
        totalEmissions: "4500",
        isBaseline: true,
      },
      {
        routeId: "R002",
        shipId: "S002",
        year: 2024,
        vesselType: "BulkCarrier",
        fuelType: "LNG",
        ghgIntensity: "88.0",
        fuelConsumption: "4500",
        distance: "10000",
        totalEmissions: "3960",
        isBaseline: false,
      },
      {
        routeId: "R003",
        shipId: "S003",
        year: 2024,
        vesselType: "Tanker",
        fuelType: "MGO",
        ghgIntensity: "93.5",
        fuelConsumption: "5500",
        distance: "15000",
        totalEmissions: "5142.5",
        isBaseline: false,
      },
      {
        routeId: "R004",
        shipId: "S004",
        year: 2025,
        vesselType: "RoRo",
        fuelType: "HFO",
        ghgIntensity: "89.2",
        fuelConsumption: "4800",
        distance: "11000",
        totalEmissions: "4281.6",
        isBaseline: false,
      },
      {
        routeId: "R005",
        shipId: "S005",
        year: 2025,
        vesselType: "Container",
        fuelType: "LNG",
        ghgIntensity: "90.5",
        fuelConsumption: "5200",
        distance: "13000",
        totalEmissions: "4706",
        isBaseline: false,
      },
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
