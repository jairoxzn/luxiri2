import React from "react";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { Compass, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-white">
      {/* Operator Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-800/80 bg-[#0C0C0C]/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-[#161616] shadow-gold-sm">
            <Compass className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white">
              LUXURY REWARDS
            </h1>
            <p className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold">
              Módulo de Operador VIP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
            >
              <span>Volver a Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#D4AF37]" />
            </Link>
          )}

          <div className="text-right">
            <span className="text-xs font-semibold text-white block">
              {session?.name || "Operador"}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">Turno Activo</span>
          </div>

          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}

