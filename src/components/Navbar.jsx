import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/inventario', label: 'Inventario', icon: '📦' },
  { to: '/productos', label: 'Productos', icon: '🏷️' },
  { to: '/donantes', label: 'Donantes', icon: '🤝' },
  { to: '/entradas', label: 'Entradas', icon: '📥' },
  { to: '/salidas', label: 'Salidas', icon: '📤' },

];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_time');
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <h1 className="font-bold text-lg sm:text-xl lg:text-2xl tracking-wide">
              <span className="hidden sm:inline">Casa del Sol | Alimentos</span>
              <span className="sm:hidden">Almacén Alimentos</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <ul className="flex space-x-1 lg:space-x-2">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isActive
                          ? 'bg-blue-700 text-white shadow-md'
                          : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                      }`
                    }
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="hidden lg:inline">{item.label}</span>
                    <span className="lg:hidden">{item.label.substring(0, 8)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm lg:text-base font-medium transition-all duration-200 flex items-center space-x-2 text-blue-100 hover:bg-red-500 hover:text-white"
              title="Cerrar sesión"
            >
              <span className="text-lg">🚪</span>
              <span className="hidden lg:inline">Salir</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? 'max-h-96 opacity-100 pb-4'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-blue-700 rounded-lg mt-2 relative z-50">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-800 text-white shadow-md border-l-4 border-blue-300'
                      : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            
            {/* Mobile Logout Button */}
            <button
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
              className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-all duration-200 text-blue-100 hover:bg-red-500 hover:text-white w-full text-left"
            >
              <span className="text-xl">🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
