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

export async function verifyCardQR(input: string) {
  if (!input || typeof input !== "string") {
    return { success: false, message: "Token o identificador no proporcionado" };
  }

  let cleanInput = input.trim();

  // If the scanned payload is a URL (e.g. http://localhost:3000/.../?token=xyz)
  if (cleanInput.includes("token=")) {
    try {
      const url = new URL(cleanInput);
      const urlToken = url.searchParams.get("token") || url.searchParams.get("qrToken");
      if (urlToken) cleanInput = urlToken.trim();
    } catch {
      const match = cleanInput.match(/token=([a-zA-Z0-9_-]+)/);
      if (match) cleanInput = match[1];
    }
  }

  // Find by qrCodeToken, cardNumber, customer code, or customer docNumber
  const card = await prisma.loyaltyCard.findFirst({
    where: {
      OR: [
        { qrCodeToken: cleanInput },
        { cardNumber: { equals: cleanInput, mode: "insensitive" } },
        { customer: { code: { equals: cleanInput, mode: "insensitive" } } },
        { customer: { docNumber: cleanInput } },
      ],
    },
    include: {
      customer: {
        include: {
          tier: true,
        },
      },
    },
  });

  if (!card) {
    return {
      success: false,
      message: `Código no reconocido (${cleanInput}). Verifica el token QR, número de tarjeta o código de socio.`,
    };
  }

  if (card.status !== "ACTIVE") {
    return {
      success: false,
      message: `La tarjeta ${card.cardNumber} se encuentra ${card.status === "BLOCKED" ? "BLOQUEADA" : "EXPIRADA"}`,
      card,
    };
  }

  if (card.customer.status !== "ACTIVE") {
    return {
      success: false,
      message: `El cliente ${card.customer.firstName} ${card.customer.lastName} se encuentra ${card.customer.status}`,
      card,
    };
  }

  // Update last scanned timestamp
  try {
    await prisma.loyaltyCard.update({
      where: { id: card.id },
      data: { lastScannedAt: new Date() },
    });
  } catch (e) {
    // Non-fatal if timestamp update fails
  }

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
      firstName: card.customer.firstName,
      lastName: card.customer.lastName,
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
