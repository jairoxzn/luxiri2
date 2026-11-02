"use client";

import React, { useEffect, useState } from "react";
import { Percent, Plus, Search, Calendar, Tag, Sparkles, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PromocionesAdminPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    promoType: "DOUBLE_POINTS",
    multiplier: "2.0",
    bonusPoints: "0",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
    terms: "",
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/promotions");
      const json = await res.json();
      setPromotions(json.promotions || []);
    } catch (e) {
      toast.error("Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setCreateModalOpen(false);
      resetForm();
      fetchPromotions();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (p: any) => {
    try {
      const res = await fetch(`/api/promotions/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Estado de promoción actualizado");
      fetchPromotions();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      promoType: "DOUBLE_POINTS",
      multiplier: "2.0",
      bonusPoints: "0",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      terms: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Percent className="h-6 w-6 text-[#D4AF37]" />
            <span>Campañas y Promociones Especiales</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Doble puntuación en fines de semana, bonos de cumpleaños y temporadas de viaje.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="gap-1.5 shadow-gold-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Promoción</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((p) => (
          <Card
            key={p.id}
            className={`border-neutral-800 bg-[#121212] flex flex-col justify-between transition-all hover:border-[#D4AF37]/50 ${
              !p.isActive && "opacity-60"
            }`}
          >
            <div>
              <CardHeader className="pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="gold" className="text-[10px]">
                    {p.promoType}
                  </Badge>
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      p.isActive ? "bg-emerald-500" : "bg-neutral-600"
                    }`}
                  />
                </div>
                <CardTitle className="text-base font-bold text-white mt-2 leading-snug">
                  {p.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {p.description || "Sin descripción"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                  <span className="text-neutral-400">Beneficio</span>
                  <span className="font-extrabold gold-text-gradient text-sm">
                    {p.multiplier > 1.0 ? `x${p.multiplier} Puntos` : `+${p.bonusPoints} Puntos Extra`}
                  </span>
                </div>

                <div className="space-y-1 text-neutral-400 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span>
                      Vigencia: {formatDate(p.startDate, "dd/MM/yyyy")} al {formatDate(p.endDate, "dd/MM/yyyy")}
                    </span>
                  </div>
                  {p.terms && (
                    <p className="text-[10px] text-neutral-500 mt-1 italic">
                      Nota: {p.terms}
                    </p>
                  )}
                </div>
              </CardContent>
            </div>

            <div className="p-4 pt-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(p)}
                className={`w-full text-xs ${p.isActive ? "text-red-400" : "text-emerald-400"}`}
              >
                {p.isActive ? "Desactivar Campaña" : "Activar Campaña"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: Create Promotion */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nueva Promoción"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre de la Campaña *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Doble Puntuación Fiestas Patrias"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Tipo de Regla Promocional</label>
            <select
              value={formData.promoType}
              onChange={(e) => setFormData({ ...formData, promoType: e.target.value })}
              className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
            >
              <option value="DOUBLE_POINTS">Multiplicador de Puntos (Doble/Triple)</option>
              <option value="BONUS_POINTS">Bono Fijo de Puntos Extra</option>
              <option value="BIRTHDAY_SPECIAL">Bono Especial de Cumpleaños</option>
              <option value="SEASONAL_CAMPAIGN">Campaña de Temporada</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Multiplicador (ej. 2.0)</label>
              <Input
                type="number"
                step="0.5"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Puntos Fijos de Bono</label>
              <Input
                type="number"
                value={formData.bonusPoints}
                onChange={(e) => setFormData({ ...formData, bonusPoints: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Fecha Inicial *</label>
              <Input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Fecha Final *</label>
              <Input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Crear Campaña
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

