
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import './GeographyCard.css';

interface ValuationData {
  totalValue: number;
}

interface NearbyValuation {
  address: string;
  value: number;
  lat: number;
  lng: number;
}

interface GeographyCardProps {
  lat: number;
  lng: number;
  valuation: ValuationData;
  nearbyValuations: NearbyValuation[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function GeographyCard({ lat, lng, valuation, nearbyValuations }: GeographyCardProps) {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div className="infographic-card geography-card">
      <div className="map-view-container">
        {API_KEY ? (
          <APIProvider apiKey={API_KEY}>
            <Map
              defaultCenter={{ lat, lng }}
              defaultZoom={15}
              mapId="bf51a910020fa25a"
              disableDefaultUI={true}
            >
              <AdvancedMarker position={{ lat, lng }} title={'Main Property'}>
                <div className="marker marker-main">
                  <span>{formatCurrency(valuation.totalValue)}</span>
                </div>
              </AdvancedMarker>
              {nearbyValuations.map((nearby, index) => (
                <AdvancedMarker
                  key={index}
                  position={{ lat: nearby.lat, lng: nearby.lng }}
                  title={nearby.address}
                >
                  <div className="marker marker-nearby">
                    <span>{formatCurrency(nearby.value)}</span>
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        ) : (
          <div className="api-key-placeholder">
            <p>Google Maps API Key not configured.</p>
          </div>
        )}
      </div>
      <div className="nearby-list-container">
        <h4>Nearby Valuations</h4>
        <ul className="nearby-list">
          {nearbyValuations.map((nearby, index) => (
            <li key={index} className="nearby-item">
              <span className="nearby-address">{nearby.address}</span>
              <span className="nearby-value">{formatCurrency(nearby.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
