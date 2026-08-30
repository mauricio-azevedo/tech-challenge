import type { ApiErrorResponse } from '@challenge/contracts';
import { BadRequestException, HttpStatus, StandardSchemaValidationPipe } from '@nestjs/common';

type PipeOptions = NonNullable<ConstructorParameters<typeof StandardSchemaValidationPipe>[0]>;
type ValidationIssues = Parameters<NonNullable<PipeOptions['exceptionFactory']>>[0];

function pathToString(path: ValidationIssues[number]['path']): string {
  return (path ?? [])
    .map((segment) => (typeof segment === 'object' ? String(segment.key) : String(segment)))
    .join('.');
}

/** Converte as issues do Standard Schema no formato de erro da API: um item por campo invalido. */
export function validationErrorBody(issues: ValidationIssues): ApiErrorResponse {
  return {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'dados invalidos',
    errors: issues.map((issue) => ({ path: pathToString(issue.path), message: issue.message })),
  };
}

/**
 * Pipe global que valida `@Body({ schema })`, `@Query({ schema })` e `@Param(name, { schema })`
 * com os schemas zod do pacote de contratos, devolvendo o valor ja transformado (coercao, defaults).
 */
export function createValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) => new BadRequestException(validationErrorBody(issues)),
  });
}
