"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Briefcase,
  DollarSign,
  Coins,
  TicketCheck,
  TrendingUp,
  Award,
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  PlusCircle,
  QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPoints, formatDate, formatRelativeDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { QRScannerModal } from "@/components/qr/QRScannerModal";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pointsIssued: 0,
    pointsRedeemed: 0,
    pendingRedemptions: 0,
  };

  const charts = data?.charts || {
    tierDistribution: [],
    topServices: [],
    monthlyTrends: [],
  };

  const recent = data?.recent || {
    customers: [],
    bookings: [],
    redemptions: [],
  };

  const TIER_COLORS: Record<string, string> = {
    BRONZE: "#CD7F32",
    SILVER: "#9CA3AF",
    GOLD: "#D4AF37",
    PLATINUM: "#E5E7EB",
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#181818] via-[#121212] to-[#1A1A1A] p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Sistema de Fidelización Digital
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Panel de Control General
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Métricas en tiempo real sobre clientes, consumos y libro de puntos de Luxury Private Travel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="gold"
            onClick={() => setScannerOpen(true)}
            className="gap-1.5 shadow-gold-sm"
          >
            <QrCode className="h-4 w-4" />
            <span>Escanear Tarjeta</span>
          </Button>

          <Link href="/admin/consumos">
            <Button variant="secondary" className="gap-1.5 border-neutral-700">
              <PlusCircle className="h-4 w-4 text-[#D4AF37]" />
              <span>Registrar Consumo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clientes */}
        <Card className="luxury-border-glow transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Total Clientes VIP
            </CardTitle>
            <div className="rounded-lg bg-[#D4AF37]/10 p-2 text-[#D4AF37]">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{kpis.totalCustomers}</div>
            <p className="mt-1 text-xs text-neutral-400 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{kpis.activeCustomers} activos</span>
              <span>•</span>
              <span className="text-[#D4AF37]">+{kpis.newCustomersThisMonth} este mes</span>
            </p>
          </CardContent>
        </Card>

        {/* Ventas Acumuladas */}
        <Card className="luxury-border-glow transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Ventas Acumuladas
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {kpis.totalBookings} servicios completados
            </p>
          </CardContent>
        </Card>

        {/* Puntos Emitidos */}
        <Card className="luxury-border-glow transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Puntos Emitidos
            </CardTitle>
            <div className="rounded-lg bg-[#D4AF37]/15 p-2 text-[#D4AF37]">
              <Coins className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black gold-text-gradient">
              {kpis.pointsIssued.toLocaleString("es-PE")} PTS
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {kpis.pointsRedeemed.toLocaleString("es-PE")} canjeados en beneficios
            </p>
          </CardContent>
        </Card>

        {/* Canjes Pendientes */}
        <Card className="luxury-border-glow transition-all hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Canjes Pendientes
            </CardTitle>
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
              <TicketCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-white">{kpis.pendingRedemptions}</div>
            <p className="mt-1 text-xs text-neutral-400 flex items-center justify-between">
              <span>Por validar o atender</span>
              <Link href="/admin/canjes" className="text-[#D4AF37] hover:underline">
                Revisar →
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue & Points Evolution (8 cols) */}
        <Card className="lg:col-span-8 border-neutral-800 bg-[#121212]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-white">Evolución de Consumos e Ingresos</CardTitle>
                <CardDescription>Comportamiento mensual de ventas y servicios contratados</CardDescription>
              </div>
              <Badge variant="outline" className="border-neutral-700 text-xs">
                Soles (PEN)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {charts.monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#71717A" fontSize={12} tickLine={false} />
                    <YAxis stroke="#71717A" fontSize={12} tickLine={false} tickFormatter={(v) => `S/${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181B",
                        borderColor: "#D4AF37",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value: any) => [`S/ ${value}`, "Ventas"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="ventas"
                      stroke="#D4AF37"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorVentas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                  Sin datos suficientes para graficar
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tier Distribution (4 cols) */}
        <Card className="lg:col-span-4 border-neutral-800 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-base text-white">Distribución de Niveles VIP</CardTitle>
            <CardDescription>Segmentación de socios por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.tierDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {charts.tierDistribution.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TIER_COLORS[entry.name.toUpperCase()] || "#D4AF37"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      borderColor: "#333",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {charts.tierDistribution.map((t: any) => (
                <div key={t.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: TIER_COLORS[t.name.toUpperCase()] || "#D4AF37" }}
                  />
                  <span className="text-neutral-400">{t.name}:</span>
                  <span className="font-bold text-white">{t.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services Bar Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Services (6 cols) */}
        <Card className="lg:col-span-6 border-neutral-800 bg-[#121212]">
          <CardHeader>
            <CardTitle className="text-base text-white">Servicios Más Solicitados</CardTitle>
            <CardDescription>Top rutas y servicios de transporte contratados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topServices} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#71717A" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#A1A1AA" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      borderColor: "#D4AF37",
                      borderRadius: "8px",
                    }}
                    formatter={(val: any, name: any) => [val, "Servicios contratados"]}
                  />
                  <Bar dataKey="bookingsCount" fill="#D4AF37" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity: Consumos y Clientes (6 cols) */}
        <Card className="lg:col-span-6 border-neutral-800 bg-[#121212]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base text-white">Consumos Recientes</CardTitle>
              <CardDescription>Últimos servicios registrados en la plataforma</CardDescription>
            </div>
            <Link href="/admin/consumos" className="text-xs text-[#D4AF37] hover:underline">
              Ver todos →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent.bookings.length > 0 ? (
                recent.bookings.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white">
                        {b.customer?.firstName} {b.customer?.lastName}
                      </p>
                      <p className="text-neutral-400 text-[11px]">{b.service?.name}</p>
                      <p className="text-[10px] text-neutral-500">
                        {formatRelativeDate(b.bookingDate)} • {b.code}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">{formatCurrency(b.amount)}</span>
                      <p className="text-[10px] text-[#D4AF37] font-semibold">
                        +{b.pointsEarned} PTS
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 py-4 text-center">No hay consumos recientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={(clientData) => {
          router.push(`/admin/clientes?search=${encodeURIComponent(clientData.customer.docNumber)}`);
        }}
      />
    </div>
  );
}

