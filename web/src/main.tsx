import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '@/providers/app-providers'
import App from '@/App'
import './index.css'
import './styles/legacy-poc-tokens.css'
import './styles/legacy-poc-forms.css'
import './styles/legacy-poc-home.css'
import './styles/legacy-poc-find.css'
import './styles/legacy-poc-workflow.css'
import './styles/legacy-poc-knowledge-base.css'
import './styles/legacy-poc-login.css'
import './styles/legacy-poc-register.css'
import './styles/legacy-poc-demo-credentials.css'
import './styles/marketing-system.css'
import './styles/public-rtl.css'

function normalizeLegacyHashRoute() {
  const { hash, pathname, search } = window.location
  if (!hash.startsWith('#/')) {
    return
  }

  const basePath = pathname.endsWith('/index.html') ? pathname.slice(0, -'/index.html'.length) : pathname
  const normalizedBasePath = basePath === '/' ? '' : basePath
  const targetPath = hash.slice(1)
  window.history.replaceState(null, '', `${normalizedBasePath}${targetPath}${search}`)
}

normalizeLegacyHashRoute()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
