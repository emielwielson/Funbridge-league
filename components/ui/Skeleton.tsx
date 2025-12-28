'use client';

import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean | 'full';
  className?: string;
}

export default function Skeleton({
  width,
  height,
  rounded = false,
  className = '',
}: SkeletonProps) {
  const widthStyle = width
    ? typeof width === 'number'
      ? { width: `${width}px` }
      : { width }
    : {};
  const heightStyle = height
    ? typeof height === 'number'
      ? { height: `${height}px` }
      : { height }
    : {};

  const roundedClass =
    rounded === true
      ? 'rounded'
      : rounded === 'full'
      ? 'rounded-full'
      : '';

  return (
    <div
      className={`animate-pulse bg-gray-200 ${roundedClass} ${className}`}
      style={{ ...widthStyle, ...heightStyle }}
      aria-hidden="true"
    />
  );
}

