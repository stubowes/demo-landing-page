import { useState, useRef, useEffect } from 'react'

/* ───────────────────────────────────────────
   CONFIG — Update these values
   ─────────────────────────────────────────── */
const CONFIG = {
  videoBaseUrl: 'https://demos.seachangeai.co/demos',
  webhookUrl: 'https://seachangeai.app.n8n.cloud/webhook/demo-cta', // Replace with your n8n webhook
  calBookingUrl: 'https://cal.com/seachangeai/discovery', // Replace with your Cal.com link
  demophone: '08081607030',
}

/* ───────────────────────────────────────────
   HELPERS
   ─────────────────────────────────────────── */
function getSlugFromUrl() {
  const path = window.location.pathname.replace(/\/+$/, '')
  const segments = path.split('/').filter(Boolean)
  // Return last segment as slug — works whether path is /demo/slug or /slug
  return segments[segments.length - 1] || ''
}

function slugToDisplayName(slug) {
  if (!slug) return ''
  return slug
    .split('-')
    .map(word => {
      if (word.length <= 2 && isNaN(word)) return word.toUpperCase() // e.g. "mcs" → "MCS"
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function fireWebhook(slug, event, extra = {}) {
  try {
    fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, event, timestamp: Date.now(), ...extra }),
    })
  } catch (e) {
    // Silent fail — don't break the page if webhook is down
  }
}

/* ───────────────────────────────────────────
   STYLES
   ─────────────────────────────────────────── */
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0c1220;
    --surface: #152033;
    --surface-hover: #1c2d47;
    --teal: #0d9488;
    --teal-light: #14b8a6;
    --teal-glow: rgba(13, 148, 136, 0.25);
    --white: #f8fafc;
    --muted: #94a3b8;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --font-heading: 'DM Serif Display', Georgia, serif;
  }

  html { font-size: 16px; }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--white);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    max-width: 480px;
    margin: 0 auto;
    padding: 24px 20px 48px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ── Brand ── */
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 32px;
  }
  .brand-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--teal);
    box-shadow: 0 0 8px var(--teal-glow);
  }
  .brand-name {
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* ── Heading ── */
  .heading {
    font-family: var(--font-heading);
    font-size: 1.75rem;
    line-height: 1.2;
    margin-bottom: 8px;
    color: var(--white);
  }
  .heading span {
    color: var(--teal-light);
  }
  .subheading {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--muted);
    margin-bottom: 28px;
  }

  /* ── Video ── */
  .video-container {
    position: relative;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    background: #000;
    aspect-ratio: 16 / 9;
    margin-bottom: 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  .video-container video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: rgba(0, 0, 0, 0.5);
    cursor: pointer;
    transition: background 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .play-overlay:active {
    background: rgba(0, 0, 0, 0.6);
  }
  .play-btn {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--teal);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px var(--teal-glow);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .play-overlay:hover .play-btn {
    transform: scale(1.08);
    box-shadow: 0 6px 32px var(--teal-glow);
  }
  .play-btn svg {
    width: 28px;
    height: 28px;
    fill: white;
    margin-left: 3px;
  }
  .play-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: white;
    letter-spacing: 0.03em;
  }

  /* ── CTAs ── */
  .cta-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .cta-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 18px 24px;
    background: var(--teal);
    color: white;
    border: none;
    border-radius: 14px;
    font-family: var(--font-body);
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cta-primary:hover { background: var(--teal-light); }
  .cta-primary:active { transform: scale(0.98); }
  .cta-primary:disabled {
    background: var(--surface);
    color: var(--muted);
    cursor: default;
    transform: none;
  }

  .cta-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 16px 24px;
    background: transparent;
    color: var(--white);
    border: 1.5px solid rgba(148, 163, 184, 0.25);
    border-radius: 14px;
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: border-color 0.2s ease, background 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cta-secondary:hover {
    border-color: rgba(148, 163, 184, 0.45);
    background: var(--surface);
  }

  .cta-tertiary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .cta-tertiary:hover { color: var(--white); }

  /* ── Confirmation ── */
  .confirmation {
    text-align: center;
    padding: 24px;
    background: var(--surface);
    border-radius: 14px;
    border: 1.5px solid rgba(13, 148, 136, 0.3);
  }
  .confirmation-tick {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--teal);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  .confirmation-tick svg {
    width: 24px;
    height: 24px;
    stroke: white;
    fill: none;
  }
  .confirmation h3 {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    margin-bottom: 8px;
    color: var(--white);
  }
  .confirmation p {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.5;
  }

  /* ── Divider ── */
  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 4px 0;
  }
  .divider-line {
    flex: 1;
    height: 1px;
    background: rgba(148, 163, 184, 0.15);
  }
  .divider-text {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  /* ── Footer ── */
  .footer {
    margin-top: auto;
    padding-top: 40px;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(148, 163, 184, 0.4);
  }
  .footer a {
    color: rgba(148, 163, 184, 0.4);
    text-decoration: none;
  }
  .footer a:hover {
    color: var(--muted);
  }

  /* ── Error state ── */
  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    gap: 16px;
  }
  .error-page h1 {
    font-family: var(--font-heading);
    font-size: 1.5rem;
  }
  .error-page p {
    color: var(--muted);
    font-size: 0.95rem;
  }
