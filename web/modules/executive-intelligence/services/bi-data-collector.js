const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function safeFetch(url) {
  try {
    const r = await fetch(url, { cache: "no-store" });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

function loadLS(key) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
}

export async function collectBIData() {
  const [dashboard, incidentes, inventario, eventos] = await Promise.all([
    safeFetch(`${API}/dashboard`),
    safeFetch(`${API}/incidentes`),
    safeFetch(`${API}/inventario`),
    safeFetch(`${API}/eventos`),
  ]);

  // Pull cached data from other FASE modules
  const predictivePack = loadLS("predictive_predictions_v1");
  const sfhDevices     = loadLS("sfh_devices_v1");
  const sfhAlerts      = loadLS("sfh_alerts_v1");
  const mktListings    = loadLS("mkt_listings_v1");
  const mktOrders      = loadLS("mkt_orders_v1");

  return {
    dashboard,
    incidentes:  incidentes ?? [],
    inventario:  inventario ?? [],
    eventos:     eventos    ?? [],
    predictions: predictivePack?.predictions ?? [],
    sfhDevices:  sfhDevices  ?? [],
    sfhAlerts:   sfhAlerts   ?? [],
    mktListings: mktListings ?? [],
    mktOrders:   mktOrders   ?? [],
    ok: !!dashboard,
  };
}
