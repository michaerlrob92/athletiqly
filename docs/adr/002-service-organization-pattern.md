# ADR-002: Service Organization Pattern

## Status

Accepted

## Context

We need to decide on the organization pattern for our services and infrastructure components, specifically around where to place the Redis client implementation. The current implementation is in `src/config/redis.ts`, but it's actually a service that provides Redis functionality to the application.

Key considerations:

- Separation of concerns
- Dependency injection
- Service lifecycle management
- Configuration vs. Service implementation
- TypeScript best practices
- Testing and mocking
- Code organization and maintainability

## Decision

We will reorganize our services following a clear pattern:

### 1. Service Organization

**Decision**: Move infrastructure services to `src/services/infrastructure/` directory
**Rationale**:

- Clear separation between configuration and service implementation
- Better organization of infrastructure services (Redis, Database, etc.)
- Easier to implement dependency injection
- More intuitive for new team members
- Follows the principle of "configuration as code" vs "service implementation"

### 2. Configuration Management

**Decision**: Keep pure configuration in `src/config/` directory
**Rationale**:

- Configuration files should only contain static configuration
- Makes it easier to manage environment-specific settings
- Clear separation between "what" (config) and "how" (service)
- Easier to validate and type-check configuration

### 3. Service Implementation Pattern

**Decision**: Implement services as classes with dependency injection
**Rationale**:

- Better testability through dependency injection
- Clear service lifecycle management
- Type-safe service interfaces
- Easier to mock for testing
- Consistent pattern across all services

## Consequences

### Positive

- Clear separation between configuration and service implementation
- More maintainable and testable code
- Better organization of infrastructure services
- Easier to implement new services following the same pattern
- More intuitive for new team members
- Better support for dependency injection
- Clearer service boundaries

### Negative

- Need to refactor existing code
- Slightly more complex initial setup
- Need to maintain consistent patterns across the codebase

### Neutral

- Learning curve for team members
- Need to document the pattern
- Need to enforce the pattern in code reviews

## Implementation Notes

Current structure:

src/
├── config/
│   └── redis.ts  (contains both config and service)
└── services/
    └── (other services)

Proposed structure:

src/
├── config/
│   └── redis.config.ts  (only configuration)
└── services/
    └── infrastructure/
        ├── redis/
        │   ├── redis.service.ts
        │   ├── redis.types.ts
        │   └── redis.errors.ts
        └── index.ts

## Related Decisions

- ADR-001: Redis Implementation for Caching and Session Management
- ADR-003: Dependency Injection Pattern (to be created)

## References

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [Dependency Injection in TypeScript](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## Implementation Verification

The proposed service organization pattern has been successfully implemented:

1. Service Organization:
   - Redis service moved to `src/services/infrastructure/redis/`
   - Clear separation of concerns achieved
   - Proper directory structure implemented

2. Configuration Management:
   - Pure configuration in `src/config/redis.config.ts`
   - Environment-specific settings properly managed
   - Clear separation between config and service implementation

3. Service Implementation Pattern:
   - Redis service implemented as a class with dependency injection
   - Type-safe interfaces defined in `redis.types.ts`
   - Comprehensive error handling in `redis.errors.ts`
   - Event management and health checks implemented
   - Proper singleton pattern with connection management

The implementation follows all proposed decisions and has resulted in:
- Clean, maintainable code structure
- Clear separation of concerns
- Type-safe service implementation
- Proper error handling and monitoring
- Easy to test and mock services
