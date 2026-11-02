"use client";

import React, { useEffect, useState } from "react";
import { Crown, Sparkles, Award, Shield, Edit, CheckCircle2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function NivelesAdminPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [formData, setFormData] = useState({
    minSpend: "0",
    pointsMultiplier: "1.0",
    discountPercent: "0",
    description: "",
    perks: "",
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tiers");
      const json = await res.json();
      setTiers(json.tiers || []);
    } catch (e) {
      toast.error("Error al cargar niveles");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (tier: any) => {
    setSelectedTier(tier);
    let parsedPerks = "";
    try {
      const arr = JSON.parse(tier.perks);
      parsedPerks = Array.isArray(arr) ? arr.join("\n") : tier.perks;
    } catch {
      parsedPerks = tier.perks || "";
    }

    setFormData({
      minSpend: tier.minSpend.toString(),
      pointsMultiplier: tier.pointsMultiplier.toString(),
      discountPercent: tier.discountPercent.toString(),
      description: tier.description || "",
      perks: parsedPerks,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;

    try {
      const perksArray = formData.perks
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetch("/api/tiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTier.id,
          minSpend: formData.minSpend,
          pointsMultiplier: formData.pointsMultiplier,
          discountPercent: formData.discountPercent,
          description: formData.description,
          perks: JSON.stringify(perksArray),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setEditModalOpen(false);
      fetchTiers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getTierIcon = (name: string) => {
    const t = name.toUpperCase();
    if (t === "PLATINUM") return <Sparkles className="h-6 w-6 text-gray-200" />;
    if (t === "GOLD") return <Crown className="h-6 w-6 text-[#D4AF37]" />;
    if (t === "SILVER") return <Award className="h-6 w-6 text-gray-300" />;
    return <Shield className="h-6 w-6 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Crown className="h-6 w-6 text-[#D4AF37]" />
          <span>Configuración de Niveles VIP (Tiers)</span>
        </h2>
        <p className="text-xs text-neutral-400">
          Reglas de categorización automática por consumo acumulado, beneficios exclusivos y multiplicadores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((t) => {
          let perksList: string[] = [];
          try {
            perksList = JSON.parse(t.perks);
          } catch {
            perksList = t.perks ? [t.perks] : [];
          }

          return (
            <Card
              key={t.id}
              className="border-neutral-800 bg-[#121212] flex flex-col justify-between transition-all hover:border-[#D4AF37]/50"
            >
              <div>
                <CardHeader className="pb-3 border-b border-neutral-800/80">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl border border-neutral-800 bg-[#181818]">
                      {getTierIcon(t.name)}
                    </div>
                    <Badge variant="outline" className="border-neutral-700 text-xs">
                      {t._count?.customers || 0} socios
                    </Badge>
                  </div>

                  <CardTitle className="text-lg font-black text-white mt-3">
                    NIVEL {t.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t.description || "Nivel exclusivo del club"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-neutral-500 text-[11px]">Consumo Mínimo Requerido</span>
                    <p className="text-lg font-extrabold text-white">
                      {formatCurrency(t.minSpend)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-neutral-800/80 py-2.5">
                    <div>
                      <span className="text-neutral-500 text-[10px]">Multiplicador Pts</span>
                      <p className="font-bold text-[#D4AF37] text-sm">x{t.pointsMultiplier.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[10px]">Descuento Carta</span>
                      <p className="font-bold text-white text-sm">{t.discountPercent}%</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-neutral-400 font-semibold text-[11px] block mb-1.5">
                      Beneficios Incluidos:
                    </span>
                    <ul className="space-y-1.5">
                      {perksList.map((p, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-neutral-300 text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                <Button
                  variant="goldOutline"
                  size="sm"
                  onClick={() => openEdit(t)}
                  className="w-full gap-1.5 text-xs"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Editar Parámetros</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal: Edit Tier */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Editar Nivel VIP: ${selectedTier?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 pt-1">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Consumo Mín. (S/)
              </label>
              <Input
                type="number"
                step="50"
                value={formData.minSpend}
                onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Multiplicador Pts
              </label>
              <Input
                type="number"
                step="0.05"
                value={formData.pointsMultiplier}
                onChange={(e) => setFormData({ ...formData, pointsMultiplier: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Descuento (%)
              </label>
              <Input
                type="number"
                step="1"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Descripción General
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Beneficios VIP (Uno por línea)
            </label>
            <textarea
              rows={4}
              value={formData.perks}
              onChange={(e) => setFormData({ ...formData, perks: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

