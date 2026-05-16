import React, { forwardRef } from "react";
import { useSimulationStore } from "./store";
import { runSimulation } from "./lib/finance";

const formatCurrency = (v: number) => `€${v.toLocaleString()}`;

export const PdfReportTemplate = forwardRef<HTMLDivElement, {}>((_, ref) => {
  const store = useSimulationStore() as any;
  const results = runSimulation(store, store.activeScenario);

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
          <p style={{ margin: 0, fontSize: "14px", color: "#666", textTransform: "uppercase", letterSpacing: "2px" }}>Rapport Financier</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#333" }}>{store.productName || "Projet Sans Nom"}</h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>Généré le {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
        <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px", borderLeft: "4px solid #7C5CFF" }}>
          <h3 style={{ margin: 0, fontSize: "12px", textTransform: "uppercase", color: "#666", tracking: "wider" }}>Chiffre d'Affaires</h3>
          <p style={{ margin: "10px 0 0", fontSize: "28px", fontWeight: 900, color: "#111" }}>{formatCurrency(results.revenue)}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px", borderLeft: "4px solid #10B981" }}>
          <h3 style={{ margin: 0, fontSize: "12px", textTransform: "uppercase", color: "#666", tracking: "wider" }}>Bénéfice Net</h3>
          <p style={{ margin: "10px 0 0", fontSize: "28px", fontWeight: 900, color: "#111" }}>{formatCurrency(results.netProfit)}</p>
        </div>
        <div style={{ flex: 1, backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px", borderLeft: "4px solid #F59E0B" }}>
          <h3 style={{ margin: 0, fontSize: "12px", textTransform: "uppercase", color: "#666", tracking: "wider" }}>Marge Bruit</h3>
          <p style={{ margin: "10px 0 0", fontSize: "28px", fontWeight: 900, color: "#111" }}>{results.grossMarginPercent.toFixed(1)}%</p>
        </div>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>Synthèse des Paramètres</h3>
        <table style={{ wstoreth: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>Investissement Initial</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right" }}>{formatCurrency(store.initialInvestment)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>Prix Unitaire (Panier Moyen)</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right" }}>{formatCurrency(store.unitPrice)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>Coût Unitaire (COGS)</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right" }}>{formatCurrency(store.unitCost)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>Volume de Ventes Mensuel</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right" }}>{store.salesVolume} unités</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>Croissance Annuelle</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right" }}>{store.annualGrowth}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, borderBottom: "1px solid #eee", paddingBottom: "10px", marginBottom: "20px" }}>Performance & Indicateurs</h3>
        <table style={{ wstoreth: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>Seuil de Rentabilité (Break-Even)</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right" }}>{results.breakEvenUnits.toLocaleString()} unités</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>ROI</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right" }}>{results.roi.toFixed(1)}%</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "10px 0", color: "#555" }}>Score Roïva</td>
              <td style={{ padding: "10px 0", fontWeight: "bold", textAlign: "right", color: "#7C5CFF" }}>{results.roivaScore} / 100</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ position: "absolute", bottom: "40px", left: "40px", right: "40px", textAlign: "center", borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <p style={{ margin: 0, fontSize: "10px", color: "#999" }}>Ce document est un rapport généré automatiquement par l'application ROÏVA. Les prévisions financières sont basées sur les paramètres saisis et ne constituent pas une garantie de résultats.</p>
      </div>
    </div>
  );
});
