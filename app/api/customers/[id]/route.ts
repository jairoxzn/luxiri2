import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, CustomerStatus } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR, Role.CUSTOMER]);
  if (!auth.authorized) return auth.response;

  const { id } = params;

  // Authorization check for customer role
  if (auth.session.role === Role.CUSTOMER && auth.session.customerId !== id) {
    return NextResponse.json({ error: "Acceso denegado a datos de otro cliente" }, { status: 403 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tier: true,
      card: true,
      bookings: {
        include: { service: true, payments: true },
        orderBy: { bookingDate: "desc" },
        take: 20,
      },
      pointTransactions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      redemptions: {
        include: { reward: true },
        orderBy: { requestedAt: "desc" },
      },
      tierHistory: {
        include: { previousTier: true, newTier: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.CUSTOMER]);
  if (!auth.authorized) return auth.response;

  const { id } = params;
  if (auth.session.role === Role.CUSTOMER && auth.session.customerId !== id) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      district,
      city,
      birthDate,
      status,
      notes,
    } = data;

    // Customers can only edit phone, address, district, city
    const updateData: any = {};
    if (auth.session.role === Role.ADMIN) {
      if (firstName) updateData.firstName = firstName.trim();
      if (lastName) updateData.lastName = lastName.trim();
      if (email) updateData.email = email.toLowerCase().trim();
      if (status) updateData.status = status as CustomerStatus;
      if (notes !== undefined) updateData.notes = notes;
    }

    if (phone) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (district !== undefined) updateData.district = district?.trim() || null;
    if (city !== undefined) updateData.city = city?.trim() || "Arequipa";
    if (birthDate) updateData.birthDate = new Date(birthDate);

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: { tier: true, card: true },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_CUSTOMER",
      entity: "Customer",
      entityId: id,
      details: updateData,
    });

    return NextResponse.json({
      success: true,
      customer: updated,
      message: "Datos de cliente actualizados correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar cliente: " + (error?.message || "") },
      { status: 500 }
    );
  }
}

