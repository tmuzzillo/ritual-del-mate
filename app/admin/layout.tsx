import Link from "next/link";
import { logout } from "./actions";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link href="/admin" className="font-semibold text-gray-900 text-sm sm:text-base hover:opacity-75">
          Ritual del Mate · Admin
        </Link>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </header>
      <AdminNav />
      <main className="p-4 sm:p-8">{children}</main>
      <Toaster />
    </div>
  );
}
