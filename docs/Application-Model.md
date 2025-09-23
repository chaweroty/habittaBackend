# Modelo Application - Documentación

## Descripción General
El modelo `Application` gestiona las solicitudes de arrendamiento que los usuarios (renters) envían para propiedades disponibles. Incluye información del solicitante, la propiedad de interés, estado de la aplicación y un mensaje personalizado del renter.

## Estructura del Modelo

### Campos del Modelo
```prisma
model Application {
  id               String   @id @default(uuid())
  id_renter        String
  id_property      String
  status           String
  description      String?              // ✨ NUEVO CAMPO
  application_date DateTime @default(now())
  renter           User     @relation(fields: [id_renter], references: [id])
  property         Property @relation(fields: [id_property], references: [id])
  legalDocuments   LegalDocument[]
}
```

### Descripción de Campos

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `id` | String (UUID) | Identificador único de la aplicación | ✅ |
| `id_renter` | String (UUID) | ID del usuario que aplica (renter) | ✅ |
| `id_property` | String (UUID) | ID de la propiedad a la que se aplica | ✅ |
| `status` | String | Estado de la aplicación (pending, pre_approved, approved, rejected, withdrawn) | ✅ |
| `description` | String? | Mensaje personalizado del renter (máx. 500 caracteres) | ❌ |
| `application_date` | DateTime | Fecha de creación de la aplicación | ✅ (automático) |

### Estados Válidos (Status) y Flujo
- `pending`: Aplicación pendiente de revisión por el propietario
- `pre_approved`: ✨ **NUEVO** - Pre-aprobada por el propietario, esperando confirmación del renter
- `approved`: Aplicación completamente aprobada (solo después de pre_approved + confirmación del renter)
- `rejected`: Aplicación rechazada por el propietario
- `withdrawn`: Aplicación retirada por el solicitante

### 🔄 Flujo de Estados
```
pending → pre_approved → approved
   ↓           ↓           ↓
rejected    rejected    withdrawn
   ↓           ↓
withdrawn   withdrawn
```

#### Transiciones Permitidas por Rol:

**🏠 Propietario:**
- `pending` → `pre_approved`, `rejected`
- `pre_approved` → `approved`, `rejected`
- `approved` → `rejected` (revertir si es necesario)
- `rejected` → `pending`, `pre_approved` (reactivar)

**👤 Renter (Solicitante):**
- `pre_approved` → `approved` (confirmar/aceptar pre-aprobación)
- Cualquier estado → `withdrawn` (retirar aplicación)

**👨‍💼 Admin:**
- Cualquier transición permitida

## Funcionalidades

### 🔐 Permisos y Autorización

#### Crear Aplicaciones
- ✅ **Usuarios autenticados**: Pueden crear aplicaciones para propiedades
- ❌ **Restricción**: No pueden aplicar dos veces a la misma propiedad

#### Ver Aplicaciones
- ✅ **Renter**: Puede ver sus propias aplicaciones
- ✅ **Propietario**: Puede ver aplicaciones de sus propiedades
- ✅ **Admin**: Puede ver todas las aplicaciones
- ❌ **Otros usuarios**: No tienen acceso

#### Actualizar Aplicaciones
- ✅ **Renter**: 
  - Puede actualizar solo la `description` de sus aplicaciones
  - Puede **aceptar pre-aprobaciones** (`pre_approved` → `approved`)
  - Puede **retirar su aplicación** (cualquier estado → `withdrawn`)
- ✅ **Propietario**: 
  - Puede **pre-aprobar** aplicaciones (`pending` → `pre_approved`) 
  - Puede **rechazar** aplicaciones en cualquier momento
  - **NO puede aprobar directamente** - debe usar el flujo de pre-aprobación
- ✅ **Admin**: Puede actualizar todos los campos y hacer cualquier transición

#### Eliminar Aplicaciones
- ✅ **Renter**: Puede eliminar sus propias aplicaciones
- ✅ **Admin**: Puede eliminar cualquier aplicación
- ❌ **Propietario**: No puede eliminar aplicaciones (solo cambiar status)

### 🌐 Endpoints Disponibles

```
POST   /api/applications              - Crear nueva aplicación
GET    /api/applications/my           - Obtener mis aplicaciones
GET    /api/applications              - Obtener todas (solo admin)
GET    /api/applications/:id          - Obtener aplicación específica
GET    /api/applications/property/:id - Obtener aplicaciones de una propiedad
PUT    /api/applications/:id          - Actualizar aplicación
DELETE /api/applications/:id          - Eliminar aplicación
```

