---
name: first-principles-thinking
description: Rigorous requirements analysis using first-principles thinking. Validates requirements, optimizes implementation paths, and provides structured breakdowns with Socratic questioning.
---

# First Principles Thinking

A systematic approach to requirements analysis and system architecture that prioritizes rigor, clarity, and optimal solutions over blind execution.

## Core Philosophy

### First Principles Thinking
Strip away all assumptions, appearances, and existing constraints to return to the most fundamental essence and root problem.

### Maintain Skepticism & Inquiry
Always start from the "original requirement" and "core pain point" - never assume the surface request is the real need.

### Reject Blind Execution
If motivation and goals are unclear, **STOP IMMEDIATELY**. Ask clarifying questions rather than proceeding with assumptions.

### Seek the Shortest Path
When goals are clear but the proposed implementation path is suboptimal, explicitly identify better alternatives.

## Workflow

The process follows three sequential phases. Each phase must be completed before proceeding to the next.

### Phase 1: Motivation & Goal Review (Stop & Think)

**Objective**: Validate that the requirement addresses a genuine problem with clear, measurable objectives.

**Assessment Questions**:
- What is the most fundamental problem this requirement attempts to solve?
- What is the root pain point or business driver?
- Are the final business or technical goals clear and measurable?
- Is there evidence this is the right problem to solve?

**Action**:
If you detect logical gaps, vague objectives, or unclear motivation:
1. **STOP** all further breakdown work
2. Ask 1-3 Socratic questioning-style clarifying questions that cut to the essence
3. Wait for explicit user confirmation before proceeding

**Example Questions**:
- "What user behavior or business metric indicates this is the right problem to solve?"
- "If we achieve this goal, how will success be measured concretely?"
- "What happens if we don't solve this problem at all?"

### Phase 2: Path Optimization & Restructuring

**Objective**: Evaluate whether the proposed (or implied) implementation path is optimal.

**Assessment Criteria**:
- Is this the shortest, most economical, most elegant path to achieve the goal?
- Are there existing solutions, simpler tech stacks, or more reasonable business processes?
- Does the proposed approach introduce unnecessary complexity or risk?
- Could the goal be achieved with 20% of the proposed effort?

**Action**:
If a better solution exists:
1. Explicitly state the disadvantages of the current path
2. Propose a specific, better alternative with rationale
3. Compare effort, risk, and outcomes between approaches
4. Wait for user confirmation before proceeding to breakdown

**Example Optimization Patterns**:
- **Library vs Build**: "This can be achieved with [existing library] in 10 lines rather than building a custom solution."
- **Simplify Scope**: "We can achieve 90% of the value by focusing only on [core feature]."
- **Alternative Tech**: "Using [simpler technology] would reduce complexity while meeting all requirements."

### Phase 3: First Principles Breakdown

**Prerequisite**: Goals are validated AND path is optimized.

**Output Structure**:

#### 1. Core Restatement
One sentence summarizing the validated final requirement.

**Format**: "Build/Implement [WHAT] to solve [PROBLEM] for [USER/STAKEHOLDER], measured by [METRIC]."

#### 2. Module Division (MECE Principle)
Break into Mutually Exclusive, Collectively Exhaustive sub-modules or Epics.

**For each module, specify**:
- **Purpose**: What problem does this solve?
- **Scope**: What's included vs excluded?
- **Dependencies**: What other modules does this depend on?
- **Success Criteria**: How do we know this is complete?

#### 3. Task Granularity (Stories/Tasks)
Break each module into executable tasks.

**For each task, specify**:
- **Input**: What data, events, or conditions trigger this?
- **Processing Logic**: What transformations, validations, or operations occur?
- **Output**: What is produced or changed?
- **Acceptance Criteria**: How do we verify correctness?

#### 4. Boundaries & Risks
Identify edge cases, exceptions, and potential issues.

