// Server-side observability store (in-process, Railway restarts clear it)
// For persistence use a DB table or external service

const store = {
  requests: [],
  errors:   [],
  totals:   { tokens: 0, cost_usd: 0, requests: 0, errors: 0 },
};

const COST_PER_M = {
  "gpt-5.5":       { input: 15,   output: 60   },
  "gpt-5.5-mini":  { input: 3,    output: 12   },
  "gpt-4o":        { input: 2.5,  output: 10   },
  "gpt-4o-mini":   { input: 0.15, output: 0.6  },
  "claude-opus-5": { input: 15,   output: 75   },
  "claude-sonnet-5":{ input: 3,   output: 15   },
};

export function trackRequest({ model, provider, agent, tokens, durationMs, tools }) {
  const c     = COST_PER_M[model];
  const cost  = c ? ((tokens.input / 1e6) * c.input + (tokens.output / 1e6) * c.output) : 0;

  const entry = {
    id:         crypto.randomUUID(),
    ts:         new Date().toISOString(),
    model, provider, agent,
    tokens,
    durationMs,
    cost_usd:   cost,
    tools:      tools ?? [],
  };

  store.requests.unshift(entry);
  if (store.requests.length > 500) store.requests.splice(500);

  store.totals.tokens  += (tokens.input ?? 0) + (tokens.output ?? 0);
  store.totals.cost_usd += cost;
  store.totals.requests += 1;

  return entry;
}

export function trackError({ model, provider, agent, error, durationMs }) {
  const entry = {
    id: crypto.randomUUID(), ts: new Date().toISOString(),
    model, provider, agent, error, durationMs,
  };
  store.errors.unshift(entry);
  if (store.errors.length > 200) store.errors.splice(200);
  store.totals.errors += 1;
  return entry;
}

export function getMetrics() {
  return {
    totals:           store.totals,
    recentRequests:   store.requests.slice(0, 50),
    recentErrors:     store.errors.slice(0, 20),
  };
}

export function resetMetrics() {
  store.requests = [];
  store.errors   = [];
  store.totals   = { tokens: 0, cost_usd: 0, requests: 0, errors: 0 };
}
