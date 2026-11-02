import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/lib/loyalty/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.systemSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return NextResponse.json({ settings: settingsMap });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth([Role.ADMIN]);
  if (!auth.authorized) return auth.response;

  try {
    const data = await request.json();

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    await logAuditEvent({
      userId: auth.session.userId,
      action: "UPDATE_SETTINGS",
      entity: "SystemSetting",
      details: data,
    });

    return NextResponse.json({ success: true, message: "Configuraciones guardadas exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

