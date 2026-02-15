#  Git Workflow

**Read Time:** 60 seconds

---

## 6-Step Process

### 1. Stage Changes
```powershell
git add src/file1.ts src/file2.ts
```

### 2. Commit with Message
```powershell
git commit -m "[TYPE] Brief description

WHY: Why this change was needed
HOW: How you implemented it
TESTING: How you verified it works

Files: src/file1.ts, src/file2.ts"
```

### 3. Create Git Tag
```powershell
git tag -a FEAT-XXX-phase-name -m "Completed [phase name]"
```

### 4. Push Code
```powershell
git push origin branch-name
```

### 5. Push Tags
```powershell
git push origin --tags
```

### 6. Update TODOTRACKER
- Change  to 
- Add git tag to list
- Update progress %

---

## Commit Types

| Type | Use Case |
|------|----------|
| FEAT | New feature |
| FIX | Bug fix |
| REFACTOR | Code improvement |
| DOCS | Documentation |
| TEST | Tests |

---

## Git Tags Format

```
FEAT-XXX-foundation    # Phase 1 complete
FEAT-XXX-logic         # Phase 2 complete
FEAT-XXX-ui            # Phase 3 complete
FEAT-XXX-testing       # Phase 4 complete
FEAT-XXX-complete      # Feature done
```

---

## Quick Rollback

```powershell
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert to specific tag
git checkout FEAT-XXX-foundation
```

---

*Good git hygiene = easy rollback*
