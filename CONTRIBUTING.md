# Contributing to Atlassian MCP Server

Thank you for your interest in contributing! Your help is greatly appreciated. Please follow these guidelines to help us maintain a high-quality project.

## Getting Started

1. **Create an issue**: Before starting any work, please [create an issue](https://github.com/Parthav46/atlassian-mcp/issues) describing the feature or bug you intend to work on and wait for it to be acknowledged.
2. **Fork the repository** and clone it locally.
3. **Install dependencies**:
   ```sh
   npm install
   ```
4. **Create a new branch** for your feature or bugfix using the following naming conventions:
   - For a new feature: `feat-*`
   - For a bug fix: `bug-*`
   ```sh
   # Example for a feature
   git checkout -b feat-my-feature
   # Example for a bug fix
   git checkout -b bug-my-bug
   ```

## Development

- Use [TypeScript](https://www.typescriptlang.org/) for all code changes.
- Follow the existing code style and structure. Refer to `CODE_STRUCTURE.md` for architecture details.
- Write clear, descriptive commit messages.

## Testing

- Add or update tests in the `tests/` directory as appropriate.
- Run tests locally before submitting a pull request:
   ```sh
   npm test
   ```
- Ensure all tests pass and code coverage does not decrease.

## Pull Requests

- Ensure your branch is up to date with `main` before opening a PR.
- Provide a clear description of your changes and reference any related issues.
- One feature or fix per pull request.
- Be responsive to feedback and make requested changes promptly.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make this project better!
