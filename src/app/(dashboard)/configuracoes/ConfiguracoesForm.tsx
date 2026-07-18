'use client';

import { useActionState, useState } from 'react';
import { updateRestaurantAction, type FormState } from './actions';
import type { Restaurant } from '@/domain/entities/Restaurant';
import { Button } from '@/components/ui/Button';
import { cardClass, inputClass, labelClass } from '@/components/ui/styles';

const initialState: FormState = { error: null, success: false };

const DAY_LABELS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, '0');
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

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
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="openingHours" value={openingHoursJson} />

      <div className={`${cardClass} flex flex-col gap-5 p-6`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
          Dados do restaurante
        </p>

        <label className={labelClass}>
          Nome do restaurante
          <input name="name" type="text" required defaultValue={restaurant.name} className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Slug (usado na URL do cardapio)
            <input
              name="slug"
              type="text"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={restaurant.slug}
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Telefone
            <input name="phone" type="tel" required defaultValue={restaurant.phone} className={inputClass} />
          </label>
        </div>

        <label className={labelClass}>
          Endereco
          <input name="address" type="text" required defaultValue={restaurant.address} className={inputClass} />
        </label>

        <label className={`${labelClass} max-w-[220px]`}>
          Taxa de entrega (R$)
          <input
            name="deliveryFee"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={restaurant.deliveryFee}
            className={inputClass}
          />
        </label>
      </div>

      <div className={`${cardClass} flex flex-col gap-3 p-6`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
          Horario de funcionamento
        </p>
        {DAY_LABELS.map((label, day) => {
          const row = dayRows[day];
          return (
            <div key={day} className="flex items-center gap-3 text-sm">
              <label className="flex w-28 shrink-0 items-center gap-2 text-black/70">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateDay(day, 'enabled', e.target.checked)}
                />
                {label}
              </label>
              <select
                value={row.opensAt}
                disabled={!row.enabled}
                onChange={(e) => updateDay(day, 'opensAt', e.target.value)}
                className={`${inputClass} py-1.5`}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-black/40">ate</span>
              <select
                value={row.closesAt}
                disabled={!row.enabled}
                onChange={(e) => updateDay(day, 'closesAt', e.target.value)}
                className={`${inputClass} py-1.5`}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Salvo!</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
