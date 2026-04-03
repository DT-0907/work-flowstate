"use client";

import React, { type CSSProperties, type ReactNode } from "react";

export interface GlassSurfaceProps {
  children?: ReactNode;
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
  style?: CSSProperties;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = "100%",
  height = "auto",
  borderRadius = 8,
  className,
  style,
}) => (
  <div
    className={`border-2 border-white/20 bg-transparent ${className || ""}`}
    style={{ width, height, borderRadius, ...style }}
  >
    <div className="w-full h-full p-4">{children}</div>
  </div>
);

export default GlassSurface;
