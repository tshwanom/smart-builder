# Database Setup Guide

## Option 1: Neon (Recommended for Development)

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string
5. Add to `.env`:
   ```
   DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"
   ```

## Option 2: Plesk PostgreSQL Server

1. Log into your Plesk panel
2. Go to Databases → Add Database
3. Create database: `construction_calculator`
4. Note the credentials
5. Add to `.env`:
   ```
   DATABASE_URL="postgresql://username:password@your-server.com:5432/construction_calculator"
   ```

## Option 3: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database: `construction_calculator`
3. Add to `.env`:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/construction_calculator"
   ```

## Running Migrations

After setting up your database:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# View database in Prisma Studio
npx prisma studio
```

## Switching Databases

Just change the `DATABASE_URL` in `.env` - no code changes needed!
