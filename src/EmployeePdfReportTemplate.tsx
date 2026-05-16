import React, { forwardRef } from "react";
import { useSimulationStore } from "./store";
import { estimateSalaryCostFrance } from "./lib/finance";

const formatCurrency = (v: number) => `€${Math.round(v).toLocaleString()}`;

export const EmployeePdfReportTemplate = forwardRef<HTMLDivElement, {}>((_, ref) => {
  const store = useSimulationStore() as any;

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "794px", // A4 width in pixels at 96dpi
        minHeight: "1123px", // A4 height
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "'Inter', sans-serif",
        padding: "40px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", borderBottom: "2px solid #7C5CFF", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 900, color: "#111" }}>ROÏVA</h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#666", textTransform: "uppercase", letterSpacing: "2px" }}>Rapport Masse Salariale</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#333" }}>{store.establishmentName || "Mon Établissement"}</h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>Généré le {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>Liste des Salariés ({store.employees.length})</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "12px 10px", color: "#555" }}>Nom / Poste</th>
              <th style={{ padding: "12px 10px", color: "#555", textAlign: "right" }}>Salaire Net</th>
              <th style={{ padding: "12px 10px", color: "#555", textAlign: "center" }}>Charges</th>
              <th style={{ padding: "12px 10px", color: "#555", textAlign: "right" }}>Total Entreprise</th>
            </tr>
          </thead>
          <tbody>
            {store.employees.map((emp: any, i: number) => {
              const est = estimateSalaryCostFrance(emp.salary || 0, emp.charges, emp.chargeType);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "12px 10px", fontWeight: "bold" }}>{emp.name || "Employé sans nom"}</td>
                  <td style={{ padding: "12px 10px", textAlign: "right" }}>{formatCurrency(emp.salary || 0)}</td>
                  <td style={{ padding: "12px 10px", textAlign: "center" }}>
                    {emp.chargeType === "€" ? formatCurrency(emp.charges) : `${emp.charges}%`}
                  </td>
                  <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: "bold", color: "#7C5CFF" }}>
                    {formatCurrency(est.total_cost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ position: "absolute", bottom: "40px", left: "40px", right: "40px", textAlign: "center", borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <p style={{ margin: 0, fontSize: "10px", color: "#999" }}>Ce document est un rapport généré automatiquement par l'application ROÏVA. Les prévisions financières sont basées sur les paramètres saisis.</p>
      </div>
    </div>
  );
});
