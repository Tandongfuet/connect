
import React from 'react';

interface BarChartProps {
  data: { [key: string]: number };
  height?: number;
  barColor?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, height = 250, barColor = '#4CAF50' }) => {
  const chartData = Object.entries(data);
  const maxValue = Math.max(...chartData.map(([, value]) => value as number), 0);
  const chartWidth = 500;
  const chartHeight = height;
  const barPadding = 5;
  const barWidth = chartData.length > 0 ? (chartWidth / chartData.length) - barPadding : 0;

  if (chartData.length === 0) {
    return <div style={{ height: `${height}px` }} className="flex items-center justify-center text-gray-muted bg-secondary dark:bg-dark-border dark:text-dark-muted rounded-md">No data available for this period.</div>
  }

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={height} aria-label="Bar chart" role="img">
      <g>
        {chartData.map(([label, value], index) => {
          const barHeight = maxValue > 0 ? ((value as number) / maxValue) * (chartHeight - 20) : 0;
          const x = index * (barWidth + barPadding);
          const y = chartHeight - barHeight - 15; // Adjusted for label space
          
          return (
            <g key={label} className="bar-group">
                <title>{`${label}: ${(value as number).toLocaleString()}`}</title>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                className="transition-all duration-300 ease-in-out hover:opacity-75"
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight - 5}
                textAnchor="middle"
                fontSize="10"
                className="fill-current text-gray-muted dark:text-dark-muted"
              >
                {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default BarChart;
