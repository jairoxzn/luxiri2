import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      customer: {
        select: { id: true, code: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const { email, password, name, phone, role = Role.OPERATOR } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Correo, contraseña y nombre son obligatorios" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con este correo electrónico" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        phone: phone?.trim() || null,
        role: role as Role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    await logAuditEvent({
      userId: auth.session.userId,
      action: "CREATE_USER",
      entity: "User",
      entityId: user.id,
      details: { email: user.email, role: user.role, name: user.name },
    });

    return NextResponse.json({ success: true, user, message: "Usuario creado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

