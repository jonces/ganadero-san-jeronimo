"use client";
import { useMemo } from "react";

// ── Inline parser ─────────────────────────────────────────────────────────────
// Soporta: **bold**, *italic*, `code`, ~~strikethrough~~
function parseInline(text) {
  const tokens = [];
  let i = 0;

  function tryMatch(open, close, type) {
    if (text.startsWith(open, i)) {
      const end = text.indexOf(close, i + open.length);
      if (end !== -1) {
        tokens.push({ type, text: text.slice(i + open.length, end) });
        i = end + close.length;
        return true;
      }
    }
    return false;
  }

  let buf = "";
  while (i < text.length) {
    if (buf.length > 0 && (text[i] === "*" || text[i] === "`" || text[i] === "~")) {
      tokens.push({ type: "text", text: buf });
      buf = "";
    }

    if (tryMatch("**", "**", "bold"))   continue;
    if (tryMatch("*",  "*",  "italic")) continue;
    if (tryMatch("`",  "`",  "code"))   continue;
    if (tryMatch("~~", "~~", "strike")) continue;

    buf += text[i++];
  }
  if (buf) tokens.push({ type: "text", text: buf });
  return tokens;
}

function Inline({ text }) {
  const tokens = useMemo(() => parseInline(text), [text]);
  return (
    <>
      {tokens.map((t, i) => {
        switch (t.type) {
          case "bold":   return <strong key={i} style={{ fontWeight: 700 }}>{t.text}</strong>;
          case "italic": return <em key={i}>{t.text}</em>;
          case "code":   return (
            <code key={i} style={{
              background: "var(--ia-hover)", color: "var(--ia-text)",
              padding: "1px 6px", borderRadius: 4,
              fontFamily: "'Courier New', Courier, monospace", fontSize: "0.87em",
              border: "1px solid var(--ia-border)",
            }}>{t.text}</code>
          );
          case "strike": return <s key={i}>{t.text}</s>;
          default:       return <span key={i}>{t.text}</span>;
        }
      })}
    </>
  );
}

