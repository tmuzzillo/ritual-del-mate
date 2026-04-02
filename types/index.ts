export interface ProductVariation {
  id: string;
  product_id: string;
  label: string;
  images: string[];
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  created_at: string;
}
