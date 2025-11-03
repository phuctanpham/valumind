
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ChartCard.css';

interface ValuationHistory {
    date: string;
    value: number;
}

interface ChartCardProps {
  valuationHistory: ValuationHistory[] | null;
}

export default function ChartCard({ valuationHistory }: ChartCardProps) {
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  const [filter, setFilter] = useState(12); // Default to last 12 months

  const filteredData = useMemo(() => {
    if (!valuationHistory) return [];

    if (viewMode === 'month') {
        return valuationHistory.slice(-filter).map(h => ({ date: new Date(h.date).toISOString().slice(0, 7), value: h.value}));
    } else {
      // Aggregate by year
      const yearlyData: { [key: string]: number[] } = {};
      valuationHistory.forEach(d => {
        const year = new Date(d.date).getFullYear().toString();
        if (!yearlyData[year]) {
          yearlyData[year] = [];
        }
        yearlyData[year].push(d.value);
      });
      const aggregatedData = Object.keys(yearlyData).map(year => ({
        date: year,
        value: Math.round(yearlyData[year].reduce((a, b) => a + b, 0) / yearlyData[year].length)
      }));
      return aggregatedData.slice(-filter);
    }
  }, [valuationHistory, viewMode, filter]);

  const handleFilterChange = (newFilter: number) => {
    setFilter(newFilter);
  };

  const handleViewChange = (newView: string) => {
    setViewMode(newView);
    if (newView === 'month') {
      setFilter(12);
    } else {
      setFilter(3);
    }
  };

  if (!valuationHistory) {
    return (
        <div class="valuation-chart-card">
            <h2>Valuation Over Time</h2>
            <p>No valuation history available for this property.</p>
        </div>
    );
  }

  const monthFilters = [1, 3, 6, 12, 36];
  const yearFilters = [1, 3];

  return (
    <div className="valuation-chart-card">
      <h2>Valuation Over Time</h2>
      <div className="chart-controls">
        <div className="view-switcher">
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => handleViewChange('month')}>Month</button>
          <button className={viewMode === 'year' ? 'active' : ''} onClick={() => handleViewChange('year')}>Year</button>
        </div>
        <div className="filter-buttons">
          {(viewMode === 'month' ? monthFilters : yearFilters).map(f => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => handleFilterChange(f)}
            >
              {`Last ${f} ${viewMode === 'month' ? 'Month' : 'Year'}${f > 1 ? 's' : ''}`}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={filteredData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="date" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip contentStyle={{ backgroundColor: '#333', border: '1px solid #555' }} />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
