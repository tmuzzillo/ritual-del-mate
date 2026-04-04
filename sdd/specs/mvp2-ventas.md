# Feature Specification: MVP2 — Carrito, Stock y Checkout

**Created**: 2026-04-04

## User Scenarios & Testing *(mandatory)*

---

### User Story 1 — Visibilidad de stock en catálogo (Priority: P1)

El visitante puede ver en el catálogo y en la ficha de cada producto/set si hay stock disponible. Los productos sin stock se muestran con imagen grisada y un badge "Sin stock", sin posibilidad de agregar al carrito.

**Why this priority**: Es la base del sistema de ventas. Sin esta información el usuario no puede tomar decisiones de compra.

**Independent Test**: Se puede testear independientemente navegando el catálogo con productos con stock 0 configurados en admin.

**Acceptance Scenarios**:

1. **Scenario**: Producto sin stock visible en catálogo
   - **Given** un producto con stock total = 0 (o todas sus variaciones con stock = 0)
   - **When** el visitante navega el catálogo
   - **Then** el producto aparece con imagen grisada, badge "Sin stock" y sin botón de agregar al carrito

2. **Scenario**: Producto con variaciones — stock parcial
   - **Given** un producto con variación A stock=0 y variación B stock=2
   - **When** el visitante abre la ficha del producto y selecciona variación A
   - **Then** el botón "Agregar al carrito" se deshabilita y muestra "Sin stock"
   - **When** selecciona variación B
   - **Then** el botón queda habilitado

3. **Scenario**: Set sin stock por producto componente agotado
   - **Given** un set que incluye el producto P con stock=0
   - **When** el visitante navega el catálogo de sets
   - **Then** el set aparece con imagen grisada y badge "Sin stock"

4. **Scenario**: Producto con stock disponible
   - **Given** un producto con stock > 0
   - **When** el visitante lo visualiza
   - **Then** la imagen se muestra con colores normales y el botón "Agregar al carrito" está habilitado

---

### User Story 2 — Carrito de compras (Priority: P1)

El visitante puede agregar productos y sets al carrito, visualizar el resumen y modificar las cantidades antes de comprar. El carrito persiste mientras la sesión del navegador esté activa.

**Why this priority**: Sin carrito no hay checkout posible.

**Independent Test**: Se puede testear agregando productos/sets al carrito y verificando persistencia al navegar entre páginas.

**Acceptance Scenarios**:

1. **Scenario**: Agregar producto sin variación al carrito
   - **Given** un producto activo con stock > 0 y sin variaciones
   - **When** el visitante hace clic en "Agregar al carrito"
   - **Then** el producto aparece en el carrito con cantidad 1 y el ícono del carrito muestra el contador actualizado

2. **Scenario**: Agregar producto con variación al carrito
   - **Given** un producto con variaciones disponibles
   - **When** el visitante selecciona una variación y hace clic en "Agregar al carrito"
   - **Then** el ítem en el carrito muestra el nombre del producto y la variación seleccionada

3. **Scenario**: Agregar set al carrito
   - **Given** un set activo con todos sus productos con stock disponible
   - **When** el visitante hace clic en "Agregar al carrito" en la ficha del set
   - **Then** el set se agrega como una unidad entera al carrito

4. **Scenario**: Modificar cantidad en carrito
   - **Given** el carrito tiene un producto con cantidad 1
   - **When** el visitante incrementa la cantidad a 2
   - **Then** el subtotal del ítem se actualiza y no se puede superar el stock disponible

5. **Scenario**: Eliminar ítem del carrito
   - **Given** el carrito tiene un ítem
   - **When** el visitante hace clic en eliminar
   - **Then** el ítem desaparece del carrito y el total se actualiza

6. **Scenario**: Persistencia del carrito
   - **Given** el visitante tiene ítems en el carrito
   - **When** navega a otra página del sitio
   - **Then** al volver al carrito los ítems siguen presentes

---

### User Story 3 — Checkout y confirmación de pedido (Priority: P1)

