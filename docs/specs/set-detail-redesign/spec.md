# Spec Funcional: Rediseño del Detalle de Set

## Descripción

Rediseño visual de la página `/set/[slug]` basado en los diseños de Stitch, manteniendo la paleta de marca existente. El objetivo es mejorar la jerarquía visual, facilitar la consulta y agregar contexto útil al visitante.

## Actores

- **Visitante anónimo**: navega el detalle de un set, ve la información y puede consultar por WhatsApp.

## Comportamiento funcional

### CTA de consulta

1. Se reemplaza el bloque de texto con link inline por un botón prominente full-width.
2. Al hacer click, se abre WhatsApp con un mensaje pre-cargado que incluye el nombre del set.
3. Abre en una nueva pestaña.
4. El mensaje pre-cargado es: "Hola! Me interesa el set '[nombre del set]' 🧉"

### Sección "También te podría gustar"

1. Debajo del layout principal (galería + info), aparece una sección con hasta 4 items relacionados.
2. Los items son una mezcla de hasta 2 sets activos (distintos al actual) y hasta 2 productos activos.
3. Cada item muestra: imagen, nombre y precio.
4. Al hacer click en un item, navega al detalle del set (`/set/[slug]`) o producto (`/producto/[slug]`) correspondiente.
5. Si no hay suficientes items en la DB, la sección muestra los que haya (puede ser 1, 2 o 3).
6. Si no hay ningún item relacionado disponible, la sección no se renderiza.

### Acordeones informativos

1. Debajo del botón de WhatsApp aparecen dos acordeones colapsables (cerrados por defecto).
2. **"Envíos y consultas"**: información estática sobre cómo hacer un pedido y envíos a todo el país.
3. **"Cuidados del producto"**: información estática sobre el cuidado de mates artesanales.
4. Solo uno puede estar abierto a la vez.

## Casos borde

- Si el set no tiene descripción, no se muestra el párrafo de descripción (sin espacio vacío).
- Si el set no tiene items activos en `set_items`, la sección "Detalles del Set" no se renderiza.
- Si no hay sets ni productos relacionados disponibles, la sección "También te podría gustar" no se renderiza.
