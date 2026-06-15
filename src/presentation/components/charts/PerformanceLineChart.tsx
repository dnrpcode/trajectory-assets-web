import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PortfolioHistoryPoint } from '../../../domain/entities/Portfolio';
import { formatMonth } from '../../../shared/utils/formatDate';
import { formatCurrencyCompact } from '../../../shared/utils/formatCurrency';

interface Props {
  data: PortfolioHistoryPoint[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm border border-gray-100">
        <p className="font-medium text-gray-700 mb-1">{label ? formatMonth(label) : ''}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-bold">
            {p.name}: {formatCurrencyCompact(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PerformanceLineChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Belum ada data historis
      </div>
    );
  }

  const chartData = data.map((d) => ({
    month: d.month,
    'Nilai Portofolio': d.totalValueIDR,
    'Modal': d.totalCostBasisIDR,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          tickFormatter={(v: string) => {
            const [, m] = v.split('-');
            return `${m}`;
          }}
          tick={{ fontSize: 11, fill: '#6b7280' }}
        />
        <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v)} tick={{ fontSize: 11, fill: '#6b7280' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="Nilai Portofolio"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Modal"
          stroke="#d1d5db"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 4"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
