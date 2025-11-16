# CLAUDE.md - AI Assistant Guide for XCoin

> **Last Updated**: 2025-11-16
> **Repository**: yourshopifyexpert/xcoin
> **Status**: Initial Setup

This document provides guidance for AI assistants (like Claude) working on the XCoin project. It outlines the codebase structure, development workflows, conventions, and best practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Code Conventions](#code-conventions)
6. [Git Workflow](#git-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)
10. [AI Assistant Guidelines](#ai-assistant-guidelines)

---

## Project Overview

**Project Name**: XCoin
**Type**: [To be determined - cryptocurrency/blockchain/fintech project]
**Purpose**: [To be documented as project develops]

### Key Features
- [Features to be documented as they are implemented]

### Project Goals
- [Goals to be documented]

---

## Repository Structure

```
xcoin/
├── .git/                 # Git repository metadata
├── CLAUDE.md            # This file - AI assistant guide
├── README.md            # [To be created] User-facing documentation
├── src/                 # [To be created] Source code
├── tests/               # [To be created] Test files
├── docs/                # [To be created] Additional documentation
├── scripts/             # [To be created] Build and utility scripts
└── config/              # [To be created] Configuration files
```

**Note**: This repository is currently in initial setup phase. Structure will be updated as the codebase develops.

---

## Technology Stack

### Current Stack
- Git (version control)
- [To be determined based on project requirements]

### Recommended Stack (To be confirmed)
Consider documenting:
- **Language**: (e.g., JavaScript/TypeScript, Python, Rust, Go)
- **Framework**: (e.g., Node.js, React, Express)
- **Database**: (e.g., PostgreSQL, MongoDB, Redis)
- **Build Tools**: (e.g., Webpack, Vite, Cargo)
- **Package Manager**: (e.g., npm, yarn, pip, cargo)
- **Testing Framework**: (e.g., Jest, pytest, Mocha)
- **Linting/Formatting**: (e.g., ESLint, Prettier, Black, rustfmt)

---

## Development Workflows

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xcoin
   ```

2. **Install dependencies** (once package.json or equivalent is added)
   ```bash
   # Examples - adjust based on actual stack:
   npm install
   # or
   pip install -r requirements.txt
   # or
   cargo build
   ```

3. **Configure environment**
   ```bash
   # Copy environment template (once created)
   cp .env.example .env
   # Edit .env with your local settings
   ```

### Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for Claude AI branches:
   git checkout -b claude/claude-md-<session-id>
   ```

2. **Make changes** following code conventions

3. **Test changes** (once testing is set up)
   ```bash
   npm test
   # or
   pytest
   # or
   cargo test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "descriptive commit message"
   git push -u origin <branch-name>
   ```

5. **Create Pull Request** for review

---

## Code Conventions

### General Principles

1. **Write Clear, Self-Documenting Code**
   - Use descriptive variable and function names
   - Keep functions small and focused on a single responsibility
   - Add comments for complex logic, not obvious code

2. **Follow Language-Specific Style Guides**
   - JavaScript/TypeScript: Airbnb or Standard style
   - Python: PEP 8
   - Rust: Rust standard conventions
   - Go: Go conventions

3. **Error Handling**
   - Always handle errors explicitly
   - Provide meaningful error messages
   - Log errors appropriately

4. **Security**
   - Never commit secrets, API keys, or credentials
   - Use environment variables for sensitive data
   - Validate and sanitize all inputs
   - Follow OWASP Top 10 guidelines

### File Naming Conventions

- Use lowercase with hyphens for file names: `user-service.js`
- Use PascalCase for class/component files: `UserService.ts`
- Use descriptive names that indicate purpose

### Code Organization

- Group related functionality together
- Keep files focused and reasonably sized
- Use clear directory structure that reflects application architecture

---

## Git Workflow

### Branch Naming

- **Feature branches**: `feature/short-description`
- **Bug fixes**: `fix/bug-description`
- **Hotfixes**: `hotfix/issue-description`
- **AI Assistant branches**: `claude/claude-md-<session-id>-<identifier>`

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): add JWT authentication

Implement JWT-based authentication with refresh tokens.
Includes middleware for protected routes.

Closes #123
```

```
fix(api): resolve rate limiting issue

Fixed bug where rate limiter was not properly tracking requests
per user. Updated to use Redis for distributed rate limiting.
```

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Request review from team members
4. Address review feedback
5. Squash commits if necessary
6. Merge when approved

---

## Testing Strategy

### Test Types

1. **Unit Tests**: Test individual functions/methods
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Test system performance and scalability

### Testing Guidelines

- Write tests for all new features
- Maintain test coverage above 80%
- Test edge cases and error conditions
- Keep tests independent and idempotent
- Use meaningful test descriptions

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test

# Run with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

---

## Common Tasks

### Adding a New Feature

1. Create feature branch
2. Implement feature with tests
3. Update documentation
4. Create pull request
5. Address review feedback
6. Merge to main

### Debugging Issues

1. Reproduce the issue locally
2. Check logs for error messages
3. Use debugger to step through code
4. Write test that fails with bug
5. Fix bug and verify test passes
6. Commit fix with descriptive message

### Updating Dependencies

1. Check for outdated dependencies
2. Review changelogs for breaking changes
3. Update dependencies incrementally
4. Run full test suite
5. Update documentation if APIs changed

---

## Troubleshooting

### Common Issues

**Issue**: Git push fails with 403 error
**Solution**: Ensure branch name starts with 'claude/' and ends with matching session ID

**Issue**: Dependencies not installing
**Solution**: Clear cache and reinstall (e.g., `rm -rf node_modules && npm install`)

**Issue**: Tests failing locally
**Solution**: Ensure environment is properly configured, check .env file

---

## AI Assistant Guidelines

### When Working on This Repository

1. **Always Use TodoWrite Tool**
   - Plan complex tasks using the TodoWrite tool
   - Track progress with todo items
   - Mark tasks complete as you finish them

2. **Explore Before Editing**
   - Use Task tool with subagent_type=Explore for understanding code
   - Read relevant files before making changes
   - Understand context before proposing solutions

3. **Security First**
   - Never introduce vulnerabilities (XSS, SQL injection, etc.)
   - Validate all inputs
   - Use parameterized queries
   - Don't commit secrets

4. **Code Quality**
   - Follow existing patterns in the codebase
   - Write tests for new functionality
   - Keep changes focused and atomic
   - Refactor when you see code smells

5. **Communication**
   - Be concise and clear
   - Explain complex changes
   - Ask for clarification when requirements are ambiguous
   - Reference file paths with line numbers: `file.ts:42`

6. **Git Operations**
   - Always develop on feature branches
   - Write descriptive commit messages
   - Push to correct branch (claude/* for AI sessions)
   - Use retry logic for network failures (up to 4 times with exponential backoff)

7. **Testing**
   - Run tests before committing
   - Write tests for bug fixes
   - Ensure tests are deterministic
   - Don't commit failing tests

### Specific Commands for AI Assistants

**Exploring the codebase**:
```
Use Task tool with subagent_type=Explore
```

**Reading multiple files**:
```
Use parallel Read tool calls when possible
```

**Searching code**:
```
Use Grep tool instead of bash grep
Use Glob tool instead of find/ls
```

**Making changes**:
```
1. Read file first
2. Use Edit tool for modifications
3. Use Write only for new files
```

**Git operations**:
```
git add .
git commit -m "$(cat <<'EOF'
Your commit message here
EOF
)"
git push -u origin <branch-name>
```

### Project-Specific Notes

- This repository is currently in initial setup phase
- All conventions and structures should be established as the project grows
- Update this file regularly as patterns emerge
- Keep this document synchronized with actual codebase state

---

## Maintenance

### Updating This Document

This document should be updated when:
- Project structure changes significantly
- New conventions are established
- Technology stack changes
- New workflows are introduced
- Common issues are identified

**To update**: Edit this file and commit with message: `docs: update CLAUDE.md`

### Review Schedule

- Review monthly during active development
- Review quarterly during maintenance phase
- Review after major architectural changes

---

## Additional Resources

### Documentation Links
- [Project README](./README.md) (to be created)
- [API Documentation](./docs/api.md) (to be created)
- [Architecture Decision Records](./docs/adr/) (to be created)

### External Resources
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Note to AI Assistants**: This is a living document. As you work on the project and discover new patterns, conventions, or important information, please update this file to help future AI assistants (and human developers) work more effectively on this codebase.
