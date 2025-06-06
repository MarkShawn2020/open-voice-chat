# 🤝 Contributing to Open Voice Chat

Thank you for your interest in contributing to Open Voice Chat! This document provides guidelines and information for contributors.

## 🌟 How to Contribute

### 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples and sample code**
- **Describe the behavior you observed and what you expected**
- **Include screenshots or recordings if applicable**
- **Provide environment details** (OS, browser, Node.js version, etc.)

**Bug Report Template:**
```markdown
**Bug Description:**
A clear description of what the bug is.

**To Reproduce:**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior:**
What you expected to happen.

**Environment:**
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 120.0]
- Node.js: [e.g. 18.17.0]
- pnpm: [e.g. 8.10.0]
```

### 💡 Suggesting Features

Feature suggestions are welcome! Please provide:

- **Clear and detailed explanation** of the feature
- **Use cases and examples** of how it would be used
- **Possible implementation approaches** (if you have ideas)
- **Alternative solutions** you've considered

### 👨‍💻 Code Contributions

#### 🚀 Getting Started

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/open-voice-chat.git
   cd open-voice-chat
   ```

2. **Set up the development environment**
   ```bash
   # Install dependencies
   pnpm install
   
   # Copy environment variables
   cp .env.example .env.local
   # Edit .env.local with your API keys
   
   # Start development server
   pnpm dev
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/bug-description
   ```

#### 📋 Development Guidelines

##### Code Style
- **TypeScript**: All new code must be written in TypeScript
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Naming Conventions**: Use camelCase for variables, PascalCase for components

```bash
# Check code style
pnpm lint
pnpm prettier

# Fix formatting issues
pnpm lint:fix
pnpm prettier:fix
```

##### Component Guidelines
- **Functional Components**: Use functional components with hooks
- **Props Interface**: Always define TypeScript interfaces for props
- **Documentation**: Add JSDoc comments for complex components
- **Accessibility**: Follow WCAG guidelines and use semantic HTML

```tsx
interface ComponentProps {
  /** Description of the prop */
  title: string
  /** Optional callback function */
  onAction?: () => void
}

/**
 * Component description
 * @param props - Component props
 * @returns JSX element
 */
export function Component({ title, onAction }: ComponentProps) {
  // Component implementation
}
```

##### Testing Requirements
- **Unit Tests**: Write tests for utility functions and hooks
- **Component Tests**: Test component behavior and user interactions
- **E2E Tests**: Add integration tests for critical user flows

```bash
# Run tests
pnpm test

# Run E2E tests
pnpm e2e:headless

# Test coverage
pnpm test --coverage
```

##### State Management
- **Jotai**: Use Jotai for global state management
- **Local State**: Use React hooks for component-local state
- **Persistence**: Use `atomWithStorage` for data that needs persistence

```tsx
// Example Jotai atom
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const settingsAtom = atomWithStorage('user-settings', {
  theme: 'light',
  language: 'en'
})
```

#### 🔄 Pull Request Process

1. **Update documentation** if your changes affect the API or user interface
2. **Add or update tests** for your changes
3. **Run the full test suite** and ensure all tests pass
4. **Update the changelog** if your changes are user-facing
5. **Follow the commit message format** (see below)

#### 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(voice): add real-time noise cancellation"
git commit -m "fix(ui): resolve chat message overflow on mobile"
git commit -m "docs: update API integration guide"
```

#### ✅ Pull Request Checklist

- [ ] **Code follows the style guidelines** of this project
- [ ] **Self-review** has been performed
- [ ] **Comments** have been added to hard-to-understand areas
- [ ] **Documentation** has been updated
- [ ] **No new warnings** are introduced
- [ ] **Tests** have been added/updated and pass locally
- [ ] **Dependent changes** have been merged

### 🏗️ Project Structure

```
open-voice-chat/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # UI primitives (shadcn/ui)
│   ├── voice-call.tsx    # Main voice chat component
│   └── ...
├── lib/                  # Utility functions
│   ├── rtc/             # RTC-related utilities
│   ├── ai/              # AI provider integrations
│   └── utils.ts         # General utilities
├── store/               # Jotai state management
├── types/               # TypeScript type definitions
├── docs/                # Documentation
└── tests/               # Test files
```

### 🎯 Focus Areas

We welcome contributions in these areas:

#### 🔧 Core Features
- **Voice Quality**: Noise cancellation, echo reduction
- **AI Integration**: New AI provider support
- **Performance**: Optimization and monitoring
- **Mobile Experience**: Touch interactions, PWA features

#### 🎨 UI/UX Improvements
- **Accessibility**: Screen reader support, keyboard navigation
- **Themes**: Dark/light mode, custom themes
- **Animations**: Smooth transitions and micro-interactions
- **Responsive Design**: Better mobile and tablet experience

#### 📚 Documentation
- **API Documentation**: Comprehensive API guides
- **Tutorials**: Step-by-step tutorials for common use cases
- **Examples**: Real-world usage examples
- **Translations**: Multi-language documentation

#### 🧪 Testing
- **Unit Tests**: Increase test coverage
- **Integration Tests**: End-to-end user flows
- **Performance Tests**: Load and stress testing
- **Accessibility Tests**: Automated a11y testing

### 🏷️ Issue Labels

We use labels to organize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `documentation` - Improvements to documentation
- `priority:high` - High priority issues
- `priority:low` - Low priority issues

### 💬 Community Guidelines

- **Be respectful** and inclusive
- **Use clear and constructive** communication
- **Help others** learn and grow
- **Stay on topic** in discussions
- **Follow the code of conduct**

### 🆘 Getting Help

If you need help with contributing:

1. **Check existing issues** and discussions
2. **Join our Discord** community
3. **Ask questions** in GitHub Discussions
4. **Tag maintainers** in your PR for review

### 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🎉 Recognition

All contributors will be:
- **Listed** in the README contributors section
- **Mentioned** in release notes for significant contributions
- **Invited** to join the contributors Discord channel

Thank you for helping make Open Voice Chat better! 🚀
