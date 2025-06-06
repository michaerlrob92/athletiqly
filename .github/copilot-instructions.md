For all designs I ask you to make, have them be beautiful, not cookie cutter.

Avoid working on more than one file at a time.
Multiple simultaneous edits to a fill will cause corruption.
Be chatting and teach about what you are doing while coding.

## Mandatory Planning Phase
When working with alrge files (>300 lines) or complex changes:
- Always start by creating a detailed plan BEFORE making any edits
- Your plan must include:
    - All functions/sections that need modifications
    - The order in which changes should be applied
    - Dependencies between changes
    - Estimated number of separate edits required
- Format your plan as:
    Working with: [filename]
    Total planned edits: [number]

## Making edits
- Focus on one conceptual change at a time
- Show clear "before" and "after" snippets when proposing changes
- Include concide explanations of what changed and why
- Always check if the edit maintains the project's coding style

## Edit sequence
- [First specific change] - Purpose: [why]
- [Second specific change] - Purpose: [why]
- Do you approve this plan? I'll proceed with Edit [number] after your confirmation.
- WAIT for explicit user confirmation before making ANY edits when user ok edit [number]

## Execution phase
- After each individual edit, clearly indicate progress:
    - "Completed edit [#] of [total], ready for next edit?"
- If you discover additional needed chagnes during editing:
    - STOP and update the plan
    - Get approval before continuing

## Refactoring
When refactoring:
- Break work into logical, independently functional chunks
- Ensure each intermediate state maintains functionality
- Consider temporary duplication as a valid interim step
- Always indicate the refactoring pattern being applied

## Rate limit advice
- For very large files, suggest splitting changes accross multiple session
- Prioritize changes that are logically complete units
- Always provide clear stopping points

## General requirements
Use modern technnologies as described below for all code suggestions. Prioritize clean, maintainable code with appropriate comments.

## Folder structure
project-root/
├── logs/                     # Application logs
├── src/                     # Source code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── interfaces/         # TypeScript interfaces
│   ├── middleware/         # Express middleware
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── app.ts              # Express application setup
│   └── server.ts           # Server entry point
├── test/                   # Test files
├── README.md              # Project documentation

## TypeScript requirements
- **Minimum Compatibility**: TypeScript 5.8.3+ with target ES2022 or higher
- **Configuration**:
  - Enable `strict` mode in `tsconfig.json`
  - Use `noImplicitAny: true`
  - Enable `strictNullChecks: true`
  - Use `noImplicitReturns: true`
  - Enable `exactOptionalPropertyTypes: true`

- **Type Definitions**:
  - Use explicit type annotations for function parameters and return types
  - Prefer `interface` over `type` for object shapes unless union/intersection types are needed
  - Use `enum` for fixed sets of constants, prefer `const enum` for performance
  - Leverage utility types (`Partial<T>`, `Pick<T>`, `Omit<T>`, `Record<K,V>`)
  - Use generic constraints (`<T extends U>`) when appropriate
  - Define custom type guards with `is` keyword for runtime type checking

- **Features to Use**:
  - All ES2022+ features (as per JavaScript requirements)
  - Optional chaining with type safety (`obj?.prop`)
  - Nullish coalescing with strict null checks (`value ?? defaultValue`)
  - Template literal types for string validation
  - Mapped types and conditional types for advanced type manipulation
  - `satisfies` operator for type assertion without widening
  - Discriminated unions for type-safe state management
  - `as const` assertions for literal type inference

- **Avoid**:
  - `any` type (use `unknown` or proper typing instead)
  - Type assertions (`as`) unless absolutely necessary (prefer type guards)
  - `Function` type (use proper function signatures)
  - `Object` type (use `Record<string, unknown>` or specific interfaces)
  - Non-null assertion operator (`!`) without proper justification
  - `@ts-ignore` comments (use `@ts-expect-error` with explanation if needed)

- **Error Handling**:
  - Use typed error classes extending `Error`
  - Define error types as discriminated unions
  - Implement proper error boundaries with typed catch blocks
  - Use `Result<T, E>` pattern for operations that can fail predictably
  - Type API responses including error states

## Express requirements
- **Minimum Version**: Express 5.1.0+ with TypeScript support
- **Project Structure**:
  - Separate routes, controllers, middleware, and models into distinct directories
  - Use barrel exports (`index.ts`) for clean imports
  - Implement dependency injection pattern for services
  - Create typed request/response interfaces

- **Middleware & Error Handling**:
  - Use async middleware with proper error forwarding to `next()`
  - Implement global error handler with typed error responses
  - Use validation middleware (Zod) with TypeScript schemas
  - Implement request timeout middleware
  - Use helmet for security headers
  - Implement rate limiting and CORS properly

- **Routing & Controllers**:
  - Use Express Router for modular route organization
  - Type request parameters, query, and body using interfaces
  - Implement controller classes with dependency injection
  - Use HTTP status codes consistently (200, 201, 400, 401, 403, 404, 500)
  - Return consistent JSON response format

- **Security & Performance**:
  - Validate all input data with typed schemas
  - Sanitize user inputs to prevent XSS/injection attacks
  - Use environment variables for configuration (never hardcode secrets)
  - Implement proper logging with structured formats (JSON)
  - Use compression middleware for response optimization
  - Implement proper HTTPS in production

- **Database & External APIs**:
  - Use connection pooling for database connections
  - Implement proper transaction handling with rollback
  - Type database models and query results
  - Use prepared statements to prevent SQL injection
  - Implement circuit breaker pattern for external API calls
  - Cache frequently accessed data with proper TTL

- **Error Handling**:
  - Create custom error classes with proper HTTP status codes
  - Implement structured error responses with error codes
  - Log errors with correlation IDs for tracing
  - Handle async errors in routes with try-catch or async wrapper
  - Implement graceful shutdown handling for cleanup
  - Use health check endpoints for monitoring

- **Testing Requirements**:
  - Write unit tests for controllers and middleware
  - Implement integration tests for API endpoints
  - Mock external dependencies properly
  - Test error scenarios and edge cases
  - Maintain test coverage above 80%

## Documentation requirements
- Document complex functions with clear examples
- Maintain concise Markdown documentation.

## Security considerations
- Sanitize all user inputs thoroughly.
- Parameterize database queries.
- Implement detailed internal logging and monitoring.