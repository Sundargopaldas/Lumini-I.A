import React from 'react';

const Logo = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 36 36" 
      className={className} 
      fill="none"
    >
      <defs>
        <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" /> {/* Amarelo */}
          <stop offset="100%" stopColor="#F59E0B" /> {/* Laranja */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Estrela Maior Central */}
      <path 
        d="M18 2L20.5 12.5L31 15L20.5 17.5L18 28L15.5 17.5L5 15L15.5 12.5L18 2Z" 
        fill="url(#starGradient)"
        filter="url(#glow)"
      />
      
      {/* Estrela Menor Esquerda */}
      <path 
        d="M9 22L10 26L14 27L10 28L9 32L8 28L4 27L8 26L9 22Z" 
        fill="#FCD34D"
        opacity="0.8"
      />
      
      {/* Estrela Menor Direita Superior */}
      <path 
        d="M26 4L27 8L31 9L27 10L26 14L25 10L21 9L25 8L26 4Z" 
        fill="#FCD34D"
        opacity="0.8"
      />
    </svg>
  );
};

export default Logo;
