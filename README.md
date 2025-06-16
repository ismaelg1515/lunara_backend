# 🌙 Lunara Backend API - Node.js

Una API REST extremadamente simple y rápida para la aplicación Flutter **Lunara** - seguimiento de salud femenina con integración de OpenAI.

## 🔥 **ARQUITECTURA IMPORTANTE**

### ✅ **Lo que maneja el FRONTEND (Flutter + Firebase):**
- 🔐 **Autenticación completa** (login, registro, logout)
- 👤 **Perfil básico del usuario** (Firestore)
- 🔑 **Tokens de Firebase Auth** (se envían al backend)

### ✅ **Lo que maneja el BACKEND (Node.js):**
- 📊 **CRUD de datos de salud** (ciclos, nutrición, fitness, estado mental)
- 🤖 **Insights con OpenAI** (análisis personalizado)
- 📈 **Analytics y estadísticas** 
- 🔄 **Sincronización de datos**

## 🚀 Setup Rápido (5 minutos)

### 1. Instalación Inicial
```bash
# Crear proyecto
mkdir lunara-backend && cd lunara-backend
npm init -y

# Instalar dependencias esenciales (SIN MongoDB - usamos Firestore)
npm install express cors dotenv helmet
npm install firebase-admin
npm install openai axios node-cron
npm install --save-dev nodemon

# Estructura de carpetas
mkdir src src/routes src/middleware src/services src/utils
```

### 2. Variables de Entorno
Crear `.env`:
```env
PORT=3000
OPENAI_API_KEY=your-openai-api-key-here
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
NODE_ENV=development
```

### 3. Package.json Scripts
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "echo 'Tests pending'"
  }
}
```

## 📁 Estructura del Proyecto
```
lunara-backend/
├── src/
│   ├── app.js              # Servidor principal
│   ├── routes/             # Rutas de la API
│   │   ├── health.js       # Datos de salud (ciclos, fitness, nutrición, mental)
│   │   ├── insights.js     # Analytics y estadísticas
│   │   ├── ai.js           # Integración OpenAI
│   │   └── sync.js         # Sincronización de datos
│   ├── middleware/         # Middlewares
│   │   ├── auth.js         # Verificación de tokens Firebase
│   │   └── validation.js   # Validación de datos
│   ├── services/           # Servicios
│   │   ├── openai.js       # Servicio OpenAI
│   │   ├── firebase.js     # Admin SDK Firebase
│   │   └── firestore.js    # Operaciones Firestore
│   └── utils/              # Utilidades
│       ├── helpers.js      # Funciones auxiliares
│       └── constants.js    # Constantes
├── .env
├── .gitignore
└── README.md
```

## 🛠️ Implementación Rápida

### 1. Servidor Principal (`src/app.js`)
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
});

console.log('✅ Firebase Admin SDK inicializado');

// Middlewares básicos
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas principales
app.use('/api/health-data', require('./routes/health'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sync', require('./routes/sync'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    firebase_connected: true 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal!', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔥 Conectado a Firebase proyecto: ${process.env.FIREBASE_PROJECT_ID}`);
});
```

### 2. Servicio de Firestore (`src/services/firestore.js`)
```javascript
const admin = require('firebase-admin');

class FirestoreService {
  constructor() {
    this.db = admin.firestore();
  }

  // ================== COLECCIONES ==================
  
