# E2E Tests

End-to-end tests for the Alogorithm2 Animation example applications using Playwright.

## Prerequisites

1. Build the library:
   ```bash
   yarn build
   ```

2. Install example dependencies:
   ```bash
   yarn example:install
   ```

3. Install Playwright browsers (if not already installed):
   ```bash
   npx playwright install
   ```

## Known Issues

The E2E tests currently fail due to complex interaction issues between Playwright's web server management and Vite's dev server when using local file-linked packages. 

### Root Causes:
1. Vite's dependency optimization fails with "Outdated Optimize Dep" errors when accessed by Playwright
2. Module resolution issues with package exports when using `file:../` in package.json
3. React hooks errors due to duplicate React instances when linking local packages
4. The dev servers work correctly when started manually but fail when managed by Playwright

### Current Status:
- Manual testing with `yarn dev:react`, `yarn dev:vue`, and `yarn dev:astro` works correctly
- The applications render properly with SVG animations when accessed manually
- E2E tests fail to load the applications correctly due to the above issues

## Manual Testing

To manually test the examples after building:

1. Build the library:
   ```bash
   yarn build
   ```

2. Start each example individually:
   ```bash
   # React example
   yarn example:react
   
   # Vue example  
   yarn example:vue
   
   # Astro example
   yarn example:astro
   ```

3. Visit the local dev server URLs and verify:
   - SVG elements are rendered
   - Animation is visible
   - Mode switching works (React/Vue)
   - Multiple animations display (Astro)

## Running Tests

The simplified tests check only for SVG element rendering:

```bash
# Run all E2E tests
yarn test:e2e

# Run specific framework tests
yarn test:e2e:react
yarn test:e2e:vue
yarn test:e2e:astro
```

## Future Improvements

To fix the E2E tests, consider:
1. Publishing the package to npm and using the published version
2. Using a monorepo tool like Lerna or pnpm workspaces
3. Creating a custom Vite plugin to handle local package resolution
4. Using a different bundler that better supports local package development