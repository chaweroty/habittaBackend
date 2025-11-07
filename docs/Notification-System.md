# Sistema de Notificaciones - Estados de Application

## Resumen
Sistema de notificaciones push implementado para notificar automáticamente a las contrapartes cuando cambia el estado de una `Application`. Las notificaciones se envían usando Expo Push Notifications.

## Estados de Application y Notificaciones

### 1. **pending** - Solicitud Pendiente
- **Cuándo:** Al crear una nueva aplicación (`POST /api/applications`)
- **Notifica a:** Propietario (owner)
- **Título:** "Nueva solicitud recibida 📝"
- **Mensaje:** "{renterName} está interesado en tu propiedad "{propertyTitle}"."
- **Función:** `sendNewApplicationNotification()`

### 2. **documents_required** - Documentos Requeridos
- **Cuándo:** Owner requiere documentos adicionales
- **Transición:** `pending` → `documents_required`
- **Notifica a:** Solicitante (renter)
- **Título:** "Documentos requeridos 📄"
- **Mensaje:** "Se necesitan documentos adicionales para tu solicitud de "{propertyTitle}"."
- **Función:** `sendDocumentsRequiredNotification()`

### 3. **pre_approved** - Pre-aprobación
- **Cuándo:** Owner pre-aprueba la solicitud
- **Transición:** `documents_required` → `pre_approved`
- **Notifica a:** Solicitante (renter)
- **Título:** "¡Pre-aprobación! 🎯"
- **Mensaje:** "Tu solicitud para "{propertyTitle}" ha sido pre-aprobada. Confirma para continuar."
- **Función:** `sendPreApprovedNotification()`

### 4. **approved** - Aprobada
- **Cuándo:** Renter confirma la pre-aprobación
- **Transición:** `pre_approved` → `approved`
- **Notifica a:** Propietario (owner)
- **Título:** "Solicitud confirmada ✅"
- **Mensaje:** "{renterName} ha confirmado su interés en "{propertyTitle}". Puedes proceder con el contrato."
- **Función:** `sendApplicationConfirmedByRenterNotification()`

### 5. **signed** - Contrato Firmado
- **Cuándo:** Se firma el contrato
- **Transición:** `approved` → `signed`
- **Notifica a:** Contraparte (owner o renter, dependiendo de quién actualice)
- **Título:** "Contrato firmado 📑"
- **Mensaje:** "{recipientName}, el contrato para "{propertyTitle}" ha sido firmado exitosamente."
- **Función:** `sendContractSignedNotification()`
- **Efecto adicional:** Property.status cambia a `rented`

### 6. **rejected** - Rechazada
- **Cuándo:** Owner rechaza la solicitud
- **Transición:** `pending` | `documents_required` | `approved` → `rejected`
- **Notifica a:** Solicitante (renter)
- **Título:** "Solicitud no aprobada 😔"
- **Mensaje:** "Tu solicitud para "{propertyTitle}" no fue aprobada esta vez."
- **Función:** `sendApplicationRejectedNotification()`
- **Nota:** Ya existía como `sendApplicationRejectedNotification()`, reutilizada

### 7. **withdrawn** - Retirada
- **Cuándo:** Renter retira su solicitud
- **Transición:** Desde cualquier estado activo → `withdrawn`
- **Notifica a:** Propietario (owner)
- **Título:** "Solicitud retirada 🚫"
- **Mensaje:** "{renterName} ha retirado su solicitud para "{propertyTitle}"."
- **Función:** `sendApplicationWithdrawnNotification()`

### 8. **terminated** - Finalizada
- **Cuándo:** El contrato o aplicación termina
- **Transición:** `signed` → `terminated`
- **Notifica a:** Contraparte (owner o renter)
- **Título:** "Contrato finalizado 🏁"
- **Mensaje:** "El contrato para "{propertyTitle}" ha finalizado."
- **Función:** `sendApplicationTerminatedNotification()`
- **Efecto adicional:** Property.status cambia a `published`

## Diagrama de Flujo de Notificaciones

