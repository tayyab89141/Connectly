
export const Logo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* SVG Icon matching the Connectly logo */}
      <svg viewBox="0 0 100 100" className="h-full w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="connectly-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C42F5" />
            <stop offset="100%" stopColor="#A43EF5" />
          </linearGradient>
          <linearGradient id="connectly-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#953EF5" />
            <stop offset="100%" stopColor="#D84ED2" />
          </linearGradient>
        </defs>
        
        {/* Left Circle / Loop */}
        <path d="M 50 15 A 35 35 0 1 0 50 85 A 35 35 0 0 0 50 15 Z M 50 30 A 20 20 0 1 1 50 70 A 20 20 0 0 1 50 30 Z" fill="url(#connectly-grad1)" />
        
        {/* Right overlapping part */}
        <path d="M 65 50 C 65 35 55 20 50 15 C 65 20 75 35 75 50 C 75 65 65 80 50 85 C 55 80 65 65 65 50 Z" fill="url(#connectly-grad2)" />
        
        {/* Inner dot */}
        <circle cx="50" cy="50" r="10" fill="url(#connectly-grad1)" />
      </svg>

      {/* Text matching the Connectly logo */}
      <span className="font-bold text-xl tracking-tight text-[#181820] flex items-center">
        connect<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#953EF5] to-[#D84ED2]">ly</span>
      </span>
    </div>
  );
};
