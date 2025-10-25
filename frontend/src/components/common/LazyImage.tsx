/**
 * Lazy Image Component
 * 
 * Implements lazy loading for images using Intersection Observer API.
 * Improves initial page load performance by only loading images when they're near the viewport.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Skeleton } from '@mui/material';
import { styled } from '@mui/material/styles';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  borderRadius?: string | number;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

const StyledImage = styled('img')({
  display: 'block',
  width: '100%',
  height: '100%',
});

/**
 * LazyImage Component
 * 
 * Loads images only when they're about to enter the viewport.
 * Shows a skeleton placeholder while loading.
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  borderRadius = 0,
  fallback,
  onLoad,
  onError,
  className,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  return (
    <Box
      ref={imgRef}
      className={className}
      sx={{
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'grey.100',
      }}
    >
      {/* Show skeleton while not loaded */}
      {!isLoaded && !hasError && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}

      {/* Show error fallback if image fails to load */}
      {hasError && fallback ? (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'grey.200',
            color: 'text.secondary',
          }}
        >
          {fallback}
        </Box>
      ) : null}

      {/* Load image only when in viewport */}
      {isInView && !hasError && (
        <StyledImage
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy" // Native lazy loading as backup
          style={{
            objectFit,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}
    </Box>
  );
};

/**
 * LazyThumbnail Component
 * 
 * Optimized for small thumbnail images in grids.
 */
export const LazyThumbnail: React.FC<LazyImageProps & { size?: number }> = ({
  size = 150,
  ...props
}) => {
  return (
    <LazyImage
      {...props}
      width={size}
      height={size}
      objectFit="cover"
      borderRadius={1}
    />
  );
};

/**
 * LazyBackgroundImage Component
 * 
 * For background images with content overlay.
 */
export const LazyBackgroundImage: React.FC<
  LazyImageProps & { children?: React.ReactNode }
> = ({ src, alt, children, height = 400, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [isInView, src]);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height,
        position: 'relative',
        backgroundImage: isLoaded ? `url(${src})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: 'grey.200',
        ...props,
      }}
    >
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}
      {children}
    </Box>
  );
};

export default LazyImage;

