# 🏛️ Architecture Respect

**Status:** MANDATORY - Apply to ALL tasks  
**Version:** 2.0  
**Last Updated:** 2025-11-09

---

## ⚠️ This is MANDATORY

Before writing ANY code, you MUST study the existing architecture and avoid duplication.

---

## 🚨 CRITICAL: Clean Architecture File Structure Rules

**REFACTOR-001 Clean Architecture Migration is in progress. These rules are NON-NEGOTIABLE:**

### ✅ Correct Structure (Follow This)

```
mob-smart-builder/
│
├── src/                                    # CLEAN ARCHITECTURE (all business logic)
│   ├── core/domain/                       # Core domain entities & value objects
│   └── modules/                           # BOUNDED CONTEXTS (feature modules)
│       ├── [module-name]/                 # Each feature is a module
│           ├── domain/                    # Domain layer (entities, interfaces)
│           ├── application/               # Application layer (use cases)
│           ├── infrastructure/            # Infrastructure layer (repositories)
│           └── presentation/              # Presentation layer (UI components)
│               └── components/            # Module-specific UI components
│
├── app/                                    # Next.js Routes (THIN LAYER - routing only)
│   ├── (app)/                             # Authenticated routes
│   ├── (auth)/                            # Public auth routes
│   ├── (marketing)/                       # Public marketing routes
│   └── api/                               # API routes
│
├── components/                            # ONLY SHARED UI (NOT feature-specific)
│   ├── ui/                               # shadcn/ui base components only
│   └── providers/                        # Context providers only
│
├── lib/                                   # Next.js utilities
└── store/                                 # Global UI state
```

### ❌ Forbidden Patterns (REJECT Immediately)

| ❌ WRONG | ✅ CORRECT | Reason |
|----------|-----------|---------|
| `components/Dashboard/` | `src/modules/dashboard/presentation/components/` | Dashboard is a MODULE, not shared UI |
| `components/Notifications/` | `src/modules/notifications/presentation/components/` | Notifications is a MODULE |
| `components/Projects/` | `src/modules/projects/presentation/components/` | Projects is a MODULE |
| `components/MOBSmartDesigner/` | DELETE or `src/modules/designer/` | Old monolithic code |
| `components/[AnyFeature]/` | `src/modules/[feature]/presentation/` | Feature components belong in modules |

### 🎯 File Location Decision Tree

**Before creating ANY file, ask these questions:**

1. **Is this a SHARED UI component** (Button, Card, Input)?
   - YES → `components/ui/`
   - NO → Continue to question 2

2. **Is this a FEATURE-SPECIFIC component** (Dashboard, Projects, etc.)?
   - YES → `src/modules/[feature]/presentation/components/`
   - NO → Continue to question 3

3. **Is this a DOMAIN entity or value object?**
   - YES → `src/core/domain/entities/` or `src/core/domain/value-objects/`
   - NO → Continue to question 4

4. **Is this a USE CASE (business logic)?**
   - YES → `src/modules/[feature]/application/use-cases/`
   - NO → Continue to question 5

5. **Is this a REPOSITORY or DATA ACCESS?**
   - YES → `src/modules/[feature]/infrastructure/repositories/`
   - NO → You're in the wrong place, review the structure

### 🚫 Auto-Reject Violations

**Pull requests will be AUTOMATICALLY REJECTED if:**

1. **Creating feature components in `components/` folder**
   - Example: Creating `components/Dashboard/DashboardCard.tsx`
   - Correct: `src/modules/dashboard/presentation/components/DashboardCard.tsx`

2. **Importing from wrong locations**
   ```typescript
   // ❌ WRONG
   import { DashboardLayout } from '@/components/Dashboard/DashboardLayout';
   
   // ✅ CORRECT
   import { DashboardLayout } from '@/src/modules/dashboard/presentation';
   ```

3. **Mixing layers within a module**
   - Example: Putting use cases in presentation folder
   - Each layer (domain, application, infrastructure, presentation) must be separate

4. **Not following module structure**
   - Every module MUST have all 4 layers (even if some are empty)
   - No shortcuts like putting everything in one file

---

## 🎯 Core Principle

**Understand Before You Build**

Never write code without:
1. Studying similar existing code
2. Searching for duplicates
3. Understanding file location patterns
4. Documenting your analysis

---

## 📋 Pre-Coding Checklist (MANDATORY)

### Step 1: Study Related Code (30-60 min)

```powershell
# Search for similar features
Select-String -Path "src\**\*.tsx" -Pattern "similar_feature"

# Search for similar patterns  
git grep "pattern_name" src/

# Search for related components
Select-String -Path "src\components\**\*.tsx" -Pattern "component_type"
```

**What to Study:**
- ✅ Existing similar features/components
- ✅ Current patterns and conventions
- ✅ Related utility functions
- ✅ Similar API endpoints
- ✅ Database schema and queries
- ✅ State management patterns
- ✅ Error handling approaches

### Step 2: Search for Duplication (15-30 min)

**CRITICAL:** Ensure code doesn't already exist

```powershell
# Search by function name
Select-String -Path "src\**\*" -Pattern "functionName"

# Search by component name
git grep -i "ComponentName" src/

# Search by feature keyword
Select-String -Path "src\**\*" -Pattern "feature_keyword"
```

