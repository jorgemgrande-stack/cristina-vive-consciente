import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Wouter no resetea el scroll al navegar entre rutas (a diferencia de una
 * recarga de página normal). Sin esto, cada Link hereda la posición de
 * scroll de la página anterior.
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
