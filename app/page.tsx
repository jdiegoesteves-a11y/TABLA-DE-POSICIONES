"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

// --- COMPONENTE DE VISTA DEPORTIVA ---
function VistaDeportiva({ genero, deporte, categoria }: { genero: string, deporte: string, categoria: string }) {
  const [tabla, setTabla] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [calendario, setCalendario] = useState<any[]>([]);
  const [goleadores, setGoleadores] = useState<{ nombre: string; goles: number }[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    // 1. Cargar EQUIPOS
    const unsubE = onSnapshot(collection(db, "equipos"), (sEquipos) => {
      const equiposData = sEquipos.docs.map(d => d.data());

      // 2. Cargar PARTIDOS (Filtrados por los 3 criterios)
      const qPartidos = query(
        collection(db, "partidos"),
        where("genero", "==", genero),
        where("deporte", "==", deporte),
        where("categoria", "==", categoria)
      );

      const unsubP = onSnapshot(qPartidos, (sPartidos) => {
        const partidosData = sPartidos.docs.map(d => ({ id: d.id, ...d.data() }));
        setPartidos(partidosData);

        const tablaTemp: any = {};
        const contadorGoles: { [key: string]: number } = {};

        // Inicializar equipos que pertenecen a esta rama
        equiposData.filter((e: any) => e.deporte === deporte && e.genero === genero).forEach((e: any) => {
          tablaTemp[e.nombre] = { nombre: e.nombre, puntos: 0, pj: 0, gf: 0, gc: 0, dg: 0 };
        });

        partidosData.forEach((p: any) => {
          if (tablaTemp[p.local] && tablaTemp[p.visitante]) {
            const gL = Number(p.golesLocal || 0);
            const gV = Number(p.golesVisitante || 0);
            tablaTemp[p.local].pj++; tablaTemp[p.visitante].pj++;
            tablaTemp[p.local].gf += gL; tablaTemp[p.local].gc += gV;
            tablaTemp[p.visitante].gf += gV; tablaTemp[p.visitante].gc += gL;
            tablaTemp[p.local].dg = tablaTemp[p.local].gf - tablaTemp[p.local].gc;
            tablaTemp[p.visitante].dg = tablaTemp[p.visitante].gf - tablaTemp[p.visitante].gc;

            if (gL > gV) tablaTemp[p.local].puntos += 3;
            else if (gL < gV) tablaTemp[p.visitante].puntos += 3;
            else { tablaTemp[p.local].puntos += 1; tablaTemp[p.visitante].puntos += 1; }
          }
          // Procesar Goleadores
          const procesarGoles = (texto: string) => {
            if (!texto) return;
            texto.split(",").forEach(item => {
              const nombre = item.trim().split('(')[0].trim();
              const match = item.match(/\((\d+)\)/);
              const cantidad = match ? parseInt(match[1]) : 1;
              if (nombre) contadorGoles[nombre] = (contadorGoles[nombre] || 0) + cantidad;
            });
          };
          procesarGoles(p.goleadoresLocal);
          procesarGoles(p.goleadoresVisitante);
        });

        setTabla(Object.values(tablaTemp).sort((a: any, b: any) => b.puntos - a.puntos || b.dg - a.dg));
        setGoleadores(Object.entries(contadorGoles).map(([nombre, goles]) => ({ nombre, goles })).sort((a, b) => b.goles - a.goles).slice(0, 8));
      });

      // 3. Cargar CALENDARIO
      const qCal = query(
        collection(db, "calendario"),
        where("genero", "==", genero),
        where("deporte", "==", deporte),
        where("categoria", "==", categoria),
        orderBy("fecha", "asc")
      );
      const unsubC = onSnapshot(qCal, (sCal) => {
        setCalendario(sCal.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { unsubP(); unsubC(); };
    });

    return () => unsubE();
  }, [genero, deporte, categoria]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginTop: "10px" }}>
      
      {/* TARJETA PRÓXIMOS PARTIDOS */}
      <div style={cardStyle}>
        <div style={headerYellow}>📅 CALENDARIO PRÓXIMO</div>
        <div style={{ padding: "15px" }}>
          {calendario.length === 0 ? <p style={emptyText}>Sin partidos programados.</p> : 
            calendario.slice(0, 4).map((p, i) => (
              <div key={i} style={rowItem}>
                <span style={{ fontWeight: "600" }}>{p.local} <span style={{color: "#fbbf24"}}>VS</span> {p.visitante}</span>
                <span style={badgeStyle}>{p.fecha} • {p.hora}</span>
              </div>
          ))}
        </div>
      </div>

      {/* TABLA DE POSICIONES */}
      <div style={cardStyle}>
        <div style={headerBlue}>🏆 CLASIFICACIÓN {categoria.toUpperCase()}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#f8fafc" }}>
            <thead>
              <tr style={{ backgroundColor: "#334155", fontSize: "0.75rem" }}>
                <th style={thStyle}>CLUB</th>
                <th style={thStyle}>PJ</th>
                <th style={thStyle}>DG</th>
                <th style={thStyle}>PTS</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #334155", backgroundColor: i === 0 ? "#1e293b" : "transparent" }}>
                  <td onClick={() => setEquipoSeleccionado(e.nombre)} style={tdTeam}>{i === 0 && "🥇 "}{e.nombre}</td>
                  <td style={tdCenter}>{e.pj}</td>
                  <td style={tdCenter}>{e.dg}</td>
                  <td style={tdPoints}>{e.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP GOLEADORES */}
      <div style={cardStyle}>
        <div style={headerYellow}>⚽ LÍDERES DE GOLEO</div>
        <div style={{ padding: "15px" }}>
          {goleadores.length === 0 ? <p style={emptyText}>Esperando resultados...</p> : 
            goleadores.map((g, i) => (
              <div key={i} style={rowItem}>
                <span style={{color: i === 0 ? "#fbbf24" : "white"}}>{i + 1}. {g.nombre}</span>
                <span style={{fontWeight: "bold"}}>{g.goles} Goles</span>
              </div>
            ))}
        </div>
      </div>

      {/* HISTORIAL DETALLADO (MODAL) */}
      {equipoSeleccionado && (
        <div style={modalOverlay} onClick={() => setEquipoSeleccionado(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
              <h3 style={{color: "#fbbf24", margin: 0}}>Historial: {equipoSeleccionado}</h3>
              <button onClick={() => setEquipoSeleccionado(null)} style={btnClose}>✖</button>
            </div>
            {partidos.filter(p => p.local === equipoSeleccionado || p.visitante === equipoSeleccionado).map((p: any, i) => (
              <div key={i} style={historyItem}>
                <div style={{fontSize: "0.9rem"}}>{p.local} <b>{p.golesLocal} - {p.golesVisitante}</b> {p.visitante}</div>
                <div style={{fontSize: "0.7rem", color: "#94a3b8"}}>MVP: {p.mvp || "No definido"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- DASHBOARD PRINCIPAL ---
export default function Dashboard() {
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState({ genero: "", deporte: "", categoria: "" });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "'Inter', sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", fontSize: "1.8rem", fontWeight: "800", letterSpacing: "-1px", marginBottom: "30px", color: "#fff" }}>
          TOP<span style={{color: "#fbbf24"}}>SCORE</span> PRO
        </h1>

        {step < 4 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>Selecciona los filtros para ver resultados</p>
            {step === 1 && ["Varones", "Damas"].map(g => (
              <button key={g} style={btnStep} onClick={() => { setSel({...sel, genero: g}); setStep(2); }}>{g}</button>
            ))}
            {step === 2 && ["Futbol", "Volley", "Basket"].map(d => (
              <button key={d} style={btnStep} onClick={() => { setSel({...sel, deporte: d}); setStep(3); }}>{d}</button>
            ))}
            {step === 3 && ["Inferior", "Intermedia", "Superior"].map(c => (
              <button key={c} style={btnStep} onClick={() => { setSel({...sel, categoria: c}); setStep(4); }}>{c}</button>
            ))}
          </div>
        ) : (
          <>
            <button onClick={() => setStep(1)} style={btnBack}>← Volver al Menú</button>
            <VistaDeportiva {...sel} />
          </>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS PROFESIONALES (CSS-in-JS) ---
const cardStyle = { backgroundColor: "#1e293b", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.4)", border: "1px solid #334155" };
const headerBlue = { backgroundColor: "#2563eb", color: "white", padding: "12px 15px", fontWeight: "bold", fontSize: "0.9rem", letterSpacing: "1px" };
const headerYellow = { backgroundColor: "#fbbf24", color: "#0f172a", padding: "12px 15px", fontWeight: "bold", fontSize: "0.9rem", letterSpacing: "1px" };
const thStyle = { padding: "12px", textAlign: "left" as const, color: "#94a3b8", fontWeight: "600" };
const tdTeam = { padding: "15px 12px", fontWeight: "bold", cursor: "pointer", textDecoration: "underline", color: "#3b82f6" };
const tdCenter = { textAlign: "center" as const, padding: "15px 12px" };
const tdPoints = { textAlign: "center" as const, padding: "15px 12px", fontWeight: "900", color: "#fbbf24", fontSize: "1.1rem" };
const btnStep = { padding: "18px", borderRadius: "12px", border: "1px solid #334155", backgroundColor: "#1e293b", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" };
const btnBack = { marginBottom: "15px", background: "none", border: "none", color: "#fbbf24", cursor: "pointer", fontWeight: "bold" };
const emptyText = { textAlign: "center" as const, color: "#64748b", fontSize: "0.85rem", padding: "20px" };
const rowItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #334155", fontSize: "0.85rem" };
const badgeStyle = { backgroundColor: "#334155", padding: "4px 8px", borderRadius: "6px", fontSize: "0.75rem", color: "#cbd5e1" };
const modalOverlay = { position: "fixed" as const, top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "20px" };
const modalContent = { backgroundColor: "#1e293b", padding: "25px", borderRadius: "20px", width: "100%", maxWidth: "400px", border: "1px solid #fbbf24" };
const historyItem = { backgroundColor: "#0f172a", padding: "12px", borderRadius: "10px", marginBottom: "10px" };
const btnClose = { background: "none", border: "none", color: "#f8fafc", fontSize: "1.2rem", cursor: "pointer" };