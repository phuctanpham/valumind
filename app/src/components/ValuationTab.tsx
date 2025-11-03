
import { useState, useEffect } from 'react';
import InfoCard from './InfoCard';
import GeographyCard from './GeographyCard';
import ChartCard from './ChartCard'; // Import the new ChartCard component
import './ValuationTab.css';
import './Override.css'; // Import override styles

interface ValuationData {
  aiModel: string;
  confidenceScore: number;
  totalValue: number;
  unitValue: number;
  valueChange: {
    percent: number;
    period: string;
  };
}

interface NearbyValuation {
  address: string;
  value: number;
  lat: number;
  lng: number;
}

interface ValuationHistory {
    date: string;
    value: number;
}

interface MockItem {
  id: string;
  valuation: ValuationData;
  address: string;
  lat: number;
  lng: number;
  nearbyValuations: NearbyValuation[];
  valuationHistory: ValuationHistory[] | null;
}

interface ValuationTabProps {
  apiValid: boolean;
}

export default function ValuationTab({ apiValid }: ValuationTabProps) {
  const [selectedItem, setSelectedItem] = useState<MockItem | null>(null);

  useEffect(() => {
    if (!apiValid) {
      fetch('/mock.json')
        .then((res) => res.json())
        .then((data: MockItem[]) => {
          if (data && data.length > 0) {
            setSelectedItem(data[0]);
          }
        })
        .catch(console.error);
    }
  }, [apiValid]);

  if (apiValid) {
    return (
      <div className="valuation-tab">
        <div className="valuation-result">
          <p>API is valid. Live data would be displayed here.</p>
        </div>
      </div>
    );
  }

  if (!selectedItem) {
    return <div className="valuation-tab"><p>Loading guest data...</p></div>;
  }

  return (
    <div className="valuation-tab">
      <InfoCard valuation={selectedItem.valuation} />
      <ChartCard valuationHistory={selectedItem.valuationHistory} />
      <GeographyCard
        lat={selectedItem.lat}
        lng={selectedItem.lng}
        valuation={selectedItem.valuation}
        nearbyValuations={selectedItem.nearbyValuations}
      />
    </div>
  );
}
