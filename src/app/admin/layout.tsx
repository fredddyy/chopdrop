import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border p-4 hidden md:block">
        <Link href="/admin/dashboard" className="block mb-6">
          <h1 className="text-xl font-bold">
            Chop<span className="text-primary">Box</span>
          </h1>
          <p className="text-xs text-muted">Admin</p>
        </Link>
        <nav className="space-y-1">
          <Link
            href="/admin/dashboard"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            Orders
          </Link>
          <Link
            href="/admin/meals"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            Meals
          </Link>
          <Link
            href="/admin/daily-menu"
            className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            Daily Menu
          </Link>
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <nav className="flex justify-around py-2">
          <Link
            href="/admin/dashboard"
            className="text-xs font-medium text-muted hover:text-primary p-2"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-muted hover:text-primary p-2"
          >
            Orders
          </Link>
          <Link
            href="/admin/meals"
            className="text-xs font-medium text-muted hover:text-primary p-2"
          >
            Meals
          </Link>
          <Link
            href="/admin/daily-menu"
            className="text-xs font-medium text-muted hover:text-primary p-2"
          >
            Menu
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
    </div>
  );
}
