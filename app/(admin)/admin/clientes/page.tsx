"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  CreditCard,
  Edit,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatCurrency, formatPoints, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { DigitalLoyaltyCard } from "@/components/cards/DigitalLoyaltyCard";
import { QRViewerModal } from "@/components/qr/QRViewerModal";

export default function ClientesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [qrViewerOpen, setQrViewerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    docType: "DNI",
    docNumber: "",
    phone: "",
    email: "",
    address: "",
    district: "",
    city: "Arequipa",
    birthDate: "",
    tierId: "",
    createAccount: true,
    accountPassword: "",
    notes: "",
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [search, selectedTier, page]);

  const fetchTiers = async () => {
    try {
      const res = await fetch("/api/tiers");
      const json = await res.json();
      setTiers(json.tiers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedTier) params.set("tierId", selectedTier);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();
      setCustomers(json.customers || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (e) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear cliente");

      toast.success(json.message || "Cliente creado exitosamente");
      setCreateModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al actualizar cliente");

      toast.success(json.message);
      setEditModalOpen(false);
      fetchCustomers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEditModal = (c: any) => {
    setSelectedCustomer(c);
    setFormData({
      firstName: c.firstName,
      lastName: c.lastName,
      docType: c.docType,
      docNumber: c.docNumber,
      phone: c.phone,
      email: c.email,
      address: c.address || "",
      district: c.district || "",
      city: c.city || "Arequipa",
      birthDate: c.birthDate ? c.birthDate.slice(0, 10) : "",
      tierId: c.tierId,
      createAccount: false,
      accountPassword: "",
      notes: c.notes || "",
    });
    setEditModalOpen(true);
  };

  const openCardModal = (c: any) => {
    setSelectedCustomer(c);
    setCardModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      docType: "DNI",
      docNumber: "",
      phone: "",
      email: "",
      address: "",
      district: "",
      city: "Arequipa",
      birthDate: "",
      tierId: "",
      createAccount: true,
      accountPassword: "",
      notes: "",
    });
  };

  const getTierBadgeVariant = (name: string) => {
    const t = name.toLowerCase();
    if (t === "platinum") return "platinum";
    if (t === "gold") return "gold";
    if (t === "silver") return "silver";
    return "bronze";
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#D4AF37]" />
            <span>Gestión de Clientes VIP</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Base de socios de Luxury Rewards con tarjetas digitales y saldos de fidelización.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/reports/export/excel?type=clientes" target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm" className="gap-1.5 border-neutral-700">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </Button>
          </a>

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
            <span>Nuevo Cliente</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar por DNI, nombres, teléfono, correo o código de socio..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-[#181818]"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={selectedTier}
                onChange={(e) => {
                  setSelectedTier(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#181818] px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">Todos los Niveles VIP</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    Nivel {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Socio</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Nivel VIP</th>
                <th className="py-3 px-4 text-right">Puntos Actuales</th>
                <th className="py-3 px-4 text-right">Consumo Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    Cargando clientes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                      {c.code}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-[11px] text-neutral-400">{c.city || "Arequipa"}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-300">
                      {c.docType}: {c.docNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white">{c.phone}</p>
                      <p className="text-[10px] text-neutral-400">{c.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getTierBadgeVariant(c.tier.name)}>
                        {c.tier.name}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-black gold-text-gradient text-sm">
                      {c.currentPoints.toLocaleString("es-PE")}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-950 text-red-400"
                        }`}
                      >
                        {c.status === "ACTIVE" ? "Activo" : c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openCardModal(c)}
                          title="Ver Tarjeta Digital"
                          className="h-8 w-8 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(c)}
                          title="Editar Cliente"
                          className="h-8 w-8 text-neutral-300 hover:bg-neutral-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-3 text-xs">
            <span className="text-neutral-400">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Create Customer */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Registrar Nuevo Cliente VIP"
        description="Se creará su membresía, número de socio único y tarjeta digital QR automáticamente."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nombres *
              </label>
              <Input
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Ej. Rodrigo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Apellidos *
              </label>
              <Input
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Ej. Morales Valdivia"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Tipo Doc. *
              </label>
              <select
                value={formData.docType}
                onChange={(e) => setFormData({ ...formData, docType: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="DNI">DNI</option>
                <option value="CE">Carné Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Número de Documento *
              </label>
              <Input
                required
                value={formData.docNumber}
                onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                placeholder="45892341"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Teléfono / WhatsApp *
              </label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+51 984 778 899"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Correo Electrónico *
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Dirección
              </label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Av. Cayma 612"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Distrito
              </label>
              <Input
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Cayma / Yanahuara"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nivel VIP Inicial
              </label>
              <select
                value={formData.tierId}
                onChange={(e) => setFormData({ ...formData, tierId: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="">Predeterminado (Bronze)</option>
                {tiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Fecha de Nacimiento (Opcional para Bono Cumpleaños)
              </label>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>
          </div>

          {/* Account Creation Checkbox */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
              <input
                type="checkbox"
                checked={formData.createAccount}
                onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                className="rounded border-neutral-700 text-[#D4AF37] focus:ring-[#D4AF37]"
              />
              <span>Crear cuenta de acceso web para el cliente (Portal Mi Cuenta)</span>
            </label>
            {formData.createAccount && (
              <Input
                type="password"
                placeholder="Contraseña inicial (opcional, por defecto Luxury2026*)"
                value={formData.accountPassword}
                onChange={(e) => setFormData({ ...formData, accountPassword: e.target.value })}
                className="text-xs"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Guardar y Generar Tarjeta
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Customer */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Datos de Cliente"
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Nombres</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Apellidos</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Teléfono</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Correo</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Dirección</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Distrito</label>
              <Input
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>
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

      {/* Modal: View Digital Card */}
      {selectedCustomer && (
        <Modal
          isOpen={cardModalOpen}
          onClose={() => setCardModalOpen(false)}
          title={`Tarjeta Digital - ${selectedCustomer.code}`}
          maxWidth="lg"
        >
          <div className="py-2">
            <DigitalLoyaltyCard
              customer={selectedCustomer}
              card={selectedCustomer.card}
              onEnlargeQR={() => setQrViewerOpen(true)}
            />
          </div>
        </Modal>
      )}

      {/* Modal: Fullscreen QR Viewer */}
      {selectedCustomer && (
        <QRViewerModal
          isOpen={qrViewerOpen}
          onClose={() => setQrViewerOpen(false)}
          customer={{
            fullName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
            code: selectedCustomer.code,
            tierName: selectedCustomer.tier?.name || "BRONZE",
            currentPoints: selectedCustomer.currentPoints,
          }}
          card={{
            cardNumber: selectedCustomer.card?.cardNumber || "",
            qrCodeToken: selectedCustomer.card?.qrCodeToken || "",
          }}
        />
      )}
    </div>
  );
}

