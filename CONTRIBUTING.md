# Contributing to TreePath

Thank you for your interest in TreePath! This document explains how you can use and modify this open-source project.

## Repository Policy

**This repository is maintained by the project owner only.** 

- ✅ **You can**: Fork, copy, and modify this code for your own use
- ✅ **You can**: Create your own version with your changes
- ✅ **You can**: Report bugs and suggest features via issues
- ❌ **You cannot**: Open pull requests to this repository
- ❌ **You cannot**: Commit directly to this repository

This repository serves as the official, maintained version of TreePath. If you want to customize or extend the code, please fork the repository and maintain your own version.

## Using TreePath

### Forking and Customizing

1. **Fork the repository** on GitHub to create your own copy

2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/tree_test_analyzer.git
   cd tree_test_analyzer
   ```

3. **Make your modifications** as needed for your use case

4. **Maintain your fork** independently - you have full control over your version

### Reporting Issues

If you find a bug or have a feature suggestion, please open an issue with:

- A clear, descriptive title
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Your environment (browser, OS, Node.js version)
- Screenshots if applicable

Note: Opening an issue does not guarantee it will be addressed, but it helps track potential improvements.

## Development Setup (For Your Fork)

1. Clone your fork:
   ```bash
   git clone https://github.com/your-username/tree_test_analyzer.git
   cd tree_test_analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing type patterns
- Avoid `any` types when possible
- Use interfaces for object shapes

### React

- Use functional components with hooks
- Keep components focused and reusable
- Use meaningful prop and variable names
- Extract complex logic into custom hooks

### Styling

- Use Tailwind CSS utility classes
- Follow existing design patterns
- Maintain responsive design
- Keep the color palette consistent (blue, purple, gray)

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow ESLint rules (run `npm run lint`)

## Project Structure

- `src/components/` - React components organized by feature
- `src/lib/` - Core libraries and utilities
- `src/pages/` - Page-level components
- `src/types/` - TypeScript type definitions

## Testing

Before submitting a PR, please:

1. Test your changes in the browser
2. Run the linter: `npm run lint`
3. Build the project: `npm run build`
4. Test all affected features manually

## Commit Message Guidelines

Use clear, descriptive commit messages:

- `Add: Feature description` - For new features
- `Fix: Bug description` - For bug fixes
- `Update: What was updated` - For updates to existing features
- `Refactor: What was refactored` - For code refactoring
- `Docs: Documentation changes` - For documentation updates

## License

This project is open-source under the MIT License. You are free to:

- Use the code for any purpose
- Modify it to suit your needs
- Distribute your modified version
- Use it commercially

See the [LICENSE](LICENSE) file for full details.

## Questions?

If you have questions about using or modifying TreePath:

- Open an issue with the `question` label
- Check existing issues and discussions
- Review the [README.md](README.md) for usage instructions

Thank you for using TreePath! 🎉

