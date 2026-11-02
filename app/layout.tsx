import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "LUXURY REWARDS | Luxury Private Travel",
  description: "Programa de fidelización exclusivo para clientes distinguidos de Luxury Private Travel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#080808] font-sans text-white antialiased selection:bg-[#D4AF37] selection:text-black">
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#141414",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              color: "#FFFFFF",
            },
          }}
        />
      </body>
    </html>
  );
}