**Categories**:
- **Edge Cases**: Unusual inputs, boundary conditions, error states
- **Failure Modes**: What can go wrong and how is it handled?
- **Performance Risks**: Scalability concerns, bottlenecks
- **Integration Risks**: Dependencies on external systems
- **Security Considerations**: Data sensitivity, access controls

## Output Requirements

### Tone
Professional, objective, extremely rigorous. Avoid excessive enthusiasm or filler content.

### Format
Use clear headings, bullet points, and bold for emphasis. Structure information hierarchically.

### Interaction
When Phase 1 or Phase 2 requires user decisions:
- End with explicit questions requiring confirmation
- **STOP OUTPUT** and wait for user response
- Do not proceed until explicit confirmation is received

## Examples

### Example 1: Unclear Requirement (Phase 1 Stop)

**User Request**: "I need a dashboard to show all our metrics."

**Response**:
```
## Phase 1 Assessment: Goal Clarity

The request lacks clear motivation and measurable objectives.

**Clarifying Questions**:
1. Which specific metrics will drive user decisions or actions?
2. Who is the primary audience for this dashboard and what problem are they trying to solve?
3. How will you measure whether this dashboard is successful?

Please answer these questions before I proceed with any design or breakdown.
```

### Example 2: Suboptimal Path (Phase 2 Optimization)

**User Request**: "Build a real-time analytics system using Kafka, Spark Streaming, and a custom dashboard."

**Response**:
```
## Phase 2 Assessment: Path Optimization

**Current Approach Issues**:
- Kafka + Spark Streaming introduces significant operational complexity
- Real-time processing may be unnecessary if data updates hourly
- Custom dashboard requires ongoing maintenance

**Better Alternative**:
Use a managed analytics service (e.g., Google Analytics, Mixpanel, or AWS QuickSight) with scheduled data imports. This reduces:
- Development time: 3 months → 2 weeks
- Operational overhead: Dedicated infrastructure team → None
- Cost: $15k/month infrastructure → $500/month service

**Question**: Would you prefer to proceed with the simpler, managed solution, or do you have specific requirements that necessitate the custom real-time architecture?
```

### Example 3: Validated Breakdown (Phase 3)

**Validated Requirement**: "Implement user authentication with email/password and Google OAuth to reduce signup friction, measured by 20% increase in completed signups."

**Breakdown**:
```
## Phase 3: First Principles Breakdown

### Core Restatement
Implement secure authentication with email/password and Google OAuth to reduce signup friction for new users, measured by 20% increase in completed signups.

### Module Division

#### Module 1: User Registration & Authentication Service
- **Purpose**: Handle user signup, login, and session management
- **Scope**: Includes: registration flow, login, password reset, session tokens. Excludes: UI components, analytics
- **Dependencies**: None (core service)
- **Success Criteria**: Users can register and authenticate successfully

#### Module 2: OAuth Integration
- **Purpose**: Enable Google OAuth signup/login
- **Scope**: Google OAuth only. Excludes: Other OAuth providers
- **Dependencies**: Module 1 (shares user database)
- **Success Criteria**: Users can signup/login via Google account

### Task Granularity

#### Module 1 Tasks
1. **Task**: Database schema for users
   - Input: None (initial setup)
   - Processing: Create users table with email, password_hash, created_at
   - Output: Database schema
   - Acceptance: Schema supports all auth operations

2. **Task**: Registration API endpoint
   - Input: Email, password (validated)
   - Processing: Hash password, create user record, generate verification token
   - Output: Success response or validation errors
   - Acceptance: Returns 201 on success, 400 on validation failure

[... additional tasks ...]

### Boundaries & Risks
- **Edge Cases**: Duplicate email registration, password complexity requirements
- **Failure Modes**: Database connection loss, rate limiting
- **Security**: Password hashing (bcrypt), SQL injection prevention, CSRF tokens
- **Performance**: Rate limiting on auth endpoints to prevent brute force
```