El visitante completa sus datos, ve el resumen del pedido con el total, revisa los datos bancarios para transferir, y es redirigido a WhatsApp para enviar el comprobante.

**Why this priority**: Es el flujo de conversión final del MVP.

**Independent Test**: Se puede testear con un carrito armado, completando el formulario y verificando el link de WhatsApp generado.

**Acceptance Scenarios**:

1. **Scenario**: Validación de stock al iniciar checkout
   - **Given** el carrito tiene ítems cargados
   - **When** el visitante hace clic en "Ir al checkout"
   - **Then** el sistema valida en tiempo real que todos los ítems siguen con stock disponible
   - **And** si hay un ítem sin stock, se muestra un modal "Stop Checkout" indicando qué ítem no está disponible y ofreciendo eliminarlo o cancelar

2. **Scenario**: Checkout con stock disponible
   - **Given** todos los ítems del carrito tienen stock
   - **When** el visitante accede al checkout
   - **Then** ve el resumen del pedido, el formulario de datos personales y los datos bancarios

3. **Scenario**: Formulario de datos del comprador
   - **Given** el visitante está en la pantalla de checkout
   - **When** completa nombre, email y teléfono y hace clic en "Confirmar pedido"
   - **Then** se crea el pedido en estado "pendiente_pago" en la base de datos
   - **And** se muestra la pantalla de confirmación con los datos bancarios y el link a WhatsApp

4. **Scenario**: Validación del formulario
   - **Given** el formulario de checkout está vacío
   - **When** el visitante intenta confirmar sin completar campos obligatorios
   - **Then** se muestran errores de validación en los campos faltantes

5. **Scenario**: Pantalla de confirmación y datos de transferencia
   - **Given** el pedido fue creado exitosamente
   - **When** se muestra la pantalla de confirmación
   - **Then** el visitante ve: número de pedido, resumen de ítems, total a transferir, datos bancarios (CBU/Alias/Titular/Banco) y disclaimer de envío
   - **And** hay un botón prominente "Enviar comprobante por WhatsApp" que abre un link con mensaje pre-armado incluyendo el número de pedido y el total

6. **Scenario**: Mensaje pre-armado de WhatsApp
   - **Given** el pedido fue confirmado
   - **When** el visitante hace clic en "Enviar comprobante por WhatsApp"
   - **Then** se abre WhatsApp con el número del negocio y un mensaje del tipo:
     *"Hola! Acabo de realizar el pedido #XXXX por $YY.YYY. Te envío el comprobante de la transferencia."*

7. **Scenario**: Disclaimer de envío visible
   - **Given** la pantalla de confirmación está visible
   - **Then** se muestra el texto: *"El envío se coordina por WhatsApp. Los tiempos de entrega son de 5 a 10 días hábiles y el costo se abona por separado según tu ubicación."*

---

### User Story 4 — Validación de stock al confirmar pedido (Priority: P1)

Antes de persistir el pedido en base de datos, el sistema valida que el stock siga disponible para evitar ventas duplicadas en caso de concurrencia.

**Why this priority**: Sin esto pueden existir ventas de productos ya agotados.

**Independent Test**: Simular dos compras simultáneas del mismo producto con stock=1.

**Acceptance Scenarios**:

1. **Scenario**: Stock agotado entre inicio y confirmación de checkout
   - **Given** el visitante está en la pantalla de checkout con el producto P (stock=1) en su carrito
   - **When** otro comprador confirma primero la compra de P (dejando stock=0)
   - **And** el primer visitante hace clic en "Confirmar pedido"
   - **Then** el sistema detecta el stock insuficiente antes de crear el pedido
   - **And** muestra un mensaje de error indicando el ítem sin stock y limpia ese ítem del carrito

---

### User Story 5 — Gestión de stock en backoffice (Priority: P2)

El admin puede ver y editar el stock de cada producto (y por variación si aplica) desde los formularios de gestión ya existentes.

