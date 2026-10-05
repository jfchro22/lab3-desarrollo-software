# Laboratorio 7 — Guía de interfaz del proyecto

Sistema de matrícula universitaria.

## 1. Paleta de color (contraste verificado WCAG 2.1)

| Uso | Color | Sobre | Ratio | Nivel |
|---|---|---|---|---|
| Texto principal | `#1F2937` (gris-800) | `#FFFFFF` | 14.7:1 | AAA |
| Acción primaria (botón, enlaces) | `#2563EB` (azul-600) | `#FFFFFF` | 5.2:1 | AA |
| Texto sobre botón primario | `#FFFFFF` | `#2563EB` | 5.2:1 | AA |
| Error / destructivo | `#DC2626` (rojo-600) | `#FFFFFF` | 4.8:1 | AA |
| Éxito (solo íconos/badges, no texto pequeño) | `#16A34A` (verde-600) | `#FFFFFF` | 3.3:1 | AA (elementos gráficos) |
| Fondo de superficie | `#F9FAFB` (gris-50) | — | — | — |
| Borde / separador | `#E5E7EB` (gris-200) | — | — | — |
| Texto deshabilitado | `#9CA3AF` (gris-400) | `#FFFFFF` | 2.3:1 | Exento (WCAG no exige contraste en controles deshabilitados) |

Ratios calculados con la fórmula de luminancia relativa de WCAG 2.1 (contraste mínimo AA = 4.5:1 para texto normal, 3:1 para texto grande y elementos gráficos).

## 2. Tipografía

**Familia:** `Inter, system-ui, -apple-system, Segoe UI, sans-serif` (sans-serif legible, buen soporte de acentos para español).

**Escala tipográfica** (ratio 1.25, base 16px):

| Nivel | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 40px / 2.5rem | 700 | Título de login / splash |
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
| Foco | `#2563EB` | `#FFFFFF` | halo 2px `#93C5FD` + offset 2px |
| Activo (presionado) | `#1E40AF` | `#FFFFFF` | ninguno |
| Deshabilitado | `#9CA3AF` | `#F3F4F6` | ninguno, cursor `not-allowed` |

### Campo de formulario (input)
| Estado | Borde | Fondo | Texto de ayuda |
|---|---|---|---|
| Normal | `#E5E7EB` 1px | `#FFFFFF` | gris `#6B7280` |
| Foco | `#2563EB` 2px | `#FFFFFF` | gris `#6B7280` |
| Error | `#DC2626` 2px | `#FEF2F2` | rojo `#DC2626`, con ícono de alerta |
| Deshabilitado | `#E5E7EB` 1px | `#F3F4F6` | gris `#9CA3AF` |

El foco siempre se indica con contorno visible (nunca `outline: none` sin reemplazo), para cumplir accesibilidad por teclado.

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


Toda la navegación entre secciones pasa por el Dashboard; el rol del usuario determina qué accesos se muestran (no hay rutas ocultas solo por UI, el backend ya las bloquea igual por rol).

## 6. Bosquejos de las tres pantallas principales

### Pantalla 1 — Login

┌──────────────────────────────────┐
│ │
│ Matrícula UCR │
│ │
│ Correo electrónico │
│ ┌─────────────────────────┐ │
│ │ │ │
│ └─────────────────────────┘ │
│ │
│ Contraseña │
│ ┌─────────────────────────┐ │
│ │ │ │
│ └─────────────────────────┘ │
│ │
│ ┌─────────────────────────┐ │
│ │ Iniciar sesión │ │
│ └─────────────────────────┘ │
│ │
│ ¿No tenés cuenta? Registrate │
│ │
└──────────────────────────────────┘


### Pantalla 2 — Listado de cursos (Dashboard)

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


### Pantalla 3 — Detalle de curso / matrícula

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