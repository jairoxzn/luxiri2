import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/loyalty/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session) {
      await logAuditEvent({
        userId: session.userId,
        action: "LOGOUT",
        entity: "User",
        entityId: session.userId,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Sesión cerrada correctamente" });
  } catch (error) {
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 });
  }
}

