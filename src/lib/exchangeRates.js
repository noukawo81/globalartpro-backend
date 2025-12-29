const DEFAULT_RATES = {
  USD: 1,
  ARTC: parseFloat(process.env.ARTC_USD_RATE) || 0.01, // 1 ARTC = 0.01 USD by default
  PI: parseFloat(process.env.PI_USD_RATE) || 0.005,
  EUR: parseFloat(process.env.EUR_USD_RATE) || 1.1,
  CNY: parseFloat(process.env.CNY_USD_RATE) || 0.14,
  RUB: parseFloat(process.env.RUB_USD_RATE) || 0.012,
  GOLD: parseFloat(process.env.GOLD_USD_RATE) || 1900, // price per ounce
};

export function getRates() {
  // Allow overriding via JSON in EXCHANGE_RATES env var
  try {
    if (process.env.EXCHANGE_RATES) {
      const parsed = JSON.parse(process.env.EXCHANGE_RATES);
      return { ...DEFAULT_RATES, ...parsed };
    }
  } catch (e) {
    console.warn('invalid EXCHANGE_RATES env var, falling back to defaults');
  }
  return DEFAULT_RATES;
}

export function balancesToUSD(balances = {}, applyNetworkFee = true) {
  const rates = getRates();
  const per = {};
  let usdGross = 0;
  for (const k of Object.keys(balances)) {
    const amt = Number(balances[k] || 0);
    const rate = Number(rates[k] || 0);
    const usd = amt * rate;
    per[k] = { amount: amt, rate, usd: +usd };
    usdGross += usd;
  }
  const networkRate = parseFloat(process.env.NETWORK_FEE) || 0.012; // 1.2% default
  const usdNet = applyNetworkFee ? +(usdGross * (1 - networkRate)) : +usdGross;
  return { per, rates, usdGross: +usdGross.toFixed(4), usdNet: +usdNet.toFixed(4), networkRate };
}
