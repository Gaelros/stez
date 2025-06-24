const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas - Cambiado a la base de datos sistema_recoleccion
const MONGO_URI = 'mongodb+srv://gael:123@cluster0.uhjhz44.mongodb.net/sistema_recoleccion?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas (sistema_recoleccion)'))
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err);
    if (err.code === 'ETIMEDOUT') {
      console.log('Error de conexión: Verifica tu internet o configuración de red');
    }
  });

// Modelos para la problemática C: Optimización logística
const ZonaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  codigo: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['comercial', 'residencial', 'academico', 'mixto'], required: true },
  poblacion: { type: Number, required: true },
  estado: { type: String, enum: ['activa', 'inactiva'], default: 'activa' }
}, { timestamps: true });

const RutaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  zona_codigo: { type: String, required: true },
  zona_nombre: { type: String, required: true },
  dia: { type: String, enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'], required: true },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  vehiculo: { type: String, required: true },
  conductor: { type: String, required: true },
  estado: { type: String, enum: ['activa', 'inactiva', 'en mantenimiento'], default: 'activa' },
  distancia_km: { type: Number, required: true }
}, { timestamps: true });

const ParticipacionSchema = new mongoose.Schema({
  zona_codigo: { type: String, required: true },
  zona_nombre: { type: String, required: true },
  fecha: { type: Date, required: true },
  mes: { type: Number, required: true },
  año: { type: Number, required: true },
  puntos_visitados: { type: Number, required: true },
  puntos_con_residuos: { type: Number, required: true },
  porcentaje_participacion: { type: Number, required: true },
  nivel: { type: String, enum: ['alta', 'media', 'baja'], required: true },
  volumen_kg: { type: Number, required: true }
}, { timestamps: true });

const CampaniaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  zona_codigo: { type: String, required: true },
  zona_nombre: { type: String, required: true },
  fecha_inicio: { type: Date, required: true },
  fecha_fin: { type: Date, required: true },
  presupuesto: { type: Number, required: true },
  estado: { type: String, enum: ['planificada', 'en curso', 'completada', 'cancelada'], default: 'planificada' },
  objetivo: { type: String, required: true }
}, { timestamps: true });

// Crear modelos
const Zona = mongoose.model('Zona', ZonaSchema, 'zonas');
const Ruta = mongoose.model('Ruta', RutaSchema, 'rutas');
const Participacion = mongoose.model('Participacion', ParticipacionSchema, 'participacion');
const Campania = mongoose.model('Campania', CampaniaSchema, 'campanias');

// ===== RUTAS PARA ZONAS =====
app.get('/api/zonas', async (req, res) => {
  try {
    const zonas = await Zona.find().sort({ codigo: 1 });
    res.json(zonas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/zonas', async (req, res) => {
  try {
    if (!req.body.nombre || !req.body.codigo || !req.body.tipo || !req.body.poblacion) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    
    const zona = new Zona(req.body);
    await zona.save();
    res.status(201).json(zona);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== RUTAS PARA RUTAS DE RECOLECCIÓN =====
app.get('/api/rutas', async (req, res) => {
  try {
    const rutas = await Ruta.find().sort({ dia: 1, hora_inicio: 1 });
    res.json(rutas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rutas', async (req, res) => {
  try {
    const requiredFields = ['nombre', 'zona_codigo', 'zona_nombre', 'dia', 'hora_inicio', 'hora_fin', 'vehiculo', 'conductor', 'distancia_km'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios', 
        campos_faltantes: missingFields 
      });
    }
    
    const ruta = new Ruta(req.body);
    await ruta.save();
    res.status(201).json(ruta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===== RUTAS PARA PARTICIPACIÓN =====
app.get('/api/participacion', async (req, res) => {
  try {
    const { zona, fecha, nivel } = req.query;
    const query = {};
    
    if (zona) query.zona_codigo = zona;
    if (fecha) query.fecha = new Date(fecha);
    if (nivel) query.nivel = nivel;
    
    const participacion = await Participacion.find(query)
      .sort({ fecha: -1, zona_codigo: 1 });
    
    res.json(participacion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== RUTAS PARA CAMPAÑAS =====
app.get('/api/campanias', async (req, res) => {
  try {
    const { estado, zona } = req.query;
    const query = {};
    
    if (estado) query.estado = estado;
    if (zona) query.zona_codigo = zona;
    
    const campanias = await Campania.find(query)
      .sort({ fecha_inicio: -1 });
    
    res.json(campanias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campanias', async (req, res) => {
  try {
    const requiredFields = ['nombre', 'descripcion', 'zona_codigo', 'zona_nombre', 'fecha_inicio', 'fecha_fin', 'presupuesto', 'objetivo'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios', 
        campos_faltantes: missingFields 
      });
    }
    
    const campania = new Campania(req.body);
    await campania.save();
    res.status(201).json(campania);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Ruta para obtener estadísticas de optimización
app.get('/api/estadisticas', async (req, res) => {
  try {
    // 1. Participación por zona
    const participacionPorZona = await Participacion.aggregate([
      {
        $group: {
          _id: "$zona_codigo",
          zona_nombre: { $first: "$zona_nombre" },
          promedio_participacion: { $avg: "$porcentaje_participacion" },
          total_volumen: { $sum: "$volumen_kg" },
          conteo_registros: { $sum: 1 }
        }
      },
      { $sort: { promedio_participacion: -1 } }
    ]);

    // 2. Eficiencia de rutas
    const eficienciaRutas = await Ruta.aggregate([
      {
        $lookup: {
          from: "participacion",
          localField: "zona_codigo",
          foreignField: "zona_codigo",
          as: "datos_participacion"
        }
      },
      {
        $addFields: {
          participacion_promedio: {
            $avg: "$datos_participacion.porcentaje_participacion"
          }
        }
      },
      {
        $project: {
          nombre: 1,
          zona_codigo: 1,
          zona_nombre: 1,
          dia: 1,
          hora_inicio: 1,
          hora_fin: 1,
          distancia_km: 1,
          participacion_promedio: 1,
          eficiencia: {
            $cond: [
              { $eq: ["$distancia_km", 0] },
              0,
              { $divide: ["$participacion_promedio", "$distancia_km"] }
            ]
          }
        }
      },
      { $sort: { eficiencia: -1 } }
    ]);

    // 3. Campañas activas
   // 3. Campañas activas
const campaniasActivas = await Campania.find({ estado: { $in: ['planificada', 'en curso'] } })
  .sort({ fecha_inicio: 1 });
    res.json({
      participacionPorZona,
      eficienciaRutas,
      campaniasActivas
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});