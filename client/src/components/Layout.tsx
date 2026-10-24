/**
 * Layout — Cristina Vive Consciente
 * Wrapper global con Header + Footer para todas las páginas
 */

import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton, { type WhatsAppContext } from "./WhatsAppButton";
import CookieBanner from "./CookieBanner";

interface LayoutProps {
  children: ReactNode;
  /** Servicio de la página: el globo de WhatsApp lo nombra en el mensaje y en la medición. */
  whatsappContext?: WhatsAppContext;
}

export default function Layout({ children, whatsappContext }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[oklch(0.985_0.006_85)]">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton context={whatsappContext} />
      <CookieBanner />
    </div>
  );
}
