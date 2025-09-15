# Sistema de Control de Almacén - Casa del Sol

Sistema web para gestión de inventario de alimentos desarrollado con React.js, Tailwind CSS y Supabase.

## 🚀 Características

- **Dashboard**: Resumen por categorías con estadísticas generales
- **Inventario**: Visualización completa con filtros por estado de caducidad y búsqueda
- **Productos**: CRUD completo para productos y categorías
- **Donantes**: Gestión de donantes con información de contacto
- **Entradas**: Registro de donaciones con actualización automática de inventario
- **Salidas**: Registro de entregas con validación de stock disponible
- **Exportación**: Funcionalidad para exportar inventario a CSV
- **Alertas**: Sistema de notificaciones para productos próximos a caducar

## 🛠️ Tecnologías

- **Frontend**: React.js 18 + Vite
- **Estilos**: Tailwind CSS
- **Base de datos**: PostgreSQL (Supabase)
- **Routing**: React Router DOM
- **Estado**: React Hooks

## 📋 Requisitos previos

- Node.js 16+ 
- Cuenta de Supabase
- Base de datos PostgreSQL configurada con el esquema proporcionado

## ⚙️ Configuración

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL del archivo `supabase.md` en el SQL Editor de Supabase
3. Copia las credenciales de tu proyecto

### 3. Variables de entorno

Copia el archivo de ejemplo y configura tus credenciales:

```bash
cp .env.example .env
```

Edita `.env` y agrega tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

### 4. Ejecutar la aplicación

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview
```

## 📊 Estructura de la base de datos

El sistema utiliza las siguientes tablas principales:

- **categorias**: Clasificación de productos
- **donantes**: Información de donantes
- **productos**: Catálogo de productos
- **inventario**: Stock actual por lote
- **entradas**: Registro de donaciones
- **salidas**: Registro de entregas

### Vistas importantes:

- `vista_inventario_actual`: Inventario con alertas de caducidad
- `vista_resumen_categoria`: Resumen por categoría
- `vista_proximos_caducar`: Productos próximos a vencer

### Funciones:

- `registrar_entrada()`: Registra donaciones y actualiza inventario
- `obtener_stock_producto()`: Consulta stock disponible

## 🎯 Uso del sistema

### Dashboard
- Visualiza resumen por categorías
- Muestra productos próximos a caducar
- Estadísticas generales del inventario

### Gestión de Productos
- Crear/editar/eliminar productos
- Gestionar categorías
- Configurar unidades de medida
- Marcar productos que requieren refrigeración

### Gestión de Donantes
- Registrar donantes (empresas, instituciones, particulares, gobierno)
- Mantener información de contacto
- Historial de donaciones

### Registro de Entradas
- Formulario para registrar donaciones
- Selección de producto y donante
- Especificación de cantidad, lote y fecha de caducidad
- Actualización automática del inventario

### Registro de Salidas
- Formulario para registrar entregas
- Validación de stock disponible
- Especificación de destino y tipo
- Actualización automática del inventario

### Inventario
- Vista completa del stock actual
- Filtros por estado de caducidad
- Búsqueda por producto, categoría o donante
- Exportación a CSV
- Alertas visuales por estado

## 🔧 Personalización

### Agregar nuevas unidades de medida

Edita `src/pages/Products.jsx` y modifica el array `unidadesMedida`:

```javascript
const unidadesMedida = [
  { value: 'kg', label: 'Kilogramos' },
  { value: 'litros', label: 'Litros' },
  // Agregar nuevas unidades aquí
];
```

### Modificar tipos de destino

Edita `src/pages/Salidas.jsx` y modifica el array `tiposDestino`:

```javascript
const tiposDestino = [
  { value: 'familia', label: 'Familia' },
  { value: 'comedor', label: 'Comedor' },
  // Agregar nuevos tipos aquí
];
```

## 🚨 Solución de problemas

### Error de conexión a Supabase
- Verifica que las variables de entorno estén correctamente configuradas
- Confirma que el proyecto de Supabase esté activo
- Revisa que las políticas RLS estén configuradas correctamente

### Problemas con el esquema de base de datos
- Asegúrate de haber ejecutado todo el script SQL de `supabase.md`
- Verifica que todas las tablas, vistas y funciones estén creadas
- Confirma que los triggers estén activos

### Errores de permisos
- Revisa las políticas de Row Level Security en Supabase
- Confirma que la clave anónima tenga los permisos necesarios

## 📝 Licencia

Este proyecto está desarrollado para Casa del Sol como sistema interno de gestión de almacén.

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, contacta al equipo de desarrollo.