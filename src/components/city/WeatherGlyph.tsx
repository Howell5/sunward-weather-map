import { Cloud, CloudDrizzle, CloudFog, CloudRain, CloudSnow, Sun } from "lucide-react";

export function WeatherGlyph({
  code,
  className = "",
}: {
  code: number | null;
  className?: string;
}) {
  if (code == null) return <Cloud className={className} aria-hidden="true" />;
  if (code <= 1) return <Sun className={className} aria-hidden="true" />;
  if (code <= 3) return <Cloud className={className} aria-hidden="true" />;
  if (code === 45 || code === 48) return <CloudFog className={className} aria-hidden="true" />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={className} aria-hidden="true" />;
  if (code >= 71 && code <= 86) return <CloudSnow className={className} aria-hidden="true" />;
  return <CloudRain className={className} aria-hidden="true" />;
}
