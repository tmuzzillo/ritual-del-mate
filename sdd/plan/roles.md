# Execution Plan: Roles

**Spec**: [sdd/specs/roles.md](../specs/roles.md)

## Estado actual

La protección de rutas ya está implementada en `proxy.ts`:
- Redirige `/admin/*` → `/admin/login` si no hay sesión.
- Redirige `/admin/login` → `/admin` si hay sesión activa.

Lo que falta es la UI de login/logout y, más adelante, la protección a nivel de API routes.

---

## Fase 1 — Login y Logout (implementar ahora)

### 1.1 Formulario de login (`app/admin/login/page.tsx`)
- Campos: email + password.
- Validación con `zod` + `react-hook-form`.
- On submit: `supabase.auth.signInWithPassword()`.
- On success: redirect a `/admin` (el proxy ya maneja esto, pero hacer redirect explícito como fallback).
- On error: mostrar mensaje de error inline.

### 1.2 Botón de logout (`app/admin/layout.tsx`)
- Agregar botón visible en el layout del admin.
- On click: `supabase.auth.signOut()` + redirect a `/admin/login`.

---

## Fase 2 — Protección de API routes (diferido, post-endpoints)

> **Trigger**: implementar cuando se construyan los API routes de escritura (POST/PUT/DELETE).

Los API routes bajo `/api/*` no están cubiertos por el matcher del proxy (`/admin/:path*`), por lo que las mutaciones deben validar sesión internamente.

### Patrón a aplicar en cada API route de escritura:
```ts
const supabase = await createClient(); // server client
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

Los API routes de solo lectura (GET públicos para el storefront) no requieren este control.

---

## Dependencias

| Fase | Depende de |
|------|-----------|
| Fase 1 | Admin creado manualmente en Supabase Auth |
| Fase 2 | Endpoints de escritura del backoffice |

## Fuera de scope de este plan

- Gestión de usuarios desde la app.
- Recuperación de contraseña (se gestiona en Supabase directamente).
- Roles granulares.
