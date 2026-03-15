# Technical Plan: Mejoras de Imágenes de Productos

**Created**: 2026-03-15

## Overview
Implementar 3 cambios puntuales al componente `ImageUploader` y a los componentes de display de storefront:
1. **Borrado real de imágenes** en Supabase Storage cuando el admin hace clic en X
2. **Límite aumentado a 7** imágenes por entidad
3. **object-contain** en storefront para mostrar imágenes sin recorte

## Changes by File

### 1. `components/admin/image-uploader.tsx`

**Change 1A: Borrado en Storage**

Convertir `handleRemove` a función async que:
- Extrae el storage path de la URL pública: `url.split("/storage/v1/object/public/images/")[1]`
- Llama a `supabase.storage.from("images").remove([storagePath])`
- Si hay error, muestra mensaje "Error al eliminar la imagen"
- Si éxito, quita la URL del array local

```typescript
async function handleRemove(url: string) {
  // Extraer path: "products/uuid.jpg"
  const marker = "/storage/v1/object/public/images/";
  const storagePath = url.split(marker)[1];
  if (!storagePath) {
    setError("No se pudo extraer la ruta de la imagen.");
    return;
  }

  setRemoving(url); // State para deshabilitar X durante borrado

  try {
    const supabase = createClient();
    const { error } = await supabase.storage.from("images").remove([storagePath]);
    if (error) throw error;
    onChange(images.filter((img) => img !== url));
  } catch (err) {
    setError("Error al eliminar la imagen. Intentá de nuevo.");
    console.error(err);
  } finally {
    setRemoving(null);
  }
}
```

**UI Update**: El botón X en thumbnail tiene:
```tsx
disabled={uploading || removing === url}
opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed
```

**Change 1B: Límite a 7**

```typescript
maxImages = 7,  // línea 23, era 5
```

### 2. `components/shop/image-gallery.tsx`

**Change 2A: Contenedor principal**

Reemplazar el contenedor de la imagen principal:
```tsx
// ANTES:
<div className="relative aspect-square rounded-lg overflow-hidden bg-white">
  <Image
    src={images[selected]}
    alt={name}
    fill
    className="object-cover"
    priority
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>

// DESPUÉS:
<div className="relative aspect-square rounded-lg overflow-hidden bg-brand-cream">
  <Image
    src={images[selected]}
    alt={name}
    fill
    className="object-contain"
    priority
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

**Change 2B: Thumbnails**

```tsx
// ANTES:
<Image src={url} alt="" fill className="object-cover" sizes="64px" />

// DESPUÉS:
<Image src={url} alt="" fill className="object-contain" sizes="64px" />
// El botón ya tiene bg-white; agregar bg-brand-cream si es necesario:
className="relative w-16 h-16 border-2 border-gray-300 rounded-md overflow-hidden bg-brand-cream"
```

### 3. `components/shop/product-card.tsx`

**Change 3A: Imagen de portada**

```tsx
// ANTES:
<div className="relative aspect-square rounded-md overflow-hidden">
  <Image
    src={product.images[0]}
    alt={product.name}
    fill
    className="object-cover"
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  />
</div>

// DESPUÉS:
<div className="relative aspect-square rounded-md overflow-hidden bg-brand-cream">
  <Image
    src={product.images[0]}
    alt={product.name}
    fill
    className="object-contain"
    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
  />
</div>
```

### 4. `components/shop/set-card.tsx`

**Change 4A: Imagen de portada**

Aplicar los mismos cambios que en `product-card.tsx`.

## State & Type Changes

### ImageUploader.tsx
```typescript
const [uploading, setUploading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [removing, setRemoving] = useState<string | null>(null); // NEW: track URL being deleted
```

## API & Dependencies
- **Supabase Storage API**: `storage.from("images").remove([path])` (ya disponible en `createBrowserClient`)
- **No API route changes necesarias**: El borrado ocurre en el cliente browser

## DB Migrations
- **Ninguna**: Los cambios son solo en el código. El schema de images (TEXT[]) no cambia.

## Testing Strategy

### Unit / Integration Tests
1. **ImageUploader.tsx**:
   - Test: Llamar a `handleRemove(url)` → verifica que se llame a `supabase.storage.remove([path])` con el path correcto
   - Test: Durante un borrado, el botón X debe estar `disabled`
   - Test: Después de borrar, la URL no debe estar en el array local

2. **Componentes de display (ImageGallery, ProductCard, SetCard)**:
   - Test visual (manual): Abrir `/producto/[slug]` con imagen rectangular → debe verse completa sin recorte
   - Test: Verificar que `object-contain` está en la clase de Image
   - Test: Verificar que `bg-brand-cream` está en el contenedor

### Manual Testing Checklist
- [ ] Admin sube 1 imagen a un producto, hace clic en X, y verifica que desaparece de Storage (dashboard Supabase)
- [ ] Admin sube 7 imágenes, intenta agregar la 8ª, el botón "Agregar" está oculto
- [ ] Admin abre `/producto/[slug]` con foto 4:3 → se ve completa sin recorte
- [ ] Admin abre `/catalogo` → todas las cards muestran imágenes completas sin distorsión
- [ ] Sets públicos (`/sets`, `/set/[slug]`) también muestran imágenes sin recorte
- [ ] Collections (`/colecciones`, `/colecciones/[slug]`) siguen viendo imágenes correctamente (si es que usan ImageGallery; si no, revisar)

## Rollout & Backwards Compatibility
- **No breaking changes**: Código es aditivo (nuevo state `removing`) y cambios de styling son visuales solamente.
- **Existing products**: Todas las imágenes seguirán siendo visibles; solo cambia el display (object-contain en vez de object-cover).
- **Existing orphaned images in Storage**: No se limpian automáticamente (out of scope); serán ignoradas por la app.

## Known Limitations & Future Work
- No reorden de imágenes (drag & drop)
- No compresión automática al subir
- No conversion a WebP
- No lightbox/modal de galería en storefront (todo es inline)
