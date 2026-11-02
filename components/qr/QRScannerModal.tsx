"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Modal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, QrCode, Search, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
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

  // Handle camera start/stop
  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      setErrorMsg(null);
      // Wait for DOM
      const timer = setTimeout(() => {
        if (!isMounted) return;
        try {
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
                // scanning error/frame ignore
              }
            )
            .then(() => {
              if (isMounted) setCameraActive(true);
            })
            .catch((err) => {
              console.warn("Could not start camera:", err);
              if (isMounted) {
                setCameraActive(false);
                setErrorMsg("No se pudo iniciar la cámara (puede no estar disponible o faltar permisos). Puedes ingresar el código o buscar manualmente abajo.");
              }
            });
        } catch (e: any) {
          setErrorMsg(e.message);
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

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      } finally {
        html5QrCodeRef.current = null;
        setCameraActive(false);
      }
    }
  };

  const handleVerifyToken = async (token: string) => {
    if (!token || loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // Pause scanner while verifying
      if (html5QrCodeRef.current?.isScanning) {
        await html5QrCodeRef.current.pause(true);
      }

      const res = await fetch("/api/cards/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Código QR no válido");
      }

      toast.success(`Cliente verificado: ${data.customer.fullName}`);
      await stopScanner();
      onScanSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al verificar código");
      toast.error(err.message || "Error al verificar código");
      // Resume scanner
      try {
        if (html5QrCodeRef.current) {
          html5QrCodeRef.current.resume();
        }
      } catch {}
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
      description="Apunta la cámara al código QR de la tarjeta del cliente"
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

        {/* Fallback Manual Token or Code Input */}
        <div className="border-t border-neutral-800 pt-4">
          <p className="text-xs font-medium text-neutral-400 mb-2">
            O ingresa el token QR / código manualmente:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Pegar token de tarjeta..."
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

