import type { Product, ProductVariation, SetItem } from '@/types'

/**
 * Retorna true si el producto tiene stock disponible.
 * Si tiene variaciones activas → alguna tiene stock > 0.
 * Si no tiene variaciones → product.stock > 0.
 */
export function isProductAvailable(product: Product): boolean {
  const activeVariations = product.variations?.filter((v) => v.is_active) ?? []
  if (activeVariations.length > 0) {
    return activeVariations.some((v) => v.stock > 0)
  }
  return product.stock > 0
}

/**
 * Stock máximo seleccionable para un producto.
 * Si variationId → stock de esa variación.
 * Si no → product.stock.
 */
export function getProductMaxStock(
  product: Product,
  variationId?: string | null
): number {
  if (variationId) {
    const variation = product.variations?.find((v) => v.id === variationId)
    return variation?.stock ?? 0
  }
  return product.stock
}

/**
 * Retorna true si el set tiene stock suficiente en todos sus items.
 * Para cada set_item: si tiene variation_id → variation.stock >= quantity,
 * sino → product.stock >= quantity. Retorna ALL.
 */
export function isSetAvailable(setItems: SetItem[]): boolean {
  if (setItems.length === 0) return false
  return setItems.every((item) => {
    if (item.variation) {
      return (item.variation as ProductVariation).stock >= item.quantity
    }
    if (item.product) {
      return item.product.stock >= item.quantity
    }
    return false
  })
}
