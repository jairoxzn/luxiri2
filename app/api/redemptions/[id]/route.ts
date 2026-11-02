import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, RedemptionStatus, PointTransactionType } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  const { id } = params;

  try {
    const { action, reason } = await request.json();

    const redemption = await prisma.redemption.findUnique({
      where: { id },
      include: { customer: true, reward: true },
    });

    if (!redemption) {
      return NextResponse.json({ error: "Canje no encontrado" }, { status: 404 });
    }

    if (action === "REJECT" || action === "CANCEL") {
      // Return reserved points back to the customer
      const result = await prisma.$transaction(async (tx) => {
        const newBalance = redemption.customer.currentPoints + redemption.pointsSpent;

        // Restore balance
        await tx.customer.update({
          where: { id: redemption.customerId },
          data: { currentPoints: newBalance },
        });

        // Restore reward stock
        await tx.reward.update({
          where: { id: redemption.rewardId },
          data: { stock: { increment: 1 } },
        });

        // Mark redemption as rejected or cancelled
        const updated = await tx.redemption.update({
          where: { id },
          data: {
            status: action === "REJECT" ? RedemptionStatus.RECHAZADO : RedemptionStatus.CANCELADO,
            rejectionReason: reason || "Cancelado por administración",
          },
        });

        // Add ledger record for points reversal
        await tx.pointTransaction.create({
          data: {
            customerId: redemption.customerId,
            redemptionId: redemption.id,
            type: PointTransactionType.REVERSED,
            points: redemption.pointsSpent,
            balanceAfter: newBalance,
            concept: `Devolución de puntos por canje ${action === "REJECT" ? "rechazado" : "cancelado"}: ${redemption.reward.name}`,
            referenceCode: redemption.code,
            operatorId: auth.session.userId,
          },
        });

        return updated;
      });

      await logAuditEvent({
        userId: auth.session.userId,
        action: `${action}_REDEMPTION`,
        entity: "Redemption",
        entityId: id,
        details: { reason, pointsReturned: redemption.pointsSpent },
      });

      return NextResponse.json({
        success: true,
        redemption: result,
        message: "Canje cancelado y puntos devueltos al cliente",
      });
    }

    if (action === "APPROVE") {
      const updated = await prisma.redemption.update({
        where: { id },
        data: {
          status: RedemptionStatus.APROBADO,
          approvedAt: new Date(),
          approvedByUserId: auth.session.userId,
        },
      });

      await logAuditEvent({
        userId: auth.session.userId,
        action: "APPROVE_REDEMPTION",
        entity: "Redemption",
        entityId: id,
      });

      return NextResponse.json({
        success: true,
        redemption: updated,
        message: "Canje aprobado con éxito",
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

