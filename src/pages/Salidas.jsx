import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';

const tiposDestino = [
  { value: 'familia', label: 'Familia' },
  { value: 'comedor', label: 'Comedor' },
  { value: 'institucion', label: 'Institución' },
  { value: 'otro', label: 'Otro' },
];

function Salidas() {
  const [inventario, setInventario] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState('');
  
  // Estado para el modal de nueva salida
  const [isNewSalidaModalOpen, setIsNewSalidaModalOpen] = useState(false);

  const [salidaForm, setSalidaForm] = useState({
    inventario_id: '',
    cantidad: '',
    tipo_destino: '',
    descripcion_destino: '',
    responsable: ''
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSalida, setEditingSalida] = useState(null);
  const [editForm, setEditForm] = useState({
    inventario_id: '',
    cantidad: '',
    tipo_destino: '',
    descripcion_destino: '',
    responsable: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: inventarioData } = await supabase
      .from('vista_inventario_actual')
      .select('*')
      .gt('stock_actual', 0)
      .order('producto');

    const { data: salidasData } = await supabase
      .from('salidas')
      .select(`
        *,
        inventario (
          lote,
          fecha_caducidad,
          productos (
            nombre,
            unidad_medida
          )
        )
      `)
      .order('fecha_salida', { ascending: false })
      .limit(10);

    setInventario(inventarioData || []);
    setSalidas(salidasData || []);
    setLoading(false);
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(''), 4000);
  };
  
  const openNewSalidaModal = () => {
    setSalidaForm({
      inventario_id: '',
      cantidad: '',
      tipo_destino: '',
      descripcion_destino: '',
      responsable: ''
    });
    setIsNewSalidaModalOpen(true);
  };
  
  const closeNewSalidaModal = () => {
    setIsNewSalidaModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const selectedItem = inventario.find(item => item.inventario_id == salidaForm.inventario_id);
    if (parseFloat(salidaForm.cantidad) > selectedItem.stock_actual) {
      showNotification(`Error: La cantidad de salida excede el stock disponible (${selectedItem.stock_actual} ${selectedItem.unidad_medida}).`, 'error');
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('salidas')
        .insert([{
          inventario_id: parseInt(salidaForm.inventario_id),
          cantidad: parseFloat(salidaForm.cantidad),
          tipo_destino: salidaForm.tipo_destino,
          descripcion_destino: salidaForm.descripcion_destino,
          responsable: salidaForm.responsable
        }]);

      if (error) throw error;

      showNotification('Salida registrada exitosamente');
      closeNewSalidaModal();
      fetchData();
    } catch (error) {
      showNotification('Error: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSalida = async (salida) => {
    if (confirm(`¿Estás seguro de anular esta salida? La cantidad será devuelta al stock del inventario.`)) {
      try {
        const { error } = await supabase
          .from('salidas')
          .delete()
          .eq('id', salida.id);

        if (error) throw error;

        showNotification('Salida anulada y stock revertido exitosamente.');
        fetchData();
      } catch (error) {
        showNotification('Error al anular la salida: ' + error.message, 'error');
      }
    }
  };

  const handleEditSalida = (salida) => {
    setEditingSalida(salida);
    setEditForm({
      inventario_id: salida.inventario_id.toString(),
      cantidad: salida.cantidad.toString(),
      tipo_destino: salida.tipo_destino,
      descripcion_destino: salida.descripcion_destino || '',
      responsable: salida.responsable || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSalida = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase.rpc('actualizar_salida', {
        p_salida_id: editingSalida.id,
        p_inventario_id: parseInt(editForm.inventario_id),
        p_cantidad: parseFloat(editForm.cantidad),
        p_tipo_destino: editForm.tipo_destino,
        p_descripcion_destino: editForm.descripcion_destino,
        p_responsable: editForm.responsable
      });

      if (error) throw error;

      showNotification('Salida actualizada exitosamente');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      showNotification('Error al actualizar la salida: ' + error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSalida(null);
  };

  const getSelectedProductInfo = (inventarioId) => {
    const selected = inventario.find(item => item.inventario_id == inventarioId);
    return selected ? `(${selected.stock_actual} ${selected.unidad_medida} disp.)` : '';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section - Responsive */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
          <span className="mr-2">📤</span>
          Registrar Salida
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Registra entregas de productos y gestiona las salidas recientes
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Botón para abrir modal de nueva salida */}
          <div className="flex justify-end">
            <Button
              onClick={openNewSalidaModal}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nueva Salida
            </Button>
          </div>

          {/* Modal para nueva salida */}
          <Modal isOpen={isNewSalidaModalOpen} onClose={closeNewSalidaModal} title="Registrar Nueva Salida">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Producto del Inventario"
                value={salidaForm.inventario_id}
                onChange={(e) => setSalidaForm({ ...salidaForm, inventario_id: e.target.value })}
                options={inventario.map(item => ({
                  value: item.inventario_id,
                  label: `${item.producto} (Lote: ${item.lote || 'N/A'}, Cad: ${item.fecha_caducidad ? new Date(item.fecha_caducidad).toLocaleDateString() : 'N/A'}) - Stock: ${item.stock_actual}`
                }))}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={`Cantidad a retirar ${getSelectedProductInfo(salidaForm.inventario_id)}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={salidaForm.cantidad}
                  onChange={(e) => setSalidaForm({ ...salidaForm, cantidad: e.target.value })}
                  placeholder="0.00"
                  required
                />

                <Select
                  label="Tipo de Destino"
                  value={salidaForm.tipo_destino}
                  onChange={(e) => setSalidaForm({ ...salidaForm, tipo_destino: e.target.value })}
                  options={tiposDestino}
                  required
                />
              </div>

              <Input
                label="Descripción del Destino"
                value={salidaForm.descripcion_destino}
                onChange={(e) => setSalidaForm({ ...salidaForm, descripcion_destino: e.target.value })}
                placeholder="Ej: Familia Pérez, Comedor Los Niños"
                required
              />

              <Input
                label="Responsable"
                value={salidaForm.responsable}
                onChange={(e) => setSalidaForm({ ...salidaForm, responsable: e.target.value })}
                placeholder="Persona que retira o autoriza (opcional)"
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={closeNewSalidaModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registrando...
                    </>
                  ) : 'Registrar Salida'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Recent Salidas Section */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <span className="mr-2">📋</span>
              Salidas Recientes ({salidas.length})
            </h3>

            <div className="space-y-4 max-h-96 lg:max-h-[600px] overflow-y-auto">
              {salidas.map((salida) => (
                <article
                  key={salida.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-start bg-gradient-to-r from-white to-orange-50 border-l-4 border-orange-500 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="truncate">
                        <h4 className="font-semibold text-gray-900 text-base truncate">
                          {salida.inventario.productos.nombre}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {salida.descripcion_destino}
                        </p>
                      </div>
                      <div className="ml-3 text-right sm:text-sm text-gray-500">
                        <time dateTime={salida.fecha_salida}>
                          {new Date(salida.fecha_salida).toLocaleDateString()}
                        </time>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:gap-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">📦</span>
                        <span className="font-medium">
                          {salida.cantidad} {salida.inventario.productos.unidad_medida}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">🏷️</span>
                        <span className="capitalize">{salida.tipo_destino}</span>
                      </div>

                      {salida.inventario.lote && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">📋</span>
                          <span>Lote: {salida.inventario.lote}</span>
                        </div>
                      )}

                      {salida.responsable && (
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">👤</span>
                          <span>{salida.responsable}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-0 sm:ml-4 flex-shrink-0 flex flex-col items-end space-y-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditSalida(salida)}
                        className="text-xs"
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSalida(salida)}
                        className="text-xs"
                      >
                        🗑️ Anular
                      </Button>
                    </div>
                    <span className="text-xs text-gray-400">
                      ID: {salida.id}
                    </span>
                  </div>
                </article>
              ))}

              {salidas.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📤</div>
                  <p className="text-gray-500 text-lg font-medium">No hay salidas registradas</p>
                  <p className="text-gray-400 text-sm mt-1">Las nuevas entregas aparecerán aquí</p>
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
        title="Editar Salida"
        size="lg"
      >
        <form onSubmit={handleUpdateSalida} className="space-y-4">
          <Select
            label="Producto del Inventario"
            value={editForm.inventario_id}
            onChange={(e) => setEditForm({ ...editForm, inventario_id: e.target.value })}
            options={inventario.map(item => ({
              value: item.inventario_id,
              label: `${item.producto} (Lote: ${item.lote || 'N/A'}) - Stock: ${item.stock_actual}`
            }))}
            required
            disabled
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`Cantidad a retirar ${getSelectedProductInfo(editForm.inventario_id)}`}
              type="number"
              step="0.01"
              min="0"
              value={editForm.cantidad}
              onChange={(e) => setEditForm({ ...editForm, cantidad: e.target.value })}
              placeholder="0.00"
              required
            />

            <Select
              label="Tipo de Destino"
              value={editForm.tipo_destino}
              onChange={(e) => setEditForm({ ...editForm, tipo_destino: e.target.value })}
              options={tiposDestino}
              required
            />
          </div>

          <Input
            label="Descripción del Destino"
            value={editForm.descripcion_destino}
            onChange={(e) => setEditForm({ ...editForm, descripcion_destino: e.target.value })}
            placeholder="Ej: Familia Pérez, Comedor Los Niños"
            required
          />

          <Input
            label="Responsable"
            value={editForm.responsable}
            onChange={(e) => setEditForm({ ...editForm, responsable: e.target.value })}
            placeholder="Persona que retira o autoriza"
          />

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
                <span className="flex items-center justify-center">
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

export default Salidas;