"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { Crown, Sparkles, Award, Shield, Download, Maximize2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPoints, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface DigitalLoyaltyCardProps {
  customer: {
    id: string;
    code: string;
    firstName: string;
    lastName: string;
    currentPoints: number;
    registeredAt?: Date | string;
    tier: {
      name: string;
      color: string;
      slug: string;
    };
  };
  card: {
    id: string;
    cardNumber: string;
    qrCodeToken: string;
    status: string;
    issuedAt?: Date | string;
  };
  onEnlargeQR?: () => void;
  showActions?: boolean;
}

export function DigitalLoyaltyCard({
  customer,
  card,
  onEnlargeQR,
  showActions = true,
}: DigitalLoyaltyCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (card?.qrCodeToken) {
      QRCode.toDataURL(card.qrCodeToken, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 256,
        color: {
          dark: "#080808",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating card QR:", err));
    }
  }, [card?.qrCodeToken]);

  const getTierIcon = (tierName: string) => {
    const t = tierName.toUpperCase();
    if (t === "PLATINUM") return <Sparkles className="h-5 w-5 text-gray-200" />;
    if (t === "GOLD") return <Crown className="h-5 w-5 text-[#D4AF37]" />;
    if (t === "SILVER") return <Award className="h-5 w-5 text-gray-300" />;
    return <Shield className="h-5 w-5 text-amber-500" />;
  };

  const getTierBadgeVariant = (tierName: string) => {
    const t = tierName.toLowerCase();
    if (t === "platinum") return "platinum";
    if (t === "gold") return "gold";
    if (t === "silver") return "silver";
    return "bronze";
  };

  const downloadAsPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [140, 85], // Luxury VIP card dimensions
      });

      // Background
      doc.setFillColor(8, 8, 8);
      doc.rect(0, 0, 140, 85, "F");

      // Gold border
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(1);
      doc.roundedRect(3, 3, 134, 79, 3, 3, "S");

      // Title & Company
      doc.setTextColor(212, 175, 55);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("LUXURY PRIVATE TRAVEL", 10, 14);

      doc.setTextColor(242, 214, 117);
      doc.setFontSize(9);
      doc.text("LUXURY REWARDS VIP CLUB", 10, 20);

      // Customer Info
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(`${customer.firstName} ${customer.lastName}`, 10, 34);

      doc.setFontSize(9);
      doc.setTextColor(161, 161, 170);
      doc.text(`Socio: ${customer.code}`, 10, 42);
      doc.text(`Tarjeta: ${card.cardNumber}`, 10, 48);
      doc.text(`Membresía: NIVEL ${customer.tier.name.toUpperCase()}`, 10, 54);
      doc.text(`Puntos acumulados: ${customer.currentPoints} pts`, 10, 60);

      // Security Note
      doc.setFontSize(7);
      doc.setTextColor(115, 115, 115);
      doc.text("Válido para acumulación y canje de beneficios exclusivos.", 10, 74);
      doc.text("www.luxuryprivatetravel.pe", 10, 78);

      // Add QR Image if available
      if (qrDataUrl) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(88, 16, 44, 44, 2, 2, "F");
        doc.addImage(qrDataUrl, "PNG", 90, 18, 40, 40);
        doc.setTextColor(212, 175, 55);
        doc.setFontSize(7);
        doc.text("ID SEGURO QR", 100, 64);
      }

      doc.save(`Tarjeta_Luxury_VIP_${customer.code}.pdf`);
      toast.success("Tarjeta descargada en PDF exitosamente");
    } catch (e: any) {
      toast.error("Error al exportar PDF: " + e.message);
    }
  };

  const downloadAsImage = () => {
    // Generate an offscreen canvas rendering
    const canvas = document.createElement("canvas");
    canvas.width = 750;
    canvas.height = 450;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Card background
    const bgGradient = ctx.createLinearGradient(0, 0, 750, 450);
    bgGradient.addColorStop(0, "#141414");
    bgGradient.addColorStop(0.5, "#080808");
    bgGradient.addColorStop(1, "#18181B");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 750, 450);

    // Gold border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, 720, 420);

    // Inner subtle gold border
    ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, 706, 406);

    // Header texts
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("LUXURY PRIVATE TRAVEL", 40, 65);

    ctx.fillStyle = "#F2D675";
    ctx.font = "16px sans-serif";
    ctx.fillText("LUXURY REWARDS • DIGITAL VIP CARD", 40, 95);

    // Customer Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`${customer.firstName} ${customer.lastName}`, 40, 180);

    // Details
    ctx.fillStyle = "#A1A1AA";
    ctx.font = "18px sans-serif";
    ctx.fillText(`NÚMERO DE SOCIO: ${customer.code}`, 40, 230);
    ctx.fillText(`TARJETA: ${card.cardNumber}`, 40, 265);
    ctx.fillText(`NIVEL VIP: ${customer.tier.name.toUpperCase()}`, 40, 300);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(`PUNTOS DISPONIBLES: ${customer.currentPoints} PTS`, 40, 350);

    // QR Code
    if (qrDataUrl) {
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(490, 80, 210, 210);
        ctx.drawImage(qrImg, 500, 90, 190, 190);

        ctx.fillStyle = "#F2D675";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("IDENTIFICADOR QR VIP", 595, 315);

        // Download link
        const a = document.createElement("a");
        a.download = `Tarjeta_VIP_${customer.code}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
        toast.success("Tarjeta descargada como imagen PNG");
      };
      qrImg.src = qrDataUrl;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Premium Digital Card Frame */}
      <div
        ref={cardRef}
        className="relative w-full max-w-md sm:max-w-lg overflow-hidden rounded-2xl border-2 border-[#D4AF37]/50 bg-gradient-to-br from-[#1A1A1A] via-[#0A0A0A] to-[#121212] p-6 text-white shadow-gold transition-all duration-300 hover:border-[#D4AF37]"
      >
        {/* Subtle decorative gold sheen */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#D4AF37]/5 blur-3xl" />

        {/* Top Header */}
        <div className="relative z-10 flex items-start justify-between border-b border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-[#D4AF37] text-base sm:text-lg">
                LUXURY PRIVATE TRAVEL
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-widest text-[#F2D675] uppercase mt-0.5">
              Luxury Rewards Digital Card
            </p>
          </div>

          <Badge variant={getTierBadgeVariant(customer.tier.name)} className="flex items-center gap-1.5 px-3 py-1 text-xs">
            {getTierIcon(customer.tier.name)}
            <span>{customer.tier.name}</span>
          </Badge>
        </div>

        {/* Card Body: Info & QR */}
        <div className="relative z-10 my-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Customer Details (7 cols) */}
          <div className="sm:col-span-7 space-y-3">
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider">Titular VIP</p>
              <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {customer.firstName} {customer.lastName}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-neutral-500">N° Socio</p>
                <p className="font-mono font-semibold text-neutral-200">{customer.code}</p>
              </div>
              <div>
                <p className="text-neutral-500">Tarjeta</p>
                <p className="font-mono text-neutral-300">{card.cardNumber}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-neutral-400">Puntos Disponibles</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black gold-text-gradient">
                  {customer.currentPoints.toLocaleString("es-PE")}
                </span>
                <span className="text-xs font-semibold text-[#D4AF37]">PTS</span>
              </div>
            </div>
          </div>

          {/* QR Code Container (5 cols) */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center">
            <div
              onClick={onEnlargeQR}
              className="group relative cursor-pointer rounded-xl bg-white p-2.5 shadow-md transition-transform hover:scale-105"
              title="Click para ver QR ampliado"
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Socio Luxury"
                  className="h-28 w-28 sm:h-32 sm:w-32 rounded object-contain"
                />
              ) : (
                <div className="h-28 w-28 sm:h-32 sm:w-32 flex items-center justify-center text-black">
                  <RefreshCw className="h-6 w-6 animate-spin text-neutral-500" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-6 w-6 text-[#D4AF37]" />
              </div>
            </div>
            <p className="mt-1.5 text-[10px] tracking-wider text-neutral-400 text-center">
              Escanear para acumular / canjear
            </p>
          </div>
        </div>

        {/* Card Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-[11px] text-neutral-500">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                card.status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_8px_#10B981]" : "bg-red-500"
              }`}
            />
            <span>{card.status === "ACTIVE" ? "Tarjeta Activa" : "Bloqueada"}</span>
          </div>
          <span>Desde {formatDate(customer.registeredAt, "MM/yyyy")}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onEnlargeQR && (
            <Button variant="goldOutline" size="sm" onClick={onEnlargeQR} className="gap-1.5">
              <Maximize2 className="h-4 w-4" />
              Ver QR Ampliado
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={downloadAsImage} className="gap-1.5">
            <Download className="h-4 w-4 text-[#D4AF37]" />
            Descargar Imagen
          </Button>
          <Button variant="secondary" size="sm" onClick={downloadAsPDF} className="gap-1.5">
            <Download className="h-4 w-4 text-[#D4AF37]" />
            Descargar PDF
          </Button>
        </div>
      )}
    </div>
  );
}

