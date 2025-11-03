
import InfoCard from './InfoCard';
import GeographyCard from './GeographyCard';
import ChartCard from './ChartCard';
import type { CellItem } from '../App';
import './ValuationTab.css';
import './Override.css';

interface ValuationTabProps {
  selectedItem: CellItem | undefined;
  apiValid: boolean;
}

export default function ValuationTab({ selectedItem, apiValid }: ValuationTabProps) {
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
