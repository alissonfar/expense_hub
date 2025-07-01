import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface ChartWidgetProps {
  data: ChartData[];
  type?: "line" | "bar";
  title?: string;
  height?: number;
  className?: string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  data,
  type = "line",
  title,
  height = 200,
  className,
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const getY = (value: number) => {
    return height - ((value - minValue) / range) * (height - 40) - 20;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * 280 + 40;
  };

  const generatePath = () => {
    if (type === "line") {
      return data
        .map((point, index) => {
          const x = getX(index);
          const y = getY(point.value);
          return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(" ");
    }
    return "";
  };

  return (
    <div
      className={cn(
        "p-6 rounded-xl glass-effect border border-white/20 shadow-lg animate-fade-in-up",
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {title}
        </h3>
      )}
      
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 360 ${height}`}
          className="overflow-visible"
        >
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="40"
              y1={height - ratio * (height - 40) - 20}
              x2="320"
              y2={height - ratio * (height - 40) - 20}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          ))}

          {/* Chart Content */}
          {type === "line" && (
            <>
              {/* Area Fill */}
              <path
                d={`${generatePath()} L ${getX(data.length - 1)} ${height - 20} L ${getX(0)} ${height - 20} Z`}
                fill="url(#gradient)"
                fillOpacity="0.2"
              />
              
              {/* Line */}
              <path
                d={generatePath()}
                stroke="url(#lineGradient)"
                strokeWidth="3"
                fill="none"
                className="animate-draw"
              />
              
              {/* Points */}
              {data.map((point, index) => (
                <circle
                  key={index}
                  cx={getX(index)}
                  cy={getY(point.value)}
                  r="4"
                  fill="currentColor"
                  className="text-primary animate-pulse"
                />
              ))}
            </>
          )}

          {type === "bar" && (
            <>
              {data.map((point, index) => {
                const x = getX(index) - 15;
                const barHeight = ((point.value - minValue) / range) * (height - 40);
                const y = height - 20 - barHeight;
                
                return (
                  <rect
                    key={index}
                    x={x}
                    y={y}
                    width="30"
                    height={barHeight}
                    fill="url(#barGradient)"
                    className="animate-grow"
                  />
                );
              })}
            </>
          )}

          {/* Gradients */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
            </linearGradient>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)" />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis Labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {data.map((point, index) => (
            <span key={index} className="text-center">
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}; 