import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { validateRedemptionVoucher } from "@/lib/loyalty/points-engine";
import { logAuditEvent } from "@/lib/loyalty/audit";

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN, Role.OPERATOR]);
  if (!auth.authorized) return auth.response;

  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Código o token de validación requerido" }, { status: 400 });
    }

    const result = await validateRedemptionVoucher(code, auth.session.userId);

    await logAuditEvent({
      userId: auth.session.userId,
      action: "VALIDATE_REDEMPTION",
      entity: "Redemption",
      entityId: result.redemption.id,
      details: {
        code: result.redemption.code,
        reward: result.redemption.reward.name,
        customer: `${result.redemption.customer.firstName} ${result.redemption.customer.lastName}`,
      },
    });

    return NextResponse.json({
      success: true,
      redemption: result.redemption,
      message: `¡Beneficio validado con éxito! Se aplicó ${result.redemption.reward.name}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

