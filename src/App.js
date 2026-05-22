import { useState, useRef } from "react";
import jsPDF from "jspdf";
import "./App.css";

const emptyOperaio = () => ({ nome: "", ore: "" });

export default function App() {
  const [cantiere, setCantiere] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);
  const [responsabile, setResponsabile] = useState("");
  const [operai, setOperai] = useState([emptyOperaio()]);
  const [attivita, setAttivita] = useState("");
  const [materiali, setMateriali] = useState("");
  const [anomalie, setAnomalie] = useState("");
  const [foto, setFoto] = useState([]);
  const [generando, setGenerando] = useState(false);
  const [successo, setSuccesso] = useState(false);
  const fotoRef = useRef();

  const totaleOre = operai.reduce((acc, o) => acc + (parseFloat(o.ore) || 0), 0);

  const nuovoRapportino = () => {
    setCantiere("");
    setData(new Date().toISOString().split("T")[0]);
    setResponsabile("");
    setOperai([emptyOperaio()]);
    setAttivita("");
    setMateriali("");
    setAnomalie("");
    setFoto([]);
    setSuccesso(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const aggiornaOperaio = (i, campo, val) => {
    const aggiornati = [...operai];
    aggiornati[i] = { ...aggiornati[i], [campo]: val };
    setOperai(aggiornati);
  };

  const aggiungiOperaio = () => setOperai([...operai, emptyOperaio()]);

  const rimuoviOperaio = (i) => {
    if (operai.length === 1) return;
    setOperai(operai.filter((_, idx) => idx !== i));
  };

  const gestisciFoto = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(
      (f) => new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (ev) => res({ name: f.name, data: ev.target.result });
        reader.readAsDataURL(f);
      })
    );
    Promise.all(promises).then((nuove) => setFoto((prev) => [...prev, ...nuove]));
  };

  const rimuoviFoto = (i) => setFoto(foto.filter((_, idx) => idx !== i));

  const formatDataITA = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const caricaImmagine = (url) =>
    new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = url;
    });

  const generaPDF = async () => {
    if (!cantiere || !responsabile) {
      alert("Inserisci almeno il nome cantiere e il responsabile.");
      return;
    }
    setGenerando(true);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const margin = 14;
    const colW = W - margin * 2;
    let y = 0;

    const nero = { r: 20, g: 20, b: 20 };
    const cyan = { r: 41, g: 181, b: 212 };
    const grigio = { r: 247, g: 247, b: 245 };
    const bordo = { r: 210, g: 210, b: 205 };

    const logoImg = await caricaImmagine("/footer.png");
    const footerImg = await caricaImmagine("/footer.png");

    const logoW = 48;
    const logoH = logoW * 0.25;
    const headerH = logoH + 12;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, headerH, "F");

    if (logoImg) {
      doc.addImage(logoImg, "PNG", margin, (headerH - logoH) / 2, logoW, logoH);
    }

    doc.setDrawColor(bordo.r, bordo.g, bordo.b);
    doc.setLineWidth(0.3);
    doc.line(margin + logoW + 6, 5, margin + logoW + 6, headerH - 5);

    const titoloX = margin + logoW + 10;
    const titoloSpazio = W - titoloX - margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(nero.r, nero.g, nero.b);
    doc.text(
      "Rapporto Giornaliero di Cantiere",
      titoloX + titoloSpazio / 2,
      headerH / 2 + 1.8,
      { align: "center" }
    );

    doc.setFillColor(cyan.r, cyan.g, cyan.b);
    doc.rect(0, headerH, W, 1, "F");

    y = headerH + 7;

    const infoFields = [
      ["Cantiere", cantiere],
      ["Responsabile", responsabile],
      ["Data", formatDataITA(data)],
    ];

    infoFields.forEach(([label, val]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 135);
      doc.text(label.toUpperCase(), margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(nero.r, nero.g, nero.b);
      doc.text(val || "—", margin + 30, y);
      y += 6;
    });

    y += 4;

    const sezioneHeader = (titolo) => {
      doc.setFillColor(grigio.r, grigio.g, grigio.b);
      doc.rect(margin, y, colW, 5.5, "F");
      doc.setFillColor(cyan.r, cyan.g, cyan.b);
      doc.rect(margin, y, 2, 5.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(nero.r, nero.g, nero.b);
      doc.text(titolo.toUpperCase(), margin + 5, y + 3.8);
      y += 8;
    };

    sezioneHeader("Presenze operai");

    const colNome = colW * 0.72;
    const colOre = colW * 0.28;

    doc.setFillColor(nero.r, nero.g, nero.b);
    doc.rect(margin, y, colW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("OPERAIO", margin + 3, y + 4);
    doc.text("ORE", margin + colNome + colOre / 2, y + 4, { align: "center" });
    y += 6;

    operai.forEach((o, i) => {
      const bg = i % 2 === 0 ? { r: 255, g: 255, b: 255 } : grigio;
      doc.setFillColor(bg.r, bg.g, bg.b);
      doc.rect(margin, y, colW, 6, "F");
      doc.setDrawColor(bordo.r, bordo.g, bordo.b);
      doc.rect(margin, y, colW, 6, "S");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(nero.r, nero.g, nero.b);
      doc.text(o.nome || "—", margin + 3, y + 4);
      doc.text(o.ore ? `${o.ore}h` : "—", margin + colNome + colOre / 2, y + 4, { align: "center" });
      y += 6;
    });

    doc.setFillColor(cyan.r, cyan.g, cyan.b);
    doc.rect(margin, y, colW, 6.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("TOTALE ORE", margin + 3, y + 4.5);
    doc.text(`${totaleOre}h`, margin + colNome + colOre / 2, y + 4.5, { align: "center" });
    y += 11;

    const scriviTesto = (titolo, testo) => {
      if (!testo) return;
      sezioneHeader(titolo);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(nero.r, nero.g, nero.b);
      const righe = doc.splitTextToSize(testo, colW - 6);
      righe.forEach((riga) => { doc.text(riga, margin + 2, y); y += 5; });
      y += 5;
    };

    scriviTesto("Attività svolte", attivita);
    scriviTesto("Materiali utilizzati", materiali);
    scriviTesto("Note e anomalie", anomalie);

    if (foto.length > 0) {
      const gap = 5;
      const fotoW = (colW - gap) / 2;
      const fotoH = fotoW * 0.65;

      if (y + fotoH + 20 > 268) {
        doc.addPage();
        y = 14;
      } else {
        y += 4;
      }

      sezioneHeader(`Documentazione fotografica (${foto.length} foto)`);

      let col = 0;
      for (const f of foto) {
        const x = margin + col * (fotoW + gap);
        try {
          doc.addImage(f.data, "JPEG", x, y, fotoW, fotoH);
          doc.setFontSize(6);
          doc.setTextColor(140, 140, 135);
          const nome = f.name.length > 22 ? f.name.substring(0, 19) + "..." : f.name;
          doc.text(nome, x + fotoW / 2, y + fotoH + 3.5, { align: "center" });
        } catch (_) {}
        col++;
        if (col === 2) {
          col = 0;
          y += fotoH + 8;
          if (y > 260) { doc.addPage(); y = 14; }
        }
      }
    }

    const totPagine = doc.getNumberOfPages();
    for (let p = 1; p <= totPagine; p++) {
      doc.setPage(p);

      if (footerImg) {
        const fW = 65;
        const fH = (footerImg.naturalHeight / footerImg.naturalWidth) * fW;
        const fY = 284 - fH;
        doc.addImage(footerImg, "PNG", W / 2 - fW / 2, fY, fW, fH);
      }

      doc.setFillColor(nero.r, nero.g, nero.b);
      doc.rect(0, 287, W, 10, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(160, 160, 155);
      doc.text(`${cantiere} — ${formatDataITA(data)}`, margin, 293.5);
      doc.text(`${p} / ${totPagine}`, W - margin, 293.5, { align: "right" });
    }

    const nomefile = `rapporto_${cantiere.replace(/\s+/g, "_")}_${data}.pdf`;
    doc.save(nomefile);
    setGenerando(false);
    setSuccesso(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <img src="/footer.png" alt="Milano Contract" className="header-logo" />
          <span className="header-titolo">Rapporto Giornaliero di Cantiere</span>
        </div>
      </header>

      <main className="form-body">

        <section className="sezione">
          <h2 className="sezione-titolo">Dati generali</h2>
          <div className="campo">
            <label>Nome cantiere *</label>
            <input
              type="text"
              placeholder="Es. Via Roma 12, Milano"
              value={cantiere}
              onChange={(e) => setCantiere(e.target.value)}
            />
          </div>
          <div className="campo-row">
            <div className="campo">
              <label>Data *</label>
              <input
                type="date"
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  e.target.blur();
                }}
              />
            </div>
            <div className="campo">
              <label>Responsabile *</label>
              <input
                type="text"
                placeholder="Nome cognome"
                value={responsabile}
                onChange={(e) => setResponsabile(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="sezione">
          <div className="sezione-head">
            <h2 className="sezione-titolo">Presenze operai</h2>
            <span className="badge-ore">{totaleOre}h totali</span>
          </div>
          <div className="operai-list">
            {operai.map((o, i) => (
              <div className="operaio-row" key={i}>
                <div className="operaio-num">{i + 1}</div>
                <div className="campo flex1">
                  <input
                    type="text"
                    placeholder="Nome operaio"
                    value={o.nome}
                    onChange={(e) => aggiornaOperaio(i, "nome", e.target.value)}
                  />
                </div>
                <div className="campo ore-campo">
                  <input
                    type="number"
                    placeholder="Ore"
                    min="0"
                    max="24"
                    step="0.5"
                    value={o.ore}
                    onChange={(e) => aggiornaOperaio(i, "ore", e.target.value)}
                  />
                </div>
                {operai.length > 1 && (
                  <button className="btn-rimuovi" onClick={() => rimuoviOperaio(i)} aria-label="Rimuovi operaio">×</button>
                )}
              </div>
            ))}
          </div>
          <button className="btn-aggiungi" onClick={aggiungiOperaio}>+ Aggiungi operaio</button>
        </section>

        <section className="sezione">
          <h2 className="sezione-titolo">Attività svolte</h2>
          <div className="campo">
            <textarea rows={4} placeholder="Descrivi le lavorazioni eseguite oggi..."
              value={attivita} onChange={(e) => setAttivita(e.target.value)} />
          </div>
        </section>

        <section className="sezione">
          <h2 className="sezione-titolo">Materiali utilizzati</h2>
          <div className="campo">
            <textarea rows={3} placeholder="Es. 20 sacchi cemento, 5m² pannelli isolanti..."
              value={materiali} onChange={(e) => setMateriali(e.target.value)} />
          </div>
        </section>

        <section className="sezione">
          <h2 className="sezione-titolo">Note e anomalie</h2>
          <div className="campo">
            <textarea rows={3} placeholder="Problemi riscontrati, varianti, segnalazioni..."
              value={anomalie} onChange={(e) => setAnomalie(e.target.value)} />
          </div>
        </section>

        <section className="sezione">
          <h2 className="sezione-titolo">Documentazione fotografica</h2>
          <div className="foto-upload-area" onClick={() => fotoRef.current.click()}>
            <span className="foto-icon">📷</span>
            <span>Tocca per aggiungere foto</span>
          </div>
          <input ref={fotoRef} type="file" accept="image/*" multiple
            onChange={gestisciFoto} style={{ display: "none" }} />
          {foto.length > 0 && (
            <div className="foto-grid">
              {foto.map((f, i) => (
                <div className="foto-thumb" key={i}>
                  <img src={f.data} alt={f.name} />
                  <button className="foto-rimuovi" onClick={() => rimuoviFoto(i)}>×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="cta-area">
          <button
            className={`btn-genera ${generando ? "loading" : ""} ${successo ? "success" : ""}`}
            onClick={generaPDF} disabled={generando}
          >
            {generando ? "Generazione in corso..." : successo ? "✓ PDF scaricato" : "Genera PDF"}
          </button>
          {successo && (
            <button className="btn-nuovo" onClick={nuovoRapportino}>
              + Nuovo rapportino
            </button>
          )}
        </div>

      </main>
    </div>
  );
}