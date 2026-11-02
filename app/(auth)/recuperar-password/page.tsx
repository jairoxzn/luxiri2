"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Ingresa tu correo");
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: newPassword || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar solicitud");

      setSuccess(true);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message || "Error al restablecer contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col justify-center items-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-[#141414] shadow-gold mb-1">
            <Compass className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recuperar Contraseña</h1>
          <p className="text-xs text-neutral-400">
            Ingresa tu correo electrónico registrado para actualizar tu clave de acceso
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-[#121212] p-6 sm:p-8 shadow-xl">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">¡Contraseña Actualizada!</h3>
              <p className="text-xs text-neutral-400">
                Tu clave ha sido reestablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <Button
                variant="gold"
                onClick={() => router.push("/login")}
                className="w-full mt-2"
              >
                Volver a Iniciar Sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Correo Electrónico Registrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@luxurytravel.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nueva Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                disabled={loading}
                className="w-full h-10 mt-2 font-bold"
              >
                {loading ? "Actualizando..." : "Restablecer Contraseña"}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#D4AF37] transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Regresar al inicio de sesión</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