**If Code Exists:**
- ✅ Use existing code (import and reuse)
- ✅ Extend existing code if needed
- ✅ Refactor if improvement needed
- ❌ DO NOT create duplicate

### Step 3: Establish File Location (10-15 min)

**Before creating ANY file, determine correct location:**

```
React Component?
├─ Shared/Reusable? → src/components/common/
├─ Feature-specific? → src/components/[feature-name]/
├─ Layout component? → src/components/layout/
└─ Page component? → src/pages/

Utility Function?
├─ Validation? → src/utils/validation/
├─ Formatting? → src/utils/formatting/
├─ API helpers? → src/utils/api/
└─ General helpers? → src/utils/helpers/

API Endpoint?
├─ Public API? → src/pages/api/public/
├─ Feature API? → src/pages/api/[feature-name]/
└─ Admin API? → src/pages/api/admin/

Custom Hook?
├─ Data fetching? → src/hooks/data/
├─ UI/UX? → src/hooks/ui/
└─ Business logic? → src/hooks/[feature-name]/
```

See `guidelines/file-structure-rules.md` for complete guide.

### Step 4: Document Your Analysis

Create `pre-implementation-analysis.md` in your feature folder:

```markdown
# Pre-Implementation Analysis

## Code Research Summary
- Similar code found: [List files]
- Patterns identified: [List patterns]
- Reusable parts: [What can be reused]

## Duplication Check
✅ No duplicates found for:
- [List what you searched]

## File Location Plan
- [File path] - [Reason for location]

## Dependencies
- Existing code to reuse: [List imports]
```

---

## 🚫 Architecture Violations (Auto-Reject)

Your PR will be **AUTOMATICALLY REJECTED** if:

1. **No Pre-Implementation Analysis**
   - No code research documented
   - No duplication search performed
   - No file location justification

2. **Code Duplication**
   - Reimplemented existing functionality
   - Ignored existing utilities/components
   - Created redundant helpers

3. **Wrong File Location**
   - Files in incorrect folders
   - Doesn't follow project structure
   - Violates naming conventions

4. **Breaking Patterns**
   - Introduces new patterns without justification
   - Ignores established conventions
   - Creates architectural inconsistency

5. **FILE_STRUCTURE.md Not Updated**
   - Added files without documentation
   - No entry in FILE_STRUCTURE.md
   - Missing file purpose description

---

## ✅ Architecture Compliance

### Search Commands Reference

**PowerShell (Windows):**
```powershell
# Search for text in files
Select-String -Path "src\**\*.tsx" -Pattern "searchTerm"

# Search for file by name
Get-ChildItem -Path src -Recurse -Filter "*filename*"

# Case-insensitive search
Select-String -Path "src\**\*" -Pattern "term" -CaseInsensitive
```

**Git Grep (Cross-platform):**
```bash
# Search in tracked files
git grep "searchTerm"

# Search with line numbers
git grep -n "searchTerm"

# Case-insensitive
git grep -i "searchterm"

# Search specific file types
git grep "searchTerm" -- "*.tsx" "*.ts"
```

### File Location Decision Matrix

| Question | Answer | Location |
|----------|--------|----------|
| Is it a shared UI component? | Yes | `src/components/common/` |
| Is it feature-specific UI? | Yes | `src/components/[feature]/` |
| Is it a utility function? | Yes | `src/utils/[category]/` |
| Is it an API endpoint? | Yes | `src/pages/api/[feature]/` |
| Is it a custom hook? | Yes | `src/hooks/[category]/` |
| Is it a type definition? | Yes | `src/types/` |

### Naming Conventions

| File Type | Convention | Example |
|-----------|-----------|---------|
| React Components | PascalCase.tsx | `MaterialCard.tsx` |
| Utility Functions | camelCase.ts | `calculateCost.ts` |
| Custom Hooks | useCamelCase.ts | `useMaterials.ts` |
| API Routes | kebab-case.ts | `get-materials.ts` |
| Types | PascalCase.types.ts | `Material.types.ts` |

---

## 📂 After Creating Files

**IMMEDIATELY update:**

1. **`docs/project-roadmap/architecture/FILE_STRUCTURE.md`**
```markdown
## 2025-11-08 - Benj - [FEAT-ID]

### Files Added:
- `src/path/to/NewFile.tsx`
  - **Purpose**: [What it does]
  - **Dependencies**: [What it imports]
  - **Used By**: [What imports it]
  - **Location Rationale**: [Why this location]
```

2. **Feature README.md**
   - Document new files in `docs/project-roadmap/features/FEAT-XXX-Name/`
   - Update architecture section if needed

---

## 🎯 Compliance Checklist

Before submitting PR:

- [ ] Studied existing similar code (30-60 min)
- [ ] Searched for duplicate code (15-30 min)
- [ ] Established proper file location (10-15 min)
- [ ] Documented pre-implementation analysis
- [ ] Followed naming conventions
- [ ] Updated FILE_STRUCTURE.md
- [ ] No code duplication exists
- [ ] Files in correct locations

---

## 📚 Related Guidelines

- `guidelines/file-structure-rules.md` - Complete file location guide
- `guidelines/naming-conventions.md` - Detailed naming rules
- `guidelines/code-organization.md` - Code structure patterns
- `practices/pre-implementation-analysis.md` - Analysis template

---

*Architecture respect is MANDATORY - ensures consistent, maintainable codebase*  
*Last Updated: 2025-11-08*
