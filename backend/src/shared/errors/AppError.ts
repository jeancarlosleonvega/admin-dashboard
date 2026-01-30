export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: { field?: string; message: string }[];

  constructor(
    message: string,
    code: string,
    statusCode = 400,
    details?: { field?: string; message: string }[]
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}
