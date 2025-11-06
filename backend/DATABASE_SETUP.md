# Database Setup Guide

## Option 1: Quick Start (In-Memory Storage)

The backend works out-of-the-box with in-memory storage. No database setup needed!

Just run:
```bash
cd backend
pnpm install
pnpm run dev
```

The backend will automatically use in-memory storage with 5 seeded routes.

---

## Option 2: Production Setup (Neon Postgres + Drizzle ORM)

For persistent storage, follow these steps:

### Step 1: Create a Neon Database

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up or log in
3. Click "Create Project"
4. Name your project (e.g., "fueleu-maritime")
5. Select a region close to you
6. Copy the connection string (it looks like):
   ```
   postgresql://[user]:[password]@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Configure Environment

1. Open `backend/.env`
2. Uncomment the `DATABASE_URL` line
3. Paste your Neon connection string:
   ```bash
   DATABASE_URL=postgresql://[user]:[password]@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Install Dependencies

```bash
cd backend
pnpm install
```

This installs:
- `@neondatabase/serverless` - Neon's serverless driver
- `drizzle-orm` - TypeScript ORM
- `drizzle-kit` - Migration & studio tools
- `ws` - WebSocket for Neon serverless

### Step 4: Push Schema to Database

```bash
# Push schema without generating migration files (fastest for initial setup)
pnpm run db:push
```

Or if you want to generate migration files:
```bash
# Generate migration files
pnpm run db:generate

# Apply migrations
pnpm run db:migrate
```

### Step 5: Seed the Database

```bash
pnpm run db:seed
```

This will populate your database with:
- 5 ships (S001-S005)
- 5 routes (R001-R005) with different vessel types, fuel types, and years

### Step 6: Start the Server

```bash
pnpm run dev
```

You should see:
```
🔌 Using DATABASE (Neon Postgres) storage
✅ Database routes loaded
🚀 Backend server listening on http://localhost:4000
```

---

## Database Schema

### Tables Created

1. **routes** - Voyage routes with GHG intensity and fuel consumption
2. **ship_compliance** - CB snapshots (computed compliance balance)
3. **bank_entries** - Banking transactions (immutable audit trail)
4. **pools** - Compliance pools
5. **pool_members** - Pool membership with before/after CBs
6. **ships** - Ship registry (optional reference table)

---

## Useful Commands

```bash
# Start dev server
pnpm run dev

# Push schema changes to DB (no migration files)
pnpm run db:push

# Generate migration files
pnpm run db:generate

# Apply migrations
pnpm run db:migrate

# Open Drizzle Studio (visual DB browser)
pnpm run db:studio

# Seed database with test data
pnpm run db:seed
```

---

## Switching Between Modes

### To use DATABASE mode:
1. Set `DATABASE_URL` in `.env`
2. Run `pnpm run db:push` and `pnpm run db:seed`
3. Restart server with `pnpm run dev`

### To use IN-MEMORY mode:
1. Comment out `DATABASE_URL` in `.env` (add `#` at the start)
2. Restart server with `pnpm run dev`

---

## Troubleshooting

### "Cannot find module 'ws'"
```bash
pnpm install ws @types/ws
```

### "DATABASE_URL environment variable is not set"
- Make sure `DATABASE_URL` is uncommented in `.env`
- Check that the connection string is valid
- Verify you can connect to Neon from your network

### "Migration failed"
- Check your Neon database is active (free tier databases sleep after inactivity)
- Verify connection string has `?sslmode=require` at the end
- Try `pnpm run db:push` instead (faster, skips migration files)

### "Seed fails with duplicate key"
- Drop and recreate your tables: `pnpm run db:push --force`
- Or manually delete data from Drizzle Studio: `pnpm run db:studio`

---

## Production Considerations

1. **Environment Variables**: Use different `.env` files for dev/staging/prod
2. **Migrations**: Always use `db:generate` and `db:migrate` in production
3. **Connection Pooling**: Neon serverless handles this automatically
4. **Backups**: Enable automatic backups in Neon console
5. **Monitoring**: Set up logging for database queries in production

---

## Business Logic Compliance

This implementation follows the rules from `docs/chatgpt-inference`:

✅ **Canonical Units**:
- Energy: 41,000 MJ/tonne
- Target: 89.3368 gCO₂e/MJ
- CB stored in grams (numeric precision)

✅ **Database Schema**:
- All required tables (routes, ship_compliance, bank_entries, pools, pool_members)
- Proper field types (numeric for precision, timestamps for audit)
- Immutable bank entries (append-only)

✅ **Core Calculations**:
- computeCB function (framework-agnostic)
- Ship-level CB aggregation
- Banking available balance computation

✅ **Business Rules**:
- Banking validation (CB > 0, amount ≤ available)
- Pooling validation (sum ≥ 0, greedy allocation)
- Baseline management (single baseline per year)

---

Ready to go! 🚀
