import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Reports", path: "/reports" },
    { name: "Shipments", path: "/shipments" },
    { name: "Import Excel", path: "/import" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-white shadow-sm md:block">
        <div className="border-b px-6 py-5">
          <h1 className="text-lg font-bold text-gray-900">
            Inbound Management
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Shipment Management System
          </p>
        </div>

        <nav className="p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `mb-1 block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Header + Navigation */}
      <div className="relative md:hidden">
        <header className="relative z-70 flex items-center justify-between border-b bg-white px-4 py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900">
              Inbound Management
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Shipment Management System
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </header>

        {/* Mobile Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/20 ${
            isMenuOpen ? "" : "pointer-events-none hidden"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Mobile Navigation Drawer */}
        <nav
          className={`absolute left-0 right-0 top-full z-60 bg-white p-4 shadow-lg transition-transform duration-200 ease-out ${
            isMenuOpen
              ? "translate-y-0"
              : "-translate-y-full pointer-events-none"
          }`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                `mb-1 block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Page */}
      <main className="md:ml-64">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;