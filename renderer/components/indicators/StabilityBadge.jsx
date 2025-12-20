export default function StabilityBadge({ score }) {
  let label = 'STABLE';
  let color = '#2ecc71';

  if (score < 0.5) {
    label = 'UNSTABLE';
    color = '#e74c3c';
  }

  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      background: color,
      color: '#000'
    }}>
      {label}
    </span>
  );
}

