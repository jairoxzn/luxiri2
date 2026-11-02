"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Briefcase,
  Receipt,
  Coins,
  Gift,
  TicketCheck,
  Crown,
  Percent,
  FileBarChart2,
  UserCog,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navigationItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Clientes", href: "/admin/clientes", icon: Users },
  { name: "Tarjetas Digitales", href: "/admin/tarjetas", icon: CreditCard },
  { name: "Servicios", href: "/admin/servicios", icon: Briefcase },
  { name: "Consumos y Pagos", href: "/admin/consumos", icon: Receipt },
  { name: "Libro de Puntos", href: "/admin/puntos", icon: Coins },
  { name: "Recompensas", href: "/admin/recompensas", icon: Gift },
  { name: "Canjes", href: "/admin/canjes", icon: TicketCheck },
  { name: "Niveles VIP", href: "/admin/niveles", icon: Crown },
  { name: "Promociones", href: "/admin/promociones", icon: Percent },
  { name: "Reportes", href: "/admin/reportes", icon: FileBarChart2 },
  { name: "Usuarios", href: "/admin/usuarios", icon: UserCog },
  { name: "Auditoría", href: "/admin/auditoria", icon: History },
  { name: "Configuración", href: "/admin/configuracion", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Sesión cerrada");
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-40 lg:hidden">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="border-[#D4AF37]/30 bg-[#141414] text-[#D4AF37]"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-30 flex w-72 flex-col border-r border-neutral-800/80 bg-[#0C0C0C] transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center gap-3 border-b border-neutral-800/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-gradient-to-br from-[#1E1E1E] to-[#0A0A0A] shadow-gold-sm">
            <Compass className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white">
              LUXURY REWARDS
            </h1>
            <p className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-medium">
              Luxury Private Travel
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Administración Central
          </p>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all",
                  isActive
                    ? "bg-[#D4AF37]/15 text-[#F2D675] border border-[#D4AF37]/30 shadow-sm"
                    : "text-neutral-400 hover:bg-neutral-900/80 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-[#D4AF37]"
                        : "text-neutral-400 group-hover:text-[#D4AF37]"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom User & Logout Footer */}
        <div className="border-t border-neutral-800/80 p-4 space-y-2">
          <Link
            href="/operador"
            className="flex items-center justify-between rounded-lg bg-neutral-900/60 p-2.5 text-xs text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
          >
            <span>Ver Modo Operador</span>
            <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

