export interface ProductVariation {
  id: string;
  product_id: string;
  label: string;
  images: string[];
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  stock: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  care_text: string | null;
  price: number | null;
  stock: number;
  images: string[];
  category_id: string | null;
  category?: Category;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  variations?: ProductVariation[];
}

export interface SetItem {
  id: string;
  set_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  variation_id?: string | null;
  variation?: ProductVariation | null;
  is_gift: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline?: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
  products?: Product[];
  sets?: MateSet[];
}

export interface MateSet {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  category_id: string | null;
  category?: Category;
  is_active: boolean;
  featured: boolean;
  set_items?: SetItem[];
  badge_text?: string | null;
  created_at: string;
}

export type OrderStatus = 'pendiente_pago' | 'pago_confirmado' | 'enviado' | 'entregado' | 'cancelado'

export interface Order {
  id: string; order_number: number; buyer_name: string; buyer_email: string
  buyer_phone: string; status: OrderStatus; total: number; created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string; order_id: string; item_type: 'product' | 'set'
  product_id: string | null; set_id: string | null; variation_id: string | null
  item_name: string; variation_label: string | null; quantity: number; unit_price: number
}

export interface CartItem {
  id: string                    // product_id o set_id
  item_type: 'product' | 'set'
  name: string
  image: string
  price: number
  quantity: number
  variation_id?: string
  variation_label?: string
  components?: string[]         // para sets: nombres de los productos que lo componen
}

export interface ShopConfig {
  bank_cbu: string; bank_alias: string; bank_owner: string; bank_name: string
  whatsapp_number: string; shipping_disclaimer: string
}
