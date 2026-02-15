# 🎯 Code Quality Standards

**Status:** MANDATORY - Apply to ALL tasks  
**Version:** 1.1  
**Last Updated:** 2025-01-08

---

## ⚠️ This is MANDATORY

Every developer must follow these standards for **ALL code changes**, regardless of task type.

---

## 📋 Code Quality Checklist

### ✅ Before Writing Code
- [ ] Code purpose is clear and well-defined
- [ ] Complexity is minimized
- [ ] No obvious better approach exists
- [ ] Follows existing codebase patterns
- [ ] **Prisma schema consulted and aligned (for database operations)**
- [ ] **Prisma schema updated FIRST if changes needed**
- [ ] **Next.js 15 params handling verified (for route handlers)**

### ✅ While Writing Code
- [ ] Code is readable and self-documenting
- [ ] Variable/function names are descriptive
- [ ] Functions are small and focused (< 50 lines)
- [ ] No code duplication
- [ ] Proper error handling implemented
- [ ] Edge cases considered

### ✅ After Writing Code
- [ ] All tests passing
- [ ] Code reviewed (self-review at minimum)
- [ ] No console.log() or debugging code left
- [ ] Comments added for complex logic
- [ ] Performance considered

---

## 🚫 Code Quality Violations (Auto-Reject)

Your PR will be **AUTOMATICALLY REJECTED** if:

1. **Code Duplication**
   - Copy-pasted code blocks
   - Repeated logic that could be extracted
   - Similar functions not consolidated

2. **Poor Naming**
   - Variables: `x`, `temp`, `data`, `result`
   - Functions: `doStuff()`, `handle()`, `process()`
   - Components: `Component1`, `NewComponent`, `TempComponent`

3. **Functions Too Large**
   - Functions > 50 lines (break them down)
   - Multiple responsibilities in one function
   - Complex nested logic (refactor to smaller pieces)

4. **No Error Handling**
   - Try-catch blocks missing
   - Error states not handled
   - No user feedback on failures

5. **Debugging Code Left In**
   - `console.log()` statements
   - Commented-out code blocks
   - Test data hardcoded

6. **No Tests**
   - New functionality without tests
   - Tests not updated after changes
   - Existing tests broken

7. **Prisma Schema Misalignment** ⚠️ NEW
   - Database operations without checking Prisma schema first
   - Field names that don't match Prisma model
   - Missing relations that should exist in schema
   - Schema changes not documented in migration
   - Code written before schema is updated

8. **Next.js 15 Params Not Awaited** ⚠️ NEW
   - Using `params` directly without `await`
   - Using `searchParams` directly without `await`
   - Accessing route parameters synchronously
   - Not following Next.js 15 async params pattern

---

## ✅ Code Quality Standards

### 1. Naming Conventions

```typescript
// ✅ GOOD - Descriptive and clear
function calculateMaterialCost(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

const userMaterialPreferences = getUserPreferences();
const isCalculationComplete = checkStatus();

// ❌ BAD - Unclear and generic
function calc(q: number, p: number): number {
  return q * p;
}

const data = getData();
const flag = check();
```

### 2. Function Size and Responsibility

```typescript
// ✅ GOOD - Single responsibility, small and focused
function validateMaterialInput(material: Material): ValidationResult {
  if (!material.name) {
    return { valid: false, error: 'Material name is required' };
  }
  if (material.quantity <= 0) {
    return { valid: false, error: 'Quantity must be positive' };
  }
  return { valid: true };
}

function saveMaterial(material: Material): Promise<void> {
  const validation = validateMaterialInput(material);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  return database.save(material);
}

// ❌ BAD - Multiple responsibilities, too large
function handleMaterial(material: Material): Promise<void> {
  // Validation
  if (!material.name) throw new Error('Name required');
  if (material.quantity <= 0) throw new Error('Invalid quantity');
  
  // Calculation
  const cost = material.quantity * material.unitPrice;
  const tax = cost * 0.15;
  const total = cost + tax;
  
  // Formatting
  const formatted = {
    ...material,
    cost: cost.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2)
  };
  
  // Saving
  return database.save(formatted);
}
```

### 3. Error Handling

```typescript
// ✅ GOOD - Proper error handling with user feedback
async function fetchMaterialData(id: string): Promise<Material> {
  try {
    const response = await api.get(`/materials/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch material: ${response.statusText}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching material:', error);
    showErrorNotification('Unable to load material data. Please try again.');
    throw error; // Re-throw for caller to handle
  }
}

