# Agent Memory: Multiagent-Consensus-Mono Repository

## Project Overview

This repository is a monorepo structure for developing and managing multi-agent consensus systems. It follows code quality standards with automated linting and formatting on commit.

## Technical Memory

### Repository Structure

- Root directory contains configuration files for linting, formatting, and TypeScript
- `documentation/` contains project requirements and technical documentation
  - `features/` contains detailed implementation plans for major features
- `packages/` directory contains individual packages/services of the system
  - `multiagent-consensus/` contains the consensus engine package for multi-agent debates
    - `examples/` contains example implementations for package usage
- `apps/` directory contains frontend applications
  - `web/` contains the Next.js web application
- `.cursor/rules/` contains coding standards and workflow rules
- `scripts/` contains utility scripts for repository management and code metrics

### Development Environment

- Using git for version control
- Node.js (>=18.0.0) as the runtime environment
- TypeScript for type-safe JavaScript development
- Husky for git hooks integration
- ESLint v8 for code linting
- Prettier for code formatting
- Pre-commit hooks to ensure code quality and test coverage on every commit
- TurboRepo for monorepo management
- Jest for unit testing

### Code Quality Standards

- ESLint configuration for JavaScript and TypeScript files
- Prettier configuration for consistent code formatting
- Husky pre-commit hooks that run lint-staged and tests
- Lint-staged configuration to format and lint only staged files
- Jest unit tests with TypeScript support

### Package Structure

#### multiagent-consensus

The multiagent-consensus package implements a framework for running multi-agent consensus processes:

- `src/consensus/` contains the consensus engine and methods
- `src/types/` contains TypeScript interfaces and types
- `src/providers/` contains LLM provider implementations
- `src/utils/` contains utility functions
- `src/__tests__/` contains unit tests organized by module
- `examples/` contains example usage of the package
- `dist/` contains compiled JavaScript code for distribution

#### web (Next.js Application)

The web application is built with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint for code quality

### Consensus Methods

The package implements three consensus methods:

- **Majority**: Requires more than 50% of responses to agree
- **Supermajority**: Requires at least 75% of responses to agree (updated from 2/3)
- **Unanimous**: Requires all responses to agree

### Error Handling & Validation System

We've implemented a comprehensive error handling and validation system for the package:

- **Base Error Hierarchy**:

  - `ConsensusError`: Base class for all errors in the system
  - `ConfigurationError`: For invalid configuration parameters
  - `ProviderError`: For issues with LLM providers
  - `ConsensusProcessError`: For errors during consensus process
  - `ValidationError`: For input validation failures
  - `EnvironmentError`: For environment variable issues

- **Factory Methods**: Each error class has factory methods for common error scenarios, making error creation consistent and self-documenting.

- **Error Handling Utility**: The `handleError` function standardizes error handling throughout the codebase, ensuring all errors are wrapped as appropriate ConsensusError types.

- **Validation System**: A comprehensive validation utility with methods for:
  - `notEmpty`: Ensures values are not null, undefined, or empty
  - `isType`: Type validation for inputs
  - `inRange`: Range validation for numeric values
  - `oneOf`: Validation against a set of allowed values
  - `modelName`: Specific validation for model names
  - `consensusConfig`: Validation for configuration objects

### Environment Variable Management

We've implemented a robust environment variable management system using a structured approach:

- **EnvManager Singleton**: Provides a centralized place for accessing environment variables
- **Custom Path Support**: Allows loading from a specified .env file path
- **Fallback Mechanism**: Attempts loading from common locations if no path is specified
- **Default Values**: Support for default values when environment variables are not defined
- **Required Variables**: Special handling for required environment variables
- **Provider API Key Management**: Specialized support for managing provider API keys with appropriate error handling
- **Initialization Handling**: Designed to initialize only once and handle initialization errors gracefully
- **Direct Configuration Support**: Added ability to provide API keys directly in the ConsensusEngine constructor for better portability and integration with existing applications
- **Provider Key Mapping**: Comprehensive documentation of environment variable names and their corresponding configuration keys for all supported providers

