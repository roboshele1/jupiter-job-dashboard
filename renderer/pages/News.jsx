export default function News() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>News</h1>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Market News Feed</h2>
        <p style={styles.text}>News ingestion layer online</p>
        <p style={styles.subtext}>Live headlines wiring pending</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "48px",
    color: "#ffffff"
  },
  title: {
    fontSize: "42px",
    marginBottom: "32px"
  },
  card: {
    background: "linear-gradient(145deg, #0c1222, #060b18)",
    borderRadius: "18px",
    padding: "28px",
    maxWidth: "520px"
  },
  cardTitle: {
    fontSize: "22px",
    marginBottom: "12px"
  },
  text: {
    fontSize: "16px"
  },
  subtext: {
    fontSize: "14px",
    opacity: 0.7
  }
};

