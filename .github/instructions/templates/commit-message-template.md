#  Commit Message Template

**Read Time:** 20 seconds

---

## Format

```
[TYPE] Brief description (50 chars max)

WHY: Why this change was needed
HOW: How you implemented it
TESTING: How you verified it works

Files: src/file1.ts, src/file2.ts
```

---

## Types

| Type | When to Use |
|------|-------------|
| FEAT | New feature |
| FIX | Bug fix |
| REFACTOR | Code improvement (no behavior change) |
| DOCS | Documentation only |
| TEST | Add/update tests |
| STYLE | Format/style changes |

---

## Examples

### Example 1: New Feature
```
FEAT: Add user profile component

WHY: Users need to view/edit their profile information
HOW: Created UserProfile.tsx with form validation and API integration
TESTING: Tested CRUD operations, edge cases, and error states

Files: src/components/UserProfile.tsx, src/pages/api/user/profile.ts, src/types/user.types.ts
```

### Example 2: Bug Fix
```
FIX: Resolve price calculation rounding error

WHY: Prices were rounding incorrectly causing 1-cent discrepancies
HOW: Changed Math.round() to toFixed(2) in calculateTotal()
TESTING: Verified with edge cases (0.005, 0.995) and existing tests

Files: src/utils/pricing.ts
```

---

*Good commits = easy code review + quick rollback*