## Validaciones

### Crear Aplicación
```javascript
{
  "id_property": "uuid-valido",           // Obligatorio
  "status": "pending",                    // Opcional (default: pending)
  "description": "Mensaje del renter"     // Opcional (máx. 500 caracteres)
}
```

### Actualizar Aplicación
```javascript
{
  "status": "approved",                   // Opcional
  "description": "Mensaje actualizado"    // Opcional (máx. 500 caracteres)
}
```

## Casos de Uso

### 1. Renter Interesado en Propiedad
```javascript
// Renter envía aplicación con mensaje personalizado
POST /api/applications
{
  "id_property": "prop-uuid-123",
  "description": "Hola, estoy muy interesado en esta propiedad. Tengo ingresos estables y excelentes referencias. ¿Podríamos coordinar una visita?"
}
```

### 2. Propietario Pre-aprueba Aplicación
```javascript
// Propietario ve aplicaciones de su propiedad
GET /api/applications/property/prop-uuid-123

// Propietario pre-aprueba una aplicación
PUT /api/applications/app-uuid-456
{
  "status": "pre_approved"
}
// Respuesta: "Aplicación pre-aprobada. El solicitante puede confirmar para finalizar el proceso."
```

### 3. Renter Confirma Pre-aprobación ✨ **NUEVO FLUJO**
```javascript
// Renter ve sus aplicaciones y encuentra una pre-aprobada
GET /api/applications/my

// Renter confirma/acepta la pre-aprobación
PUT /api/applications/app-uuid-456
{
  "status": "approved"
}
// Respuesta: "Aplicación aprobada exitosamente"
```

### 4. Renter Actualiza su Mensaje
```javascript
// Renter añade más información a su aplicación
PUT /api/applications/app-uuid-456
{
  "description": "Añadiendo que tengo mascotas (1 gato), espero no sea problema. Puedo proporcionar referencias veterinarias."
}
```

### 5. Renter Retira Aplicación
```javascript
// Renter decide retirar su aplicación
PUT /api/applications/app-uuid-456
{
  "status": "withdrawn"
}
// Respuesta: "Aplicación retirada por el solicitante"
```

## Relaciones

- **User (Renter)**: Relación muchos-a-uno con User como renter
- **Property**: Relación muchos-a-uno con Property
- **LegalDocument**: Relación uno-a-muchos con documentos legales

## Restricciones de Negocio

1. **Unicidad**: Un renter no puede tener múltiples aplicaciones para la misma propiedad
2. **Validación de propiedad**: La propiedad debe existir antes de crear la aplicación
3. **Longitud de descripción**: Máximo 500 caracteres para mantener mensajes concisos
4. **Estados válidos**: Solo se permiten los estados definidos en el esquema
5. **🔄 Flujo de aprobación**: Los propietarios NO pueden aprobar directamente - deben usar pre-aprobación
6. **👤 Confirmación del renter**: Solo el renter puede confirmar una pre-aprobación
7. **🚫 Transiciones restringidas**: Cada rol tiene transiciones específicas permitidas

## Ejemplos de Respuestas

### Aplicación Creada
```json
{
  "success": true,
  "message": "Aplicación creada exitosamente",
  "data": {
    "id": "app-uuid-123",
    "id_renter": "user-uuid-456",
    "id_property": "prop-uuid-789",
    "status": "pending",
    "description": "Mensaje del renter aquí",
    "application_date": "2025-09-20T21:08:03.000Z",
    "renter": {
      "id": "user-uuid-456",
      "name": "Juan Pérez",
      "email": "juan@email.com",
      "phone": "+57300123456"
    },
    "property": {
      "id": "prop-uuid-789",
      "title": "Apartamento en Zona Rosa",
      "address": "Calle 123 #45-67",
      "price": 1500000,
      "images": [
        {
          "url_image": "https://ejemplo.com/imagen1.jpg"
        }
      ]
    }
  }
}
```

### Lista de Aplicaciones
```json
{
  "success": true,
  "data": [
    {
      "id": "app-uuid-123",
      "status": "pending",
      "description": "Interesado en la propiedad",
      "application_date": "2025-09-20T21:08:03.000Z",
      "renter": { 
        "name": "Juan Pérez", 
        "email": "juan@email.com" 
      },
      "property": { 
        "title": "Apartamento en Zona Rosa", 
        "price": 1500000,
        "images": [
          {
            "url_image": "https://ejemplo.com/imagen1.jpg"
          }
        ]
      }
    }
  ]
}
```