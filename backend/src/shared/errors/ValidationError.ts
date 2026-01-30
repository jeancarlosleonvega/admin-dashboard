import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    details?: { field?: string; message: string }[]
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}
