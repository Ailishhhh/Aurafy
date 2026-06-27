import { View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Polyline, Polygon, Circle } from 'react-native-svg';
import { palette } from '@/theme';

type SparklineProps = {
  /** Series of scores (0-100), oldest first. */
  values: number[];
  width: number;
  height?: number;
};

/**
 * A minimal score-over-time line chart. Plots the user's overall scores so they
 * can see the trend climbing — the core motivation loop of the app.
 */
export function Sparkline({ values, width, height = 90 }: SparklineProps) {
  if (values.length < 2) return null;

  const pad = 8;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * w;
    const y = pad + (1 - (v - min) / range) * h;
    return { x, y };
  });

  const line = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${pad + w},${height - pad}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={palette.violetBright} />
            <Stop offset="100%" stopColor={palette.gold} />
          </SvgGradient>
          <SvgGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={palette.violet} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={palette.violet} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Polygon points={area} fill="url(#sparkFill)" />
        <Polyline
          points={line}
          fill="none"
          stroke="url(#sparkLine)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === pts.length - 1 ? 5 : 3}
            fill={i === pts.length - 1 ? palette.gold : palette.violetBright}
          />
        ))}
      </Svg>
    </View>
  );
}
