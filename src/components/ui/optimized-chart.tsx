import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface OptimizedResponsiveContainerProps {
  width?: string | number;
  height?: string | number;
  aspect?: number;
  children: React.ReactNode;
  className?: string;
}

export const OptimizedResponsiveContainer: React.FC<OptimizedResponsiveContainerProps> = ({
  width = "100%",
  height = 300,
  aspect,
  children,
  className
}) => {
  // If both width and height are fixed numbers, don't use ResponsiveContainer
  const isFixedSize = typeof width === 'number' && typeof height === 'number';
  
  if (isFixedSize) {
    return (
      <div 
        className={className}
        style={{ width, height }}
      >
        {children}
      </div>
    );
  }

  return (
    <ResponsiveContainer
      width={width}
      height={height}
      aspect={aspect}
      className={className}
    >
      {children as React.ReactElement}
    </ResponsiveContainer>
  );
};