#### Environment Files Structure

We use a tiered approach to environment variables:

- **`.env`**: Base variables shared across all environments (committed to repo)
- **`.env.development`**: Development-specific settings (committed to repo)
- **`.env.production`**: Production-specific settings (committed to repo)
- **`.env.local`**: Private API keys and secrets (never committed, added to .gitignore)
- **`packages/multiagent-consensus/examples/.env.example`**: Example file showing package configuration options

This structure provides clear separation between:

- Public configuration (safe to commit)
- Environment-specific settings (safe to commit)
- Private secrets (never committed)

### Provider System Enhancements

- **Extended Provider Support**: Expanded support for all Vercel AI SDK provider packages
- **Custom Provider Registration**: Added ability to register custom providers at runtime
- **API Key Validation**: Added validation for provider API keys before attempting to use a provider
- **Generic Fallback Provider**: Implemented a generic provider as a fallback when no suitable providers are available
- **Dynamic Provider Loading**: Enhanced provider loading to dynamically load only installed and configured providers
- **Error Handling**: Improved error handling for provider-related issues

### Testing Approach

We've implemented a comprehensive testing strategy:

- **Unit Tests**: Focused tests for each module
- **Mocking Strategy**:
  - Environment variables mocked to allow testing without actual .env files
  - Dynamic imports mocked to avoid actual network calls
  - Provider packages mocked to simulate installed/uninstalled packages
  - Console output mocked to reduce noise in test output
- **Test Isolation**: Registry state reset between tests to prevent test pollution
- **Test Coverage**: Aiming for 100% coverage of utility files
- **Test-Driven Development**: Writing tests before implementing features to ensure quality

### Caching System

The caching implementation includes the following components:

- **Cache Adapters**: Provides an abstract interface for different storage backends
  - `MemoryCacheAdapter`: In-memory storage for development and single-instance applications
  - `RedisCacheAdapter`: Upstash Redis integration for distributed production environments
  - `FileCacheAdapter`: File-based persistent storage for development, debugging, and single-server deployments
- **Cache Key Generation**: Creates deterministic keys from request parameters

  - Sorts object properties for consistent serialization
  - Normalizes arrays for consistent ordering
  - Handles all parameters that affect responses

- **Vercel AI SDK Middleware**: Integrates with the AI SDK to intercept and cache responses

  - `wrapGenerate`: For standard completion requests
  - `wrapStream`: For streaming completion requests
  - Measures and tracks actual response times for performance telemetry
  - Provides accurate time-saving metrics based on real response measurements

- **Configuration System**:

  - Environment variable support (`ENABLE_CACHE`, `CACHE_ADAPTER`, `CACHE_TTL_SECONDS`)
  - Programmatic configuration via ConsensusEngine constructor
  - Support for adapter-specific options
  - Redis integration with Upstash (`REDIS_URL`, `REDIS_TOKEN`, `REDIS_PREFIX`)
  - File adapter configuration options (`CACHE_DIR`, directory creation, cleanup settings)

- **Integration with ConsensusEngine**:
  - Automatic middleware initialization
  - Public cache interface for manual operations
  - Metadata reporting of cache statistics and performance metrics

### SLOC Measurement System

The repository includes a comprehensive Source Lines of Code (SLOC) measurement system that provides insights into the codebase's composition and size. Key features include:

- Automated metrics generation using the `sloc` package
- Categorization of code by language (TypeScript, JavaScript, CSS, etc.)
- Categorization of code by function (core, examples, configs, etc.)
- Integration with README files to display current metrics
- Pre-commit hook integration for continuous updates
- Git integration via auto-staging of updated README files

The SLOC measurement system tracks key metrics:

