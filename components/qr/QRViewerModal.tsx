"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Modal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, QrCode } from "lucide-react";

interface QRViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    fullName: string;
    code: string;
    tierName: string;
    currentPoints: number;
  };
  card: {
    cardNumber: string;
    qrCodeToken: string;
  };
}

export function QRViewerModal({
  isOpen,
  onClose,
  customer,
  card,
}: QRViewerModalProps) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    if (card?.qrCodeToken && isOpen) {
      QRCode.toDataURL(card.qrCodeToken, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 380,
        color: {
          dark: "#080808",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrUrl(url))
        .catch(console.error);
    }
  }, [card?.qrCodeToken, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-[#D4AF37]" />
          <span>Código QR Digital VIP</span>
        </div>
      }
      description="Presenta este código al operador para registrar servicios y acumular puntos"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center justify-center space-y-4 pt-2 pb-4">
        {/* QR Display */}
        <div className="rounded-2xl border-2 border-[#D4AF37]/50 bg-white p-4 shadow-gold">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR Code"
              className="h-64 w-64 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-neutral-400">
              Generando QR...
            </div>
          )}
        </div>

        {/* Member Details */}
        <div className="w-full text-center space-y-1">
          <h4 className="text-lg font-bold text-white">{customer.fullName}</h4>
          <p className="text-sm font-mono text-[#D4AF37]">
            Socio: {customer.code} • {card.cardNumber}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge variant="gold">Nivel {customer.tierName}</Badge>
            <Badge variant="outline">{customer.currentPoints} Puntos</Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Código seguro con cifrado y validación en servidor</span>
        </div>
      </div>
    </Modal>
  );
}

