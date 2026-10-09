import React from 'react';

interface KemenagLogoProps {
  className?: string;
  size?: number;
}

export const KemenagLogo: React.FC<KemenagLogoProps> = ({ className = '', size = 80 }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-kemenag.svg"
        alt="Logo Resmi Kementerian Agama Republik Indonesia"
        width={size}
        height={size}
        className="w-full h-full object-contain filter drop-shadow-sm"
        loading="eager"
      />
    </div>
  );
};
