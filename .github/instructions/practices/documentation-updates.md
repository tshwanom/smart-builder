#  Documentation Updates

**Read Time:** 45 seconds

---

## Mandatory Updates

### After EVERY file creation/deletion:
- [ ] Update `FILE_STRUCTURE.md` with:
  - Date
  - File path
  - Purpose
  - Why this location

### After EVERY task completion:
- [ ] Update `TODOTRACKER.md` with:
  - Change  to 
  - Add git tag
  - Update progress %
- [ ] For large projects (5+ phases), use folder system:
  - Update main `TODOTRACKER.md` dashboard
  - Move completed task details to `completed/` folder
  - Update `completed/INDEX.md` with completion entry
  - Update `in-progress/INDEX.md` with current work
  - Create phase summary in `completed/PHASE-X-COMPLETE.md` when phase finishes

---

## Code Documentation

### 1. Complex Logic (Required)
```typescript
//  GOOD: Explain WHY
function calculatePrice(base: number, tax: number): number {
  // Using toFixed(2) instead of Math.round() to prevent
  // floating-point precision errors causing 1-cent discrepancies
  return parseFloat((base * (1 + tax)).toFixed(2));
}

//  BAD: Obvious comment
function calculatePrice(base: number, tax: number): number {
  // Calculate price with tax
  return base * (1 + tax);
}
```

### 2. Type Documentation (Optional)
```typescript
/**
 * User profile data structure
 */
interface UserProfile {
  id: string;
  name: string;
  email: string;
}
```

---

## When to Update

| Action | Update FILE_STRUCTURE.md | Update TODOTRACKER.md | Add Code Comments | Update Folders |
|--------|:------------------------:|:---------------------:|:-----------------:|:--------------:|
| Create file |  Mandatory | | | |
| Delete file |  Mandatory | | | |
| Complete task | |  Mandatory | |  If large project |
| Complete phase | | |  Mandatory |  Create PHASE-X-COMPLETE.md |
| Complex logic | | |  Recommended | |

---

## TODOTRACKER Folder System (Large Projects)

**When project has 5+ phases or TODOTRACKER > 1000 lines:**

### Folder Structure
```
FEAT-XXX-Name/
├── TODOTRACKER.md          # Dashboard only (100-200 lines)
├── completed/
│   ├── INDEX.md           # Completion table
│   └── PHASE-X-COMPLETE.md
├── in-progress/
│   ├── INDEX.md           # Sprint overview
│   └── PHASE-X-Active.md
└── planned/
    ├── INDEX.md           # Roadmap
    └── PHASE-X-Plan.md
```

### Update Workflow
1. **During active work:**
   - Update `in-progress/INDEX.md` with current tasks
   - Keep notes in `in-progress/PHASE-X-Active.md`

2. **When task completes:**
   - Update main `TODOTRACKER.md` progress bars
   - Add entry to `completed/INDEX.md`
   - Create task summary in `completed/` if significant

3. **When phase completes:**
   - Create `completed/PHASE-X-COMPLETE.md` with full details
   - Update `completed/INDEX.md` table
   - Move to next phase in `in-progress/`

### Example: completed/INDEX.md
```markdown
# ✅ Completed Work Index

| Phase | Tasks | Duration | Git Tag | Details |
|-------|-------|----------|---------|---------|
| Phase 1 | 6 tasks | 2 days | Phase-1-Complete | [View](PHASE-1-COMPLETE.md) |
| Phase 2 | 3 tasks | 3 days | Phase-2-Complete | [View](PHASE-2-COMPLETE.md) |

## Individual Tasks
| Task | Description | Duration | Git Tag |
|------|-------------|----------|---------|
| T5.2.2 | EventBus Restore | 2 hrs | T5.2.2-EventBus-Restored |
```

---

*Documentation prevents confusion*
