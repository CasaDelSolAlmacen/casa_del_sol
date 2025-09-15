import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Donantes from './pages/Donantes';
import Entradas from './pages/Entradas';
import Salidas from './pages/Salidas';
import Chat from './pages/Chat';
import Login from './pages/Login';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && <Navbar />}
      <main className={`flex-1 ${!isLoginPage ? 'container mx-auto p-4' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/inventario" replace />} />
          <Route path="/inventario" element={<Inventory />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/donantes" element={<Donantes />} />
          <Route path="/entradas" element={<Entradas />} />
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
