import React from 'react';
import type { DistributionItem } from './types';
import HorizontalBarList from './HorizontalBarList';

interface TerritorialMapProps {
  cities: DistributionItem[];
  selectedCity?: string;
  onSelectCity: (city: string) => void;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  'Río Grande': [-67.71, -53.79],
  'Ushuaia': [-68.3, -54.8],
  'Tolhuin': [-67.2, -54.51],
  'Zona Rural': [-67.5, -53.9],
  'Resistencia': [-58.99, -27.45],
  'Córdoba': [-64.18, -31.42],
  'Santa Fe': [-60.7, -31.63],
  'La Plata, Buenos Aires': [-57.95, -34.92],
  'CABA': [-58.38, -34.60],
  'Buenos Aires': [-58.38, -34.60],
  'Mendoza': [-68.84, -32.89],
  'San Salvador De Jujuy': [-65.3, -24.19],
  'San Miguel De Tucumán': [-65.22, -26.81],
  'La Banda': [-64.24, -27.73],
  'Villa Angela': [-60.71, -27.57],
};

export default function TerritorialMap({ cities = [], selectedCity, onSelectCity }: TerritorialMapProps) {
  const maxCount = Math.max(1, ...cities.map((c) => c.count));

  // Conversión geográfica a SVG viewBox [0, 0, 600, 510]
  const geoToSvg = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 75) / 24) * 520 + 30;
    const y = ((-20 - lat) / 38) * 430 + 30;
    return [x, y];
  };

  const latitudeLines = [-25, -30, -35, -40, -45, -50, -55];
  const longitudeLines = [-75, -70, -65, -60, -55];

  const locatedCount = cities.filter((c) => CITY_COORDINATES[c.name]).reduce((acc, curr) => acc + curr.count, 0);
  const unlocatedCities = cities.filter((c) => !CITY_COORDINATES[c.name]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* MAPA SVG INTERACTIVO */}
      <div className="lg:col-span-7 bg-[#0a0033]/90 border border-indigo-500/30 rounded-xl p-4 shadow-xl relative overflow-hidden flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-2 px-2">
          <span className="text-xs font-semibold text-brand-cyan tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
            Cartografía de Estudiantes
          </span>
          <span className="text-xs text-indigo-300/70">
            {locatedCount} estudiantes geolocalizados
          </span>
        </div>

        <div className="w-full relative aspect-[600/510] max-h-[460px] flex items-center justify-center">
          <svg
            viewBox="0 0 600 510"
            className="w-full h-full select-none"
            role="img"
            aria-label="Mapa territorial de estudiantes"
          >
            <defs>
              <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00ccff" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#00ccff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0a0033" stopOpacity="0" />
              </radialGradient>
              <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Cuadrícula de referencia geográfica */}
            {latitudeLines.map((lat) => {
              const [, y] = geoToSvg(-75, lat);
              return (
                <g key={`lat-${lat}`}>
                  <line x1="30" y1={y} x2="560" y2={y} stroke="#1e1b4b" strokeDasharray="3 3" strokeWidth="1" />
                  <text x="6" y={y + 4} fill="#4f46e5" fontSize="10" fontFamily="monospace">
                    {lat}°
                  </text>
                </g>
              );
            })}

            {longitudeLines.map((lon) => {
              const [x] = geoToSvg(lon, -20);
              return (
                <g key={`lon-${lon}`}>
                  <line x1={x} y1="30" x2={x} y2="470" stroke="#1e1b4b" strokeDasharray="3 3" strokeWidth="1" />
                  <text x={x - 10} y="495" fill="#4f46e5" fontSize="10" fontFamily="monospace">
                    {lon}°
                  </text>
                </g>
              );
            })}

            {/* Nodos de ciudades */}
            {cities.map((city) => {
              const coords = CITY_COORDINATES[city.name];
              if (!coords) return null;
              const [cx, cy] = geoToSvg(coords[0], coords[1]);
              const isSelected = selectedCity === city.name;
              const radius = 6 + 18 * Math.sqrt(city.count / maxCount);

              return (
                <g
                  key={city.name}
                  onClick={() => onSelectCity(city.name)}
                  className="cursor-pointer group focus:outline-none"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelectCity(city.name);
                  }}
                >
                  {/* Halo resplandeciente */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * (isSelected ? 1.6 : 1.3)}
                    fill="url(#cyanGlow)"
                    opacity={isSelected ? 1 : 0.6}
                    className="transition-all duration-300 group-hover:scale-125"
                  />

                  {/* Círculo central interactivo */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={isSelected ? '#FF6600' : '#00ccff'}
                    fillOpacity={isSelected ? 0.95 : 0.75}
                    stroke={isSelected ? '#ffffff' : '#003a70'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter="url(#glowEffect)"
                    className="transition-all duration-300 group-hover:stroke-white group-hover:fill-brand-accent"
                  />

                  {/* Etiqueta textual flotante */}
                  <text
                    x={cx}
                    y={cy - radius - 4}
                    textAnchor="middle"
                    fill={isSelected ? '#FF6600' : '#ffffff'}
                    fontSize={isSelected ? '11' : '10'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    className="pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-all"
                  >
                    {city.name} ({city.count})
                  </text>

                  <title>{`${city.name}: ${city.count} estudiantes. Haz clic para filtrar.`}</title>
                </g>
              );
            })}
          </svg>
        </div>

        <p className="text-[11px] text-indigo-300/60 text-center mt-2">
          📍 Haz clic sobre cualquier nodo para cruzar los filtros con esa localidad.
        </p>
      </div>

      {/* LISTA SCROLLABLE DE LOCALIDADES */}
      <div className="lg:col-span-5 bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Localidades ({cities.length})
          </h3>
          {selectedCity && (
            <button
              type="button"
              onClick={() => onSelectCity('')}
              className="text-xs text-brand-cyan hover:underline"
            >
              Ver todas
            </button>
          )}
        </div>

        <HorizontalBarList
          items={cities}
          selectedValue={selectedCity}
          onSelect={onSelectCity}
          colorScheme="cyan"
          scrollable
          maxHeight="max-h-[380px]"
        />

        {unlocatedCities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-indigo-500/20">
            <span className="text-[11px] text-indigo-300/60 block">
              * Localidades sin coordenadas registradas en el mapa siguen presentes en la lista y los conteos.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
