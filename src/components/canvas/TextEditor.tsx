
import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';

export interface EditingTextState {
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontFamily: string;
    fill: string;
    rotation: number;
}

// A small buffer for width to prevent text from wrapping too early
const WIDTH_PADDING = 4;
// A minimum width for the text editor, especially for new, empty text boxes
const MIN_WIDTH = 20;

export const TextEditor: React.FC<{
    editingState: EditingTextState,
    onUpdate: (newText: string, newWidth: number, newHeight: number) => void,
    onCancel: () => void,
}> = ({ editingState, onUpdate, onCancel }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState(editingState.text);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            if (textareaRef.current.value === 'Text') {
                textareaRef.current.select();
            }
        }
    }, []);

    // Auto-adjust height while typing
    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [text]); // Only re-run when text changes

    const handleBlur = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Measure the final, optimal size on blur
            textarea.style.width = 'auto'; // Temporarily unset width to measure natural scrollWidth
            const scrollWidth = textarea.scrollWidth;
            const finalWidth = Math.max(scrollWidth, MIN_WIDTH) + WIDTH_PADDING;
            textarea.style.width = `${finalWidth}px`; // Re-apply for final measurement
            
            const finalHeight = textarea.scrollHeight;

            onUpdate(text, finalWidth, finalHeight);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleBlur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const style: React.CSSProperties = {
        position: 'absolute',
        top: `${editingState.y}px`,
        left: `${editingState.x}px`,
        width: `${editingState.width}px`, // Initial width is fixed
        height: 'auto',
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #66afe9',
        boxShadow: '0 0 8px rgba(102, 175, 233, 0.6)',
        borderRadius: '3px',
        color: editingState.fill,
        fontFamily: editingState.fontFamily,
        fontSize: `${editingState.fontSize}px`,
        lineHeight: 1.2, 
        padding: 0, 
        margin: 0,
        outline: 'none',
        overflow: 'hidden',
        resize: 'none',
        transform: `rotate(${editingState.rotation}deg)`,
        transformOrigin: 'top left',
        zIndex: 100,
    };

    return (
        <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={style}
        />
    );
};
