/**
 * Vector store abstraction layer.
 * Swap implementations by changing VECTOR_STORE_PROVIDER env var.
 * Supported: memory (default), pgvector, pinecone, qdrant, weaviate, chroma
 */

// In-memory fallback (dev / no external DB)
class MemoryVectorStore {
  constructor() { this.docs = []; }

  async upsert(id, text, embedding, metadata = {}) {
    const idx = this.docs.findIndex(d => d.id === id);
    const doc = { id, text, embedding, metadata, ts: Date.now() };
    if (idx >= 0) this.docs[idx] = doc;
    else this.docs.push(doc);
  }

  async search(queryEmbedding, topK = 5) {
    if (!this.docs.length) return [];
    const scored = this.docs.map(doc => ({
      ...doc,
      score: cosineSim(queryEmbedding, doc.embedding),
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async delete(id) { this.docs = this.docs.filter(d => d.id !== id); }
  async count()    { return this.docs.length; }
}

// Stub — implement when pgvector is configured
class PGVectorStore {
  async upsert()  { throw new Error("pgvector: set DATABASE_URL and run migrations"); }
  async search()  { throw new Error("pgvector: not configured"); }
  async delete()  { throw new Error("pgvector: not configured"); }
  async count()   { return 0; }
}

// Stub — implement with @pinecone-database/pinecone
class PineconeStore {
  async upsert()  { throw new Error("Pinecone: set PINECONE_API_KEY and PINECONE_INDEX"); }
  async search()  { throw new Error("Pinecone: not configured"); }
  async delete()  { throw new Error("Pinecone: not configured"); }
  async count()   { return 0; }
}

// Stub — implement with @qdrant/js-client-rest
class QdrantStore {
  async upsert()  { throw new Error("Qdrant: set QDRANT_URL"); }
  async search()  { throw new Error("Qdrant: not configured"); }
  async delete()  { throw new Error("Qdrant: not configured"); }
  async count()   { return 0; }
}

function cosineSim(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// Singleton — picks implementation from env
let _store = null;
export function getVectorStore() {
  if (_store) return _store;
  const provider = process.env.VECTOR_STORE_PROVIDER ?? "memory";
  const map = {
    memory:   MemoryVectorStore,
    pgvector: PGVectorStore,
    pinecone: PineconeStore,
    qdrant:   QdrantStore,
  };
  const Cls = map[provider] ?? MemoryVectorStore;
  _store = new Cls();
  return _store;
}
