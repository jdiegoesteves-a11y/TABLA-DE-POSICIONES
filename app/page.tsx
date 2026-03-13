"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";

// --- COMPONENTE DE LA VISTA DEPORTIVA COMPLETA ---
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

      // 2. Cargar PARTIDOS JUGADOS (Filtrados)
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

        // Inicializar equipos que pertenecen a este deporte/genero
        equiposData.filter((e: any) => e.deporte === deporte && e.genero === genero).forEach((e: any) => {
          tablaTemp[e.nombre] = { nombre: e.nombre, puntos: 0, pj: 0, gf: 0, gc: 0, dg: 0 };
        });

        // Calcular Estadísticas y Goleadores
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

          // Lógica de Goleadores
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
        setGoleadores(Object.entries(contadorGoles).map(([nombre, goles]) => ({ nombre, goles })).sort((a, b) => b.goles - a.goles).slice(0, 5));
      });

      // 3. Cargar CALENDARIO (Filtrado)
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
      
      {/* 1. PRÓXIMOS PARTIDOS */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ backgroundColor: "#1e293b", color: "#fbbf24", padding: "10px", fontWeight: "bold", textAlign: "center" }}>📅 PRÓXIMOS ENCUENTROS</div>
        <div style={{ padding: "10px" }}>
          {calendario.length === 0 ? <p style={{fontSize: "0.8rem", textAlign: "center"}}>No hay partidos agendados</p> : 
            calendario.slice(0, 3).map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px solid #eee", padding: "5px 0" }}>
                <span>{p.local} vs {p.visitante}</span>
                <span style={{ fontWeight: "bold" }}>{p.fecha}</span>
              </div>
          ))}
        </div>
      </div>

      {/* 2. TABLA DE POSICIONES */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ backgroundColor: "#0f172a", color: "white", padding: "10px", fontWeight: "bold" }}>🏆 TABLA {categoria.toUpperCase()}</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>EQUIPO</th>
              <th style={{ padding: "10px" }}>PJ</th>
              <th style={{ padding: "10px" }}>DG</th>
              <th style={{ padding: "10px" }}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((e, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td onClick={() => setEquipoSeleccionado(e.nombre)} style={{ padding: "10px", fontWeight: "bold", color: "#1e40af", cursor: "pointer", textDecoration: "underline" }}>{e.nombre}</td>
                <td style={{ textAlign: "center" }}>{e.pj}</td>
                <td style={{ textAlign: "center" }}>{e.dg}</td>
                <td style={{ textAlign: "center", fontWeight: "bold" }}>{e.puntos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. GOLEADORES */}
      <div style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <div style={{ backgroundColor: "#0f172a", color: "#fbbf24", padding: "10px", fontWeight: "bold" }}>⚽ TOP GOLEADORES</div>
        <div style={{ padding: "10px" }}>
          {goleadores.map((g, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "5px 0" }}>
              <span>{g.nombre}</span>
              <span style={{ fontWeight: "bold" }}>{g.goles}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. HISTORIAL DETALLADO (MODAL/POPUP) */}
      {equipoSeleccionado && (
        <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "12px", border: "2px solid #0f172a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Historial: {equipoSeleccionado}</h3>
            <button onClick={() => setEquipoSeleccionado(null)}>Cerrar</button>
          </div>
          {partidos.filter(p => p.local === equipoSeleccionado || p.visitante === equipoSeleccionado).map((p: any, i) => (
            <div key={i} style={{ fontSize: "0.8rem", padding: "8px", backgroundColor: "#f8fafc", marginBottom: "5px", borderRadius: "5px" }}>
              <b>{p.local} {p.golesLocal} - {p.golesVisitante} {p.visitante}</b>
              <div style={{ color: "#64748b" }}>MVP: {p.mvp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- SELECTOR PRINCIPAL ---
export default function Dashboard() {
  const [step, setStep] = useState(1);
  const [sel, setSel] = useState({ genero: "", deporte: "", categoria: "" });

  return (
    <div style={{ padding: "20px", backgroundColor: "#5b7ea1", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "white", textShadow: "1px 1px 2px black" }}>🏆 TORNEO INTERNO</h1>
      
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        {step === 1 && (
          <div style={{ display: "flex", gap: "10px" }}>
            {["Varones", "Damas"].map(g => (
              <button key={g} style={{ flex: 1, padding: "20px", fontWeight: "bold" }} onClick={() => { setSel({...sel, genero: g}); setStep(2); }}>{g}</button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", gap: "10px" }}>
            {["Futbol", "Volley", "Basket"].map(d => (
              <button key={d} style={{ flex: 1, padding: "20px", fontWeight: "bold" }} onClick={() => { setSel({...sel, deporte: d}); setStep(3); }}>{d}</button>
            ))}
          </div>
        )}
        {step === 3 && (
          <div style={{ display: "flex", gap: "10px" }}>
            {["Inferior", "Intermedia"].map(c => (
              <button key={c} style={{ flex: 1, padding: "20px", fontWeight: "bold" }} onClick={() => { setSel({...sel, categoria: c}); setStep(4); }}>{c}</button>
            ))}
          </div>
        )}
        {step === 4 && (
          <>
            <button onClick={() => setStep(1)} style={{ marginBottom: "10px", padding: "5px 10px", cursor: "pointer" }}>← Cambiar Categoría</button>
            <VistaDeportiva {...sel} />
          </>
        )}
      </div>
    </div>
  );
}


