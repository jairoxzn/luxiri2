import QRCode from "qrcode";
import crypto from "crypto";
import { prisma } from "../db/prisma";

export function generateSecureQRToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateCardNumber(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `LUX-${year}-${random}`;
}

export async function generateQRCodeDataURL(
  content: string,
  options?: QRCode.QRCodeToDataURLOptions
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 10,
    color: {
      dark: "#080808",
      light: "#FFFFFF",
    },
    ...options,
  };

  return await QRCode.toDataURL(content, defaultOptions);
}

export async function verifyCardQR(qrCodeToken: string) {
  if (!qrCodeToken || typeof qrCodeToken !== "string") {
    return { success: false, message: "Token QR no proporcionado" };
  }

  const card = await prisma.loyaltyCard.findUnique({
    where: { qrCodeToken },
    include: {
      customer: {
        include: {
          tier: true,
        },
      },
    },
  });

  if (!card) {
    return { success: false, message: "Código QR inválido o no reconocido" };
  }

  if (card.status !== "ACTIVE") {
    return {
      success: false,
      message: `La tarjeta se encuentra ${card.status === "BLOCKED" ? "BLOQUEADA" : "EXPIRADA"}`,
      card,
    };
  }

  if (card.customer.status !== "ACTIVE") {
    return {
      success: false,
      message: `El cliente se encuentra ${card.customer.status}`,
      card,
    };
  }

  // Update last scanned timestamp
  await prisma.loyaltyCard.update({
    where: { id: card.id },
    data: { lastScannedAt: new Date() },
  });

  return {
    success: true,
    message: "Tarjeta verificada exitosamente",
    card: {
      id: card.id,
      cardNumber: card.cardNumber,
      status: card.status,
      issuedAt: card.issuedAt,
      expiresAt: card.expiresAt,
      lastScannedAt: new Date(),
    },
    customer: {
      id: card.customer.id,
      code: card.customer.code,
      fullName: `${card.customer.firstName} ${card.customer.lastName}`,
      docType: card.customer.docType,
      docNumber: card.customer.docNumber,
      phone: card.customer.phone,
      email: card.customer.email,
      tier: card.customer.tier,
      currentPoints: card.customer.currentPoints,
      lifetimePoints: card.customer.lifetimePoints,
      totalSpent: Number(card.customer.totalSpent),
    },
  };
}

