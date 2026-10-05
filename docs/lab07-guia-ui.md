# Laboratorio 7 — Guía de interfaz del proyecto

Sistema de matrícula universitaria.

## 1. Paleta de color (contraste verificado WCAG 2.1)

### Texto (WCAG 1.4.3 — mínimo 4.5:1 texto normal, 3:1 texto grande)

| Uso | Color | Sobre | Ratio | Nivel |
|---|---|---|---|---|
| Texto principal | `#1F2937` (gris-800) | `#FFFFFF` | 14.7:1 | AAA |
| Texto sobre botón primario | `#FFFFFF` | `#2563EB` | 5.2:1 | AA |
| Error / destructivo (texto) | `#DC2626` (rojo-600) | `#FFFFFF` | 4.8:1 | AA |
| Texto de ayuda / secundario | `#6B7280` (gris-500) | `#FFFFFF` | 4.8:1 | AA |
| Texto deshabilitado | `#9CA3AF` (gris-400) | `#FFFFFF` | 2.3:1 | Exento (WCAG no exige contraste en controles deshabilitados) |

### Bordes e indicadores de UI (WCAG 1.4.11 — mínimo 3:1 contra el fondo adyacente)

| Uso | Color | Sobre | Ratio | Cumple 3:1 |
|---|---|---|---|---|
| Acción primaria (fondo de botón) | `#2563EB` (azul-600) | `#FFFFFF` | 5.2:1 | Sí |
| Halo de foco (todos los controles) | `#2563EB` (azul-600) | `#FFFFFF` | 5.2:1 | Sí |
| Borde normal de input | `#6B7280` (gris-500) | `#FFFFFF` | 4.8:1 | Sí |
| Borde de error de input | `#DC2626` (rojo-600) | `#FFFFFF` | 4.8:1 | Sí |
| Éxito (icono/badge, no texto pequeño) | `#16A34A` (verde-600) | `#FFFFFF` | 3.3:1 | Sí |
| Borde deshabilitado | `#E5E7EB` (gris-200) | `#FFFFFF` | 1.24:1 | Exento (control deshabilitado) |

Fondo de superficie: `#F9FAFB` (gris-50). Separador no interactivo (decorativo, no exige 3:1): `#E5E7EB` (gris-200).

Ratios calculados con la fórmula de luminancia relativa de WCAG 2.1. El halo de foco y el borde normal de input se corrigieron de versiones anteriores que no alcanzaban el 3:1 exigido a elementos no textuales.

## 2. Tipografía

**Familia:** `Inter, system-ui, -apple-system, Segoe UI, sans-serif` (sans-serif legible, buen soporte de acentos para español).

**Escala tipográfica** (ratio 1.25, base 16px):

| Nivel | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 40px / 2.5rem | 700 | Título de splash/bienvenida |
| H1 | 32px / 2rem | 700 | Título de página (ej. "Cursos") |
| H2 | 24px / 1.5rem | 600 | Secciones dentro de una página |
| H3 | 20px / 1.25rem | 600 | Subsecciones, títulos de tarjeta |
| Body | 16px / 1rem | 400 | Texto general |
| Small | 14px / 0.875rem | 400 | Metadatos, ayudas de campo |
| Caption | 12px / 0.75rem | 500 | Etiquetas, badges de estado |

Interlineado: 1.5 para Body y Small; 1.2 para títulos.

## 3. Espaciado

Escala base de 4px (múltiplos consistentes para márgenes, padding y gaps):

4px — xs (separación entre ícono y texto)
8px — sm (padding interno de badges, gap entre campos relacionados)
16px — md (padding de tarjetas, gap entre campos de formulario)
24px — lg (separación entre secciones)
32px — xl (padding de contenedor de página en escritorio)
48px — 2xl (separación entre bloques mayores)
64px — 3xl (márgenes superiores de página)


En móvil, el padding de contenedor de página baja a 16px.

## 4. Estados de los componentes

### Botón primario
| Estado | Fondo | Texto | Borde |
|---|---|---|---|
| Normal | `#2563EB` | `#FFFFFF` | ninguno |
| Hover | `#1D4ED8` | `#FFFFFF` | ninguno |
| Foco | `#2563EB` | `#FFFFFF` | halo 3px `#2563EB` + offset 2px (5.2:1 sobre blanco) |
| Activo (presionado) | `#1E40AF` | `#FFFFFF` | ninguno |
| Deshabilitado | `#9CA3AF` | `#F3F4F6` | ninguno, cursor `not-allowed` |

