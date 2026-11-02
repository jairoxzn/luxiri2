"use client";

import React, { useState } from "react";
import { QrCode, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AdminNavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleScanSuccess = (data: any) => {
    toast.success(`Cliente ${data.customer.fullName} escaneado`);
    router.push(`/admin/clientes?search=${encodeURIComponent(data.customer.docNumber)}`);
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-neutral-800/80 bg-[#0C0C0C]/90 px-6 backdrop-blur-md">
        {/* Left Side spacer for mobile hamburger */}
        <div className="pl-12 lg:pl-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Panel Administrativo
            </span>
            <span className="text-xs text-neutral-600">•</span>
            <span className="flex items-center gap-1 text-xs text-[#D4AF37]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sesión Segura
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Gestión Central Luxury Rewards
          </h2>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="goldOutline"
            size="sm"
            onClick={() => setScannerOpen(true)}
            className="hidden sm:flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            <span>Escanear Tarjeta</span>
          </Button>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-white">
              {user?.name || "Administrador"}
            </span>
            <span className="text-[10px] text-neutral-400">
              {user?.email || "admin@luxurytravel.com"}
            </span>
          </div>

          <div className="h-9 w-9 rounded-full border border-[#D4AF37]/50 bg-gradient-to-tr from-[#202020] to-[#121212] flex items-center justify-center text-xs font-bold text-[#D4AF37]">
            {user?.name ? user.name[0].toUpperCase() : "A"}
          </div>
        </div>
      </header>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}

