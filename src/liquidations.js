const Anthropic = require('anthropic').default;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch current price from CoinGecko (free, no API key)
async function getCurrentPrice(symbol) {
  const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' :
                 symbol.toLowerCase() === 'eth' ? 'ethereum' :
                 symbol.toLowerCase() === 'sol' ? 'solana' : 'bitcoin';

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      price: data[coinId].usd,
      change24h: data[coinId].usd_24h_change,
    };
  } catch (error) {
    console.error('Price fetch error:', error);
    return { price: 0, change24h: 0 };
  }
}

// Fetch open interest data from Coinglass public endpoint
async function getOpenInterest(symbol) {
  try {
    // Using Binance futures API as fallback (public, no key needed)
    const response = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}USDT`);
    const data = await response.json();
    return parseFloat(data.openInterest) || 0;
  } catch (error) {
    console.error('Open interest error:', error);
    return 0;
  }
}

// Fetch funding rate
async function getFundingRate(symbol) {
  try {
    const response = await fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}USDT&limit=1`);
    const data = await response.json();
    return data[0] ? parseFloat(data[0].fundingRate) * 100 : 0;
  } catch (error) {
    console.error('Funding rate error:', error);
    return 0;
  }
}

// Fetch long/short ratio
async function getLongShortRatio(symbol) {
  try {
    const response = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}USDT&period=1h&limit=1`);
    const data = await response.json();
    return data[0] ? parseFloat(data[0].longShortRatio) : 1;
  } catch (error) {
    console.error('Long/short ratio error:', error);
    return 1;
  }
}

// Calculate liquidation levels
function calculateLiquidationLevels(currentPrice) {
  const levels = [];
  const leverages = [5, 10, 20, 25, 50, 100];

  for (const leverage of leverages) {
    // Long liquidation (price drops)
    const longLiqPrice = currentPrice * (1 - (1 / leverage) + 0.005); // 0.5% maintenance margin

    // Short liquidation (price rises)
    const shortLiqPrice = currentPrice * (1 + (1 / leverage) - 0.005);

    levels.push({
      leverage,
      longLiquidationPrice: Math.round(longLiqPrice * 100) / 100,
      shortLiquidationPrice: Math.round(shortLiqPrice * 100) / 100,
      longDistancePercent: Math.round((1 - longLiqPrice / currentPrice) * 10000) / 100,
      shortDistancePercent: Math.round((shortLiqPrice / currentPrice - 1) * 10000) / 100,
    });
  }

  return levels;
}

async function getLiquidationData(symbol = 'BTC') {
  const [priceData, openInterest, fundingRate, longShortRatio] = await Promise.all([
    getCurrentPrice(symbol),
    getOpenInterest(symbol),
    getFundingRate(symbol),
    getLongShortRatio(symbol),
  ]);

  const liquidationLevels = calculateLiquidationLevels(priceData.price);

  // Estimate liquidation amounts at each level (simplified model)
  const estimatedLiquidations = liquidationLevels.map(level => ({
    ...level,
    estimatedLongLiquidations: Math.round(openInterest * 0.1 / level.leverage), // Rough estimate
    estimatedShortLiquidations: Math.round(openInterest * 0.1 / level.leverage),
  }));

  return {
    symbol,
    currentPrice: priceData.price,
    change24h: Math.round(priceData.change24h * 100) / 100,
    openInterest: Math.round(openInterest),
    fundingRate: Math.round(fundingRate * 10000) / 10000,
    longShortRatio: Math.round(longShortRatio * 100) / 100,
    liquidationLevels: estimatedLiquidations,
    timestamp: new Date().toISOString(),
  };
}

async function getAnalysis(symbol = 'BTC') {
  const data = await getLiquidationData(symbol);

  const prompt = `You are Liquidation-Radar, an AI agent that analyzes crypto leverage and liquidation risk.

Current Market Data for ${symbol}:
- Price: $${data.currentPrice.toLocaleString()}
- 24h Change: ${data.change24h}%
- Open Interest: ${data.openInterest.toLocaleString()} ${symbol}
- Funding Rate: ${data.fundingRate}%
- Long/Short Ratio: ${data.longShortRatio}

Liquidation Levels:
${data.liquidationLevels.map(l =>
  `${l.leverage}x: Longs liquidated below $${l.longLiquidationPrice.toLocaleString()} (-${l.longDistancePercent}%), Shorts above $${l.shortLiquidationPrice.toLocaleString()} (+${l.shortDistancePercent}%)`
).join('\n')}

Provide a brief analysis (under 150 words):
1. Current risk level (LOW/MEDIUM/HIGH)
2. Which side (longs or shorts) is more at risk
3. Key price levels to watch
4. Simple trading implication

Be direct and actionable. Use simple language.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    ...data,
    analysis: message.content[0].text,
  };
}

module.exports = { getLiquidationData, getAnalysis };
