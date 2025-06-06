import React from 'react';
import { tokens } from './tokens';

// Progress Bar Component
export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isOverMax = value > max;
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const colorClasses = {
    primary: isOverMax ? 'bg-red-500' : 'bg-blue-500',
    success: isOverMax ? 'bg-red-500' : 'bg-green-500',
    warning: isOverMax ? 'bg-red-500' : 'bg-yellow-500',
    error: 'bg-red-500'
  };
  
  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-slate-700">{label}</span>
          )}
          {showPercentage && (
            <span className={`text-sm font-medium ${
              isOverMax ? 'text-red-600' : 'text-slate-600'
            }`}>
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {/* Overflow indicator */}
        {isOverMax && (
          <div
            className="bg-red-500/30 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(percentage - 100, 100)}%` }}
          />
        )}
      </div>
    </div>
  );
};

// Metric Card Component
export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'neutral',
  className = ''
}) => {
  const colorClasses = {
    primary: 'from-blue-500/10 to-indigo-600/10 border-blue-200/50',
    success: 'from-green-500/10 to-emerald-600/10 border-green-200/50',
    warning: 'from-yellow-500/10 to-orange-600/10 border-yellow-200/50',
    error: 'from-red-500/10 to-pink-600/10 border-red-200/50',
    neutral: 'from-slate-500/10 to-gray-600/10 border-slate-200/50'
  };
  
  const iconColorClasses = {
    primary: 'from-blue-500 to-indigo-600',
    success: 'from-green-500 to-emerald-600',
    warning: 'from-yellow-500 to-orange-600',
    error: 'from-red-500 to-pink-600',
    neutral: 'from-slate-500 to-gray-600'
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl rounded-2xl border shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                trend.isPositive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {trend.isPositive ? '↗' : '↘'}
                {Math.abs(trend.value).toFixed(1)}%
              </span>
              {trend.label && (
                <span className="text-xs text-slate-500 ml-2">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 bg-gradient-to-br ${iconColorClasses[color]} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple Bar Chart Component
export interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  maxValue?: number;
  height?: number;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  maxValue,
  height = 200,
  className = ''
}) => {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className={`w-full ${className}`}>
      <div 
        className="flex items-end justify-between space-x-2 px-4"
        style={{ height: `${height}px` }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 40); // Leave space for labels
          const barColor = item.color || tokens.colors.primary[500];
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t-md transition-all duration-300 hover:opacity-80 min-w-[20px]"
                style={{ 
                  height: `${barHeight}px`,
                  backgroundColor: barColor
                }}
                title={`${item.label}: ${item.value}`}
              />
              <div className="mt-2 text-xs text-slate-600 text-center font-medium">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple Line Chart Component (using CSS and gradients)
export interface LineChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  color?: string;
  height?: number;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  color = tokens.colors.primary[500],
  height = 120,
  className = ''
}) => {
  if (data.length < 2) return null;
  
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  
  // Create SVG path for the line
  const width = 300; // Fixed width for simplicity
  const pathData = data.map((point, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((point.value - min) / range) * height;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return (
    <div className={`w-full ${className}`}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="30" height={height / 4} patternUnits="userSpaceOnUse">
            <path d={`M 0 0 L 0 ${height / 4}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            <path d={`M 0 0 L 30 0`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((point.value - min) / range) * height;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              className="hover:r-6 transition-all duration-200"
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </circle>
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="flex justify-between mt-2 px-2">
        {data.map((point, index) => (
          <div key={index} className="text-xs text-slate-600 text-center">
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// Donut Chart Component
export interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  centerContent?: React.ReactNode;
  className?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  strokeWidth = 20,
  showLegend = true,
  centerContent,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercentage = 0;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          
          {/* Data segments */}
          {data.map((segment, index) => {
            const percentage = (segment.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((accumulatedPercentage / 100) * circumference);
            
            accumulatedPercentage += percentage;
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 hover:brightness-110"
              >
                <title>{`${segment.label}: ${percentage.toFixed(1)}%`}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* Center content */}
        {centerContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent}
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="mt-4 grid grid-cols-2 gap-2 max-w-xs">
          {data.map((segment, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-slate-600 truncate">{segment.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 