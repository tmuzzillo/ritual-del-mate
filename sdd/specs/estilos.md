# Spec: Estilos y Sistema de Diseño

**Feature:** Estilos y Sistema de Diseño
**Creado:** 2026-02-28
**Estado:** Draft
**Owner:** [A definir]

---

## Contexto

Ritual del Mate es un e-commerce de accesorios artesanales para mate, fabricados en cerámica, madera, metal y tela. La marca se dirige principalmente a mujeres interesadas en productos artesanales y hechos a mano.

**Público objetivo:** Mujeres adultas, 25-55 años, con sensibilidad por el diseño artesanal, lo handmade, y la calidad
**Tono de voz:** Cálido, personal, accesible. Como una pequeña marca local de confianza, no un gran retailer corporativo
**Canales principales:** Instagram (mobile-first)

---

## Escenarios de Experiencia Visual

### Escenario 1: Visitante percibe identidad artesanal (P1)

**Descripción:** Un visitante que llega desde Instagram percibe inmediatamente que se trata de una marca artesanal, cálida y personal, no corporativa ni fría.

#### Dado
- El visitante accede al sitio desde un enlace en Instagram
- Es su primer contacto con la marca
- Visualiza en mobile

#### Cuando
- Carga la página de inicio
- Observa la paleta de colores, tipografía y composición visual

#### Entonces
- Los tonos cálidos (crema/hueso, naranja, tierra) comunican calidez y artesanía
- No hay colores fríos o corporativos (grises metálicos, azules, blanco puro)
- Las texturas e imágenes reflejan lo handmade
- El layout respira espacio y no se siente abrumador
- **AC-001:** La paleta de colores es consistente en todas las vistas públicas

---

### Escenario 2: Experiencia mobile-first desde Instagram (P1)

**Descripción:** El sitio está optimizado para ser descubierto y navegado desde mobile, reflejando que la mayoría del tráfico proviene de Instagram.

#### Dado
- El visitante está en un teléfono (375px o superior)
- Accede desde un link en Instagram
- Tiene conexión móvil

#### Cuando
- Navega entre páginas (home, categorías, detalle de producto, carrito)
- Desliza el contenido verticalmente
- Intenta ver imágenes y leer texto

#### Entonces
- No hay scroll horizontal
- Las imágenes de producto se ven bien sin zoom
- El texto es legible sin agrandar (mínimo 16px en inputs, 14px en body)
- Los botones son fáciles de tocar (mínimo 44x44px)
- Las tarjetas de producto muestran imagen, nombre y precio sin sobrecarga
- **AC-002:** Render correcto en 375px sin scroll horizontal
- **AC-003:** Todos los elementos interactivos cumplen mínimos de touch targets (44x44px)

---

### Escenario 3: Legibilidad y accesibilidad (P2)

**Descripción:** El sitio cumple estándares de accesibilidad WCAG AA, especialmente en contraste de colores y legibilidad de texto.

#### Dado
- El visitante tiene baja visión o es daltónico
- Usa un lector de pantalla
- Lee texto sobre fondos de color

#### Cuando
- Interactúa con botones y enlaces
- Lee descripciones de producto
- Usa funciones como zoom o contraste alto del navegador

#### Entonces
- Todos los textos cumplen contraste mínimo WCAG AA (4.5:1 para body, 3:1 para large text)
- Los enlaces tienen underline o distintivo visual (no solo color)
- No hay información transmitida solo por color
- El site es navegable por teclado
- Las imágenes tienen alt text descriptivo
- **AC-004:** Ratio de contraste ≥ 4.5:1 en textos pequeños
- **AC-005:** Todos los enlaces tienen indicador visual además de color

---

### Escenario 4: Consistencia visual en el backoffice admin (P3)

**Descripción:** El panel administrativo mantiene coherencia visual con el público pero es funcional y limpio, permitiendo que el equipo gestione productos y órdenes sin fricciones.

#### Dado
- Un admin accede al backoffice
- Necesita listar productos, editar, crear órdenes
- El interfaz es solo para uso interno

