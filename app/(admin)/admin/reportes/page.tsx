"use client";

import React, { useEffect, useState } from "react";
import { FileBarChart2, Download, FileSpreadsheet, FileText, Calendar, Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPoints, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ReportesAdminPage() {
  const [reportType, setReportType] = useState("consumos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("type", reportType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      toast.error("Error al cargar datos del reporte");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("LUXURY PRIVATE TRAVEL", 14, 15);
      doc.setFontSize(11);
      doc.setTextColor(150, 150, 150);
      doc.text(`Reporte Oficial: ${reportType.toUpperCase()}`, 14, 22);
      doc.text(`Generado el: ${new Date().toLocaleDateString("es-PE")}`, 14, 28);

      let head: string[][] = [];
      let body: any[][] = [];

      if (reportType === "consumos") {
        head = [["Código", "Fecha", "Cliente", "Servicio", "Monto", "Puntos"]];
        body = items.map((i) => [
          i.code,
          formatDate(i.bookingDate, "dd/MM/yyyy"),
          `${i.customer?.firstName} ${i.customer?.lastName}`,
          i.service?.name,
          `S/ ${Number(i.amount).toFixed(2)}`,
          `+${i.pointsEarned} pts`,
        ]);
      } else if (reportType === "clientes") {
        head = [["Código", "Nombres", "Documento", "Nivel", "Puntos", "Gasto Total"]];
        body = items.map((i) => [
          i.code,
          `${i.firstName} ${i.lastName}`,
          i.docNumber,
          i.tier?.name,
          `${i.currentPoints} pts`,
          `S/ ${Number(i.totalSpent).toFixed(2)}`,
        ]);
      } else if (reportType === "puntos") {
        head = [["Fecha", "Cliente", "Tipo", "Concepto", "Puntos", "Saldo"]];
        body = items.map((i) => [
          formatDate(i.createdAt, "dd/MM/yy HH:mm"),
          `${i.customer?.firstName} ${i.customer?.lastName}`,
          i.type,
          i.concept,
          i.points,
          `${i.balanceAfter} pts`,
        ]);
      } else if (reportType === "canjes") {
        head = [["Código", "Fecha", "Cliente", "Recompensa", "Puntos", "Estado"]];
        body = items.map((i) => [
          i.code,
          formatDate(i.requestedAt, "dd/MM/yyyy"),
          `${i.customer?.firstName} ${i.customer?.lastName}`,
          i.reward?.name,
          `-${i.pointsSpent} pts`,
          i.status,
        ]);
      }

      (doc as any).autoTable({
        startY: 34,
        head,
        body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [8, 8, 8], textColor: [212, 175, 55] },
      });

      doc.save(`Reporte_Luxury_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Reporte PDF descargado exitosamente");
    } catch (e: any) {
      toast.error("Error al generar PDF: " + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileBarChart2 className="h-6 w-6 text-[#D4AF37]" />
            <span>Módulo de Reportes y Auditoría Financiera</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Descarga de estados de cuenta, consolidado de servicios y exportación en Excel / PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/export/excel?type=${reportType}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="secondary" size="sm" className="gap-1.5 border-neutral-700">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </Button>
          </a>

          <Button variant="goldOutline" size="sm" onClick={exportPDF} className="gap-1.5">
            <FileText className="h-4 w-4" />
            <span>Exportar PDF</span>
          </Button>
        </div>
      </div>

      {/* Control Filters */}
      <Card className="border-neutral-800 bg-[#121212]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="consumos">Consumos y Servicios Contratados</option>
                <option value="clientes">Padrón de Clientes VIP</option>
                <option value="puntos">Libro de Puntos y Movimientos</option>
                <option value="canjes">Canjes y Beneficios Validados</option>
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Desde Fecha
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#161616]"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Hasta Fecha
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#161616]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results Table */}
      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-white">
              Resultados ({items.length} registros encontrados)
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-neutral-700">
              {reportType.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              {reportType === "consumos" && (
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Servicio</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                  <th className="py-3 px-4 text-center">Puntos</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              )}
              {reportType === "clientes" && (
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Nivel VIP</th>
                  <th className="py-3 px-4 text-right">Puntos Disponibles</th>
                  <th className="py-3 px-4 text-right">Consumo Acumulado</th>
                  <th className="py-3 px-4 text-center">Servicios</th>
                </tr>
              )}
              {reportType === "puntos" && (
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Concepto</th>
                  <th className="py-3 px-4 text-right">Puntos</th>
                  <th className="py-3 px-4 text-right">Saldo Final</th>
                </tr>
              )}
              {reportType === "canjes" && (
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Fecha Solicitud</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Recompensa</th>
                  <th className="py-3 px-4 text-center">Puntos Canjeados</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    Cargando reporte...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                items.map((i, idx) => (
                  <tr key={i.id || idx} className="hover:bg-neutral-900/50">
                    {reportType === "consumos" && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{i.code}</td>
                        <td className="py-3 px-4 text-neutral-300">{formatDate(i.bookingDate, "dd/MM/yy")}</td>
                        <td className="py-3 px-4 text-white font-medium">{i.customer?.firstName} {i.customer?.lastName}</td>
                        <td className="py-3 px-4 text-neutral-300">{i.service?.name}</td>
                        <td className="py-3 px-4 text-right font-bold text-white">{formatCurrency(i.amount)}</td>
                        <td className="py-3 px-4 text-center font-bold gold-text-gradient">+{i.pointsEarned} PTS</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="text-[10px]">{i.serviceStatus}</Badge>
                        </td>
                      </>
                    )}
                    {reportType === "clientes" && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{i.code}</td>
                        <td className="py-3 px-4 text-white font-semibold">{i.firstName} {i.lastName}</td>
                        <td className="py-3 px-4 font-mono text-neutral-300">{i.docNumber}</td>
                        <td className="py-3 px-4">
                          <Badge variant="gold">{i.tier?.name}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-black gold-text-gradient">{i.currentPoints} PTS</td>
                        <td className="py-3 px-4 text-right font-bold text-white">{formatCurrency(i.totalSpent)}</td>
                        <td className="py-3 px-4 text-center text-neutral-400">{i._count?.bookings || 0}</td>
                      </>
                    )}
                    {reportType === "puntos" && (
                      <>
                        <td className="py-3 px-4 text-neutral-400">{formatDate(i.createdAt, "dd/MM/yy HH:mm")}</td>
                        <td className="py-3 px-4 text-white font-medium">{i.customer?.firstName} {i.customer?.lastName}</td>
                        <td className="py-3 px-4"><Badge variant="outline">{i.type}</Badge></td>
                        <td className="py-3 px-4 text-neutral-300 truncate max-w-xs">{i.concept}</td>
                        <td className="py-3 px-4 text-right font-bold text-white">{i.points} PTS</td>
                        <td className="py-3 px-4 text-right font-bold gold-text-gradient">{i.balanceAfter} PTS</td>
                      </>
                    )}
                    {reportType === "canjes" && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-[#D4AF37]">{i.code}</td>
                        <td className="py-3 px-4 text-neutral-300">{formatDate(i.requestedAt, "dd/MM/yy")}</td>
                        <td className="py-3 px-4 text-white font-medium">{i.customer?.firstName} {i.customer?.lastName}</td>
                        <td className="py-3 px-4 text-neutral-300">{i.reward?.name}</td>
                        <td className="py-3 px-4 text-center font-bold text-red-400">-{i.pointsSpent} PTS</td>
                        <td className="py-3 px-4 text-center"><Badge variant="gold">{i.status}</Badge></td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

