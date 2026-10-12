import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TeacherLiquidationPage from './TeacherLiquidationPage';
import { fetchTeacherPendingLiquidations, type RouteSheetSummary } from '../api/postTrip';

vi.mock('../api/postTrip', () => ({
  fetchTeacherPendingLiquidations: vi.fn(),
}));

describe('TeacherLiquidationPage', () => {
  it('lista las comisiones y avisa que la liquidación no está disponible', async () => {
    vi.mocked(fetchTeacherPendingLiquidations).mockResolvedValue([
      {
        id: 12,
        initial_mileage: 100,
        final_mileage: 200,
        trip_status: 'pendiente_feedback',
        vehicle: { id: 1, plate: 'MAA-1234', brand: 'Toyota', model: 'Hiace' },
        driver: { id: 1, user: { id: 2, first_name: 'Luis', last_name: 'Mera' } },
        request: {
          id: 3,
          origin: 'Manta',
          destination: 'Quito',
          travel_reason: 'Congreso',
          departure_date: '2026-10-01',
          return_date: '2026-10-03',
          projected_cost: '0',
          requester: { id: 4, first_name: 'Eva', last_name: 'F' },
        },
      } satisfies RouteSheetSummary,
    ]);

    render(
      <MemoryRouter>
        <TeacherLiquidationPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText('La liquidación de viáticos no está disponible todavía.')
    ).toBeInTheDocument();
    expect(await screen.findByText('Destino: Quito')).toBeInTheDocument();
    expect(screen.getByText(/MAA-1234/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /calcular/i })).not.toBeInTheDocument();
  });
});
