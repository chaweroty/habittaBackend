# API de Mantenimientos - Documentación Rápida

## Endpoints Disponibles

### 1. Crear Mantenimiento
```http
POST /api/maintenances
Authorization: Bearer {token}
Content-Type: application/json

Body (Inquilino crea solicitud):
{
  "id_property": "uuid",
  "id_owner": "uuid",
  "id_user": "uuid",
  "title": "Fuga en la cocina",
  "description": "Descripción detallada",
  "created_by": "user",
  "responsibility": "owner",
  "attachments": {
    "images": ["url1", "url2"]
  }
}

Body (Propietario crea mantenimiento programado):
{
  "id_property": "uuid",
  "id_owner": "uuid",
  "id_user": "uuid",
  "title": "Revisión anual de gas",
  "description": "Mantenimiento preventivo",
  "created_by": "owner",
  "scheduled_date": "2025-11-15T10:00:00Z",
  "cost_estimate": 150000,
  "responsibility": "owner"
}
```

### 2. Obtener Mis Mantenimientos (como inquilino)
```http
GET /api/maintenances/my
Authorization: Bearer {token}
```

### 3. Obtener Mis Mantenimientos (como propietario)
```http
GET /api/maintenances/my-owner
Authorization: Bearer {token}
```

### 4. Obtener Mantenimiento por ID
```http
GET /api/maintenances/:id
Authorization: Bearer {token}
```

### 5. Obtener Mantenimientos de una Propiedad
```http
GET /api/maintenances/property/:propertyId
Authorization: Bearer {token}
```

### 6. Actualizar Mantenimiento
```http
PATCH /api/maintenances/:id
Authorization: Bearer {token}
Content-Type: application/json

Body (Owner acepta y programa):
{
  "status": "accepted",
  "scheduled_date": "2025-11-15T10:00:00Z",
  "cost_estimate": 150000,
  "responsibility": "user"
}

Body (User confirma):
{
  "status": "confirmed",
  "id_payment": "payment-uuid"
}

Body (Marcar como completado):
{
  "status": "completed"
}

Body (Rechazar):
{
  "status": "rejected"
}
```

### 7. Eliminar Mantenimiento
```http
DELETE /api/maintenances/:id
Authorization: Bearer {token}
```

### 8. Obtener Todos los Mantenimientos (Admin)
```http
GET /api/maintenances
Authorization: Bearer {token}
```

## Flujo de Estados

### Creado por Inquilino (user)
```
1. user crea → status: "pending"
   - Sin fecha ni costo aún

2. owner acepta → status: "accepted"
   - Debe incluir: scheduled_date, cost_estimate, responsibility

3. user confirma → status: "confirmed"
   - Si responsibility="user", debe incluir: id_payment

4. Cualquiera → status: "completed"
   - Se registra completed_date automáticamente

* En cualquier momento → status: "rejected"
```

### Creado por Propietario (owner)
```
1. owner crea → status: "accepted"
   - Debe incluir: scheduled_date, cost_estimate, responsibility

2. user confirma → status: "confirmed"
   - Si responsibility="user", debe incluir: id_payment

3. Cualquiera → status: "completed"
   - Se registra completed_date automáticamente

* user puede rechazar → status: "rejected"
```

## Validación de Transiciones de Estado

| Estado Actual | Puede cambiar a (Owner) | Puede cambiar a (User) |
|---------------|-------------------------|------------------------|
| pending       | accepted, rejected      | -                      |
| accepted      | rejected                | confirmed, rejected    |
| confirmed     | completed               | completed              |
| rejected      | (final)                 | (final)                |
| completed     | (final)                 | (final)                |

## Permisos

- **Crear**: Cualquier usuario autenticado (owner o user)
- **Ver**: Owner de la propiedad, User involucrado, Admin
- **Actualizar**: Owner de la propiedad, User involucrado, Admin
- **Eliminar**: Quien lo creó, Admin
- **Ver todos**: Solo Admin

## Responsabilidad del Costo

- **`responsibility: "owner"`** → Propietario asume el costo (no se crea Payment)
- **`responsibility: "user"`** → Inquilino paga (debe vincularse un Payment)

## Campos del Modelo

```javascript
{
  id_maintenance: "uuid",
  id_property: "uuid",
  id_owner: "uuid",
  id_user: "uuid",
  title: "string",
  description: "string | null",
  status: "pending | accepted | confirmed | rejected | completed",
  responsibility: "owner | user",
  cost_estimate: "number | null",
  scheduled_date: "datetime | null",
  confirmed_date: "datetime | null",
  completed_date: "datetime | null",
  attachments: "json | null",
  created_by: "owner | user",
  id_payment: "uuid | null",
  created_at: "datetime",
  updated_at: "datetime"
}
```

## Ejemplos de Respuesta

### Mantenimiento Creado por Inquilino
```json
{
  "success": true,
  "message": "Mantenimiento creado exitosamente",
  "data": {
    "id_maintenance": "uuid",
    "title": "Fuga en la cocina",
    "description": "Hay una fuga debajo del fregadero",
    "status": "pending",
    "responsibility": "owner",
    "created_by": "user",
    "cost_estimate": null,
    "scheduled_date": null,
    "property": {
      "id": "uuid",
      "title": "Apartamento Centro",
      "address": "Calle 123"
    },
    "owner": {
      "id": "uuid",
      "name": "Juan Pérez",
      "email": "owner@example.com",
      "phone": "+573001234567"
    },
    "user": {
      "id": "uuid",
      "name": "María García",
      "email": "user@example.com",
      "phone": "+573007654321"
    },
    "payment": null,
    "created_at": "2025-11-08T...",
    "updated_at": "2025-11-08T..."
  }
}
```

### Owner Acepta y Programa
```json
{
  "success": true,
  "message": "Mantenimiento aceptado y programado",
  "data": {
    "id_maintenance": "uuid",
    "status": "accepted",
    "scheduled_date": "2025-11-15T10:00:00Z",
    "cost_estimate": 150000,
    "responsibility": "user",
    ...
  }
}
```

## Códigos de Error Comunes

- **400**: Validación fallida, transición de estado inválida
- **403**: Sin permisos para realizar la acción
- **404**: Mantenimiento no encontrado

## Notas Importantes

1. **Estados finales**: `rejected` y `completed` no pueden cambiar
2. **Fechas automáticas**: 
   - `confirmed_date` se registra al pasar a "confirmed"
   - `completed_date` se registra al pasar a "completed"
3. **Validación de pago**: Si `responsibility="user"` y status pasa a "confirmed", debe haber `id_payment`
4. **Attachments**: Campo JSON flexible para almacenar URLs de imágenes, documentos, etc.
