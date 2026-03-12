"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Tabla() {
  const [tabla, setTabla] = useState<any[]>([]);
  const [partidos, setPartidos] = useState<any[]>([]);
  const [goleadores, setGoleadores] = useState<{ nombre: string; goles: number }[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);

  // ... (Tu función calcularEstadisticas se mantiene igual) ...
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
    const unsubE = onSnapshot(collection(db, "equipos"), (s) => { calcularEstadisticas(s.docs, partidos.map(p => ({ data: () => p }))); });
    const unsubP = onSnapshot(collection(db, "partidos"), (s) => { 
      const pData = s.docs.map(d => ({id: d.id, ...d.data()}));
      setPartidos(pData);
      calcularEstadisticas([], s.docs); 
    });
    return () => { unsubE(); unsubP(); };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">🏆 DASHBOARD DE TORNEO</h1>

      {/* Contenedor principal: Cambia de columna a fila */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
        
        {/* Tabla responsiva */}
        <div className="flex-2 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-slate-900 text-white p-4 font-bold">Tabla de Posiciones</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="p-3 text-left">EQUIPO</th>
                  <th className="p-3">PJ</th>
                  <th className="p-3">GF</th>
                  <th className="p-3">PTS</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((e, i) => (
                  <tr key={e.nombre} className={`border-b ${i < 2 ? 'bg-green-50' : ''}`}>
                    <td className="p-3 font-semibold underline cursor-pointer" onClick={() => setEquipoSeleccionado(e.nombre)}>
                      {i < 2 ? "⭐ " : ""} {e.nombre}
                    </td>
                    <td className="p-3 text-center">{e.pj}</td>
                    <td className="p-3 text-center">{e.gf}</td>
                    <td className="p-3 text-center font-bold text-amber-700">{e.puntos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Goleadores */}
        <div className="lg:w-1/3 bg-white rounded-xl shadow-md p-6">
          <h2 className="font-bold text-amber-600 mb-4">⚽ TOP GOLEADORES</h2>
          {goleadores.map((g, i) => (
            <div key={i} className="flex justify-between py-2 border-b">
              <span>{g.nombre}</span>
              <span className="font-bold">{g.goles}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de partidos */}
      {equipoSeleccionado && (
        <div className="max-w-6xl mx-auto mt-6 bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Historial: {equipoSeleccionado}</h2>
            <button onClick={() => setEquipoSeleccionado(null)} className="bg-slate-900 text-white px-4 py-2 rounded-lg">Cerrar</button>
          </div>
          {partidos.filter(p => p.local === equipoSeleccionado || p.visitante === equipoSeleccionado).map((p) => (
            <div key={p.id} className="p-4 bg-slate-50 mb-3 rounded-lg border-l-4 border-amber-600 text-sm">
              <p className="font-bold">{p.local} <span className="text-amber-700">{p.golesLocal}-{p.golesVisitante}</span> {p.visitante}</p>
              <p className="text-slate-600">⚽ {p.goleadoresLocal || "---"} | {p.goleadoresVisitante || "---"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}