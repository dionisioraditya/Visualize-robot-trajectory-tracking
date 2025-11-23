import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SimulationState } from '../types';

interface ChartsProps {
  data: SimulationState['history'];
}

export const ErrorChart: React.FC<ChartsProps> = ({ data }) => {
  // We only show the last 100 points for performance
  const displayData = data.slice(-100);

  return (
    <div className="h-40 w-full bg-white rounded-lg shadow-sm border border-slate-100 p-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Distance Error [m]</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 'auto']} tick={{fontSize: 10}} width={30} />
          <Tooltip 
            contentStyle={{fontSize: '12px', borderRadius: '4px'}}
            itemStyle={{padding: 0}}
            labelStyle={{display: 'none'}}
          />
          <Line
            type="monotone"
            dataKey="error"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ParameterChart: React.FC<ChartsProps> = ({ data }) => {
  const displayData = data.slice(-100);

  return (
    <div className="h-40 w-full bg-white rounded-lg shadow-sm border border-slate-100 p-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Parameter Adaptation (θ)</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} width={30} />
          <Tooltip 
             contentStyle={{fontSize: '12px', borderRadius: '4px'}}
             labelStyle={{display: 'none'}}
          />
          <Line
            type="monotone"
            dataKey="theta1"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            name="θ mass"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="theta2"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="θ inertia"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};