#### Cuando
- Carga el dashboard
- Navega tablas y formularios
- Usa filtros y búsqueda

#### Entonces
- El diseño es limpio y funcional
- Prioriza claridad sobre artesanía (puede usar neutrales, no necesita la calidez del público)
- Es consistente con el sistema de componentes del sitio público
- Los formularios son accesibles y rápidos de usar
- **AC-006:** Todos los campos de formulario tienen labels y validación clara
- **AC-007:** Las tablas son legibles y responsive

---

### Casos Edge

#### Imágenes con aspect ratios variables en grillas de productos
- Las tarjetas de producto deben acomodarse a imágenes de distintas proporciones
- Se aplicará `object-fit: cover` con altura constante
- Los lazy-load placeholders serán tonos neutros (crema/hueso)

#### Productos sin imagen (placeholder)
- Se mostrará un placeholder consistente con la paleta artesanal
- El placeholder no será genérico; tendrá textura o patrón sutil
- Incluirá icono de placeholders (de Lucide) en tonos terciarios

#### Nombres de producto largos con wrapping
- El nombre se truncará a 2 líneas máximo en tarjetas
- El título completo será visible en hover/detalle
- En mobile, el texto se ajustará sin provocar distorsión

---

## Out of Scope

- **Dark mode:** No es requerimiento inicial. Puede agregarse en futuras iteraciones.
- **Animaciones/transiciones:** No están incluidas en esta fase. Las micrinter acciones se definirán en un spec separado si es necesario.
- **Activos de marca exactos:** Logo, tipografías específicas y códigos hex finales serán provistos por el owner en sesión futura.

---

## Requerimientos

### Tokens de Diseño (Valores finales pendientes)

#### Colores

| Token | Dirección | Notas | Estado |
|-------|-----------|-------|--------|
| `color-background-primary` | Tono crema/hueso cálido | Fondo principal, evita blanco puro | [PENDING ASSETS] |
| `color-background-secondary` | Tono crema más claro | Para secciones, cards, contraste suave | [PENDING ASSETS] |
| `color-accent-primary` | Naranja cálido | Botones principales, destacados, CTA | [PENDING ASSETS] |
| `color-accent-secondary` | Marrón tierra | Secundario, bordes, detalles | [PENDING ASSETS] |
| `color-accent-tertiary` | Verde tierra/sage | Detalles, badges, acentos mínimos | [PENDING ASSETS] |
| `color-text-primary` | Marrón oscuro o charcoal | Cuerpo de texto, nunca negro puro | [PENDING ASSETS] |
| `color-text-secondary` | Marrón medio | Subtítulos, metadata, menor énfasis | [PENDING ASSETS] |
| `color-text-inverse` | Claro (crema/blanco) | Texto sobre colores oscuros | [PENDING ASSETS] |
| `color-border` | Neutro cálido | Bordes, líneas divisorias | [PENDING ASSETS] |
| `color-success` | Verde (diferenciado del tertiary) | Mensajes de éxito, confirmaciones | [PENDING ASSETS] |
| `color-error` | Rojo terracota (no neón) | Mensajes de error, alertas | [PENDING ASSETS] |
| `color-warning` | Ocre/amarillo tierra | Advertencias | [PENDING ASSETS] |

**Colores a evitar:**
- Grises fríos o metálicos
- Blanco puro como fondo
- Colores neón o muy saturados
- Azules corporativos

#### Tipografía

