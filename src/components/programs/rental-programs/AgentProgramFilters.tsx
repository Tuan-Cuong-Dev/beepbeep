'use client'

import * as React from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'

/** Kiểu dữ liệu filters bạn sẽ truyền cho bảng để áp dụng */
export type ProgramFilters = {
  /** chuỗi tìm kiếm theo công ty / trạm / địa chỉ */
  query: string
  /** giới hạn khoảng cách km; null = tất cả */
  maxDistanceKm: number | null
  /** có tính cả những dòng không xác định được khoảng cách hay không */
  includeUnknownDistance: boolean
}

type Props = {
  value: ProgramFilters
  onChange: (next: ProgramFilters) => void
  className?: string
  placeholder?: string
  /** các mốc khoảng cách gợi ý (km) */
  distanceOptions?: number[]
}

const DEFAULT_DISTANCE_OPTIONS = [2, 5, 10, 20, 50, 100]

export default function AgentProgramFilters({
  value,
  onChange,
  className,
  placeholder,
  distanceOptions = DEFAULT_DISTANCE_OPTIONS,
}: Props) {
  const { t } = useTranslation('common')

  // debounce cho ô search để giảm re-render cha
  const [q, setQ] = React.useState(value.query ?? '')
  React.useEffect(() => setQ(value.query ?? ''), [value.query])

  React.useEffect(() => {
    const id = setTimeout(() => {
      if (q !== value.query) {
        onChange({ ...value, query: q })
      }
    }, 250) // 250ms debounce
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const setMax = (next: number | null) => onChange({ ...value, maxDistanceKm: next })
  const setIncludeUnknown = (next: boolean) =>
    onChange({ ...value, includeUnknownDistance: next })

  const reset = () =>
    onChange({ query: '', maxDistanceKm: null, includeUnknownDistance: true })

  return (
    <div
      className={clsx(
        'w-full rounded-xl border bg-white p-3 md:p-4',
        className
      )}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('agent_program_filters.search')}
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder ?? t('agent_program_filters.placeholder')}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none ring-0 focus:border-gray-400"
          />
        </div>

        {/* Distance select */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {t('agent_program_filters.distance')}
          </label>
          <select
            value={value.maxDistanceKm ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setMax(v === '' ? null : Number(v))
            }}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-gray-400"
          >
            <option value="">{t('agent_program_filters.all_distance')}</option>
            {distanceOptions.map((km) => (
              <option key={km} value={km}>
                {t('agent_program_filters.less_equal', { km })}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="unknown-dist"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={value.includeUnknownDistance}
              onChange={(e) => setIncludeUnknown(e.target.checked)}
            />
            <label htmlFor="unknown-dist" className="text-xs text-gray-600 select-none">
              {t('agent_program_filters.include_unknown')}
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 md:justify-end">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t('agent_program_filters.reset')}
          </button>
        </div>
      </div>
    </div>
  )
}
