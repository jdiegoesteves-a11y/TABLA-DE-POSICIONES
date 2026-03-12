"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Tabla() {
  const [tabla, setTabla] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [goleadores, setGoleadores] = useState<{ nombre: string; goles: number }[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);

  const calcularEstadisticas = (equiposDocs: any[], partidosDocs: any[]) => {
    const tablaTemp: any = {};
    const contadorGoles: { [key: string]: number } = {};

    equiposDocs.forEach((doc) => {
      const data = doc.data();
      tablaTemp[data.nombre] = { nombre: data.nombre, puntos: 0, pj: 0, gf: 0, gc: 0 };
    });

    partidosDocs.forEach((doc) => {
      const p = doc.data();
      if (tablaTemp[p.local] && tablaTemp[p.visitante]) {
        tablaTemp[p.local].pj++; tablaTemp[p.visitante].pj++;
        const gL = Number(p.golesLocal || 0); const gV = Number(p.golesVisitante || 0);
        tablaTemp[p.local].gf += gL; tablaTemp[p.local].gc += gV;
        tablaTemp[p.visitante].gf += gV; tablaTemp[p.visitante].gc += gL;
        if (gL > gV) tablaTemp[p.local].puntos += 3;
        else if (gL < gV) tablaTemp[p.visitante].puntos += 3;
        else { tablaTemp[p.local].puntos += 1; tablaTemp[p.visitante].puntos += 1; }
      }
      const procesarGoles = (texto: string) => {
        if (!texto) return;
        texto.split(",").forEach(item => {
          const parte = item.trim();
          const nombre = parte.split('(')[0].trim();
          const match = parte.match(/\((\d+)\)/);
          const cantidad = match ? parseInt(match[1]) : 1;
          if (nombre) contadorGoles[nombre] = (contadorGoles[nombre] || 0) + cantidad;
        });
      };
      procesarGoles(p.goleadoresLocal || "");
      procesarGoles(p.goleadoresVisitante || "");
    });
    setTabla(Object.values(tablaTemp).sort((a: any, b: any) => b.puntos - a.puntos || a.gc - b.gc));
    setGoleadores(Object.entries(contadorGoles).map(([nombre, goles]) => ({ nombre, goles })).sort((a, b) => b.goles - a.goles).slice(0, 10));
  };

  useEffect(() => {
    let equiposData: any[] = [];
    let partidosData: any[] = [];
    const unsubE = onSnapshot(collection(db, "equipos"), (s) => { equiposData = s.docs; calcularEstadisticas(equiposData, partidosData); });
    const unsubP = onSnapshot(collection(db, "partidos"), (s) => { 
      setPartidos(s.docs.map(d => ({id: d.id, ...d.data()}))); 
      partidosData = s.docs;
      calcularEstadisticas(equiposData, partidosData); 
    });
    return () => { unsubE(); unsubP(); };
  }, []);

  return (
    <div style={{ padding: "20px 10px", backgroundColor: "#F8FAFC", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px", fontSize: "1.5rem", color: "#0F172A" }}>🏆 DASHBOARD</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* TABLA */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflowX: "auto" }}>
          <div style={{ backgroundColor: "#0F172A", color: "#FFFFFF", padding: "12px", fontWeight: "bold" }}>Tabla de Posiciones</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>EQUIPO</th>
                <th style={{ padding: "10px" }}>PJ</th>
                <th style={{ padding: "10px" }}>GF</th>
                <th style={{ padding: "10px" }}>GC</th>
                <th style={{ padding: "10px" }}>PTS</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((e, i) => {
                const esTop2 = i < 2;
                return (
                  <tr key={e.nombre} style={{ backgroundColor: esTop2 ? "#F0FDF4" : "transparent", borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 8px", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }} onClick={() => setEquipoSeleccionado(e.nombre)}>
                      {esTop2 ? "⭐ " : ""} {e.nombre}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{e.pj}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{e.gf}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>{e.gc}</td>
                    <td style={{ padding: "12px", textAlign: "center", fontWeight: "800", color: "#B45309" }}>{e.puntos}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* GOLEADORES */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <div style={{ backgroundColor: "#0F172A", color: "#F59E0B", padding: "12px", fontWeight: "bold" }}>⚽ TOP GOLEADORES</div>
          <div style={{ padding: "10px" }}>
            {goleadores.map((g, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.85rem" }}>
                <span style={{ fontWeight: "500" }}>{g.nombre}</span>
                <span style={{ fontWeight: "800" }}>{g.goles}</span>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORIAL DETALLADO */}
        {equipoSeleccionado && (
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Historial: {equipoSeleccionado}</h2>
              <button onClick={() => setEquipoSeleccionado(null)} style={{ padding: "5px 10px", cursor: "pointer", backgroundColor: "#0F172A", color: "#fff", border: "none", borderRadius: "4px" }}>Cerrar</button>
            </div>
            {partidos.filter(p => p.local === equipoSeleccionado || p.visitante === equipoSeleccionado).map((p) => (
              <div key={p.id} style={{ padding: "12px", backgroundColor: "#F8FAFC", marginBottom: "10px", borderRadius: "8px", borderLeft: "4px solid #B45309" }}>
                <div style={{ fontWeight: "700", marginBottom: "5px" }}>{p.local} <span style={{ color: "#B45309" }}>{p.golesLocal} - {p.golesVisitante}</span> {p.visitante}</div>
                <div style={{ fontSize: "0.8rem", color: "#475569" }}>⚽ Goleadores: {p.goleadoresLocal || "---"} | {p.goleadoresVisitante || "---"}</div>
                <div style={{ fontSize: "0.8rem", color: "#475569" }}>⭐ MVP: {p.mvp || "---"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}