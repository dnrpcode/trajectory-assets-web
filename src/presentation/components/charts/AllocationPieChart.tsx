import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AllocationTarget, AssetCategory } from '../../../shared/types';
import { CATEGORY_LABELS, CATEGORY_COLORS, ALL_CATEGORIES } from '../../../shared/constants/categories';

interface Props {
  actual: AllocationTarget;
  target?: AllocationTarget;
  title?: string;
}

function allocationToData(allocation: AllocationTarget) {
  return ALL_CATEGORIES
    .filter((cat) => allocation[cat] > 0)
    .map((cat) => ({
      name: CATEGORY_LABELS[cat],
      value: Math.round(allocation[cat] * 10) / 10,
      color: CATEGORY_COLORS[cat],
    }));
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg px-3 py-2 text-sm border border-gray-100">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-indigo-600 font-bold">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export function AllocationPieChart({ actual, target, title }: Props) {
  const actualData = allocationToData(actual);
  const targetData = target ? allocationToData(target) : null;

  if (targetData) {
    return (
      <div>
        {title && <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-center text-gray-500 mb-1">Aktual</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={actualData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {actualData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-center text-gray-500 mb-1">Target</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={targetData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                  {targetData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
          {ALL_CATEGORIES.map((cat) => (
            (actual[cat as AssetCategory] > 0 || (target && target[cat as AssetCategory] > 0)) && (
              <span key={cat} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: CATEGORY_COLORS[cat as AssetCategory] }} />
                {CATEGORY_LABELS[cat as AssetCategory]}
              </span>
            )
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {title && <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={actualData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
            {actualData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
