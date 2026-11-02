"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Compass, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor ingresa tu correo y contraseña");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      toast.success(`Bienvenido, ${data.user.name}`);
      const targetUrl = redirect || data.redirectUrl;
      router.push(targetUrl);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Luxury2026*");
    toast.info(`Credenciales cargadas para ${roleEmail}`);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#121212]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@luxurytravel.com"
              className="pl-9 bg-[#181818] border-neutral-700/80"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Contraseña
            </label>
            <Link
              href="/recuperar-password"
              className="text-xs text-[#D4AF37] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-9 bg-[#181818] border-neutral-700/80"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="default"
          disabled={loading}
          className="w-full h-11 text-sm font-bold gap-2 mt-2 shadow-gold"
        >
          {loading ? (
            "Accediendo..."
          ) : (
            <>
              <span>Ingresar al Sistema</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Quick Demo Access Buttons */}
      <div className="mt-6 border-t border-neutral-800/80 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 text-center mb-3">
          Acceso Rápido de Demostración
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount("admin@luxurytravel.com")}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 text-[11px] font-medium text-neutral-300 hover:border-[#D4AF37]/50 hover:text-white transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
            Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("operador@luxurytravel.com")}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 text-[11px] font-medium text-neutral-300 hover:border-[#D4AF37]/50 hover:text-white transition-all"
          >
            <UserCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
            Operador
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("cliente@luxurytravel.com")}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 p-2 text-[11px] font-medium text-neutral-300 hover:border-[#D4AF37]/50 hover:text-white transition-all"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#D4AF37]" />
            Cliente VIP
          </button>
        </div>
        <p className="text-[10px] text-center text-neutral-500 mt-2">
          Clave predeterminada: <code className="text-[#D4AF37]">Luxury2026*</code>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle gold luxury background glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-[120px]" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] shadow-gold mb-2">
            <Compass className="h-7 w-7 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            LUXURY REWARDS
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
            LUXURY PRIVATE TRAVEL • PROGRAMA VIP
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-xs text-neutral-400">Cargando acceso...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500">
          © 2026 LUXURY PRIVATE TRAVEL • Arequipa, Perú • Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
