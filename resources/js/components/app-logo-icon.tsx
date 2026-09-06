import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" {...props}>
            <defs>
                <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#AD9334" />
                    <stop offset="100%" stopColor="#C2A74A" />
                </linearGradient>
            </defs>
            <rect width="40" height="40" rx="8" fill="#352A6F" />
            <path d="M12 20 L20 12 L28 20 L20 28 Z" fill="url(#gold-grad)" opacity="0.9" />
            <circle cx="20" cy="20" r="4" fill="#0F1020" />
        </svg>
    );
}
