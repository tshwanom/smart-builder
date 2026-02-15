# 🐛 Bug Fixing Workflow

**Applies To:** Fixing broken functionality  
**Version:** 1.0  
**Last Updated:** 2025-11-08

---

## 📋 Complete Workflow for Bug Fixes

Use this when fixing functionality that exists but is broken.

---

## Phase 1: Investigation

### 1. Reproduce the Bug
- Test the broken functionality
- Document steps to reproduce
- Identify error messages
- Check browser console/logs

### 2. Locate the Code
```powershell
# Search for relevant code
Select-String -Path "src\**\*" -Pattern "relevant_function"
git grep "error_message" src/
```

### 3. Understand the Context
- Read surrounding code
- Check git history: `git log --follow [file]`
- Review related tests
- Check when bug was introduced

---

## Phase 2: Fix Implementation

### 1. Write Failing Test First
```typescript
// Add test that demonstrates the bug
test('should save percentages correctly', () => {
  const result = savePercentages(testData);
  expect(result.saved).toBe(true);
});
```

### 2. Implement the Fix
- Make minimal changes
- Follow existing patterns
- Don't refactor while fixing (separate PR)
- Ensure fix is targeted and specific

### 3. Verify Tests Pass
```powershell
npm test
```

---

## Phase 3: Validation

### 1. Manual Testing
- Test the exact scenario reported
- Test edge cases
- Test related functionality (regression check)
- Test in different browsers if UI bug

### 2. Check for Side Effects
- Run full test suite
- Check related features still work
- Review impact on other components

---

## Phase 4: Documentation & Commit

### 1. Update Tests
- Ensure bug won't reoccur
- Add regression test if needed
- Update test documentation

### 2. Commit with Clear Message
```
FIX-XXX: Fixed percentage save bug in BOQ calculator

WHAT CHANGED:
- Fixed state update in Calculator.tsx line 45
- Added null check for percentage value
- Updated savePercentages() function

WHY THIS CHANGE:
- Percentages were not saving due to undefined state
- User reported data loss on save action
- Issue tracked in FIX-XXX

HOW IT WORKS:
- Added validation before state update
- Ensures percentage value is defined
- Falls back to 0 if undefined

TESTING:
✅ Added regression test
✅ Manual testing confirmed fix
✅ All existing tests pass

FILES CHANGED:
- src/components/BOQ/Calculator.tsx
- test/BOQ/Calculator.test.tsx
```

### 3. Create Git Tag
```powershell
git tag -a "FIX-XXX-Percentage-Save-Bug" -m "Fixed percentage save issue"
```

### 4. Push
```powershell
git push origin main
git push origin --tags
```

---

## ✅ Bug Fix Checklist

- [ ] Bug reproduced and documented
- [ ] Code location identified
- [ ] Context understood (git history reviewed)
- [ ] Failing test written
- [ ] Fix implemented (minimal changes)
- [ ] All tests passing
- [ ] Manual testing completed
- [ ] Regression check performed
- [ ] Commit message detailed
- [ ] Git tag created
- [ ] Code pushed

---

## 🚫 Bug Fix DON'Ts

- ❌ Don't refactor while fixing (separate PR)
- ❌ Don't fix multiple bugs in one commit
- ❌ Don't skip writing tests
- ❌ Don't make large changes
- ❌ Don't ignore root cause

---

## 📚 Related Instructions

**MANDATORY:**
- `core/code-quality.md`
- `core/architecture-respect.md`

**PRACTICES:**
- `practices/git-workflow.md`
- `practices/testing-requirements.md`

**NOT NEEDED:**
- ❌ `practices/pre-implementation-analysis.md` (bug is localized)
- ❌ `practices/documentation-updates.md` (unless API changes)
- ❌ `workflows/feature-development.md` (not new feature)

---

*Keep bug fixes focused and minimal*  
*Last Updated: 2025-11-08*
