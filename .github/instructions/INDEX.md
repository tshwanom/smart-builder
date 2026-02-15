# 📚 Development Instructions Index

**Version:** 1.0  
**Last Updated:** 2025-11-08

---

## 🎯 How to Use This Index

This index helps you identify which instruction modules apply to your current task.

### The Process:
1. **Read your task/requirement**
2. **Answer the analysis questions** below
3. **System determines task type** automatically
4. **Follow only the relevant instructions**

---

## 🔍 STEP 1: Task Type Analysis

Answer these questions to determine your task type:

### Question 1: Does the functionality already exist?

**How to check:**
```powershell
# Search for feature keywords
Select-String -Path "src\**\*" -Pattern "feature_name"
git grep -i "functionality_keyword" src/

# Check components
Get-ChildItem -Path "src\components" -Recurse -Filter "*FeatureName*"

# Check API endpoints
Get-ChildItem -Path "src\pages\api" -Recurse -Filter "*feature*"
```

**Answer:**
- **NO** → Functionality doesn't exist → Go to Question 2
- **YES** → Functionality exists → Go to Question 3

---

### Question 2: You're building something NEW

**Is this UI work (components)?**
- YES → **Task Type: NEW FEATURE (UI)**
- NO → **Task Type: NEW FEATURE (Non-UI)**

**→ Jump to: [New Feature Instructions](#-new-feature-instructions)**

---

### Question 3: Functionality exists - What's the goal?

**A) Is it broken/buggy?**
- YES → **Task Type: BUG FIX**
- NO → Go to B

**B) Is it working but needs improvement (performance, structure, clarity)?**
- YES → **Task Type: REFACTORING**
- NO → Go to C

**C) Are you adding a variation or enhancement to existing feature?**
- YES → **Task Type: ENHANCEMENT** (treat as new feature)
- NO → **Task Type: UNCLEAR** (ask for clarification)

---

## 📋 STEP 2: Read Your Instructions

Based on task type, here's what to read:

---

### 🆕 NEW FEATURE Instructions

**Applies when:** Building functionality that doesn't exist

#### ⚠️ MANDATORY (Read First - 10 min):
- ✅ [`core/code-quality.md`](core/code-quality.md) - Code standards
- ✅ [`core/architecture-respect.md`](core/architecture-respect.md) - Search & understand before building

#### 📘 PRIMARY WORKFLOW (Read Once - 15 min):
- ✅ [`workflows/feature-development.md`](workflows/feature-development.md) - Complete feature workflow

#### 🔧 PRACTICES (Reference As Needed):
- ✅ [`practices/pre-implementation-analysis.md`](practices/pre-implementation-analysis.md) - Research template
- ✅ [`practices/git-workflow.md`](practices/git-workflow.md) - Commit, tag, push process
- ✅ [`practices/testing-requirements.md`](practices/testing-requirements.md) - Testing standards
- ✅ [`practices/documentation-updates.md`](practices/documentation-updates.md) - Doc requirements

#### 📏 GUIDELINES (Use When Relevant):

**For UI Work:**
- ✅ [`guidelines/component-modularization.md`](guidelines/component-modularization.md) - Component size rules
- ✅ [`guidelines/file-structure-rules.md`](guidelines/file-structure-rules.md) - Where files go
- ✅ [`guidelines/naming-conventions.md`](guidelines/naming-conventions.md) - Naming rules

**For All Work:**
- ✅ [`guidelines/code-organization.md`](guidelines/code-organization.md) - Code structure patterns

#### 📝 TEMPLATES (Copy When Creating):
- ✅ [`templates/commit-message-template.md`](templates/commit-message-template.md) - Detailed commit format
- ✅ [`templates/pre-implementation-template.md`](templates/pre-implementation-template.md) - Analysis doc format
- ✅ [`templates/todotracker-template.md`](templates/todotracker-template.md) - Task tracking format
- ✅ [`templates/feature-readme-template.md`](templates/feature-readme-template.md) - Feature doc format

**Estimated Reading Time:** 25-30 min (first time), 5-10 min (subsequent)

---

### 🐛 BUG FIX Instructions

**Applies when:** Fixing broken functionality that exists

#### ⚠️ MANDATORY (Read First - 10 min):
- ✅ [`core/code-quality.md`](core/code-quality.md) - Code standards
- ✅ [`core/architecture-respect.md`](core/architecture-respect.md) - Understand existing code

#### 📘 PRIMARY WORKFLOW (Read Once - 10 min):
- ✅ [`workflows/bug-fixing.md`](workflows/bug-fixing.md) - Bug fix workflow

#### 🔧 PRACTICES (Reference As Needed):
- ✅ [`practices/git-workflow.md`](practices/git-workflow.md) - Commit, tag, push process
- ✅ [`practices/testing-requirements.md`](practices/testing-requirements.md) - Testing standards

#### 📝 TEMPLATES (Copy When Committing):
- ✅ [`templates/commit-message-template.md`](templates/commit-message-template.md) - Detailed commit format

#### ❌ NOT NEEDED (Skip These):
- ❌ `practices/pre-implementation-analysis.md` (bug is localized)
- ❌ `practices/documentation-updates.md` (unless API changes)
- ❌ `guidelines/component-modularization.md` (not creating new)
- ❌ `guidelines/file-structure-rules.md` (no new files)
- ❌ `workflows/feature-development.md` (not new feature)
- ❌ `workflows/refactoring.md` (not refactoring)

**Estimated Reading Time:** 20 min (first time), 5 min (subsequent)

---

### ♻️ REFACTORING Instructions

