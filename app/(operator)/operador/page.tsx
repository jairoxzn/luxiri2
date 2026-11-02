"use client";

import React, { useEffect, useState } from "react";
import {
  Camera,
  Search,
  Plus,
  TicketCheck,
  CreditCard,
  History,
  CheckCircle2,
  DollarSign,
  User,
  Sparkles,
  RefreshCw,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import { DigitalLoyaltyCard } from "@/components/cards/DigitalLoyaltyCard";
import { formatCurrency, formatPoints, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function OperatorDashboardPage() {
  const [stats, setStats] = useState<any>({
    servicesToday: 0,
    activeRedemptions: 0,
    recentBookings: [],
  });
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search customer state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Active verified customer
  const [activeCustomer, setActiveCustomer] = useState<any>(null);

  // Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any>(null);

  // Validation Form
  const [redemptionCode, setRedemptionCode] = useState("");
  const [validatingRedemption, setValidatingRedemption] = useState(false);

  // Consumption Form
  const [bookingForm, setBookingForm] = useState({
    serviceId: "",
    amount: "",
    paymentMethod: "YAPE",
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchStats();
    fetchServices();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/operator/stats");
      const json = await res.json();
      setStats(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services?active=true");
      const json = await res.json();
      setServices(json.services || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(searchQuery.trim())}&limit=5`);
      const json = await res.json();
      setSearchResults(json.customers || []);
      if (!json.customers || json.customers.length === 0) {
        toast.info("No se encontró ningún cliente con ese criterio");
      }
    } catch (e) {
      toast.error("Error al buscar cliente");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectCustomer = async (cust: any) => {
    setActiveCustomer(cust);
    setSearchResults([]);
    setSearchQuery("");
    toast.success(`Cliente seleccionado: ${cust.firstName} ${cust.lastName}`);
  };

  const handleScanSuccess = (scanData: any) => {
    setActiveCustomer({
      ...scanData.customer,
      card: scanData.card,
    });
    toast.success(`Tarjeta escaneada con éxito: ${scanData.customer.fullName}`);
  };

  const handleServiceChange = (serviceId: string) => {
    const s = services.find((item) => item.id === serviceId);
    setBookingForm((prev) => ({
      ...prev,
      serviceId,
      amount: s ? s.referencePrice.toString() : prev.amount,
    }));
  };

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !bookingForm.serviceId || !bookingForm.amount) {
      toast.error("Por favor completa los datos del servicio");
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: activeCustomer.id,
          serviceId: bookingForm.serviceId,
          amount: bookingForm.amount,
          paymentMethod: bookingForm.paymentMethod,
          paymentStatus: "PAGADO",
          serviceStatus: "COMPLETADO",
          referenceNumber: bookingForm.referenceNumber,
          notes: bookingForm.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setRegisterModalOpen(false);

      // Refresh customer balance
      const custRes = await fetch(`/api/customers/${activeCustomer.id}`);
      const custJson = await custRes.json();
      if (custJson.customer) {
        setActiveCustomer(custJson.customer);
      }

      setBookingForm({
        serviceId: "",
        amount: "",
        paymentMethod: "YAPE",
        referenceNumber: "",
        notes: "",
      });

      fetchStats();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleValidateRedemption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redemptionCode.trim()) return;

    setValidatingRedemption(true);
    try {
      const res = await fetch("/api/redemptions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redemptionCode.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setRedemptionCode("");
      fetchStats();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setValidatingRedemption(false);
    }
  };

  const openHistory = async () => {
    if (!activeCustomer) return;
    try {
      const res = await fetch(`/api/customers/${activeCustomer.id}`);
      const json = await res.json();
      setCustomerHistory(json.customer);
      setHistoryModalOpen(true);
    } catch (e) {
      toast.error("Error al cargar historial");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Touch Actions & Shift KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Big Touch QR Scanner Button */}
        <button
          onClick={() => setScannerOpen(true)}
          className="group relative flex items-center justify-between overflow-hidden rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-br from-[#1C1C1C] via-[#121212] to-[#1C1C1C] p-5 shadow-gold text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
              Atención Inmediata
            </span>
            <h3 className="text-xl font-black text-white group-hover:text-[#F2D675] transition-colors">
              Escanear Tarjeta QR
            </h3>
            <p className="text-xs text-neutral-400">
              Cámara o lector de código de socio
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#9D7625] text-black shadow-gold-sm">
            <Camera className="h-7 w-7" />
          </div>
        </button>

        {/* Services Today KPI */}
        <Card className="luxury-border-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Servicios Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{stats.servicesToday}</div>
            <p className="text-xs text-neutral-400 mt-1">Registrados en tu turno</p>
          </CardContent>
        </Card>

        {/* Redemptions Pending KPI */}
        <Card className="luxury-border-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Canjes por Validar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black gold-text-gradient">{stats.activeRedemptions}</div>
            <p className="text-xs text-neutral-400 mt-1">Beneficios solicitados activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Search Passenger Bar */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-300">
              O Buscar Pasajero por DNI, Nombres o Teléfono:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej. 45892341, Rodrigo Morales, 984778899..."
                  className="pl-9 bg-[#181818]"
                />
              </div>
              <Button type="submit" variant="gold" disabled={searching} className="gap-1.5 shrink-0">
                <Search className="h-4 w-4" />
                <span>{searching ? "Buscando..." : "Buscar"}</span>
              </Button>
            </div>
          </form>

          {/* Search Results Dropdown/List */}
          {searchResults.length > 0 && (
            <div className="mt-3 divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-[#181818] overflow-hidden">
              {searchResults.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust)}
                  className="flex items-center justify-between p-3 text-xs hover:bg-neutral-800/80 cursor-pointer transition-colors"
                >
                  <div>
                    <p className="font-bold text-white">
                      {cust.firstName} {cust.lastName}
                    </p>
                    <p className="text-neutral-400 text-[11px]">
                      {cust.docType}: {cust.docNumber} • Tel: {cust.phone} • Socio: {cust.code}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge variant="gold">{cust.tier?.name}</Badge>
                    <span className="font-bold text-white">{cust.currentPoints} pts</span>
                    <Button size="sm" variant="goldOutline" className="h-7 text-xs">
                      Seleccionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Verified Customer Banner */}
      {activeCustomer ? (
        <Card className="border-2 border-[#D4AF37]/60 bg-gradient-to-br from-[#1A1A1A] via-[#121212] to-[#141414] shadow-gold">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Cliente VIP Activo y Verificado
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white">
                  {activeCustomer.fullName || `${activeCustomer.firstName} ${activeCustomer.lastName}`}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-300">
                  <span className="font-mono text-[#D4AF37]">Socio: {activeCustomer.code}</span>
                  <span>•</span>
                  <span>Doc: {activeCustomer.docNumber}</span>
                  <span>•</span>
                  <span>Tel: {activeCustomer.phone}</span>
                </div>
              </div>

              {/* Balance & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 p-4 rounded-xl border border-neutral-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">
                    Puntos Acumulados
                  </span>
                  <p className="text-3xl font-black gold-text-gradient">
                    {activeCustomer.currentPoints} PTS
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Nivel VIP: <span className="text-[#D4AF37] font-semibold">{activeCustomer.tier?.name}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="gold"
                    onClick={() => setRegisterModalOpen(true)}
                    className="gap-1.5 shadow-gold-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Registrar Consumo</span>
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={openHistory}
                    className="gap-1.5 border-neutral-700"
                  >
                    <History className="h-4 w-4 text-[#D4AF37]" />
                    <span>Ver Historial</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center text-neutral-500">
          <CreditCard className="h-10 w-10 mx-auto text-neutral-600 mb-2" />
          <p className="text-sm font-semibold text-neutral-400">Ningún cliente seleccionado</p>
          <p className="text-xs text-neutral-500 mt-1">
            Escanea una tarjeta o busca al pasajero arriba para registrar servicios o consultar beneficios.
          </p>
        </div>
      )}

      {/* Validate Voucher Code Card */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <TicketCheck className="h-4 w-4 text-[#D4AF37]" />
            <span>Validar Cupón de Canje de Pasajero</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Ingresa el código del cupón entregado por el pasajero para canjear su beneficio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleValidateRedemption} className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Código de canje (ej. CJ-883921)..."
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value)}
              className="bg-[#181818] font-mono text-sm"
            />
            <Button
              type="submit"
              variant="gold"
              disabled={validatingRedemption || !redemptionCode.trim()}
              className="shrink-0 gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{validatingRedemption ? "Validando..." : "Validar Beneficio"}</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Services Today */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-white">
            Últimos Servicios Registrados Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentBookings && stats.recentBookings.length > 0 ? (
            <div className="divide-y divide-neutral-800/80">
              {stats.recentBookings.map((b: any) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">
                      {b.customer?.firstName} {b.customer?.lastName}
                    </p>
                    <p className="text-neutral-400 text-[11px]">{b.service?.name}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">{b.code}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">{formatCurrency(b.amount)}</span>
                    <p className="text-[10px] text-[#D4AF37] font-bold">
                      +{b.pointsEarned} PTS
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-3 text-center">
              No se han registrado consumos el día de hoy
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal: QR Scanner */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Modal: Register Consumption for Active Customer */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={
          activeCustomer
            ? `Registrar Servicio a: ${activeCustomer.fullName || activeCustomer.firstName}`
            : "Registrar Consumo"
        }
        description="Se registrará el consumo y se acreditarán los puntos en el acto."
        maxWidth="md"
      >
        <form onSubmit={handleRegisterService} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Servicio / Destino *
            </label>
            <select
              required
              value={bookingForm.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
            >
              <option value="">-- Seleccionar Servicio --</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Ref: S/ {s.referencePrice})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Importe Total (S/) *
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={bookingForm.amount}
                onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Método de Pago *
              </label>
              <select
                value={bookingForm.paymentMethod}
                onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="YAPE">Yape</option>
                <option value="PLIN">Plin</option>
                <option value="TRANSFERENCIA_BANCARIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              N° Operación / Referencia
            </label>
            <Input
              placeholder="Ej. OP-984210"
              value={bookingForm.referenceNumber}
              onChange={(e) => setBookingForm({ ...bookingForm, referenceNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Observaciones
            </label>
            <textarea
              rows={2}
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
              placeholder="Notas del servicio..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Confirmar y Acreditar Puntos
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Customer History */}
      {customerHistory && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title={`Historial: ${customerHistory.firstName} ${customerHistory.lastName}`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center">
              <div>
                <span className="text-[10px] text-neutral-400">Nivel VIP</span>
                <p className="text-sm font-bold text-[#D4AF37]">{customerHistory.tier?.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400">Puntos Disponibles</span>
                <p className="text-sm font-black gold-text-gradient">{customerHistory.currentPoints} PTS</p>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400">Gasto Total</span>
                <p className="text-sm font-bold text-white">{formatCurrency(customerHistory.totalSpent)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-neutral-300 mb-2">Últimos Consumos Registrados:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customerHistory.bookings?.map((b: any) => (
                  <div key={b.id} className="p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-900/40 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{b.service?.name}</p>
                      <p className="text-[10px] text-neutral-500">{formatDate(b.bookingDate, "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(b.amount)}</p>
                      <p className="text-[10px] text-[#D4AF37]">+{b.pointsEarned} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

