import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { Inventory } from './pages/Inventory';
import { Clients } from './pages/Clients';
import { Alerts } from './pages/Alerts';
import { Acervo } from './pages/Acervo';
import { PostServiceModal } from './components/inventory/PostServiceModal';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventario" element={<Inventory />} />
          <Route path="/clientes" element={<Clients />} />
          <Route path="/alertas" element={<Alerts />} />
          <Route path="/acervo" element={<Acervo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PostServiceModal />
      </MainLayout>
    </Router>
  );
}

export default App;
