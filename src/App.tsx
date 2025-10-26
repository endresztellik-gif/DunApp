import { useState } from 'react'

function App() {
  const [activeModule, setActiveModule] = useState<'meteorology' | 'water-level' | 'drought'>('meteorology')

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-text-primary">
            🌊 DunApp PWA
          </h1>
          <p className="text-sm text-text-secondary">
            Meteorológiai, vízállás és aszály monitoring
          </p>
        </div>
      </header>

      {/* Module Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveModule('meteorology')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeModule === 'meteorology'
                  ? 'border-meteorology text-meteorology'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              🌤️ Meteorológia
            </button>
            <button
              onClick={() => setActiveModule('water-level')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeModule === 'water-level'
                  ? 'border-water-level text-water-level'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              💧 Vízállás
            </button>
            <button
              onClick={() => setActiveModule('drought')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeModule === 'drought'
                  ? 'border-drought text-drought'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              🏜️ Aszály
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            {activeModule === 'meteorology' && 'Meteorológia Modul'}
            {activeModule === 'water-level' && 'Vízállás Modul'}
            {activeModule === 'drought' && 'Aszály Modul'}
          </h2>
          <p className="text-text-secondary">
            A DunApp PWA sikeresen inicializálva! A modulok fejlesztése folyamatban...
          </p>

          <div className="mt-6 p-4 bg-bg-main rounded">
            <h3 className="font-medium text-text-primary mb-2">Projekt Állapot</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
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
