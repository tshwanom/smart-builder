#  Pre-Implementation Analysis

**Read Time:** 2 minutes | **Do Time:** 30-60 minutes

---

##  The 5 Questions

Answer these BEFORE coding:

### 1. Does it already exist? (15 min)
```powershell
# Search for similar code
Select-String -Pattern "FeatureName" -Path "src\**\*"
```
-  Not found  Build it
-  Found  Reuse or refactor it

### 2. Where should files go? (10 min)
```
Component used in 1 place  src/components/[page]/
Component used in 2+ places  src/components/common/
Utility for 1 feature  src/utils/[feature]/
Utility for many features  src/utils/common/
```

### 3. What can I reuse? (15 min)
- Check `src/components/common/` for UI
- Check `src/hooks/` for logic
- Check `src/utils/` for helpers
- Check `src/types/` for types

### 4. What's the 5-phase plan? (10 min)
1. **Foundation**: Types + file structure (2 hrs)
2. **Logic**: Functions + hooks (4 hrs)
3. **UI**: Components (4 hrs)
4. **Testing**: Tests + integration (3 hrs)
5. **Docs**: Comments + README (1 hr)

### 5. What could go wrong? (10 min)
- Performance issues?  Plan optimization
- Complex state?  Use existing patterns
- External API?  Plan error handling

---

##  Quick Doc Template

Save as `docs/project-roadmap/features/FEAT-XXX-Name/pre-implementation.md`:

```markdown
# Pre-Implementation: [Feature Name]

## 1. Duplication Check
-  Searched for: ComponentName, functionName, /api/endpoint
-  Result: Not found / Found in [file] (will reuse)

## 2. File Locations
```
src/components/new-feature/NewFeature.tsx
src/pages/api/new-feature/index.ts
src/types/new-feature.types.ts
```

## 3. Reusable Code
```typescript
import { Button } from '@/components/common/Button';
import { useFetch } from '@/hooks/data/useFetch';
```

## 4. Implementation Plan
1. Foundation (2 hrs) - Types + files
2. Logic (4 hrs) - Functions + API
3. UI (4 hrs) - Components
4. Testing (3 hrs) - Tests
5. Docs (1 hr) - README + comments

## 5. Risks
- [Risk]  [Mitigation]
```

---

*Spend 60 min researching to save 5 hours reworking*
