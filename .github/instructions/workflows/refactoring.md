# ♻️ Refactoring Workflow

**Applies To:** Improving existing working code  
**Version:** 1.0  
**Last Updated:** 2025-11-08

---

## 📋 Complete Workflow for Refactoring

Use this when improving code that works but needs restructuring.

---

## Phase 1: Analysis & Planning

### 1. Identify Refactoring Need
**Valid reasons for refactoring:**
- Code duplication exists
- Functions/components too large (>250 lines)
- Performance issues identified
- Code complexity too high
- Difficult to test or maintain

### 2. Pre-Refactoring Analysis
Follow `practices/pre-implementation-analysis.md`:
- Study current implementation thoroughly
- Identify patterns to extract
- Plan new structure
- Document rationale

### 3. Ensure Tests Exist
**CRITICAL:** Must have tests BEFORE refactoring
```powershell
# Check test coverage
npm test -- --coverage
```

If tests don't exist:
1. Write tests first (test current behavior)
2. THEN refactor
3. Tests ensure behavior unchanged

---

## Phase 2: Safe Refactoring

### 1. Create Git Checkpoint
```powershell
git tag -a "REFACTOR-XXX-Before" -m "Checkpoint before refactor"
git push origin --tags
```

### 2. Refactor in Small Steps
**One change at a time:**

```typescript
// Step 1: Extract helper function
// Before
function MaterialCard() {
  const total = quantity * unitPrice * (1 + markup/100);
  // ...
}

// After Step 1
function MaterialCard() {
  const total = calculateTotalWithMarkup(quantity, unitPrice, markup);
  // ...
}

function calculateTotalWithMarkup(qty, price, markup) {
  return qty * price * (1 + markup/100);
}

// Run tests after EACH step
npm test
```

### 3. Test After Each Change
- Run full test suite
- Manual testing if needed
- Commit if tests pass
- Rollback if tests fail

---

## Phase 3: Component Modularization

### For Large Components (>250 lines)
Follow `guidelines/component-modularization.md`:

```
Before (MaterialCard.tsx - 400 lines):
MaterialCard/
└── MaterialCard.tsx

After:
MaterialCard/
├── index.tsx (composition only)
├── MaterialCardHeader.tsx
├── MaterialCardBody.tsx
├── MaterialCardFooter.tsx
└── useMaterialCard.ts (logic extracted)
```

### Extract Custom Hooks
```typescript
// Before - logic in component
function MaterialCard() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(setMaterials)
      .finally(() => setLoading(false));
  }, []);
  
  return (/* JSX */);
}

// After - logic in custom hook
function MaterialCard() {
  const { materials, loading } = useMaterials();
  return (/* JSX */);
}

function useMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(setMaterials)
      .finally(() => setLoading(false));
  }, []);
  
  return { materials, loading };
}
```

---

## Phase 4: Validation

### 1. Comprehensive Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Performance checked (not worse)
- [ ] No regressions introduced

### 2. Code Review
- Self-review changes
- Ensure behavior unchanged
- Verify improvements achieved
- Check no new issues introduced

---

## Phase 5: Documentation & Commit

### 1. Update Documentation
- Update component README if needed
- Add comments for complex refactored logic
- Update FILE_STRUCTURE.md if files changed

### 2. Detailed Commit
```
REFACTOR-XXX: Modularized MaterialCard component

WHAT CHANGED:
- Split 400-line MaterialCard into 4 subcomponents
- Extracted useMaterialCard custom hook
- Removed code duplication in calculations

WHY THIS CHANGE:
- Component was too large and difficult to maintain
- Logic was mixed with presentation
- Duplicated calculation code in 3 places

HOW IT WORKS:
- index.tsx now composes subcomponents
- useMaterialCard.ts handles all business logic
- Each subcomponent has single responsibility

TESTING:
✅ All existing tests still pass
✅ No behavior changes
✅ Manual testing confirmed
✅ Performance unchanged

FILES CHANGED:
- src/components/MaterialCard/ (restructured)
  - index.tsx (100 lines, was MaterialCard.tsx 400 lines)
  - MaterialCardHeader.tsx (50 lines, NEW)
  - MaterialCardBody.tsx (80 lines, NEW)
  - MaterialCardFooter.tsx (40 lines, NEW)
  - useMaterialCard.ts (60 lines, NEW)
```

### 3. Create Git Tag
```powershell
git tag -a "REFACTOR-XXX-Complete" -m "MaterialCard modularization complete"
git push origin main
git push origin --tags
```

---

## ✅ Refactoring Checklist

- [ ] Valid reason for refactoring identified
- [ ] Tests exist BEFORE starting
- [ ] Pre-refactoring checkpoint created
- [ ] Changes made in small increments
- [ ] Tests run after each change
- [ ] All tests still passing
- [ ] Behavior unchanged
- [ ] Performance not degraded
- [ ] Documentation updated
- [ ] Detailed commit created
- [ ] Git tag added

---

## 🚫 Refactoring DON'Ts

- ❌ Don't refactor without tests
- ❌ Don't change behavior while refactoring
- ❌ Don't refactor everything at once
- ❌ Don't refactor while fixing bugs (separate PR)
- ❌ Don't skip testing after changes

---

## 📚 Related Instructions

**MANDATORY:**
- `core/code-quality.md`
- `core/architecture-respect.md`

**PRACTICES:**
- `practices/pre-implementation-analysis.md`
- `practices/git-workflow.md`
- `practices/testing-requirements.md`

**GUIDELINES:**
- `guidelines/component-modularization.md` (if splitting components)
- `guidelines/code-organization.md`

**NOT NEEDED:**
- ❌ `practices/documentation-updates.md` (unless API changes)
- ❌ `workflows/feature-development.md` (not new feature)

---

*Refactor safely with tests - behavior should never change*  
*Last Updated: 2025-11-08*
