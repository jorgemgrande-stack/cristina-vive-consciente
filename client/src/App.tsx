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

// Pages
import Home from "./pages/Home";
import Consultas from "./pages/Consultas";
import Masajes from "./pages/Masajes";
import SistemasAgua from "./pages/SistemasAgua";
import AceitesEsenciales from "./pages/AceitesEsenciales";
import GuiasDigitales from "./pages/GuiasDigitales";
import Recomendados from "./pages/Recomendados";
import Contacto from "./pages/Contacto";
import Blog from "./pages/Blog";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/consultas" component={Consultas} />
      <Route path="/masajes" component={Masajes} />
      <Route path="/sistemas-agua" component={SistemasAgua} />
      <Route path="/aceites-esenciales" component={AceitesEsenciales} />
      <Route path="/guias-digitales" component={GuiasDigitales} />
      <Route path="/recomendados" component={Recomendados} />
      <Route path="/contacto" component={Contacto} />
      <Route path="/blog" component={Blog} />
      <Route path="/404" component={NotFound} />
      {/* Fallback */}
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