`

/* ───────────────────────────────────────────
   ICONS (inline SVG)
   ─────────────────────────────────────────── */
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const TickIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

/* ───────────────────────────────────────────
   APP
   ─────────────────────────────────────────── */
export default function App() {
  const slug = getSlugFromUrl()
  const businessName = slugToDisplayName(slug)
  const videoUrl = `${CONFIG.videoBaseUrl}/${slug}.mp4`

  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [trialRequested, setTrialRequested] = useState(false)
  const [trialLoading, setTrialLoading] = useState(false)

  // Fire page view on mount
  useEffect(() => {
    if (slug) fireWebhook(slug, 'page_view')
  }, [slug])

  function handlePlay() {
    const video = videoRef.current
    if (!video) return
    video.play()
    setIsPlaying(true)
    fireWebhook(slug, 'video_play')
  }

  function handleVideoEnded() {
    fireWebhook(slug, 'video_complete')
  }

  async function handleStartTrial() {
    setTrialLoading(true)
    fireWebhook(slug, 'cta_click', { action: 'start_free_trial' })
    // Brief delay so the webhook fires before state change
    await new Promise(r => setTimeout(r, 600))
    setTrialLoading(false)
    setTrialRequested(true)
  }

  function handleBookCall() {
    fireWebhook(slug, 'cta_click', { action: 'book_call' })
  }

  function handleDemoCall() {
    fireWebhook(slug, 'cta_click', { action: 'call_demo_line' })
  }

  // ── Error state ──
  if (!slug) {
    return (
      <>
        <style>{styles}</style>
        <div className="page">
          <div className="error-page">
            <h1>Demo not found</h1>
            <p>This link doesn't seem to be working. Please check the URL or reply to the text you received.</p>
          </div>
        </div>
      </>
    )
  }

  // ── Main page ──
  return (
    <>
      <style>{styles}</style>
      <div className="page">

        {/* Brand */}
        <div className="brand">
          <div className="brand-dot" />
          <span className="brand-name">Sea Change AI</span>
        </div>

        {/* Heading */}
        <h1 className="heading">
          <span>{businessName}</span>, meet Sophie
        </h1>
        <p className="subheading">
          I've built an AI receptionist for your business. Here's what your customers would hear when they call.
        </p>

        {/* Video */}
        <div className="video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            preload="metadata"
            onEnded={handleVideoEnded}
          />
          {!isPlaying && (
            <div className="play-overlay" onClick={handlePlay}>
              <div className="play-btn">
                <PlayIcon />
              </div>
              <span className="play-label">Tap to play your demo</span>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="cta-section">

          {/* Primary CTA */}
          {trialRequested ? (
            <div className="confirmation">
              <div className="confirmation-tick">
                <TickIcon />
              </div>
              <h3>You're all set</h3>
              <p>Stuart will give you a call shortly to get your AI receptionist up and running.</p>
            </div>
          ) : (
            <button
              className="cta-primary"
              onClick={handleStartTrial}
              disabled={trialLoading}
            >
              {trialLoading ? 'Sending...' : 'Start Your Free Trial'}
            </button>
          )}

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          {/* Secondary CTA */}
          <a
            href={CONFIG.calBookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
            onClick={handleBookCall}
          >
            <CalendarIcon />
            Book a Quick Call to Get Your Questions Answered
          </a>

          {/* Tertiary CTA */}
          <a
            href={`tel:${CONFIG.demophone}`}
            className="cta-tertiary"
            onClick={handleDemoCall}
          >
            <PhoneIcon />
            Try it yourself — call our live demo line (freephone)
          </a>

        </div>

        {/* Footer */}
        <div className="footer">
          <a href="https://seachangeai.co">seachangeai.co</a>
        </div>

      </div>
    </>
  )
}