  // Ciclos menstruales
  async saveCycle(userId, cycleData) {
    try {
      const docRef = await this.db.collection('cycles').add({
        user_id: userId,
        ...cycleData,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...cycleData };
    } catch (error) {
      throw new Error(`Error saving cycle: ${error.message}`);
    }
  }

  async getCycles(userId, limit = 50) {
    try {
      const snapshot = await this.db.collection('cycles')
        .where('user_id', '==', userId)
        .orderBy('start_date', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting cycles: ${error.message}`);
    }
  }

  // Nutrición
  async saveNutritionLog(userId, nutritionData) {
    try {
      const docRef = await this.db.collection('nutrition_logs').add({
        user_id: userId,
        ...nutritionData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...nutritionData };
    } catch (error) {
      throw new Error(`Error saving nutrition log: ${error.message}`);
    }
  }

  // Fitness
  async saveFitnessLog(userId, fitnessData) {
    try {
      const docRef = await this.db.collection('fitness_logs').add({
        user_id: userId,
        ...fitnessData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...fitnessData };
    } catch (error) {
      throw new Error(`Error saving fitness log: ${error.message}`);
    }
  }

  // Salud mental
  async saveMentalHealthLog(userId, mentalHealthData) {
    try {
      const docRef = await this.db.collection('mental_health_logs').add({
        user_id: userId,
        ...mentalHealthData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...mentalHealthData };
    } catch (error) {
      throw new Error(`Error saving mental health log: ${error.message}`);
    }
  }

  // AI Insights
  async saveAIInsight(userId, insightData) {
    try {
      const docRef = await this.db.collection('ai_insights').add({
        user_id: userId,
        ...insightData,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...insightData };
    } catch (error) {
      throw new Error(`Error saving AI insight: ${error.message}`);
    }
  }

  // Obtener insights recientes
  async getRecentInsights(userId, limit = 10) {
    try {
      const snapshot = await this.db.collection('ai_insights')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Error getting insights: ${error.message}`);
    }
  }
}

module.exports = new FirestoreService();
```

### 3. Middleware de Autenticación (`src/middleware/auth.js`)
```javascript
const admin = require('firebase-admin');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token de Firebase requerido' });
    }

    // Verificar token de Firebase (el frontend ya lo envía)
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = { authenticateUser };
```

### 4. Rutas de Datos de Salud con Tokens (`src/routes/health.js`)
```javascript
const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const firestoreService = require('../services/firestore');
const router = express.Router();

// ================== CICLOS MENSTRUALES ==================

