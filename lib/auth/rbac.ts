import { Role } from "@prisma/client";
import { getSession, SessionPayload } from "./session";
import { NextResponse } from "next/server";

export type RequireAuthResult =
  | {
      authorized: true;
      response: null;
      session: SessionPayload;
    }
  | {
      authorized: false;
      response: NextResponse;
      session: SessionPayload | null;
    };

export async function requireAuth(allowedRoles?: Role[]): Promise<RequireAuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      session: null,
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Acceso no autorizado para su rol" }, { status: 403 }),
      session,
    };
  }

  return {
    authorized: true,
    response: null,
    session,
  };
}

export function getDefaultDashboard(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return "/admin";
    case Role.OPERATOR:
      return "/operador";
    case Role.CUSTOMER:
      return "/mi-cuenta";
    default:
      return "/login";
  }
}
