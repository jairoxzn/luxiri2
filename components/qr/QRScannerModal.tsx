"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, QrCode, Search, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: any) => void;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: QRScannerModalProps) {
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader-container";

  // Safe scanner cleanup
  const stopScanner = async () => {
    const scanner = html5QrCodeRef.current;
    if (!scanner) return;
    html5QrCodeRef.current = null;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Ignore if already stopped
    }

    try {
      const container = document.getElementById(scannerContainerId);
      if (container) {
        await scanner.clear();
      }
    } catch {
      // Ignore if container is unmounted
    } finally {
      setCameraActive(false);
    }
  };

  // Handle camera start/stop
  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setErrorMsg(null);
      const timer = setTimeout(() => {
        if (!isMounted) return;
        try {
          const container = document.getElementById(scannerContainerId);
          if (!container) return;

          const scanner = new Html5Qrcode(scannerContainerId);
          html5QrCodeRef.current = scanner;

          scanner
            .start(
              { facingMode: "environment" },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              (decodedText) => {
                handleVerifyToken(decodedText);
              },
              () => {
                // scanning frame error ignore
              }
            )
            .then(() => {
              if (isMounted) setCameraActive(true);
            })
            .catch((err) => {
              console.warn("Could not start camera:", err);
              if (isMounted) {
                setCameraActive(false);
                setErrorMsg(
                  "No se pudo iniciar la cámara (puede requerir permisos en el navegador o estar en uso). Puedes ingresar el token, número de tarjeta o DNI manualmente abajo."
                );
              }
            });
        } catch (e: any) {
          if (isMounted) setErrorMsg(e.message);
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const handleVerifyToken = async (token: string) => {
    if (!token || loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (html5QrCodeRef.current?.isScanning) {
        try {
          await html5QrCodeRef.current.pause(true);
        } catch {
          // ignore pause error
        }
      }

      const res = await fetch("/api/cards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Tarjeta o código no reconocido");
      }

      toast.success(`Cliente verificado: ${data.customer.fullName}`);
      await stopScanner();
      onScanSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al verificar código");
      toast.error(err.message || "Error al verificar código");
      try {
        if (html5QrCodeRef.current && (html5QrCodeRef.current as any).isPaused?.()) {
          html5QrCodeRef.current.resume();
        }
      } catch {
        // ignore resume error
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyToken(manualCode.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopScanner();
        onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-[#D4AF37]" />
          <span>Escanear Tarjeta Digital</span>
        </div>
      }
      description="Apunta la cámara al código QR de la tarjeta o ingresa el número de tarjeta / DNI"
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Scanner Viewport */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-black min-h-[260px] flex flex-col items-center justify-center">
          <div id={scannerContainerId} className="w-full max-w-[320px]" />

          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
              <RefreshCw className="h-8 w-8 animate-spin text-[#D4AF37] mb-2" />
              <p className="text-sm font-semibold text-white">Verificando en servidor...</p>
            </div>
          )}

          {!cameraActive && !loading && (
            <div className="p-6 text-center text-neutral-400">
              <Camera className="h-10 w-10 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs">
                Iniciando cámara... Si no se activa, usa la entrada manual abajo.
              </p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Fallback Manual Input: Card Number, Customer Code, DNI, or Token */}
        <div className="border-t border-neutral-800 pt-4">
          <p className="text-xs font-medium text-neutral-400 mb-2">
            O ingresa Tarjeta (ej. LUX-2026-1001), Código Socio (LPT-10001), DNI o Token:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ej. LUX-2026-1001, LPT-10001 o DNI..."
              className="text-xs font-mono"
            />
            <Button
              type="submit"
              variant="gold"
              disabled={loading || !manualCode.trim()}
              className="gap-1 shrink-0"
            >
              <Search className="h-4 w-4" />
              Verificar
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
