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
    const validMembers = Array.isArray(members) ? members : [];
    const center = validMembers.length > 0
        ? [validMembers[0].lat, validMembers[0].lng]
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
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validMembers.map((member) => (
                    member && member.lat && member.lng && (
                        <Marker key={member.id} position={[member.lat, member.lng]}>
                            <Popup>
                                <div className="p-2">
                                    <p className="font-bold text-gray-900">{member.name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">Last updated: {member.updated_at ? new Date(member.updated_at).toLocaleTimeString() : 'N/A'}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