// ❌ BAD - No error handling
async function fetchMaterialData(id: string): Promise<Material> {
  const response = await api.get(`/materials/${id}`);
  return response.data;
}
```

### 4. Code Organization

```typescript
// ✅ GOOD - Well organized with clear sections
export function MaterialCard({ material }: Props) {
  // Hooks at the top
  const [isEditing, setIsEditing] = useState(false);
  const { updateMaterial } = useMaterials();
  
  // Event handlers grouped together
  const handleEdit = () => setIsEditing(true);
  const handleSave = async () => {
    await updateMaterial(material);
    setIsEditing(false);
  };
  const handleCancel = () => setIsEditing(false);
  
  // Render logic
  return (
    <Card>
      {isEditing ? (
        <EditForm onSave={handleSave} onCancel={handleCancel} />
      ) : (
        <DisplayView onEdit={handleEdit} />
      )}
    </Card>
  );
}

// ❌ BAD - Disorganized with mixed concerns
export function MaterialCard({ material }: Props) {
  const handleEdit = () => setIsEditing(true);
  const [isEditing, setIsEditing] = useState(false);
  const handleSave = async () => {
    await updateMaterial(material);
    setIsEditing(false);
  };
  const { updateMaterial } = useMaterials();
  const handleCancel = () => setIsEditing(false);
  
  return <Card>{/* render logic */}</Card>;
}
```

### 5. Comments and Documentation

```typescript
// ✅ GOOD - Comments explain WHY, not WHAT
// Calculate total with markup percentage applied
// Markup is required for profit margin tracking per business requirements
function calculateTotalWithMarkup(cost: number, markup: number): number {
  return cost * (1 + markup / 100);
}

// Complex business logic requires explanation
// BOQ calculations follow SANS 1200 standards:
// - Material quantities include 5% waste factor
// - Labor costs calculated per square meter
// - Regional pricing variations applied based on Gauteng rates
function calculateBOQTotal(items: BOQItem[]): number {
  // Implementation...
}

// ❌ BAD - Comments repeat the code
// This function calculates total with markup
function calculateTotalWithMarkup(cost: number, markup: number): number {
  // Return cost times one plus markup divided by 100
  return cost * (1 + markup / 100);
}
```

### 6. Prisma Schema Alignment (MANDATORY)

**RULE: Always check Prisma schema BEFORE writing any database code**

```typescript
// ✅ GOOD - Schema checked first, fields match exactly
// Prisma schema consulted: Material model has name, quantity, unitPrice, unit
async function createMaterial(data: CreateMaterialInput) {
  return await prisma.material.create({
    data: {
      name: data.name,           // ✓ Exists in schema
      quantity: data.quantity,   // ✓ Exists in schema
      unitPrice: data.unitPrice, // ✓ Exists in schema
      unit: data.unit,           // ✓ Exists in schema
      projectId: data.projectId  // ✓ Relation exists in schema
    }
  });
}

// ❌ BAD - Field names don't match schema
async function createMaterial(data: CreateMaterialInput) {
  return await prisma.material.create({
    data: {
      materialName: data.name,    // ✗ Schema uses 'name', not 'materialName'
      qty: data.quantity,         // ✗ Schema uses 'quantity', not 'qty'
      price: data.unitPrice,      // ✗ Schema uses 'unitPrice', not 'price'
      project: data.projectId     // ✗ Schema uses 'projectId', not 'project'
    }
  });
}
```

**WORKFLOW for Database Changes:**

1. **FIRST**: Update `schema.prisma`
   ```prisma
   model Material {
     id        String   @id @default(cuid())
     name      String
     quantity  Float
     unitPrice Float
     unit      String
     projectId String
     project   Project  @relation(fields: [projectId], references: [id])
     createdAt DateTime @default(now())
   }
   ```

2. **SECOND**: Run migration
   ```bash
   npx prisma migrate dev --name add_material_model
   ```

3. **THIRD**: Generate Prisma Client
   ```bash
   npx prisma generate
   ```

4. **FINALLY**: Write code that matches the schema
   ```typescript
   // Now safe to use - schema is source of truth
   await prisma.material.create({ data: { ... } });
   ```

**Prisma Schema Checklist:**
- [ ] Schema file opened and reviewed
- [ ] All field names verified against schema
- [ ] All relations verified against schema
- [ ] Data types match schema exactly
- [ ] Optional/required fields respected
- [ ] Default values considered
- [ ] Migration created if schema changed
- [ ] Prisma Client regenerated

### 7. Next.js 15 Params Handling (MANDATORY)

**RULE: ALL route params and searchParams MUST be awaited in Next.js 15**

```typescript
// ✅ GOOD - Params awaited before use (Next.js 15)
// app/materials/[id]/page.tsx
export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✓ MUST await
  
  const material = await prisma.material.findUnique({
    where: { id }
  });
  
  return <MaterialDetail material={material} />;
}

