import { Navbar } from "@/components/shop/navbar";
import { Footer } from "@/components/shop/footer";
import { CartProvider } from "@/components/shop/cart-provider";
import { Toaster } from "@/components/ui/sonner";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </CartProvider>
  );
}
