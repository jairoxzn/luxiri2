"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Plus, Search, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ServiciosAdminPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "VIAJES_PRIVADOS",
    description: "",
    referencePrice: "100.00",
    pointsMultiplier: "1.0",
    isActive: true,
  });

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") params.set("category", selectedCategory);

      const res = await fetch(`/api/services?${params.toString()}`);
      const json = await res.json();
      setServices(json.services || []);
    } catch (e) {
      toast.error("Error al cargar catálogo de servicios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setCreateModalOpen(false);
      resetForm();
      fetchServices();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      const res = await fetch(`/api/services/${selectedService.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setEditModalOpen(false);
      fetchServices();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleServiceActive = async (s: any) => {
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !s.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Estado de servicio actualizado");
      fetchServices();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (s: any) => {
    setSelectedService(s);
    setFormData({
      name: s.name,
      category: s.category,
      description: s.description || "",
      referencePrice: s.referencePrice.toString(),
      pointsMultiplier: s.pointsMultiplier.toString(),
      isActive: s.isActive,
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "VIAJES_PRIVADOS",
      description: "",
      referencePrice: "100.00",
      pointsMultiplier: "1.0",
      isActive: true,
    });
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[#D4AF37]" />
            <span>Catálogo de Servicios y Rutas</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Servicios turísticos, transporte privado, corporativo y mensajería con reglas de puntaje.
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
          <span>Nuevo Servicio</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar servicio o ruta..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#181818]"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#181818] px-3 text-xs text-white"
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="TRANSPORTE">Transporte / Aeropuerto</option>
                <option value="VIAJES_PRIVADOS">Viajes Privados</option>
                <option value="TOURS">Tours y Rutas</option>
                <option value="TRANSPORTE_EMPRESARIAL">Transporte Empresarial</option>
                <option value="MENSAJERIA">Mensajería y Encomiendas</option>
                <option value="SERVICIOS_ESPECIALES">Servicios Especiales</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500">
            Cargando servicios...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-neutral-500">
            No se encontraron servicios registrados.
          </div>
        ) : (
          filteredServices.map((s) => (
            <Card
              key={s.id}
              className={`border-neutral-800 bg-[#121212] transition-all hover:border-[#D4AF37]/50 ${
                !s.isActive && "opacity-60"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase border-neutral-700">
                    {s.category.replace(/_/g, " ")}
                  </Badge>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      s.isActive ? "bg-emerald-500" : "bg-neutral-600"
                    }`}
                  />
                </div>
                <CardTitle className="text-sm font-bold text-white mt-1 leading-snug">
                  {s.name}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {s.description || "Sin descripción"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs">
                  <div>
                    <span className="text-neutral-500 text-[11px]">Tarifa Referencial</span>
                    <p className="font-bold text-white text-base">
                      {formatCurrency(s.referencePrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500 text-[11px]">Multiplicador Pts</span>
                    <p className="font-semibold text-[#D4AF37]">
                      x{s.pointsMultiplier.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-800/60 pt-2">
                  <span className="text-[10px] text-neutral-500">
                    {s._count?.bookings || 0} consumos realizados
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(s)}
                      className="h-7 text-xs text-neutral-300 hover:text-white"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleServiceActive(s)}
                      className={`h-7 text-xs ${s.isActive ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {s.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create Service */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nuevo Servicio"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre del Servicio *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Tour Ruta del Sillar y Cañones"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Categoría *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
            >
              <option value="VIAJES_PRIVADOS">Viajes Privados</option>
              <option value="TRANSPORTE">Transporte / Aeropuerto</option>
              <option value="TOURS">Tours y Rutas</option>
              <option value="TRANSPORTE_EMPRESARIAL">Transporte Empresarial</option>
              <option value="MENSAJERIA">Mensajería y Encomiendas</option>
              <option value="SERVICIOS_ESPECIALES">Servicios Especiales</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Precio Ref. (S/) *</label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.referencePrice}
                onChange={(e) => setFormData({ ...formData, referencePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Multiplicador Pts</label>
              <Input
                type="number"
                step="0.05"
                value={formData.pointsMultiplier}
                onChange={(e) => setFormData({ ...formData, pointsMultiplier: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Descripción</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#D4AF37]"
              placeholder="Detalles del itinerario, vehículo y beneficios incluidos..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Crear Servicio
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Service */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Servicio"
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

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Categoría</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
            >
              <option value="VIAJES_PRIVADOS">Viajes Privados</option>
              <option value="TRANSPORTE">Transporte / Aeropuerto</option>
              <option value="TOURS">Tours y Rutas</option>
              <option value="TRANSPORTE_EMPRESARIAL">Transporte Empresarial</option>
              <option value="MENSAJERIA">Mensajería y Encomiendas</option>
              <option value="SERVICIOS_ESPECIALES">Servicios Especiales</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Precio Referencial (S/)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.referencePrice}
                onChange={(e) => setFormData({ ...formData, referencePrice: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Multiplicador Pts</label>
              <Input
                type="number"
                step="0.05"
                value={formData.pointsMultiplier}
                onChange={(e) => setFormData({ ...formData, pointsMultiplier: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Descripción</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

