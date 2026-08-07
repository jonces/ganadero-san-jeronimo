"use client";
import { useState, useCallback } from "react";
import {
  generateGanaderiaImage,
  isImageGenerationAvailable,
  buildGanaderiaPrompt,
} from "../services/image-generation-service.js";

const CATEGORIES = [
  { id: "veterinario",     label: "Veterinario",     icon: "🩺" },
  { id: "infraestructura", label: "Infraestructura",  icon: "🏗️" },
  { id: "pasturas",        label: "Pasturas",          icon: "🌿" },
  { id: "educativo",       label: "Educativo",         icon: "📚" },
];

const STYLES = [
  { id: "illustration", label: "Ilustración" },
  { id: "diagram",      label: "Diagrama"    },
  { id: "photo",        label: "Foto"        },
  { id: "infographic",  label: "Infografía"  },
];

const SIZES = [
  { id: "1024x1024",  label: "Cuadrado (1:1)"    },
  { id: "1792x1024",  label: "Horizontal (16:9)"  },
  { id: "1024x1792",  label: "Vertical (9:16)"    },
];

/**
 * Panel de generación de imágenes con IA (DALL-E 3).
 *
 * @param {{ onClose?: () => void, style?: object }} props
 */
export function ImageGeneratorPanel({ onClose, style: containerStyle }) {
  const [prompt,   setPrompt]   = useState("");
  const [category, setCategory] = useState("veterinario");
  const [imgStyle, setImgStyle] = useState("illustration");
  const [size,     setSize]     = useState("1024x1024");
  const [quality,  setQuality]  = useState("standard");
  const [status,   setStatus]   = useState("idle");   // idle | generating | done | error
  const [results,  setResults]  = useState([]);
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState("");

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setStatus("generating");
    setError("");
    setResults([]);

    const available = await isImageGenerationAvailable();
    if (!available) {
      setStatus("error");
      setError("La generación de imágenes requiere una OPENAI_API_KEY configurada en el servidor. Contacta al administrador.");
      return;
    }

    try {
      const task = await generateGanaderiaImage({
        prompt:   trimmed,
        category,
        style:    imgStyle,
        size,
        quality,
      });
      setResults(task.results);
      setStatus("done");
      if (task.results[0]) setPreview(task.results[0]);
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }, [prompt, category, imgStyle, size, quality]);

  const builtPrompt = buildGanaderiaPrompt(prompt, category, imgStyle);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      ...containerStyle,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "16px 20px",
        borderBottom: "1px solid var(--ia-border)", flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>🎨</span>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ia-text)" }}>
            Generador de Imágenes IA
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: "var(--ia-muted)" }}>
            Crea ilustraciones, diagramas e infografías ganaderas
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--ia-muted)", fontSize: 18, lineHeight: 1,
          }}>✕</button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Prompt */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ia-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Descripción de la imagen
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ej: Diagrama anatómico de las cavidades gástricas de un bovino con etiquetas en español..."
            rows={3}
            style={{
              width: "100%", resize: "vertical", padding: "10px 12px",
              border: "1px solid var(--ia-border)", borderRadius: 10,
              background: "var(--ia-bg)", color: "var(--ia-text)",
              fontSize: 13, fontFamily: "inherit", lineHeight: 1.5,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Categoría */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ia-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Categoría
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                border: "1px solid " + (category === c.id ? "#10A37F" : "var(--ia-border)"),
                background: category === c.id ? "#10A37F18" : "var(--ia-bg)",
                color: category === c.id ? "#10A37F" : "var(--ia-muted)",
                fontSize: 12, fontWeight: category === c.id ? 700 : 500,
                fontFamily: "inherit",
              }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estilo y Tamaño */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ia-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Estilo
            </label>
            <select value={imgStyle} onChange={e => setImgStyle(e.target.value)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              border: "1px solid var(--ia-border)", background: "var(--ia-bg)",
              color: "var(--ia-text)", fontSize: 12, fontFamily: "inherit",
            }}>
              {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ia-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Tamaño
            </label>
            <select value={size} onChange={e => setSize(e.target.value)} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              border: "1px solid var(--ia-border)", background: "var(--ia-bg)",
              color: "var(--ia-text)", fontSize: 12, fontFamily: "inherit",
            }}>
              {SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Calidad */}
        <div style={{ display: "flex", gap: 8 }}>
          {["standard", "hd"].map(q => (
            <button key={q} onClick={() => setQuality(q)} style={{
              flex: 1, padding: "7px 0", borderRadius: 8, cursor: "pointer",
              border: "1px solid " + (quality === q ? "#10A37F" : "var(--ia-border)"),
              background: quality === q ? "#10A37F" : "var(--ia-bg)",
              color: quality === q ? "#fff" : "var(--ia-muted)",
              fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            }}>
              {q === "hd" ? "HD (mayor detalle)" : "Estándar"}
            </button>
          ))}
        </div>

        {/* Vista previa del prompt */}
        {prompt.trim() && (
          <div style={{
            padding: "10px 12px", borderRadius: 10, fontSize: 11,
            background: "var(--ia-hover)", color: "var(--ia-muted)",
            border: "1px solid var(--ia-border)", lineHeight: 1.5,
          }}>
            <span style={{ fontWeight: 700, display: "block", marginBottom: 3 }}>Prompt final:</span>
            {builtPrompt}
          </div>
        )}

        {/* Botón generar */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || status === "generating"}
          style={{
            padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer",
            background: !prompt.trim() || status === "generating" ? "var(--ia-border)" : "#10A37F",
            color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          {status === "generating" ? "⏳ Generando imagen..." : "🎨 Generar imagen"}
        </button>

        {/* Error */}
        {status === "error" && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, fontSize: 12, lineHeight: 1.5,
            background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Resultados */}
        {results.length > 0 && (
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ia-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Imagen generada
            </label>
            <div style={{ display: "grid", gridTemplateColumns: results.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
              {results.map((url, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Imagen generada ${i + 1}`}
                    onClick={() => setPreview(url)}
                    style={{
                      width: "100%", borderRadius: 12, cursor: "pointer",
                      border: preview === url ? "2px solid #10A37F" : "2px solid transparent",
                      transition: "border 0.15s",
                    }}
                  />
                  <a
                    href={url}
                    download={`ganaderosg-ia-${Date.now()}-${i}.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      position: "absolute", bottom: 8, right: 8,
                      background: "rgba(0,0,0,0.6)", color: "#fff",
                      borderRadius: 8, padding: "4px 8px", fontSize: 11,
                      textDecoration: "none", fontWeight: 600,
                    }}
                  >
                    ⬇ Descargar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
