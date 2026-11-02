import React from "react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { Compass, Crown, Shield, Award, Sparkles, ChevronRight } from "lucide-react";
import LogoutButton from "@/components/layout/LogoutButton";
import { Badge } from "@/components/ui/badge";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  let customer = null;
  if (session?.userId) {
    customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { userId: session.userId },
          { email: session.email },
        ],
      },
      include: { tier: true, card: true },
    });
  }

  const getTierIcon = (name: string) => {
    const t = name?.toUpperCase() || "BRONZE";
    if (t === "PLATINUM") return <Sparkles className="h-4 w-4 text-gray-200" />;
    if (t === "GOLD") return <Crown className="h-4 w-4 text-[#D4AF37]" />;
    if (t === "SILVER") return <Award className="h-4 w-4 text-gray-300" />;
    return <Shield className="h-4 w-4 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-white">
      {/* Customer Header */}
      <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-neutral-800/80 bg-[#0C0C0C]/90 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-gradient-to-br from-[#1E1E1E] to-[#0A0A0A] shadow-gold-sm">
            <Compass className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-wider text-white">
              LUXURY REWARDS
            </h1>
            <p className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold">
              Portal Exclusivo VIP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-xs text-neutral-300 hover:text-white"
            >
              <span>Ir a Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#D4AF37]" />
            </Link>
          )}

          {customer && (
            <div className="hidden sm:flex items-center gap-2 border border-neutral-800 bg-neutral-900/50 py-1.5 px-3 rounded-full">
              {getTierIcon(customer.tier?.name)}
              <span className="text-xs font-bold text-white uppercase">
                Nivel {customer.tier?.name}
              </span>
              <span className="text-xs text-[#D4AF37] font-black">
                {customer.currentPoints} PTS
              </span>
            </div>
          )}

          <div className="text-right">
            <span className="text-xs font-semibold text-white block">
              {session?.name || "Cliente VIP"}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {customer?.code || "Socio"}
            </span>
          </div>

          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>

      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
        LUXURY PRIVATE TRAVEL • Programa de Fidelización Digital LUXURY REWARDS • Arequipa, Perú
      </footer>
    </div>
  );
}

