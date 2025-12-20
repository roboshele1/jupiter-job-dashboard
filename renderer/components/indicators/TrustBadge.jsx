export default function TrustBadge({ level }) {
  const colors = {
    HIGH: '#2ecc71',
    MEDIUM: '#f1c40f',
    LOW: '#e67e22',
    UNTRUSTED: '#e74c3c'
  };

  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      background: colors[level] || '#7f8c8d',
      color: '#000'
    }}>
      TRUST: {level}
    </span>
  );
}

