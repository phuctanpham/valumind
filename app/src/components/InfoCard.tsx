
import type { CellItem } from '../App';
import './InfoCard.css';

interface InfoCardProps {
  valuation: CellItem['valuation'];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export default function InfoCard({ valuation }: InfoCardProps) {
  const isIncrement = valuation.valueChange.percent >= 0;
  const valueChangeClass = isIncrement ? 'increment' : 'decrement';

  return (
    <div className="infographic-card compact">
      <div className="main-valuation">
        <div className="total-value">{formatCurrency(valuation.totalValue)}</div>
        <div className={`value-change ${valueChangeClass}`}>
          ({isIncrement ? '+' : ''}{valuation.valueChange.percent}% vs {valuation.valueChange.period})
        </div>
      </div>
      <div className="valuation-grid">
        <div className="grid-item">
          <div className="grid-label">Confidence Score</div>
          <div className="grid-value">{(valuation.confidenceScore * 100).toFixed(0)}%</div>
        </div>
        <div className="grid-item">
          <div className="grid-label">AI Model</div>
          <div className="grid-value">{valuation.aiModel}</div>
        </div>
        <div className="grid-item">
          <div className="grid-label">Unit Value</div>
          <div className="grid-value">{formatCurrency(valuation.unitValue)}/m²</div>
        </div>
      </div>
    </div>
  );
}
