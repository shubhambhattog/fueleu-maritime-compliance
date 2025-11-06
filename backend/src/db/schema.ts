import { pgTable, serial, varchar, integer, numeric, boolean, timestamp, json, text } from "drizzle-orm/pg-core";

// Routes table
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  routeId: varchar("route_id", { length: 50 }).notNull().unique(),
  shipId: varchar("ship_id", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  vesselType: varchar("vessel_type", { length: 100 }).notNull(),
  fuelType: varchar("fuel_type", { length: 100 }).notNull(),
  ghgIntensity: numeric("ghg_intensity", { precision: 10, scale: 4 }).notNull(), // gCO2e/MJ
  fuelConsumption: numeric("fuel_consumption_t", { precision: 12, scale: 2 }).notNull(), // tonnes
  distance: numeric("distance_km", { precision: 12, scale: 2 }),
  totalEmissions: numeric("total_emissions_t", { precision: 12, scale: 2 }),
  isBaseline: boolean("is_baseline").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ship compliance table (stores CB snapshots)
export const shipCompliance = pgTable("ship_compliance", {
  id: serial("id").primaryKey(),
  shipId: varchar("ship_id", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  cbG: numeric("cb_g", { precision: 20, scale: 2 }).notNull(), // grams CO2eq
  components: json("components").notNull(), // per-route breakdown
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

// Bank entries table (immutable audit trail)
export const bankEntries = pgTable("bank_entries", {
  id: serial("id").primaryKey(),
  shipId: varchar("ship_id", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  amountG: numeric("amount_g", { precision: 20, scale: 2 }).notNull(), // grams CO2eq
  type: varchar("type", { length: 10 }).notNull(), // 'bank' or 'apply'
  ref: varchar("ref", { length: 255 }), // optional reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pools table
export const pools = pgTable("pools", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pool members table
export const poolMembers = pgTable("pool_members", {
  id: serial("id").primaryKey(),
  poolId: integer("pool_id").notNull().references(() => pools.id),
  shipId: varchar("ship_id", { length: 50 }).notNull(),
  cbBeforeG: numeric("cb_before_g", { precision: 20, scale: 2 }).notNull(),
  cbAfterG: numeric("cb_after_g", { precision: 20, scale: 2 }).notNull(),
});

// Optional: Ships table for reference
export const ships = pgTable("ships", {
  id: serial("id").primaryKey(),
  shipId: varchar("ship_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  imoNumber: varchar("imo_number", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
