import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearCursoDto {
  @IsString({ message: 'El nombre del curso es obligatorio.' })
  @MinLength(3, { message: 'El nombre del curso debe tener al menos 3 caracteres.' })
  @MaxLength(150, { message: 'El nombre del curso no puede superar los 150 caracteres.' })
  nombre: string;

  @IsInt({ message: 'Los créditos deben ser un número entero.' })
  @Min(1, { message: 'Los créditos deben estar entre 1 y 6.' })
  @Max(6, { message: 'Los créditos deben estar entre 1 y 6.' })
  creditos: number;

  @IsInt({ message: 'Debe indicar el profesor que imparte el curso.' })
  profesor_id: number;

  @IsArray({ message: 'Debe asignar al menos una categoría al curso.' })
  @ArrayMinSize(1, { message: 'Debe asignar al menos una categoría al curso.' })
  @IsInt({ each: true, message: 'Las categorías deben ser enteros.' })
  categoria_ids: number[];
}

export class ActualizarCursoDto {
  @IsOptional() @IsString() @MinLength(3, { message: 'El nombre del curso debe tener al menos 3 caracteres.' })
  @MaxLength(150, { message: 'El nombre del curso no puede superar los 150 caracteres.' })
  nombre?: string;

  @IsOptional() @IsInt({ message: 'Los créditos deben ser un número entero.' })
  @Min(1, { message: 'Los créditos deben estar entre 1 y 6.' }) @Max(6, { message: 'Los créditos deben estar entre 1 y 6.' })
  creditos?: number;

  @IsOptional() @IsInt() profesor_id?: number;

  @IsOptional() @IsArray() @ArrayMinSize(1, { message: 'Debe asignar al menos una categoría al curso.' })
  @IsInt({ each: true }) categoria_ids?: number[];
}

export class ListarCursosDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt({ message: 'El parámetro per_page debe ser un número entero.' })
  @Min(1, { message: 'El parámetro per_page debe ser al menos 1.' }) @Max(50, { message: 'El parámetro per_page no puede superar 50.' })
  per_page?: number;
  @IsOptional() @IsString() @MaxLength(150) nombre?: string;
}
