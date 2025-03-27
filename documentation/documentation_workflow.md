# Documentation Update Workflow

This document outlines the proper sequence and process for updating documentation in this project to ensure consistent and up-to-date documentation across all files.

## Documentation Update Sequence

When making changes to the project, documentation should be updated in the following order:

1. **Technical Implementation**: First, implement the technical changes (code, tests, etc.)
2. **Agent Memory** (`documentation/agent_memory.md`): Update the agent memory with technical details, implementation choices, and progress
3. **Project Plan** (`documentation/project_plan.md`): Update the project plan to mark tasks as completed and reflect progress
4. **README.md**: Finally, update the README with user-facing changes, project status, and metrics

This sequence ensures that internal documentation (agent memory, project plan) is updated before external documentation (README), and that all documentation stays consistent.

## Documentation Update Checklist

When implementing a new feature or making significant changes, ensure:

- [ ] Technical implementation is complete and tests are passing
- [ ] Agent memory is updated with detailed technical notes
- [ ] Project plan has been updated to reflect progress
- [ ] README is updated if the change affects project metrics or status
- [ ] All badges and status indicators are correct
- [ ] Documentation across all files is consistent

## Documentation Content Guidelines

Each documentation file serves a different purpose:

### Agent Memory (`documentation/agent_memory.md`)

- Contains detailed technical implementation notes
- Records architectural decisions and their rationales
- Tracks session-by-session progress
- Includes technical challenges, solutions, and open questions
- Serves as an internal memory for developers

### Project Plan (`documentation/project_plan.md`)

- Tracks progress on specific tasks and features
- Provides a high-level roadmap of the project
- Organizes work into phases and categories
- Shows what's been completed and what's still pending
- Helps with project management and prioritization

### README.md

- Provides a user-facing overview of the project
- Shows current project status and metrics
- Includes badges for build status, test coverage, etc.
- Contains basic usage instructions and examples
- Serves as the entry point for new users and contributors

## Maintaining Metrics and Badges

When updating the README, ensure the following metrics are up-to-date:

- Test coverage percentage
- Number of tests passing
- Source lines of code (SLOC)
- Build status
- Project phase/status

Update these metrics by running the appropriate commands before updating the README:

```bash
# Get test coverage
cd packages/multiagent-discussion && pnpm test

# Count source lines of code
find packages -type f -name "*.ts" | xargs wc -l | sort -nr
```

## Commit Messages for Documentation Updates

Use descriptive commit messages when updating documentation:

- For agent memory: "Update agent memory with [feature] implementation details"
- For project plan: "Update project plan to mark [feature] as completed"
- For README: "Update README with current metrics and status"

When updating multiple documentation files in one commit, use: "Update documentation for [feature] implementation"
