'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Player } from '@lordicon/react';

// Define the ref methods interface
interface LordIconRef {
    playAnimation: () => void;
    goToFirstFrame: () => void;
}

// Define the props for the LordIcon component
interface LordIconProps {
    icon?: any; // Icon data (JSON)
    src?: string; // URL to load icon from
    size?: number;
    colorize?: string;
    colors?: string;
    direction?: 1 | -1;
    renderMode?: "AUTOMATIC" | "HARDWARE" | "SOFTWARE";
    onReady?: () => void;
    onComplete?: () => void;
    trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang' | 'playOnce' | 'hover-click' | 'manual';
    className?: string;
}

const LordIcon = forwardRef<LordIconRef, LordIconProps>(({
    icon,
    src,
    size = 24,
    colorize,
    colors,
    direction,
    renderMode,
    onReady,
    onComplete,
    trigger = 'hover',
    className = '',
}, ref) => {
    const playerRef = useRef<Player>(null);
    const [iconData, setIconData] = useState<any>(icon || null);
    const [isLoading, setIsLoading] = useState(!icon && !!src);
    const [isPlaying, setIsPlaying] = useState(false);

    // Expose playAnimation and goToFirstFrame methods to parent components
    useImperativeHandle(ref, () => ({
        playAnimation: () => {
            if (playerRef.current && !isPlaying) {
                playerRef.current.playFromBeginning();
                setIsPlaying(true);
            }
        },
        goToFirstFrame: () => {
            if (playerRef.current) {
                playerRef.current.goToFirstFrame();
                setIsPlaying(false);
            }
        }
    }));

    // Handle URL loading
    useEffect(() => {
        if (src && !icon) {
            const fetchIconData = async () => {
                try {
                    const response = await fetch(src);
                    if (response.ok) {
                        const data = await response.json();
                        setIconData(data);
                    } else {
                        console.warn(`Failed to load Lordicon from ${src}: ${response.status}`);
                    }
                } catch (error) {
                    console.warn(`Error loading Lordicon from ${src}:`, error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchIconData();
        } else if (icon) {
            setIconData(icon);
            setIsLoading(false);
        }
    }, [src, icon]);

    if (isLoading) {
        return (
            <div
                className={`inline-flex items-center justify-center ${className}`}
                style={{ width: size, height: size }}
            >
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
        );
    }

    if (!iconData) {
        return (
            <div
                className={`inline-flex items-center justify-center ${className}`}
                style={{ width: size, height: size }}
            >
                <div className="w-3 h-3 bg-gray-400 rounded-sm" />
            </div>
        );
    }

    return (
        <span
            className={`inline-flex items-center justify-center ${className}`}
            style={{
                width: size,
                height: size,
                pointerEvents: trigger === 'manual' ? 'none' : 'auto'
            }}
            onMouseEnter={() => {
                if (trigger === 'hover' && playerRef.current && !isPlaying) {
                    playerRef.current.playFromBeginning();
                    setIsPlaying(true);
                }
            }}
            onMouseLeave={() => {
                if (trigger === 'hover' && playerRef.current) {
                    playerRef.current.goToFirstFrame();
                    setIsPlaying(false);
                }
            }}
        >
            <Player
                ref={playerRef}
                icon={iconData}
                size={size}
                colorize={colorize}
                colors={colors}
                direction={direction}
                renderMode={renderMode}
                onReady={onReady}
                onComplete={() => {
                    setIsPlaying(false);
                    onComplete?.();
                }}
            />
        </span>
    );
});

LordIcon.displayName = 'LordIcon';

export type { LordIconRef };
export default LordIcon;
