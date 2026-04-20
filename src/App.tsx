import React, { useState } from "react";
import { 
  Activity, 
  AlertCircle, 
  BarChart3, 
  CheckCircle2, 
  ClipboardList, 
  Database, 
  Play, 
  RefreshCw, 
  Server, 
  TrendingUp,
  AlertTriangle,
  Zap,
  ChevronRight,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { processHotIncident, processColdBatch, HotInput, ColdInput } from "./services/gemini";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

// Types for internal state
type Mode = "HOT" | "COLD";

const HOT_EXAMPLE: HotInput = {
  order_id: "ORD-9921",
  event_type: "REPARTIDOR_ESTANCADO",
  timestamp: new Date().toISOString(),
  details: "El repartidor Juan P. no se ha movido de la ubicación 'Calle Mallorca 234' en los últimos 15 minutos. El pedido contiene helados.",
};

const COLD_EXAMPLE: ColdInput[] = [
  { id: "1", order_id: "ORD-001", event_type: "RETRASO_RECOGE", status: "ERROR", zona_id: "ZONA_SUR", timestamp: "2026-04-16T10:00:00Z", details: "Restaurante saturado" },
  { id: "2", order_id: "ORD-002", event_type: "CANCELACIÓN", status: "ERROR", zona_id: "ZONA_SUR", timestamp: "2026-04-16T10:15:00Z", details: "Usuario no encontrado" },
  { id: "3", order_id: "ORD-003", event_type: "RETRASO_RECOGE", status: "ERROR", zona_id: "ZONA_NORTE", timestamp: "2026-04-16T11:00:00Z", details: "Lluvia intensa" },
  { id: "4", order_id: "ORD-004", event_type: "ENTREGA_OK", status: "SUCCESS", zona_id: "ZONA_NORTE", timestamp: "2026-04-16T11:30:00Z", details: "Ok" },
  { id: "5", order_id: "ORD-001", event_type: "RETRASO_RECOGE", status: "ERROR", zona_id: "ZONA_SUR", timestamp: "2026-04-16T10:00:00Z", details: "Restaurante saturado (DUPLICADO)" },
  { id: "6", order_id: "ORD-006", event_type: "RETRASO_ENTREGA", status: "ERROR", zona_id: "ZONA_SUR", timestamp: "2026-04-16T12:00:00Z", details: "Tráfico pesado" },
];

export default function App() {
  const [activeMode, setActiveMode] = useState<Mode>("HOT");
  const [inputLines, setInputLines] = useState(JSON.stringify(activeMode === "HOT" ? HOT_EXAMPLE : COLD_EXAMPLE, null, 2));
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const handleProcess = async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = JSON.parse(inputLines);
      let output;
      if (activeMode === "HOT") {
        output = await processHotIncident(data);
      } else {
        output = await processColdBatch(Array.isArray(data) ? data : [data]);
      }
      setResult(output);
      setHistory(prev => [output, ...prev].slice(0, 10));
    } catch (err) {
      console.error(err);
      alert("Error processing JSON. Ensure valid format.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: Mode) => {
    setActiveMode(mode);
    setInputLines(JSON.stringify(mode === "HOT" ? HOT_EXAMPLE : COLD_EXAMPLE, null, 2));
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-bg-gray text-glovo-black font-sans selection:bg-glovo-yellow selection:text-glovo-black overflow-hidden flex flex-col h-screen">
      {/* Header Bento Style */}
      <header className="bg-glovo-yellow border-b-2 border-glovo-black px-8 py-4 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-glovo-black text-glovo-yellow w-10 h-10 rounded-full flex items-center justify-center font-black text-xl">G</div>
          <h1 className="text-xl font-extrabold uppercase tracking-tighter">Logistics Ops Engine</h1>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Mode Switchers inside Header */}
          <div className="bg-glovo-black/10 p-1 rounded-full flex gap-1">
            <button 
              onClick={() => switchMode("HOT")}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                activeMode === "HOT" ? "bg-glovo-red text-white shadow-md" : "text-glovo-black/60 hover:text-glovo-black"
              )}
            >
              Hot Mode
            </button>
            <button 
              onClick={() => switchMode("COLD")}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                activeMode === "COLD" ? "bg-glovo-blue text-white shadow-md" : "text-glovo-black/60 hover:text-glovo-black"
              )}
            >
              Cold Mode
            </button>
          </div>

          <div className="bg-glovo-black text-white px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
            <div className="w-2 h-2 bg-[#00FF00] rounded-full animate-pulse shadow-[0_0_8px_#00FF00]" />
            Live Stream Processing
          </div>
        </div>
      </header>

      {/* Bento Container */}
      <main className="flex-1 p-6 grid grid-cols-4 grid-rows-3 gap-4 overflow-hidden">
        
        {/* BIG CARD: Engine Input & Processor (Col 1-2, Row 1-2) */}
        <div className={cn(
          "col-span-2 row-span-2 bg-white border border-card-border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col transition-all duration-500",
          activeMode === "HOT" ? "border-l-4 border-l-glovo-red" : "border-l-4 border-l-glovo-blue"
        )}>

           <div className="flex justify-between items-center mb-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-glovo-yellow" />
              Logistics Infrastructure Engine
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setInputLines("")}
                className="text-[10px] uppercase font-bold text-slate-400 hover:text-glovo-black transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setInputLines(JSON.stringify(activeMode === "HOT" ? HOT_EXAMPLE : COLD_EXAMPLE, null, 2))}
                className="text-[10px] uppercase font-bold text-glovo-yellow hover:text-orange-500 transition-colors bg-glovo-black px-3 py-1 rounded-md"
              >
                Example
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative group">
            <textarea
              value={inputLines}
              onChange={(e) => setInputLines(e.target.value)}
              className="w-full h-full bg-slate-50 rounded-xl p-5 font-mono text-sm text-glovo-black border border-card-border focus:border-glovo-yellow focus:ring-4 focus:ring-glovo-yellow/5 transition-all resize-none block outline-none"
              placeholder="Paste analysis payload here..."
              spellCheck={false}
            />
            
            <button 
              onClick={handleProcess}
              disabled={loading || !inputLines}
              className={cn(
                "absolute bottom-4 right-4 px-6 py-3 rounded-full flex items-center gap-3 font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-95",
                loading 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : activeMode === "HOT" 
                    ? "bg-glovo-red hover:bg-red-600 text-white shadow-glovo-red/30"
                    : "bg-glovo-blue hover:bg-blue-600 text-white shadow-glovo-blue/30"
              )}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{loading ? "Neural Core Processing..." : `${activeMode} Mode`}</span>
            </button>
          </div>
        </div>

        {/* ANALYSIS RESULT CARD (Col 3, Row 1-2) */}
        <div className="col-span-1 row-span-2 bg-white border border-card-border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-6">
            Active Analytics Context
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result-present"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {activeMode === "HOT" ? (
                    <>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Order Ref.</span>
                        <div className="text-2xl font-black">{JSON.parse(inputLines).order_id || "#ORD-SYSTEM"}</div>
                      </div>
                      
                      <div className="bg-[#FFF8E7] border border-dashed border-glovo-yellow p-4 rounded-xl">
                        <div className="text-[10px] font-extrabold text-[#856404] uppercase mb-1">Action Recommendation</div>
                        <div className="text-base font-bold text-glovo-black leading-tight">
                          {result.payload.resultado.accion_recomendada}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-card-border">
                          <span className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Priority</span>
                          <span className={cn(
                            "text-lg font-black",
                            result.payload.resultado.prioridad >= 4 ? "text-glovo-red" : "text-amber-500"
                          )}>P{result.payload.resultado.prioridad}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-card-border">
                          <span className="block text-[8px] uppercase font-bold text-slate-400 mb-1">Stability</span>
                          <span className="text-lg font-black text-glovo-green">OK</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="bg-glovo-green/5 border border-glovo-green/20 p-4 rounded-xl">
                          <div className="text-[10px] font-extrabold text-glovo-green uppercase mb-2">Strategy Brief</div>
                          <p className="text-xs font-semibold leading-relaxed">
                            {result.payload.resultado.recomendacion_estrategica}
                          </p>
                        </div>

                        <div className="space-y-2">
                           <div className="text-[10px] font-extrabold text-slate-400 uppercase">Critical Zones {">"}15%</div>
                           <div className="space-y-1">
                             {result.payload.resultado.zonas_criticas?.map((z: string) => (
                               <div key={z} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                 <span className="text-xs font-bold">{z}</span>
                                 <ChevronRight className="w-3 h-3 text-glovo-red" />
                               </div>
                             ))}
                             {(!result.payload.resultado.zonas_criticas || result.payload.resultado.zonas_criticas.length === 0) && (
                               <div className="text-xs text-slate-400 py-4 italic">No anomalies detected in grid.</div>
                             )}
                           </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                   <TrendingUp className="w-8 h-8 text-slate-200 mb-2" />
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-tighter italic">Waiting for Neural Stream</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          {result && (
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase">
              <span>Latency: {result.payload.metadatos.latencia_estimada}ms</span>
              <span>Idem: OK</span>
            </div>
          )}
        </div>

        {/* METADATA STATS (Col 4, Row 1) */}
        <div className="col-span-1 row-span-1 bg-white border border-card-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Processed Units</div>
          <div className="text-5xl font-black -mt-2">
            {result ? `${(result.payload.metadatos.tokens_procesados / 1000).toFixed(1)}k` : "1.2M"}
          </div>
          <div className="flex justify-between items-center">
             <span className="text-[9px] font-bold text-slate-400 uppercase">Retry Recommended</span>
             <span className={cn(
               "text-[9px] font-black uppercase",
               result?.control_error?.retry_recommended ? "text-glovo-red" : "text-glovo-green"
             )}>
                {result?.control_error?.retry_recommended ? "True" : "False"}
             </span>
          </div>
        </div>

        {/* JSON OUTPUT (Col 4, Row 2) */}
        <div className="col-span-1 row-span-1 bg-glovo-black border border-glovo-black rounded-2xl p-6 shadow-xl flex flex-col text-green-500">
           <div className="text-[10px] uppercase font-bold text-white/40 tracking-widest mb-4 flex items-center justify-between">
             <span>Result Stream</span>
             <Code className="w-3 h-3" />
           </div>
           <div className="flex-1 font-mono text-[9px] leading-relaxed overflow-hidden opacity-90 select-all">
             {result ? (
               <div className="custom-scrollbar h-full overflow-y-auto">
                 {JSON.stringify(result, null, 2)}
               </div>
             ) : (
               <div className="text-white/20 italic">{"{ \"status\": \"idle\" }"}</div>
             )}
           </div>
        </div>

        {/* COLD ANALYSIS SUMMARY (Col 1-2, Row 3) */}
        <div className="col-span-2 row-span-1 bg-white border border-card-border rounded-2xl p-6 shadow-sm flex flex-col">
           <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-4">Executive Operations Highlights</div>
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             {result && result.payload.resultado.resumen_ejecutivo ? (
               <p className="text-sm font-medium leading-relaxed">
                 {result.payload.resultado.resumen_ejecutivo}
               </p>
             ) : (
               <div className="h-full flex items-center justify-center">
                 <p className="text-xs font-bold text-slate-300 italic uppercase">System ready for intelligence output</p>
               </div>
             )}
           </div>
           {result && activeMode === "COLD" && (
             <div className="mt-3 flex gap-2">
               <span className="bg-glovo-green/10 text-glovo-green text-[8px] font-black uppercase px-2 py-0.5 rounded border border-glovo-green/20">
                 Duplicates Filtered
               </span>
               <span className="bg-glovo-yellow text-glovo-black text-[8px] font-black uppercase px-2 py-0.5 rounded">
                 Analysis v1.0
               </span>
             </div>
           )}
        </div>

        {/* EVENTS MINI GRID (Col 3-4, Row 3) */}
        <div className="col-span-2 row-span-1 bg-white border border-card-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-2">
              <Database className="w-3 h-3" /> Historical Ledger
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  i <= history.length ? "bg-glovo-yellow" : "bg-bg-gray"
                )} />
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {history.length > 0 ? (
              history.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 font-mono text-[9px]">
                   <div className="flex items-center gap-3">
                     <span className={cn(
                       "w-1 h-3 rounded-full",
                       h.modo === "HOT" ? "bg-glovo-red" : "bg-glovo-blue"
                     )} />
                     <span className="text-glovo-black font-bold tracking-tighter">[{new Date().toLocaleTimeString()}]</span>
                     <span className="bg-slate-100 px-1.5 rounded font-black">{h.modo}</span>
                   </div>
                   <span className="text-slate-400 truncate max-w-[120px]">
                     {h.payload.resultado.idempotency_key || "COLD_BATCH"}
                   </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center opacity-20">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-900">Ledger Empty</p>
              </div>
            )}
          </div>
        </div>

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
