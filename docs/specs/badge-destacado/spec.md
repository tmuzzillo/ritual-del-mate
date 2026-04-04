# Spec Funcional: Badge Destacado en Cards

## Descripción

Permitir que el admin agregue un texto corto de destaque opcional a cada producto y set. Este texto se muestra como una pill superpuesta en la imagen de la card en el storefront, visible en el catálogo, la grilla de sets y las colecciones.

Ejemplos reales de uso:
- "Ahorra 15% comprando el set"
- "Incluye yerba orgánica de regalo"
- "Ideal para llevar"
- "Edición limitada"

## Actores

- **Admin**: configura el texto de destaque desde el backoffice, al crear o editar un producto/set.
- **Visitante anónimo**: ve el badge en las cards del storefront (sin interacción).

## Comportamiento funcional

### Admin

1. En el formulario de edición/creación de un **producto**, hay un campo opcional "Texto destacado" (input de texto libre, máximo 50 caracteres).
2. En el formulario de edición/creación de un **set**, idem.
3. Si el campo está vacío, no se muestra ningún badge en el storefront.
4. El admin puede borrar el badge en cualquier momento dejando el campo vacío.

### Storefront

1. En cada card que tenga `badge_text` no nulo y no vacío, se muestra una pill de texto superpuesta en la esquina superior izquierda de la imagen.
2. El badge aparece en todas las superficies donde se muestran cards:
   - `/catalogo` (ProductCard)
   - `/sets` (SetCard)
   - Carousel de sets en el home
   - Cards dentro de una colección (`/colecciones/[slug]`)
3. El badge NO aparece en las páginas de detalle (producto o set).
4. El badge es puramente informativo, no es clickeable.

## Diseño visual

- Pill con fondo terracota semitransparente o sólido, texto blanco, bordes redondeados.
- Posición: esquina superior izquierda de la imagen, con padding interno.
- Fuente pequeña (text-xs), no supera 2 líneas.
- Si el texto es muy largo (>50 chars), se trunca con `…`.

## Casos borde

- Si un producto o set tiene `badge_text = null` o `""`, no se renderiza nada (sin espacio vacío).
- El campo no es obligatorio: la mayoría de los productos no tendrán badge.
- El badge no tiene lógica de negocio (no calcula descuentos, solo muestra el texto que ingresó el admin).
