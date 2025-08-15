import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 2 },
    md: { icon: 32, text: 'text-2xl', gap: 3 },
    lg: { icon: 40, text: 'text-3xl', gap: 4 }
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-${currentSize.gap} ${className}`}>
      {/* Modern Logo Icon */}
      <div className="relative">
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Background gradient circle */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="50%" stopColor="#764ba2" />
              <stop offset="100%" stopColor="#f093fb" />
            </linearGradient>
            <filter id="logoShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
            </filter>
          </defs>
          
          {/* Main book shape with modern design */}
          <rect
            x="8"
            y="6"
            width="28"
            height="36"
            rx="3"
            fill="url(#logoGradient)"
            opacity="0.1"
          />
          
          {/* Book pages effect */}
          <path
            d="M12 10 L24 10 L24 38 L12 38 Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M24 10 L36 10 L36 38 L24 38 Z"
            fill="white"
            opacity="0.8"
          />
          
          {/* Book spine */}
          <rect
            x="23"
            y="10"
            width="2"
            height="28"
            fill="url(#logoGradient)"
            opacity="0.6"
          />
          
          {/* AI brain symbol overlay */}
          <g transform="translate(24, 24)">
            <circle
              r="8"
              fill="url(#logoGradient)"
              opacity="0.9"
              filter="url(#logoShadow)"
            />
            <path
              d="M-4 0 Q-2 -2 0 0 Q2 2 4 0"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M-3 -2 L-3 2 M0 -3 L0 3 M3 -2 L3 2"
              stroke="white"
              strokeWidth="1"
              opacity="0.7"
              strokeLinecap="round"
            />
          </g>
        </svg>
        
        {/* Animated pulse effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-ping" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-black ${currentSize.text} bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent`}>
            DocuSense
          </h1>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 font-medium tracking-wider uppercase">
              Intelligent PDF Reading
            </span>
          )}
        </div>
      )}
    </div>
  );
}