- Total lines of code for the entire monorepo
- Total lines of code for the `multiagent-consensus` package
- Distribution by programming language
- Distribution by functional category

## Badge System

The repository includes an automated badge system that enhances the README files with visual indicators of project status and metrics:

- Test coverage badges
- Lines of code count badges
- Test count badges
- Project status badges

Key features of the badge system include:

- Automatic generation of shields.io badge URLs
- Color-coding based on metric values (red/yellow/green)
- Integration with pre-commit hooks for automatic updates
- Ability to update existing badges or insert new ones
- Support for both monorepo and package README files

The badge system ensures that README files always reflect the current state of the project without manual intervention.

### Multi-Round Debate Mode

The multi-round debate mode feature will allow multiple LLMs to engage in a structured debate about a given query. Key aspects of this feature include:

- Structured rounds of debate with each LLM critiquing others' responses
- Specialized prompting to encourage critical thinking and constructive disagreement
- Support for streaming responses in real-time
- Integration with the Vercel AI SDK's streaming functionality
- Configurable debate parameters (number of rounds, consensus method, etc.)
- Support for both simple queries (e.g., "What is 4+4?") and complex, abstract ones (e.g., "What is the meaning of life?")

The implementation approach includes:

- Creating a dedicated debate interface separate from the regular consensus process
- Implementing specialized prompt templates that guide the debate process
- Supporting streaming through Vercel AI SDK's streamText functionality
- Managing debate state across multiple rounds
- Creating example implementations to showcase both simple and complex queries

### Multi-Round Debate Implementation

We've implemented a comprehensive multi-round debate system with the following components:

- **DebateManager**: A dedicated class that orchestrates the entire debate process, managing state across multiple rounds and tracking agreement levels.

- **Specialized Prompt Templates**: A set of carefully designed prompt templates for different phases of the debate:

  - `initialRoundTemplate`: Guides models in providing their first response
  - `debateRoundTemplate`: Encourages models to critique others' responses in subsequent rounds
  - `finalRoundTemplate`: Directs models to synthesize a comprehensive final answer
  - `factualQueryTemplate`: Specialized template for arithmetic or factual questions
  - `abstractQueryTemplate`: Specialized template for philosophical or abstract questions

- **Query Type Detection**: Automatic classification of queries as factual, abstract, or unknown based on linguistic patterns, allowing for tailored prompting strategies.

- **Agreement Analysis**: A system that analyzes how models agree or disagree with each other across debate rounds, tracking metrics such as:

  - Agreement level for each round (0-1 scale)
  - Overall agreement trend (increasing, decreasing, stable, or fluctuating)
  - Explicit agreement/disagreement extraction from model responses

- **Enhanced Result Reporting**: The `DebateResult` interface extends the standard consensus result with:

  - Debate-specific metadata (query type, consensus status, round information)
  - Agreement analysis data
  - Enhanced history with model agreements/disagreements
  - Confidence scores from models

- **Configuration Options**: Flexible configuration through the `DebateConfig` interface:

  - Minimum rounds of debate regardless of consensus
  - Specialized prompt usage toggle
  - Model identity revelation control
  - Custom prompt template support
  - Custom consensus checker function support

- **Examples**: Two complete examples demonstrating the debate functionality:

  - `simple-debate.js`: Shows basic debate functionality with a factual query
  - `complex-debate.js`: Demonstrates more nuanced debate on philosophical topics

- **Testing Framework**: Comprehensive tests using mock providers to validate:
  - Complete debate flow
  - Consensus reaching mechanisms
  - Query type detection accuracy
  - Configuration validation
  - Edge case handling

While we've implemented the core debate functionality, streaming support is still under development and will be implemented in a future release.

## Implementation Progress

### Completed

