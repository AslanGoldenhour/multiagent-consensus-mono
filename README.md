# Multiagent Consensus Monorepo

A comprehensive monorepo structure for developing and managing multi-agent consensus systems, with a focus on consensus mechanisms for LLMs.

## 📋 Overview

This monorepo contains packages and applications for building multi-agent systems:

- **packages/multiagent-consensus**: A framework for running consensus processes between multiple LLMs
- **apps/web**: A Next.js web application for visualizing and interacting with multi-agent systems

## 🗂️ Repository Structure

```
/
├── apps/                    # Frontend applications
│   └── web/                 # Next.js web application
├── packages/                # Shared packages
│   └── multiagent-consensus/ # Consensus engine package
├── documentation/           # Project documentation
└── ...                      # Configuration files
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or later)
- npm (v8.0.0 or later)
- Git

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/multiagent-consensus-mono.git
cd multiagent-consensus-mono
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Copy environment files for development
cp .env.development .env
cp .env.local.example .env.local
# Edit .env.local to add your private API keys
```

4. Run the development environment:

```bash
npm run dev
```

### Environment Structure

This project uses a structured approach to environment variables:

- `.env` - Base variables used across all environments (safe to commit)
- `.env.development` - Development-specific variables (safe to commit)
- `.env.production` - Production-specific variables (safe to commit)
- `.env.local` - Private variables like API keys (never commit these)

## 📦 Packages

### multiagent-consensus

A framework for running multi-agent consensus processes using multiple LLMs. Features include:

- Support for multiple consensus methods (majority, supermajority, unanimous)
- Configurable debate rounds
- Detailed metadata and logging
- Support for multiple LLM providers (via Vercel AI SDK)

## 💻 Applications

### Web Dashboard

A Next.js web application for:

- Configuring and running consensus debates
- Visualizing debate results and process
- Managing API keys and providers
- Viewing logs and history

## 📚 Development Guidelines

Please refer to the documentation directory for detailed information on:

- [Project requirements](./documentation/project_requirements_document.md)
- [Implementation plans](./documentation/implementation_plan.md)
- [Code organization](./documentation/folder_structure.md)
- [Testing standards](./documentation/testing_standards.md)
- [Documentation workflows](./documentation/documentation_workflow.md)

## 🧪 Testing

To run tests:

```bash
npm run test
```

## 📊 Code Metrics

- **Total**: 4319 lines

### By Language

| Language | Lines |
| -------- | ----- |
| ts       | 3,178 |
| js       | 1,012 |
| tsx      | 107   |
| css      | 22    |

### By Category

| Category | Lines |
| -------- | ----- |
| core     | 3,174 |
| examples | 776   |
| other    | 322   |
| configs  | 47    |

## 📄 License

MIT
