# Feature Specification: Roles

**Created**: 2026-02-28

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin accede al panel de administración (Priority: P1)

El admin ingresa sus credenciales en `/admin/login` y accede al panel de administración donde puede gestionar la plataforma. Cualquier intento de acceder a rutas `/admin/*` sin sesión activa redirige al login.

**Why this priority**: Sin esta capacidad el admin no puede operar la plataforma. Es el bloqueo base para todo el backoffice.

**Independent Test**: Se puede testear completamente accediendo a `/admin/login`, ingresando credenciales válidas y verificando redirección al dashboard. También se puede testear accediendo a `/admin` sin sesión y verificar redirección al login.

**Acceptance Scenarios**:

1. **Scenario**: Login exitoso
   - **Given** el admin no tiene sesión activa
   - **When** ingresa credenciales válidas en `/admin/login`
   - **Then** es redirigido a `/admin` (dashboard)

2. **Scenario**: Login fallido
   - **Given** el admin no tiene sesión activa
   - **When** ingresa credenciales incorrectas
   - **Then** ve un mensaje de error y permanece en `/admin/login`

3. **Scenario**: Acceso directo a ruta protegida sin sesión
   - **Given** el usuario no tiene sesión activa
   - **When** intenta acceder a cualquier ruta bajo `/admin/*` (excepto `/admin/login`)
   - **Then** es redirigido a `/admin/login`

4. **Scenario**: Admin ya autenticado intenta volver al login
   - **Given** el admin tiene sesión activa
   - **When** navega a `/admin/login`
   - **Then** es redirigido automáticamente a `/admin`

5. **Scenario**: Persistencia de sesión
   - **Given** el admin inició sesión previamente
   - **When** recarga la página o reabre el navegador
   - **Then** mantiene su sesión activa y puede seguir operando

---

### User Story 2 - Visitante anónimo navega la tienda (Priority: P2)

Cualquier persona puede acceder al catálogo y páginas públicas de la tienda sin necesidad de registrarse ni autenticarse.

**Why this priority**: Es el flujo principal del e-commerce. Los clientes deben poder ver productos sin fricción.

**Independent Test**: Se puede testear navegando a `/` y a páginas del catálogo desde un navegador sin cookies ni sesión activa, verificando que el contenido se muestre correctamente.

**Acceptance Scenarios**:

1. **Scenario**: Acceso al catálogo sin sesión
   - **Given** un visitante sin cuenta ni sesión
   - **When** accede a cualquier ruta pública (`/`, `/catalogo`, `/producto/[slug]`, `/sets`, `/set/[slug]`)
   - **Then** puede ver el contenido sin ningún tipo de autenticación

2. **Scenario**: Visitante intenta acceder al admin
   - **Given** un visitante sin sesión activa
   - **When** intenta acceder a `/admin`
   - **Then** es redirigido a `/admin/login` (no puede operar el backoffice)

---

### User Story 3 - Admin cierra sesión (Priority: P3)

El admin puede cerrar su sesión activa desde el panel de administración.

**Why this priority**: Necesario para seguridad básica, especialmente en dispositivos compartidos.

**Independent Test**: Se puede testear haciendo logout y verificando que el acceso a `/admin` redirige nuevamente al login.

**Acceptance Scenarios**:

1. **Scenario**: Logout exitoso
   - **Given** el admin tiene sesión activa
   - **When** ejecuta la acción de logout
   - **Then** su sesión es invalidada y es redirigido a `/admin/login`

2. **Scenario**: Acceso post-logout
   - **Given** el admin acaba de hacer logout
   - **When** intenta acceder a `/admin`
   - **Then** es redirigido a `/admin/login`

---

### Edge Cases

- ¿Qué pasa si el token de sesión del admin expira mientras está usando el panel? → Debe ser redirigido a `/admin/login` en el próximo request.
- ¿Qué pasa si las credenciales del admin son cambiadas directamente en Supabase mientras tiene sesión activa? → La sesión existente sigue válida hasta que expire o haga logout.

## Out of Scope

- Múltiples usuarios admin o gestión de admins desde la interfaz.
- Registro de clientes / cuentas de usuario para visitantes.
- Roles granulares dentro del admin (ej: editor vs superadmin).
- Recuperación de contraseña del admin (se gestiona directamente en Supabase).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proteger todas las rutas bajo `/admin/*` (excepto `/admin/login`) requiriendo una sesión autenticada válida.
- **FR-002**: El sistema DEBE redirigir a `/admin/login` a cualquier request no autenticado hacia rutas protegidas del admin.
- **FR-003**: El sistema DEBE redirigir a `/admin` a un admin autenticado que intente acceder a `/admin/login`.
- **FR-004**: El admin DEBE poder iniciar sesión con email y contraseña.
- **FR-005**: El admin DEBE poder cerrar su sesión desde el panel.
- **FR-006**: Las rutas públicas del storefront DEBEN ser accesibles sin autenticación.
- **FR-007**: La sesión del admin DEBE persistir entre recargas de página durante su período de validez.
- **FR-008**: El admin DEBE ser creado manualmente en Supabase (no existe flujo de registro en la app).

### Key Entities

- **Admin**: Usuario único con credenciales en Supabase Auth. No tiene representación especial en la app más allá de tener una sesión autenticada.
- **Sesión**: Token gestionado por Supabase SSR, persistido en cookies httpOnly.
- **Ruta protegida**: Cualquier path bajo `/admin/*` excepto `/admin/login`.
- **Ruta pública**: Cualquier path bajo `/(shop)` y la raíz `/`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los requests a rutas protegidas sin sesión válida resultan en redirección a `/admin/login`.
- **SC-002**: El admin puede completar el flujo de login en menos de 3 interacciones (ingresar email, ingresar password, submit).
- **SC-003**: Ninguna ruta pública del storefront requiere autenticación para ser visualizada.
- **SC-004**: El logout invalida la sesión de forma inmediata, sin posibilidad de reutilizar el token.
