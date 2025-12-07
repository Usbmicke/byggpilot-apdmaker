
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

const WIDTH_PADDING = 4;
const MIN_WIDTH = 20;

export const TextEditor: React.FC<{
    editingState: EditingTextState,
    onUpdate: (newText: string, newWidth: number, newHeight: number) => void,
    onCancel: () => void,
}> = ({ editingState, onUpdate, onCancel }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [text, setText] = useState(editingState.text);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            // Force focus
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    if (editingState.text === 'Text') {
                        textareaRef.current.select();
                    }
                }
            }, 50);
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleDone();
            }
        };

        // Delay attaching the listener to avoid capturing the initial creation click
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, []);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [text]);

    const handleDone = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.width = 'auto';
            const scrollWidth = textarea.scrollWidth;
            const finalWidth = Math.max(scrollWidth, MIN_WIDTH) + WIDTH_PADDING;
            textarea.style.width = `${finalWidth}px`;

            const finalHeight = textarea.scrollHeight;
            onUpdate(text, finalWidth, finalHeight);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        e.stopPropagation(); // Stop event from bubbling to Canvas/Window

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleDone();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const editorStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${editingState.y}px`,
        left: `${editingState.x}px`,
        transform: `rotate(${editingState.rotation}deg)`,
        transformOrigin: 'top left',
        zIndex: 1000, // Force high z-index
        pointerEvents: 'auto', // Ensure clicks are captured here
    };

    const textareaStyle: React.CSSProperties = {
        width: `${editingState.width}px`,
        height: 'auto',
        background: 'transparent', // Transparent background as requested
        border: '1px solid #60a5fa', // Light blue border (blue-400)
        boxShadow: 'none',
        borderRadius: '4px',
        color: editingState.fill,
        fontFamily: editingState.fontFamily,
        fontSize: `${editingState.fontSize}px`,
        lineHeight: 1.2,
        padding: '5px', // Match padding in DraggableObject
        margin: 0,
        outline: 'none',
        overflow: 'hidden',
        resize: 'none',
        display: 'block',
        pointerEvents: 'auto',
    };

    return (
        <div ref={containerRef} style={editorStyle}>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                style={textareaStyle}
            />
            <button
                onClick={handleDone}
                style={{
                    marginTop: '5px',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '3px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    cursor: 'pointer',
                }}
            >
                Klar
            </button>
        </div>
    );
};
