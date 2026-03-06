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

## Contributing

This repository contains specialized skills for AI-assisted development. Each skill is contained in its own directory with a `SKILL.md` file describing its purpose and constraints.

## License

To be determined.
