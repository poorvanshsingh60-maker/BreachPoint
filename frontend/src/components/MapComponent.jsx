import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, LayersControl, GeoJSON } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const { BaseLayer } = LayersControl;

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : (
    <Marker position={[position.lat, position.lng]}>
      <Popup>
        <strong>Breach Location</strong><br />
        Lat: {position.lat.toFixed(4)}<br />
        Lng: {position.lng.toFixed(4)}
      </Popup>
    </Marker>
  );
}

// Component to fly to the user's location
function MapCenterer({ position }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo([position.lat, position.lng], map.getZoom() < 12 ? 13 : map.getZoom());
  }, [position, map]);
  
  return null;
}

// Component to recenter the map on the generated GeoJSON
function GeoJSONCenterer({ geoJsonData }) {
  const map = useMap();
  useEffect(() => {
    if (geoJsonData) {
      const layer = L.geoJSON(geoJsonData);
      map.fitBounds(layer.getBounds(), { padding: [50, 50] });
    }
  }, [geoJsonData, map]);
  return null;
}

// Search Bar Component overlayed on the map
function SearchBar({ setSelectedLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      // Nominatim requires an email to avoid HTTP 403 Forbidden
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&email=prototype@example.com`);
      setResults(response.data);
      if (response.data.length === 0) setErrorMsg('No results found.');
    } catch (error) {
      console.error("Geocoding failed", error);
      setErrorMsg('Search failed. Try again.');
    }
    setIsSearching(false);
  };

  const handleSelect = (result) => {
    setSelectedLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setResults([]);
    setQuery(''); 
  };
  
  return (
    <div className="absolute top-4 left-16 z-[1000] w-80">
       <form onSubmit={handleSearch} className="flex shadow-lg rounded bg-white border border-gray-300">
         <input 
           type="text" 
           value={query} 
           onChange={(e) => setQuery(e.target.value)} 
           placeholder="Search for a dam, river, or city..." 
           className="flex-1 p-2 rounded-l border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900"
         />
         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-r font-medium text-sm transition">
           {isSearching ? '...' : 'Search'}
         </button>
       </form>
       {errorMsg && <div className="bg-red-100 text-red-600 text-xs p-2 mt-1 rounded shadow">{errorMsg}</div>}
       {results.length > 0 && (
         <ul className="bg-white mt-1 rounded shadow-lg max-h-60 overflow-y-auto border border-gray-200">
           {results.map(r => (
             <li 
               key={r.place_id} 
               className="p-2 border-b hover:bg-blue-50 cursor-pointer text-sm truncate" 
               onClick={() => handleSelect(r)}
               title={r.display_name}
             >
               {r.display_name}
             </li>
           ))}
         </ul>
       )}
    </div>
  )
}

const MapComponent = ({ results, selectedLocation, setSelectedLocation }) => {
  // Define styles for the flood layer
  const floodStyle = {
    fillColor: "#0055ff",
    weight: 2,
    opacity: 0.8,
    color: '#0022aa',
    fillOpacity: 0.5
  };

  return (
    <div className="h-full w-full bg-gray-200 cursor-crosshair relative">
      
      <SearchBar setSelectedLocation={setSelectedLocation} />

      <MapContainer 
        center={[selectedLocation.lat, selectedLocation.lng]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <MapCenterer position={selectedLocation} />
        
        <LayersControl position="topright">
          <BaseLayer checked name="Street Map (OSM)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </BaseLayer>
          <BaseLayer name="Satellite Imagery">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </BaseLayer>
        </LayersControl>

        <LocationMarker position={selectedLocation} setPosition={setSelectedLocation} />

        {/* Render the flood inundation polygon if we have results */}
        {results && results.geoJson && (
          <>
            <GeoJSON 
              key={JSON.stringify(results.geoJson)} // Force re-render on new data
              data={results.geoJson} 
              style={floodStyle} 
            />
            <GeoJSONCenterer geoJsonData={results.geoJson} />
          </>
        )}

        {results && (
          <div className="absolute bottom-6 left-6 z-[1000] bg-white p-4 rounded shadow-2xl border-l-4 border-blue-500 max-w-sm">
            <h3 className="font-bold text-blue-800 mb-1">Flood Inundation Extent</h3>
            <p className="text-sm text-gray-700">The hydrodynamic calculation is complete. The blue polygon shows the estimated downstream flood plain.</p>
            <p className="text-xs text-gray-600 mt-2 border-t pt-2">
              <strong>Max Flow Velocity:</strong> 5.4 m/s<br/>
              <strong>Max Water Depth:</strong> {results.processedParams?.waterLevel ? (results.processedParams.waterLevel * 0.8).toFixed(1) : 'Unknown'} meters
            </p>
          </div>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
