
**applyTo:** "UI components / modular Next.js development / Domain entities and value objects"  

# 🧩 Component & Code Modularization Instructions

**Version:** 2.0  
**Status:** ACTIVE — Apply to all React/Next.js UI work AND Domain layer code

---

## 🎯 Purpose

Ensure UI components, domain entities, and value objects remain **small**, **clear**, and **easy to maintain** by splitting large files into logical parts when needed.

---

## ✅ Rules for File Size & Structure

| Guideline | Rule |
|---------|------|
| **Max file size** | **200-250 lines per file (HARD LIMIT - NON-NEGOTIABLE)** |
| **Responsibility** | One file = one purpose |
| **Folder structure** | **MANDATORY:** Group related parts together |
| **Simplicity** | Parent file should compose, not contain all logic |

### 🚨 NON-NEGOTIABLE FILE SIZE LIMITS

- **HARD LIMIT: 200-250 lines maximum**
- **NO EXCEPTIONS** - Any file exceeding 250 lines MUST be split
- **AUTO-REJECT** - Pull requests with files > 250 lines will be automatically rejected
- **Modularization Required** - Use folder grouping when splitting files

---

## 📌 When to Split ANY File

Break a file up if:

- **CRITICAL: Exceeds 250 lines (AUTO-REJECT if not fixed)**
- **UI Components**: Multiple visual sections, business logic mixed in, loading/error states
- **Domain Entities**: Multiple responsibilities, large interface definitions
- **Value Objects**: Multiple enums, extensive factory methods, long type definitions
- **Services**: Multiple calculation methods, extensive utilities
- **Any file**: Multiple unrelated concerns

---

## ✅ Modular Breakdown Patterns

### 🎨 UI Component Pattern
When a React component becomes large:

```
StatsCard/
 ├─ index.tsx              // Parent component: layout + composition only
 ├─ StatsCardHeader.tsx    // Extracted UI section
 ├─ StatsCardBody.tsx      // Extracted UI section
 ├─ useStatsCard.ts        // Extract complex state or data logic
 ├─ StatsCardLoading.tsx   // Loading state component (optional)
 └─ StatsCardError.tsx     // Error state component (optional)
```

### 🏗️ Domain Entity Pattern  
When a domain entity becomes large:

```
Material/
 ├─ index.ts              // Main Material interface + core functions
 ├─ MaterialTypes.ts      // Enums, constants, type definitions
 ├─ MaterialValidation.ts // Validation functions
 ├─ MaterialCalculation.ts// Calculation utilities
 └─ MaterialFactory.ts    // Factory methods (optional)
```

### 💰 Value Object Pattern
When a value object becomes large:

```
Quantity/
 ├─ index.ts              // Main Quantity class + core operations
 ├─ QuantityTypes.ts      // Enums, constants, symbols
 ├─ QuantityFactory.ts    // Static factory methods
 └─ QuantityValidation.ts // Validation utilities (optional)
```

---

## 📐 Folder Structure Responsibilities

### UI Components
| File | Purpose |
|------|---------|
| `index.tsx` | Keep markup small; receives data, passes props |
| UI subcomponents | Contain clean JSX for individual sections |
| Hooks | Handle data fetching, formatting, complex local state |
| State components | Show loading/empty/error separately |

### Domain Services
| File | Purpose |
|------|---------|
| `index.ts` | Main service class + core business functions |
| Utilities file | Helper functions, calculators |
| Types file | Interfaces, enums, type definitions |
| Validation file | Input validation, business rules |

### Value Objects
| File | Purpose |
|------|---------|
| `index.ts` | Main class with core operations |
| Types file | Enums, constants, symbols, type mappings |
| Factory file | Static factory methods, parsing |
| Utilities file | Helper functions, calculators |

---

## 🛑 Forbidden Practices

### UI Components
- Large data fetching logic
- Condition-heavy rendering
- Long helpers or formatting functions
- Multiple unrelated UI blocks

### Domain Layer
- **❌ NO FOLDERS**: Creating loose files in same directory
- **❌ MIXED CONCERNS**: Putting enums with class logic
- **❌ LARGE FILES**: Single files over 300 lines
- **❌ POOR IMPORTS**: Relative imports outside folder structure

### ALL CODE
- Extract these instead of keeping in main file
- Always group related files in folders
- Maintain clean import/export structure

