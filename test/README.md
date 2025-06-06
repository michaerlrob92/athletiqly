# Test Structure

This directory contains integration and end-to-end tests for the Athletiqly application. Unit tests are co-located with their source code in `src/**/__tests__/` directories.

## Directory Structure

```
test/
├── unit/           # Additional unit tests (if needed)
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test fixtures and mocks
```

## Test Types

### Unit Tests (`src/**/__tests__/`)
- Co-located with source code
- Test individual components/modules in isolation
- Use mocks for external dependencies
- Fast execution
- Example: `src/services/cache/__tests__/cache.service.test.ts`

### Integration Tests (`test/integration/`)
- Test interactions between multiple components
- May use real external services (Redis, Database)
- Slower than unit tests
- Example: `test/integration/cache-middleware.test.ts`

### End-to-End Tests (`test/e2e/`)
- Test complete user flows
- Use real external services
- Slowest execution
- Example: `test/e2e/api-caching.test.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- src/**/__tests__/

# Run integration tests only
npm test -- test/integration/

# Run e2e tests only
npm test -- test/e2e/

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test Organization

Tests are organized by type and run in the following order:
1. Unit tests (co-located and in `test/unit/`)
2. Integration tests
3. End-to-end tests

This order ensures that faster tests run first and that dependencies between tests are respected.

## Best Practices

1. **Unit Tests**
   - Keep tests focused and isolated
   - Use mocks for external dependencies
   - Test edge cases and error conditions
   - Aim for high coverage

2. **Integration Tests**
   - Test real interactions between components
   - Use test fixtures for setup
   - Clean up after tests
   - Test happy paths and common error cases

3. **End-to-End Tests**
   - Test complete user flows
   - Use realistic test data
   - Handle asynchronous operations properly
   - Clean up test data

## Test Fixtures

Common test fixtures and mocks are stored in `test/fixtures/`. These include:
- Mock data
- Test databases
- Redis test instances
- Common test utilities

## Coverage Requirements

- Minimum coverage: 80% for branches, functions, lines, and statements
- Coverage reports are generated in the `coverage/` directory
- Run `npm run test:coverage` to generate coverage reports 