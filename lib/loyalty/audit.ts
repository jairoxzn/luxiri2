import { prisma } from "../db/prisma";

export async function logAuditEvent({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    const detailsString = typeof details === "object" ? JSON.stringify(details) : details;
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: detailsString || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}

