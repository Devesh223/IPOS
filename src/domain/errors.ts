/**
 * Standard typed error classes for Indian Pixel Software.
 * Derived directly from Phase 4 Section 3.8 & Phase 4.5 Section 4.9.
 */

export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string, public readonly fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  readonly statusCode = 403;
  constructor(
    message: string = "You do not have access to perform this action.",
    public readonly requiredRole?: string,
    public readonly entityContext?: string
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(public readonly entityType: string, public readonly entityId: string) {
    super(`${entityType} with ID '${entityId}' was not found.`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(
    message: string = "This action has already been decided or changed by another user.",
    public readonly conflictingActorId?: string
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

export class BusinessRuleError extends Error {
  readonly statusCode = 422;
  constructor(
    public readonly ruleId: string,
    message: string,
    public readonly blockingEntity?: { id: string; type: string; name?: string }
  ) {
    super(`[Rule ${ruleId}] ${message}`);
    this.name = "BusinessRuleError";
  }
}
