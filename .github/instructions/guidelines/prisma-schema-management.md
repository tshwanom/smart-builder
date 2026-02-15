# 🗃️ Prisma Schema Management Guidelines

**Status:** MANDATORY - Follow for all database schema changes  
**Version:** 1.0  
**Last Updated:** 2025-11-08

---

## 🎯 Core Principle: Modular Schema Architecture

**The schema is organized into domain-specific modules for maintainability and scalability.**

---

## 📁 Schema Structure

```
/prisma
  /schemas/
    user.prisma        → Authentication & User Management
    core.prisma        → Projects, Materials, Organizations
    boq.prisma         → Bill of Quantities
    designer.prisma    → Canvas State & Designer Data
    compliance.prisma  → Building Code Compliance Rules
  schema.prisma        → Main schema (imports all modules)
  schema.prisma.old-backup → Backup of legacy schema
```

---

## ✅ When to Add/Modify Schema

### Add New Tables ONLY When:
1. ✅ Feature is being actively developed (not planned)
2. ✅ Domain entities are defined and tested
3. ✅ Database structure is needed NOW
4. ✅ You know the exact fields and relationships

### DON'T Add Tables For:
1. ❌ Features not yet started
2. ❌ "Future-proofing" or "just in case"
3. ❌ Incomplete/unclear requirements
4. ❌ Copy-pasting from old schemas

---

## 📋 Schema Module Guidelines

### 1. Determine Which Module

| Domain | Module File | Examples |
|--------|-------------|----------|
| Users, Auth | `user.prisma` | User, Account, Session, VerificationToken |
| Projects, Materials, Orgs | `core.prisma` | Project, Material, Organization, MaterialPriceOverride |
| BOQ System | `boq.prisma` | BOQItem, BOQCategory, BOQTemplate |
| Designer Canvas | `designer.prisma` | DesignerProject, CanvasState |
| Compliance | `compliance.prisma` | ComplianceRule, CountryConfig |
| Billing (future) | `billing.prisma` | Invoice, Payment, Subscription |
| Marketplace (future) | `marketplace.prisma` | Template, TemplateSale |

### 2. Create New Module (if needed)

If adding a completely new domain:

```bash
# Create new module file
New-Item "prisma\schemas\new-domain.prisma"

# Add to main schema.prisma
import "schemas/new-domain.prisma"
```

### 3. Add Models to Appropriate Module

**Edit the module file, NOT schema.prisma**

```prisma
// In prisma/schemas/core.prisma

model NewEntity {
  id          String   @id @default(cuid())
  name        String
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("new_entities")
}
```

### 4. Update Main Schema (if new module)

```prisma
// In prisma/schema.prisma

// Add import for new module
import "schemas/new-domain.prisma"
```

---

## 🚫 Schema Anti-Patterns (Auto-Reject)

Your PR will be **AUTOMATICALLY REJECTED** if:

1. **Editing schema.prisma Directly**
   - Don't add models to main schema.prisma
   - Add to appropriate module in /schemas/

2. **Adding Unused Tables**
   - Tables for features not being built NOW
   - Copy-pasted tables from old schema
   - "Future-proofing" tables

3. **Creating Duplicate Tables**
   - Similar tables in different modules
   - Table already exists with different name
   - Not checking existing schema first

4. **Poor Module Organization**
   - Unrelated models in same module
   - Module files > 500 lines (split further)
   - Missing @@map() for table names

5. **No Migration Plan**
   - Schema changes without migration strategy
   - Breaking changes without rollback plan
   - No consideration for existing data

---

## ✅ Schema Change Workflow

### Step 1: Determine Need
```typescript
// Do I need a database table?
const needsTable = 
  featureIsActivelyBeingBuilt && 
  domainEntitiesAreDefined &&
  databaseStorageRequired &&
  schemaIsFullyDesigned;

if (!needsTable) {
  // Use in-memory state, JSON fields, or wait
  return;
}
```

### Step 2: Choose Module
- Identify domain (user, core, boq, etc.)
- Open appropriate module file in /schemas/
- Study existing patterns

### Step 3: Add Model
```prisma
model MyEntity {
  // 1. Primary Key
  id String @id @default(cuid())
  
  // 2. Core Fields
  name String
  value Float
  
  // 3. Foreign Keys
  userId String
  user User @relation(fields: [userId], references: [id])
  
  // 4. Timestamps (ALWAYS include)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 5. Indexes
  @@index([userId])
  
  // 6. Table Mapping (ALWAYS include)
  @@map("my_entities")
}
```

### Step 4: Generate & Test
```bash
# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Generate client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_my_entity

# Test connection
npm run test:db
```

### Step 5: Update Documentation
- Update FILE_STRUCTURE.md
- Document in feature README
- Add to TODOTRACKER

---

## 📏 Schema Module Size Guidelines

| Module | Max Models | Max Lines | Action if Exceeded |
|--------|------------|-----------|-------------------|
| user.prisma | 10 | 300 | Split auth types |
| core.prisma | 15 | 500 | Split by subdomain |
| boq.prisma | 10 | 400 | Split BOQ types |
| designer.prisma | 8 | 300 | Split canvas/state |
| compliance.prisma | 12 | 400 | Split by country |

---

## 🔄 Migration Strategy

### Development (Local)
```bash
# Create migration
npx prisma migrate dev --name descriptive_name

# Reset database (destructive)
npx prisma migrate reset
```

### Production (Deployment)
```bash
# Generate migration without applying
npx prisma migrate dev --create-only

# Review migration SQL
cat prisma/migrations/XXXXXX_descriptive_name/migration.sql

# Apply in production
npx prisma migrate deploy
```

---

## 📋 Schema Checklist

Before committing schema changes:

- [ ] Model added to appropriate module (not schema.prisma)
- [ ] All fields have clear purpose
- [ ] Foreign keys and relations defined
- [ ] Timestamps (createdAt, updatedAt) included
- [ ] Indexes added for queries
- [ ] @@map() directive for table name
- [ ] Schema formatted (`npx prisma format`)
- [ ] Schema validated (`npx prisma validate`)
- [ ] Client regenerated (`npx prisma generate`)
- [ ] Migration created and tested
- [ ] FILE_STRUCTURE.md updated
- [ ] Feature documentation updated

---

## 🎯 Examples

### ✅ GOOD - Minimal, Focused Schema

```prisma
// prisma/schemas/billing.prisma (NEW FEATURE)

model Invoice {
  id          String   @id @default(cuid())
  userId      String
  amount      Float
  status      String
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([status])
  @@map("invoices")
}
```

### ❌ BAD - Premature, Bloated Schema

```prisma
// DON'T DO THIS - Adding tables for features not being built

model InvoiceTemplate { } // Not needed yet
model InvoiceReminder { }  // Not needed yet
model InvoiceDispute { }   // Not needed yet
model InvoiceAudit { }     // Not needed yet
model InvoiceExport { }    // Not needed yet
```

---

## 📚 Related Guidelines

- `core/architecture-respect.md` - Pre-implementation analysis
- `workflows/feature-development.md` - Feature workflow
- `practices/documentation-updates.md` - Update FILE_STRUCTURE.md

---

**Remember:**
- **Build incrementally** - Add tables as features are built
- **One domain per module** - Keep related models together
- **Always document** - Update FILE_STRUCTURE.md
- **Test thoroughly** - Validate, generate, migrate, test

---

*Modular schema = easy maintenance, clear organization, incremental growth*  
*Last Updated: 2025-11-08*
