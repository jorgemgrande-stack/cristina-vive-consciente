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
import BlogPost from "./pages/BlogPost";
import BlogArticulos from "./pages/crm/BlogArticulos";
import BlogArticuloForm from "./pages/crm/BlogArticuloForm";
import BlogCategorias from "./pages/crm/BlogCategorias";
import EbookGracias from "./pages/EbookGracias";
import EbookDescarga from "./pages/EbookDescarga";

// Water System Pages
import SistemaAguaDetalle from "./pages/SistemaAguaDetalle";

// Oils Pages
import AceiteDetalle from "./pages/AceiteDetalle";
import MiConsulta from "./pages/MiConsulta";
import MasajeDetalle from "./pages/MasajeDetalle";

// Oils CRM Pages
import AceiteCategorias from "./pages/crm/AceiteCategorias";
import AceiteProductos from "./pages/crm/AceiteProductos";
import AceiteConsultas from "./pages/crm/AceiteConsultas";

// Contexts
import { ConsultaCartProvider } from "./contexts/ConsultaCartContext";

// CRM Pages
import CRMDashboard from "./pages/crm/Dashboard";
import CRMClientes from "./pages/crm/Clientes";
import ClienteDetalle from "./pages/crm/ClienteDetalle";
import ClienteForm from "./pages/crm/ClienteForm";
import CRMCitas from "./pages/crm/Citas";
import CitaForm from "./pages/crm/CitaForm";
import CRMFacturas from "./pages/crm/Facturas";
import FacturaForm from "./pages/crm/FacturaForm";
import FacturaDetalle from "./pages/crm/FacturaDetalle";
import Afiliados from "./pages/crm/Afiliados";
import AfiliadoForm from "./pages/crm/AfiliadoForm";
import Categorias from "./pages/crm/Categorias";
import Automatizaciones from "./pages/crm/Automatizaciones";
import Servicios from "./pages/crm/Servicios";
import ServicioForm from "./pages/crm/ServicioForm";
import CRMEbooks from "./pages/crm/Ebooks";
import EbookForm from "./pages/crm/EbookForm";
import AguaCategorias from "./pages/crm/AguaCategorias";
import AguaProductos from "./pages/crm/AguaProductos";
import AguaSolicitudes from "./pages/crm/AguaSolicitudes";

function Router() {
  return (
    <Switch>
      {/* ── Public ── */}
      <Route path="/" component={Home} />
      <Route path="/consultas" component={Consultas} />
      <Route path="/masajes" component={Masajes} />
      <Route path="/masajes/:slug" component={MasajeDetalle} />
      <Route path="/sistemas-agua" component={SistemasAgua} />
      <Route path="/sistemas-agua/:slug" component={SistemaAguaDetalle} />
      <Route path="/aceites-esenciales" component={AceitesEsenciales} />
      <Route path="/aceites-esenciales/:slug" component={AceiteDetalle} />
      <Route path="/mi-consulta" component={MiConsulta} />
      <Route path="/guias-digitales" component={GuiasDigitales} />
      <Route path="/recomendados" component={Recomendados} />
      <Route path="/contacto" component={Contacto} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />

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
      <Route path="/crm/facturas/:id" component={FacturaDetalle} />

      {/* Affiliate Products */}
      <Route path="/crm/afiliados" component={Afiliados} />
      <Route path="/crm/afiliados/nuevo" component={AfiliadoForm} />
      <Route path="/crm/afiliados/:id/editar" component={AfiliadoForm} />

      {/* Affiliate Categories */}
      <Route path="/crm/categorias" component={Categorias} />

      {/* Services */}
      <Route path="/crm/servicios" component={Servicios} />
      <Route path="/crm/servicios/nuevo" component={ServicioForm} />
      <Route path="/crm/servicios/:id/editar" component={ServicioForm} />

      {/* Ebooks CRM */}
      <Route path="/crm/ebooks" component={CRMEbooks} />
      <Route path="/crm/ebooks/nuevo" component={EbookForm} />
      <Route path="/crm/ebooks/:id/editar" component={EbookForm} />

      {/* Water Systems CRM */}
      <Route path="/crm/agua/categorias" component={AguaCategorias} />
      <Route path="/crm/agua/productos" component={AguaProductos} />
      <Route path="/crm/agua/solicitudes" component={AguaSolicitudes} />

      {/* Oils CRM */}
      <Route path="/crm/aceites/categorias" component={AceiteCategorias} />
      <Route path="/crm/aceites/productos" component={AceiteProductos} />
      <Route path="/crm/aceites/consultas" component={AceiteConsultas} />

      {/* Blog CRM */}
      <Route path="/crm/blog/articulos" component={BlogArticulos} />
      <Route path="/crm/blog/articulos/nuevo" component={BlogArticuloForm} />
      <Route path="/crm/blog/articulos/:id/editar" component={BlogArticuloForm} />
      <Route path="/crm/blog/categorias" component={BlogCategorias} />

      {/* Automations */}
      <Route path="/crm/automatizaciones" component={Automatizaciones} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ConsultaCartProvider>
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
      </ConsultaCartProvider>
    </ErrorBoundary>
  );
}

export default App;
