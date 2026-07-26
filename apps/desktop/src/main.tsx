import './styles.css'
// Side-effect: applies the persisted window translucency on load.
import './store/translucency'
// Dev-only render/state churn counters. MUST precede the `react-dom` import
// below: react-dom captures the devtools hook at module init, so bippy has to
// install during THIS import's evaluation or every commit goes unseen
// (verified — a late install reports renderers=0, commits=0). `vite.config.ts`
// aliases this specifier to a no-op module for non-dev builds, so neither the
// counters nor bippy reach a shipped renderer.
import '@/debug/dev-only'

import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'

import App from './app'
import { ErrorBoundary } from './components/error-boundary'
import { HapticsProvider } from './components/haptics-provider'
import { I18nProvider } from './i18n'
import { installClipboardShim } from './lib/clipboard'
import { queryClient } from './lib/query-client'
import { ThemeProvider } from './themes/context'

installClipboardShim()

// The perf probe ships in dev, and in a production build ONLY when explicitly
// opted in (VITE_PERF_PROBE=1) — this lets the perf harness measure a real,
// minified production renderer for representative absolute numbers. Normal
// `npm run build` leaves the flag unset, so the probe never reaches users.
if (import.meta.env.MODE !== 'production' || import.meta.env.VITE_PERF_PROBE === '1') {
  import('./app/chat/perf-probe')
}

if (new URLSearchParams(window.location.search).get('win') === 'overlay') {
  void import('./app/pet-overlay/overlay-root').then(({ mountPetOverlay }) => mountPetOverlay())
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary label="root">
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ThemeProvider>
              <HapticsProvider>
                {/* react-router-dom is intentionally pinned to 7.11.0. Later v7
                    releases enabled transition-backed HashRouter updates and exposed
                    useTransitions={false}; under React 19 those non-urgent route commits
                    can be starved by streaming token and gateway updates. Version 7.11
                    predates that behavior, so its plain HashRouter keeps navigation at
                    default priority without the later-only prop. Keep the pin and this
                    invariant together when upgrading after the advisory is fixed. */}
                <HashRouter>
                  <App />
                </HashRouter>
              </HapticsProvider>
            </ThemeProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
