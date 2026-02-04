require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getLiquidationData, getAnalysis } = require('./liquidations');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', agent: 'Liquidation-Radar' });
});

// Get liquidation heatmap data
app.get('/api/liquidations', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTC';
    const data = await getLiquidationData(symbol);
    res.json(data);
  } catch (error) {
    console.error('Liquidation data error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch liquidation data' });
  }
});

// Get AI analysis of current liquidation risk
app.get('/api/analysis', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'BTC';
    const analysis = await getAnalysis(symbol);
    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate analysis' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Liquidation-Radar running on http://localhost:${PORT}`);
});
