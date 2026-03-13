"use client";

import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

// --- COMPONENTE DE LA TABLA FILTRADA ---
function TablaFiltrada({ genero, deporte, categoria }: { genero: string, deporte: string, categoria: string }) {
  const [tabla, setTabla] = useState<any[]>([]);
  const [calendario, setCalendario] = useState<any[]>([]);

  useEffect(() => {
    // 1. Escuchar EQUIPOS (General)
    const unsubE = onSnapshot(collection(db, "equipos"), (snapshot) => {
      const equiposData = snapshot.docs.map(d => d.data());
      
      // 2. Escuchar PARTIDOS filtrados por los 3 criterios
      const qPartidos = query(
        collection(db, "partidos"),
        where("genero", "==", genero),
        where("deporte", "==", deporte),
        where("categoria", "==", categoria)
      );

      const unsubP = onSnapshot(qPartidos, (sPartidos) => {
        const partidosDocs = sPartidos.docs.map(d => d.data());
        const tablaTemp: any = {};

        // Inicializar equipos
        equiposData.forEach((e: any) => {
          tablaTemp[e.nombre] = { nombre: e.nombre, puntos: 0, pj: 0, gf: 0, gc: 0, dg: 0 };
        });

        // Procesar partidos filtrados
        partidosDocs.forEach((p: any) => {
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
        });

        setTabla(Object.values(tablaTemp).sort((a: any, b: any) => b.puntos - a.puntos || b.dg - a.dg));
      });
      return () => unsubP();
    });

    return () => unsubE();
  }, [genero, deporte, categoria]);

  return (
    <div style={{ marginTop: "20px", backgroundColor: "white", borderRadius: "12px", padding: "15px", color: "#1e293b" }}>
      <h2 style={{ textAlign: "center", fontSize: "1rem", marginBottom: "10px" }}>
        📍 {deporte} - {genero} ({categoria})
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
        <thead>
          <tr style={{ backgroundColor: "#f1f5f9" }}>
            <th style={{ padding: "8px", textAlign: "left" }}>EQUIPO</th>
            <th style={{ padding: "8px" }}>PJ</th>
            <th style={{ padding: "8px" }}>DG</th>
            <th style={{ padding: "8px" }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((e, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "10px", fontWeight: "bold" }}>{e.nombre}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{e.pj}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{e.dg}</td>
              <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", color: "#b45309" }}>{e.puntos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function SeleccionTorneo() {
  const [step, setStep] = useState(1);
  const [seleccion, setSeleccion] = useState({ genero: "", deporte: "", categoria: "" });

  const reiniciar = () => {
    setStep(1);
    setSeleccion({ genero: "", deporte: "", categoria: "" });
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#5b7ea1", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "white", marginBottom: "30px" }}>🏆 PORTAL DEPORTIVO</h1>

      <div style={{ maxWidth: "500px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* PASO 1: GENERO */}
        {step >= 1 && (
          <div style={{ display: "flex", gap: "10px" }}>
            {["Varones", "Damas"].map(g => (
              <button key={g} onClick={() => { setSeleccion({...seleccion, genero: g}); setStep(2); }} 
                style={{ flex: 1, padding: "15px", borderRadius: "8px", border: "none", cursor: "pointer", 
                backgroundColor: seleccion.genero === g ? "#0f172a" : "white", color: seleccion.genero === g ? "white" : "#0f172a", fontWeight: "bold" }}>
                {g}
              </button>
            ))}
          </div>
        )}

        {/* PASO 2: DEPORTE */}
        {step >= 2 && (
          <div style={{ display: "flex", gap: "10px" }}>
            {["Futbol", "Volley", "Basket"].map(d => (
              <button key={d} onClick={() => { setSeleccion({...seleccion, deporte: d}); setStep(3); }} 
                style={{ flex: 1, padding: "15px", borderRadius: "8px", border: "none", cursor: "pointer",
                backgroundColor: seleccion.deporte === d ? "#0f172a" : "white", color: seleccion.deporte === d ? "white" : "#0f172a", fontWeight: "bold" }}>
                {d}
              </button>
            ))}
          </div>
        )}

        {/* PASO 3: CATEGORIA */}
        {step >= 3 && (
          <div style={{ display: "flex", gap: "10px" }}>
            {["Inferior", "Intermedia"].map(c => (
              <button key={c} onClick={() => { setSeleccion({...seleccion, categoria: c}); setStep(4); }} 
                style={{ flex: 1, padding: "15px", borderRadius: "8px", border: "none", cursor: "pointer",
                backgroundColor: seleccion.categoria === c ? "#0f172a" : "white", color: seleccion.categoria === c ? "white" : "#0f172a", fontWeight: "bold" }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* PASO 4: MOSTRAR TABLA */}
        {step === 4 && (
          <>
            <TablaFiltrada {...seleccion} />
            <button onClick={reiniciar} style={{ marginTop: "20px", padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "#0f172a", color: "white", cursor: "pointer" }}>
              🔄 Cambiar Selección
            </button>
          </>
        )}
      </div>
    </div>
  );
}


