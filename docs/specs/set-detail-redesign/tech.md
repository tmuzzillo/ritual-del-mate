# Spec Técnica: Rediseño del Detalle de Set

## Archivos modificados

| Archivo | Tipo de cambio |
|---|---|
| `app/(shop)/set/[slug]/page.tsx` | Refactor principal |
| `components/ui/accordion.tsx` | Nuevo (shadcn add accordion) |

Sin cambios de DB ni de tipos.

## CTA WhatsApp

```tsx
const waMessage = encodeURIComponent(`Hola! Me interesa el set "${set.name}" 🧉`);
const waUrl = `https://wa.me/543535104448?text=${waMessage}`;
```

Botón: `<a href={waUrl} target="_blank" rel="noopener noreferrer">` con clases Tailwind de botón primario full-width.

## Sección "También te podría gustar"

Dos queries paralelas en el mismo Server Component (Promise.all):

```ts
const [{ data: relatedSets }, { data: relatedProducts }] = await Promise.all([
  supabase
    .from("sets")
    .select("id, name, slug, price, images")
    .eq("is_active", true)
    .neq("id", set.id)
    .limit(3),
  supabase
    .from("products")
    .select("id, name, slug, price, images")
    .eq("is_active", true)
    .limit(3),
]);

// Tomar hasta 2 de cada uno, shuffle simple
const related = [
  ...(relatedSets ?? []).slice(0, 2).map(s => ({ ...s, type: "set" as const })),
  ...(relatedProducts ?? []).slice(0, 2).map(p => ({ ...p, type: "product" as const })),
];
```

UI: grid de 2 columnas en mobile, 4 en desktop. Cards compactas con imagen cuadrada (aspect-square, object-cover), nombre y precio. Card entera clickeable con `<Link>`.

## Accordeones

Usar `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` de `components/ui/accordion.tsx`.

```tsx
<Accordion type="single" collapsible className="mt-4">
  <AccordionItem value="envios">
    <AccordionTrigger>Envíos y consultas</AccordionTrigger>
    <AccordionContent>
      Hacemos envíos a todo el país por correo o Andreani...
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="cuidados">
    <AccordionTrigger>Cuidados del producto</AccordionTrigger>
    <AccordionContent>
      Los mates artesanales requieren un proceso de curado...
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

## Layout final de la página

```
max-w-6xl mx-auto px-4 py-8

← Volver a sets

[grid 2 cols: ImageGallery | info]
  info:
    badge "Set"
    h1 nombre
    precio
    descripción
    "Detalles del Set" + lista items
    [botón WhatsApp full-width]
    [Accordion: Envíos | Cuidados]

[sección "También te podría gustar"]
  [grid 4 cols: card set | card set | card prod | card prod]
```

## Orden de instalación

1. `npx shadcn@latest add accordion` en el directorio del proyecto
2. Verificar que `components/ui/accordion.tsx` quede creado
3. Implementar cambios en `set/[slug]/page.tsx`
