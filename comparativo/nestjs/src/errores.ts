import { HttpException, ValidationError } from '@nestjs/common';

/** 422 con el formato común del contrato: { message, errors: { campo: [mensajes] } } */
export function errorValidacion(errors: Record<string, string[]>) {
  return new HttpException(
    { message: 'Los datos proporcionados no son válidos.', errors },
    422,
  );
}

export function fabricaErrores(errs: ValidationError[]) {
  const errors: Record<string, string[]> = {};
  for (const e of errs) errors[e.property] = Object.values(e.constraints ?? {});
  return errorValidacion(errors);
}
