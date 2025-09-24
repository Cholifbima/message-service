import React from 'react';
import './AnimatedGrid.css';

// Lightweight animated grid background (no canvas, no blocking clicks)
// Inspired by ReactBits Squares but implemented in CSS-only
export default function AnimatedGrid({
  size = 40,
  color = '#2a2a2a',
  glow = 'rgba(255,255,255,0.03)'
}) {
  const style = {
    '--grid-size': `${size}px`,
    '--grid-color': color,
    '--grid-glow': glow
  };
  return <div className="animated-grid" style={style} aria-hidden="true" />;
}


