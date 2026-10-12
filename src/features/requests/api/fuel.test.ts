import { afterEach, describe, expect, it } from 'vitest';
import api from '@/services/api';
import { dispatchFuelOrder } from './fuel';

describe('dispatchFuelOrder', () => {
  const originalAdapter = api.defaults.adapter;
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it('devuelve {message, fuel_order} tal como responde el backend', async () => {
    let seen: { method?: string; url?: string; data?: unknown } = {};
    api.defaults.adapter = (config) => {
      seen = { method: config.method, url: config.url, data: config.data };
      return Promise.resolve({
        data: {
          message: 'Transacción Registrada',
          fuel_order: { order_code: 'VC-001', actual_dispatched_gallons: 10 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    };

    const result = await dispatchFuelOrder('VC-001', {
      galones_reales_despachados: 10,
      valor_total_pagado: 25.5,
    });

    expect(seen.method).toBe('patch');
    expect(seen.url).toBe('/ordenes-combustible/VC-001/despachar');
    expect(JSON.parse(String(seen.data))).toEqual({
      galones_reales_despachados: 10,
      valor_total_pagado: 25.5,
    });
    expect(result.message).toBe('Transacción Registrada');
    expect(result.fuel_order.order_code).toBe('VC-001');
  });
});
