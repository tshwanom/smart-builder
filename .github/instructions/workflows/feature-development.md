# 🚀 Feature Development Workflow

**Applies To:** New feature implementation  
**Version:** 1.0  
**Last Updated:** 2025-11-08

---

## 📋 Complete Workflow for NEW Features

Use this when building functionality that doesn't exist yet.

---

## Phase 1: Planning & Research

### 1. Create Feature Folder
```powershell
mkdir "docs\project-roadmap\features\FEAT-XXX-Feature-Name"
cd "docs\project-roadmap\features\FEAT-XXX-Feature-Name"
```

### 2. Create Documentation Files
- `README.md` (use template from `templates/feature-readme-template.md`)
- `TODOTRACKER.md` (use template from `templates/todotracker-template.md`)
- `pre-implementation.md` (analysis findings)
- `ARCHITECTURE.md` (feature-specific design)

### 3. Pre-Implementation Analysis
Follow `practices/pre-implementation-analysis.md`:
- Study existing similar code (30-60 min)
- Search for duplicate functionality (15-30 min)
- Establish file locations (10-15 min)
- Document findings in `pre-implementation.md`

---

## Phase 2: Implementation

### 1. Create File Structure
Based on your analysis, create files in correct locations:

```
src/
├── components/[feature-name]/
│   ├── FeatureComponent.tsx
│   └── useFeature.ts
├── pages/api/[feature-name]/
│   └── index.ts
├── types/
│   └── feature.types.ts
└── utils/[feature-name]/
    └── helpers.ts
```

### 2. Update FILE_STRUCTURE.md
Immediately document all new files in `docs/architecture/FILE_STRUCTURE.md`

### 3. Implement & Test
- Write code following `core/code-quality.md`
- Add tests (see `practices/testing-requirements.md`)
- Manual testing
- Build and verify functionality works in development environment

---

## Phase 3: Documentation & Commit

### 1. Update TODOTRACKER.md
Mark task complete with details in `docs/project-roadmap/features/FEAT-XXX-Name/TODOTRACKER.md`

### 2. Update Documentation
Follow `practices/documentation-updates.md`:
- Update feature README in `docs/project-roadmap/features/FEAT-XXX-Name/README.md`
- Update `docs/architecture/FILE_STRUCTURE.md`
- Update `docs/project-roadmap/active/current-sprint.md`
- Add code comments

### 3. Commit with Detailed Message
Use template from `templates/commit-message-template.md`

### 4. Create Git Tag
```powershell
git tag -a "FEAT-XXX-Task-N-Description" -m "Descriptive message"
```

### 5. Push Everything
Follow `practices/git-workflow.md`:
```powershell
git push origin main
git push origin --tags
```

---

## ✅ Feature Development Checklist

- [ ] Feature folder created in `docs/project-roadmap/features/FEAT-XXX-Name/`
- [ ] README.md and TODOTRACKER.md created
- [ ] Pre-implementation analysis completed
- [ ] File locations determined and justified
- [ ] Code implemented following quality standards
- [ ] Tests written and passing
- [ ] `docs/architecture/FILE_STRUCTURE.md` updated
- [ ] `docs/project-roadmap/features/FEAT-XXX-Name/TODOTRACKER.md` updated
- [ ] `docs/project-roadmap/active/current-sprint.md` updated
- [ ] Documentation complete
- [ ] Detailed commit message written
- [ ] Git tag created
- [ ] Code and tags pushed

---

## 📚 Related Instructions

**MANDATORY:**
- `core/code-quality.md`
- `core/architecture-respect.md`

**PRACTICES:**
- `practices/pre-implementation-analysis.md`
- `practices/git-workflow.md`
- `practices/testing-requirements.md`
- `practices/documentation-updates.md`

**GUIDELINES (as needed):**
- `guidelines/component-modularization.md` (if UI work)
- `guidelines/file-structure-rules.md`
- `guidelines/naming-conventions.md`

---

*Follow this workflow for all new feature development*  
*Last Updated: 2025-11-08*