// ── Block parser ──────────────────────────────────────────────────────────────
function parseBlocks(markdown) {
  if (!markdown) return [];
  const lines  = markdown.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Código vallado (```lang ... ```)
    if (line.trimStart().startsWith("```")) {
      const lang  = line.trimStart().slice(3).trim();
      const start = i + 1;
      let   end   = start;
      while (end < lines.length && !lines[end].trimStart().startsWith("```")) end++;
      blocks.push({ type: "code_block", lang, content: lines.slice(start, end).join("\n") });
      i = end + 1;
      continue;
    }

    // Encabezados (# ## ###)
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if (hm) {
      blocks.push({ type: "heading", level: hm[1].length, text: hm[2].trim() });
      i++;
      continue;
    }

    // Separador horizontal
    if (/^[-_*]{3,}$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Cita (> ...)
    if (line.startsWith("> ")) {
      const lines2 = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        lines2.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", text: lines2.join("\n") });
      continue;
    }

    // Lista desordenada (- * +)
    if (/^(\s*)[-*+]\s/.test(line)) {
      const items = [];
      const indent = line.match(/^(\s*)/)[1].length;
      while (i < lines.length && /^(\s*)[-*+]\s/.test(lines[i])) {
        const lineIndent = lines[i].match(/^(\s*)/)[1].length;
        items.push({ text: lines[i].replace(/^\s*[-*+]\s/, ""), level: Math.floor((lineIndent - indent) / 2) });
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Lista ordenada (1. 2. ...)
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push({ text: lines[i].replace(/^\d+\.\s/, "") });
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Tabla (| col | col |)
    if (line.includes("|") && i + 1 < lines.length && /[-|]+/.test(lines[i + 1])) {
      const headers = parseCells(line);
      const rows    = [];
      i += 2; // saltar la línea separadora
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(parseCells(lines[i]));
        i++;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Línea vacía
    if (!line.trim()) {
      i++;
      continue;
    }

    // Párrafo — agrupa líneas contiguas
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trimStart().startsWith("```") &&
      !lines[i].match(/^#{1,3}\s/) &&
      !lines[i].includes("|") &&
      !/^(\s*)[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith("> ") &&
      !/^[-_*]{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

function parseCells(line) {
  return line.split("|").map(c => c.trim()).filter(Boolean);
}

// ── Block renderers ───────────────────────────────────────────────────────────
function CodeBlock({ lang, content }) {
  return (
    <div style={{ margin: "10px 0", borderRadius: 10, overflow: "hidden", border: "1px solid var(--ia-border)" }}>
      {lang && (
        <div style={{
          padding: "4px 12px", fontSize: 11, fontWeight: 700,
          background: "var(--ia-hover)", color: "var(--ia-muted)",
          borderBottom: "1px solid var(--ia-border)", letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>{lang}</div>
      )}
      <pre style={{
        margin: 0, padding: "14px 16px", overflowX: "auto",
        background: "var(--ia-ai-bub)", color: "var(--ia-text)",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 13, lineHeight: 1.6, whiteSpace: "pre",
      }}><code>{content}</code></pre>
    </div>
  );
}

function TableBlock({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto", margin: "10px 0" }}>
      <table style={{
        borderCollapse: "collapse", width: "100%",
        fontSize: 13, lineHeight: 1.5,
      }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "7px 12px", textAlign: "left",
                background: "var(--ia-hover)", color: "var(--ia-text)",
                fontWeight: 700, border: "1px solid var(--ia-border)",
                whiteSpace: "nowrap",
              }}>
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "var(--ia-hover)" + "55" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "6px 12px", border: "1px solid var(--ia-border)",
                  color: "var(--ia-text)", verticalAlign: "top",
                }}>
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Block({ block }) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}`;
      const sz  = block.level === 1 ? 18 : block.level === 2 ? 16 : 14;
      const mb  = block.level === 1 ? 8  : 6;
      return (
        <Tag style={{
          margin: `${mb * 1.5}px 0 ${mb}px`, fontSize: sz, fontWeight: 700,
          color: "var(--ia-text)", lineHeight: 1.3,
          borderBottom: block.level === 1 ? "1px solid var(--ia-border)" : "none",
          paddingBottom: block.level === 1 ? 6 : 0,
        }}>
          <Inline text={block.text} />
        </Tag>
      );
    }

    case "code_block":
      return <CodeBlock lang={block.lang} content={block.content} />;

    case "table":
      return <TableBlock headers={block.headers} rows={block.rows} />;

    case "hr":
      return <hr style={{ border: "none", borderTop: "1px solid var(--ia-border)", margin: "12px 0" }} />;

    case "blockquote":
      return (
        <blockquote style={{
          margin: "8px 0", padding: "8px 14px",
          borderLeft: "3px solid var(--ia-accent)",
          background: "var(--ia-hover)", borderRadius: "0 8px 8px 0",
          color: "var(--ia-muted)", fontSize: 13, fontStyle: "italic",
        }}>
          <MarkdownMessage text={block.text} />
        </blockquote>
      );

    case "ul":
      return (
        <ul style={{ margin: "6px 0", paddingLeft: 22, listStyle: "none" }}>
          {block.items.map((item, i) => (
            <li key={i} style={{
              margin: "3px 0", color: "var(--ia-text)", fontSize: 14, lineHeight: 1.6,
              paddingLeft: (item.level ?? 0) * 16,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <span style={{ color: "var(--ia-accent)", fontWeight: 900, flexShrink: 0, marginTop: 2 }}>
                {(item.level ?? 0) > 0 ? "◦" : "•"}
              </span>
              <span><Inline text={item.text} /></span>
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none", counterReset: "ia-ol" }}>
          {block.items.map((item, i) => (
            <li key={i} style={{
              margin: "3px 0", color: "var(--ia-text)", fontSize: 14, lineHeight: 1.6,
              display: "flex", gap: 8, alignItems: "flex-start",
            }}>
              <span style={{
                color: "var(--ia-accent)", fontWeight: 700, flexShrink: 0,
                minWidth: 20, textAlign: "right", marginTop: 1,
              }}>{i + 1}.</span>
              <span><Inline text={item.text} /></span>
            </li>
          ))}
        </ol>
      );

    case "paragraph":
      return (
        <p style={{ margin: "6px 0", lineHeight: 1.7, fontSize: 14, color: "var(--ia-text)" }}>
          <Inline text={block.text} />
        </p>
      );

    default:
      return null;
  }
}

// ── Componente público ────────────────────────────────────────────────────────

/**
 * Renderiza texto Markdown con soporte para:
 * encabezados, código, tablas, listas, blockquotes, bold/italic/inline-code.
 *
 * @param {{ text: string, isStreaming?: boolean }} props
 */
export function MarkdownMessage({ text, isStreaming = false }) {
  const blocks = useMemo(() => parseBlocks(text ?? ""), [text]);

  return (
    <div data-ia-markdown style={{ minWidth: 0 }}>
      {blocks.map((b, i) => <Block key={i} block={b} />)}
      {isStreaming && (
        <span aria-hidden="true" style={{
          display: "inline-block", width: 7, height: 14,
          background: "var(--ia-accent)",
          borderRadius: 2, marginLeft: 2, verticalAlign: "text-bottom",
          animation: "ia-dot-bounce 0.9s infinite",
        }} />
      )}
    </div>
  );
}
