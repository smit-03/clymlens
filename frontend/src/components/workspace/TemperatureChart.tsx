import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";

import type { DailyRow } from "../../lib/weatherData";
import { formatTemp, shortDate, weekday } from "../../lib/format";

const COLORS = {
  max: "var(--color-temp-max, #e8722b)",
  min: "var(--color-temp-min, #2f8fd6)",
  mean: "var(--color-temp-mean, #94a3b8)",
};

interface ChartDatum {
  date: string;
  tMax: number | null;
  tMin: number | null;
  tMean: number | null;
  band: [number, number] | null;
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as ChartDatum;
  const line = (label: string, value: number | null, color: string) => (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-medium tabular-nums text-slate-800">{formatTemp(value)}</span>
    </div>
  );
  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 font-medium text-slate-900">
        {weekday(row.date)} · {shortDate(row.date)}
      </p>
      <div className="space-y-1">
        {line("High", row.tMax, COLORS.max)}
        {line("Low", row.tMin, COLORS.min)}
        {row.tMean !== null && line("Mean", row.tMean, COLORS.mean)}
      </div>
    </div>
  );
}

export function TemperatureChart({ rows, unit }: { rows: DailyRow[]; unit: string }) {
  const data = useMemo<ChartDatum[]>(
    () =>
      rows.map((row) => ({
        date: row.date,
        tMax: row.tMax,
        tMin: row.tMin,
        tMean: row.tMean,
        band: row.tMax !== null && row.tMin !== null ? [row.tMin, row.tMax] : null,
      })),
    [rows],
  );

  const tickInterval = data.length > 12 ? Math.ceil(data.length / 8) - 1 : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <LegendDot color={COLORS.max} label={`Daily high (${unit})`} />
        <LegendDot color={COLORS.min} label={`Daily low (${unit})`} />
        {rows.some((r) => r.tMean !== null) && <LegendDot color={COLORS.mean} label="Mean" dashed />}
      </div>
      <div className="h-[260px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="clymlens-band" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-400, #578bfb)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--color-brand-400, #578bfb)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              interval={tickInterval}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              minTickGap={8}
            />
            <YAxis
              width={44}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${Math.round(v)}°`}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="band"
              stroke="none"
              fill="url(#clymlens-band)"
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="tMean"
              stroke={COLORS.mean}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="tMax"
              stroke={COLORS.max}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.max }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="tMin"
              stroke={COLORS.min}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.min }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-0.5 w-4 rounded"
        style={{
          backgroundColor: dashed ? "transparent" : color,
          backgroundImage: dashed ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)` : undefined,
        }}
      />
      {label}
    </span>
  );
}