### Campo de formulario (input)
| Estado | Borde | Fondo | Texto de ayuda |
|---|---|---|---|
| Normal | `#6B7280` 1.5px (4.8:1) | `#FFFFFF` | gris `#6B7280` |
| Foco | `#2563EB` 2px (5.2:1) | `#FFFFFF` | gris `#6B7280` |
| Error | `#DC2626` 2px (4.8:1) | `#FEF2F2` | rojo `#DC2626`, con ícono de alerta |
| Deshabilitado | `#E5E7EB` 1px (exento) | `#F3F4F6` | gris `#9CA3AF` |

El foco siempre se indica con contorno visible (nunca `outline: none` sin reemplazo), para cumplir accesibilidad por teclado. El borde normal se oscureció respecto a una versión anterior para alcanzar el 3:1 mínimo de contraste no textual (WCAG 1.4.11).

## 5. Mapa de navegación
                    ┌───────────────┐
                    │  Login/Registro│
                    └───────┬───────┘
                            │ autenticado
                            ▼
                 ┌─────────────────────┐
                 │   Dashboard (según   │
                 │        rol)          │
                 └──────────┬──────────┘
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                     ▼

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Estudiante: │ │ Profesor: │ │ Admin: │
│ "Mis cursos" │ │ "Mis cursos │ │ Cursos (CRUD) │
│ → Matrículas │ │ impartidos" │ │ Matrículas │
│ │ │ → Registrar nota │ │ (gestión total) │
└────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
└────────────────────┼─────────────────────┘
▼
┌─────────────────────┐
│ Detalle de curso / │
│ Detalle de matrícula│
└─────────────────────┘


Toda la navegación entre secciones pasa por el Dashboard; el rol del usuario determina qué accesos se muestran (no hay rutas ocultas solo por UI, el backend ya las bloquea igual por rol). Login/Registro es el punto de entrada, no una pantalla principal del dominio — las tres pantallas principales (sección 6) son las que el usuario usa una vez autenticado.

> Nota: si el proyecto define una sección de reportes en los requisitos, agregarla aquí como un cuarto nodo bajo Admin.

## 6. Bosquejos de las tres pantallas principales

### Pantalla 1 — Listado de cursos (Dashboard)

┌──────────────────────────────────────────────┐
│ Matrícula UCR [Perfil ▾] [Cerrar ses.]│
├──────────────────────────────────────────────┤
│ Cursos [+ Nuevo curso] │
│ ┌──────────────┐ Filtrar: [________] [▾ orden]│
│ │ Buscar... │ │
│ └──────────────┘ │
│ │
│ ┌────────────────────────────────────────┐ │
│ │ Bases de Datos II 4 créditos │ │
│ │ Prof. Juan Pérez 28/30 cupos [ › ]│ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ Programación Web 3 créditos │ │
│ │ Prof. Ana Gómez 12/30 cupos [ › ]│ │
│ └────────────────────────────────────────┘ │
│ │
│ ‹ 1 2 3 › │
└──────────────────────────────────────────────┘


### Pantalla 2 — Detalle de curso

┌──────────────────────────────────────────────┐
│ ‹ Volver a cursos │
├──────────────────────────────────────────────┤
│ Bases de Datos II │
│ 4 créditos · Prof. Juan Pérez │
│ Cupo: 28/30 │
│ │
│ Categorías: [Backend] [Base de datos] │
│ │
│ Estudiantes matriculados │
│ ┌────────────────────────────────────────┐ │
│ │ Jose Charpentier Nota: — [Editar]│ │
│ │ Maria Rodríguez Nota: 85 [Editar]│ │
│ └────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────┐ │
│ │ Matricularme │ (solo estudiante) │
│ └─────────────────────┘ │
└──────────────────────────────────────────────┘


### Pantalla 3 — Mis matrículas (vista del estudiante)

┌──────────────────────────────────────────────┐
│ Matrícula UCR [Perfil ▾] [Cerrar ses.]│
├──────────────────────────────────────────────┤
│ Mis matrículas │
│ │
│ ┌────────────────────────────────────────┐ │
│ │ Bases de Datos II │ │
│ │ Matriculado: 01/08/2026 Nota: — │ │
│ │ Prof. Juan Pérez [ › ] │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ Programación Web │ │
│ │ Matriculado: 15/08/2026 Nota: 85 │ │
│ │ Prof. Ana Gómez [ › ] │ │
│ └────────────────────────────────────────┘ │
│ │
│ Total: 2 de 6 cursos permitidos │
└──────────────────────────────────────────────┘


(Login y Registro quedan como pantallas de acceso, fuera de las tres principales del dominio — ver sección 5.)