**Why this priority**: El admin necesita actualizar stock manualmente tras confirmar una venta por WhatsApp, y también al reponer mercadería.

**Independent Test**: Editar stock de un producto/variación y verificar que el catálogo refleja el cambio.

**Acceptance Scenarios**:

1. **Scenario**: Editar stock de producto sin variaciones
   - **Given** el admin está editando un producto sin variaciones
   - **When** modifica el campo stock y guarda
   - **Then** el stock del producto se actualiza y el catálogo refleja la disponibilidad correcta

2. **Scenario**: Editar stock por variación
   - **Given** el admin está editando un producto con variaciones
   - **When** modifica el stock de cada variación individualmente y guarda
   - **Then** cada variación refleja su propio stock en la ficha del producto

---

### User Story 6 — Listado de pedidos en backoffice (Priority: P2)

El admin puede ver todos los pedidos recibidos, con datos del comprador, ítems, total y estado. Puede actualizar el estado de cada pedido.

**Why this priority**: Necesario para el seguimiento operativo del negocio.

**Independent Test**: Crear un pedido como visitante y verificar que aparece en el backoffice.

**Acceptance Scenarios**:

1. **Scenario**: Ver listado de pedidos
   - **Given** el admin está en `/admin/pedidos`
   - **Then** ve una tabla con los pedidos ordenados por fecha descendente, con columnas: número de pedido, fecha, comprador (nombre + email), total, estado

2. **Scenario**: Ver detalle de un pedido
   - **Given** el admin hace clic en un pedido
   - **Then** ve el detalle con los ítems comprados (nombre, variación si aplica, cantidad, precio unitario), datos del comprador y estado actual

3. **Scenario**: Actualizar estado de pedido
   - **Given** el admin está en el detalle de un pedido
   - **When** cambia el estado manualmente según el avance real de la venta
   - **Then** el estado se actualiza y es visible en el listado

   Estados del pedido (transición manual por el admin):
   - `pendiente_pago` → creado automáticamente al confirmar el pedido
   - `pago_confirmado` → admin verifica el comprobante recibido por WhatsApp
   - `enviado` → pedido despachado con empresa de correo
   - `entregado` → entrega confirmada
   - `cancelado` → cancelable en cualquier punto del flujo

---

### Edge Cases

- ¿Qué pasa si el visitante tiene stock=1 en el carrito e intenta poner cantidad=2? → El sistema limita la cantidad al stock disponible.
- ¿Qué pasa si el carrito queda en localStorage y el producto se desactiva? → Al entrar al checkout se valida disponibilidad; ítems inactivos se muestran con error.
- ¿Set con un ítem marcado como regalo (`is_gift=true`) sin stock? → El set igual requiere stock para los ítems regalo.
- ¿Carrito vacío al intentar ir a checkout? → El botón de checkout está deshabilitado o redirige al catálogo.
- ¿Qué pasa con el pedido si el visitante cierra la pestaña después de confirmar pero antes de ir a WhatsApp? → El pedido ya existe en DB en estado `pendiente_pago`; el admin lo ve en el backoffice.

## Out of Scope

- Integración con Mercado Pago u otro medio de pago online (MVP3).
- Cálculo automático del costo de envío (MVP3).
- Login o registro de compradores (MVP3).
- Seguimiento de envío integrado (MVP3).
- Notificaciones automáticas por email al comprador (MVP3).
- Sistema de cupones o descuentos.
- Devoluciones o reembolsos.
- Seguimiento de pedidos para el comprador: sin cuenta no hay forma de autenticar al comprador. En MVP2 el seguimiento es únicamente por WhatsApp. En MVP3, con email del comprador capturado, se puede enviar notificaciones de estado por mail.

## Requirements *(mandatory)*

### Functional Requirements

