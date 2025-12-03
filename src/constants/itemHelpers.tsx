
import React from 'react';

export const createIcon = (svgString: string) => `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

export const SvgIcon: React.FC<{ svg: string }> = ({ svg }) => (
    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />
);
