import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './cartStore';
import { crearProducto } from '@/test/fixtures';

const taladro = crearProducto({ id: 'taladro', precio: 100, stock: 5 });
const brocas = crearProducto({ id: 'brocas', nombre: 'Juego de brocas', precio: 12.5, stock: 50 });

const carrito = () => useCartStore.getState();

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it('añade un producto nuevo al final del carrito', () => {
    carrito().addItem(taladro, 2);
    carrito().addItem(brocas, 1);

    expect(carrito().items.map((i) => [i.producto.id, i.cantidad])).toEqual([
      ['taladro', 2],
      ['brocas', 1],
    ]);
  });

  it('suma la cantidad si el producto ya estaba en el carrito', () => {
    carrito().addItem(taladro, 1);
    carrito().addItem(taladro, 2);

    expect(carrito().items).toHaveLength(1);
    expect(carrito().items[0].cantidad).toBe(3);
  });

  it('no deja que la suma supere el stock disponible', () => {
    carrito().addItem(taladro, 4);
    carrito().addItem(taladro, 3);

    expect(carrito().items[0].cantidad).toBe(5);
  });

  it('actualiza la cantidad solo del producto indicado', () => {
    carrito().addItem(taladro, 1);
    carrito().addItem(brocas, 1);
    carrito().updateQuantity('brocas', 4);

    expect(carrito().items.find((i) => i.producto.id === 'taladro')?.cantidad).toBe(1);
    expect(carrito().items.find((i) => i.producto.id === 'brocas')?.cantidad).toBe(4);
  });

  it('elimina un producto y vacía el carrito', () => {
    carrito().addItem(taladro, 1);
    carrito().addItem(brocas, 1);

    carrito().removeItem('taladro');
    expect(carrito().items.map((i) => i.producto.id)).toEqual(['brocas']);

    carrito().clearCart();
    expect(carrito().items).toEqual([]);
  });

  it('calcula el número de unidades y el subtotal sin IVA', () => {
    carrito().addItem(taladro, 2); // 200
    carrito().addItem(brocas, 4); // 50

    expect(carrito().getTotalItems()).toBe(6);
    expect(carrito().getSubtotal()).toBe(250);
  });

  it('guarda el carrito en localStorage para no perderlo al recargar', () => {
    carrito().addItem(brocas, 3);

    const guardado = JSON.parse(localStorage.getItem('b2b-cart-storage') ?? '{}');
    expect(guardado.state.items[0]).toMatchObject({ cantidad: 3, producto: { id: 'brocas' } });
  });
});
