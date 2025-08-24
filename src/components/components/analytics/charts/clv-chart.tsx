// src/components/analytics/charts/clv-chart.tsx

import React from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const mockData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    clv: parseFloat((Math.random() * 0.25 - 0.1).toFixed(3)), // -0.1 to +0.15
  };
});

const ClvChart: React.FC = () => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 className="text-lg font-semibold mb-2">Closing Line Value (CLV) Over Time</h3>
      <ResponsiveContainer>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[-0.2, 0.2]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
          <ReferenceLine y={0} stroke="gray" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="clv" stroke="#3B82F6" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClvChart;
