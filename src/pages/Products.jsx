import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [notification, setNotification] = useState('');
  const [activeTab, setActiveTab] = useState('productos');

  // Form states
  const [productForm, setProductForm] = useState({
    codigo: '',
    nombre: '',
    categoria_id: '',
    unidad_medida: '',
    descripcion: '',
    requiere_refrigeracion: false
  });

  const [categoryForm, setCategoryForm] = useState({
    nombre: '',
    descripcion: ''
  });

  const unidadesMedida = [
    { value: 'kg', label: 'Kilogramos' },
    { value: 'litros', label: 'Litros' },
    { value: 'piezas', label: 'Piezas' },
    { value: 'cajas', label: 'Cajas' },
    { value: 'latas', label: 'Latas' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch products with categories
    const { data: productsData } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (
          id,
          nombre
        )
      `)
      .order('nombre');

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre');

    setProducts(productsData || []);
    setCategories(categoriesData || []);
    setLoading(false);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Product CRUD
  const handleProductSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('productos')
          .update(productForm)
          .eq('id', editingProduct.id);

        if (error) throw error;
        showNotification('Producto actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('productos')
          .insert([productForm]);

        if (error) throw error;
        showNotification('Producto creado exitosamente');
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        codigo: '',
        nombre: '',
        categoria_id: '',
        unidad_medida: '',
        descripcion: '',
        requiere_refrigeracion: false
      });
      fetchData();
    } catch (error) {
      showNotification('Error: ' + error.message);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      codigo: product.codigo || '',
      nombre: product.nombre || '',
      categoria_id: product.categoria_id || '',
      unidad_medida: product.unidad_medida || '',
      descripcion: product.descripcion || '',
      requiere_refrigeracion: product.requiere_refrigeracion || false
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        const { error } = await supabase
          .from('productos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        showNotification('Producto eliminado exitosamente');
        fetchData();
      } catch (error) {
        showNotification('Error: ' + error.message);
      }
    }
  };

  // Category CRUD
  const handleCategorySubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categorias')
          .update(categoryForm)
          .eq('id', editingCategory.id);

        if (error) throw error;
        showNotification('Categoría actualizada exitosamente');
      } else {
        const { error } = await supabase
          .from('categorias')
          .insert([categoryForm]);

        if (error) throw error;
        showNotification('Categoría creada exitosamente');
      }

      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ nombre: '', descripcion: '' });
      fetchData();
    } catch (error) {
      showNotification('Error: ' + error.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      nombre: category.nombre || '',
      descripcion: category.descripcion || ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        const { error } = await supabase
          .from('categorias')
          .delete()
          .eq('id', id);

        if (error) throw error;
        showNotification('Categoría eliminada exitosamente');
        fetchData();
      } catch (error) {
        showNotification('Error: ' + error.message);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Productos</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => {
              if (activeTab === 'productos') {
                setIsModalOpen(true);
              } else {
                setIsCategoryModalOpen(true);
              }
            }}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">
              {activeTab === 'productos' ? 'Nuevo Producto' : 'Nueva Categoría'}
            </span>
            <span className="sm:hidden">
              {activeTab === 'productos' ? '➕ Nuevo Producto' : '🏷️ Nueva Categoría'}
            </span>
          </Button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('productos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'productos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <span className="mr-2">📦</span>
                Productos ({products.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('categorias')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'categorias'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <span className="mr-2">🏷️</span>
                Categorías ({categories.length})
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Notification - Responsive */}
      {notification && (
        <div className="mb-4 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm sm:text-base">
          {notification}
        </div>
      )}

      {/* Loading State - Enhanced */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando productos y categorías...</span>
        </div>
      ) : (
        <div>
          {/* Products Section */}
          {activeTab === 'productos' && (
            <div>

            {/* Desktop Table View - Products */}
            <div className="hidden lg:block bg-white shadow-sm rounded-lg overflow-hidden border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.codigo || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                            {product.requiere_refrigeracion && (
                              <div className="text-xs text-blue-600 flex items-center mt-1">
                                <span className="mr-1">❄️</span>
                                Refrigeración
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.categorias?.nombre || 'Sin categoría'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.unidad_medida}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditProduct(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View - Products */}
            <div className="lg:hidden space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4">
                  {/* Product Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-base">{product.nombre}</h4>
                      {product.codigo && (
                        <p className="text-sm text-gray-500">Código: {product.codigo}</p>
                      )}
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-sm text-gray-600">{product.categorias?.nombre || 'Sin categoría'}</span>
                        {product.requiere_refrigeracion && (
                          <span className="text-xs text-blue-600 flex items-center">
                            <span className="mr-1">❄️</span>
                            Refrigeración
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 font-medium">Unidad:</span>
                      <div className="mt-1 text-gray-900 font-semibold">{product.unidad_medida}</div>
                    </div>
                    {product.descripcion && (
                      <div className="col-span-2">
                        <span className="text-gray-500 font-medium">Descripción:</span>
                        <div className="mt-1 text-gray-900 text-sm">{product.descripcion}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditProduct(product)}
                      className="flex-1"
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              ))}

              {products.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                  <div className="text-gray-400 text-4xl mb-4">📦</div>
                  <p className="text-gray-500 text-lg font-medium">No hay productos registrados</p>
                  <p className="text-gray-400 text-sm mt-1">Crea tu primer producto usando el botón de arriba</p>
                </div>
              )}
            </div>
            </div>
          )}

          {/* Categories Section */}
          {activeTab === 'categorias' && (
            <div>

            {/* Desktop Table View - Categories */}
            <div className="hidden lg:block bg-white shadow-sm rounded-lg overflow-hidden border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.nombre}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {category.descripcion || 'Sin descripción'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEditCategory(category)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View - Categories */}
            <div className="lg:hidden space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow-sm border p-4">
                  {/* Category Header */}
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 text-base">{category.nombre}</h4>
                    {category.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{category.descripcion}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEditCategory(category)}
                      className="flex-1"
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="flex-1"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                  <div className="text-gray-400 text-4xl mb-4">🏷️</div>
                  <p className="text-gray-500 text-lg font-medium">No hay categorías registradas</p>
                  <p className="text-gray-400 text-sm mt-1">Crea tu primera categoría usando el botón de arriba</p>
                </div>
              )}
            </div>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          setProductForm({
            codigo: '',
            nombre: '',
            categoria_id: '',
            unidad_medida: '',
            descripcion: '',
            requiere_refrigeracion: false
          });
        }}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleProductSubmit}>
          <Input
            label="Código"
            value={productForm.codigo}
            onChange={(e) => setProductForm({ ...productForm, codigo: e.target.value })}
            placeholder="Ej: ARR001"
          />

          <Input
            label="Nombre"
            value={productForm.nombre}
            onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
            placeholder="Nombre del producto"
            required
          />

          <Select
            label="Categoría"
            value={productForm.categoria_id}
            onChange={(e) => setProductForm({ ...productForm, categoria_id: e.target.value })}
            options={categories.map(cat => ({ value: cat.id, label: cat.nombre }))}
            required
          />

          <Select
            label="Unidad de Medida"
            value={productForm.unidad_medida}
            onChange={(e) => setProductForm({ ...productForm, unidad_medida: e.target.value })}
            options={unidadesMedida}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={productForm.descripcion}
              onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
              placeholder="Descripción del producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={productForm.requiere_refrigeracion}
                onChange={(e) => setProductForm({ ...productForm, requiere_refrigeracion: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Requiere refrigeración</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingProduct ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setCategoryForm({ nombre: '', descripcion: '' });
        }}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleCategorySubmit}>
          <Input
            label="Nombre"
            value={categoryForm.nombre}
            onChange={(e) => setCategoryForm({ ...categoryForm, nombre: e.target.value })}
            placeholder="Nombre de la categoría"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={categoryForm.descripcion}
              onChange={(e) => setCategoryForm({ ...categoryForm, descripcion: e.target.value })}
              placeholder="Descripción de la categoría"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Products;
