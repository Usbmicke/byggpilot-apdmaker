import { useMemo } from 'react';
import * as THREE from 'three';

// Helper for building facade texture (Realistic Stucco/Concrete)
export const useBuildingTexture = (baseColor: string) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // 1. Base Wall (Stucco/Concrete)
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 1024, 1024);

            // 2. Add Noise/Texture
            for (let i = 0; i < 50000; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 1024;
                // Dark specs
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
                ctx.fillRect(x, y, 2, 2);
                // Light specs
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
                ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
            }

            // 3. Draw Windows
            const cols = 4; // Horizontal windows per texture tile
            const rows = 4; // Vertical floors per texture tile

            const tileW = 1024;
            const tileH = 1024;

            const winW = 120;
            const winH = 160;
            const paddingX = (tileW - (cols * winW)) / (cols + 1);
            const paddingY = (tileH - (rows * winH)) / (rows + 1);

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const x = paddingX + c * (winW + paddingX);
                    const y = paddingY + r * (winH + paddingY);

                    // Window Sill/Frame (Outer)
                    ctx.fillStyle = '#CCCCCC'; // Concrete sill
                    ctx.fillRect(x - 4, y - 4, winW + 8, winH + 8);

                    // Frame (Inner)
                    ctx.fillStyle = '#333333'; // Dark Grey/Black Frame
                    ctx.fillRect(x, y, winW, winH);

                    // Interior (Dark backing)
                    ctx.fillStyle = '#1a252f';
                    ctx.fillRect(x + 6, y + 6, winW - 12, winH - 12);

                    // Glass Reflection
                    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)'; // Light Blue tint
                    ctx.fillRect(x + 6, y + 6, winW - 12, winH - 12);

                    // Simple diagonal reflection streak
                    ctx.beginPath();
                    ctx.moveTo(x + 10, y + winH - 20);
                    ctx.lineTo(x + winW - 20, y + 10);
                    ctx.lineTo(x + winW - 10, y + 10);
                    ctx.lineTo(x + 10, y + winH - 10);
                    ctx.fillStyle = 'rgba(255,255,255,0.15)';
                    ctx.fill();
                }
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        // Optimization: Reduce anisotropy if performance issue, but 4 is good for oblique views
        texture.anisotropy = 4;
        return texture;
    }, [baseColor]);
};

// Helper to generate a procedural fence texture
export const useFenceTexture = (color: string) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Higher resolution for crisper fences
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'rgba(0,0,0,0)'; // Transparent background
            ctx.clearRect(0, 0, 128, 128);

            // Draw chainlink pattern (diamond shape)
            ctx.strokeStyle = color; // Dynamic Color (Light Green)
            ctx.lineWidth = 3; // Thicker wire for visibility at distance
            ctx.beginPath();
            // Criss-cross lines (scaled to 128)
            const s = 2; // Scale factor
            ctx.moveTo(0, 0); ctx.lineTo(32 * s, 32 * s);
            ctx.moveTo(32 * s, 0); ctx.lineTo(64 * s, 32 * s);
            ctx.moveTo(0, 32 * s); ctx.lineTo(32 * s, 64 * s);
            ctx.moveTo(32 * s, 32 * s); ctx.lineTo(64 * s, 64 * s);

            ctx.moveTo(32 * s, 0); ctx.lineTo(0, 32 * s);
            ctx.moveTo(64 * s, 0); ctx.lineTo(32 * s, 32 * s);
            ctx.moveTo(32 * s, 32 * s); ctx.lineTo(0, 64 * s);
            ctx.moveTo(64 * s, 32 * s); ctx.lineTo(32 * s, 64 * s);

            ctx.stroke();

            // Border (Top/Bottom wires)
            ctx.strokeStyle = color; // Match wire color
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 4); ctx.lineTo(128, 4);
            ctx.moveTo(0, 124); ctx.lineTo(128, 124);
            ctx.stroke();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }, [color]);
};

// Helper for hatched texture (construction zones)
export const useHatchTexture = (baseColor: string, isSchakt: boolean = false) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            if (isSchakt) {
                // Schakt: Dark soil with noise/texture
                ctx.fillStyle = '#3E2723'; // Dark earth
                ctx.fillRect(0, 0, 512, 512);

                // Add noise
                for (let i = 0; i < 20000; i++) {
                    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
                    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
                    ctx.fillStyle = `rgba(100,60,40,${Math.random() * 0.2})`;
                    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
                }

                // Inner Shadow / Depth Gradient
                const grad = ctx.createRadialGradient(256, 256, 100, 256, 256, 300);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.5)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 512, 512);

            } else {
                // Standard Hatching for Zones (e.g. No Parking)
                ctx.fillStyle = baseColor; // Background
                ctx.fillRect(0, 0, 512, 512);

                // Diagonal Lines
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 10;
                ctx.beginPath();
                for (let i = -512; i < 1024; i += 40) {
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i + 512, 512);
                }
                ctx.stroke();
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }, [baseColor, isSchakt]);
};
