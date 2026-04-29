import { useState } from 'react'
import { Header } from './components/Header'
import { Dashboard } from './pages/Dashboard'
import { ClientiArchive } from './pages/ClientiArchive'

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'clienti':
        return <ClientiArchive />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="main-content">
      <Header currentView={currentView} onNavigate={setCurrentView} />
      {renderView()}
    </div>
  );
}

export default App
