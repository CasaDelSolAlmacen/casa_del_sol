import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';

function Donantes() {
  const [donantes, setDonantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonante, setEditingDonante] = useState(null);
  const [notification, setNotification] = useState('');

  const [donanteForm, setDonanteForm] = useState({
    nombre: '',
    tipo: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  const tiposDonante = [
    { value: 'empresa', label: 'Empresa' },
    { value: 'institucion', label: 'Institución' },
    { value: 'particular', label: 'Particular' },
    { value: 'gobierno', label: 'Gobierno' }
  ];

  useEffect(() => {
    fetchDonantes();
  }, []);

  const fetchDonantes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('donantes')
      .select('*')
      .order('nombre');

    if (!error) {
      setDonantes(data || []);
    }
    setLoading(false);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingDonante) {
        const { error } = await supabase
          .from('donantes')
          .update(donanteForm)
          .eq('id', editingDonante.id);

        if (error) throw error;
        showNotification('Donante actualizado exitosamente');
      } else {
        const { error } = await supabase
          .from('donantes')
          .insert([donanteForm]);

        if (error) throw error;
        showNotification('Donante creado exitosamente');
      }

      setIsModalOpen(false);
      setEditingDonante(null);
      setDonanteForm({
        nombre: '',
        tipo: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: ''
      });
      fetchDonantes();
    } catch (error) {
      showNotification('Error: ' + error.message);
    }
  };

  const handleEdit = (donante) => {
    setEditingDonante(donante);
    setDonanteForm({
      nombre: donante.nombre || '',
      tipo: donante.tipo || '',
      contacto: donante.contacto || '',
      telefono: donante.telefono || '',
      email: donante.email || '',
      direccion: donante.direccion || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este donante?')) {
      try {
        const { error } = await supabase
          .from('donantes')
          .delete()
          .eq('id', id);

        if (error) throw error;
        showNotification('Donante eliminado exitosamente');
        fetchDonantes();
      } catch (error) {
        showNotification('Error: ' + error.message);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDonante(null);
    setDonanteForm({
      nombre: '',
      tipo: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'empresa':
        return '🏢';
      case 'institucion':
        return '🏛️';
      case 'particular':
        return '👤';
      case 'gobierno':
        return '🏛️';
      default:
        return '🤝';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'empresa':
        return 'bg-blue-100 text-blue-800';
      case 'institucion':
        return 'bg-purple-100 text-purple-800';
      case 'particular':
        return 'bg-green-100 text-green-800';
      case 'gobierno':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">🤝</span>
            Donantes
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gestiona la información de los donantes ({donantes.length} registrados)
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <span className="hidden sm:inline">Nuevo Donante</span>
          <span className="sm:hidden">➕ Nuevo Donante</span>
        </Button>
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
          <span className="ml-3 text-gray-600">Cargando donantes...</span>
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
                      Donante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Información
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donantes.map((donante) => (
                    <tr key={donante.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{donante.nombre}</div>
                        {donante.direccion && (
                          <div className="text-sm text-gray-500">{donante.direccion}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(donante.tipo)}`}>
                          <span className="mr-1">{getTipoIcon(donante.tipo)}</span>
                          {tiposDonante.find(t => t.value === donante.tipo)?.label || donante.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {donante.contacto || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          {donante.telefono && (
                            <div className="flex items-center">
                              <span className="mr-1">📞</span>
                              {donante.telefono}
                            </div>
                          )}
                          {donante.email && (
                            <div className="flex items-center">
                              <span className="mr-1">📧</span>
                              {donante.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(donante)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(donante.id)}
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

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-4">
            {donantes.map((donante) => (
              <div key={donante.id} className="bg-white rounded-lg shadow-sm border p-4">
                {/* Donor Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">{donante.nombre}</h3>
                    {donante.contacto && (
                      <p className="text-sm text-gray-600 mt-1">Contacto: {donante.contacto}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(donante.tipo)} ml-2`}>
                    <span className="mr-1">{getTipoIcon(donante.tipo)}</span>
                    {tiposDonante.find(t => t.value === donante.tipo)?.label || donante.tipo}
                  </span>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  {donante.telefono && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="mr-2">📞</span>
                      <a href={`tel:${donante.telefono}`} className="hover:text-blue-600">
                        {donante.telefono}
                      </a>
                    </div>
                  )}
                  {donante.email && (
                    <div className="flex items-center text-sm text-gray-700">
                      <span className="mr-2">📧</span>
                      <a href={`mailto:${donante.email}`} className="hover:text-blue-600">
                        {donante.email}
                      </a>
                    </div>
                  )}
                  {donante.direccion && (
                    <div className="flex items-start text-sm text-gray-700">
                      <span className="mr-2 mt-0.5">📍</span>
                      <span>{donante.direccion}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(donante)}
                    className="flex-1"
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(donante.id)}
                    className="flex-1"
                  >
                    🗑️ Eliminar
                  </Button>
                </div>
              </div>
            ))}

            {donantes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <div className="text-gray-400 text-4xl mb-4">🤝</div>
                <p className="text-gray-500 text-lg font-medium">No hay donantes registrados</p>
                <p className="text-gray-400 text-sm mt-1">Registra tu primer donante usando el botón de arriba</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDonante ? 'Editar Donante' : 'Nuevo Donante'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={donanteForm.nombre}
            onChange={(e) => setDonanteForm({ ...donanteForm, nombre: e.target.value })}
            placeholder="Nombre del donante"
            required
          />

          <Select
            label="Tipo"
            value={donanteForm.tipo}
            onChange={(e) => setDonanteForm({ ...donanteForm, tipo: e.target.value })}
            options={tiposDonante}
            required
          />

          <Input
            label="Contacto"
            value={donanteForm.contacto}
            onChange={(e) => setDonanteForm({ ...donanteForm, contacto: e.target.value })}
            placeholder="Persona de contacto"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              value={donanteForm.telefono}
              onChange={(e) => setDonanteForm({ ...donanteForm, telefono: e.target.value })}
              placeholder="Número de teléfono"
            />

            <Input
              label="Email"
              type="email"
              value={donanteForm.email}
              onChange={(e) => setDonanteForm({ ...donanteForm, email: e.target.value })}
              placeholder="Correo electrónico"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              value={donanteForm.direccion}
              onChange={(e) => setDonanteForm({ ...donanteForm, direccion: e.target.value })}
              placeholder="Dirección completa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingDonante ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Donantes;
