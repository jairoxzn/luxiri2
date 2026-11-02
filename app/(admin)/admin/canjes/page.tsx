"use client";

import React, { useEffect, useState } from "react";
import { TicketCheck, Search, Check, X, QrCode, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function CanjesAdminPage() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Validate Code Form
  const [manualCode, setManualCode] = useState("");
  const [validating, setValidating] = useState(false);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchRedemptions();
  }, [statusFilter]);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/redemptions?${params.toString()}`);
      const json = await res.json();
      setRedemptions(json.redemptions || []);
    } catch (e) {
      toast.error("Error al cargar canjes");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setValidating(true);
    try {
      const res = await fetch("/api/redemptions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: manualCode.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setManualCode("");
      fetchRedemptions();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setValidating(false);
    }
  };

  const handleApprove = async (redemptionId: string) => {
    try {
      const res = await fetch(`/api/redemptions/${redemptionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      fetchRedemptions();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRedemption) return;

    try {
      const res = await fetch(`/api/redemptions/${selectedRedemption.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          reason: rejectReason,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setRejectModalOpen(false);
      setRejectReason("");
      fetchRedemptions();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openReject = (r: any) => {
    setSelectedRedemption(r);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETADO":
        return <Badge variant="success">Completado / Aplicado</Badge>;
      case "APROBADO":
        return <Badge variant="gold">Aprobado / Listo para Canje</Badge>;
      case "PENDIENTE":
        return <Badge variant="secondary">Pendiente de Aprobación</Badge>;
      case "RECHAZADO":
        return <Badge variant="destructive">Rechazado (Puntos devueltos)</Badge>;
      case "CANCELADO":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtered = redemptions.filter((r) =>
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.customer?.firstName.toLowerCase().includes(search.toLowerCase()) ||
    r.customer?.lastName.toLowerCase().includes(search.toLowerCase()) ||
    r.reward?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <TicketCheck className="h-6 w-6 text-[#D4AF37]" />
            <span>Gestión y Validación de Canjes VIP</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Aprobación de solicitudes de recompensas y canje directo en counter o servicio.
          </p>
        </div>
      </div>

      {/* Quick Voucher Validation Card */}
      <Card className="luxury-border-glow bg-gradient-to-r from-[#1A1A1A] to-[#121212]">
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleValidateCode} className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="h-4 w-4 text-[#D4AF37]" />
              <span>Validar Cupón de Canje de Pasajero</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Ingresa el código único (ej. <code className="text-[#D4AF37]">CJ-123456</code>) o el token QR entregado por el cliente.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Input
                placeholder="Código del voucher (ej. CJ-883921)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="bg-[#181818] font-mono"
              />
              <Button
                type="submit"
                variant="gold"
                disabled={validating || !manualCode.trim()}
                className="shrink-0 gap-1.5 shadow-gold-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{validating ? "Validando..." : "Validar y Aplicar Beneficio"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter and Search */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar por código de canje, cliente o recompensa..."
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
                <option value="PENDIENTE">Pendientes</option>
                <option value="APROBADO">Aprobados (Listos)</option>
                <option value="COMPLETADO">Completados</option>
                <option value="RECHAZADO">Rechazados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redemptions Table */}
      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Código Canje</th>
                <th className="py-3 px-4">Fecha Solicitud</th>
                <th className="py-3 px-4">Cliente VIP</th>
                <th className="py-3 px-4">Recompensa Solicitada</th>
                <th className="py-3 px-4 text-center">Puntos Canjeados</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    Cargando canjes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No se encontraron canjes registrados.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                      {r.code}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {formatDate(r.requestedAt, "dd/MM/yy HH:mm")}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">
                        {r.customer?.firstName} {r.customer?.lastName}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {r.customer?.code} • {r.customer?.tier?.name}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{r.reward?.name}</p>
                      <p className="text-[10px] text-neutral-500">{r.reward?.category}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-black gold-text-gradient text-sm">
                      -{r.pointsSpent} PTS
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {r.status === "PENDIENTE" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(r.id)}
                              className="h-7 text-xs text-emerald-400 hover:bg-emerald-950/40"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openReject(r)}
                              className="h-7 text-xs text-red-400 hover:bg-red-950/40"
                            >
                              <X className="h-3.5 w-3.5 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {r.status === "APROBADO" && (
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => {
                              setManualCode(r.code);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="h-7 text-xs"
                          >
                            Validar Ahora
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Reject Redemption */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Rechazar Canje de Recompensa"
        description="Al rechazar, los puntos reservados serán reintegrados al saldo del cliente automáticamente."
        maxWidth="md"
      >
        <form onSubmit={handleReject} className="space-y-4 pt-2">
          {selectedRedemption && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 text-xs space-y-1">
              <p className="font-semibold text-white">Canje: {selectedRedemption.code}</p>
              <p className="text-neutral-400">Recompensa: {selectedRedemption.reward?.name}</p>
              <p className="text-emerald-400 font-semibold">Se devolverán: +{selectedRedemption.pointsSpent} PTS al cliente</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Motivo del Rechazo *
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Indique el motivo (ej. Sin cupos disponibles en fecha solicitada)..."
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive">
              Confirmar Rechazo y Devolver Puntos
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