- [x] Initialize repository with monorepo structure
- [x] Set up code quality tools (ESLint, Prettier, TypeScript, etc.)
- [x] Create basic README with project overview
- [x] Create consensus package with basic structure
- [x] Set up Next.js web application
- [x] Publish initial version (0.1.0) of multiagent-consensus package to npm
- [x] Integrate with Vercel AI SDK for dynamic LLM provider support
- [x] Implement basic consensus methods (majority, supermajority, unanimous)
- [x] Create example implementation in the examples/ directory
- [x] Fix build process to properly generate the dist/ directory
- [x] Update tsconfig.json to support CommonJS modules
- [x] Clean up documentation to match implementation
- [x] Expand provider system to support all Vercel AI SDK providers
- [x] Implement a mechanism for registering custom providers
- [x] Implement error handling and validation
- [x] Set up dotenv for secure environment variable handling
- [x] Create comprehensive test suite
- [x] Implement structured approach to environment variables (.env, .env.development, .env.production, .env.local)
- [x] Configure .gitignore to ensure sensitive data isn't committed
- [x] Document environment variable structure in READMEs
- [x] Create example environment files for reference
- [x] Implement caching mechanisms for responses
- [x] Add Redis adapter for distributed caching in production environments
- [x] Add File adapter for persistent file-based caching storage
- [x] Implement SLOC measurement system with automatic README updates
- [x] Integrate SLOC script with pre-commit hook for continuous metrics tracking
- [x] Automate staging of README files to ensure metrics are included in commits
- [x] Implement badge system for visualizing test coverage, code metrics and status
- [x] Integrate badge update system with pre-commit hooks
- [x] Fix test coverage badge calculation to show accurate metrics
- [x] Reorganize cache examples into a dedicated directory structure
- [x] Enhance environment variable handling to support direct configuration via ConsensusEngine
- [x] Implement debate mode with multi-round discussion
- [x] Create specialized prompt templates for debate guidance
- [x] Implement query type detection (factual vs abstract)
- [x] Add agreement analysis for tracking consensus progress
- [x] Create simple and complex debate examples

### In Progress

- [ ] Add support for streaming responses

### Planned

- [ ] Implement Inngest for durable execution
- [ ] Create UI components for visualizing consensus results
- [ ] Create visualization tools for consensus process
- [ ] Add support for confidence scores
- [ ] Create dashboard for monitoring consensus process
- [ ] Implement README and badge enhancements from project plan
- [ ] Implement example web application with UI

## Session Log

