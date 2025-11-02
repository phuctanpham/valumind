import './InfoCard.css';

interface InfoCardProps {
  title: string;
  value: string;
}

export default function InfoCard({ title, value }: InfoCardProps) {
  return (
    <div className="info-card">
      <div className="info-card-title">{title}</div>
      <div className="info-card-value">{value}</div>
    </div>
  );
}
