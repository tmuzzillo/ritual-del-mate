# Plan General de Ejecución — MVP 1

## Orden de implementación

```
Fase 0 — Infraestructura (base para todo)
  ├── DB: migración única con todas las tablas
  ├── Supabase Storage: bucket de imágenes
  └── Roles: login form + logout  ← spec: roles.md

Fase 1 — Admin: Categorías (sin dependencias)
  └── gestion-categorias

Fase 2 — Admin: Productos y Sets (en paralelo, dependen de categorías)
  ├── gestion-productos
  └── gestion-sets

Fase 3 — Admin: Colecciones (depende de productos y sets)
  └── gestion-colecciones

Fase 4 — Storefront público (en paralelo, dependen de datos cargados)
  ├── catalogo-publico
  ├── sets-publicos
  └── colecciones-publicas
```

---

## Fase 0 — Infraestructura

### Esquema de base de datos (migración única)

```sql
-- Tablas a crear en orden (respetando FKs)
categories
products          → FK: categories.id
sets              → FK: categories.id
set_items         → FK: sets.id, products.id
collections
collection_products → FK: collections.id, products.id
collection_sets     → FK: collections.id, sets.id
```

### Supabase Storage
- Crear bucket `images` (público, solo lectura anónima).
- El admin sube imágenes desde los formularios; se almacenan en `images/<entity>/<uuid>.<ext>`.
- Las URLs se guardan en los campos `images[]` de cada entidad.

---

## Dependencias entre features

| Feature | Depende de |
|---|---|
| gestion-categorias | — |
| gestion-productos | categorias (selector de categoría) |
| gestion-sets | productos (selector de items), categorias |
| gestion-colecciones | productos, sets |
| catalogo-publico | productos en BD |
| sets-publicos | sets en BD |
| colecciones-publicas | colecciones en BD |

---

## Protección de endpoints (Fase 2 del plan de Roles)

Todos los API routes de escritura (POST/PUT/DELETE) deben validar sesión antes de operar:

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

Los GET públicos (storefront) no requieren autenticación.