| Token | Uso | Dirección | Status |
|-------|-----|-----------|--------|
| `font-family-heading` | Titulares (H1-H3) | Tipografía artesanal, legible, cálida | [PENDING ASSETS] |
| `font-family-body` | Cuerpo de texto | Legible en pantalla, confortable de leer | [PENDING ASSETS] |
| `font-size-h1` | Títulos principales | ~32-48px (mobile/desktop) | [PENDING ASSETS] |
| `font-size-h2` | Subtítulos | ~24-32px | [PENDING ASSETS] |
| `font-size-h3` | Títulos de sección | ~18-24px | [PENDING ASSETS] |
| `font-size-body` | Párrafos | 14-16px (mínimo 16px en inputs) | [PENDING ASSETS] |
| `font-size-small` | Metadata, labels | 12-14px | [PENDING ASSETS] |
| `font-weight-regular` | Texto normal | 400 | [PENDING ASSETS] |
| `font-weight-medium` | Énfasis | 500 o 600 | [PENDING ASSETS] |
| `font-weight-bold` | Énfasis fuerte | 700 | [PENDING ASSETS] |

**Directrices:**
- Legibilidad sobre decoración
- Jerarquía clara entre niveles
- Línea de base generosa (line-height 1.5-1.6 para body)

#### Border Radius

| Token | Aplicación | Dirección |
|-------|-----------|-----------|
| `radius-none` | Elementos sharp (raras excepciones) | 0px |
| `radius-small` | Inputs, pequeños elementos | 4-6px (suavemente redondeado) |
| `radius-medium` | Cards, botones | 8-12px (redondeado pero no extremo) |
| `radius-large` | Componentes especiales | 16-24px (orgánico, artesanal) |

**Dirección:** Preferencia por bordes suavemente redondeados que comuniquen calidez sin perder modernidad. Evitar bordes excesivamente redondeados.

#### Espaciado

Escala de espaciado base 4px (Tailwind default):

| Token | Valor | Uso |
|-------|-------|-----|
| `space-xs` | 4px | Espacios mínimos entre elementos |
| `space-sm` | 8px | Padding pequeño, gaps internos |
| `space-md` | 16px | Padding estándar, separación de secciones |
| `space-lg` | 24px | Separación entre bloques principales |
| `space-xl` | 32px | Márgenes de secciones grandes |
| `space-2xl` | 48px+ | Espacios generosos entre secciones |

**Dirección:** Respira. El espacio en blanco comunica lujo y artesanía. No saturar.

---

### Guías de Estilo de Componentes

#### ProductCard
- **Composición:** Imagen (arriba, 100% ancho, altura fija ~250px), nombre (2 líneas máx), precio, botón agregar al carrito
- **Estilo:** Fondo `background-secondary`, bordes suave redondeado (`radius-medium`), sombra mínima
- **Interacción:** Hover eleva la card ligeramente (1-2px) y oscurece la sombra
- **Tipografía:** Nombre en heading, precio en body bold, subtle metadata (ej: "Cerámica hecha a mano")
- **Contraste:** Nombre y precio en `text-primary` para máxima legibilidad

#### Botones
- **Primario:** Fondo `accent-primary` (naranja), texto claro, `radius-medium` redondeado
- **Secundario:** Borde `accent-secondary` (marrón), texto `text-primary`, fondo transparente
- **Tamaño:** Padding generoso (12-16px), altura mínima 44px para touch targets
- **Estado:**
  - Normal: colores definidos
  - Hover: ligeramente más saturado o sombra
  - Active: más oscuro
  - Disabled: opacidad 50%, cursor not-allowed

#### Navegación
- **Estilo:** Minimal, horizontal en desktop, hamburger en mobile
- **Fondo:** `background-primary` (sutil, mismo que página) o ligeramente contrastado
- **Enlaces:** `text-primary`, underline on hover, sin subrayado en reposo
- **Icono de hamburger:** Lucide, color `text-primary`

#### Formularios (público y admin)
- **Labels:** Siempre visibles, encima del input, tipografía `font-size-small`, color `text-primary`
- **Inputs:**
  - Borde `color-border`, `radius-small`
  - Padding generoso (12px)
  - Foco: borde `accent-primary`, sin outline default
  - Placeholder: `text-secondary`, más claro
- **Validación:** Mensajes de error en `color-error`, exitosa en `color-success`
- **Accesibilidad:** Nunca solo color; incluir texto de error/éxito

