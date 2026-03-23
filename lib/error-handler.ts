import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
    this.name = 'ConflictError'
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(500, message, details)
    this.name = 'InternalServerError'
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError
}

export function handleError(error: any, module: string): NextResponse {
  logger.error(module, 'API Error', error)

  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    )
  }

  // Unknown error
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  )
}

export async function safeHandler(
  handler: (request: NextRequest) => Promise<NextResponse>,
  request: NextRequest,
  module: string
): Promise<NextResponse> {
  try {
    logger.info(module, `${request.method} ${request.nextUrl.pathname}`)
    return await handler(request)
  } catch (error) {
    return handleError(error, module)
  }
}

export function validateRequired(obj: Record<string, any>, fields: string[]): void {
  const missing = fields.filter(field => !obj[field])
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`)
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format')
  }
}

export function validateRange(value: number, min: number, max: number, field: string): void {
  if (value < min || value > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}`)
  }
}

export function validateEnum(value: string, allowedValues: string[], field: string): void {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${field} must be one of: ${allowedValues.join(', ')}`)
  }
}
