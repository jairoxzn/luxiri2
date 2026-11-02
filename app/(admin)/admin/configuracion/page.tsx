"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, ShieldCheck, Building, DollarSign, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ConfiguracionAdminPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    COMPANY_NAME: "LUXURY PRIVATE TRAVEL",
    CURRENCY_SYMBOL: "S/",
    CURRENCY_CODE: "PEN",
    SUPPORT_PHONE: "+51 958 123 456",
    SUPPORT_EMAIL: "reservas@luxuryprivatetravel.pe",
    TIMEZONE: "America/Lima",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.settings) {
        setSettings((prev) => ({ ...prev, ...json.settings }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#D4AF37]" />
          <span>Configuración Global del Sistema</span>
        </h2>
        <p className="text-xs text-neutral-400">
          Identidad de la empresa, moneda oficial, datos de contacto y zona horaria.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identidad y Moneda */}
        <Card className="border-neutral-800 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="h-4 w-4 text-[#D4AF37]" />
              <span>Identidad Comercial y Moneda</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Configuraciones que aparecen en la tarjeta digital, reportes y recibos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Razón Social / Nombre Comercial
              </label>
              <Input
                value={settings.COMPANY_NAME || ""}
                onChange={(e) => setSettings({ ...settings, COMPANY_NAME: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Símbolo Monetario
                </label>
                <Input
                  value={settings.CURRENCY_SYMBOL || ""}
                  onChange={(e) => setSettings({ ...settings, CURRENCY_SYMBOL: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Código ISO de Moneda
                </label>
                <Input
                  value={settings.CURRENCY_CODE || ""}
                  onChange={(e) => setSettings({ ...settings, CURRENCY_CODE: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canales de Atención VIP */}
        <Card className="border-neutral-800 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#D4AF37]" />
              <span>Canales de Contacto VIP y Zona Horaria</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Teléfono / WhatsApp Concierge
                </label>
                <Input
                  value={settings.SUPPORT_PHONE || ""}
                  onChange={(e) => setSettings({ ...settings, SUPPORT_PHONE: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Correo de Reservas VIP
                </label>
                <Input
                  value={settings.SUPPORT_EMAIL || ""}
                  onChange={(e) => setSettings({ ...settings, SUPPORT_EMAIL: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Zona Horaria del Sistema
              </label>
              <Input
                value={settings.TIMEZONE || "America/Lima"}
                disabled
                className="bg-neutral-900/60 font-mono text-neutral-400"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Configurado en America/Lima (Perú - UTC-5)</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="gold"
            disabled={loading}
            className="gap-2 shadow-gold"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? "Guardando..." : "Guardar Configuraciones"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

