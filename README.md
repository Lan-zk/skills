# Skills Repository

A collection of specialized AI skills for various software development tasks.

## Skills

### java-arch-designer

A **Complex Business Logic Architect / Design Pattern Specialist** that diagnoses business scenarios, selects appropriate GoF design patterns, and generates scalable code skeletons for complex business logic within the Service layer.

**Features:**
- Analyzes business process descriptions or Mermaid flowcharts
- Identifies the most suitable GoF design patterns (Strategy, State, Chain of Responsibility, Observer, Factory, etc.)
- Generates highly scalable code skeletons focused on Service layer complexity
- Provides rigorous technical selection rationale for pattern choices
- Strictly prohibits three-tier architecture boilerplate code

**Usage:**
This skill helps design complex business logic by:
1. Diagnosing business scenarios from process descriptions
2. Mapping business steps to design pattern roles
3. Generating interface-first, zero-implementation code skeletons
4. Providing clear comments explaining design decisions

**Documentation:** See [`java-arch-designer/SKILL.md`](java-arch-designer/SKILL.md) for detailed specifications.

---

### java-mermaid-analyzer

A **Java Code Execution Path Analysis and Mermaid Diagram Generation** skill that deeply traces Java code execution logic and generates precise Mermaid flowcharts to visualize method call chains and business flows.

**Features:**
- Analyzes Java code and specified entry methods to trace execution paths
- Identifies conditional branches (if/else/switch), loops (for/while), and exception handling
- Extracts JavaDoc and inline comments to enrich flowchart nodes
- Generates syntax-strict Mermaid flowchart TD diagrams
- Clearly marks external dependencies and unprovided implementations
- Prevents hallucinations by strictly following provided code context

**Usage:**
This skill helps visualize and understand Java code by:
1. Providing Java code context and specifying an entry method
2. Analyzing execution logic and method call chains
3. Generating comprehensive Mermaid flowcharts with proper annotations
4. Documenting unknown dependencies for transparency

**Documentation:** See [`java-mermaid-analyzer/SKILL.md`](java-mermaid-analyzer/SKILL.md) for detailed specifications.

---

### first-principles-thinking

A **Rigorous Requirements Analysis and System Architecture Expert** that applies first-principles thinking to critically examine requirements, optimize implementation paths, and provide structured breakdowns.

**Features:**
- **Phase 1: Motivation & Goal Review** - Validates requirements by asking Socratic questions to uncover root problems
- **Phase 2: Path Optimization** - Evaluates proposed solutions and suggests better alternatives when suboptimal
- **Phase 3: First Principles Breakdown** - Provides MECE-based module division and granular task breakdowns
- **Rigorous Approach** - Rejects blind execution, maintains skepticism, and seeks the shortest path to solutions
- **Comprehensive Examples** - Includes real-world scenarios for unclear requirements and suboptimal paths

**Usage:**
This skill helps ensure requirements are well-founded and solutions are optimal by:
1. Questioning unclear or potentially flawed requirements before proceeding
2. Suggesting simpler, more efficient implementation paths
3. Breaking down validated requirements into clear, actionable tasks
4. Identifying edge cases, risks, and success criteria

**Documentation:** See [`first-principles-thinking/SKILL.md`](first-principles-thinking/SKILL.md) for detailed specifications.

---

### skill-creator-with-validation

An **Enhanced Skill Creator with Skills CLI Validation Expert** that guides users in creating, modifying, and validating skills for Skills CLI compatibility, ensuring proper format and avoiding common pitfalls.

**Features:**
- **Skills CLI Specification Analysis** - Validates SKILL.md front matter, YAML header, and description length constraints
- **Common Pitfalls Detection** - Identifies issues like blank lines before YAML headers, overly long descriptions, missing fields
- **Validation Checklist** - Provides comprehensive pre-publishing verification steps
- **Testing Commands** - Offers local testing commands using `npx skills add .`
- **Real-World Examples** - Includes fixed examples of Java Mermaid Analyzer and Java Arch Designer skills
- **Troubleshooting Guide** - Helps diagnose and fix common Skills CLI errors

**Usage:**
This skill helps create and fix Skills CLI compatible skills by:
1. Validating SKILL.md format against strict specifications
2. Identifying and fixing common formatting errors
3. Providing concise, actionable feedback on skill structure
4. Offering testing commands and debugging guidance
5. Maintaining consistency across skill repositories

**Documentation:** See [`skill-creator-with-validation/SKILL.md`](skill-creator-with-validation/SKILL.md) for detailed specifications.

---

## Contributing

This repository contains specialized skills for AI-assisted development. Each skill is contained in its own directory with a `SKILL.md` file describing its purpose and constraints.

## License

To be determined.