**Stock:**
- **FR-001**: El stock de un producto SIN variaciones se gestiona con un campo `stock` entero en el producto.
- **FR-002**: El stock de un producto CON variaciones se gestiona individualmente por variación; el stock del producto padre no aplica.
- **FR-003**: El stock de un set se considera disponible únicamente si TODOS sus items tienen stock ≥ la cantidad requerida.
- **FR-004**: Los productos/sets sin stock DEBEN mostrarse en el catálogo con imagen grisada y badge "Sin stock".
- **FR-005**: No DEBE ser posible agregar al carrito un ítem sin stock.
- **FR-006**: El sistema DEBE restar stock automáticamente al confirmar un pedido (con validación previa de disponibilidad). Para sets, el descuento se aplica al stock de cada producto componente (nunca al set mismo).

**Carrito:**
- **FR-007**: El carrito DEBE persistir en `localStorage` del navegador.
- **FR-008**: El carrito DEBE soportar productos (con o sin variación) y sets como ítems.
- **FR-009**: La cantidad de un ítem no PUEDE superar el stock disponible.
- **FR-010**: El total del carrito DEBE calcularse en tiempo real sumando precio × cantidad de cada ítem.

**Checkout:**
- **FR-011**: El sistema DEBE validar disponibilidad de stock al iniciar el checkout (antes de mostrar el formulario).
- **FR-012**: El sistema DEBE validar disponibilidad de stock al confirmar el pedido (antes de persistirlo), para prevenir race conditions.
- **FR-013**: El formulario de checkout DEBE requerir: nombre completo, email y teléfono.
- **FR-014**: Al confirmar el pedido, DEBE crearse un registro de `Order` en estado `pendiente_pago` con todos los datos del comprador e ítems.
- **FR-015**: La pantalla de confirmación DEBE mostrar los datos bancarios para transferencia y el disclaimer de envío.
- **FR-015b**: Los datos bancarios (CBU, alias, titular, banco) DEBEN ser editables por el admin desde el backoffice, sin requerir cambios en el código.
- **FR-016**: El disclaimer de envío DEBE ser fácilmente configurable (texto centralizado en una constante o tabla de configuración, no duplicado en múltiples lugares).
- **FR-017**: El botón de WhatsApp DEBE generar un link `wa.me/{número}?text={mensaje_prearmado}` con número de pedido y total.

**Backoffice:**
- **FR-018**: El admin DEBE poder ver y editar el stock de cada producto (y por variación) desde los formularios existentes.
- **FR-019**: El admin DEBE poder ver el listado de pedidos en `/admin/pedidos` ordenados por fecha descendente.
- **FR-020**: El admin DEBE poder ver el detalle de cada pedido.
- **FR-021**: El admin DEBE poder actualizar el estado de un pedido.

### Key Entities

- **Order**: Pedido generado por un comprador. Atributos: id, número de pedido (legible), nombre/email/teléfono del comprador, estado (`pendiente_pago` | `pago_confirmado` | `enviado` | `entregado` | `cancelado`), total, created_at.
- **OrderItem**: Ítem dentro de un pedido. Atributos: id, order_id, tipo (producto/set), product_id o set_id, variation_id (opcional), cantidad, precio_unitario (snapshot al momento de la compra).
- **ProductVariation** (extensión): Agregar campo `stock` entero a la variación existente.
- **ShopConfig**: Tabla de configuración del negocio. Atributos: clave (string único), valor (string). Usada para datos bancarios (CBU, alias, titular, banco) y disclaimer de envío.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante puede agregar al menos un producto y un set al carrito en menos de 3 clics.
- **SC-002**: El checkout completo (desde carrito hasta pantalla de confirmación) se completa en menos de 5 pasos.
- **SC-003**: Los productos sin stock NO aparecen con el botón "Agregar al carrito" habilitado en ninguna vista.
- **SC-004**: El admin puede ver todos los pedidos recibidos desde `/admin/pedidos` con estado actualizable.
- **SC-005**: La validación de stock al confirmar el pedido previene la venta de un mismo ítem con stock=1 a dos compradores concurrentes.
- **SC-006**: El link de WhatsApp se genera correctamente con número de pedido y total en el mensaje pre-armado.
