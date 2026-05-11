import { useState, useRef, useEffect } from 'react'

/* ───────────────────────────────────────────
   CONFIG — Update these values
   ─────────────────────────────────────────── */
const CONFIG = {
  videoBaseUrl: 'https://demos.seachangeai.co/demos',
  webhookUrl: '/api/webhook', // Replace with your n8n webhook
  calBookingUrl: 'https://cal.com/stuart-bowes-jv4zse/callback?overlayCalendar=true', // Replace with your Cal.com link
  demophone: '+448081607030',
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

// Like fireWebhook, but uses sendBeacon so the request survives page unload.
// Falls back to fetch with keepalive if sendBeacon isn't available.
function fireWebhookBeacon(slug, event, extra = {}) {
  try {
    const payload = JSON.stringify({ slug, event, timestamp: Date.now(), ...extra })
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon(CONFIG.webhookUrl, blob)
      return
    }
    fetch(CONFIG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  } catch (e) {
    // Silent fail
  }
}

/* ───────────────────────────────────────────
   STYLES
   ─────────────────────────────────────────── */
const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0C1220;
    --surface: #1E293B;
    --surface-hover: #26334a;
    --ocean: #BAE6FD;
    --ocean-glow: rgba(186, 230, 253, 0.4);
    --white: #ffffff;
    --slate: #F0F4F8;
    --navy: #0D2545;
    --charcoal: #1E293B;
    --muted: rgba(240, 244, 248, 0.7);
    --font-heading: 'Plus Jakarta Sans', system-ui, sans-serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
    --font-display: 'Cormorant Garamond', serif;
  }

  html { font-size: 16px; }

  body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--slate);
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
    justify-content: center;
    gap: 8px;
    margin-bottom: 32px;
  }
  .brand-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--ocean);
    box-shadow: 0 0 8px var(--ocean-glow);
  }
  .brand-name {
    font-family: var(--font-body);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--white);
  }

  /* ── Heading ── */
  .heading {
    font-family: var(--font-heading);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 8px;
    color: var(--ocean);
    letter-spacing: -0.02em;
    text-align: center;
  }
  .heading span {
    color: var(--ocean);
  }
  .subheading {
    font-family: var(--font-body);
    font-size: 1.15rem;
    line-height: 1.5;
    color: var(--white);
    margin-bottom: 28px;
    text-align: center;
  }

  /* ── Video ── */
  .video-container {
    position: relative;
    width: 100%;
    border-radius: 14px;
    overflow: hidden;
    background: #000;
    aspect-ratio: 8 / 9;
    margin-bottom: 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(240, 244, 248, 0.05);
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
    background: rgba(13, 37, 69, 0.6);
    cursor: pointer;
    transition: background 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .play-overlay:active {
    background: rgba(13, 37, 69, 0.7);
  }
  .play-btn {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--ocean);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 24px var(--ocean-glow);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .play-overlay:hover .play-btn {
    transform: scale(1.03);
    box-shadow: 0 6px 32px var(--ocean-glow);
  }
  .play-btn svg {
    width: 28px;
    height: 28px;
    fill: var(--navy);
    margin-left: 3px;
  }
  .play-label {
    font-family: var(--font-body);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--white);
    letter-spacing: 0.03em;
  }

  /* ── CTAs ── */
  .cta-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
  }

  .cta-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .cta-label {
    font-family: var(--font-heading);
    font-size: 0.95rem;
    font-weight: 400;
    color: var(--white);
    margin-bottom: 0;
    text-align: center;
  }
  .cta-label-hero {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--ocean);
  }

  .cta-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 16px 24px;
    background: var(--ocean);
    color: var(--navy);
    border: none;
    border-radius: 14px;
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cta-primary:hover { 
    transform: scale(1.03) translateY(-1px);
    box-shadow: 0 0 0 2px var(--ocean);
  }
  .cta-primary:active { transform: scale(0.98); }
  .cta-primary:disabled {
    background: var(--surface);
    color: var(--muted);
    cursor: default;
    transform: none;
    box-shadow: none;
  }

  .cta-input {
    width: 100%;
    padding: 14px 16px;
    background: var(--surface);
    color: var(--slate);
    border: 1px solid transparent;
    border-radius: 12px;
    font-family: var(--font-body);
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .cta-input::placeholder { color: var(--muted); }
  .cta-input:focus { border-color: var(--ocean); box-shadow: 0 0 0 3px var(--ocean-glow); }
  .cta-input:disabled { opacity: 0.6; cursor: not-allowed; }
  .cta-input-error { border-color: #ef4444; }
  .cta-input-error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25); }

  .cta-helper {
    font-family: var(--font-body);
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--muted);
    text-align: center;
    margin-top: -4px;
  }

  /* ── Trust signals ── */
  .trust-strip {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--ocean);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
    text-align: center;
    line-height: 1.5;
    margin-top: 2px;
  }

  .guarantee-badge {
    width: 100%;
    padding: 10px 14px;
    background: rgba(251, 191, 36, 0.08);
    border: 1px solid rgba(251, 191, 36, 0.28);
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--slate);
    text-align: center;
  }

  .cta-secondary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 16px 24px;
    background: transparent;
    color: var(--ocean);
    border: 1px solid var(--ocean);
    border-radius: 14px;
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s ease, transform 0.1s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .cta-secondary:hover {
    background: rgba(186, 230, 253, 0.3);
    transform: scale(1.03) translateY(-1px);
  }

  .cta-tertiary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px;
    color: var(--ocean);
    font-family: var(--font-body);
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .cta-tertiary:hover { color: var(--white); }

  /* ── Confirmation ── */
  .confirmation {
    text-align: center;
    padding: 32px 24px;
    background: var(--surface);
    border-radius: 2rem;
    border: 1px solid rgba(240, 244, 248, 0.05);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
  .confirmation-tick {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--ocean);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }
  .confirmation-tick svg {
    width: 24px;
    height: 24px;
    stroke: var(--navy);
    fill: none;
  }
  .confirmation h3 {
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--slate);
  }
  .confirmation p {
    font-size: 0.9rem;
    color: var(--slate);
    opacity: 0.8;
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
    background: rgba(186, 230, 253, 0.2);
  }
  .divider-text {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--ocean);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  /* ── Footer ── */
  .footer {
    margin-top: auto;
    padding-top: 40px;
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
  }
  .footer a {
    color: rgba(240, 244, 248, 0.7);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .footer a:hover {
    color: var(--slate);
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
    font-weight: 700;
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
  const [trialName, setTrialName] = useState('')
  const [trialNameError, setTrialNameError] = useState(false)
  const [trialEmail, setTrialEmail] = useState('')
  const [trialEmailError, setTrialEmailError] = useState(false)

  // ── Watch-time tracking ──
  // watchedSecondsRef accumulates seconds the video was actually playing.
  // lastTickRef holds the timestamp of the last timeupdate while playing.
  // lastSentRef remembers the last value we reported, so we don't send duplicates.
  const watchedSecondsRef = useRef(0)
  const lastTickRef = useRef(null)
  const lastSentRef = useRef(0)

  // Update document title and fire page view on mount
  useEffect(() => {
    if (businessName) {
      document.title = `${businessName} Demo`
    }
    if (slug) fireWebhook(slug, 'page_view')
  }, [slug, businessName])

  // Send accumulated watch time when the user leaves the page or backgrounds the tab.
  useEffect(() => {
    if (!slug) return

    function flushWatchTime(useBeacon = true) {
      const seconds = Math.round(watchedSecondsRef.current)
      if (seconds <= lastSentRef.current) return
      const video = videoRef.current
      const payload = {
        watched_seconds: seconds,
        duration_seconds: video && video.duration ? Math.round(video.duration) : null,
        furthest_seconds: video ? Math.round(video.currentTime || 0) : null,
      }
      if (useBeacon) {
        fireWebhookBeacon(slug, 'video_watch_time', payload)
      } else {
        fireWebhook(slug, 'video_watch_time', payload)
      }
      lastSentRef.current = seconds
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') flushWatchTime(true)
    }

    function onPageHide() {
      flushWatchTime(true)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [slug])

  function handlePlay() {
    const video = videoRef.current
    if (!video) return
    video.play()
    setIsPlaying(true)
    fireWebhook(slug, 'video_play')
  }

  // Fired ~4×/sec while the video is playing. We diff against the last tick's
  // wall-clock time and add the delta — capped to filter out big jumps from
  // seeks/scrubs, so we only count real playback.
  function handleVideoTimeUpdate() {
    const now = Date.now()
    if (lastTickRef.current != null) {
      const delta = (now - lastTickRef.current) / 1000
      if (delta > 0 && delta < 1.5) {
        watchedSecondsRef.current += delta
      }
    }
    lastTickRef.current = now
  }

  function handleVideoPlaying() {
    lastTickRef.current = Date.now()
  }

  function handleVideoPause() {
    lastTickRef.current = null
  }

  function handleVideoEnded() {
    setIsPlaying(false)
    lastTickRef.current = null
    const seconds = Math.round(watchedSecondsRef.current)
    const video = videoRef.current
    fireWebhook(slug, 'video_complete', {
      watched_seconds: seconds,
      duration_seconds: video && video.duration ? Math.round(video.duration) : null,
    })
    lastSentRef.current = seconds
  }

  async function handleStartTrial(e) {
    if (e) e.preventDefault()
    const name = trialName.trim()
    const email = trialEmail.trim()
    const emailValid = email.length > 0 && email.includes('@')
    let invalid = false
    if (!name) { setTrialNameError(true); invalid = true }
    if (!emailValid) { setTrialEmailError(true); invalid = true }
    if (invalid) return
    setTrialNameError(false)
    setTrialEmailError(false)
    setTrialLoading(true)
    fireWebhook(slug, 'cta_click', { action: 'start_free_trial', name, email })
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
          {businessName} <span>Demo</span>
        </h1>
        <p className="subheading">
          Meet Your AI Receptionist
        </p>

        {/* Video */}
        <div className="video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            preload="metadata"
            onEnded={handleVideoEnded}
            onTimeUpdate={handleVideoTimeUpdate}
            onPlaying={handleVideoPlaying}
            onPause={handleVideoPause}
            controls={isPlaying}
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
              <h3>Cheers {trialName.trim().split(/\s+/)[0]} —</h3>
              <p>shortly I'll send you a setup form by both text and email, pre-filled with details I've pulled from your website. Have a quick scan, fill in anything I've missed, and your AI receptionist will be live within 48 hours of you confirming. After that, I'll help you swap your new number onto Google, your website and anywhere else it needs updating.</p>
            </div>
          ) : (
            <form className="cta-group" onSubmit={handleStartTrial} noValidate>
              <p className="cta-label cta-label-hero">Stop Losing Revenue!</p>
              <input
                type="text"
                className={`cta-input${trialNameError ? ' cta-input-error' : ''}`}
                placeholder="Your name"
                value={trialName}
                onChange={e => {
                  setTrialName(e.target.value)
                  if (trialNameError) setTrialNameError(false)
                }}
                disabled={trialLoading}
                autoComplete="name"
                aria-label="Your name"
                aria-invalid={trialNameError}
              />
              <input
                type="email"
                className={`cta-input${trialEmailError ? ' cta-input-error' : ''}`}
                placeholder="Your email"
                value={trialEmail}
                onChange={e => {
                  setTrialEmail(e.target.value)
                  if (trialEmailError) setTrialEmailError(false)
                }}
                disabled={trialLoading}
                autoComplete="email"
                aria-label="Your email"
                aria-invalid={trialEmailError}
              />
              <p className="cta-helper">I'll send your setup link by both text and email</p>
              <button
                type="submit"
                className="cta-primary"
                disabled={trialLoading}
              >
                {trialLoading ? 'Sending...' : 'Request Your Free Trial'}
              </button>
              <p className="trust-strip">Live in 48 hrs · No card needed · No contract · 14-day free trial</p>
              <div className="guarantee-badge">🛡️ Iron-Clad guarantee — if it doesn't book you £3k more in 30 days, full refund.</div>
            </form>
          )}

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          {/* Secondary CTA */}
          <div className="cta-group">
            <p className="cta-label">Get Your Questions Answered</p>
            <a
              href={CONFIG.calBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-secondary"
              onClick={handleBookCall}
            >
              <CalendarIcon />
              Book A Quick Call
            </a>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

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
          <a href="https://www.seachangeai.co/ai-receptionists-for-roofers">www.seachangeai.co/ai-receptionists-for-roofers</a>
        </div>

      </div>
    </>
  )
}
