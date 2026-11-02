"use client";

import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Gift,
  Coins,
  History,
  Tag,
  User,
  Crown,
  Sparkles,
  Award,
  Shield,
  Download,
  Maximize2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Lock,
  ChevronRight,
  Briefcase,
  TicketCheck,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { DigitalLoyaltyCard } from "@/components/cards/DigitalLoyaltyCard";
import { QRViewerModal } from "@/components/qr/QRViewerModal";
import { formatCurrency, formatPoints, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import CustomerBottomNav from "@/components/layout/CustomerBottomNav";

export default function CustomerPortalPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [customer, setCustomer] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [qrViewerOpen, setQrViewerOpen] = useState(false);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [redeemNotes, setRedeemNotes] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemedVoucher, setRedeemedVoucher] = useState<any>(null);

  // Profile Edit State
  const [profileData, setProfileData] = useState({
    phone: "",
    address: "",
    district: "",
    city: "Arequipa",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchCustomerProfile();
    fetchAux();
  }, []);

  const fetchCustomerProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.user?.customer) {
        // Fetch detailed profile
        const detRes = await fetch(`/api/customers/${json.user.customer.id}`);
        const detJson = await detRes.json();
        setCustomer(detJson.customer);
        setProfileData((prev) => ({
          ...prev,
          phone: detJson.customer.phone || "",
          address: detJson.customer.address || "",
          district: detJson.customer.district || "",
          city: detJson.customer.city || "Arequipa",
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAux = async () => {
    try {
      const [resTiers, resRew, resPromo] = await Promise.all([
        fetch("/api/tiers"),
        fetch("/api/rewards?active=true"),
        fetch("/api/promotions?active=true"),
      ]);
      const jsonTiers = await resTiers.json();
      const jsonRew = await resRew.json();
      const jsonPromo = await resPromo.json();

      setTiers(jsonTiers.tiers || []);
      setRewards(jsonRew.rewards || []);
      setPromotions(jsonPromo.promotions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRedeemReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward || !customer) return;

    setRedeeming(true);
    try {
      const res = await fetch("/api/redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          customerId: customer.id,
          notes: redeemNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Trigger Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#F2D675", "#FFFFFF"],
      });

      toast.success(json.message);
      setRedeemedVoucher(json.redemption);
      setRedeemModalOpen(false);

      // Refresh customer profile to show deducted balance
      fetchCustomerProfile();
      setActiveTab("canjes");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRedeeming(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profileData.phone,
          address: profileData.address,
          district: profileData.district,
          city: profileData.city,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Perfil actualizado con éxito");
      fetchCustomerProfile();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error("Las nuevas contraseñas no coinciden");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email,
          newPassword: profileData.newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Contraseña actualizada exitosamente");
      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Tier Progression Calculation
  const currentTierOrder = customer?.tier?.orderIndex || 1;
  const nextTier = tiers.find((t) => t.orderIndex === currentTierOrder + 1);
  const currentSpent = Number(customer?.totalSpent || 0);
  const targetSpent = nextTier ? Number(nextTier.minSpend) : currentSpent;
  const progressPercent = nextTier
    ? Math.min(100, Math.round((currentSpent / targetSpent) * 100))
    : 100;
  const spentRemaining = nextTier ? Math.max(0, targetSpent - currentSpent) : 0;

  if (loading && !customer) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-400">
        <Sparkles className="h-6 w-6 animate-spin text-[#D4AF37] mr-2" />
        <span>Cargando tu portal VIP...</span>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Inicio", icon: Compass },
    { id: "tarjeta", label: "Mi Tarjeta Digital", icon: CreditCard },
    { id: "puntos", label: "Mis Puntos", icon: Coins },
    { id: "servicios", label: "Mis Servicios", icon: Briefcase },
    { id: "recompensas", label: "Recompensas", icon: Gift },
    { id: "canjes", label: "Mis Canjes", icon: TicketCheck },
    { id: "promociones", label: "Promociones", icon: Tag },
    { id: "perfil", label: "Mi Perfil", icon: User },
  ];

  return (
    <div className="space-y-6 pb-28 sm:pb-32">

      {/* TAB: DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Personalized VIP Welcome Card */}
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#181818] via-[#121212] to-[#1A1A1A] p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  Programa Luxury Rewards VIP
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  ¡Bienvenido, {customer.firstName}!
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
                  Disfruta de beneficios exclusivos por cada viaje privado, tour o traslado corporativo con Luxury Private Travel.
                </p>
              </div>

              {/* Quick Points Pill */}
              <div className="flex items-center gap-4 bg-black/50 border border-neutral-800 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">
                    Puntos Disponibles
                  </span>
                  <p className="text-3xl font-black gold-text-gradient">
                    {customer.currentPoints.toLocaleString("es-PE")}
                  </p>
                </div>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => setActiveTab("recompensas")}
                  className="gap-1 shadow-gold-sm"
                >
                  <Gift className="h-4 w-4" />
                  <span>Canjear</span>
                </Button>
              </div>
            </div>

            {/* VIP Tier Progress Bar */}
            <div className="mt-6 border-t border-neutral-800 pt-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="gold">Nivel Actual: {customer.tier?.name}</Badge>
                  {nextTier && (
                    <span className="text-neutral-400">
                      → Próximo nivel: <strong className="text-white">{nextTier.name}</strong>
                    </span>
                  )}
                </div>
                {nextTier ? (
                  <span className="text-neutral-400">
                    Faltan <strong>{formatCurrency(spentRemaining)}</strong> en consumos
                  </span>
                ) : (
                  <span className="text-[#D4AF37] font-semibold">¡Has alcanzado el nivel máximo Platinum!</span>
                )}
              </div>

              <div className="w-full bg-neutral-900 rounded-full h-2.5 overflow-hidden border border-neutral-800">
                <div
                  className="bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#D4AF37] h-2.5 rounded-full transition-all duration-500 shadow-gold-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid: Digital Card & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Digital Card Preview (6 cols) */}
            <div className="lg:col-span-6">
              <Card className="border-neutral-800 bg-[#121212]">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-white">Tu Tarjeta Digital</CardTitle>
                    <CardDescription className="text-xs">
                      Preséntala desde tu celular en cada servicio
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("tarjeta")}
                    className="text-xs text-[#D4AF37]"
                  >
                    Ver detalles →
                  </Button>
                </CardHeader>
                <CardContent>
                  <DigitalLoyaltyCard
                    customer={customer}
                    card={customer.card}
                    onEnlargeQR={() => setQrViewerOpen(true)}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Recent Services & Points Movements (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Last Services */}
              <Card className="border-neutral-800 bg-[#121212]">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-white">Últimos Viajes Contratados</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("servicios")}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Ver todos →
                  </Button>
                </CardHeader>
                <CardContent>
                  {customer.bookings && customer.bookings.length > 0 ? (
                    <div className="space-y-2.5">
                      {customer.bookings.slice(0, 3).map((b: any) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">{b.service?.name}</p>
                            <p className="text-[10px] text-neutral-400">
                              {formatDate(b.bookingDate, "dd/MM/yyyy")} • {b.code}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-white">{formatCurrency(b.amount)}</span>
                            <p className="text-[10px] text-[#D4AF37] font-semibold">
                              +{b.pointsEarned} PTS
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 py-3 text-center">
                      Aún no tienes servicios registrados
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Last Point Movements */}
              <Card className="border-neutral-800 bg-[#121212]">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-white">Movimientos Recientes de Puntos</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("puntos")}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Ver ledger →
                  </Button>
                </CardHeader>
                <CardContent>
                  {customer.pointTransactions && customer.pointTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {customer.pointTransactions.slice(0, 3).map((t: any) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-800/60 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-white truncate max-w-xs">{t.concept}</p>
                            <p className="text-[10px] text-neutral-500">{formatDate(t.createdAt, "dd/MM/yy HH:mm")}</p>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${t.points > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {t.points > 0 ? `+${t.points}` : t.points} PTS
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 py-3 text-center">Sin movimientos de puntos aún</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MI TARJETA DIGITAL */}
      {activeTab === "tarjeta" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-neutral-800 bg-[#121212]">
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-bold text-white">Tu Tarjeta VIP Luxury Rewards</CardTitle>
              <CardDescription className="text-xs">
                Presenta el código QR al chofer o ejecutivo al inicio de tu servicio para registrar y acumular puntos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-8">
              <DigitalLoyaltyCard
                customer={customer}
                card={customer.card}
                onEnlargeQR={() => setQrViewerOpen(true)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: MIS PUNTOS & SERVICIOS */}
      {(activeTab === "puntos" || activeTab === "servicios") && (
        <div className="space-y-6">
          {/* Sub-tabs switcher */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("puntos")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "puntos"
                  ? "bg-[#D4AF37] text-black shadow-gold-sm"
                  : "text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-900"
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>Balance y Movimientos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("servicios")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "servicios"
                  ? "bg-[#D4AF37] text-black shadow-gold-sm"
                  : "text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-900"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Historial de Viajes ({customer.bookings?.length || 0})</span>
            </button>
          </div>

          {activeTab === "puntos" && (
            <div className="space-y-6">
              {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="luxury-border-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-neutral-400">
                  Saldo Disponible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black gold-text-gradient">
                  {customer.currentPoints.toLocaleString("es-PE")} PTS
                </div>
                <p className="text-xs text-neutral-400 mt-1">Listos para canjear por premios</p>
              </CardContent>
            </Card>

            <Card className="luxury-border-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-neutral-400">
                  Puntos Históricos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">
                  {customer.lifetimePoints.toLocaleString("es-PE")} PTS
                </div>
                <p className="text-xs text-neutral-400 mt-1">Acumulados desde tu inscripción</p>
              </CardContent>
            </Card>

            <Card className="luxury-border-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-neutral-400">
                  Gasto Total Acumulado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white">
                  {formatCurrency(customer.totalSpent)}
                </div>
                <p className="text-xs text-neutral-400 mt-1">Determina tu categoría VIP</p>
              </CardContent>
            </Card>
          </div>

          {/* Full Transactions Ledger */}
          <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base text-white">Libro de Movimientos de Puntos</CardTitle>
              <CardDescription>Detalle inmutable de acreditaciones, canjes y beneficios aplicados</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Concepto</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-right">Puntos</th>
                    <th className="py-3 px-4 text-right">Saldo Tras Movimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {customer.pointTransactions?.map((t: any) => (
                    <tr key={t.id} className="hover:bg-neutral-900/50">
                      <td className="py-3 px-4 text-neutral-400">{formatDate(t.createdAt, "dd/MM/yyyy HH:mm")}</td>
                      <td className="py-3 px-4 text-white font-medium">{t.concept}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={t.points > 0 ? "text-emerald-400" : "text-red-400"}>
                          {t.points > 0 ? `+${t.points}` : t.points} PTS
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black gold-text-gradient">
                        {t.balanceAfter} PTS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: MIS SERVICIOS */}
      {activeTab === "servicios" && (
        <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base text-white">Historial de Viajes y Servicios Contratados</CardTitle>
            <CardDescription>Registro de servicios realizados con Luxury Private Travel</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Servicio / Destino</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                  <th className="py-3 px-4">Método Pago</th>
                  <th className="py-3 px-4 text-center">Puntos Ganados</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {customer.bookings && customer.bookings.length > 0 ? (
                  customer.bookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-neutral-900/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{b.code}</td>
                      <td className="py-3 px-4 text-neutral-300">{formatDate(b.bookingDate, "dd/MM/yyyy HH:mm")}</td>
                      <td className="py-3 px-4 text-white font-medium">{b.service?.name}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">{formatCurrency(b.amount)}</td>
                      <td className="py-3 px-4"><Badge variant="outline">{b.paymentMethod}</Badge></td>
                      <td className="py-3 px-4 text-center font-bold gold-text-gradient">+{b.pointsEarned} PTS</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="success">{b.serviceStatus}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      No tienes servicios registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
        </div>
      )}

      {/* TAB: RECOMPENSAS & CANJES */}
      {(activeTab === "recompensas" || activeTab === "canjes") && (
        <div className="space-y-6">
          {/* Sub-tabs switcher */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("recompensas")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "recompensas"
                  ? "bg-[#D4AF37] text-black shadow-gold-sm"
                  : "text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-900"
              }`}
            >
              <Gift className="h-4 w-4" />
              <span>Catálogo de Premios</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("canjes")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "canjes"
                  ? "bg-[#D4AF37] text-black shadow-gold-sm"
                  : "text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-900"
              }`}
            >
              <TicketCheck className="h-4 w-4" />
              <span>Mis Cupones Canjeados ({customer.redemptions?.length || 0})</span>
            </button>
          </div>

          {activeTab === "recompensas" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Catálogo de Recompensas Exclusivas</h3>
              <p className="text-xs text-neutral-400">
                Canjea tus puntos acumulados por bonos de descuento, upgrades de vehículo o traslados gratuitos.
              </p>
            </div>
            <div className="bg-[#181818] border border-neutral-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-neutral-400 mr-2">Tus Puntos:</span>
              <strong className="gold-text-gradient font-black text-sm">{customer.currentPoints} PTS</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewards.map((r) => {
              const canAfford = customer.currentPoints >= r.pointsRequired;
              const hasTier = !r.minTier || (customer.tier && customer.tier.orderIndex >= r.minTier.orderIndex);

              return (
                <Card
                  key={r.id}
                  className={`border-neutral-800 bg-[#121212] flex flex-col justify-between transition-all hover:border-[#D4AF37]/50 ${
                    !canAfford && "opacity-75"
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
                      {r.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-3">
                      <span>Stock: {r.stock} u.</span>
                      <span>{canAfford ? "Disponible" : `Faltan ${r.pointsRequired - customer.currentPoints} pts`}</span>
                    </div>

                    <Button
                      variant={canAfford && hasTier ? "gold" : "outline"}
                      disabled={!canAfford || !hasTier || r.stock <= 0}
                      onClick={() => {
                        setSelectedReward(r);
                        setRedeemNotes("");
                        setRedeemModalOpen(true);
                      }}
                      className="w-full text-xs font-bold"
                    >
                      {!hasTier
                        ? `Requiere Nivel ${r.minTier?.name}`
                        : !canAfford
                        ? "Puntos Insuficientes"
                        : "Canjear Ahora"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: MIS CANJES */}
      {activeTab === "canjes" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Mis Cupones y Beneficios Canjeados</h3>
            <p className="text-xs text-neutral-400">
              Muestra el código de canje al chofer u operador para que aplique tu descuento o beneficio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customer.redemptions && customer.redemptions.length > 0 ? (
              customer.redemptions.map((red: any) => (
                <Card
                  key={red.id}
                  className={`border-neutral-800 bg-[#141414] transition-all ${
                    red.status === "APROBADO" ? "luxury-border-glow" : ""
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#D4AF37]">
                        {red.code}
                      </span>
                      <Badge
                        variant={
                          red.status === "COMPLETADO"
                            ? "success"
                            : red.status === "APROBADO"
                            ? "gold"
                            : "outline"
                        }
                      >
                        {red.status}
                      </Badge>
                    </div>

                    <CardTitle className="text-sm font-bold text-white mt-2">
                      {red.reward?.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {red.reward?.category} • -{red.pointsSpent} PTS
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2 text-xs border-t border-neutral-800/80 space-y-2">
                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Solicitado:</span>
                      <span>{formatDate(red.requestedAt, "dd/MM/yyyy HH:mm")}</span>
                    </div>

                    {red.status === "APROBADO" && (
                      <div className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 p-2.5 text-center">
                        <span className="text-[10px] uppercase font-bold text-[#D4AF37] block">
                          Código de Validación para Operador
                        </span>
                        <p className="text-base font-mono font-black text-white mt-0.5">
                          {red.code}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-xs text-neutral-500">
                Aún no has canjeado recompensas. Ve a la pestaña de Recompensas para canjear tus puntos.
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      )}

      {/* TAB: MI PERFIL & PROMOCIONES */}
      {(activeTab === "perfil" || activeTab === "promociones") && (
        <div className="space-y-6">
          {/* Sub-tabs switcher */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("perfil")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "perfil"
                  ? "bg-[#D4AF37] text-black shadow-gold-sm"
                  : "text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-900"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Información y Seguridad</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("promociones")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "promociones"
                  ? "bg-[#D4AF37] text-black shadow-gold-sm"
                  : "text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-900"
              }`}
            >
              <Tag className="h-4 w-4" />
              <span>Promociones VIP Activas ({promotions.length})</span>
            </button>
          </div>

          {/* TAB: PROMOCIONES */}
          {activeTab === "promociones" && (
            <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Promociones y Campañas Activas</h3>
            <p className="text-xs text-neutral-400">
              Aprovecha estas campañas especiales para acumular puntos dobles o bonos de cortesía.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((p) => (
              <Card key={p.id} className="luxury-border-glow bg-[#121212]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="gold" className="text-[10px]">{p.promoType}</Badge>
                    <span className="text-[10px] text-emerald-400 font-semibold">Campaña Activa</span>
                  </div>
                  <CardTitle className="text-base font-bold text-white mt-2 leading-snug">
                    {p.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {p.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs border-t border-neutral-800/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Beneficio:</span>
                    <span className="font-extrabold gold-text-gradient text-sm">
                      {p.multiplier > 1.0 ? `x${p.multiplier} Puntos` : `+${p.bonusPoints} Puntos`}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Vigente hasta el {formatDate(p.endDate, "dd/MM/yyyy")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB: MI PERFIL */}
      {activeTab === "perfil" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Edit Contact Details */}
          <Card className="border-neutral-800 bg-[#121212]">
            <CardHeader>
              <CardTitle className="text-base text-white">Información de Contacto</CardTitle>
              <CardDescription className="text-xs">
                Actualiza tu teléfono y dirección para tus servicios de traslado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">Nombre Completo</label>
                  <Input disabled value={`${customer.firstName} ${customer.lastName}`} className="bg-neutral-900/60" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Documento de Identidad</label>
                  <Input disabled value={`${customer.docType}: ${customer.docNumber}`} className="bg-neutral-900/60 font-mono" />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Correo Electrónico</label>
                  <Input disabled value={customer.email} className="bg-neutral-900/60" />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Teléfono / WhatsApp *</label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-300 mb-1">Dirección</label>
                    <Input
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 mb-1">Distrito</label>
                    <Input
                      value={profileData.district}
                      onChange={(e) => setProfileData({ ...profileData, district: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" variant="gold" className="w-full font-bold">
                  Guardar Datos de Contacto
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-neutral-800 bg-[#121212]">
            <CardHeader>
              <CardTitle className="text-base text-white">Seguridad de la Cuenta</CardTitle>
              <CardDescription className="text-xs">
                Modifica tu contraseña de acceso al portal web
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-300 mb-1">Nueva Contraseña</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Confirmar Nueva Contraseña</label>
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={profileData.confirmPassword}
                    onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                  />
                </div>

                <Button type="submit" variant="goldOutline" className="w-full font-bold">
                  Cambiar Contraseña
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
        </div>
      )}

      {/* Modal: Confirm Reward Redemption */}
      <Modal
        isOpen={redeemModalOpen}
        onClose={() => setRedeemModalOpen(false)}
        title={selectedReward ? `Canjear: ${selectedReward.name}` : "Confirmar Canje"}
        description="Se descontarán los puntos de tu saldo y se emitirá tu cupón con código de validación instantáneo."
        maxWidth="md"
      >
        <form onSubmit={handleRedeemReward} className="space-y-4 pt-2">
          {selectedReward && (
            <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#1C1C1C] to-[#101010] p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Puntos a deducir:</span>
                <span className="text-lg font-black gold-text-gradient">-{selectedReward.pointsRequired} PTS</span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-800 pt-2">
                <span className="text-neutral-400">Tu saldo posterior:</span>
                <span className="font-bold text-white">{customer.currentPoints - selectedReward.pointsRequired} PTS</span>
              </div>
              {selectedReward.terms && (
                <p className="text-[11px] text-neutral-400 italic pt-1">
                  Condiciones: {selectedReward.terms}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Comentarios o Fecha Estimada de Uso (Opcional)
            </label>
            <Input
              value={redeemNotes}
              onChange={(e) => setRedeemNotes(e.target.value)}
              placeholder="Ej. Para viaje de este fin de semana..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setRedeemModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold" disabled={redeeming} className="shadow-gold">
              {redeeming ? "Canjeando..." : "Confirmar Canje de Puntos"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Fullscreen QR Viewer */}
      {customer && (
        <QRViewerModal
          isOpen={qrViewerOpen}
          onClose={() => setQrViewerOpen(false)}
          customer={{
            fullName: `${customer.firstName} ${customer.lastName}`,
            code: customer.code,
            tierName: customer.tier?.name || "BRONZE",
            currentPoints: customer.currentPoints,
          }}
          card={{
            cardNumber: customer.card?.cardNumber || "",
            qrCodeToken: customer.card?.qrCodeToken || "",
          }}
        />
      )}
      {/* Floating Curved Notch Bottom Navigation Bar */}
      <CustomerBottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}

