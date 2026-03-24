/**
 * Icon Component
 * SVG sprite wrapper — dunapp-icons.svg
 *
 * Ikon azonosítók: icon-meteo, icon-meteo-fill, icon-water, icon-water-down,
 * icon-drought, icon-drought-severe, icon-groundwater, icon-alert-bell,
 * icon-station, icon-chart
 */

interface IconProps {
  id: string;
  size?: number;
  className?: string;
  label?: string;
}

export const Icon = ({ id, size = 24, className = '', label }: IconProps) => (
  <svg
    width={size}
    height={size}
    aria-label={label}
    aria-hidden={!label}
    className={className}
    focusable="false"
  >
    <use href={`#${id}`} />
  </svg>
);
