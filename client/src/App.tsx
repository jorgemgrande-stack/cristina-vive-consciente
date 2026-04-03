/**
 * App — Cristina Vive Consciente
 * Design: "Luz Botánica" — Art Nouveau depurado + Minimalismo escandinavo
 * Router principal con todas las páginas
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Public Pages
import Home from "./pages/Home";
import Consultas from "./pages/Consultas";
import Masajes from "./pages/Masajes";
import SistemasAgua from "./pages/SistemasAgua";
import AceitesEsenciales from "./pages/AceitesEsenciales";
import GuiasDigitales from "./pages/GuiasDigitales";
import Recomendados from "./pages/Recomendados";
import Contacto from "./pages/Contacto";
import Blog from "./pages/Blog";
import EbookGracias from "./pages/EbookGracias";
import EbookDescarga from "./pages/EbookDescarga";

// CRM Pages
import CRMDashboard from "./pages/crm/Dashboard";
import CRMClientes from "./pages/crm/Clientes";
import ClienteDetalle from "./pages/crm/ClienteDetalle";
import ClienteForm from "./pages/crm/ClienteForm";
import CRMCitas from "./pages/crm/Citas";
import CitaForm from "./pages/crm/CitaForm";
import CRMFacturas from "./pages/crm/Facturas";
import FacturaForm from "./pages/crm/FacturaForm";
import Afiliados from "./pages/crm/Afiliados";
import AfiliadoForm from "./pages/crm/AfiliadoForm";

function Router() {
  return (
    <Switch>
      {/* ── Public ── */}
      <Route path="/" component={Home} />
      <Route path="/consultas" component={Consultas} />
      <Route path="/masajes" component={Masajes} />
      <Route path="/sistemas-agua" component={SistemasAgua} />
      <Route path="/aceites-esenciales" component={AceitesEsenciales} />
      <Route path="/guias-digitales" component={GuiasDigitales} />
      <Route path="/recomendados" component={Recomendados} />
      <Route path="/contacto" component={Contacto} />
      <Route path="/blog" component={Blog} />

      {/* ── Ebooks ── */}
      <Route path="/ebooks/gracias" component={EbookGracias} />
      <Route path="/ebooks/descarga" component={EbookDescarga} />

      {/* ── CRM (admin protected) ── */}
      <Route path="/crm" component={CRMDashboard} />
      <Route path="/crm/dashboard" component={CRMDashboard} />

      {/* Clients */}
      <Route path="/crm/clientes" component={CRMClientes} />
      <Route path="/crm/clientes/nuevo" component={ClienteForm} />
      <Route path="/crm/clientes/:id/editar" component={ClienteForm} />
      <Route path="/crm/clientes/:id" component={ClienteDetalle} />

      {/* Appointments */}
      <Route path="/crm/citas" component={CRMCitas} />
      <Route path="/crm/citas/nueva" component={CitaForm} />

      {/* Invoices */}
      <Route path="/crm/facturas" component={CRMFacturas} />
      <Route path="/crm/facturas/nueva" component={FacturaForm} />

      {/* Affiliate Products */}
      <Route path="/crm/afiliados" component={Afiliados} />
      <Route path="/crm/afiliados/nuevo" component={AfiliadoForm} />
      <Route path="/crm/afiliados/:id/editar" component={AfiliadoForm} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                borderRadius: 0,
                border: "1px solid oklch(0.88 0.015 75)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
