import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

/** Números y puntos suspensivos de la fila de botones, en orden. */
const paginasVisibles = () => {
  const fila = screen.getByTitle('Página anterior').parentElement as HTMLElement;
  return within(fila)
    .getAllByText(/^(\d+|\.\.\.)$/)
    .map((el) => el.textContent);
};

describe('Pagination', () => {
  it('no muestra nada si solo hay una página', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra todas las páginas si son 5 o menos', () => {
    render(<Pagination currentPage={2} totalPages={4} onPageChange={vi.fn()} />);
    expect(paginasVisibles()).toEqual(['1', '2', '3', '4']);
  });

  it('abrevia con puntos suspensivos alrededor de la página actual', () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />);
    expect(paginasVisibles()).toEqual(['1', '...', '4', '5', '6', '...', '10']);
  });

  it('desactiva primera y anterior en la primera página', () => {
    render(<Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByTitle('Primera página')).toBeDisabled();
    expect(screen.getByTitle('Página anterior')).toBeDisabled();
    expect(screen.getByTitle('Página siguiente')).toBeEnabled();
  });

  it('avisa de la página elegida al pulsar los botones', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={10} onPageChange={onPageChange} />);

    await user.click(screen.getByTitle('Página siguiente'));
    await user.click(screen.getByTitle('Última página'));
    await user.click(screen.getByRole('button', { name: '3' }));

    expect(onPageChange.mock.calls).toEqual([[3], [10], [3]]);
  });

  it('salta a la página escrita si es válida', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={10} onPageChange={onPageChange} />);

    const campo = screen.getByLabelText('Ir a:');
    await user.clear(campo);
    await user.type(campo, '7');
    await user.click(screen.getByRole('button', { name: 'Saltar' }));

    expect(onPageChange).toHaveBeenCalledWith(7);
  });

  it('no salta a una página fuera de rango', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={10} onPageChange={onPageChange} />);

    const campo = screen.getByLabelText('Ir a:');
    await user.clear(campo);
    await user.type(campo, '99');
    // El navegador ya bloquea el envío por el atributo max; se fuerza el submit
    // para comprobar también la validación del propio componente.
    fireEvent.submit(campo.closest('form') as HTMLFormElement);

    expect(onPageChange).not.toHaveBeenCalled();
    expect(campo).toHaveValue(3);
  });

  it('restaura la página actual si se envía el campo vacío', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={10} onPageChange={onPageChange} />);

    const campo = screen.getByLabelText('Ir a:');
    await user.clear(campo);
    await user.click(screen.getByRole('button', { name: 'Saltar' }));

    expect(onPageChange).not.toHaveBeenCalled();
    expect(campo).toHaveValue(3);
  });
});
