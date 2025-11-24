import React, { useEffect, useRef, useState } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

// --- Color interpolation helpers ---
function interpolateColor(start: string, end: string, factor: number) {
  const c1 = hexToRgb(start);
  const c2 = hexToRgb(end);

  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

// --- Convert percent to arc "pie slice" path ---
function describeArc(x: number, y: number, radius: number, progress: number) {
  const endAngle = progress * 2 * Math.PI - Math.PI / 2;
  const startAngle = -Math.PI / 2;

  const x1 = x + radius * Math.cos(startAngle);
  const y1 = y + radius * Math.sin(startAngle);

  const x2 = x + radius * Math.cos(endAngle);
  const y2 = y + radius * Math.sin(endAngle);

  const largeArcFlag = progress > 0.5 ? 1 : 0;

  return `
    M ${x} ${y}
    L ${x1} ${y1}
    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
    Z
  `;
}

interface TimerPieProps {
  duration: number; // total time in ms
  startTime: number;
  size?: number;
  startColor?: string;
  endColor?: string;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TimerPie = ({
  duration,
  startTime,
  size = 25,
  startColor = "#00E676",
  endColor = "#D50000",
  onComplete,
  style,
}: TimerPieProps) => {
  const radius = size / 2;
  const [elapsed, setElapsed] = useState(Date.now() - startTime);
  const intervalRef = useRef<number | null>(null);

  const progress = Math.min(elapsed / duration, 1);
  const currentColor = interpolateColor(startColor, endColor, progress);

  // Timer logic (self-contained)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100;

        if (next >= duration) {
          clearInterval(intervalRef.current!);
          if (onComplete) onComplete();
        }

        return next;
      });
    }, 100);

    return () => clearInterval(intervalRef.current!);
  }, [duration]);

  const path = describeArc(radius, radius, radius, progress);

  return (
    <View style={[style, { zIndex: 9999 }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Path
          d={describeArc(radius, radius, radius, 1)}
          fill="purple"
          opacity={0.2}
        />

        {/* Pie progress */}
        <Path d={path} fill={"#eed817ff"} />
      </Svg>
    </View>
  );
};
