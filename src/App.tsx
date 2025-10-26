import { useState } from 'react'

function App() {
  const [activeModule, setActiveModule] = useState<'meteorology' | 'water-level' | 'drought'>(
    'meteorology'
  )

  return (
    <div className="bg-bg-main min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <h1 className="text-text-primary text-2xl font-bold">🌊 DunApp PWA</h1>
          <p className="text-text-secondary text-sm">
            Meteorológiai, vízállás és aszály monitoring
          </p>
        </div>
      </header>

      {/* Module Tabs */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveModule('meteorology')}
              className={`border-b-2 px-2 py-4 text-sm font-medium transition-colors ${
                activeModule === 'meteorology'
                  ? 'border-meteorology text-meteorology'
                  : 'text-text-secondary hover:text-text-primary border-transparent'
              }`}
            >
              🌤️ Meteorológia
            </button>
            <button
              onClick={() => setActiveModule('water-level')}
              className={`border-b-2 px-2 py-4 text-sm font-medium transition-colors ${
                activeModule === 'water-level'
                  ? 'border-water-level text-water-level'
                  : 'text-text-secondary hover:text-text-primary border-transparent'
              }`}
            >
              💧 Vízállás
            </button>
            <button
              onClick={() => setActiveModule('drought')}
              className={`border-b-2 px-2 py-4 text-sm font-medium transition-colors ${
                activeModule === 'drought'
                  ? 'border-drought text-drought'
                  : 'text-text-secondary hover:text-text-primary border-transparent'
              }`}
            >
              🏜️ Aszály
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-text-primary mb-4 text-xl font-semibold">
            {activeModule === 'meteorology' && 'Meteorológia Modul'}
            {activeModule === 'water-level' && 'Vízállás Modul'}
            {activeModule === 'drought' && 'Aszály Modul'}
          </h2>
          <p className="text-text-secondary">
            A DunApp PWA sikeresen inicializálva! A modulok fejlesztése folyamatban...
          </p>

          <div className="bg-bg-main mt-6 rounded p-4">
            <h3 className="text-text-primary mb-2 font-medium">Projekt Állapot</h3>
            <ul className="text-text-secondary space-y-2 text-sm">
              <li>✅ Vite + React + TypeScript</li>
              <li>✅ Tailwind CSS</li>
              <li>✅ React Router, Recharts, Leaflet</li>
              <li>✅ Supabase Client</li>
              <li>⏳ Modulok fejlesztése</li>
              <li>⏳ GitHub & Netlify deployment</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
