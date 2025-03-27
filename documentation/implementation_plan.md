# Implementation plan

## Phase 1: Environment Setup

1.  Create a new Turbo Repo monorepo and set up the directory structure with two folders: one for the NPM package (`packages/library`) and one for the UI dashboard (`apps/dashboard`). (Project Setup)
2.  Initialize a Git repository in the monorepo root by executing `git init`. (Project Setup)
3.  **Validation**: Run `git status` to confirm the repository is initialized correctly. (Project Setup)

## Phase 2: NPM Package Development

1.  Navigate to the `packages/library` directory and run `npm init` to initialize the NPM package. (NPM Package Development)
2.  Install the core dependencies by running `npm install vercel-ai-sdk dotenv inngest` in the `packages/library` folder. (NPM Package Development)
3.  **Validation**: Verify that `package.json` lists `vercel-ai-sdk`, `dotenv`, and `inngest` as dependencies. (NPM Package Development)
4.  Create the main entry file `/packages/library/index.js` to export the library’s functionalities. (NPM Package Development)
5.  Create a configuration file `/packages/library/config.js` that loads environment variables using `dotenv` (e.g., `require('dotenv').config()`). (NPM Package Development: Configuration)
6.  Develop the core multi-agent debate logic in `/packages/library/debate.js` to allow multiple LLMs to debate a topic. (NPM Package Development: Core Functionality)
7.  In `/packages/library/debate.js`, implement functions that enable configurable debate rounds, selectable consensus mechanisms (majority, supermajority, unanimous), and bias presets. (NPM Package Development: Core Functionality)
8.  Create a logging utility in `/packages/library/logger.js` to record metadata like models used, processing time, token counts, and debate rounds. (NPM Package Development: Output)
9.  Write unit tests for the debate logic using Jest by creating `/packages/library/tests/debate.test.js`. (NPM Package Development: Testing)
10. **Validation**: Run `npm test` in the `packages/library` directory and ensure all unit tests pass with full coverage. (NPM Package Development: Testing)

## Phase 3: UI Dashboard Development

1.  In the `apps/dashboard` folder, create a Next.js application using Next.js version 14 by running `npx create-next-app@14 .` (UI Dashboard Development — Note: Next.js 14 is mandated for optimal integration with current AI coding tools and LLM models)
2.  Install Tailwind CSS and Shadcn UI components in the Next.js app by following their setup guides. (UI Dashboard Development)
3.  Create a main UI page at `/apps/dashboard/pages/index.js` that provides an interface for configuring debates (selecting debate rounds, consensus methods, bias presets). (UI Dashboard Development)
4.  Create a React component `/apps/dashboard/components/DebateConfigurator.js` that allows users to enter configuration details for starting a debate. (UI Dashboard Development)
5.  Create another React component `/apps/dashboard/components/DebateResults.js` to display detailed debate outputs including logs and metadata. (UI Dashboard Development)
6.  Set up an API route in `/apps/dashboard/pages/api/debate.js` that imports and calls the debate functions from the NPM package (e.g., via a `require('../../../../packages/library')`). (UI Dashboard Development)
7.  **Validation**: Start the development server by running `npm run dev` in the `apps/dashboard` directory and verify that the UI loads and the API route is responsive. (UI Dashboard Development)

## Phase 4: Inngest Integration

1.  Within the NPM package, create `/packages/library/inngest.js` to define functions that wrap debate tasks for asynchronous/durable execution using Inngest. (Inngest Integration)
2.  In `/packages/library/inngest.js`, implement Inngest functions that handle API rate limits and include retry logic for potential failures. (Inngest Integration)
3.  **Validation**: Simulate Inngest event triggers locally and check that the functions process debate tasks correctly with proper logging of error handling. (Inngest Integration)

## Phase 5: CI/CD Pipeline Setup

1.  In the monorepo root, create a GitHub Actions workflow file at `/.github/workflows/ci.yml` to run tests and build both the NPM package and the UI dashboard automatically. (CI/CD Pipeline Setup)
2.  Define job steps in the workflow file to install dependencies, run Jest tests for the NPM package, and build the Next.js UI. (CI/CD Pipeline Setup)
3.  **Validation**: Push the changes to GitHub and confirm that the GitHub Actions workflow runs all the test and build steps successfully. (CI/CD Pipeline Setup)

## Phase 6: Documentation

1.  Create a main documentation file `/README.md` at the monorepo root detailing installation, configuration, and usage instructions for the multi-agent debate library. (Documentation)
2.  In `/README.md`, document the API, available configuration options, and bias preset settings. (Documentation)
3.  Create a separate documentation file `/apps/dashboard/README.md` that explains the UI dashboard functionalities and how to trigger debates using the NPM package. (Documentation)
4.  **Validation**: Review the documentation files to ensure all key features, configuration options, and usage examples are clearly explained. (Documentation)

## Phase 7: Testing

1.  Write additional unit tests to cover edge cases and error handling in `/packages/library/tests/debate.test.js` using Jest. (Testing)
2.  Perform end-to-end testing by triggering a debate via the UI in the dashboard and observing the proper handling of synchronous and asynchronous debate modes. (Testing)
3.  Test Inngest functions by simulating API rate limits and failures to confirm the retry and error handling strategies work as expected. (Testing)
4.  **Validation**: Verify test outputs and logs to ensure every aspect of the multi-agent debate system operates robustly under various scenarios. (Testing)

## Phase 8: Open Source Release

1.  In the `packages/library` folder, run `npm publish` to publish the multi-agent debate NPM package to the NPM registry. (Open Source Release)
2.  Create and configure a public GitHub repository, then push the entire monorepo (including the NPM package and UI dashboard) to the repository. (Open Source Release)
3.  **Validation**: Test the published package by installing it into a separate project using `npm install <package-name>` and running a sample configuration to ensure proper functionality. (Open Source Release)
