"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import Link from "next/link"; // Importado para la navegación

// --- COMPONENTE DE VISTA DEPORTIVA ---
function VistaDeportiva({ genero, deporte, categoria }: { genero: string, deporte: string, categoria: string }) {
  const [tabla, setTabla] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [calendario, setCalendario] = useState<any[]>([]);
  const [goleadores, setGoleadores] = useState<{ nombre: string; goles: number }[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const qEquipos = collection(db, "equipos");
      const qPartidos = query(
        collection(db, "partidos"),
        where("genero", "==", genero),
        where("deporte", "==", deporte),
        where("categoria", "==", categoria)
      );
      const qCal = query(
        collection(db, "calendario"),
        where("genero", "==", genero),
        where("deporte", "==", deporte),
        where("categoria", "==", categoria),
        orderBy("fecha", "asc")
      );

      let equiposActuales: any[] = [];
      let partidosActuales: any[] = [];

      const procesarDatos = (equipos: any[], partidosArr: any[]) => {
        const tablaTemp: any = {};
        const contadorGoles: { [key: string]: number } = {};

        equipos.filter((e: any) => e.deporte === deporte && e.genero === genero && e.categoria === categoria)
          .forEach((e: any) => {
            tablaTemp[e.nombre] = { nombre: e.nombre, puntos: 0, pj: 0, fav: 0, con: 0, dg: 0 };
          });

        partidosArr.forEach((p: any) => {
          if (tablaTemp[p.local] && tablaTemp[p.visitante]) {
            const valL = Number(p.golesLocal || 0);
            const valV = Number(p.golesVisitante || 0);
            
            tablaTemp[p.local].pj++; tablaTemp[p.visitante].pj++;
            tablaTemp[p.local].fav += valL; tablaTemp[p.local].con += valV;
            tablaTemp[p.visitante].fav += valV; tablaTemp[p.visitante].con += valL;
            
            tablaTemp[p.local].dg = tablaTemp[p.local].fav - tablaTemp[p.local].con;
            tablaTemp[p.visitante].dg = tablaTemp[p.visitante].fav - tablaTemp[p.visitante].con;

            if (valL > valV) tablaTemp[p.local].puntos += 3;
            else if (valL < valV) tablaTemp[p.visitante].puntos += 3;
            else { tablaTemp[p.local].puntos += 1; tablaTemp[p.visitante].puntos += 1; }
          }

          const procesarAnotadores = (texto: string) => {
            if (!texto) return;
            texto.split(",").forEach(item => {
              const nombre = item.trim().split('(')[0].trim();
              const match = item.match(/\((\d+)\)/);
              const cantidad = match ? parseInt(match[1]) : 1;
              if (nombre) contadorGoles[nombre] = (contadorGoles[nombre] || 0) + cantidad;
            });
          };
          procesarAnotadores(p.goleadoresLocal);
          procesarAnotadores(p.goleadoresVisitante);
        });

        setTabla(Object.values(tablaTemp).sort((a: any, b: any) => b.puntos - a.puntos || b.dg - a.dg));
        setGoleadores(Object.entries(contadorGoles).map(([nombre, goles]) => ({ nombre, goles })).sort((a, b) => b.goles - a.goles).slice(0, 8));
      };

      const unsubE = onSnapshot(qEquipos, (sEquipos) => {
        equiposActuales = sEquipos.docs.map(d => d.data());
        procesarDatos(equiposActuales, partidosActuales);
      }, (err) => { setError(err.message); setLoading(false); });

      const unsubP = onSnapshot(qPartidos, (sPartidos) => {
        partidosActuales = sPartidos.docs.map(d => ({ id: d.id, ...d.data() }));
        setPartidos(partidosActuales);
        procesarDatos(equiposActuales, partidosActuales);
        setLoading(false);
      }, (err) => { setError(err.message); setLoading(false); });

      const unsubC = onSnapshot(qCal, (sCal) => {
        setCalendario(sCal.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => { setError(err.message); });

      return () => { unsubE(); unsubP(); unsubC(); };

    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, [genero, deporte, categoria]);

  const labels = deporte === "Futbol" ? { f: "GF", c: "GC", t: "Goles" } : { f: "PF", c: "PC", t: "Puntos" };

  const renderDetalle = (p: any) => {
    if (deporte === "Volley") return null;
    const label = deporte === "Futbol" ? "⚽ Goles: " : "⭐ Puntos: ";
    const data = p.goleadoresLocal || p.goleadoresVisitante ? `${p.goleadoresLocal || ""} ${p.goleadoresVisitante || ""}` : "No registrados";
    return <div style={{fontSize: "0.75rem", marginTop: "5px"}}><span style={{color: "#fbbf24"}}>{label}</span> {data}</div>;
  };

  if (error) return <div style={{color: "#ef4444", padding: "20px", textAlign: "center"}}>⚠️ Error de conexión: {error}</div>;
  if (loading) return <div style={{color: "#94a3b8", padding: "40px", textAlign: "center", fontSize: "1.2rem"}}>Cargando estadísticas... ⏳</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
      
      {/* SECCIÓN CALENDARIO */}
      <div style={cardStyle}>
        <div style={headerYellow}>📅 PRÓXIMOS PARTIDOS</div>
        <div style={{ padding: "15px" }}>
          {calendario.length === 0 ? <p style={emptyText}>No hay encuentros agendados.</p> : 
            calendario.slice(0, 3).map((p, i) => (
              <div key={i} style={rowItem}>
                <span style={{ fontWeight: "700", color: "white" }}>{p.local} <span style={{color: "#fbbf24"}}>VS</span> {p.visitante}</span>
                <span style={badgeStyle}>📅 {p.fecha} • 🕒 {p.hora}</span>
              </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN TABLA */}
      <div style={cardStyle}>
        <div style={headerBlue}>🏆 TABLA {deporte.toUpperCase()}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#334155" }}>
                {["CLUB", "PJ", labels.f, labels.c, "DG", "PTS"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {tabla.map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #334155" }}>
                  <td onClick={() => setEquipoSeleccionado(e.nombre)} style={tdTeam}>{i === 0 && "🥇 "}{e.nombre}</td>
                  <td style={tdCenter}>{e.pj}</td><td style={tdCenter}>{e.fav}</td><td style={tdCenter}>{e.con}</td>
                  <td style={tdCenter}>{e.dg}</td><td style={tdPoints}>{e.puntos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCIÓN ANOTADORES */}
      <div style={cardStyle}>
        <div style={headerYellow}>🔥 LÍDERES ({labels.t.toUpperCase()})</div>
        <div style={{ padding: "15px" }}>
          {goleadores.length === 0 ? <p style={emptyText}>Aún no hay registros.</p> : 
            goleadores.map((g, i) => (
              <div key={i} style={rowItem}>
                <span style={{color: i === 0 ? "#fbbf24" : "white", fontWeight: "600"}}>{i+1}. {g.nombre}</span>
                <span style={{fontWeight: "900", color: "white"}}>{g.goles}</span>
              </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {equipoSeleccionado && (
        <div style={modalOverlay} onClick={() => setEquipoSeleccionado(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
              <h3 style={{color: "#fbbf24", margin: 0}}>{equipoSeleccionado}</h3>
              <button onClick={() => setEquipoSeleccionado(null)} style={btnClose}>✖</button>
            </div>
            {partidos.filter(p => p.local === equipoSeleccionado || p.visitante === equipoSeleccionado).length === 0 ? (
              <p style={{fontSize: "0.8rem", color: "#94a3b8", textAlign: "center"}}>No hay partidos jugados todavía.</p>
            ) : (
              partidos.filter(p => p.local === equipoSeleccionado || p.visitante === equipoSeleccionado).map((p, i) => (
                <div key={i} style={historyItem}>
                  <div style={{fontWeight: "bold", textAlign: "center", color: "white"}}>{p.local} {p.golesLocal} - {p.golesVisitante} {p.visitante}</div>
                  {renderDetalle(p)}
                  <div style={{fontSize: "0.75rem", marginTop: "3px"}}><span style={{color: "#fbbf24"}}>⭐ MVP:</span> {p.mvp || "No registrado"}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- DASHBOARD PRINCIPAL (SELECTORES) ---
export default function Dashboard() {
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState({ genero: "", deporte: "", categoria: "" });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "'Inter', sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        
        {/* BOTÓN ADMIN SUPERIOR */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <Link href="/Calendarios">
            <button style={{
              backgroundColor: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              padding: "5px 15px",
              borderRadius: "8px",
              fontSize: "0.7rem",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "0.3s"
            }}>
              ⚙️ ADMIN 
            </button>
          </Link>
        </div>

        <h1 style={{ textAlign: "center", fontWeight: "900", fontSize: "2rem", marginBottom: "30px", letterSpacing: "-1px" }}>
          COPOL<span style={{color: "#4ffb24"}}>SCORE</span>
        </h1>

        {step < 4 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", marginBottom: "10px"}}>PASO {step} DE 3</div>
            {step === 1 && ["Varones", "Damas"].map(g => (
              <button key={g} style={btnMain} onClick={() => { setSel({...sel, genero: g}); setStep(2); }}>{g}</button>
            ))}
            {step === 2 && ["Futbol", "Volley", "Basket"].map(d => (
              <button key={d} style={btnMain} onClick={() => { setSel({...sel, deporte: d}); setStep(3); }}>{d}</button>
            ))}
            {step === 3 && ["Inferior", "Intermedia", "Superior"].map(c => (
              <button key={c} style={btnMain} onClick={() => { setSel({...sel, categoria: c}); setStep(4); }}>{c}</button>
            ))}
          </div>
        ) : (
          <>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
              <span style={{fontSize: "0.8rem", color: "#94a3b8"}}>{sel.deporte} • {sel.genero} • {sel.categoria}</span>
              <button onClick={() => setStep(1)} style={{color: "#fbbf24", background: "none", border: "none", cursor: "pointer", fontWeight: "bold"}}>CAMBIAR</button>
            </div>
            <VistaDeportiva {...sel} />
          </>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS ---
const cardStyle = { backgroundColor: "#1e293b", borderRadius: "20px", overflow: "hidden", border: "1px solid #334155", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" };
const headerBlue = { backgroundColor: "#2563eb", color: "white", padding: "15px", fontWeight: "900", fontSize: "0.8rem", letterSpacing: "1px" };
const headerYellow = { backgroundColor: "#fbbf24", color: "#0f172a", padding: "15px", fontWeight: "900", fontSize: "0.8rem", letterSpacing: "1px" };
const thStyle = { padding: "12px", textAlign: "left" as const, color: "#94a3b8", fontSize: "0.65rem", textTransform: "uppercase" as const };
const tdTeam = { padding: "15px 12px", fontWeight: "bold", color: "#3b82f6", cursor: "pointer", textDecoration: "underline" };
const tdCenter = { textAlign: "center" as const, padding: "15px 12px", fontSize: "0.9rem", color: "white" };
const tdPoints = { textAlign: "center" as const, padding: "15px 12px", fontWeight: "900", color: "#fbbf24", fontSize: "1.2rem" };
const btnMain = { padding: "20px", borderRadius: "15px", border: "1px solid #334155", backgroundColor: "#1e293b", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "1.1rem", transition: "0.2s" };
const emptyText = { textAlign: "center" as const, color: "#64748b", padding: "20px", fontSize: "0.8rem" };
const rowItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #334155" };
const badgeStyle = { backgroundColor: "#334155", padding: "5px 10px", borderRadius: "8px", fontSize: "0.7rem", fontWeight: "bold", color: "white" };
const modalOverlay = { position: "fixed" as const, top:0, left:0, width:"100%", height:"100%", backgroundColor:"rgba(0,0,0,0.85)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:1000 };
const modalContent = { backgroundColor:"#1e293b", padding:"25px", borderRadius:"24px", width:"90%", maxWidth:"400px", border:"1px solid #fbbf24", maxHeight: "80vh", overflowY: "auto" as const };
const historyItem = { backgroundColor: "#0f172a", padding: "15px", borderRadius: "12px", marginBottom: "10px", border: "1px solid #334155" };
const btnClose = { background:"none", border:"none", color:"white", fontSize:"1.2rem", cursor:"pointer" };