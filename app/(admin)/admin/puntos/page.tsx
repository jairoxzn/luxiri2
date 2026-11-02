"use client";

import React, { useEffect, useState } from "react";
import { Coins, Plus, Settings2, Search, ArrowUpRight, ArrowDownLeft, RotateCcw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PuntosAdminPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rule, setRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Modals
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // Forms
  const [adjustData, setAdjustData] = useState({
    customerId: "",
    points: "",
    concept: "",
    notes: "",
  });

  const [ruleData, setRuleData] = useState({
    spendPerPoint: "10.00",
    minSpend: "10.00",
    pointsExpiryMonths: "12",
  });

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const fetchInitial = async () => {
    try {
      const [resRule, resCust] = await Promise.all([
        fetch("/api/loyalty/rules"),
        fetch("/api/customers?limit=100"),
      ]);
      const jsonRule = await resRule.json();
      const jsonCust = await resCust.json();

      if (jsonRule.rule) {
        setRule(jsonRule.rule);
        setRuleData({
          spendPerPoint: jsonRule.rule.spendPerPoint.toString(),
          minSpend: jsonRule.rule.minSpend.toString(),
          pointsExpiryMonths: jsonRule.rule.pointsExpiryMonths.toString(),
        });
      }
      setCustomers(jsonCust.customers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await fetch(`/api/loyalty/points?${params.toString()}`);
      const json = await res.json();
      setTransactions(json.transactions || []);
    } catch (e) {
      toast.error("Error al cargar libro de puntos");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/loyalty/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setAdjustModalOpen(false);
      setAdjustData({ customerId: "", points: "", concept: "", notes: "" });
      fetchTransactions();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/loyalty/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setRule(json.rule);
      setRuleModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getTransactionBadge = (type: string, points: number) => {
    switch (type) {
      case "EARNED":
        return (
          <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
            <ArrowUpRight className="h-4 w-4" />
            +{points} PTS
          </span>
        );
      case "REDEEMED":
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[#D4AF37]">
            <ArrowDownLeft className="h-4 w-4" />
            {points} PTS
          </span>
        );
      case "REVERSED":
        return (
          <span className="inline-flex items-center gap-1 font-bold text-red-400">
            <RotateCcw className="h-4 w-4" />
            {points} PTS
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1 font-bold text-amber-400">
            {points > 0 ? `+${points}` : points} PTS
          </span>
        );
      default:
        return <span>{points} PTS</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Coins className="h-6 w-6 text-[#D4AF37]" />
            <span>Libro Mayor de Puntos (Ledger)</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Trazabilidad completa de acumulaciones, canjes, vencimientos y ajustes auditados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRuleModalOpen(true)}
            className="gap-1.5 border-neutral-700"
          >
            <Settings2 className="h-4 w-4 text-[#D4AF37]" />
            <span>Reglas de Acumulación</span>
          </Button>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setAdjustModalOpen(true)}
            className="gap-1.5 shadow-gold-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Ajuste Manual</span>
          </Button>
        </div>
      </div>

      {/* Current Active Rule Summary Card */}
      {rule && (
        <Card className="luxury-border-glow bg-gradient-to-r from-[#1A1A1A] to-[#121212]">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">
                Regla Activa del Programa
              </span>
              <p className="text-white font-semibold text-sm">
                Por cada S/ {Number(rule.spendPerPoint).toFixed(2)} de consumo = 1 Punto Luxury
              </p>
              <p className="text-neutral-400">
                Gasto mínimo calificado: S/ {Number(rule.minSpend).toFixed(2)} • Vigencia de lotes: {rule.pointsExpiryMonths} meses
              </p>
            </div>
            <Button
              variant="goldOutline"
              size="sm"
              onClick={() => setRuleModalOpen(true)}
              className="shrink-0"
            >
              Modificar Parámetros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">Filtrar por movimiento:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
          >
            <option value="ALL">Todos los Movimientos</option>
            <option value="EARNED">Acumulados (Consumos)</option>
            <option value="REDEEMED">Canjeados (Recompensas)</option>
            <option value="REVERSED">Revertidos (Reembolsos)</option>
            <option value="ADJUSTMENT">Ajustes Administrativos</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Cliente VIP</th>
                <th className="py-3 px-4">Tipo Movimiento</th>
                <th className="py-3 px-4">Concepto / Referencia</th>
                <th className="py-3 px-4 text-right">Puntos (+ / -)</th>
                <th className="py-3 px-4 text-right">Saldo Resultante</th>
                <th className="py-3 px-4 text-center">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    Cargando movimientos...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No hay movimientos registrados en el ledger.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 px-4 text-neutral-300 font-mono">
                      {formatDate(t.createdAt, "dd/MM/yy HH:mm:ss")}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">
                        {t.customer?.firstName} {t.customer?.lastName}
                      </p>
                      <p className="text-[10px] text-[#D4AF37]">{t.customer?.code}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="border-neutral-700 text-[10px]">
                        {t.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-white truncate">{t.concept}</p>
                      {t.referenceCode && (
                        <p className="text-[10px] text-neutral-500 font-mono">Ref: {t.referenceCode}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {getTransactionBadge(t.type, t.points)}
                    </td>
                    <td className="py-3 px-4 text-right font-black gold-text-gradient text-sm">
                      {t.balanceAfter.toLocaleString("es-PE")} PTS
                    </td>
                    <td className="py-3 px-4 text-center text-neutral-400">
                      {t.operator?.name || "Sistema Automático"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Manual Point Adjustment */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Ajuste Manual de Puntos"
        description="Esta operación modifica el saldo del cliente directamente y queda registrada con auditoría obligatoria."
        maxWidth="md"
      >
        <form onSubmit={handleAdjust} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Cliente VIP *
            </label>
            <select
              required
              value={adjustData.customerId}
              onChange={(e) => setAdjustData({ ...adjustData, customerId: e.target.value })}
              className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
            >
              <option value="">-- Seleccionar Socio --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.firstName} {c.lastName} (Saldo: {c.currentPoints} pts)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Cantidad de Puntos (+ para sumar, - para restar) *
            </label>
            <Input
              type="number"
              required
              placeholder="Ej. 50 o -20"
              value={adjustData.points}
              onChange={(e) => setAdjustData({ ...adjustData, points: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Concepto / Razón del Ajuste *
            </label>
            <Input
              required
              placeholder="Ej. Bonificación por fidelidad o corrección administrativa..."
              value={adjustData.concept}
              onChange={(e) => setAdjustData({ ...adjustData, concept: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Notas Adicionales de Auditoría
            </label>
            <textarea
              rows={2}
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
              className="w-full rounded-lg border border-neutral-800 bg-[#161616] p-2 text-xs text-white"
              placeholder="Detalle el número de ticket o autorización..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Aplicar Ajuste al Ledger
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Rule Configuration */}
      <Modal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title="Configurar Reglas de Acumulación"
        description="Define la tasa de conversión económica y las políticas de vigencia de puntos."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateRule} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Gasto por Cada 1 Punto (S/) *
            </label>
            <Input
              type="number"
              step="0.50"
              required
              value={ruleData.spendPerPoint}
              onChange={(e) => setRuleData({ ...ruleData, spendPerPoint: e.target.value })}
            />
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Por ejemplo: Si ingresas 10.00, un consumo de S/ 200 acumula 20 puntos.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Consumo Mínimo Calificado (S/) *
            </label>
            <Input
              type="number"
              step="1.00"
              required
              value={ruleData.minSpend}
              onChange={(e) => setRuleData({ ...ruleData, minSpend: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Vigencia de Lotes de Puntos (Meses) *
            </label>
            <Input
              type="number"
              required
              value={ruleData.pointsExpiryMonths}
              onChange={(e) => setRuleData({ ...ruleData, pointsExpiryMonths: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setRuleModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Guardar Reglas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

