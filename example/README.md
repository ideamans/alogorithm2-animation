# Alogorithm2 Animation Examples

This directory contains example applications demonstrating how to use the Alogorithm2 Animation library with different frameworks.

## Setup

First, build the main library:

```bash
# From the root directory
yarn build
```

Then install dependencies for the examples:

```bash
# From the root directory
yarn example:install
```

## Running Examples

### React Example

```bash
# From the root directory
yarn example:react
```

Open http://localhost:3001

### Vue Example

```bash
# From the root directory
yarn example:vue
```

Open http://localhost:3002

### Astro Example

```bash
# From the root directory
yarn example:astro
```

Open http://localhost:3003

## What's Demonstrated

- **React Example**: Shows how to use the React component with state management for mode and seed control
- **Vue Example**: Demonstrates Vue 3 composition API usage with reactive properties
- **Astro Example**: Shows server-side rendering with the Astro component

All examples import the library from `../dist`, demonstrating how the built library would be used in a real application.