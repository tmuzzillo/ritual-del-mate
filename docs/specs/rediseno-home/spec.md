# Spec Funcional: Rediseño Home — Ritual del Mate

**Feature**: `rediseno-home`
**Fecha**: 2026-04-02
**Scope**: Únicamente la página `/` (home pública). Catálogo, sets, colecciones y producto quedan para un feature separado.

---

## Contexto del negocio

La home es el primer punto de contacto para usuarios que llegan desde Instagram. El diseño actual no refleja la identidad visual de la marca y no establece una jerarquía de navegación clara. Este rediseño busca:

1. **Identidad**: Alinear la home con el brand system oficial (paleta, tipografía, logo).
2. **Pertenencia**: Generar en el visitante una conexión emocional con la marca desde el primer scroll.
3. **Conversión**: Guiar al usuario por el flujo Colecciones → Sets → Productos, priorizando la venta de sets sobre productos individuales.
4. **Experiencia**: Incorporar animaciones fluidas que acompañen el scroll y hagan la navegación más expresiva.

---

## User Stories

### US-1 — Visitante llega desde Instagram y entiende la marca (P1)

**Scenario**: Primer contacto con la home
- **Given** Un visitante abre la home desde el link de bio de Instagram
- **When** La página carga
- **Then** Ve el logo de Ritual del Mate, la frase "Rituales que hablan de vos" y la subfrase "Tu momento matero de cada día merece ser elegido con intención." antes de hacer scroll
- **And** El logo, título y subfrase aparecen con una animación de entrada suave

### US-2 — Visitante descubre las colecciones y su significado (P1)

**Scenario**: Sección de colecciones
- **Given** El visitante hace scroll desde el hero
- **When** Llega a la sección de colecciones
- **Then** Ve 3 cards grandes (Calma, Fuerza, Expresión) cada una con su imagen de portada, su nombre y su frase descriptiva
- **And** Las cards aparecen con animación escalonada al entrar en viewport
- **And** Al hacer clic en una card navega a `/colecciones/[slug]`

**Frases por colección:**
- Calma → "Tu forma de bajar el ritmo"
- Fuerza → "Tu manera de plantarte"
- Expresión → "Tu identidad visible"

### US-3 — Visitante descubre sets desde la home (P1)

**Scenario**: Carrusel de sets
- **Given** El visitante continúa haciendo scroll
- **When** Llega a la sección "Los más elegidos"
- **Then** Ve un carrusel horizontal con hasta 6 sets destacados
- **And** Puede deslizar el carrusel horizontalmente (drag en desktop, swipe en mobile)
- **And** Hay un CTA "Ver todos los sets →" que lleva a `/sets`

### US-4 — Visitante ve productos y accede al catálogo (P2)

**Scenario**: Sección de productos
- **Given** El visitante llega a la sección de productos
- **When** La sección entra en viewport
- **Then** Ve hasta 4 productos destacados en grilla
- **And** Hay un CTA "Ver catálogo completo →" que lleva a `/catalogo`

### US-5 — Visitante llega al cierre emocional de marca (P2)

**Scenario**: Sección de marca al final del scroll
- **Given** El visitante llegó al fondo de la página
- **When** Ve la sección de marca
- **Then** Ve una sección con fondo oscuro, la historia del emprendimiento y el texto de cierre:
  "Gracias por elegir Ritual del Mate. Cada pieza fue elegida con intención para quienes valoran la belleza en los detalles y transforman lo cotidiano en ritual. Que esto que hoy llega a tus manos sea tu pausa, tu calma y ese momento que volvés a vos."
- **And** No hay CTAs — es un cierre emocional

---

## Requisitos funcionales

- **RF-001**: La home muestra 5 secciones en orden: Hero, Colecciones, Sets, Productos, Marca.
- **RF-002**: El CTA del hero hace scroll suave hacia la sección de colecciones (sin cambio de ruta).
- **RF-003**: La sección de colecciones muestra exactamente las 3 colecciones activas con su tagline.
- **RF-004**: Si una colección no tiene imagen de portada, la card muestra un fondo de color sólido de la paleta.
- **RF-005**: El carrusel de sets muestra hasta 6 sets con `featured = true`.
- **RF-006**: Si hay 0 sets featured, la sección de sets no se renderiza.
- **RF-007**: La sección de productos muestra hasta 4 productos con `featured = true`.
- **RF-008**: Si hay 0 productos featured, la sección de productos no se renderiza.
- **RF-009**: Todas las secciones excepto el hero tienen animación de entrada al hacer scroll.
- **RF-010**: La animación del hero se ejecuta al cargar la página (no requiere scroll).
- **RF-011**: El logo del navbar se muestra como imagen (logo-blob.png), no como texto.
- **RF-012**: La tipografía de todo el sitio cambia a Montserrat.
- **RF-013**: La paleta de colores del sitio se actualiza a los tokens oficiales de marca.

---

## Requisitos no funcionales

- **RNF-001**: Las animaciones no deben bloquear el render ni afectar el LCP (Largest Contentful Paint).
- **RNF-002**: El carrusel de sets debe ser usable en mobile (touch/swipe) y desktop (drag con mouse).
- **RNF-003**: La home debe ser funcional con JavaScript deshabilitado (las animaciones pueden no ejecutarse, pero el contenido debe ser visible).
- **RNF-004**: Build sin errores de TypeScript (`npm run build` exitoso).

---

## Diseño visual

### Paleta
| Token | Hex |
|---|---|
| `brand-cream` | `#EFEADF` |
| `brand-dark` | `#38331C` |
| `brand-olive` | `#7B7648` |
| `brand-brown` | `#6F563B` |
| `brand-golden` | `#D5B477` |
| `brand-orange` | `#BF7438` |
| `brand-sand` | `#D4C5B2` |

### Tipografía
- **Body / UI**: Montserrat (400, 500, 600, 700, 800)
- **Logo**: imagen PNG (Brownist no se usa como web font)

### Animaciones (Framer Motion)
- **Hero**: fade-in del logo (0s) → slide-up del H1 (0.2s) → slide-up subfrase (0.4s) → fade-in CTA (0.6s)
- **Secciones**: fade-in + translateY(30px→0) al entrar en viewport, threshold 0.2
- **Cards de colecciones**: stagger de 0.1s entre cards
- **Cards del carrusel**: slide-in horizontal al montar

---

## Out of scope

- Catálogo, sets, colecciones y producto: rediseño en feature separado
- Checkout, pagos, stock
- Campo tagline en el admin de colecciones (puede hacerse junto o separado)
- Dark mode
- Internacionalización
