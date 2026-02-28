import { useState } from 'react';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setMessage('✓ You\'re on the list. Early access coming Feb 2026.');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
  }

  return (
    <div style={{ background: '#060910', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'IBM Plex Mono' }}>
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', color: '#fff', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Your portfolio.<br/>
          <span style={{ color: '#3b82f6' }}>Intelligently</span><br/>
          managed.
        </h1>
        
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px', lineHeight: '1.6' }}>
          Jupiter is a regime-aware portfolio intelligence engine built for serious investors. Kelly sizing. AI briefings. Real-time signals. Built for the $1M goal.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#0f172a',
              border: '1px solid #1a2540',
              borderRadius: '8px',
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: '14px'
            }}
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            style={{
              padding: '12px 28px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: status === 'loading' ? 'default' : 'pointer',
              fontFamily: 'inherit',
              fontSize: '14px',
              opacity: status === 'loading' ? 0.7 : 1
            }}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Sending...' : 'REQUEST ACCESS'}
          </button>
        </form>

        {message && (
          <p style={{ color: status === 'success' ? '#22c55e' : '#ef4444', fontSize: '13px', marginBottom: '20px' }}>
            {message}
          </p>
        )}

        <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '40px' }}>
          No spam. No pitch deck. Just early access when we're ready.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', color: '#94a3b8', fontSize: '12px' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>50</div>
            <div style={{ marginTop: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Beta Spots</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>$0</div>
            <div style={{ marginTop: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cost to Join</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff' }}>2037</div>
            <div style={{ marginTop: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>The Goal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
