// Add to your existing server.js
const SmartMeterSimulator = require('../simulators/smartMeter/simulator');

// ... existing code ...

// New endpoints for simulator control
app.post('/api/simulator/start', (req, res) => {
  require('../simulators/smartMeter/interface');
  res.json({ status: 'Simulation started' });
});

app.get('/api/simulator/meters', async (req, res) => {
  // This would track active meters in a real implementation
  res.json({ activeMeters: [] });
});