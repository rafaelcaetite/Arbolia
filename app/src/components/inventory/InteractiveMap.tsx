import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';

// Custom icons using the user's provided icone.png
const createCustomIcon = (isHighlighted: boolean, isInactive = false) => {
  const size = isHighlighted ? 48 : 36;
  const transform = isHighlighted ? 'translateY(-6px) scale(1.1)' : 'translateY(0) scale(1)';
  const filter = isInactive
    ? 'grayscale(100%) opacity(0.55)'
    : `drop-shadow(0px 4px 6px rgba(0,0,0,0.3)) ${isHighlighted ? 'drop-shadow(0px 0px 8px rgba(16,185,129,0.5))' : ''}`;

  const svgHtml = `
    <div style="display: flex; justify-content: center; align-items: center; transition: all 0.2s ease; transform: ${transform};">
      <img src="/icone.png" style="width: ${size}px; height: ${size}px; filter: ${filter};" />
    </div>
  `;

  return new L.DivIcon({
    html: svgHtml,
    className: 'custom-tree-leaflet-icon bg-transparent border-none',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const defaultIcon  = createCustomIcon(false);
const selectedIcon = createCustomIcon(true);
const inactiveIcon = createCustomIcon(false, true);

function MapBoundsListener() {
  const setMapBounds = useAppStore(s => s.setMapBounds);
  const timeoutRef = useRef<number | null>(null);

  const map = useMapEvents({
    moveend: () => updateBounds(),
    zoomend: () => updateBounds(),
    // Removido o 'resize' para evitar loop infinito com barras de rolagem que aparecem/somem
  });

  const updateBounds = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const bounds = map.getBounds();
      setMapBounds({
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast()
      });
    }, 100); // Debounce de 100ms
  };

  useEffect(() => {
    updateBounds();
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [map]);

  return null;
}

function MapPickerListener() {
  const { isMapPickingMode, finishMapPicking } = useAppStore();
  
  const map = useMapEvents({
    click: (e) => {
      if (isMapPickingMode) {
        finishMapPicking(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  useEffect(() => {
    if (isMapPickingMode) {
      map.getContainer().classList.add('picking-mode-active');
    } else {
      map.getContainer().classList.remove('picking-mode-active');
    }
  }, [isMapPickingMode, map]);

  return (
    <style>{`
      .picking-mode-active,
      .picking-mode-active * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='8' fill='none' stroke='white' stroke-width='4' /%3E%3Ccircle cx='16' cy='16' r='3' fill='white' /%3E%3Ccircle cx='16' cy='16' r='8' fill='none' stroke='%2310b981' stroke-width='2' /%3E%3Ccircle cx='16' cy='16' r='2' fill='%2310b981' /%3E%3Cpath d='M16 0v6 M16 26v6 M0 16h6 M26 16h6' stroke='white' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M16 0v6 M16 26v6 M0 16h6 M26 16h6' stroke='%2310b981' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E") 16 16, crosshair !important;
      }
    `}</style>
  );
}

export function InteractiveMap() {
  const trees = useAppStore(s => s.trees);
  const hoveredTreeId = useAppStore(s => s.hoveredTreeId);
  const selectedTreeIds = useAppStore(s => s.selectedTreeIds);
  const setHoveredTreeId = useAppStore(s => s.setHoveredTreeId);
  const toggleTreeSelection = useAppStore(s => s.toggleTreeSelection);

  const defaultCenter: [number, number] = [-20.7546, -42.8825];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-inner relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapBoundsListener />
        <MapPickerListener />
        
        {trees.map((tree) => {
          const isSelected = selectedTreeIds.includes(tree.id);
          const isHovered = hoveredTreeId === tree.id;
          
          const isInactive = tree.ativo === false;

          return (
            <Marker 
              key={tree.id} 
              position={[tree.latitude, tree.longitude]}
              icon={
                isInactive ? inactiveIcon
                : (isSelected || isHovered) ? selectedIcon
                : defaultIcon
              }
              eventHandlers={{
                click: () => toggleTreeSelection(tree.id),
                mouseover: () => setHoveredTreeId(tree.id),
                mouseout: () => setHoveredTreeId(null),
              }}
            >
              <Popup autoPan={false} className="rounded-xl custom-popup">
                <div className="font-sans min-w-[170px] pb-0.5">
                  <div className="flex flex-col mb-2 border-b border-slate-100 pb-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{tree.especie}</h3>
                      {isInactive && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 tracking-wide ml-2">
                          Suprimida
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5 tracking-wider">
                      {tree.codigo_v6 ? `ARB-${tree.codigo_v6.toString().padStart(3, '0')}` : `# ${tree.id.slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>

                  
                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mb-3 text-[11px]">
                    <span className="text-slate-400 font-medium text-right">Altura:</span>
                    <strong className="text-slate-700">{tree.altura}m</strong>
                    
                    <span className="text-slate-400 font-medium text-right">Copa:</span>
                    <strong className="text-slate-700">{tree.tamanho_copa}m</strong>
                    
                    <span className="text-slate-400 font-medium text-right pt-0.5">Lat/Lng:</span>
                    <span className="text-slate-500 font-mono tracking-tighter pt-0.5">
                      {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
                    </span>
                    
                    <span className="text-slate-400 font-medium text-right flex items-center pt-0.5">Risco:</span>
                    <div className="flex items-center pt-0.5">
                      <span className={`uppercase font-bold text-[9px] px-1.5 py-0.5 rounded ${
                        tree.status_risco === 'baixo' ? 'bg-emerald-50 text-emerald-700' :
                        tree.status_risco === 'medio' ? 'bg-yellow-50 text-yellow-700' :
                        tree.status_risco === 'alto' ? 'bg-orange-50 text-orange-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {tree.status_risco}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); useAppStore.getState().openEditModal(tree.id); }}
                    className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-primary hover:bg-primary-dark px-2 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    Editar
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
