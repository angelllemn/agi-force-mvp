export class ContextNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextNotFoundError';
  }
}

export class ContextAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextAlreadyExistsError';
  }
}

export class InvalidContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidContextError';
  }
}

export class MessageNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageNotFoundError';
  }
}

export class InvalidMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMessageError';
  }
}

export class ContextExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextExpiredError';
  }
}
