"use client";

import React, { useEffect, useState } from "react";
import { History, Search, ShieldCheck, Filter, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AuditoriaAdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await fetch(`/api/audit?${params.toString()}`);
      const json = await res.json();
      setLogs(json.logs || []);
    } catch (e) {
      toast.error("Error al cargar registros de auditoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="h-6 w-6 text-[#D4AF37]" />
            <span>Pista de Auditoría y Seguridad</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Registro inmutable de accesos, escaneos QR, ajustes de puntos, validaciones y cambios en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
          >
            <option value="ALL">Todas las Acciones</option>
            <option value="LOGIN">Inicios de Sesión</option>
            <option value="SCAN_QR">Escaneo de Códigos QR</option>
            <option value="REGISTER_BOOKING">Registro de Consumos</option>
            <option value="POINTS_ADJUSTMENT">Ajustes de Puntos</option>
            <option value="REVERT_BOOKING">Reversiones de Puntos</option>
            <option value="VALIDATE_REDEMPTION">Validación de Canjes</option>
          </select>
        </div>
      </div>

      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Acción Realizada</th>
                <th className="py-3 px-4">Entidad Afectada</th>
                <th className="py-3 px-4">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500">
                    Cargando auditoría...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 px-4 font-mono text-neutral-400">
                      {formatDate(l.createdAt, "dd/MM/yy HH:mm:ss")}
                    </td>
                    <td className="py-3 px-4">
                      {l.user ? (
                        <div>
                          <p className="font-semibold text-white">{l.user.name}</p>
                          <p className="text-[10px] text-[#D4AF37]">{l.user.role}</p>
                        </div>
                      ) : (
                        <span className="text-neutral-500">Sistema</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] border-neutral-700">
                        {l.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#D4AF37]">
                      {l.entity} {l.entityId ? `(#${l.entityId})` : ""}
                    </td>
                    <td className="py-3 px-4 max-w-md text-neutral-300 font-mono text-[11px] truncate">
                      {l.details || "-"}
                    </td>
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

