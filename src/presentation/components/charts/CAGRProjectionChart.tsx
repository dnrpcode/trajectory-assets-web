import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrencyCompact } from '../../../shared/utils/formatCurrency';

interface DataPoint { year: number; base: number; optimistic: number; pessimistic: number; }
interface Props { data: DataPoint[]; }

export function CAGRProjectionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} />
        <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v)} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} />
        <Tooltip
          formatter={(value) => [formatCurrencyCompact(Number(value))]}
          contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)' }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
        <Line type="monotone" name="Optimis" dataKey="optimistic" stroke="var(--ai-accent)" strokeWidth={2} strokeDasharray="3 3" dot={false} />
        <Line type="monotone" name="Base Rate" dataKey="base" stroke="var(--gain-500)" strokeWidth={3} dot={false} />
        <Line type="monotone" name="Pesimis" dataKey="pessimistic" stroke="var(--warn-400)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