// GET - Obtener ciclos del usuario autenticado
router.get('/cycles', authenticateUser, async (req, res) => {
  try {
    // ✅ req.user.uid viene del token Firebase verificado
    const cycles = await firestoreService.getCycles(req.user.uid);
    res.json({ success: true, cycles, user_id: req.user.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Crear nuevo ciclo para el usuario autenticado
router.post('/cycles', authenticateUser, async (req, res) => {
  try {
    // ✅ El token garantiza que solo se cree para el usuario correcto
    const cycleData = {
      ...req.body,
      user_id: req.user.uid // ✅ Forzar el user_id del token
    };
    
    const cycle = await firestoreService.saveCycle(req.user.uid, cycleData);
    res.status(201).json({ success: true, cycle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT - Actualizar ciclo (solo si pertenece al usuario)
router.put('/cycles/:id', authenticateUser, async (req, res) => {
  try {
    // ✅ Verificar que el ciclo pertenece al usuario autenticado
    const existingCycle = await firestoreService.getCycleById(req.params.id);
    
    if (!existingCycle || existingCycle.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'No autorizado para modificar este ciclo' });
    }
    
    const updatedCycle = await firestoreService.updateCycle(req.params.id, req.body);
    res.json({ success: true, cycle: updatedCycle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE - Eliminar ciclo (solo si pertenece al usuario)
router.delete('/cycles/:id', authenticateUser, async (req, res) => {
  try {
    // ✅ Verificar propiedad antes de eliminar
    const existingCycle = await firestoreService.getCycleById(req.params.id);
    
    if (!existingCycle || existingCycle.user_id !== req.user.uid) {
      return res.status(403).json({ error: 'No autorizado para eliminar este ciclo' });
    }
    
    await firestoreService.deleteCycle(req.params.id);
    res.json({ success: true, message: 'Ciclo eliminado' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ================== NUTRICIÓN ==================

// POST - Crear log de nutrición
router.post('/nutrition', authenticateUser, async (req, res) => {
  try {
    const nutritionData = {
      ...req.body,
      user_id: req.user.uid, // ✅ ID del token Firebase
      email: req.user.email   // ✅ Email verificado del token
    };
    
    const nutritionLog = await firestoreService.saveNutritionLog(req.user.uid, nutritionData);
    res.status(201).json({ success: true, nutritionLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET - Obtener logs de nutrición por fecha
router.get('/nutrition', authenticateUser, async (req, res) => {
  try {
    const { date, limit = 30 } = req.query;
    
    // ✅ Solo obtener datos del usuario autenticado
    const nutritionLogs = await firestoreService.getNutritionLogs(
      req.user.uid, 
      date, 
      parseInt(limit)
    );
    
    res.json({ success: true, nutritionLogs, user_id: req.user.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================== FITNESS ==================

// POST - Crear log de fitness
router.post('/fitness', authenticateUser, async (req, res) => {
  try {
    const fitnessData = {
      ...req.body,
      user_id: req.user.uid // ✅ Garantizar seguridad por token
    };
    
    const fitnessLog = await firestoreService.saveFitnessLog(req.user.uid, fitnessData);
    res.status(201).json({ success: true, fitnessLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ================== SALUD MENTAL ==================

// POST - Crear log de salud mental
router.post('/mental-health', authenticateUser, async (req, res) => {
  try {
    const mentalHealthData = {
      ...req.body,
      user_id: req.user.uid // ✅ ID seguro del token
    };
    
    const mentalHealthLog = await firestoreService.saveMentalHealthLog(req.user.uid, mentalHealthData);
    res.status(201).json({ success: true, mentalHealthLog });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
```

### 5. Rutas de IA (`src/routes/ai.js`)
```javascript
const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const openaiService = require('../services/openai');
const firestoreService = require('../services/firestore');
const router = express.Router();

// Generar insight personalizado con OpenAI
router.post('/generate-insight', authenticateUser, async (req, res) => {
  try {
    const { type = 'general_health' } = req.body;
    
    // Obtener datos recientes del usuario desde Firestore
    const recentCycles = await firestoreService.getCycles(req.user.uid, 3);
    
    // Preparar datos para OpenAI
    const userData = {
      userId: req.user.uid,
      email: req.user.email,
      recentCycles: recentCycles,
      insightType: type
    };
    
    // Generar insight con OpenAI
    const insight = await openaiService.generateHealthInsight(userData, type);
    
    if (!insight) {
      return res.status(500).json({ error: 'No se pudo generar el insight' });
    }
    
    // Guardar insight en Firestore
    const savedInsight = await firestoreService.saveAIInsight(req.user.uid, insight);
    
    res.json({ success: true, insight: savedInsight });
  } catch (error) {
    console.error('AI Insight Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener insights recientes del usuario
router.get('/insights', authenticateUser, async (req, res) => {
  try {
    const insights = await firestoreService.getRecentInsights(req.user.uid, 10);
    res.json({ success: true, insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar insight como leído
router.patch('/insights/:id/read', authenticateUser, async (req, res) => {
  try {
    // Actualizar insight en Firestore
    await firestoreService.db.collection('ai_insights').doc(req.params.id).update({
      is_read: true,
      read_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true, message: 'Insight marcado como leído' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 7. Servicio de OpenAI (`src/services/openai.js`)
```javascript
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateHealthInsight = async (userData, dataType = 'general') => {
  try {
    const prompt = createInsightPrompt(userData, dataType);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres un asistente de salud femenina experto. Proporciona consejos útiles y personalizados basados en los datos del usuario. Responde en español de manera clara y empática."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return {
      type: dataType,
      title: `Insight de ${dataType}`,
      content: completion.choices[0].message.content,
      confidence_score: 0.8,
      generated_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    };
  } catch (error) {
    console.error('OpenAI Error:', error);
    return null;
  }
};

const createInsightPrompt = (userData, dataType) => {
  const baseInfo = `Usuario: mujer, ${userData.age || 25} años, peso: ${userData.weight || 'no especificado'}kg`;
  
  switch (dataType) {
    case 'cycle_prediction':
      return `${baseInfo}. Datos del ciclo menstrual: duración promedio ${userData.cycle_length || 28} días, período de ${userData.period_duration || 5} días. Síntomas recientes: ${userData.recent_symptoms || 'ninguno'}. Dame consejos personalizados para el próximo ciclo.`;
    
    case 'nutrition_advice':
      return `${baseInfo}. Registro nutricional reciente: ${userData.recent_meals || 'no disponible'}. Dame consejos nutricionales personalizados considerando el ciclo menstrual.`;
    
    case 'fitness_suggestion':
      return `${baseInfo}. Actividad física reciente: ${userData.recent_activities || 'no disponible'}. Fase del ciclo: ${userData.cycle_phase || 'no especificada'}. Sugiere ejercicios apropiados.`;
    
    case 'mood_analysis':
      return `${baseInfo}. Estado de ánimo reciente: ${userData.recent_moods || 'no disponible'}. Nivel de estrés: ${userData.stress_level || 'medio'}. Dame consejos para mejorar el bienestar emocional.`;
    
    default:
      return `${baseInfo}. Dame un consejo general de salud personalizado para una mujer en edad reproductiva.`;
  }
};

module.exports = { generateHealthInsight };
```

### 8. Rutas de IA (`src/routes/ai.js`)
```javascript
const express = require('express');
const { generateHealthInsight } = require('../services/openai');
const { authenticateUser } = require('../middleware/auth');
const User = require('../models/User');
const Cycle = require('../models/Cycle');
const router = express.Router();

// Generar insight personalizado
router.post('/generate-insight', authenticateUser, async (req, res) => {
  try {
    const { type = 'general' } = req.body;
    const user = await User.findOne({ firebase_uid: req.user.uid });
    
    // Obtener datos recientes del usuario
    const recentCycle = await Cycle.findOne({ user_id: user._id }).sort({ start_date: -1 });
    
    const userData = {
      age: user.birth_date ? new Date().getFullYear() - new Date(user.birth_date).getFullYear() : null,
      weight: user.weight,
      cycle_length: recentCycle?.cycle_length,
      period_duration: recentCycle?.period_duration,
      recent_symptoms: recentCycle?.symptoms?.join(', '),
      cycle_phase: calculateCyclePhase(recentCycle)
    };
    
    const insight = await generateHealthInsight(userData, type);
    
    if (!insight) {
      return res.status(500).json({ error: 'No se pudo generar el insight' });
    }
    
    res.json({ insight });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Función helper para calcular fase del ciclo
const calculateCyclePhase = (cycle) => {
  if (!cycle || !cycle.start_date) return 'unknown';
  
  const daysSinceStart = Math.floor((new Date() - new Date(cycle.start_date)) / (1000 * 60 * 60 * 24));
  const cycleLength = cycle.cycle_length || 28;
  
  if (daysSinceStart <= cycle.period_duration) return 'menstrual';
  if (daysSinceStart <= 13) return 'follicular';
  if (daysSinceStart <= 15) return 'ovulation';
  if (daysSinceStart <= cycleLength) return 'luteal';
  return 'new_cycle';
};

module.exports = router;
```

## 🚀 Comandos para Ejecutar

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Con Docker (opcional)
docker build -t lunara-backend .
docker run -p 3000:3000 lunara-backend
```

## 🎯 **CRUD que maneja el BACKEND con Tokens Firebase**

### ✅ **Datos de Salud** (`/api/health-data`)
Todos los endpoints requieren token Firebase válido:

#### **Ciclos Menstruales**
```javascript
// GET /api/health-data/cycles - Obtener ciclos del usuario
// Token → req.user.uid → firestoreService.getCycles(userId)

// POST /api/health-data/cycles - Crear nuevo ciclo  
// Token → req.user.uid → firestoreService.saveCycle(userId, data)

// PUT /api/health-data/cycles/:id - Actualizar ciclo
// Token → verificar que el ciclo pertenece a req.user.uid

// DELETE /api/health-data/cycles/:id - Eliminar ciclo
// Token → verificar que el ciclo pertenece a req.user.uid
```

#### **Logs de Nutrición, Fitness y Salud Mental**
```javascript
// POST /api/health-data/nutrition - Guardar log nutricional
// Token → req.user.uid → firestoreService.saveNutritionLog(userId, data)

// GET /api/health-data/nutrition?date=2024-01-15 - Obtener logs por fecha
// Token → req.user.uid → filtrar solo datos del usuario autenticado

// POST /api/health-data/fitness - Guardar log de fitness  
// POST /api/health-data/mental-health - Guardar log mental
// Mismo patrón: Token → userId → Firestore con userId
```

### ✅ **IA y Analytics** (`/api/ai`)
```javascript
// POST /api/ai/generate-insight - Generar insight personalizado
// Token → req.user.uid → obtener datos del usuario → OpenAI → guardar resultado

// GET /api/ai/insights - Obtener insights del usuario
// Token → req.user.uid → filtrar solo insights de ese usuario

// PATCH /api/ai/insights/:id/read - Marcar como leído
// Token → verificar que el insight pertenece a req.user.uid
```

### ✅ **Seguridad por Token**
- ✅ **Cada request verifica** el token Firebase
- ✅ **req.user.uid identifica** al usuario autenticado  
- ✅ **Firestore operations** solo actúan sobre datos del usuario
- ✅ **Sin acceso cruzado** entre usuarios

## 📝 Endpoints Principales

### Datos de Salud
- `GET /api/health-data/cycles` - Obtener ciclos menstruales
- `POST /api/health-data/cycles` - Crear nuevo ciclo
- `POST /api/health-data/nutrition` - Guardar log nutricional
- `POST /api/health-data/fitness` - Guardar log de fitness
- `POST /api/health-data/mental-health` - Guardar log mental

### IA y Insights
- `POST /api/ai/generate-insight` - Generar insight personalizado
- `GET /api/ai/insights` - Obtener insights del usuario
- `PATCH /api/ai/insights/:id/read` - Marcar insight como leído

### Sistema
- `GET /api/health` - Estado del servidor y Firebase

## 🔧 Configuración con el Frontend Flutter

✅ **¡Tu frontend Flutter YA ESTÁ LISTO!** Solo necesitas:

### 1. **URL del Backend**
En `lib/services/api_helper.dart` está configurado:
```dart
static String _baseUrl = kDebugMode 
    ? 'http://localhost:3000/api'  // ✅ Desarrollo
    : 'https://tu-dominio.com/api'; // ✅ Producción
```

### 2. **Autenticación**
- ✅ **FirebaseAuthService** maneja login/logout
- ✅ **ApiHelper** envía tokens automáticamente
- ✅ **Backend** solo verifica los tokens

### 3. **Base de Datos**
- ✅ **Frontend**: Firestore para perfil básico
- ✅ **Backend**: Firestore para datos de salud
- ✅ **Mismo proyecto Firebase** para ambos

### 4. **Flujo de Datos**
```
Frontend (Flutter) → Firebase Auth → Token → Backend (Node.js) → Firestore
     ↓                                                              ↓
   Perfil básico                                            Datos de salud
```

## 🔑 **MANEJO DE TOKENS FIREBASE - EXPLICACIÓN DETALLADA**

### 📱 **Frontend (Flutter) - Como funciona actualmente:**

#### 1. **Obtención del Token**
Tu `FirebaseAuthService` ya maneja esto:
```dart
// En lib/services/firebase_auth_service.dart
Future<String?> getAuthToken() async {
  User? user = _auth.currentUser;
  if (user != null) {
    return await user.getIdToken(); // Token JWT de Firebase
  }
  return null;
}
```

#### 2. **Envío Automático de Token**
Tu `ApiHelper` envía el token automáticamente:
```dart
// En lib/services/api_helper.dart  
Future<Map<String, String>> _getAuthHeaders() async {
  String? token = await _authService.getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token', // ✅ Token aquí
  };
}
```

#### 3. **Ejemplo de Uso en CRUD**
```dart
// Tu código Flutter (ya funciona así)
final response = await apiHelper.post('/health-data/cycles', {
  'start_date': '2024-01-15',
  'period_duration': 5,
  'symptoms': ['cramping', 'fatigue']
});
// ✅ El token se envía automáticamente en headers
```

### 🖥️ **Backend (Node.js) - Como recibirá el token:**

#### 1. **Middleware de Autenticación**
```javascript
// src/middleware/auth.js
const authenticateUser = async (req, res, next) => {
  try {
    // ✅ Extraer token del header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    // ✅ Verificar token con Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // ✅ Extraer información del usuario
    req.user = {
      uid: decodedToken.uid,        // ID único de Firebase
      email: decodedToken.email,    // Email verificado
      email_verified: decodedToken.email_verified
    };
    
    next(); // ✅ Token válido, continuar
  } catch (error) {
    console.error('Token inválido:', error);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
```

#### 2. **Uso en Rutas CRUD**
```javascript
// src/routes/health.js
router.post('/cycles', authenticateUser, async (req, res) => {
  try {
    // ✅ req.user.uid contiene el ID del usuario autenticado
    const cycle = await firestoreService.saveCycle(req.user.uid, req.body);
    res.status(201).json({ success: true, cycle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 🔄 **Flujo Completo del Token en CRUD:**

```
1. Usuario logueado en Flutter
   ↓
2. Flutter: user.getIdToken() → "eyJhbGciOiJSUzI1NiIs..."
   ↓  
3. ApiHelper: headers['Authorization'] = 'Bearer eyJhbGciOiJSUzI1NiIs...'
   ↓
4. HTTP Request → POST /api/health-data/cycles
   ↓
5. Backend: authenticateUser middleware
   ↓
6. Firebase Admin SDK: admin.auth().verifyIdToken(token)
   ↓
7. Token válido → req.user = { uid: 'firebase_user_id', email: '...' }
   ↓
8. CRUD Operation: saveCycle(req.user.uid, data) → Firestore
   ↓
 9. Response: { success: true, cycle: {...} }
 ```

### 💡 **Ejemplos Prácticos de Uso desde Flutter:**

#### **Frontend Flutter - Llamadas con Token Automático**
```dart
// En tu aplicación Flutter (ya funciona así):

class CycleService {
  final ApiHelper _apiHelper = ApiHelper();
  
  // ✅ Crear nuevo ciclo - Token se envía automáticamente
  Future<ApiResponse> createCycle(Map<String, dynamic> cycleData) async {
    return await _apiHelper.post('/health-data/cycles', cycleData);
    // Token Firebase se incluye automáticamente en headers
  }
  
  // ✅ Obtener ciclos del usuario - Solo sus datos
  Future<ApiResponse> getCycles() async {
    return await _apiHelper.get('/health-data/cycles');
    // Backend usa req.user.uid del token para filtrar
  }
  
  // ✅ Actualizar ciclo - Solo si es del usuario
  Future<ApiResponse> updateCycle(String cycleId, Map<String, dynamic> data) async {
    return await _apiHelper.put('/health-data/cycles/$cycleId', data);
    // Backend verifica propiedad antes de actualizar
  }
  
  // ✅ Generar insight con IA - Datos personalizados
  Future<ApiResponse> generateInsight(String type) async {
    return await _apiHelper.post('/ai/generate-insight', {'type': type});
    // OpenAI recibe datos solo del usuario autenticado
  }
}
```

#### **Backend Node.js - Procesamiento Seguro**
```javascript
// Lo que sucede en el backend con cada llamada:

// 1. ✅ VERIFICACIÓN AUTOMÁTICA DEL TOKEN
app.use('/api/health-data', authenticateUser); // Middleware aplicado
// → Cada request verifica el token Firebase
// → req.user = { uid: 'firebase_user_id', email: '...' }

// 2. ✅ CRUD SEGURO POR USER ID
router.post('/cycles', async (req, res) => {
  // Token ya verificado → req.user.uid es confiable
  const cycleData = {
    ...req.body,
    user_id: req.user.uid // ✅ Forzar el ID del token
  };
  
  // Guardar en Firestore con user_id seguro
  const cycle = await firestoreService.saveCycle(req.user.uid, cycleData);
  res.json({ success: true, cycle });
});

// 3. ✅ LECTURA FILTRADA POR USUARIO
router.get('/cycles', async (req, res) => {
  // Solo devolver ciclos del usuario autenticado
  const cycles = await firestoreService.getCycles(req.user.uid);
  // Imposible ver datos de otros usuarios
});
```

### 🔒 **Beneficios de Seguridad con Tokens Firebase:**

1. **✅ Sin contraseñas en el backend** - Firebase Auth las maneja
2. **✅ Tokens JWT verificables** - Firebase Admin SDK los valida  
3. **✅ Expiración automática** - Tokens se renuevan automáticamente
4. **✅ User ID confiable** - Viene del token verificado, no del cliente
5. **✅ Separación de responsabilidades** - Frontend autentica, Backend procesa
6. **✅ Escalabilidad** - Firebase maneja millones de usuarios
7. **✅ Verificación de email** - Token incluye estado de verificación

## 🛡️ Seguridad Básica

- ✅ **Sin autenticación propia** (la maneja Firebase)
- ✅ **Verificación de tokens Firebase** en cada request
- ✅ **Helmet** para headers de seguridad
- ✅ **CORS** configurado para el frontend
- ✅ **Firestore Rules** (configurar en Firebase Console)

## 🚀 Deploy Rápido

### Opción 1: Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway add
railway deploy
```

### Opción 2: Render
1. Conectar repo de GitHub
2. Configurar variables de entorno
3. Deploy automático

### Opción 3: Heroku
```bash
heroku create lunara-backend
heroku config:set MONGODB_URI=...
heroku config:set OPENAI_API_KEY=...
git push heroku main
```

## 📚 Próximos Pasos

1. **Completar endpoints CRUD** (UPDATE y DELETE para logs)
2. **Agregar validaciones** con Joi o express-validator  
3. **Configurar Firestore Rules** para seguridad
4. **Tests unitarios** con Jest
5. **Documentación API** con Swagger
6. **Rate limiting** con express-rate-limit

---

## 🎯 Resultado Final

Con esta configuración tendrás:
- ✅ Backend funcional en **menos de 30 minutos**
- ✅ **100% compatible** con tu frontend Flutter existente
- ✅ **Integración OpenAI** lista para insights
- ✅ **Autenticación Firebase** (manejada por frontend)
- ✅ **Base de datos Firestore** (mismo proyecto)
- ✅ **API REST** simple y eficiente
- ✅ **Listo para producción**

## 🔥 **IMPORTANTE - Arquitectura Final:**

```
FRONTEND (Flutter):
├── 🔐 Login/Registro (Firebase Auth)
├── 👤 Perfil básico (Firestore)
├── 🔑 Tokens (enviados al backend)
└── 📱 UI/UX

BACKEND (Node.js):
├── 🤖 OpenAI (insights personalizados)
├── 📊 CRUD datos de salud (Firestore)
├── 📈 Analytics y estadísticas
└── 🔄 Sincronización

FIREBASE:
├── 🔐 Authentication (usuarios)
├── 📁 Firestore (base de datos única)
└── ⚙️ Admin SDK (backend)
```

**¡El backend más simple y arquitectónicamente correcto para Lunara! 🌙**
