import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "clientes";

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "LUXURY REWARDS - Luxury Private Travel";
    workbook.created = new Date();

    if (type === "clientes") {
      const worksheet = workbook.addWorksheet("Clientes VIP");

      worksheet.columns = [
        { header: "Código Socio", key: "code", width: 16 },
        { header: "Nombres", key: "firstName", width: 20 },
        { header: "Apellidos", key: "lastName", width: 22 },
        { header: "Doc. Identidad", key: "docNumber", width: 16 },
        { header: "Teléfono", key: "phone", width: 18 },
        { header: "Correo Electrónico", key: "email", width: 28 },
        { header: "Nivel VIP", key: "tier", width: 15 },
        { header: "Puntos Actuales", key: "points", width: 16 },
        { header: "Puntos Históricos", key: "lifetime", width: 18 },
        { header: "Consumo Total (S/)", key: "spent", width: 20 },
        { header: "Estado", key: "status", width: 14 },
        { header: "Fecha Registro", key: "registeredAt", width: 18 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFF" }, name: "Calibri", size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "080808" }, // Luxury black
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      const customers = await prisma.customer.findMany({
        include: { tier: true },
        orderBy: { totalSpent: "desc" },
      });

      customers.forEach((c) => {
        worksheet.addRow({
          code: c.code,
          firstName: c.firstName,
          lastName: c.lastName,
          docNumber: `${c.docType}: ${c.docNumber}`,
          phone: c.phone,
          email: c.email,
          tier: c.tier.name,
          points: c.currentPoints,
          lifetime: c.lifetimePoints,
          spent: Number(c.totalSpent),
          status: c.status,
          registeredAt: c.registeredAt.toLocaleDateString("es-PE"),
        });
      });
    } else if (type === "consumos") {
      const worksheet = workbook.addWorksheet("Consumos y Servicios");

      worksheet.columns = [
        { header: "Código", key: "code", width: 18 },
        { header: "Fecha", key: "date", width: 16 },
        { header: "Cliente", key: "customer", width: 25 },
        { header: "Servicio", key: "service", width: 32 },
        { header: "Importe (S/)", key: "amount", width: 16 },
        { header: "Método Pago", key: "paymentMethod", width: 18 },
        { header: "Estado Pago", key: "paymentStatus", width: 15 },
        { header: "Estado Servicio", key: "serviceStatus", width: 16 },
        { header: "Puntos Ganados", key: "points", width: 16 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "080808" },
      };

      const bookings = await prisma.booking.findMany({
        include: { customer: true, service: true },
        orderBy: { bookingDate: "desc" },
      });

      bookings.forEach((b) => {
        worksheet.addRow({
          code: b.code,
          date: b.bookingDate.toLocaleDateString("es-PE"),
          customer: `${b.customer.firstName} ${b.customer.lastName}`,
          service: b.service.name,
          amount: Number(b.amount),
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          serviceStatus: b.serviceStatus,
          points: b.pointsEarned,
        });
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Luxury_Rewards_${type}_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Excel export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

