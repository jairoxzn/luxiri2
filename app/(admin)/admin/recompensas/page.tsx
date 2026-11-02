"use client";

import React, { useEffect, useState } from "react";
import { Gift, Plus, Search, Edit, Trash2, Crown, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function RecompensasAdminPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Descuentos",
    description: "",
    pointsRequired: "50",
    stock: "20",
    minTierId: "",
    terms: "",
    isActive: true,
  });

  useEffect(() => {
    fetchAux();
    fetchRewards();
  }, []);

  const fetchAux = async () => {
    try {
      const res = await fetch("/api/tiers");
      const json = await res.json();
      setTiers(json.tiers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rewards");
      const json = await res.json();
      setRewards(json.rewards || []);
    } catch (e) {
      toast.error("Error al cargar recompensas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setCreateModalOpen(false);
      resetForm();
      fetchRewards();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;
    try {
      const res = await fetch(`/api/rewards/${selectedReward.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setEditModalOpen(false);
      fetchRewards();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleActive = async (r: any) => {
    try {
      const res = await fetch(`/api/rewards/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Estado de recompensa actualizado");
      fetchRewards();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (r: any) => {
    setSelectedReward(r);
    setFormData({
      name: r.name,
      category: r.category,
      description: r.description || "",
      pointsRequired: r.pointsRequired.toString(),
      stock: r.stock.toString(),
      minTierId: r.minTierId || "",
      terms: r.terms || "",
      isActive: r.isActive,
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Descuentos",
      description: "",
      pointsRequired: "50",
      stock: "20",
      minTierId: "",
      terms: "",
      isActive: true,
    });
  };

  const filtered = rewards.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Gift className="h-6 w-6 text-[#D4AF37]" />
            <span>Catálogo de Recompensas y Beneficios</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Administra los premios, descuentos y experiencias canjeables por puntos.
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
          <span>Nueva Recompensa</span>
        </Button>
      </div>

      {/* Search */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar recompensas por nombre o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#181818]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500">
            Cargando catálogo...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500">
            No se encontraron recompensas registradas.
          </div>
        ) : (
          filtered.map((r) => (
            <Card
              key={r.id}
              className={`border-neutral-800 bg-[#121212] transition-all hover:border-[#D4AF37]/50 flex flex-col justify-between ${
                !r.isActive && "opacity-60"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] border-neutral-700">
                    {r.category}
                  </Badge>
                  {r.minTier && (
                    <Badge variant="gold" className="text-[10px]">
                      {r.minTier.name}
                    </Badge>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-2xl font-black gold-text-gradient">
                    {r.pointsRequired} PTS
                  </span>
                  <CardTitle className="text-sm font-bold text-white mt-1 leading-snug">
                    {r.name}
                  </CardTitle>
                </div>

                <CardDescription className="text-xs line-clamp-3 mt-1.5">
                  {r.description || "Sin descripción"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs text-neutral-400">
                  <span>Stock: {r.stock} u.</span>
                  <span>{r._count?.redemptions || 0} canjeados</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-800/60 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(r)}
                    className="h-7 text-xs text-neutral-300 hover:text-white"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(r)}
                    className={`h-7 text-xs ${r.isActive ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {r.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Reward */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nueva Recompensa"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre de la Recompensa *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Descuento S/ 50 en Tour Colca"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="Descuentos">Descuentos</option>
                <option value="Traslados">Traslados</option>
                <option value="Tours">Tours</option>
                <option value="Servicios VIP">Servicios VIP</option>
                <option value="Cortesías VIP">Cortesías VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Nivel Mínimo Requerido</label>
              <select
                value={formData.minTierId}
                onChange={(e) => setFormData({ ...formData, minTierId: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="">Cualquier Nivel (Bronze+)</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Puntos Requeridos *</label>
              <Input
                type="number"
                required
                value={formData.pointsRequired}
                onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Stock Disponible *</label>
              <Input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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
              placeholder="Detalle el beneficio exacto obtenido..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Términos y Condiciones</label>
            <textarea
              rows={2}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
              placeholder="Condiciones de reserva o restricciones..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Crear Recompensa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Reward */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Recompensa"
        maxWidth="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Puntos Requeridos</label>
              <Input
                type="number"
                value={formData.pointsRequired}
                onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Stock</label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
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

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Términos</label>
            <textarea
              rows={2}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
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

