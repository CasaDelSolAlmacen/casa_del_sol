import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';

function Entradas() {
  const [productos, setProductos] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState('');

  // Estado para el modal de nueva donación
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);

  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [entradaForm, setEntradaForm] = useState({
    producto_id: '',
    cantidad: '',
    donante_id: '',
    fecha_entrada: new Date().toISOString().split('T')[0],
    fecha_caducidad: '',
    lote: '',
    responsable: '',
    notas: ''
  });

  const [editForm, setEditForm] = useState({
    producto_id: '',
    cantidad: '',
    donante_id: '',
    fecha_entrada: '',
    fecha_caducidad: '',
    lote: '',
    responsable: '',
    notas: ''
  });

  useEffect(() => {
    fetchData();
  }, []);


  // Función para cerrar el modal de nueva donación
  const closeNewEntryModal = () => {
    setIsNewEntryModalOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);

    const { data: productosData } = await supabase
      .from('productos')
      .select('id, nombre, unidad_medida')
      .order('nombre');

    const { data: donantesData } = await supabase
      .from('donantes')
      .select('id, nombre')
      .order('nombre');

    const { data: entradasData } = await supabase
      .from('entradas')
      .select(`
        *,
        productos (nombre, unidad_medida),
        donantes (nombre)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    setProductos(productosData || []);
    setDonantes(donantesData || []);
    setEntradas(entradasData || []);
    setLoading(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.rpc('registrar_entrada', {
        p_producto_id: parseInt(entradaForm.producto_id),
        p_cantidad: parseFloat(entradaForm.cantidad),
        p_donante_id: parseInt(entradaForm.donante_id),
        p_fecha_caducidad: entradaForm.fecha_caducidad || null,
        p_lote: entradaForm.lote || null,
        p_responsable: entradaForm.responsable || null
      });

      if (error) throw error;

      showNotification('Donación registrada correctamente');
      closeNewEntryModal();
      fetchData();
      
    } catch (error) {
      console.error('Error al registrar entrada:', error);
      showNotification('Error al registrar la donación', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntrada = async (entrada) => {
    if (confirm(`¿Estás seguro de anular la entrada de ${entrada.cantidad} ${entrada.productos?.unidad_medida} de ${entrada.productos?.nombre}? Esta acción revertirá el stock del inventario.`)) {
      try {
        const { data: inventarioItem, error: fetchError } = await supabase
          .from('inventario')
          .select('stock_actual')
          .eq('id', entrada.inventario_id)
          .single();

        if (fetchError) throw new Error(`No se pudo verificar el stock: ${fetchError.message}`);

        if (inventarioItem.stock_actual < entrada.cantidad) {
          throw new Error(`No se puede anular. El stock actual (${inventarioItem.stock_actual}) es menor que la cantidad de la entrada (${entrada.cantidad}). Es posible que parte del producto ya haya sido despachado.`);
        }

        const { error } = await supabase
          .from('entradas')
          .delete()
          .eq('id', entrada.id);

        if (error) throw error;

        showNotification('Entrada anulada y stock revertido exitosamente.');
        fetchData();
      } catch (error) {
        showNotification('Error al anular la entrada: ' + error.message, 'error');
      }
    }
  };

  // Nueva función para manejar la edición
  const handleEditEntrada = (entrada) => {
    setEditingEntrada(entrada);
    setEditForm({
      producto_id: entrada.producto_id.toString(),
      cantidad: entrada.cantidad.toString(),
      donante_id: entrada.donante_id.toString(),
      fecha_entrada: entrada.fecha_entrada || '',
      fecha_caducidad: entrada.fecha_caducidad || '',
      lote: entrada.lote || '',
      responsable: entrada.responsable || '',
      notas: entrada.notas || ''
    });
    setIsEditModalOpen(true);
  };

  // Nueva función para guardar los cambios
  const handleUpdateEntrada = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase.rpc('actualizar_entrada', {
        p_entrada_id: editingEntrada.id,
        p_producto_id: parseInt(editForm.producto_id),
        p_cantidad: parseFloat(editForm.cantidad),
        p_donante_id: parseInt(editForm.donante_id),
        p_fecha_caducidad: editForm.fecha_caducidad || null,
        p_lote: editForm.lote || null,
        p_responsable: editForm.responsable || null
      });

      if (error) throw error;

      showNotification('Entrada actualizada exitosamente');
      setIsEditModalOpen(false);
      setEditingEntrada(null);
      fetchData();
    } catch (error) {
      showNotification('Error al actualizar la entrada: ' + error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEntrada(null);
    setEditForm({
      producto_id: '',
      cantidad: '',
      donante_id: '',
      fecha_entrada: '',
      fecha_caducidad: '',
      lote: '',
      responsable: '',
      notas: ''
    });
  };

  const getSelectedProductUnit = () => {
    const selectedProduct = productos.find(p => p.id == entradaForm.producto_id);
    return selectedProduct ? selectedProduct.unidad_medida : '';
  };

  const getEditSelectedProductUnit = () => {
    const selectedProduct = productos.find(p => p.id == editForm.producto_id);
    return selectedProduct ? selectedProduct.unidad_medida : '';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section - Responsive */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
          <span className="mr-2">📥</span>
          Registrar Entrada
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Registra nuevas donaciones y gestiona las entradas recientes
        </p>
      </div>

      {/* Notification - Responsive */}
      {notification && (
        <div className={`mb-4 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
          notification.type === 'error'
            ? 'bg-red-100 border border-red-400 text-red-700'
            : 'bg-green-100 border border-green-400 text-green-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Loading State - Enhanced */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Botón para abrir modal de nueva donación */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEntradaForm({
                  producto_id: '',
                  cantidad: '',
                  donante_id: '',
                  fecha_entrada: new Date().toISOString().split('T')[0],
                  fecha_caducidad: '',
                  lote: '',
                  responsable: '',
                  notas: ''
                });
                setIsNewEntryModalOpen(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nueva Donación
            </Button>
          </div>

          {/* Modal para nueva donación */}
          <Modal isOpen={isNewEntryModalOpen} onClose={closeNewEntryModal} title="Registrar Nueva Donación">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Producto"
                  value={entradaForm.producto_id}
                  onChange={(e) => setEntradaForm({ ...entradaForm, producto_id: e.target.value })}
                  options={productos.map(p => ({
                    value: p.id,
                    label: `${p.nombre} (${p.unidad_medida})`
                  }))}
                  required
                />

                <Select
                  label="Donante"
                  value={entradaForm.donante_id}
                  onChange={(e) => setEntradaForm({ ...entradaForm, donante_id: e.target.value })}
                  options={donantes.map(d => ({ value: d.id, label: d.nombre }))}
                  required
                />

                <Input
                  label={`Cantidad ${getSelectedProductUnit() ? `(${getSelectedProductUnit()})` : ''}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={entradaForm.cantidad}
                  onChange={(e) => setEntradaForm({ ...entradaForm, cantidad: e.target.value })}
                  placeholder="0.00"
                  required
                />

                <Input
                  label="Fecha de Entrada"
                  type="date"
                  value={entradaForm.fecha_entrada}
                  onChange={(e) => setEntradaForm({ ...entradaForm, fecha_entrada: e.target.value })}
                  required
                />

                <Input
                  label="Fecha de Caducidad"
                  type="date"
                  value={entradaForm.fecha_caducidad}
                  onChange={(e) => setEntradaForm({ ...entradaForm, fecha_caducidad: e.target.value })}
                />

                <Input
                  label="Lote"
                  value={entradaForm.lote}
                  onChange={(e) => setEntradaForm({ ...entradaForm, lote: e.target.value })}
                  placeholder="Número de lote (opcional)"
                />

                <Input
                  label="Responsable"
                  value={entradaForm.responsable}
                  onChange={(e) => setEntradaForm({ ...entradaForm, responsable: e.target.value })}
                  placeholder="Nombre del responsable (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={entradaForm.notas}
                  onChange={(e) => setEntradaForm({ ...entradaForm, notas: e.target.value })}
                  placeholder="Notas adicionales (opcional)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={closeNewEntryModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registrando...
                    </>
                  ) : 'Registrar Donación'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Recent Entries Section */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">📋</span>
              Entradas Recientes ({entradas.length})
            </h3>

            <div className="space-y-4 max-h-96 lg:max-h-[600px] overflow-y-auto">
              {entradas.map((entrada) => (
                <article
                  key={entrada.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-start bg-gradient-to-r from-white to-gray-50 border rounded-lg p-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="truncate">
                        <h4 className="font-semibold text-gray-900 text-base truncate">
                          {entrada.productos?.nombre}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {entrada.donantes?.nombre || 'Donante desconocido'}
                        </p>
                      </div>
                      <div className="ml-3 text-right sm:text-sm text-gray-500">
                        <time dateTime={entrada.fecha_entrada || entrada.created_at}>
                          {new Date(entrada.fecha_entrada || entrada.created_at).toLocaleDateString()}
                        </time>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:gap-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">📦</span>
                        <span className="font-medium">
                          {entrada.cantidad} {entrada.productos?.unidad_medida}
                        </span>
                      </div>

                      {entrada.fecha_caducidad && (
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="mr-2">📅</span>
                          <span>Caduca: {new Date(entrada.fecha_caducidad).toLocaleDateString()}</span>
                        </div>
                      )}

                      {entrada.lote && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">🏷️</span>
                          <span>Lote: {entrada.lote}</span>
                        </div>
                      )}

                      {entrada.responsable && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">👤</span>
                          <span>{entrada.responsable}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0 flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditEntrada(entrada)}
                        className="text-xs"
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteEntrada(entrada)}
                        className="text-xs"
                      >
                        🗑️ Anular
                      </Button>
                    </div>
                    <span className="text-xs text-gray-400">
                      ID: {entrada.id}
                    </span>
                  </div>
                </article>
              ))}

              {entradas.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📥</div>
                  <p className="text-gray-500 text-lg font-medium">No hay entradas registradas</p>
                  <p className="text-gray-400 text-sm mt-1">Las nuevas donaciones aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title="Editar Entrada"
        size="lg"
      >
        <form onSubmit={handleUpdateEntrada} className="space-y-4">
          <Select
            label="Producto"
            value={editForm.producto_id}
            onChange={(e) => setEditForm({ ...editForm, producto_id: e.target.value })}
            options={productos.map(p => ({
              value: p.id,
              label: `${p.nombre} (${p.unidad_medida})`
            }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Cantidad ${getEditSelectedProductUnit() ? `(${getEditSelectedProductUnit()})` : ''}`}
              type="number"
              step="0.01"
              min="0"
              value={editForm.cantidad}
              onChange={(e) => setEditForm({ ...editForm, cantidad: e.target.value })}
              placeholder="0.00"
              required
            />

            <Input
              label="Fecha de Caducidad"
              type="date"
              value={editForm.fecha_caducidad}
              onChange={(e) => setEditForm({ ...editForm, fecha_caducidad: e.target.value })}
            />
          </div>

          <Select
            label="Donante"
            value={editForm.donante_id}
            onChange={(e) => setEditForm({ ...editForm, donante_id: e.target.value })}
            options={donantes.map(d => ({ value: d.id, label: d.nombre }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Lote"
              value={editForm.lote}
              onChange={(e) => setEditForm({ ...editForm, lote: e.target.value })}
              placeholder="Número de lote (opcional)"
            />

            <Input
              label="Responsable"
              value={editForm.responsable}
              onChange={(e) => setEditForm({ ...editForm, responsable: e.target.value })}
              placeholder="Persona responsable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={editForm.notas}
              onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={closeEditModal}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="w-full sm:w-auto"
            >
              {updating ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </span>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Entradas;
