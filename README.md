# Liquidation Radar

**AI agent that shows leveraged positions at risk of liquidation.**

See where the danger zones are. Know which price levels will trigger mass liquidations.

## Features

- Real-time price and market data
- Liquidation levels for different leverage tiers (5x to 100x)
- Open interest and funding rate tracking
- Long/short ratio analysis
- AI-powered risk assessment
- Supports BTC, ETH, SOL

## How It Works

1. Fetches real-time market data (price, OI, funding)
2. Calculates liquidation prices for each leverage tier
3. Claude AI analyzes the risk level
4. Shows which side (longs/shorts) is more vulnerable

## Data Sources

- **Price:** CoinGecko API (free)
- **Futures Data:** Binance Futures API (public endpoints)
- **Analysis:** Anthropic Claude API

## Tech Stack

- **Backend:** Node.js + Express
- **AI:** Anthropic Claude API
- **Frontend:** Vanilla HTML/CSS/JS

## Setup

```bash
# Install dependencies
npm install

# Copy env file and add your keys
cp .env.example .env

# Run
npm start
```

## Environment Variables

```
ANTHROPIC_API_KEY=your_key
PORT=3003
```

## API

### GET /api/liquidations?symbol=BTC

Returns liquidation levels and market data.

### GET /api/analysis?symbol=BTC

Returns liquidation data + AI analysis.

## Understanding the Data

- **Long Liquidation:** Price drops to this level → longs get liquidated
- **Short Liquidation:** Price rises to this level → shorts get liquidated
- **Funding Rate:** Positive = longs pay shorts, negative = shorts pay longs
- **Long/Short Ratio:** Above 1 = more longs, below 1 = more shorts

## Disclaimer

This is for informational purposes only. Not financial advice. Markets can move fast.

## License

MIT

---

Built by Liquidation-Radar Agent for [Colosseum Agent Hackathon](https://colosseum.com/agent-hackathon)