// ✅ GOOD - SearchParams awaited (Next.js 15)
// app/materials/page.tsx
export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams; // ✓ MUST await
  
  const materials = await prisma.material.findMany({
    where: category ? { category } : undefined,
    orderBy: sort ? { [sort]: 'asc' } : undefined,
  });
  
  return <MaterialsList materials={materials} />;
}

// ❌ BAD - Params not awaited (Next.js 15 will throw error)
export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = params; // ✗ ERROR: Cannot destructure Promise
  
  const material = await prisma.material.findUnique({
    where: { id }
  });
  
  return <MaterialDetail material={material} />;
}

// ❌ BAD - SearchParams accessed synchronously
export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const category = searchParams.category; // ✗ ERROR: Promise has no 'category' property
  
  return <MaterialsList category={category} />;
}
```

**Next.js 15 Route Handler Pattern:**

```typescript
// ✅ GOOD - API Route with awaited params
// app/api/materials/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✓ MUST await
  
  const material = await prisma.material.findUnique({
    where: { id }
  });
  
  return Response.json(material);
}

// ✅ GOOD - Dynamic metadata with awaited params
// app/materials/[id]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✓ MUST await
  
  const material = await prisma.material.findUnique({
    where: { id },
    select: { name: true }
  });
  
  return {
    title: material?.name || 'Material',
  };
}
```

**Next.js 15 Params Checklist:**
- [ ] All `params` are typed as `Promise<{ ... }>`
- [ ] All `params` are awaited with `await params`
- [ ] All `searchParams` are typed as `Promise<{ ... }>`
- [ ] All `searchParams` are awaited with `await searchParams`
- [ ] No synchronous access to params/searchParams
- [ ] generateMetadata functions await params
- [ ] API routes await params before use

---

## 📏 File Size Guidelines

| File Type | Max Lines | Action if Exceeded |
|-----------|-----------|-------------------|
| React Components | 250 | Split into subcomponents |
| Utility Functions | 100 | Split into multiple files |
| API Routes | 150 | Extract helper functions |
| Hooks | 100 | Split into smaller hooks |
| Type Definitions | 200 | Split by domain |

---

## ✅ Quality Gates (Must Pass)

Before submitting PR:

1. **Linting**: No ESLint errors
2. **Type Checking**: No TypeScript errors
3. **Tests**: All tests passing
4. **Build**: Project builds successfully
5. **Manual Testing**: Feature works as expected
6. **Self Review**: Code reviewed by author
7. **No Debug Code**: All console.log() removed
8. **Documentation**: Complex logic documented
9. **Prisma Alignment**: Schema matches code exactly
10. **Next.js 15 Compliance**: All params/searchParams awaited

---

## 🎯 Code Review Checklist

When reviewing code (self-review or peer):

- [ ] Code follows existing patterns
- [ ] Names are descriptive and clear
- [ ] Functions are small and focused
- [ ] No code duplication
- [ ] Error handling present
- [ ] Tests cover new functionality
- [ ] Comments explain complex logic
- [ ] Performance is acceptable
- [ ] No security vulnerabilities
- [ ] Accessibility considered (for UI)
- [ ] **Prisma schema alignment verified**
- [ ] **Next.js 15 params properly awaited**

---

## 🚨 Quick Reference Card

**Before ANY database code:**
1. Open `prisma/schema.prisma`
2. Verify field names and types
3. Update schema if needed
4. Run migration + generate
5. Write code matching schema

**Before ANY Next.js 15 route:**
1. Type params as `Promise<{ ... }>`
2. Type searchParams as `Promise<{ ... }>`
3. Always `await params` before use
4. Always `await searchParams` before use
5. Test in development mode

---

## 📚 Further Reading

- See `guidelines/naming-conventions.md` for detailed naming rules
- See `guidelines/code-organization.md` for file structure patterns
- See `practices/testing-requirements.md` for testing standards
- See `practices/prisma-guidelines.md` for Prisma best practices (if exists)
- See Next.js 15 Migration Guide: https://nextjs.org/docs/app/building-your-application/upgrading/version-15

---

*These standards are MANDATORY for all code contributions*  
*Last Updated: 2025-01-08*
