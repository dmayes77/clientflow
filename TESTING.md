# Testing Guide

This project uses **Vitest** for unit/component testing and **Playwright** for E2E testing.

## Quick Start

```bash
# Run unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Unit Testing with Vitest

### Why Vitest?

- ⚡ **Fast**: Uses Vite for instant feedback
- ✅ **Jest-compatible API**: Easy migration from Jest
- 🔥 **Hot Module Reloading**: Tests update instantly
- 📦 **Native ESM support**: Works great with Next.js 16

### Writing Unit Tests

Create test files with `.test.ts` or `.test.tsx` extension:

```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });
});
```

### Component Testing

```typescript
// __tests__/components/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Testing Next.js Components

The test setup automatically mocks Next.js router and navigation:

```typescript
import { useRouter } from 'next/navigation';

// Router is already mocked in vitest.setup.ts
const router = useRouter();
router.push('/dashboard'); // This works in tests
```

### Coverage Reports

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- **HTML report**: `coverage/index.html`
- **JSON report**: `coverage/coverage-final.json`

## E2E Testing with Playwright

### Why Playwright?

- 🌐 **Multi-browser**: Test in Chrome, Firefox, Safari
- 📱 **Mobile testing**: Test mobile viewports
- 🎥 **Screenshots & Videos**: Automatic failure capture
- ⚡ **Fast & reliable**: Auto-waiting, retries

### Writing E2E Tests

Create test files in the `e2e/` directory:

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should sign in successfully', async ({ page }) => {
    await page.goto('/sign-in');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug a specific test
npm run test:e2e:debug
```

### E2E Test Best Practices

1. **Use data-testid for selectors**:
   ```html
   <button data-testid="submit-button">Submit</button>
   ```
   ```typescript
   await page.click('[data-testid="submit-button"]');
   ```

2. **Wait for network idle**:
   ```typescript
   await page.goto('/dashboard');
   await page.waitForLoadState('networkidle');
   ```

3. **Use fixtures for authentication**:
   ```typescript
   test.use({ storageState: 'auth.json' });
   ```

## Environment Variables for Testing

Tests require environment variables. The test suite uses a separate `.env.test` file or loads from `.env.local`.

### Required Variables

```bash
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY="sk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
# ... etc
```

### Environment Validation

The project includes automatic environment validation in `lib/env.ts`:

```typescript
import { env } from '@/lib/env';

// ✅ Type-safe and validated
console.log(env.DATABASE_URL);

// ❌ Will throw error if missing or invalid
```

## CI/CD Integration

Tests run automatically in GitHub Actions on every push and PR:

```yaml
# .github/workflows/ci-cd.yml
- name: Run unit tests
  run: npm run test

# E2E tests can be added for main branch only
- name: Run E2E tests (main only)
  if: github.ref == 'refs/heads/main'
  run: npm run test:e2e
```

### Test Requirements

All tests must pass before:
- ✅ Merging to `dev`
- ✅ Merging to `staging`
- ✅ Deploying to production

## Test Organization

```
├── __tests__/              # Unit & component tests
│   ├── lib/               # Utility function tests
│   ├── components/        # Component tests
│   └── api/              # API route tests
├── e2e/                   # E2E tests
│   ├── auth.spec.ts
│   ├── dashboard.spec.ts
│   └── booking.spec.ts
├── vitest.config.ts       # Vitest configuration
├── vitest.setup.ts        # Test setup & mocks
└── playwright.config.ts   # Playwright configuration
```

## Useful Commands

```bash
# Unit Tests
npm test                    # Run all unit tests
npm run test:watch          # Watch mode
npm run test:ui            # Open Vitest UI
npm run test:coverage      # Generate coverage

# E2E Tests
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Playwright UI mode
npm run test:e2e:headed    # Run with browser visible
npm run test:e2e:debug     # Debug mode with inspector

# Playwright Setup
npx playwright install      # Install browsers
npx playwright codegen     # Generate tests interactively
```

## Tips

### Debugging Tests

**Vitest:**
```typescript
import { vi } from 'vitest';

// Add breakpoints with debugger
it('should work', () => {
  debugger; // Pauses execution
  expect(true).toBe(true);
});

// Use vi.fn() for mocks
const mockFn = vi.fn();
mockFn('hello');
expect(mockFn).toHaveBeenCalledWith('hello');
```

**Playwright:**
```bash
# Run in debug mode
npm run test:e2e:debug

# Or add pause in test
await page.pause();
```

### Skipping Tests

```typescript
// Vitest
it.skip('not ready yet', () => {});
it.only('run only this', () => {});

// Playwright
test.skip('not ready yet', async ({ page }) => {});
test.only('run only this', async ({ page }) => {});
```

### Testing Server Actions

```typescript
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

it('should revalidate', async () => {
  await myServerAction();
  expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)
