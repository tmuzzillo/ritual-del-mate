# Feature Specification: Mejoras de Imágenes de Productos

**Created**: 2026-03-15

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Eliminar imagen incorrecta desde admin (Priority: P1)
El admin puede eliminar una imagen que subió por error sin que queden archivos huérfanos en Supabase Storage.

**Why this priority**: Actualmente no existe forma de limpiar imágenes mal subidas. El admin queda atrapado con archivos inútiles ocupando espacio y clientes confundidos viendo fotos incorrectas.

**Independent Test**: Admin sube una imagen, hace clic en el botón X, y verifica que el archivo desaparece tanto de la UI como del Storage de Supabase.

**Acceptance Scenarios**:
1. **Scenario**: Admin elimina una imagen de un producto activo
   - **Given** El admin está editando un producto con 3 imágenes
   - **When** Hace clic en el botón X de una imagen
   - **Then** La imagen se quita de la lista, la foto desaparece del formulario, y el archivo se elimina del bucket `images` en Supabase Storage

2. **Scenario**: Admin elimina la última imagen (pero no publica)
   - **Given** El admin tiene un producto con 1 sola imagen (inactivo)
   - **When** Hace clic en X para eliminar esa imagen y luego intenta guardarlo
   - **Then** El producto se guarda sin imágenes (es válido para borradores)

3. **Scenario**: Admin intenta eliminar imagen mientras se carga
   - **Given** El admin hace clic en X durante una subida
   - **When** Intenta eliminar otra imagen en el mismo ciclo
   - **Then** El botón X está deshabilitado o muestra una UI indicando que está en proceso

---

### User Story 2 - Aumentar límite de imágenes a 7 (Priority: P2)
El admin puede subir hasta 7 imágenes por producto (antes eran 5) para mostrar más variaciones o ángulos del producto.

**Why this priority**: Los productos son artesanales y benefician de múltiples vistas. 5 imágenes es poco restrictivo y frustrante; 7 es razonable sin exceso.

**Independent Test**: Admin sube 7 imágenes a un producto, ve que se deshabilita el botón de agregar, intenta subir la 8ª y no puede.

**Acceptance Scenarios**:
1. **Scenario**: Admin sube 6 imágenes, intenta agregar la 7ª
   - **Given** El formulario de un producto tiene 6 imágenes
   - **When** El admin hace clic en "Agregar imagen" y sube una más
   - **Then** Se agrega exitosamente, ahora hay 7 imágenes, y el botón "Agregar" se deshabilita

2. **Scenario**: Admin intenta superar el límite
   - **Given** El producto tiene 7 imágenes
   - **When** El admin intenta seleccionar una 8ª imagen
   - **Then** El input de archivo no se abre, o si se abre, solo acepta hasta completar a 7 (slice automático de archivos extra)

3. **Scenario**: El aviso de límite es claro
   - **Given** El producto tiene 7 imágenes
   - **When** El admin mira el formulario
   - **Then** Ve un texto pequeño indicando "Máximo 7 imágenes" y el botón "Agregar" está oculto

---

### User Story 3 - Mostrar imágenes sin recorte (object-contain) (Priority: P2)
Las imágenes se muestran completas sin recortar, respetando su relación de aspecto original.

**Why this priority**: Muchos productos no son cuadrados. Las fotos actuales se recortan a 1:1 (object-cover), ocultando partes importantes. Usar object-contain respeta la foto original.

**Independent Test**: Admin sube una foto rectangular (ej: 4:3), publica el producto, visita el storefront, y ve la foto completa sin recorte.

**Acceptance Scenarios**:
1. **Scenario**: Galería de detalle con imagen rectangular
   - **Given** Un producto tiene una imagen 4:3 (horizontal)
   - **When** El usuario abre `/producto/[slug]`
   - **Then** La imagen se muestra completa, sin cortes, con bandas crema arriba/abajo si es necesario

2. **Scenario**: Card de producto con imagen vertical
   - **Given** Un producto tiene una imagen 2:3 (vertical, como una foto de celular)
   - **When** El usuario ve el catálogo `/catalogo` en grid
   - **Then** La imagen se muestra completa dentro de su tarjeta, sin recorte

3. **Scenario**: Thumbnails en galería con fotos de distinto aspecto
   - **Given** Un producto tiene 3 imágenes: una 1:1, otra 4:3, otra 2:3
   - **When** El usuario abre el detalle y ve los thumbnails
   - **Then** Cada thumbnail respeta su aspecto original, sin distorsión ni recorte

4. **Scenario**: Set detail también muestra imágenes sin recorte
   - **Given** Un set tiene imágenes rectangulares
   - **When** El usuario abre `/set/[slug]`
   - **Then** La galería del set muestra las imágenes completas con object-contain

---

### Edge Cases
- **Borrado mientras se sube**: El X está deshabilitado si hay subida en progreso.
- **URL de imagen inválida o con caracteres especiales**: El path se extrae correctamente y se borra sin error.
- **Imagen eliminada manualmente en Storage**: Si el archivo no existe, el error de Supabase se captura gracefully.
- **Fotos de relación extrema** (ej: 10:1 panorama): Se muestran completas; el contenedor crema se adapta.

## Out of Scope
- Reorden de imágenes (drag & drop)
- Galería lightbox en storefront
- Recorte o edición de imágenes (crop, filter)
- Compresión automática
- Marca de agua
- CDN externo (CloudFlare, imgix)
- Historial de versiones de imagen
- Watermark de "producto" en la UI

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: El admin puede eliminar una imagen haciendo clic en el botón X sin dejar archivos huérfanos en Supabase Storage
- **FR-002**: Al eliminar, el cliente Supabase `storage.from('images').remove([path])` se ejecuta exitosamente
- **FR-003**: El error de eliminación se muestra al admin con un mensaje claro
- **FR-004**: El límite de imágenes por entidad (producto, set, colección) es 7
- **FR-005**: El botón "Agregar imagen" se deshabilita cuando se alcanza el límite de 7
- **FR-006**: El sistema rechaza silenciosamente archivos extras si el usuario intenta subir más de 7 (slice to maxImages)
- **FR-007**: Las imágenes en la galería de detalle usan `object-contain` (no `object-cover`)
- **FR-008**: Las imágenes en cards de productos/sets usan `object-contain` (no `object-cover`)
- **FR-009**: El contenedor de imagen tiene fondo `bg-brand-cream` para rellenar espacios vacíos de object-contain
- **FR-010**: Thumbnails en la galería también usan `object-contain` + fondo crema

### Key Entities
- **ImageUploader component**: folder (string), images (string[]), onChange, maxImages (default 7)
- **ImageGallery component**: images (string[]), name (string)
- **ProductCard, SetCard**: images (first image as cover)

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: El admin puede eliminar una imagen en < 2 segundos y el archivo desaparece de Storage
- **SC-002**: Todas las imágenes se muestran sin recorte en `/producto/[slug]` y `/catalogo`
- **SC-003**: Una foto 4:3 cabe completa en la galería con margen crema visible
- **SC-004**: Una foto 2:3 (vertical) cabe completa en las cards sin distorsionarse
- **SC-005**: El botón X se deshabilita durante un borrado (UX clara)
- **SC-006**: No hay archivos huérfanos en Storage después de eliminar imágenes
- **SC-007**: El límite de 7 se respeta y es visible en el UI del admin
