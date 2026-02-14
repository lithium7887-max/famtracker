import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Explicitly use CDN icons to avoid build-time asset path issues on mobile
const DEFAULT_ICON = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const Recenter = ({ center }) => {
    const map = useMap();
    React.useEffect(() => {
        if (center && map) {
            try {
                map.panTo(center, { animate: true });
            } catch (e) {
                console.error("Move error:", e);
            }
        }
    }, [center, map]);
    return null;
};

const MapComponent = ({ members = [] }) => {
    const validMembers = Array.isArray(members) ? members : [];

    // Safety check for coordinates
    const getPos = (m) => (m && typeof m.lat === 'number' && typeof m.lng === 'number') ? [m.lat, m.lng] : null;

    const center = (validMembers.length > 0 && getPos(validMembers[0]))
        ? getPos(validMembers[0])
        : [37.5665, 126.9780];

    return (
        <div style={{ height: '100%', width: '100%', background: '#1e293b', position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Recenter center={center} />
                {validMembers.map((member) => {
                    const pos = getPos(member);
                    if (!pos) return null;
                    return (
                        <Marker key={member.id} position={pos} icon={DEFAULT_ICON}>
                            <Popup>
                                <div className="p-2">
                                    <p className="font-bold text-gray-900">{member.name || 'User'}</p>
                                    <p className="text-xs text-gray-500">
                                        Last: {member.updated_at ? new Date(member.updated_at).toLocaleTimeString() : 'N/A'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            {/* Mobile helper message */}
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>
                System Active
            </div>
        </div>
    );
};

export default MapComponent;
