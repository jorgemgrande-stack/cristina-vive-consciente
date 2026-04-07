/**
 * ConsultaCartContext.tsx — Carrito terapéutico de aceites esenciales
 * Persiste en localStorage. Sin lógica de compra ni checkout.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  tipoProducto: string;
  imagen?: string | null;
}

interface ConsultaCartContextValue {
  items: CartProduct[];
  addItem: (product: CartProduct) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  count: number;
}

const ConsultaCartContext = createContext<ConsultaCartContextValue | null>(null);

const STORAGE_KEY = "cvc_consulta_cart";

export function ConsultaCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CartProduct[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product: CartProduct) {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }

  function clearCart() {
    setItems([]);
  }

  function isInCart(id: number) {
    return items.some((p) => p.id === id);
  }

  return (
    <ConsultaCartContext.Provider value={{ items, addItem, removeItem, clearCart, isInCart, count: items.length }}>
      {children}
    </ConsultaCartContext.Provider>
  );
}

export function useConsultaCart() {
  const ctx = useContext(ConsultaCartContext);
  if (!ctx) throw new Error("useConsultaCart must be used within ConsultaCartProvider");
  return ctx;
}
