---
applyTo: 'agents, developers'
---

# Task Understanding & Requirements Approval Process

## Purpose
This instruction ensures that all tasks are thoroughly understood and illustrated before implementation begins. No development work should commence until the product owner has explicitly approved the understanding of requirements.

## Process Flow

### 1. Initial Task Analysis
When presented with any task or requirement:
- **Break down** the request into clear, actionable components
- **Identify** all stakeholders and affected systems
- **Clarify** any ambiguous requirements through questions
- **Document** assumptions made during analysis

### 2. Requirements Illustration
Create a comprehensive illustration of understanding that includes:
- **Task Summary**: Clear, concise description of what needs to be accomplished
- **Acceptance Criteria**: Specific, measurable outcomes that define success
- **Technical Approach**: High-level implementation strategy (**MUST be Prisma-first development**)
- **Prisma Schema Impact**: How the task affects or requires database schema changes
- **Dependencies**: External factors or prerequisites
- **Risks & Considerations**: Potential challenges or edge cases
- **Timeline Estimate**: Realistic effort assessment

### 3. Approval Checkpoint
- **Present** the understanding illustration to the product owner
- **Wait** for explicit approval before proceeding
- **Iterate** on the understanding if feedback is provided
- **Document** the approved requirements as the definitive source of truth

### 4. **STRICT APPROVAL TRIGGER** 🚨
**When the user types "approved" or "APPROVED":**
- ✅ **IMMEDIATELY BEGIN IMPLEMENTATION** - No exceptions
- ❌ **ZERO FURTHER QUESTIONS** - All clarifications must be done before approval
- ❌ **NO ADDITIONAL CONFIRMATIONS** - The word "approved" is the final green light
- ✅ **PROCEED WITH FULL IMPLEMENTATION** - Generate code, modify files, complete the task
- ✅ **FOLLOW THE APPROVED REQUIREMENTS EXACTLY** - Use the documented understanding as the specification

**This is a ONE-WAY GATE: Once "approved" is given, the task enters execution mode immediately.**

## Implementation Rules

### Before Product Owner Approval
- ✅ Ask clarifying questions
- ✅ Research and analyze requirements
- ✅ Create understanding illustrations
- ✅ Propose solutions and approaches
- ❌ **NO CODE GENERATION**
- ❌ **NO IMPLEMENTATION WORK**
- ❌ **NO FILE MODIFICATIONS**

### After Product Owner Approval
- ✅ Follow the approved requirements exactly
- ✅ Implement according to documented approach
- ✅ Reference the PROJECT_MANAGER instructions for execution guidelines
- ✅ Maintain traceability to approved requirements

## Quality Gates
- All requirements must be understood before approval
- All assumptions must be validated
- All edge cases must be considered
- Technical approach must be feasible and appropriate

## Documentation Standard
Use clear, structured format for all understanding illustrations:
```
## Task: [Brief Title]

### What We Understand:
[Detailed breakdown of requirements]

### What We Will Deliver:
[Specific deliverables and outcomes]

### How We Will Approach It:
[Technical strategy and implementation plan]

### What We Need to Confirm:
[Questions or assumptions requiring validation]

### Definition of Done:
[Clear acceptance criteria]
```

**Remember: Understanding first, approval second, implementation third.**