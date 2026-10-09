import React from 'react';

interface KemenagLogoProps {
  className?: string;
  size?: number;
}

export const KemenagLogo: React.FC<KemenagLogoProps> = ({ className = '', size = 80 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Shield / Perisai Segi Lima */}
        <path
          d="M100 12 L178 44 L152 148 L100 188 L48 148 L22 44 Z"
          fill="#006640"
          stroke="#D4AF37"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Inner Golden Border */}
        <path
          d="M100 24 L166 52 L144 140 L100 174 L56 140 L34 52 Z"
          fill="#015233"
          stroke="#F3E5AB"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Bintang Emas Sudut Lima */}
        <polygon
          points="100,32 106,48 122,48 109,58 114,74 100,64 86,74 91,58 78,48 94,48"
          fill="#FFD700"
          stroke="#D4AF37"
          strokeWidth="1.5"
        />

        {/* Kitab Suci Al-Qur'an / Buku Terbuka */}
        <path
          d="M72 88 Q100 78 100 94 Q100 78 128 88 L126 122 Q100 112 100 124 Q100 112 74 122 Z"
          fill="#FFFFFF"
          stroke="#D4AF37"
          strokeWidth="3"
        />
        {/* Garis Lembaran Kitab */}
        <line x1="100" y1="94" x2="100" y2="124" stroke="#006640" strokeWidth="2" />
        <path d="M80 97 Q90 93 96 95" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M80 105 Q90 101 96 103" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M80 113 Q90 109 96 111" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M104 95 Q110 93 120 97" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M104 103 Q110 101 120 105" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M104 111 Q110 109 120 113" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

        {/* Tangkai Pena Bulu Emas */}
        <path
          d="M100 76 Q103 100 108 124"
          stroke="#FFD700"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Padi & Kapas Melengkung */}
        {/* Padi Kiri */}
        <path
          d="M50 80 Q56 120 86 148"
          stroke="#FFD700"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Kapas Kanan */}
        <path
          d="M150 80 Q144 120 114 148"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Pita Putih Semboyan Bawah */}
        <path
          d="M52 148 Q100 134 148 148 L142 162 Q100 148 58 162 Z"
          fill="#FFFFFF"
          stroke="#D4AF37"
          strokeWidth="2"
        />
        {/* Text IKHLAS BERAMAL */}
        <text
          x="100"
          y="157"
          fill="#006640"
          fontSize="8.5"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="sans-serif"
          letterSpacing="0.6"
        >
          IKHLAS BERAMAL
        </text>
      </svg>
    </div>
  );
};
