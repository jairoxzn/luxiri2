import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, PaymentStatus, BookingStatus } from "@prisma/client";
import { creditPointsForBooking, revertPointsForBooking } from "@/lib/loyalty/points-engine";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR, Role.CUSTOMER]);
  if (!auth.authorized) return auth.response;

  const { id } = params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: { include: { tier: true, card: true } },
      service: true,
      operator: { select: { id: true, name: true, email: true } },
      payments: true,
      pointTransactions: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Consumo no encontrado" }, { status: 404 });
  }

  if (auth.session.role === Role.CUSTOMER && booking.customerId !== auth.session.customerId) {
    return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
  }

  return NextResponse.json({ booking });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  const { id } = params;

  try {
    const { action, paymentStatus, serviceStatus, reason } = await request.json();

    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!currentBooking) {
      return NextResponse.json({ error: "Consumo no encontrado" }, { status: 404 });
    }

    // Action: Refund / Revert
    if (action === "REFUND") {
      if (auth.session.role !== Role.ADMIN) {
        return NextResponse.json({ error: "Solo administradores pueden autorizar reembolsos y reversiones" }, { status: 403 });
      }

      const revertResult = await revertPointsForBooking(
        id,
        reason || "Reembolso autorizado de servicio",
        auth.session.userId
      );

      await logAuditEvent({
        userId: auth.session.userId,
        action: "REVERT_BOOKING",
        entity: "Booking",
        entityId: id,
        details: { reason, revertResult },
      });

      return NextResponse.json({
        success: true,
        message: "Servicio reembolsado y puntos revertidos correctamente",
        revertResult,
      });
    }

    // Update statuses
    const updateData: any = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus as PaymentStatus;
    if (serviceStatus) {
      updateData.serviceStatus = serviceStatus as BookingStatus;
      if (serviceStatus === BookingStatus.COMPLETADO) {
        updateData.completedAt = new Date();
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    let pointsResult = null;
    // Check if it now qualifies for point crediting
    if (
      !updated.isProcessedForPoints &&
      updated.paymentStatus === PaymentStatus.PAGADO &&
      updated.serviceStatus === BookingStatus.COMPLETADO
    ) {
      pointsResult = await creditPointsForBooking(id, auth.session.userId);
    }

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_BOOKING_STATUS",
      entity: "Booking",
      entityId: id,
      details: { paymentStatus, serviceStatus, pointsResult },
    });

    return NextResponse.json({
      success: true,
      booking: updated,
      pointsResult,
      message: "Estado de consumo actualizado" + (pointsResult?.pointsEarned ? `. Se acreditaron ${pointsResult.pointsEarned} puntos.` : ""),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

