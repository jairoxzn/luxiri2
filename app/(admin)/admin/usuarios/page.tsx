"use client";

import React, { useEffect, useState } from "react";
import { UserCog, Plus, Shield, ShieldCheck, Mail, Lock, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "OPERATOR",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const json = await res.json();
      setUsers(json.users || []);
    } catch (e) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message);
      setCreateModalOpen(false);
      setFormData({ name: "", email: "", password: "", phone: "", role: "OPERATOR" });
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCog className="h-6 w-6 text-[#D4AF37]" />
            <span>Usuarios y Operadores del Sistema</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Control de cuentas de acceso, roles y permisos de personal autorizado.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 shadow-gold-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Crear Operador / Usuario</span>
        </Button>
      </div>

      <Card className="border-neutral-800 bg-[#121212] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4 text-center">Rol de Acceso</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Fecha Creación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-900/50">
                    <td className="py-3 px-4 font-semibold text-white">
                      {u.name}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {u.phone || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={u.role === "ADMIN" ? "gold" : u.role === "OPERATOR" ? "silver" : "outline"}
                      >
                        {u.role === "ADMIN" ? "Administrador" : u.role === "OPERATOR" ? "Operador" : "Cliente"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400">
                        {u.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {formatDate(u.createdAt, "dd/MM/yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Create User */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nuevo Usuario"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Nombre y Apellidos *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Valeria Ríos"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Correo Electrónico *</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@luxurytravel.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Contraseña *</label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Rol de Acceso *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 rounded-lg border border-neutral-800 bg-[#161616] px-3 text-xs text-white"
              >
                <option value="OPERATOR">Operador (Atención / QR)</option>
                <option value="ADMIN">Administrador (Total)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Teléfono</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+51 958 123 456"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

