// Simple currency conversion helper used for demo purposes
// Base currency: USD

const RATES = {
  USD: 1,
  PI: 10000, // 1 USD = 10000 PI (demo rate)
  EUR: 0.92,
  CNY: 7.3,
  RUB: 88,
  GOLD: 0.0005 // 1 USD = 0.0005 GOLD (1 GOLD = 2000 USD)
};

export function convert(amount, from = 'USD', to = 'USD') {
  if (!RATES[from] || !RATES[to]) {
    throw new Error('Unsupported currency');
  }
  const usd = amount / RATES[from];
  const out = usd * RATES[to];
  // Round: integers for PI, 2 decimals otherwise
  if (to === 'PI') return Math.round(out);
  return Math.round(out * 100) / 100;
}

export function displayPrices(amount, baseCurrency = 'USD', displayOrder = ['PI','USD','EUR','CNY','RUB','GOLD']) {
  const res = {};
  for (const cur of displayOrder) {
    try {
      res[cur] = convert(amount, baseCurrency, cur);
    } catch (e) {
      res[cur] = null;
    }
  }
  return res;
}

export default { convert, displayPrices, RATES };
