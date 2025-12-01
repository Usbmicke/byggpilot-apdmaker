
import React from 'react';

const ExportingLoader: React.FC = () => {
    return (
        <div className="absolute inset-0 bg-slate-900/95 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="construction-loader">
                <div className="relative">
                    <svg className="helmet-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 38 C 8 20, 56 20, 56 38 L 56 42 L 8 42 Z" fill="#FFC107" stroke="#fff" strokeWidth="2" />
                        <path d="M4 42 L 60 42 L 60 48 C 60 50, 4 50, 4 48 Z" fill="#FFC107" stroke="#fff" strokeWidth="2" />
                        <rect x="28" y="18" width="8" height="12" fill="#FFE082" />
                    </svg>
                    <svg className="hammer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14.5 5.5L18.5 9.5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                        <path d="M12 8L16 12L7 21L3 17L12 8Z" fill="#a16207" stroke="#fff" strokeWidth="1" />
                        <path d="M16 3L21 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        <path d="M13 6L18 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
                <div className="loader-text-main">BYGGPILOT</div>
                <div className="loader-text-sub">Export pågår...</div>
            </div>
        </div>
    );
};

export default ExportingLoader;
