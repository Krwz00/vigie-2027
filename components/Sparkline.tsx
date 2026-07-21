import { smoothPath, type Pt } from "@/lib/chart";

/** Mini-courbe de tendance pour les cartes de classement. */
export default function Sparkline({
  values,
  color,
  width = 96,
  height = 30,
}: {
  values: (number | null)[];
  color: string;
  width?: number;
  height?: number;
}) {
  const defined = values.filter((v): v is number => v != null);
  if (defined.length < 2) return null;

  const min = Math.min(...defined);
  const max = Math.max(...defined);
  const span = max - min || 1;
  const pad = 3;

  const pts: Pt[] = [];
  const n = values.length;
  values.forEach((v, i) => {
    if (v == null) return;
    const x = pad + ((width - pad * 2) * i) / (n - 1);
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    pts.push({ x, y });
  });

  const rising = defined[defined.length - 1] >= defined[0];

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <path
        d={smoothPath(pts)}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {pts.length > 0 && (
        <circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r={2.4}
          fill={rising ? color : color}
        />
      )}
    </svg>
  );
}
