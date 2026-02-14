import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ members }) => {
    const center = members.length > 0
        ? [members[0].lat, members[0].lng]
        : [37.5665, 126.9780]; // Default to Seoul

    return (
        <div style={{
            height: '100%',
            minHeight: '400px',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#1e293b',
            position: 'relative'
        }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                {members.map((member) => (
                    <Marker key={member.id} position={[member.lat, member.lng]}>
                        <Popup>
                            <div className="p-2">
                                <p className="font-bold text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">Last updated: {new Date(member.updated_at).toLocaleTimeString()}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
