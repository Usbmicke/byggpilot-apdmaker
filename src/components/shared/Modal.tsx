
import React from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    // Använd en portal för att rendera modalen på toppen av DOM-trädet
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose} // Stäng om man klickar på bakgrunden
        >
            <div 
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 animate-slide-up"
                onClick={e => e.stopPropagation()} // Förhindra att klick inuti modalen stänger den
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition-colors"
                        aria-label="Stäng modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>,
        document.body // Rendera direkt under <body>-elementet
    );
};

export default Modal;
