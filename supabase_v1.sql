-- =====================================================
-- SISTEMA DE CONTROL DE ALMACÉN - CASA DEL SOL
-- PostgreSQL para Supabase (Versión Corregida)
-- =====================================================

-- 1. TABLA DE CATEGORÍAS
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE DONANTES
CREATE TABLE donantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('empresa', 'institucion', 'particular', 'gobierno')),
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE PRODUCTOS (CATÁLOGO)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('kg', 'litros', 'piezas', 'cajas', 'latas')),
    descripcion TEXT,
    requiere_refrigeracion BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE INVENTARIO GENERAL
CREATE TABLE inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id),
    lote VARCHAR(100),
    stock_inicial DECIMAL(10,2) DEFAULT 0,
    stock_actual DECIMAL(10,2) DEFAULT 0,
    fecha_caducidad DATE,
    donante_id INTEGER REFERENCES donantes(id),
    ubicacion_estante VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE ENTRADAS (DONACIONES)
CREATE TABLE entradas (
    id SERIAL PRIMARY KEY,
    fecha_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    producto_id INTEGER REFERENCES productos(id),
    inventario_id INTEGER REFERENCES inventario(id),
    cantidad DECIMAL(10,2) NOT NULL,
    donante_id INTEGER REFERENCES donantes(id),
    fecha_caducidad DATE,
    lote VARCHAR(100),
    responsable VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE SALIDAS (ENTREGAS)
CREATE TABLE salidas (
    id SERIAL PRIMARY KEY,
    fecha_salida DATE NOT NULL DEFAULT CURRENT_DATE,
    inventario_id INTEGER REFERENCES inventario(id),
    cantidad DECIMAL(10,2) NOT NULL,
    tipo_destino VARCHAR(50) CHECK (tipo_destino IN ('familia', 'comedor', 'institucion', 'evento', 'otro')),
    descripcion_destino VARCHAR(200) NOT NULL,
    responsable VARCHAR(100),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCIONES PARA TRIGGERS
-- =====================================================

-- Función para actualizar stock después de entradas
CREATE OR REPLACE FUNCTION actualizar_stock_entrada()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventario
    SET stock_actual = stock_actual + NEW.cantidad,
        updated_at = NOW()
    WHERE id = NEW.inventario_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para revertir stock cuando una entrada es eliminada
CREATE OR REPLACE FUNCTION revertir_stock_entrada_anulada()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventario
    SET stock_actual = stock_actual - OLD.cantidad,
        updated_at = NOW()
    WHERE id = OLD.inventario_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar stock después de salidas
CREATE OR REPLACE FUNCTION actualizar_stock_salida()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventario
    SET stock_actual = stock_actual - NEW.cantidad,
        updated_at = NOW()
    WHERE id = NEW.inventario_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para revertir stock cuando una salida es eliminada
CREATE OR REPLACE FUNCTION revertir_stock_salida_anulada()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventario
    SET stock_actual = stock_actual + OLD.cantidad,
        updated_at = NOW()
    WHERE id = OLD.inventario_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_entrada_stock ON entradas;
DROP TRIGGER IF EXISTS trigger_entrada_anulada_stock ON entradas;
DROP TRIGGER IF EXISTS trigger_salida_stock ON salidas;
DROP TRIGGER IF EXISTS trigger_salida_anulada_stock ON salidas;

-- Create triggers
CREATE TRIGGER trigger_entrada_stock
    AFTER INSERT ON entradas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_entrada();

CREATE TRIGGER trigger_entrada_anulada_stock
    AFTER DELETE ON entradas
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_entrada_anulada();

CREATE TRIGGER trigger_salida_stock
    AFTER INSERT ON salidas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_salida();

CREATE TRIGGER trigger_salida_anulada_stock
    AFTER DELETE ON salidas
    FOR EACH ROW
    EXECUTE FUNCTION revertir_stock_salida_anulada();

-- =====================================================
-- VISTAS ÚTILES PARA REPORTES
-- =====================================================

-- Vista: Inventario actual con alertas de caducidad
CREATE OR REPLACE VIEW vista_inventario_actual AS
SELECT 
    i.id AS inventario_id,
    p.codigo,
        p.nombre as producto,
    c.nombre as categoria,
    i.stock_actual,
    p.unidad_medida,
    i.fecha_caducidad,
    d.nombre as donante,
    i.ubicacion_estante,
    CASE 
        WHEN i.fecha_caducidad < CURRENT_DATE THEN '❌ Caducado'
        WHEN i.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' THEN '⚠️ Próximo a vencer'
        WHEN i.fecha_caducidad <= CURRENT_DATE + INTERVAL '60 days' THEN '🟡 Revisar pronto'
        ELSE '✅ OK'
    END as estado_caducidad,
    i.fecha_caducidad - CURRENT_DATE as dias_restantes,
    i.observaciones,
    i.updated_at
FROM inventario i
JOIN productos p ON i.producto_id = p.id
JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN donantes d ON i.donante_id = d.id
WHERE i.stock_actual > 0
ORDER BY i.fecha_caducidad ASC;

-- Vista: Productos próximos a caducar (menos de 30 días)
CREATE OR REPLACE VIEW vista_proximos_caducar AS
SELECT *
FROM vista_inventario_actual
WHERE fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days'
AND fecha_caducidad >= CURRENT_DATE
ORDER BY fecha_caducidad ASC;

-- Vista: Resumen por categoría
CREATE OR REPLACE VIEW vista_resumen_categoria AS
SELECT 
    c.nombre as categoria,
    COUNT(DISTINCT i.producto_id) as productos_diferentes,
    SUM(i.stock_actual) as stock_total,
    COUNT(CASE WHEN i.fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as proximos_caducar
FROM inventario i
JOIN productos p ON i.producto_id = p.id
JOIN categorias c ON p.categoria_id = c.id
WHERE i.stock_actual > 0
GROUP BY c.id, c.nombre
ORDER BY stock_total DESC;

-- Vista: Histórico de donaciones por donante
CREATE OR REPLACE VIEW vista_donaciones_donante AS
SELECT 
    d.nombre as donante,
    d.tipo,
    COUNT(e.id) as total_donaciones,
    SUM(e.cantidad) as cantidad_total,
    MIN(e.fecha_ingreso) as primera_donacion,
    MAX(e.fecha_ingreso) as ultima_donacion
FROM donantes d
LEFT JOIN entradas e ON d.id = e.donante_id
GROUP BY d.id, d.nombre, d.tipo
ORDER BY cantidad_total DESC NULLS LAST;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener stock disponible de un producto
CREATE OR REPLACE FUNCTION obtener_stock_producto(producto_nombre VARCHAR)
RETURNS TABLE(
    producto VARCHAR,
    stock_total DECIMAL,
    unidad VARCHAR,
    lotes_disponibles BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.nombre::VARCHAR,
        SUM(i.stock_actual)::DECIMAL,
        p.unidad_medida::VARCHAR,
        COUNT(i.id)::BIGINT
    FROM productos p
    JOIN inventario i ON p.id = i.producto_id
    WHERE p.nombre ILIKE '%' || producto_nombre || '%'
    AND i.stock_actual > 0
    GROUP BY p.nombre, p.unidad_medida;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar nueva entrada
CREATE OR REPLACE FUNCTION registrar_entrada(
    p_producto_id INTEGER,
    p_cantidad DECIMAL,
    p_donante_id INTEGER,
    p_fecha_caducidad DATE,
    p_lote VARCHAR DEFAULT NULL,
    p_responsable VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_inventario_id INTEGER;
    v_entrada_id INTEGER;
BEGIN
    -- Crear o encontrar registro en inventario
    INSERT INTO inventario (producto_id, stock_inicial, stock_actual, fecha_caducidad, donante_id, lote)
    VALUES (p_producto_id, p_cantidad, 0, p_fecha_caducidad, p_donante_id, p_lote)
    RETURNING id INTO v_inventario_id;
    
    -- Registrar la entrada
    INSERT INTO entradas (producto_id, inventario_id, cantidad, donante_id, fecha_caducidad, lote, responsable)
    VALUES (p_producto_id, v_inventario_id, p_cantidad, p_donante_id, p_fecha_caducidad, p_lote, p_responsable)
    RETURNING id INTO v_entrada_id;
    
    RETURN v_entrada_id;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar una entrada y ajustar stock
CREATE OR REPLACE FUNCTION actualizar_entrada(
    p_entrada_id INTEGER,
    p_producto_id INTEGER,
    p_cantidad DECIMAL,
    p_donante_id INTEGER,
    p_fecha_caducidad DATE,
    p_lote VARCHAR,
    p_responsable VARCHAR
)
RETURNS VOID AS $$
DECLARE
    v_entrada_antigua entradas%ROWTYPE;
    v_diferencia_cantidad DECIMAL;
    v_stock_actual_inventario DECIMAL;
BEGIN
    -- Get the old entry record for calculations
    SELECT * INTO v_entrada_antigua FROM entradas WHERE id = p_entrada_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entrada con ID % no encontrada', p_entrada_id;
    END IF;

    -- Calculate the difference in quantity
    v_diferencia_cantidad := p_cantidad - v_entrada_antigua.cantidad;

    -- Check if the stock adjustment is valid
    SELECT stock_actual INTO v_stock_actual_inventario FROM inventario WHERE id = v_entrada_antigua.inventario_id;
    
    IF (v_stock_actual_inventario + v_diferencia_cantidad) < 0 THEN
        RAISE EXCEPTION 'La edición resultaría en stock negativo. Stock actual: %, ajuste solicitado: %', v_stock_actual_inventario, v_diferencia_cantidad;
    END IF;

    -- Update the inventory with the difference
    UPDATE inventario
    SET stock_actual = stock_actual + v_diferencia_cantidad,
        updated_at = NOW()
    WHERE id = v_entrada_antigua.inventario_id;

    -- Update the entry itself
    UPDATE entradas
    SET 
        producto_id = p_producto_id,
        cantidad = p_cantidad,
        donante_id = p_donante_id,
        fecha_caducidad = p_fecha_caducidad,
        lote = p_lote,
        responsable = p_responsable,
        observaciones = 'Editado el ' || CURRENT_DATE::TEXT
    WHERE id = p_entrada_id;

END;
$$ LANGUAGE plpgsql;

-- Función para actualizar una salida y ajustar stock
CREATE OR REPLACE FUNCTION actualizar_salida(
    p_salida_id INTEGER,
    p_inventario_id INTEGER,
    p_cantidad DECIMAL,
    p_tipo_destino VARCHAR,
    p_descripcion_destino VARCHAR,
    p_responsable VARCHAR
)
RETURNS VOID AS $$
DECLARE
    v_salida_antigua salidas%ROWTYPE;
    v_diferencia_cantidad DECIMAL;
    v_stock_actual_inventario DECIMAL;
BEGIN
    -- Get the old salida record for calculations
    SELECT * INTO v_salida_antigua FROM salidas WHERE id = p_salida_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Salida con ID % no encontrada', p_salida_id;
    END IF;

    -- Calculate the difference in quantity
    v_diferencia_cantidad := p_cantidad - v_salida_antigua.cantidad;

    -- Check if the stock adjustment is valid
    SELECT stock_actual INTO v_stock_actual_inventario FROM inventario WHERE id = v_salida_antigua.inventario_id;
    
    IF (v_stock_actual_inventario - v_diferencia_cantidad) < 0 THEN
        RAISE EXCEPTION 'La edición resultaría en stock negativo. Stock actual: %, ajuste solicitado: %', v_stock_actual_inventario, v_diferencia_cantidad;
    END IF;

    -- Update the inventory with the difference
    -- If the new quantity is larger, the difference is positive, and we subtract more stock.
    -- If the new quantity is smaller, the difference is negative, and we add stock back.
    UPDATE inventario
    SET stock_actual = stock_actual - v_diferencia_cantidad,
        updated_at = NOW()
    WHERE id = v_salida_antigua.inventario_id;

    -- Update the salida itself
    UPDATE salidas
    SET 
        inventario_id = p_inventario_id,
        cantidad = p_cantidad,
        tipo_destino = p_tipo_destino,
        descripcion_destino = p_descripcion_destino,
        responsable = p_responsable
    WHERE id = p_salida_id;

END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICA RLS (Row Level Security) - OPCIONAL
-- =====================================================

-- Si necesitas Row Level Security, descomenta las siguientes líneas:

-- ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE donantes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE salidas ENABLE ROW LEVEL SECURITY;

-- Ejemplo de política básica (permite todo a usuarios autenticados):
-- CREATE POLICY "Allow all operations for authenticated users" ON categorias FOR ALL TO authenticated USING (true);

-- =====================================================
-- DATOS INICIALES (EJEMPLOS)
-- =====================================================

-- Categorías básicas
INSERT INTO categorias (nombre, descripcion) VALUES
('Granos y Cereales', 'Arroz, frijol, lentejas, avena, etc.'),
('Enlatados', 'Conservas, atún, sardinas, vegetales enlatados'),
('Aceites y Condimentos', 'Aceite, vinagre, sal, especias'),
('Lácteos', 'Leche, queso, yogurt (requieren refrigeración)'),
('Frescos', 'Frutas y verduras frescas'),
('Panadería', 'Pan, tortillas, galletas'),
('Bebidas', 'Jugos, refrescos, agua embotellada');

-- Donantes ejemplo
INSERT INTO donantes (nombre, tipo, contacto) VALUES
('Walmart México', 'empresa', 'donaciones@walmart.com.mx'),
('Banco de Alimentos', 'institucion', 'contacto@bancodealimentos.org'),
('Familia González', 'particular', 'familia.gonzalez@email.com'),
('DIF Municipal', 'gobierno', 'dif@municipio.gob.mx');

-- Productos básicos
INSERT INTO productos (codigo, nombre, categoria_id, unidad_medida) VALUES
('ARR001', 'Arroz blanco', 1, 'kg'),
('FRJ001', 'Frijol negro', 1, 'kg'),
('ACE001', 'Aceite vegetal', 3, 'litros'),
('ATN001', 'Atún en lata', 2, 'latas'),
('LEC001', 'Leche entera', 4, 'litros'),
('PAN001', 'Pan de caja', 6, 'piezas');

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

-- Índices para mejorar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_inventario_producto_id ON inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_inventario_fecha_caducidad ON inventario(fecha_caducidad);
CREATE INDEX IF NOT EXISTS idx_inventario_stock_actual ON inventario(stock_actual);
CREATE INDEX IF NOT EXISTS idx_entradas_fecha_ingreso ON entradas(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_salidas_fecha_salida ON salidas(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id); 