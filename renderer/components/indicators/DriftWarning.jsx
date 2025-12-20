export default function DriftWarning({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div style={{ color: '#e74c3c', fontSize: '12px' }}>
      {alerts.map((a, i) => (
        <div key={i}>⚠ {a.type}</div>
      ))}
    </div>
  );
}

