export function StockBadge() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60">
      <span className="bg-white/90 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-gray-200">
        Sin stock
      </span>
    </div>
  )
}
