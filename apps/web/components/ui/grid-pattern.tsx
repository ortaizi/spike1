import React from 'react';

interface GridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: string;
  className?: string;
}

export const GridPattern: React.FC<GridPatternProps> = ({
  width = 40,
  height = 40,
  x = 0,
  y = 0,
  strokeDasharray = "0",
  className = ""
}) => {
  return (
    <div className={`absolute inset-0 -z-10 h-full w-full bg-white [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)] ${className}`}>
      <svg
        className="absolute inset-x-0 inset-y-[-50%] h-[200%] w-full skew-y-[-18deg] fill-black/[0.02] stroke-black/[0.02]"
        aria-hidden="true"
        style={{
          transform: `translate(${x}px, ${y}px)`
        }}
      >
        <defs>
          <pattern
            id="grid-pattern"
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
          >
            <path 
              d={`M.5 ${height}V.5H${width}`} 
              fill="none" 
              strokeDasharray={strokeDasharray}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#grid-pattern)" />
      </svg>
    </div>
  );
};