---

## 📁 **MANDATORY: Folder Grouping Rules**

### ✅ CORRECT Structure
```
value-objects/
├─ Money.ts              // Simple, under 200 lines
├─ Dimensions.ts         // Simple, under 300 lines  
├─ Quantity/             // Complex, modularized
│  ├─ index.ts           // Main Quantity class
│  ├─ QuantityTypes.ts   // Enums & constants
│  └─ QuantityFactory.ts // Factory methods
└─ Volume.ts             // Simple, under 300 lines
```

### ❌ INCORRECT Structure  
```
value-objects/
├─ Money.ts
├─ Dimensions.ts
├─ Quantity.ts           // 400+ lines - TOO BIG
├─ QuantityTypes.ts      // Loose in same folder
├─ QuantityFactory.ts    // Not grouped with main class
└─ Volume.ts
```

### 🎯 Import Pattern
```typescript
// ✅ GOOD - Clean folder-based imports
export { Quantity } from './Quantity';
export { QuantityFactory } from './Quantity/QuantityFactory';
export { QuantityUnit } from './Quantity/QuantityTypes';

// ❌ BAD - Loose file imports
export { Quantity } from './Quantity';
export { QuantityFactory } from './QuantityFactory';  // Should be in folder
export { QuantityUnit } from './QuantityTypes';       // Should be in folder
```

---

## ✅ Benefits

- **Easier to read + test** - Smaller, focused files
- **Higher reusability** - Clear separation of concerns  
- **Faster navigation** - Logical folder grouping
- **Cleaner version control** - Smaller diff chunks
- **Better architecture** - Enforces separation of concerns
- **Reduced coupling** - Clear import/export boundaries

---

## 📋 Modularization Checklist

Before marking any code complete:

- [ ] All files under 250 lines (prefer 200-250)
- [ ] Related files grouped in folders (not loose)  
- [ ] Main file named `index.ts/tsx` in folder
- [ ] Supporting files have descriptive names
- [ ] Clean import/export structure
- [ ] Single responsibility per file
- [ ] Proper folder hierarchy maintained

---

**End of Instructions**  
**Always modularize before complexity becomes a problem.**  
**Always use folder grouping for modularized components.**  

# 🧩 Component Modularization Instructions

**Version:** 1.0  
**Status:** ACTIVE — Apply to all React/Next.js UI work

---

## 🎯 Purpose

Ensure UI components remain **small**, **clear**, and **easy to maintain** by splitting large files into logical parts when needed.

---

## ✅ Rules for Component Size & Structure

| Guideline | Rule |
|---------|------|
| **Max file size** | 250–300 lines per component |
| **Responsibility** | One component = one purpose |
| **Folder structure** | Group related parts together |
| **Simplicity** | Parent file should compose, not contain logic |

---

## 📌 When to Split a Component (e.g., `StatsCard.tsx`)

Break a component up if:

- UI contains multiple visual sections
- Business logic sits inside the UI layer
- Loading/Error UI is mixed in the main file
- Props or logic grows in complexity

---

## ✅ Modular Breakdown Pattern

When a component becomes large:

```
StatsCard/
 ├─ index.tsx              // Parent component: layout + composition only
 ├─ StatsCardHeader.tsx    // Extracted UI section
 ├─ StatsCardBody.tsx      // Extracted UI section
 ├─ useStatsCard.ts        // Extract complex state or data logic
 ├─ StatsCardLoading.tsx   // Loading state component (optional)
 └─ StatsCardError.tsx     // Error state component (optional)
```

---

## 📐 Responsibilities

| File | Purpose |
|------|---------|
| `index.tsx` | Keep markup small; receives data, passes props |
| UI subcomponents | Contain clean JSX for individual sections |
| Hooks | Handle data fetching, formatting, complex local state |
| State components | Show loading/empty/error separately |

---

## 🛑 Forbidden in Main Component

- Large data fetching logic
- Condition-heavy rendering
- Long helpers or formatting functions
- Multiple unrelated UI blocks

Extract these instead.

---

## ✅ Benefits

- Easier to read + test
- Higher reusability
- Faster navigation in codebase
- Cleaner version control & reviews

---

**End of Instructions**  
**Always modularize before complexity becomes a problem.**
