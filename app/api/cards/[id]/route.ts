import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, CardStatus } from "@prisma/client";
import { generateSecureQRToken } from "@/lib/qr/qr-service";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  const { id } = params;

  try {
    const { action, status } = await request.json();

    if (action === "REGENERATE_QR") {
      const newToken = generateSecureQRToken();
      const updated = await prisma.loyaltyCard.update({
        where: { id },
        data: { qrCodeToken: newToken },
        include: { customer: true },
      });

      await logAuditEvent({
        userId: auth.session.userId,
        action: "REGENERATE_QR",
        entity: "LoyaltyCard",
        entityId: updated.cardNumber,
        details: "Credenciales QR regeneradas por seguridad.",
      });

      return NextResponse.json({
        success: true,
        message: "Nuevo código QR generado exitosamente",
        card: updated,
      });
    }

    if (status) {
      const updated = await prisma.loyaltyCard.update({
        where: { id },
        data: { status: status as CardStatus },
        include: { customer: true },
      });

      await logAuditEvent({
        userId: auth.session.userId,
        action: "UPDATE_CARD_STATUS",
        entity: "LoyaltyCard",
        entityId: updated.cardNumber,
        details: { newStatus: status },
      });

      return NextResponse.json({
        success: true,
        message: `Estado de tarjeta actualizado a ${status}`,
        card: updated,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

