"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import Link from "next/link";

/**
 * INTERFACES DE DATOS
 */
interface IEquipo { nombre: string; puntos: number; pj: number; gf: number; gc: number; dg: number; }
interface IPartido { id: string; local: string; visitante: string; golesLocal: number; golesVisitante: number; goleadoresLocal: string; goleadoresVisitante: string; fecha: string; hora: string; }
interface IGoleador { nombre: string; goles: number; }

/**
 * COMPONENTE VISTA DEPORTIVA (TABLAS Y CALENDARIO)
 */
function VistaDeportiva({ genero, deporte, categoria, onBack }: { 
  genero: string; deporte: string; categoria: string; onBack: () => void 
}) {
  const [tabla, setTabla] = useState<IEquipo[]>([]);
  const [calendario, setCalendario] = useState<IPartido[]>([]);
  const [goleadores, setGoleadores] = useState<IGoleador[]>([]);
  const [todosLosPartidos, setTodosLosPartidos] = useState<IPartido[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qEquipos = collection(db, "equipos");
    const qPartidos = query(collection(db, "partidos"), where("genero", "==", genero), where("deporte", "==", deporte), where("categoria", "==", categoria));
    const qCal = query(collection(db, "calendario"), where("genero", "==", genero), where("deporte", "==", deporte), where("categoria", "==", categoria), orderBy("fecha", "asc"));

    let equiposData: any[] = [];
    let partidosData: IPartido[] = [];

    const unsubE = onSnapshot(qEquipos, (s) => {
      equiposData = s.docs.map(d => d.data());
      calcularEstadisticas(equiposData, partidosData);
    });

    const unsubP = onSnapshot(qPartidos, (s) => {
      partidosData = s.docs.map(d => ({ id: d.id, ...d.data() } as IPartido));
      setTodosLosPartidos(partidosData); 
      calcularEstadisticas(equiposData, partidosData);
      setLoading(false);
    });

    const unsubC = onSnapshot(qCal, (s) => setCalendario(s.docs.map(d => ({ id: d.id, ...d.data() } as IPartido))));

    return () => { unsubE(); unsubP(); unsubC(); };
  }, [genero, deporte, categoria]);

  const calcularEstadisticas = (eqs: any[], pts: IPartido[]) => {
    const tablaTemp: Record<string, IEquipo> = {};
    const contGoles: Record<string, number> = {};

    eqs.filter(e => e.deporte === deporte && e.genero === genero && e.categoria === categoria)
       .forEach(e => tablaTemp[e.nombre] = { nombre: e.nombre, puntos: 0, pj: 0, gf: 0, gc: 0, dg: 0 });

    pts.forEach(p => {
      if (tablaTemp[p.local] && tablaTemp[p.visitante]) {
        const vL = Number(p.golesLocal || 0), vV = Number(p.golesVisitante || 0);
        tablaTemp[p.local].pj++; tablaTemp[p.visitante].pj++;
        tablaTemp[p.local].gf += vL; tablaTemp[p.local].gc += vV;
        tablaTemp[p.visitante].gf += vV; tablaTemp[p.visitante].gc += vL;
        tablaTemp[p.local].dg = tablaTemp[p.local].gf - tablaTemp[p.local].gc;
        tablaTemp[p.visitante].dg = tablaTemp[p.visitante].gf - tablaTemp[p.visitante].gc;
        
        if (vL > vV) tablaTemp[p.local].puntos += 3;
        else if (vL < vV) tablaTemp[p.visitante].puntos += 3;
        else { tablaTemp[p.local].puntos += 1; tablaTemp[p.visitante].puntos += 1; }
      }

      [p.goleadoresLocal, p.goleadoresVisitante].forEach(txt => {
        if (!txt) return;
        txt.split(",").forEach(item => {
          const n = item.trim().split('(')[0].trim();
          const m = item.match(/\((\d+)\)/);
          if (n) contGoles[n] = (contGoles[n] || 0) + (m ? parseInt(m[1]) : 1);
        });
      });
    });

    setTabla(Object.values(tablaTemp).sort((a, b) => b.puntos - a.puntos || b.dg - a.dg));
    setGoleadores(Object.entries(contGoles).map(([nombre, goles]) => ({ nombre, goles })).sort((a, b) => b.goles - a.goles).slice(0, 5));
  };

  const renderModalHistorial = () => {
    if (!equipoSeleccionado) return null;
    const historial = todosLosPartidos.filter(p => p.local === equipoSeleccionado || p.visitante === equipoSeleccionado);

    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <div style={modalHeaderStyle}>
            <h2>Historial: <span style={{color: '#4ffb24'}}>{equipoSeleccionado}</span></h2>
            <button onClick={() => setEquipoSeleccionado(null)} style={closeBtnStyle}>✕</button>
          </div>
          <div style={{marginTop: '20px'}}>
            {historial.length === 0 ? (
              <p style={{textAlign: 'center', color: '#94a3b8'}}>No hay partidos registrados aún.</p>
            ) : (
              historial.map(p => (
                <div key={p.id} style={historyMatchStyle}>
                  <div style={{flex: 1, textAlign: 'right', color: p.golesLocal > p.golesVisitante ? '#fff' : '#94a3b8'}}>{p.local}</div>
                  <div style={historyScoreStyle}>{p.golesLocal} - {p.golesVisitante}</div>
                  <div style={{flex: 1, textAlign: 'left', color: p.golesVisitante > p.golesLocal ? '#fff' : '#94a3b8'}}>{p.visitante}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={loaderStyle}>Cargando estadísticas...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", position: "relative" }}>
      {renderModalHistorial()}
      
      <section style={highlightCard}>
        <div style={{textAlign: 'center', marginBottom: '15px'}}>
          <span style={liveBadge}>📅 CALENDARIO DE JUEGOS</span>
        </div>
        
        {calendario.length > 0 ? (
          <>
            <div style={{ borderBottom: calendario.length > 1 ? '1px solid #334155' : 'none', paddingBottom: calendario.length > 1 ? '20px' : '0', marginBottom: '15px' }}>
               <div style={{...matchDisplay, gap: '40px'}}>
                 <span style={{...teamMain, fontSize: '1.8rem'}}>{calendario[0].local}</span>
                 <span style={{...vsCircle, width: '50px', height: '50px'}}>VS</span>
                 <span style={{...teamMain, fontSize: '1.8rem'}}>{calendario[0].visitante}</span>
               </div>
               <p style={{...timeTag, fontSize: '1.1rem', fontWeight: 'bold', color: '#4ffb24'}}>📅 {calendario[0].fecha} • 🕒 {calendario[0].hora}</p>
            </div>

            {calendario.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginTop: '20px' }}>
                {calendario.slice(1).map((p, i) => (
                  <div key={i} style={{ padding: '15px', background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                       <span style={{ fontSize: '1rem', fontWeight: '600' }}>{p.local} <span style={{color: '#64748b', fontSize:'0.8rem', margin:'0 5px'}}>vs</span> {p.visitante}</span>
                     </div>
                     <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                       📅 {p.fecha} • 🕒 {p.hora}
                     </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{textAlign: 'center', color: '#94a3b8'}}>Sin partidos programados</p>
        )}
      </section>

      <div style={gridContainer}>
         <div style={cardStyle}>
            <div style={cardHeader}>🏆 CLASIFICACIÓN DETALLADA</div>
            <div style={{overflowX: 'auto'}}>
              <table style={tableStyle}>
                 <thead>
                    <tr>
                      <th style={thS}>POS</th>
                      <th style={thSClub}>CLUB</th>
                      <th style={thS}>PJ</th>
                      <th style={thS}>GF</th>
                      <th style={thS}>GC</th>
                      <th style={thS}>DG</th>
                      <th style={thS}>PTS</th>
                    </tr>
                 </thead>
                 <tbody>
                    {tabla.map((e, i) => (
                       <tr key={i} style={rowStyle} onClick={() => setEquipoSeleccionado(e.nombre)}>
                          <td style={tdS}>{i + 1}</td>
                          <td style={tdSClub}>{e.nombre}</td>
                          <td style={tdS}>{e.pj}</td>
                          <td style={tdS}>{e.gf}</td>
                          <td style={tdS}>{e.gc}</td>
                          <td style={tdS}>{e.dg}</td>
                          <td style={{...tdS, color: '#4ffb24', fontWeight: '900'}}>{e.puntos}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
            </div>
         </div>

         <div style={cardStyle}>
            <div style={cardHeader}>🎯 TOP SCORERS</div>
            <div style={{marginTop: '20px'}}>
              {goleadores.length > 0 ? goleadores.map((g, i) => (
                 <div key={i} style={scorerRow}>
                    <span style={rankNumber}>{i + 1}</span>
                    <span style={scorerName}>{g.nombre}</span>
                    <span style={scoreBadge}>{g.goles}</span>
                 </div>
              )) : <p style={{color: '#94a3b8', textAlign: 'center'}}>Aún no hay goles registrados.</p>}
            </div>
         </div>
      </div>
    </div>
  );
}

/**
 * DASHBOARD PRINCIPAL
 */
export default function Dashboard() {
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState({ genero: "", deporte: "", categoria: "" });

  return (
    <div style={mainContainer}>
      <nav style={navBar}>
         <div style={logo}>COPOL<span style={{color: '#4ffb24'}}>SCORE</span></div>
         <Link href="/Calendarios"><button style={adminCircle}>⚙️</button></Link>
      </nav>

      <main style={{maxWidth: '1200px', margin: '0 auto', padding: '30px 20px'}}>
        {step > 1 && step < 4 && (
          <button onClick={() => setStep(step - 1)} style={backButtonStyle}>← Volver atrás</button>
        )}

        {[
          { title: "GÉNERO", key: "genero", opts: ["Varones", "Damas"] },
          { title: "DEPORTE", key: "deporte", opts: ["Futbol", "Volley", "Basket"] },
          { title: "CATEGORÍA", key: "categoria", opts: ["Inferior", "Intermedia", "Superior"] }
        ].map((s, idx) => step === idx + 1 && (
           <div key={s.key} style={selectionContainer}>
             <h1 style={selectionTitle}>Selecciona {s.title}</h1>
             <div style={gridButtons}>
               {s.opts.map(opt => (
                 <button key={opt} style={modernBtn} onClick={() => {setSel({...sel, [s.key]: opt}); setStep(idx + 2);}}>
                   {opt}
                 </button>
               ))}
             </div>

             {/* LOGO COPOL: Visible en los 3 pasos de selección inicial */}
             <div style={logoBottomContainer}>
               <img 
                 src="/logo-copol.png" 
                 alt="Logo Copol" 
                 style={logoBottomStyle} 
               />
             </div>
           </div>
        ))}

        {step === 4 && (
          <div>
            <div style={infoBar}>
               <div style={breadcrumbStyle}>
                 <button onClick={() => setStep(3)} style={backArrowStyle}>← Volver</button>
                 <span>{sel.deporte} • {sel.genero} • {sel.categoria}</span>
               </div>
               <button onClick={() => setStep(1)} style={resetBtn}>REINICIAR FILTRO</button>
            </div>
            <VistaDeportiva {...sel} onBack={() => setStep(3)} />
          </div>
        )}
      </main>
    </div>
  );
}

// --- ESTILOS ---
const mainContainer = { backgroundColor: '#0b1120', minHeight: '100vh', color: '#f8fafc', fontFamily: '"Inter", sans-serif', paddingBottom: '50px' };
const navBar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 50px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b' };
const logo = { fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px' };
const adminCircle = { background: '#1e293b', border: '1px solid #334155', color: '#fff', cursor: 'pointer', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center' };

const selectionContainer = { textAlign: 'center' as const, marginTop: '8vh' };
const selectionTitle = { color: '#f8fafc', fontSize: '2rem', fontWeight: '600', marginBottom: '40px' };
const gridButtons = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '900px', margin: '0 auto' };
const modernBtn = { padding: '40px 20px', borderRadius: '24px', background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', cursor: 'pointer', fontSize: '1.4rem', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' };

// ESTILOS DEL LOGO COPOL
const logoBottomContainer = { marginTop: '50px', display: 'flex', justifyContent: 'center', width: '100%' };
const logoBottomStyle = { width: '180px', height: 'auto', opacity: 0.9 };

const highlightCard = { background: '#1e293b', padding: '40px 20px', borderRadius: '24px', border: '1px solid #334155', marginBottom: '10px' };
const cardStyle = { backgroundColor: '#1e293b', borderRadius: '24px', padding: '30px', border: '1px solid #334155' };
const cardHeader = { marginBottom: '25px', fontSize: '1rem', color: '#cbd5e1', fontWeight: '700', letterSpacing: '1px' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' };
const liveBadge = { fontSize: '0.8rem', background: '#4ffb24', color: '#0b1120', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold' };
const matchDisplay = { display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center', marginTop: '20px' };
const vsCircle = { border: '2px solid #4ffb24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ffb24', fontWeight: 'bold' };
const teamMain = { width: '35%', textAlign: 'center' as const, fontWeight: '800' };
const timeTag = { textAlign: 'center' as const, color: '#94a3b8', marginTop: '20px' };

const tableStyle = { width: '100%', borderCollapse: 'collapse' as const };
const thS = { padding: '15px 10px', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' as const };
const thSClub = { ...thS, textAlign: 'left' as const };
const tdS = { padding: '18px 10px', fontSize: '1rem', textAlign: 'center' as const };
const tdSClub = { ...tdS, textAlign: 'left' as const, fontWeight: '600', color: '#60a5fa' };
const rowStyle = { borderBottom: '1px solid #334155', cursor: 'pointer' };

const scorerRow = { display: 'flex', padding: '15px 20px', background: '#0f172a', borderRadius: '16px', marginBottom: '10px', alignItems: 'center' };
const rankNumber = { color: '#64748b', fontWeight: 'bold', width: '30px' };
const scorerName = { flex: 1, fontSize: '1.1rem' };
const scoreBadge = { background: '#334155', padding: '5px 15px', borderRadius: '10px', fontWeight: 'bold' };

const infoBar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const breadcrumbStyle = { display: 'flex', alignItems: 'center', gap: '15px', color: '#94a3b8' };
const backArrowStyle = { background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer' };
const resetBtn = { background: 'none', border: 'none', color: '#4ffb24', cursor: 'pointer', fontWeight: 'bold' };
const backButtonStyle = { background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', marginBottom: '30px' };
const loaderStyle = { padding: '100px', textAlign: 'center' as const, color: '#4ffb24', fontWeight: 'bold' };

const modalOverlayStyle = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 17, 32, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' };
const modalContentStyle = { backgroundColor: '#1e293b', borderRadius: '24px', padding: '40px', width: '95%', maxWidth: '550px', border: '1px solid #334155' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '20px' };
const closeBtnStyle = { background: '#334155', border: 'none', color: '#fff', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer' };
const historyMatchStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #334155' };
const historyScoreStyle = { background: '#0f172a', padding: '8px 20px', borderRadius: '12px', fontWeight: '900', color: '#4ffb24' };