| Date                      | Changes                           | Details                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-03-27                | Repository Initialization         | Created the multiagent-consensus-mono repository with initial structure, README.md, and .gitignore                                                                                                                                                                                                                                                                                 |
| 2025-03-27                | Code Quality Tools Setup          | Added Husky, ESLint, Prettier, and TypeScript configuration with pre-commit hooks for automated code formatting and linting                                                                                                                                                                                                                                                        |
| 2025-03-27                | Consensus Package Creation        | Created the basic structure for the multiagent-consensus package with types, interfaces, and initial implementation                                                                                                                                                                                                                                                                |
| 2025-03-27                | Next.js App Creation              | Set up a Next.js web application with TypeScript, Tailwind CSS, and ESLint                                                                                                                                                                                                                                                                                                         |
| 2025-03-27                | Documentation Updates             | Created comprehensive folder structure documentation and phased implementation checklist                                                                                                                                                                                                                                                                                           |
| 2025-03-27                | Configuration Conflict Fix        | Resolved ESLint and PostCSS configuration conflicts in the monorepo setup, switched to ESLint v8                                                                                                                                                                                                                                                                                   |
| 2025-03-27                | Repository Rename                 | Renamed repository from multiagent-mono to multiagent-consensus-mono to better reflect its purpose                                                                                                                                                                                                                                                                                 |
| 2025-03-27                | Testing Implementation            | Set up Jest testing framework, added unit tests for consensus methods and engine, configured pre-commit hooks to run tests                                                                                                                                                                                                                                                         |
| 2025-03-27                | Consensus Method Update           | Updated supermajority consensus threshold from 2/3 to 75% for more stringent agreement requirements                                                                                                                                                                                                                                                                                |
| 2025-03-27                | Documentation Enhancement         | Updated testing standards with directory conventions and guidelines for handling test failures                                                                                                                                                                                                                                                                                     |
| 2025-03-27                | Configuration Fix                 | Fixed TypeScript configuration to properly exclude compiled files from source input                                                                                                                                                                                                                                                                                                |
| 2025-03-27                | Example Creation                  | Created JavaScript example for multiagent-consensus package                                                                                                                                                                                                                                                                                                                        |
| 2025-03-27                | Build Process Fix                 | Fixed TSConfig to use CommonJS modules for better compatibility with require() statements                                                                                                                                                                                                                                                                                          |
| 2025-03-27                | Documentation Update              | Cleaned up documentation to match implementation and provide clear usage instructions                                                                                                                                                                                                                                                                                              |
| 2025-03-27                | Package Publishing                | Published version 0.1.0 of multiagent-consensus package to npm, making it available for public use                                                                                                                                                                                                                                                                                 |
| 2025-03-27                | Vercel AI SDK Integration         | Integrated Vercel AI SDK to dynamically support multiple LLM providers based on installed packages                                                                                                                                                                                                                                                                                 |
| 2025-03-27                | Documentation Updates             | Added documentation for project plan and agent memory                                                                                                                                                                                                                                                                                                                              |
| 2025-03-27                | Configuration Conflict Fix        | Fixed conflicts in configuration files                                                                                                                                                                                                                                                                                                                                             |
| 2025-03-27                | Testing Implementation            | Added CI/CD pipeline with GitHub Actions                                                                                                                                                                                                                                                                                                                                           |
| 2025-03-27                | Documentation Updates             | Updated documentation to reflect implementation details                                                                                                                                                                                                                                                                                                                            |
| 2025-03-27                | Provider System Expansion         | Expanded provider system to support all Vercel AI SDK providers and custom registration                                                                                                                                                                                                                                                                                            |
| 2025-03-27                | Error Handling Implementation     | Created comprehensive error handling system with custom error classes for different error scenarios                                                                                                                                                                                                                                                                                |
| 2025-03-27                | Environment Management            | Implemented dotenv-based environment manager to securely handle API keys and environment variables                                                                                                                                                                                                                                                                                 |
| 2025-03-27                | Validation System                 | Created robust validation utilities to ensure data integrity throughout the application                                                                                                                                                                                                                                                                                            |
| 2025-03-27                | Test Infrastructure               | Implemented comprehensive test suite with 100% coverage for utility modules and provider functionality                                                                                                                                                                                                                                                                             |
| 2025-03-27                | Testing Strategy Update           | Adopted a more pragmatic testing approach for provider tests, focusing on observable behavior rather than internal implementation details                                                                                                                                                                                                                                          |
| 2025-03-28                | Environment Structure             | Implemented a structured approach to environment variables with layered .env files and better secret management                                                                                                                                                                                                                                                                    |
| 2025-03-28                | Feature Branch Creation           | Created feature/implement-caching branch to implement response caching with the Vercel AI SDK                                                                                                                                                                                                                                                                                      |
| 2025-03-28                | Caching Implementation            | Implemented flexible caching system with memory adapter, middleware integration, and cache key generation utilities                                                                                                                                                                                                                                                                |
| 2025-03-28 08:16:24 -0500 | Caching Improvements              | Enhanced caching middleware to measure actual API response times for accurate performance metrics and code cleanup                                                                                                                                                                                                                                                                 |
| 2025-03-28 08:25:58 -0500 | Redis Adapter Implementation      | Added Upstash Redis cache adapter for distributed caching in production environments                                                                                                                                                                                                                                                                                               |
| 2025-03-28 09:02:38 -0500 | Redis Adapter Enhancement         | Implemented lazy initialization pattern for Redis adapter to improve fault tolerance and test compatibility                                                                                                                                                                                                                                                                        |
| 2025-03-28 09:02:38 -0500 | Test Infrastructure Upgrade       | Added Jest setup file to mock console methods during tests for cleaner output, fixed Redis adapter tests with proper mocks                                                                                                                                                                                                                                                         |
| 2025-03-28 09:02:38 -0500 | Project Organization              | Restructured examples directory for better organization, separating diagnostic examples into dedicated subdirectory                                                                                                                                                                                                                                                                |
| 2025-03-28 09:29:28 -0500 | File Cache Implementation         | Implemented file-based cache adapter using JSON files for persistent storage with TTL support and automatic cleanup                                                                                                                                                                                                                                                                |
| 2025-03-28 09:29:28 -0500 | Test Infrastructure Fix           | Fixed timer mocking in file adapter tests to prevent lingering Jest processes and ensure clean test execution                                                                                                                                                                                                                                                                      |
| 2025-03-28 09:29:28 -0500 | Cache Example                     | Added file cache example showcasing persistent storage capabilities and manual cache operations                                                                                                                                                                                                                                                                                    |
| 2025-03-28 11:26:20 -0500 | SLOC Measurement Implementation   | Created script to measure source lines of code with automatic README updates integrated into the pre-commit hook workflow                                                                                                                                                                                                                                                          |
| 2025-03-28 11:50:04 -0500 | Badge System Implementation       | Created and integrated an automated badge update system that generates shields.io badges for test coverage, lines of code, test counts, and project status. Enhanced pre-commit hooks to update badges automatically and stage README files to ensure badges are included in commits.                                                                                              |
| 2025-03-28 12:40:36 -0500 | Badge System Improvements         | Fixed badge generation to correctly calculate and display test coverage (92.5%) from package coverage files. Updated pre-commit hook to run tests with coverage before generating badges. Added a new section to the project plan for future README and badge enhancements.                                                                                                        |
| 2025-03-28 13:01:05 -0500 | Multi-Round Debate Planning       | Created feature branch for multi-round debate mode implementation. Developed detailed implementation plan including technical approach, tasks breakdown, testing strategy, and acceptance criteria. Added to project documentation in preparation for development.                                                                                                                 |
| 2025-03-28 14:41:45 -0500 | Cache Examples Reorganization     | Reorganized cache examples into a dedicated directory structure for better organization. Moved diagnostic files from `examples/diagnostic/` to `examples/caching/diagnostic/` and moved cache example files from the root `examples/` to `examples/caching/`. This provides a more logical grouping of related examples and improves discoverability.                              |
| 2025-03-28 14:41:45 -0500 | Environment Variable Enhancement  | Enhanced environment variable handling to support both .env files and direct configuration via the ConsensusEngine constructor. Improved documentation for API key configuration with detailed provider mapping tables. This approach makes the package more portable and easier to integrate with existing applications that may already have secret management systems in place. |
| 2025-03-28 14:44:39 -0500 | Multi-Round Debate Implementation | Implemented the multi-round debate system with debate manager, specialized prompt templates, query type detection, agreement analysis, enhanced result reporting, comprehensive examples, and testing. Streaming support is planned for a future release.                                                                                                                          |
| 2025-03-28 14:48:11 -0500 | Updated Implementation Plan       | Updated the multi-round debate mode implementation plan document with completion status for all tasks. Added detailed context about completed components (75% complete) and identified remaining work needed for streaming support. Added key implementation details and progress summary.                                                                                         |

## Future Considerations

- Integration with cloud services
- Deployment strategies for multi-agent systems
- Scaling considerations for high traffic applications
- Security patterns for multi-agent communication
- Adding support for additional LLM providers
- Implementing more advanced consensus algorithms
- Creating visualization tools for debate analysis
- Enhancing test coverage and implementing integration tests
- Implementing advanced README features and badge systems outlined in project plan
