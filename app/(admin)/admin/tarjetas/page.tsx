"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Search, Lock, Unlock, RefreshCw, Eye, ShieldCheck, QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { DigitalLoyaltyCard } from "@/components/cards/DigitalLoyaltyCard";
import { QRViewerModal } from "@/components/qr/QRViewerModal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TarjetasAdminPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [qrViewerOpen, setQrViewerOpen] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [search, statusFilter]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/cards?${params.toString()}`);
      const json = await res.json();
      setCards(json.cards || []);
    } catch (e) {
      toast.error("Error al cargar tarjetas");
    } finally {
      setLoading(false);
    }
  };

  const toggleCardStatus = async (card: any) => {
    const newStatus = card.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      fetchCards();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const regenerateQR = async (card: any) => {
    if (!confirm(`¿Regenerar credenciales QR para la tarjeta ${card.cardNumber}? El código QR anterior quedará invalidado.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REGENERATE_QR" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      fetchCards();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openPreview = (card: any) => {
    setSelectedCard(card);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-[#D4AF37]" />
          <span>Tarjetas Digitales y Credenciales QR</span>
        </h2>
        <p className="text-xs text-neutral-400">
          Supervisión de tarjetas de membresía emitidas, control de bloqueo y tokens criptográficos.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar por número de tarjeta, cliente o DNI..."
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
                <option value="ACTIVE">Activas</option>
                <option value="BLOCKED">Bloqueadas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards Table */}
      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">N° Tarjeta</th>
                <th className="py-3 px-4">Titular VIP</th>
                <th className="py-3 px-4">Nivel Membresía</th>
                <th className="py-3 px-4">Puntos</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4">Último Escaneo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    Cargando tarjetas...
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No se encontraron tarjetas digitales.
                  </td>
                </tr>
              ) : (
                cards.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">
                      {c.cardNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">
                        {c.customer?.firstName} {c.customer?.lastName}
                      </p>
                      <p className="text-[10px] text-neutral-400">{c.customer?.code}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="border-neutral-700">
                        {c.customer?.tier?.name}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-bold gold-text-gradient">
                      {c.customer?.currentPoints} PTS
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {formatDate(c.issuedAt, "dd/MM/yyyy")}
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {c.lastScannedAt ? formatDate(c.lastScannedAt, "dd/MM/yy HH:mm") : "Sin lecturas"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                            : "bg-red-950 text-red-400 border border-red-800/40"
                        }`}
                      >
                        {c.status === "ACTIVE" ? "Activa" : "Bloqueada"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPreview(c)}
                          title="Visualizar Tarjeta"
                          className="h-8 w-8 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => regenerateQR(c)}
                          title="Regenerar Token QR"
                          className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleCardStatus(c)}
                          title={c.status === "ACTIVE" ? "Bloquear Tarjeta" : "Activar Tarjeta"}
                          className={`h-8 w-8 ${
                            c.status === "ACTIVE"
                              ? "text-red-400 hover:bg-red-950/40"
                              : "text-emerald-400 hover:bg-emerald-950/40"
                          }`}
                        >
                          {c.status === "ACTIVE" ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Card Preview */}
      {selectedCard && (
        <Modal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={`Vista Previa: ${selectedCard.cardNumber}`}
          maxWidth="lg"
        >
          <div className="py-2">
            <DigitalLoyaltyCard
              customer={selectedCard.customer}
              card={selectedCard}
              onEnlargeQR={() => setQrViewerOpen(true)}
            />
          </div>
        </Modal>
      )}

      {/* Modal: QR Fullscreen */}
      {selectedCard && (
        <QRViewerModal
          isOpen={qrViewerOpen}
          onClose={() => setQrViewerOpen(false)}
          customer={{
            fullName: `${selectedCard.customer?.firstName} ${selectedCard.customer?.lastName}`,
            code: selectedCard.customer?.code || "",
            tierName: selectedCard.customer?.tier?.name || "BRONZE",
            currentPoints: selectedCard.customer?.currentPoints || 0,
          }}
          card={{
            cardNumber: selectedCard.cardNumber,
            qrCodeToken: selectedCard.qrCodeToken,
          }}
        />
      )}
    </div>
  );
}

