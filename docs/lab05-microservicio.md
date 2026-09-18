# Microservicio de Notificaciones — Contrato y justificación

## 1. Responsabilidad

Enviar notificaciones (correo, y opcionalmente SMS/push) al ocurrir eventos relevantes
del dominio de matrícula:

- Un estudiante se matricula en un curso
- Se registra la nota de una matrícula
- Un curso está por iniciar (recordatorio)

## 2. Por qué se separa del monolito

| Criterio                       | Justificación                                                                                     |
|---------------------------------|-----------------------------------------------------------------------------------------------------|
| Perfil de carga distinto        | Se dispara en ráfagas (ej. apertura de matrícula), no de forma constante como el resto de la API   |
| Punto de falla aislable         | Depende de un proveedor externo (SMTP, servicio de correo); si ese proveedor cae, no debe tumbar ni frenar la API académica |
| Ciclo de vida propio            | Cambia por razones ajenas al dominio académico (nuevo proveedor de correo, nuevas plantillas)      |
| Tecnología potencialmente distinta | Podría usar una cola dedicada o un proveedor SaaS (SendGrid, Mailgun) sin que el monolito lo sepa |

No se adopta por moda: la razón concreta es que un fallo o lentitud del envío de correos
**nunca debe impactar el tiempo de respuesta ni la disponibilidad** de crear/consultar
matrículas y cursos.

## 3. Contrato del microservicio

### 3.1 Crear notificación

POST /notificaciones
Content-Type: application/json

{
"tipo": "matricula_creada",
"destinatario_id": 1,
"canal": "email",
"datos": {
"estudiante_nombre": "Theo Cronin",
"curso_nombre": "Bases de Datos"
}
}

**Respuesta — 202 Accepted** (no se espera el envío real, solo se acepta el encargo)
```json
{
  "id": "ntf_8f2a1c",
  "estado": "pendiente"
}
```

**Errores**
- `422 Unprocessable Content` — `tipo`, `destinatario_id` o `canal` faltantes o inválidos
- `400 Bad Request` — cuerpo mal formado

### 3.2 Consultar estado de una notificación

GET /notificaciones/{id}

**Respuesta — 200 OK**
```json
{
  "id": "ntf_8f2a1c",
  "estado": "enviada",
  "intentos": 1,
  "creado_en": "2026-09-18T10:00:00Z",
  "actualizado_en": "2026-09-18T10:00:03Z"
}
```

Estados posibles: `pendiente | enviada | fallida`

**Errores**
- `404 Not Found` — no existe una notificación con ese id

## 4. Comunicación con el monolito

- **Asíncrona**, vía cola (`Queue::route()` en Laravel 13, o un broker como Redis/RabbitMQ).
- El monolito **no espera** la respuesta del microservicio: al crear una matrícula, encola
  el evento y responde de inmediato al cliente con el `201` de la matrícula.
- El microservicio consume la cola y hace el envío real de forma independiente.

```php
// En MatriculaService::crear(), tras persistir la matrícula
NotificarMatricula::dispatch($matricula)->onQueue('notificaciones');
```

## 5. Qué pasa si el servicio está caído

- El evento **queda encolado** (la cola sobrevive aunque el consumidor esté caído).
- Cuando el microservicio vuelve, procesa el backlog en orden.
- Se define una política de reintentos (ej. 3 intentos con backoff exponencial); si los
  3 fallan, la notificación pasa a `fallida` y queda disponible para revisión manual,
  pero **en ningún momento bloquea ni afecta** la operación de matrícula en el monolito.
- El estudiante o profesor **nunca ve un error de la API académica** por una falla del
  proveedor de correo — es una degradación aislada.

## 6. Alcance de este laboratorio

Este documento define el contrato y la justificación de separación. **No se implementa**
el microservicio en este laboratorio, según el enunciado del Lab 5.