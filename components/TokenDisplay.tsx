"use client";

import { useState, useEffect } from "react";
import {
  Copy, Check, KeyRound, AlertTriangle,
  ClipboardList, Fingerprint, Building2, Timer, Cpu,
  Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { licenseService } from "@/services/licenseService";
import type { LicenseMeta } from "@/app/page";

/** How many tokens to show individually before collapsing */
const SHOW_LIMIT = 10;

interface Props {
  tokens: string[];
  meta: LicenseMeta | null;
  error: string | null;
}

export default function TokenDisplay({ tokens, meta, error }: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasExported, setHasExported] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  // Reset export status when new tokens are generated
  useEffect(() => {
    setHasExported(false);
  }, [tokens]);

  const copy = (text: string, idx: number) =>
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000);
    });

  const copyAll = () =>
    navigator.clipboard.writeText(tokens.join("\n")).then(() => {
      setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2500);
    });

  /* Export — uses centralized service */
  const handleExport = async () => {
    if (!meta || tokens.length === 0 || hasExported) return;
    setExporting(true);
    try {
      await licenseService.exportBundle(tokens, meta);
      setHasExported(true);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  /* ── Empty ─────────────────────────────── */
  if (tokens.length === 0 && !error) {
    return (
      <div className="gradient-border flex flex-col items-center justify-center text-center animate-fade-in w-full"
        style={{ minHeight: 480, padding: "40px 32px" }}>
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
          <div className="relative" style={{
            width: 52, height: 52, borderRadius: 16,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <KeyRound size={24} color="#6366f1" strokeWidth={1.5} className="opacity-60" />
          </div>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>No tokens yet</p>
        <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, maxWidth: 200 }}>
          Fill the form and click<br />
          <span className="text-indigo-400 font-semibold">Generate Tokens</span>
        </p>
      </div>
    );
  }

  /* ── Error ──────────────────────────────── */
  if (error) {
    return (
      <div className="animate-slide-up" style={{
        borderRadius: 14, padding: "14px 16px",
        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={14} color="#f87171" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#fca5a5", marginBottom: 2 }}>Generation failed</p>
            <p style={{ fontSize: 11, color: "rgba(252,165,165,0.7)", lineHeight: 1.5 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── How many to render ────────────────── */
  const MAX_RENDER = 50;
  
  // If expanded, show up to MAX_RENDER. If not, show SHOW_LIMIT.
  const displayLimit = expanded ? MAX_RENDER : SHOW_LIMIT;
  const visible = tokens.slice(0, displayLimit);

  /* ── Success ───────────────────────────── */
  return (
    <div className="gradient-border animate-slide-up" style={{ padding: "20px 22px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Check size={15} color="#34d399" strokeWidth={2.5} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#34d399", lineHeight: 1 }}>
            {tokens.length.toLocaleString()} Tokens Generated
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {tokens.length > 1 && (
            <button onClick={copyAll} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit",
              fontSize: 11, fontWeight: 600, transition: "all 0.15s",
              ...(copiedAll
                ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#94a3b8" }),
            }}>
              {copiedAll ? <><Check size={11} />Copied!</> : <><ClipboardList size={11} />Copy All</>}
            </button>
          )}

          {/* Export */}
          <button onClick={handleExport} disabled={exporting || hasExported} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 7, cursor: exporting || hasExported ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: 11, fontWeight: 600, transition: "all 0.2s",
            ...(hasExported
              ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }
              : { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.35)", color: "#818cf8", opacity: exporting ? 0.5 : 1 }),
          }}>
            {exporting ? (
              <svg style={{ animation: "spin 0.8s linear infinite" }} width={11} height={11} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(129,140,248,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0110 10" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
              </svg>
            ) : hasExported ? <Check size={11} /> : <Download size={11} />}
            {hasExported ? "Exported!" : "Export .aglic"}
          </button>
        </div>
      </div>

      {/* Meta chips */}
      {meta && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          <Chip icon={<Building2 size={9} />} label={meta.company} />
          <Chip icon={<Fingerprint size={9} />} label={meta.licenseType} accent />
          <Chip icon={<Timer size={9} />}
            label={new Date(meta.expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
          {meta.licenseType === "station-based" && meta.hwids?.slice(0, 3).map((h, i) => (
            <Chip key={i} icon={<Cpu size={9} />} label={h} />
          ))}
          {meta.licenseType === "station-based" && meta.hwids && meta.hwids.length > 3 && (
            <Chip icon={<Cpu size={9} />} label={`+${meta.hwids.length - 3} more nodes`} />
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 12 }} />

      {/* Warning for large sets */}
      {tokens.length > MAX_RENDER && (
        <div style={{ 
          padding: "8px 12px", borderRadius: 8, marginBottom: 10,
          background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)",
          fontSize: 10, color: "#818cf8", display: "flex", alignItems: "center", gap: 6
        }}>
          <AlertTriangle size={12} />
          <span>Showing first {visible.length} tokens. Use <b>Export</b> or <b>Copy All</b> for the full {tokens.length.toLocaleString()} set.</span>
        </div>
      )}

      {/* Token list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
        {visible.map((token, i) => (
          <div key={i} style={{
            borderRadius: 10, overflow: "hidden",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* Row header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
                  fontSize: 10, fontWeight: 800, fontFamily: "monospace",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{i + 1}</span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Token {i + 1}</span>
                {meta?.licenseType === "station-based" && meta.hwids?.[i] && (
                  <Chip icon={<Cpu size={8} />} label={meta.hwids[i]} mono />
                )}
              </div>
              <button onClick={() => copy(token, i)} style={{
                display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
                padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600,
                fontFamily: "inherit", transition: "all 0.15s",
                ...(copiedIdx === i
                  ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }
                  : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1" }),
              }}>
                {copiedIdx === i ? <><Check size={9} />Copied</> : <><Copy size={9} />Copy</>}
              </button>
            </div>
            {/* Token body */}
            <div style={{ padding: "10px 12px" }}>
              <p className="token-text" style={{
                WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {token}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Expand/collapse for large lists */}
      {tokens.length > SHOW_LIMIT && (
        <button onClick={() => setExpanded((e) => !e)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          width: "100%", marginTop: 12, padding: "10px 0", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
          color: "#a5b4fc", fontSize: 11, fontWeight: 700, fontFamily: "inherit",
          cursor: "pointer", transition: "all 0.2s",
        }}>
          {expanded ? (
            <><ChevronUp size={14} /> Show less</>
          ) : (
            <><ChevronDown size={14} /> Show {Math.min(tokens.length, MAX_RENDER) - SHOW_LIMIT} more sample tokens</>
          )}
        </button>
      )}
    </div>
  );
}

/* ── Chip ──────────────────────────────── */
function Chip({ icon, label, accent, mono }: {
  icon: React.ReactNode; label: string; accent?: boolean; mono?: boolean;
}) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap",
      fontSize: mono ? 10 : 11, fontFamily: mono ? "monospace" : "inherit",
      ...(accent
        ? { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }
        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }),
    }}>
      {icon}<span>{label}</span>
    </div>
  );
}