**Applies when:** Improving existing working code (performance, structure, maintainability)

#### ⚠️ MANDATORY (Read First - 10 min):
- ✅ [`core/code-quality.md`](core/code-quality.md) - Code standards
- ✅ [`core/architecture-respect.md`](core/architecture-respect.md) - Understand patterns

#### 📘 PRIMARY WORKFLOW (Read Once - 15 min):
- ✅ [`workflows/refactoring.md`](workflows/refactoring.md) - Safe refactoring workflow

#### 🔧 PRACTICES (Reference As Needed):
- ✅ [`practices/pre-implementation-analysis.md`](practices/pre-implementation-analysis.md) - Analyze before refactoring
- ✅ [`practices/git-workflow.md`](practices/git-workflow.md) - Commit, tag, push process
- ✅ [`practices/testing-requirements.md`](practices/testing-requirements.md) - Testing critical!

#### 📏 GUIDELINES (Use When Splitting Components):
- ✅ [`guidelines/component-modularization.md`](guidelines/component-modularization.md) - Break down large files
- ✅ [`guidelines/code-organization.md`](guidelines/code-organization.md) - Restructuring patterns

#### 📝 TEMPLATES:
- ✅ [`templates/commit-message-template.md`](templates/commit-message-template.md) - Detailed commit format

#### ❌ NOT NEEDED (Skip These):
- ❌ `practices/documentation-updates.md` (unless structure changes significantly)
- ❌ `workflows/feature-development.md` (not new feature)
- ❌ `workflows/bug-fixing.md` (not a bug)

**Estimated Reading Time:** 25 min (first time), 10 min (subsequent)

---

## 🎯 Quick Reference Matrix

| Task Type | Core (Mandatory) | Primary Workflow | Key Practices | Guidelines Needed |
|-----------|-----------------|------------------|---------------|-------------------|
| **New Feature** | code-quality<br>architecture-respect | feature-development | pre-implementation<br>git-workflow<br>testing<br>documentation | component-modularization (UI)<br>file-structure<br>naming-conventions |
| **Bug Fix** | code-quality<br>architecture-respect | bug-fixing | git-workflow<br>testing | *(none usually)* |
| **Refactoring** | code-quality<br>architecture-respect | refactoring | pre-implementation<br>git-workflow<br>testing | component-modularization<br>code-organization |

---

## 📊 Decision Tree Flowchart

```
USER GIVES TASK
     ↓
🔍 Search Codebase
     ↓
Does functionality exist?
     ↓
     ├─ NO ─────────→ NEW FEATURE
     │                    ↓
     │               UI work?
     │                    ↓
     │                    ├─ YES → + Component Modularization
     │                    └─ NO  → Standard Feature Dev
     │
     └─ YES ────────→ Exists
                          ↓
                     Is it broken?
                          ↓
                          ├─ YES → BUG FIX
                          │
                          └─ NO ──→ Is it working?
                                         ↓
                                         └─ Improving code? → REFACTORING
```

---

## 🆘 Still Unsure?

### Common Scenarios:

**"Add export to Excel feature to BOQ"**
- Search: Does "BOQ export" or "Excel export for BOQ" exist?
- Result: NO → **NEW FEATURE** (UI + API work)
- Instructions: New Feature (UI) → Include component-modularization

**"Wall calculations showing wrong values"**
- Search: Does "wall calculation" exist?
- Result: YES, exists but broken → **BUG FIX**
- Instructions: Bug Fix → Skip pre-implementation analysis

**"Material components are slow and too large"**
- Search: Does "Material components" exist?
- Result: YES, exists and working → **REFACTORING**
- Instructions: Refactoring → Include component-modularization

**"Add dark mode to existing UI"**
- Search: Does "dark mode" or "theme toggle" exist?
- Result: NO → **NEW FEATURE** (UI work)
- Instructions: New Feature (UI) → Include all UI guidelines

---

## 📚 All Available Modules

### Core (Mandatory - Always Read)
- `core/code-quality.md` - Code standards
- `core/architecture-respect.md` - Architecture rules

### Workflows (Task-Specific)
- `workflows/feature-development.md` - New features
- `workflows/bug-fixing.md` - Bug fixes
- `workflows/refactoring.md` - Code improvements

### Practices (Reusable Processes)
- `practices/pre-implementation-analysis.md` - Research before coding
- `practices/git-workflow.md` - Commit, tag, push
- `practices/testing-requirements.md` - Testing standards
- `practices/documentation-updates.md` - Doc maintenance

### Guidelines (Specific Rules)
- `guidelines/component-modularization.md` - UI component rules
- `guidelines/file-structure-rules.md` - File locations
- `guidelines/naming-conventions.md` - Naming standards
- `guidelines/code-organization.md` - Code structure

### Templates (Copy-Paste Formats)
- `templates/commit-message-template.md` - Commit format
- `templates/pre-implementation-template.md` - Analysis format
- `templates/todotracker-template.md` - Task tracking format
- `templates/feature-readme-template.md` - Feature doc format

---

## 🔄 Workflow Summary

```
1. Read task → 2. Search codebase → 3. Determine type
              ↓
4. Read MANDATORY core modules (10 min)
              ↓
5. Read PRIMARY workflow (10-15 min)
              ↓
6. Reference PRACTICES as needed
              ↓
7. Apply GUIDELINES when relevant
              ↓
8. Use TEMPLATES for documentation
              ↓
9. Code → Test → Document → Commit → Push
```

---

*Use this index to efficiently navigate to only the instructions you need*  
*Core modules are ALWAYS mandatory - others depend on task type*  
*Last Updated: 2025-11-08*
