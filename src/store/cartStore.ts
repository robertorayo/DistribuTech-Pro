import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductoConDetalles } from '../pages/Catalogo';

export interface CartItem {
  producto: ProductoConDetalles;
  cantidad: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (producto: ProductoConDetalles, cantidad: number) => void;
  removeItem: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (producto, cantidad) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(item => item.producto.id === producto.id);
          
          if (existingItemIndex >= 0) {
            // Si ya existe, sumamos la cantidad vigilando no pasarnos del stock
            const nuevosItems = [...state.items];
            const itemActual = nuevosItems[existingItemIndex];
            const nuevaCantidad = Math.min(itemActual.cantidad + cantidad, producto.stock);
            
            nuevosItems[existingItemIndex] = { ...itemActual, cantidad: nuevaCantidad };
            return { items: nuevosItems };
          }
          
          // Si es nuevo, lo añadimos al final
          return { items: [...state.items, { producto, cantidad }] };
        });
      },
      
      removeItem: (productoId) => {
        set((state) => ({
          items: state.items.filter(item => item.producto.id !== productoId)
        }));
      },
      
      updateQuantity: (productoId, cantidad) => {
        set((state) => ({
          items: state.items.map(item =>
            item.producto.id === productoId
              ? { ...item, cantidad }
              : item
          )
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.cantidad, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
      }
    }),
    {
      name: 'b2b-cart-storage', // Nombre de la clave en localStorage
    }
  )
);
