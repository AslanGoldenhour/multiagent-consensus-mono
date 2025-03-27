# Monorepo Structure

This document outlines the folder structure and organization for this monorepo.

## Root Directory

```
/
├── .cursor/                 # Cursor IDE configuration
│   └── rules/               # Custom rules for Cursor
├── .git/                    # Git repository data
├── .husky/                  # Git hooks for code quality
│   └── _/                   # Husky support files
├── apps/                    # Frontend applications
│   └── web/                 # Next.js web application
│       ├── app/             # Next.js app directory (App Router)
│       │   ├── globals.css  # Global styles
│       │   ├── layout.tsx   # Root layout component
│       │   └── page.tsx     # Home page component
│       ├── public/          # Static assets
│       └── ...              # Configuration files
├── documentation/           # Project documentation
│   ├── folder_structure.md  # This document
│   ├── app_flow_document.md # Application flow documentation
│   ├── app_flowchart.md     # Application flowchart
│   ├── backend_structure_document.md # Backend structure documentation
│   ├── frontend_guidelines_document.md # Frontend guidelines
│   ├── implementation_plan.md # Implementation plan
│   ├── project_requirements_document.md # Project requirements
│   ├── tech_stack_document.md # Tech stack documentation
│   └── agent_memory.md      # Agent memory documentation
├── node_modules/            # Node.js dependencies
├── packages/                # Shared packages
│   └── multiagent-consensus/ # Consensus engine package
│       ├── src/             # Source code
│       │   ├── consensus/   # Consensus implementation
│       │   │   ├── engine.ts # Consensus engine
│       │   │   └── methods.ts # Consensus methods
│       │   ├── providers/   # Provider implementations
│       │   ├── types/       # TypeScript type definitions
│       │   ├── utils/       # Utility functions
│       │   └── index.ts     # Package entry point
│       └── ...              # Configuration files
└── ...                      # Configuration files (.eslintrc.json, package.json, etc.)
```

## Package Details

### multiagent-consensus

This package implements a consensus engine for multi-agent systems. It provides:

- A consensus engine that orchestrates agreement between multiple AI agents
- Various consensus methods/algorithms
- Provider interfaces for different AI models
- Type definitions for the consensus system

### web (Next.js Application)

The web application provides a frontend interface built with:

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint for code quality

## Documentation Structure

The documentation directory contains various documents:

- **folder_structure.md**: This document
- **app_flow_document.md**: Details about application flow
- **app_flowchart.md**: Visual flowchart of the application
- **backend_structure_document.md**: Backend architecture documentation
- **frontend_guidelines_document.md**: Guidelines for frontend development
- **implementation_plan.md**: Implementation strategy and timeline
- **project_requirements_document.md**: Project requirements and specifications
- **tech_stack_document.md**: Details about the technology stack
- **agent_memory.md**: Documentation about agent memory implementation
- **documentation_workflow.md**: Guidelines for documentation processes
