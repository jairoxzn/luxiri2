import { NextRequest, NextResponse } from "next/server";
import { verifyCardQR } from "@/lib/qr/qr-service";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  try {
    const { qrToken } = await request.json();

    if (!qrToken) {
      return NextResponse.json({ error: "Token QR requerido" }, { status: 400 });
    }

    const result = await verifyCardQR(qrToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, card: result.card },
        { status: 400 }
      );
    }

    await logAuditEvent({
      userId: auth.session.userId,
      action: "SCAN_QR",
      entity: "LoyaltyCard",
      entityId: result.card?.cardNumber,
      details: {
        customerName: result.customer?.fullName,
        cardNumber: result.card?.cardNumber,
      },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al verificar código QR: " + error.message },
      { status: 500 }
    );
  }
}

