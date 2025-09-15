import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';

function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from('vista_inventario_actual').select('*');

    if (filter === 'caducar') {
      query = query.lt('fecha_caducidad', new Date(new Date().setDate(new Date().getDate() + 30)).toISOString());
    } else if (filter === 'caducado') {
      query = query.lt('fecha_caducidad', new Date().toISOString());
    } else if (filter === 'bajo_stock') {
      query = query.lt('stock_actual', 10);
    }

    const { data, error } = await query.order('fecha_caducidad');
    if (!error) setItems(data || []);
    setLoading(false);
  };

  const filteredItems = items.filter(item =>
    item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.donante && item.donante.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (estado) => {
    switch (estado) {
      case '❌ Caducado':
        return 'text-red-600 bg-red-100';
      case '⚠️ Próximo a vencer':
        return 'text-orange-600 bg-orange-100';
      case '🟡 Revisar pronto':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const exportToCSV = () => {
    const headers = ['Producto', 'Categoría', 'Stock Actual', 'Unidad', 'Fecha Caducidad', 'Estado', 'Donante', 'Ubicación'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => [
        `"${item.producto}"`, 
        `"${item.categoria}"`, 
        item.stock_actual,
        `"${item.unidad_medida}"`, 
        item.fecha_caducidad || '',
        `"${item.estado_caducidad}"`, 
        `"${item.donante || ''}"`, 
        `"${item.ubicacion_estante || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div>
        {/* Header with responsive title and export button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Inventario</h2>
          <Button onClick={exportToCSV} variant="secondary" className="w-full sm:w-auto">
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">📊 Exportar</span>
          </Button>
        </div>

        {/* Filters and Search - Responsive grid */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">Todos los productos</option>
              <option value="caducar">Próximos a caducar (&lt; 30 días)</option>
              <option value="caducado">Productos caducados</option>
              <option value="bajo_stock">Stock bajo (&lt; 10 unidades)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por producto, categoría o donante..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Summary Cards - Responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Productos</h3>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">{items.length}</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Próximos a Caducar</h3>
            <p className="text-lg sm:text-2xl font-bold text-orange-600">
              {items.filter(item => item.estado_caducidad === '⚠️ Próximo a vencer').length}
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Caducados</h3>
            <p className="text-lg sm:text-2xl font-bold text-red-600">
              {items.filter(item => item.estado_caducidad === '❌ Caducado').length}
            </p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Stock Bajo</h3>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">
              {items.filter(item => item.stock_actual < 10).length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando...</span>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white shadow-sm rounded-lg overflow-hidden border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Caducidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Donante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.producto}</div>
                            {item.codigo && (
                              <div className="text-sm text-gray-500">Código: {item.codigo}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.categoria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.stock_actual} {item.unidad_medida}
                          </div>
                          {item.stock_actual < 10 && (
                            <div className="text-xs text-red-500 font-medium">Stock bajo</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.fecha_caducidad ? new Date(item.fecha_caducidad).toLocaleDateString() : 'N/A'}
                          {item.dias_restantes !== null && (
                            <div className="text-xs text-gray-500">
                              {item.dias_restantes >= 0 ? `${item.dias_restantes} días` : 'Caducado'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.estado_caducidad)}`}>
                            {item.estado_caducidad}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.donante || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.ubicacion_estante || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
                  {/* Product Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base">{item.producto}</h3>
                      {item.codigo && (
                        <p className="text-sm text-gray-500">Código: {item.codigo}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">{item.categoria}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.estado_caducidad)} ml-2`}>
                      {item.estado_caducidad}
                    </span>
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">Stock:</span>
                      <div className="mt-1">
                        <span className="font-semibold text-gray-900">
                          {item.stock_actual} {item.unidad_medida}
                        </span>
                        {item.stock_actual < 10 && (
                          <div className="text-xs text-red-500 font-medium">Stock bajo</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">Caducidad:</span>
                      <div className="mt-1">
                        <span className="text-gray-900">
                          {item.fecha_caducidad ? new Date(item.fecha_caducidad).toLocaleDateString() : 'N/A'}
                        </span>
                        {item.dias_restantes !== null && (
                          <div className="text-xs text-gray-500">
                            {item.dias_restantes >= 0 ? `${item.dias_restantes} días` : 'Caducado'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">Donante:</span>
                      <div className="mt-1 text-gray-900">{item.donante || 'N/A'}</div>
                    </div>

                    <div>
                      <span className="text-gray-500 font-medium">Ubicación:</span>
                      <div className="mt-1 text-gray-900">{item.ubicacion_estante || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No results message */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <div className="text-gray-400 text-4xl mb-4">📦</div>
                <p className="text-gray-500 text-lg font-medium">No se encontraron productos</p>
                <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Inventory;
