"use client";

import React, { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  Coins,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatCurrency, formatPoints, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ConsumosAdminPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    customerId: "",
    serviceId: "",
    amount: "",
    paymentMethod: "YAPE",
    paymentStatus: "PAGADO",
    serviceStatus: "COMPLETADO",
    bookingDate: new Date().toISOString().slice(0, 16),
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [search, statusFilter]);

  const fetchAuxData = async () => {
    try {
      const [resCust, resServ] = await Promise.all([
        fetch("/api/customers?limit=100"),
        fetch("/api/services?active=true"),
      ]);
      const jsonCust = await resCust.json();
      const jsonServ = await resServ.json();
      setCustomers(jsonCust.customers || []);
      setServices(jsonServ.services || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/bookings?${params.toString()}`);
      const json = await res.json();
      setBookings(json.bookings || []);
    } catch (e) {
      toast.error("Error al cargar consumos");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const serv = services.find((s) => s.id === serviceId);
    setFormData((prev) => ({
      ...prev,
      serviceId,
      amount: serv ? serv.referencePrice.toString() : prev.amount,
    }));
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setCreateModalOpen(false);
      resetForm();
      fetchBookings();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REFUND",
          reason: refundReason,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setRefundModalOpen(false);
      setRefundReason("");
      fetchBookings();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openRefundModal = (b: any) => {
    setSelectedBooking(b);
    setRefundReason("");
    setRefundModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      serviceId: "",
      amount: "",
      paymentMethod: "YAPE",
      paymentStatus: "PAGADO",
      serviceStatus: "COMPLETADO",
      bookingDate: new Date().toISOString().slice(0, 16),
      referenceNumber: "",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETADO":
        return <Badge variant="success">Completado</Badge>;
      case "EN_PROCESO":
        return <Badge variant="gold">En Proceso</Badge>;
      case "PENDIENTE":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "REEMBOLSADO":
        return <Badge variant="destructive">Reembolsado</Badge>;
      case "CANCELADO":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-[#D4AF37]" />
            <span>Registro de Consumos y Servicios</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Acreditación transaccional de puntos por viajes, tours y traslados completados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/reports/export/excel?type=consumos" target="_blank" rel="noreferrer">
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
            <span>Registrar Consumo</span>
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
                placeholder="Buscar por código de consumo, cliente, DNI o servicio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#181818]"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#181818] px-3 text-xs text-white"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="COMPLETADO">Completados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="REEMBOLSADO">Reembolsados</option>
                <option value="CANCELADO">Cancelados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente VIP</th>
                <th className="py-3 px-4">Servicio Contratado</th>
                <th className="py-3 px-4 text-right">Importe</th>
                <th className="py-3 px-4">Método Pago</th>
                <th className="py-3 px-4 text-center">Puntos Acreditados</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    Cargando consumos...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500">
                    No se encontraron registros de consumos.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                      {b.code}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {formatDate(b.bookingDate, "dd/MM/yy HH:mm")}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">
                        {b.customer?.firstName} {b.customer?.lastName}
                      </p>
                      <p className="text-[10px] text-neutral-400">{b.customer?.code} • {b.customer?.tier?.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{b.service?.name}</p>
                      <p className="text-[10px] text-neutral-500">{b.service?.category}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-white text-sm">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="border-neutral-700 text-[10px]">
                        {b.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.isProcessedForPoints && b.pointsEarned > 0 ? (
                        <span className="font-extrabold gold-text-gradient text-xs">
                          +{b.pointsEarned} PTS
                        </span>
                      ) : b.serviceStatus === "REEMBOLSADO" ? (
                        <span className="text-red-400 font-semibold text-xs">REVERTIDO</span>
                      ) : (
                        <span className="text-neutral-500 text-xs">0 pts</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(b.serviceStatus)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {b.serviceStatus !== "REEMBOLSADO" && b.isProcessedForPoints && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRefundModal(b)}
                          title="Revertir Puntos y Reembolsar"
                          className="h-7 text-xs text-red-400 hover:bg-red-950/40"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Revertir
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Register Consumption */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Registrar Nuevo Consumo / Servicio"
        description="Al marcar como Completado y Pagado, el servidor acreditará los puntos automáticamente en el libro mayor."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBooking} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Cliente VIP *
            </label>
            <select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
            >
              <option value="">-- Seleccionar Cliente --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.firstName} {c.lastName} ({c.tier?.name} - {c.currentPoints} pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Servicio / Destino *
            </label>
            <select
              required
              value={formData.serviceId}
              onChange={(e) => handleServiceSelect(e.target.value)}
              className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
            >
              <option value="">-- Seleccionar Servicio --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - Ref: S/ {s.referencePrice} (x{s.pointsMultiplier} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Importe Total (S/) *
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="200.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Método de Pago *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="TRANSFERENCIA_BANCARIA">Transferencia Bancaria</option>
                <option value="TARJETA">Tarjeta de Débito / Crédito</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Estado del Servicio
              </label>
              <select
                value={formData.serviceStatus}
                onChange={(e) => setFormData({ ...formData, serviceStatus: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="COMPLETADO">Completado (Acredita Puntos)</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Estado del Pago
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="PAGADO">Pagado</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                N° de Operación / Referencia
              </label>
              <Input
                placeholder="Ej. OP-984210"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Fecha del Servicio
              </label>
              <Input
                type="datetime-local"
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Observaciones / Pasajeros
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
              placeholder="Detalles adicionales, conductor asignado, etc..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Registrar y Acreditar Puntos
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Refund / Revert */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        title="Reversión de Consumo y Puntos"
        description="Esta acción descontará los puntos acreditados del cliente y registrará una transacción de reversión en el libro de auditoría."
        maxWidth="md"
      >
        <form onSubmit={handleRefund} className="space-y-4 pt-2">
          {selectedBooking && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs space-y-1">
              <p className="font-bold text-white">Consumo: {selectedBooking.code}</p>
              <p className="text-neutral-300">Cliente: {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}</p>
              <p className="text-neutral-300">Monto: {formatCurrency(selectedBooking.amount)}</p>
              <p className="text-red-400 font-bold">Puntos a revertir: -{selectedBooking.pointsEarned} PTS</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Motivo del Reembolso o Cancelación *
            </label>
            <textarea
              required
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Ej. Servicio cancelado a solicitud del cliente por reprogramación de vuelo..."
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setRefundModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive">
              Confirmar Reversión
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

