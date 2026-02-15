#  File Structure Rules

**Read Time:** 90 seconds

---

## Decision Tree

### Where should my component go?

```
Used in 1 page only?
   src/components/[page-name]/

Used in 2+ pages?
   src/components/common/

Is it a layout component?
   src/components/layouts/
```

### Where should my utility go?

```
Used by 1 feature only?
   src/utils/[feature-name]/

Used by multiple features?
   src/utils/common/

Is it a validator?
   src/utils/validation/

Is it a formatter?
   src/utils/formatting/
```

### Where should my API route go?

```
Simple single endpoint?
   src/pages/api/[endpoint].ts

Multiple related endpoints?
   src/pages/api/[feature]/
     index.ts (main)
     [id].ts (by ID)
```

---

## Quick Examples

| File Type | Location | Example |
|-----------|----------|---------|
| Page component | `pages/` | `pages/dashboard.tsx` |
| Page-specific component | `components/[page]/` | `components/dashboard/StatsCard.tsx` |
| Reusable component | `components/common/` | `components/common/Button.tsx` |
| Layout | `components/layouts/` | `components/layouts/MainLayout.tsx` |
| Feature utility | `utils/[feature]/` | `utils/pricing/calculator.ts` |
| Shared utility | `utils/common/` | `utils/common/helpers.ts` |
| Custom hook | `hooks/[category]/` | `hooks/data/useFetch.ts` |
| Type definitions | `types/` | `types/user.types.ts` |
| API endpoint | `pages/api/[feature]/` | `pages/api/users/index.ts` |

---

## Naming Rules

| Type | Pattern |  Example |
|------|---------|-----------|
| Component file | PascalCase.tsx | `UserProfile.tsx` |
| Util file | camelCase.ts | `validators.ts` |
| Hook file | useCamelCase.ts | `useAuth.ts` |
| Type file | name.types.ts | `user.types.ts` |
| API folder | kebab-case/ | `user-profile/` |

---

*Right location = easy to find = faster development*
