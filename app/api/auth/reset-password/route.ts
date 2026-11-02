import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/loyalty/audit";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Correo electrónico requerido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Security: Do not disclose whether email exists
      return NextResponse.json({
        success: true,
        message: "Si el correo está registrado, se han enviado las instrucciones de restablecimiento.",
      });
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
      }

      const hashed = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      });

      await logAuditEvent({
        userId: user.id,
        action: "PASSWORD_RESET",
        entity: "User",
        entityId: user.id,
        details: "Contraseña actualizada exitosamente",
      });

      return NextResponse.json({
        success: true,
        message: "Contraseña actualizada exitosamente. Ya puede iniciar sesión con su nueva clave.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Se ha validado la cuenta. Puede ingresar su nueva contraseña.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}

