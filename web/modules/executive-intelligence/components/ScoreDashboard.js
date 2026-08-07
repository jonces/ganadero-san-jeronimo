"use client";
import React from "react";
import ScoreCard            from "./ScoreCard.js";
import { SCORE_ORDER, getScoreLevel } from "../constants/score-config.js";

function GaugeSVG({ score, color }) {
  const r = 42, cx = 56, cy = 56;
  const toRad = d => (d * Math.PI) / 180;
  const pt    = a => [cx + r * Math.cos(toRad(a)), cy + r * Math.sin(toRad(a))];

  const startA = -210, totalA = 240;
  const [sx, sy] = pt(startA);
  const endA  = startA + totalA * score / 100;
  const [ex, ey] = pt(endA);
  const large = totalA * score / 100 > 180 ? 1 : 0;
  const trackEnd = pt(startA + totalA);

  return (
    <svg width={112} height={80} viewBox="0 0 112 80">
      <path
        d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${trackEnd[0]} ${trackEnd[1]}`}
        fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={10} strokeLinecap="round"
      />
      {score > 0 && (
        <path
          d={`M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize={18} fontWeight={900} fill="#fff">{score}</text>
      <text x={cx} y={cy + 20} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,.6)">/100</text>
    </svg>
  );
}

export default function ScoreDashboard({ scores }) {
  if (!scores) return (
    <p style={{ color: "#9ca3af", textAlign: "center", padding: 60 }}>Calculando scores…</p>
  );

  const gen      = scores.general ?? { score: 0 };
  const genScore = Math.round(gen.score);
  const level    = getScoreLevel(genScore);

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)",
        borderRadius: 16, padding: "28px 32px", marginBottom: 20, color: "#fff",
        display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap",
      }}>
        <GaugeSVG score={genScore} color={level.color} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, opacity: .75 }}>🏆 Score General de la Operación</p>
          <p style={{ margin: "0 0 8px", fontSize: 48, fontWeight: 900, lineHeight: 1 }}>
            {genScore}<span style={{ fontSize: 20, opacity: .6 }}>/100</span>
          </p>
          <span style={{
            fontSize: 13, fontWeight: 700, color: level.color,
            background: level.bg, borderRadius: 6, padding: "3px 12px",
          }}>{level.label}</span>
        </div>
        <div style={{ flex: 2, minWidth: 220 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, opacity: .9 }}>{gen.mejora}</p>
        </div>
      </div>

      {/* Individual scores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
        {SCORE_ORDER.filter(id => id !== "general").map(id => (
          <ScoreCard key={id} id={id} data={scores[id]} />
        ))}
      </div>
    </div>
  );
}