```
[RENTER crea application]
    ↓
pending → Owner recibe "Nueva solicitud recibida 📝"

[OWNER actualiza a documents_required]
    ↓
documents_required → Renter recibe "Documentos requeridos 📄"

[OWNER actualiza a pre_approved]
    ↓
pre_approved → Renter recibe "¡Pre-aprobación! 🎯"

[RENTER confirma (actualiza a approved)]
    ↓
approved → Owner recibe "Solicitud confirmada ✅"

[OWNER o RENTER actualiza a signed]
    ↓
signed → Contraparte recibe "Contrato firmado 📑"

[OWNER actualiza a rejected]
    ↓
rejected → Renter recibe "Solicitud no aprobada 😔"

[RENTER actualiza a withdrawn]
    ↓
withdrawn → Owner recibe "Solicitud retirada 🚫"

[OWNER o RENTER actualiza a terminated]
    ↓
terminated → Contraparte recibe "Contrato finalizado 🏁"
```

## Implementación Técnica

### Archivos Modificados

1. **`src/services/pushNotificationService.js`**
   - Añadidas 6 nuevas funciones de notificación
   - Exportadas en `module.exports`

2. **`src/controllers/ApplicationController.js`**
   - Importadas funciones de notificación
   - Lógica añadida en `createApplication()` para notificar al owner
   - Lógica añadida en `updateApplication()` para notificar a la contraparte según el estado

### Lógica de Notificación en `updateApplication()`

```javascript
// Determinar quién hizo la actualización
const isOwnerUpdating = isOwner || isAdmin;
const isRenterUpdating = isRenter && !isOwner;

// Obtener pushToken de la contraparte
const counterpartyPushToken = isOwnerUpdating 
  ? application.renter.pushToken 
  : application.property.owner?.pushToken;

// Enviar notificación según el nuevo estado
switch (status) {
  case 'documents_required':
    await sendDocumentsRequiredNotification(counterpartyPushToken, propertyTitle);
    break;
  // ... otros casos
}
```

### Manejo de Errores
- Las notificaciones se envían en bloques `try-catch` separados
- **No fallan la operación principal** si la notificación falla
- Se registran errores en consola con `console.error()`
- Se verifica que exista `pushToken` antes de enviar

## Datos en Notificaciones

Cada notificación incluye:
- **`type`**: `'application_status'` (para filtrado en frontend)
- **`status`**: Estado actual de la aplicación
- **`action`**: Acción sugerida para el usuario
  - `view_application`
  - `upload_documents`
  - `confirm_application`
  - `prepare_contract`
  - `view_contract`
  - `view_applications`
  - `view_history`
- **`propertyTitle`**: Título de la propiedad

## Requisitos

### Base de Datos
- Campo `User.pushToken` debe estar poblado para recibir notificaciones
- Se actualiza cuando el usuario inicia sesión desde la app móvil

### Variables de Entorno
- No se requieren variables adicionales
- Usa la configuración existente de Expo Push Notifications

## Pruebas

### Escenarios de Prueba

1. **Nueva solicitud:**
   ```
   POST /api/applications
   Body: { id_property: "...", description: "..." }
   → Owner debe recibir notificación
   ```

2. **Owner requiere documentos:**
   ```
   PATCH /api/applications/:id
   Body: { status: "documents_required" }
   → Renter debe recibir notificación
   ```

3. **Renter confirma pre-aprobación:**
   ```
   PATCH /api/applications/:id
   Body: { status: "approved" }
   → Owner debe recibir notificación
   ```

4. **Renter retira solicitud:**
   ```
   PATCH /api/applications/:id
   Body: { status: "withdrawn" }
   → Owner debe recibir notificación
   ```

### Verificación en Logs
- Buscar mensajes con emoji 📱: `"📱 Notificación de ... enviada"`
- Verificar advertencias: `"⚠️ No se pudo enviar notificación: Usuario sin pushToken"`
- Errores: `"❌ Error enviando notificación:"`

## Mejoras Futuras

1. **Notificaciones in-app:** Guardar historial de notificaciones en BD
2. **Configuración de usuario:** Permitir silenciar ciertos tipos de notificaciones
3. **Notificaciones programadas:** Recordatorios de pagos, vencimiento de contratos
4. **Rich notifications:** Incluir imágenes de la propiedad
5. **Deep linking:** Abrir directamente la aplicación específica al hacer tap

## Referencias

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- Archivo: `src/utils/expoPush.js` - Utilidad base de Expo
- Modelo: `User.pushToken` - String opcional en schema de Prisma