#### Backoffice Admin
- **Tabla:** Bordes sutiles, alternancia de filas (muy sutil en `background-secondary`)
- **Botones de acción:** Primarios en naranja, destructivos en rojo terracota
- **Formularios:** Idénticos a public, claridad primero
- **Colores:** Puede usar neutrales puros si mejora la claridad (no debe parecer artesanal)

---

### Guías de Copy y Tono

#### Voz y Tono
- **Cálido y personal:** "Descubrí nuestra colección" (no "Ver productos")
- **Accesible:** Explicar sin ser condescendiente
- **Artesanal:** Contar historias de cómo se hacen ("Hecho a mano en el taller")
- **Argentino:** Usar voseo, lenguaje cotidiano, nunca corporativo

#### Ejemplos de Copy
- **CTA primario:** "Agregá al carrito" (no "Add to cart" ni "Comprar ahora")
- **Error:** "Ups, algo pasó. Intentá de nuevo" (no "Error 404")
- **Éxito:** "Se agregó a tu carrito" (no "Item added")
- **Descripción de producto:** "Mate de cerámica vidriada, hecho a mano en Córdoba" (contar historia)

---

## Criterios de Éxito

| Código | Criterio | Medida |
|--------|----------|--------|
| **SC-001** | Un visitante desde Instagram percibe identidad artesanal inmediatamente | Review cualitativo con usuarios potenciales; presencia de colores cálidos, sin elementos corporativos |
| **SC-002** | La paleta de colores es cohesiva y consistente en todas las páginas públicas | Auditoría visual; todos los elementos usan tokens definidos |
| **SC-003** | Todos los textos cumplen contraste WCAG AA mínimo | Herramienta de verificación de contraste (axe, WAVE); ratio ≥ 4.5:1 para body, ≥ 3:1 para large text |
| **SC-004** | Layout renderiza correctamente en mobile (375px+) sin scroll horizontal | Testing en emulador y dispositivos reales |
| **SC-005** | La experiencia desde Instagram es fluida y carga rápido | Time to interactive < 3s en 4G, optimización de imágenes |
| **SC-006** | Componentes admin son funcionales y rápidos de usar | Testing con equipo interno, feedback de usabilidad |

---

## Notas Técnicas

### Stack Tecnológico
- **Framework:** Next.js 16
- **Estilos:** Tailwind CSS v4
- **Componentes:** shadcn/ui (estilo: new-york, color base: neutral)
- **Iconos:** Lucide icons
- **Componentes personalizados:** Se crearán sobre la base de shadcn/ui, personalizando tokens y estilos con Tailwind

### Implementación
- Los tokens de diseño se almacenarán en `tailwind.config.ts` como extensión de theme
- Los componentes se personalizarán en `app/ui/` o similar
- Se utilizará CSS classes de Tailwind primariamente, fallback a CSS custom properties si es necesario
- Las variables de color se aplicarán a nivel de shadcn config y Tailwind

---

## Próximos Pasos

1. **Owner provee activos pendientes:**
   - Logo en formato SVG y PNG
   - Paleta de colores exacta (codes hex)
   - Tipografías seleccionadas (Google Fonts, Premium, etc.)

2. **Design Review:**
   - Validar colores y tipografía con usuario final
   - Testear contraste y accesibilidad

3. **Implementación (Fase 4):**
   - Configurar Tailwind con tokens exactos
   - Personalizar shadcn/ui components
   - Implementar homepage y catálogo

4. **QA Visual:**
   - Testing en múltiples navegadores y dispositivos
   - Validación WCAG AA completa

---

## ⚠️ Activos Pendientes

**El owner proveerá en sesión futura:**
- Logo de marca (SVG, PNG, variantes)
- Paleta de colores exacta (códigos hex de al menos: primario, secundario, terciario, fondos, textos)
- Tipografía principal y secundaria (fuente, pesos, tamaños)

**Esta spec debe actualizarse con esos valores exactos antes de iniciar la implementación del storefront (Fase 4).**

---

**Versión:** 1.0 (Draft)
**Última actualización:** 2026-02-28
