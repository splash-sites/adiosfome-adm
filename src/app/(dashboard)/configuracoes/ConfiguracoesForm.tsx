'use client';

import { useActionState, useState } from 'react';
import { updateRestaurantAction, type FormState } from './actions';
import type { Restaurant } from '@/domain/entities/Restaurant';

const initialState: FormState = { error: null, success: false };

const DAY_LABELS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

type DayRow = { enabled: boolean; opensAt: string; closesAt: string };

function buildInitialDayRows(restaurant: Restaurant): DayRow[] {
  return DAY_LABELS.map((_, day) => {
    const existing = restaurant.openingHours.find((oh) => oh.day === day);
    return existing
      ? { enabled: true, opensAt: existing.opensAt, closesAt: existing.closesAt }
      : { enabled: false, opensAt: '09:00', closesAt: '18:00' };
  });
}

export function ConfiguracoesForm({ restaurant }: { restaurant: Restaurant }) {
  const [state, action, pending] = useActionState(updateRestaurantAction, initialState);
  const [dayRows, setDayRows] = useState<DayRow[]>(() => buildInitialDayRows(restaurant));

  const updateDay = (day: number, field: keyof DayRow, value: string | boolean) => {
    setDayRows((prev) => prev.map((row, i) => (i === day ? { ...row, [field]: value } : row)));
  };

  const openingHoursJson = JSON.stringify(
    dayRows
      .map((row, day) => ({ day, opensAt: row.opensAt, closesAt: row.closesAt, enabled: row.enabled }))
      .filter((row) => row.enabled)
      .map(({ day, opensAt, closesAt }) => ({ day, opensAt, closesAt }))
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="openingHours" value={openingHoursJson} />

      <label className="flex flex-col gap-1 text-sm">
        Nome do restaurante
        <input
          name="name"
          type="text"
          required
          defaultValue={restaurant.name}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Slug (usado na URL do cardapio)
        <input
          name="slug"
          type="text"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          defaultValue={restaurant.slug}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Endereco
        <input
          name="address"
          type="text"
          required
          defaultValue={restaurant.address}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Telefone
        <input
          name="phone"
          type="tel"
          required
          defaultValue={restaurant.phone}
          className="rounded border px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Taxa de entrega (R$)
        <input
          name="deliveryFee"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={restaurant.deliveryFee}
          className="rounded border px-3 py-2"
        />
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Horario de funcionamento</p>
        {DAY_LABELS.map((label, day) => {
          const row = dayRows[day];
          return (
            <div key={day} className="flex items-center gap-2 text-sm">
              <label className="flex w-28 items-center gap-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateDay(day, 'enabled', e.target.checked)}
                />
                {label}
              </label>
              <input
                type="time"
                value={row.opensAt}
                disabled={!row.enabled}
                onChange={(e) => updateDay(day, 'opensAt', e.target.value)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              />
              <span>ate</span>
              <input
                type="time"
                value={row.closesAt}
                disabled={!row.enabled}
                onChange={(e) => updateDay(day, 'closesAt', e.target.value)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              />
            </div>
          );
        })}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">Salvo!</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
