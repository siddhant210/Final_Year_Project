import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';  // Correct named import

const app = express();
const PORT = 3000;

// Store heart rate data with timestamp
let latestData = {
  heartRate: null,
  timestamp: null,
  sampleCount: 0
};

// WebSocket Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// Use WebSocketServer instead of WebSocket.Server
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Enhanced POST endpoint
app.post('/api/heartrate', (req, res) => {
  try {
    const now = new Date();
    
    // Validate incoming data
    if (!req.body || typeof req.body.heartRate === 'undefined') {
      throw new Error('Invalid data format');
    }

    // Extract heart rate (handles both array and number formats)
    const heartRate = Array.isArray(req.body.heartRate) 
      ? req.body.heartRate[0] 
      : req.body.heartRate;

    // Validate numeric range
    if (typeof heartRate !== 'number' || heartRate < 30 || heartRate > 200) {
      throw new Error(`Invalid heart rate value: ${heartRate}`);
    }

    // Update latest data
    latestData = {
      heartRate,
      timestamp: req.body.timestamp || now.toISOString(),
      sampleCount: latestData.sampleCount + 1
    };

    // Broadcast to all WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(latestData));
      }
    });

    console.log(`❤️ [${now.toLocaleTimeString()}] HR: ${heartRate} BPM (Sample #${latestData.sampleCount})`);
    res.sendStatus(200);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

// GET endpoint with cache control
app.get('/api/heartrate', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(latestData);
});

// Serve frontend
app.use(express.static('../public'));

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.send(JSON.stringify(latestData));
});
