/* UI del verificador — depende de data.js y engine.js */
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LOG_KEY = "kr_calibre_log_v1";
  let mode = "bare_solid";
  let last = null;

  /* ---------- Modalidades ---------- */
  const modeIcons = {
    ins_solid: '<circle cx="20" cy="20" r="15" fill="#d2182a" opacity=".85"/><circle cx="20" cy="20" r="8" fill="#c87533"/>',
    ins_str: '<circle cx="20" cy="20" r="15" fill="#d2182a" opacity=".85"/>' + [[20, 20], [20, 14], [20, 26], [14.8, 17], [25.2, 17], [14.8, 23], [25.2, 23]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#c87533" stroke="#7a4313" stroke-width=".6"/>`).join(""),
    bare_solid: '<circle cx="20" cy="20" r="11" fill="#c87533" stroke="#7a4313"/>',
    bare_str: [[20, 20], [20, 12], [20, 28], [13, 16], [27, 16], [13, 24], [27, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#c87533" stroke="#7a4313" stroke-width=".8"/>`).join(""),
  };
  $("modes").innerHTML = Object.entries(MODES).map(([k, m]) =>
    `<button type="button" role="radio" class="mode" data-mode="${k}" aria-checked="${k === mode}">
       <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">${modeIcons[k]}</svg>
       <span>${m.label}</span></button>`).join("");
  $("modes").addEventListener("click", (e) => {
    const b = e.target.closest(".mode"); if (!b) return;
    mode = b.dataset.mode; syncMode(); update();
  });

  function syncMode() {
    document.querySelectorAll(".mode").forEach((b) => b.setAttribute("aria-checked", b.dataset.mode === mode));
    const prev = $("material").value;
    $("material").innerHTML = MATERIALS[mode].map(([v, l]) => `<option value="${v}">${l}</option>`).join("");
    if (MATERIALS[mode].some(([v]) => v === prev)) $("material").value = prev;
    syncDeclared();
  }
  function syncDeclared() {
    const prev = $("declared").value;
    const opts = declarableCalibres(mode, $("material").value);
    $("declared").innerHTML = `<option value="">— No declarado / desconocido —</option>` + opts.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
    if (opts.some((o) => o.value === prev)) $("declared").value = prev;
  }
  const method = () => document.querySelector('input[name="method"]:checked').value;

  function readInput() {
    return {
      mode, material: $("material").value, declared: $("declared").value,
      D: $("D").value, method: method(), N: $("N").value, d: $("d").value,
      Nst: $("Nst").value, dst: $("dst").value, sameWires: $("sameWires").checked,
      tolOD: (Number($("tolOD").value) || 0) / 100, tolA: (Number($("tolA").value) || 0) / 100,
    };
  }

  /* ---------- Visibilidad de campos ---------- */
  function syncFields() {
    const isStr = mode === "bare_str";
    const geo = isStr && method() === "geo";
    const acsr = $("material").value === "acsr";
    $("methodBox").hidden = !isStr;
    $("geoBox").hidden = !geo;
    $("steelBox").hidden = !(geo && acsr);
    $("DBox").hidden = geo;
    $("NLabel").textContent = acsr ? "Hilos de aluminio N" : "Cantidad de hilos N";
    $("dLabel").textContent = acsr ? "Diámetro de hilo de aluminio d (mm)" : "Diámetro de cada hilo d (mm)";
    $("DLabel").textContent = {
      ins_solid: "Diámetro exterior sobre el aislamiento D (mm)",
      ins_str: "Diámetro exterior sobre el aislamiento D (mm)",
      bare_solid: "Diámetro del alambre D (mm)",
      bare_str: "Diámetro exterior total del cable D (mm)",
    }[mode];
    $("formula").innerHTML = {
      ins_solid: "Comparación: <b>D medido</b> frente al <b>diámetro exterior nominal de catálogo</b>.",
      ins_str: "Comparación: <b>D medido</b> frente al <b>diámetro exterior nominal de catálogo</b>.",
      bare_solid: "Sección real estimada: <b>A = π × D² / 4</b>",
      bare_str: geo ? "Sección geométrica: <b>A = N × π × d² / 4</b> (hilos circulares e iguales)"
                    : "Comparación: <b>D total</b> frente a referencias verificadas de la <b>misma construcción</b>.",
    }[mode];
  }

  /* ---------- SVG dinámico ---------- */
  const COL = {
    cu: { fill: "#c87533", stroke: "#7a4313" },
    al: { fill: "#c9ced6", stroke: "#6b7380" },
    st: { fill: "#5b6270", stroke: "#2c313a" },
  };
  // Coloca hilos en capas concéntricas alrededor de un núcleo de radio r0 (unidades = mm)
  function ringLayout(count, w, r0, centerFirst) {
    const pts = [];
    let left = count, Rc;
    if (centerFirst && left > 0) { pts.push([0, 0]); left--; Rc = w; }
    else Rc = r0 + w / 2;
    while (left > 0) {
      const cap = Math.max(1, Math.floor((2 * Math.PI * Rc) / w + 1e-6));
      const n = Math.min(cap, left);
      const off = (pts.length % 2) * Math.PI / n;
      for (let i = 0; i < n; i++) { const a = off + (2 * Math.PI * i) / n - Math.PI / 2; pts.push([Rc * Math.cos(a), Rc * Math.sin(a)]); }
      left -= n; Rc += w;
    }
    return pts;
  }
  function dimLine(x1, x2, y, text, color = "#142652") {
    return `<g class="dim"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="1.4" marker-start="url(#arr)" marker-end="url(#arr)"/>
      <line x1="${x1}" y1="${y - 8}" x2="${x1}" y2="${y + 8}" stroke="${color}" stroke-width="1"/><line x1="${x2}" y1="${y - 8}" x2="${x2}" y2="${y + 8}" stroke="${color}" stroke-width="1"/>
      <text x="${(x1 + x2) / 2}" y="${y + 22}" text-anchor="middle" class="dimtxt" fill="${color}">${esc(text)}</text></g>`;
  }

  function drawSVG(inp) {
    const W = 380, H = 310, cx = 190, cy = 128, Rmax = 92;
    const mat = inp.material;
    const metal = mat === "cu" ? COL.cu : COL.al;
    const r = last || {};
    const meas = r.measured || {};
    let body = "", dims = "", caption = "";
    const fmt = (v) => (v == null || !isFinite(v) ? "—" : Number(v).toFixed(2));

    if (mode === "ins_solid" || mode === "ins_str") {
      const s = Rmax;                         // escala esquemática
      const rIns = s, rJac = s, rCond = s * 0.5;
      body += `<circle cx="${cx}" cy="${cy}" r="${rJac}" fill="#1d2b4f" opacity=".9"/>`;
      body += `<circle cx="${cx}" cy="${cy}" r="${rIns - 6}" fill="#d2182a"/>`;
      if (mode === "ins_solid") body += `<circle cx="${cx}" cy="${cy}" r="${rCond}" fill="${metal.fill}" stroke="${metal.stroke}" stroke-width="1.5"/>`;
      else {
        const w = 2 * rCond / 5;
        ringLayout(19, w, 0, true).forEach(([x, y]) => body += `<circle cx="${cx + x}" cy="${cy + y}" r="${w / 2}" fill="${metal.fill}" stroke="${metal.stroke}" stroke-width="1"/>`);
      }
      body += `<text x="${cx + rCond + 6}" y="${cy - rCond - 4}" class="lbl" fill="#fff">PVC</text><text x="${cx + rIns - 34}" y="${cy - rIns + 22}" class="lbl" fill="#fff">nylon</text>`;
      dims = dimLine(cx - rJac, cx + rJac, cy + rJac + 22, `D exterior medido = ${fmt(meas.D)} mm`);
      caption = mode === "ins_solid" ? "Alambre sólido aislado · se mide sobre la cubierta" : "Cable multifilar aislado · se mide sobre la cubierta";
    } else if (mode === "bare_solid") {
      const R = Rmax * 0.8;
      body += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#gm)" stroke="${metal.stroke}" stroke-width="2"/>`;
      body += `<circle cx="${cx - R * .3}" cy="${cy - R * .3}" r="${R * .25}" fill="#fff" opacity=".18"/>`;
      dims = dimLine(cx - R, cx + R, cy + R + 26, `D = ${fmt(meas.D)} mm  →  A = ${r.A ? r.A.toFixed(2) : "—"} mm²`);
      caption = "Alambre sólido desnudo · A = π × D² / 4";
    } else {
      const geo = inp.method === "geo";
      const acsr = mat === "acsr";
      let N = Math.round(Number(inp.N)) || 0, d = Number(String(inp.d).replace(",", ".")) || 0;
      let Nst = Math.round(Number(inp.Nst)) || 0, dst = Number(String(inp.dst).replace(",", ".")) || 0;
      if (!geo || N < 2) { N = acsr ? 6 : (mat === "cu" ? 19 : 7); Nst = acsr ? 1 : 0; }
      if (!(d > 0)) d = 1; if (!(dst > 0)) dst = d;
      N = Math.min(N, 400); Nst = Math.min(Nst, 61);
      let pts = [], stPts = [];
      if (acsr) {
        stPts = ringLayout(Nst || 1, dst, 0, true);
        const rCore = Math.max(...stPts.map(([x, y]) => Math.hypot(x, y))) + dst / 2;
        pts = ringLayout(N, d, rCore, false);
      } else pts = ringLayout(N, d, 0, true);
      const all = [...pts.map((p) => [...p, d]), ...stPts.map((p) => [...p, dst])];
      const ext = Math.max(...all.map(([x, y, w]) => Math.hypot(x, y) + w / 2));
      const k = Rmax / ext;
      stPts.forEach(([x, y]) => body += `<circle cx="${cx + x * k}" cy="${cy + y * k}" r="${dst * k / 2}" fill="${COL.st.fill}" stroke="${COL.st.stroke}" stroke-width="1"/>`);
      pts.forEach(([x, y], i) => body += `<circle cx="${cx + x * k}" cy="${cy + y * k}" r="${d * k / 2}" fill="${metal.fill}" stroke="${metal.stroke}" stroke-width="1"/>`);
      if (geo) {
        // resalta un hilo exterior y acota d
        const [hx, hy] = pts.reduce((b, p) => (p[0] > b[0] ? p : b), pts[0]);
        const X = cx + hx * k, Y = cy + hy * k, rr = d * k / 2;
        body += `<circle cx="${X}" cy="${Y}" r="${rr}" fill="none" stroke="#d2182a" stroke-width="2.4"/>`;
        body += `<line x1="${X - rr}" y1="${Y - rr - 10}" x2="${X + rr}" y2="${Y - rr - 10}" stroke="#d2182a" stroke-width="1.4" marker-start="url(#arrR)" marker-end="url(#arrR)"/>`;
        body += `<text x="${X + rr + 6}" y="${Y - rr - 6}" class="dimtxt" fill="#d2182a">d = ${meas.d ? meas.d.toFixed(3) : "—"} mm</text>`;
        const nTxt = acsr ? `N = ${meas.N ?? "—"} Al + ${meas.Nst ?? "—"} acero` : `N = ${meas.N ?? "—"} hilos`;
        dims = `<text x="${cx}" y="${cy + Rmax + 34}" text-anchor="middle" class="dimtxt">${esc(nTxt)}  →  A = ${r.A ? r.A.toFixed(2) : "—"} mm²</text>`;
        caption = "Método 2 · cable desarmado: contar hilos y medir un hilo";
      } else {
        body += `<circle cx="${cx}" cy="${cy}" r="${Rmax}" fill="none" stroke="#142652" stroke-dasharray="5 4" stroke-width="1.4"/>`;
        dims = dimLine(cx - Rmax, cx + Rmax, cy + Rmax + 22, `D total medido = ${fmt(meas.D)} mm`);
        caption = "Método 1 · diámetro exterior total sin desarmar";
      }
      if (acsr) body += `<text x="16" y="24" class="lbl" fill="#5b6270">■ acero</text><text x="16" y="40" class="lbl" fill="#6b7380">■ aluminio</text>`;
    }
    $("svgWrap").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(caption)}">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#142652"/></marker>
        <marker id="arrR" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#d2182a"/></marker>
        <radialGradient id="gm" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="${mat === "cu" ? "#e9a46a" : "#eef1f5"}"/><stop offset="1" stop-color="${metal.fill}"/></radialGradient>
      </defs>
      ${body}${dims}
      <text x="${W / 2}" y="${H - 22}" text-anchor="middle" class="cap">${esc(caption)}</text>
      <text x="${W / 2}" y="${H - 8}" text-anchor="middle" class="cap">Esquemático, no a escala</text>
    </svg>`;
  }

  /* ---------- Render de resultado ---------- */
  const statusClass = (s) => ({ [STATUS.OK]: "ok", [STATUS.FAIL]: "fail", [STATUS.INSUF]: "insuf", [STATUS.CALC]: "calc", [STATUS.INVALID]: "invalid" }[s] || "");
  const srcLink = (k) => { const s = SOURCES[k]; if (!s) return ""; return s.url ? `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.name)}</a>` : esc(s.name); };

  function renderResult(r) {
    $("verdict").className = "verdict " + statusClass(r.status);
    $("verdict").innerHTML = `<strong>${esc(r.status)}</strong><span>${esc(r.why)}</span>`;
    $("calcList").innerHTML = r.calc.length ? r.calc.map((c) => `
      <div class="row"><div><b>${esc(c.label)}</b>${c.formula ? `<code>${esc(c.formula)}</code>` : ""}</div>
      <div class="val">${esc(c.value)} <small>${esc(c.unit)}</small></div></div>`).join("") : `<p class="empty">Sin valores calculados para esta entrada.</p>`;
    $("catList").innerHTML = r.catalog.length ? r.catalog.map((c) => `
      <div class="row"><div><b>${esc(c.label)}</b><small class="src">${srcLink(c.src)}${c.ref ? ` · ref. ${esc(c.ref)}` : ""}</small></div>
      <div class="val">${esc(c.value)} <small>${esc(c.unit)}</small></div></div>`).join("") : `<p class="empty">No se usó ningún valor de catálogo.</p>`;
    $("nearest").innerHTML = r.nearest ? `<span class="tag ${r.nearest.src === "awg_def" ? "tag-def" : "tag-cat"}">${r.nearest.src === "awg_def" ? "NOMINAL AWG" : "CATÁLOGO"}</span>
      ${esc(r.nearest.kind)}: <b>${esc(r.nearest.cal)}</b> (${esc(r.nearest.value)} ${esc(r.nearest.unit)}, desviación ${pct(r.nearest.dev)})` : "";
    $("notes").innerHTML = r.notes.map((n) => `<li>${esc(n)}</li>`).join("");
  }

  function update() {
    syncFields();
    const inp = readInput();
    last = evaluate(inp);
    renderResult(last);
    drawSVG(inp);
  }

  /* ---------- Registro de interventoría ---------- */
  const loadLog = () => { try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; } };
  const saveLog = (l) => localStorage.setItem(LOG_KEY, JSON.stringify(l));
  function measText(r) {
    const m = r.measured || {};
    if (m.N) return `${m.N} × ${m.d.toFixed(3)} mm` + (m.Nst ? ` + ${m.Nst} × ${m.dst.toFixed(3)} mm acero` : "") + ` (${m.readings.length} lect.)`;
    if (m.D) return `D = ${m.D.toFixed(3)} mm (${m.readings.length} lect.)`;
    return "—";
  }
  function entryFrom(r) {
    const inp = r.input;
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      creado: new Date().toISOString(),
      fecha: $("rFecha").value, proyecto: $("rProyecto").value.trim(), item: $("rItem").value.trim(),
      ubicacion: $("rUbic").value.trim(), uso: $("rUso").value.trim(), instrumento: $("rInstr").value.trim(),
      responsable: $("rResp").value.trim(), observaciones: $("rObs").value.trim(),
      modalidad: MODES[inp.mode].label, material: (MATERIALS[inp.mode].find(([v]) => v === inp.material) || [, inp.material])[1],
      metodo: inp.mode === "bare_str" ? (inp.method === "geo" ? "Geométrico N·π·d²/4" : "Diámetro exterior total") : (inp.mode === "bare_solid" ? "π·D²/4" : "Diámetro exterior vs catálogo"),
      declarado: (inp.declared || "").replace("|", " · ") || "No declarado",
      medicion: measText(r),
      calculado: r.calc.map((c) => `${c.label}: ${c.value} ${c.unit}`.trim()).join(" | "),
      catalogo: r.catalog.map((c) => `${c.label}: ${c.value} ${c.unit}`.trim()).join(" | "),
      fuentes: [...new Set(r.catalog.map((c) => SOURCES[c.src] && SOURCES[c.src].url).filter(Boolean))].join(" "),
      mas_cercano: r.nearest ? `${r.nearest.cal} (${r.nearest.value} ${r.nearest.unit})` : "",
      dictamen: r.status, justificacion: r.why,
      tolerancias: `D ±${(inp.tolOD * 100).toFixed(1)} % · A ±${(inp.tolA * 100).toFixed(1)} %`,
    };
  }
  function renderLog() {
    const l = loadLog();
    $("logInfo").textContent = l.length ? `${l.length} registro(s) guardados en este navegador. Exporte el CSV o el JSON como respaldo.` : "Aún no hay registros.";
    $("logTable").querySelector("tbody").innerHTML = l.map((e, i) => `<tr>
      <td>${i + 1}</td><td>${esc(e.fecha)}</td><td>${esc(e.proyecto)}<br><small>${esc(e.item)}</small></td><td>${esc(e.ubicacion)}<br><small>${esc(e.uso)}</small></td>
      <td>${esc(e.modalidad)}<br><small>${esc(e.metodo)}</small></td><td>${esc(e.material)}</td><td>${esc(e.declarado)}</td><td>${esc(e.medicion)}</td>
      <td class="c-calc">${esc(e.calculado)}</td><td class="c-cat">${esc(e.catalogo)}</td><td>${esc(e.mas_cercano)}</td>
      <td><span class="pill ${statusClass(e.dictamen)}">${esc(e.dictamen)}</span></td><td>${esc(e.responsable)}</td>
      <td><button class="x" data-del="${esc(e.id)}" title="Eliminar">✕</button></td></tr>`).join("");
  }
  $("btnSave").addEventListener("click", () => {
    if (!last || last.status === STATUS.INVALID) { alert("Complete una medición válida antes de registrarla."); return; }
    const l = loadLog(); l.push(entryFrom(last)); saveLog(l); renderLog();
  });
  $("logTable").addEventListener("click", (e) => {
    const id = e.target.dataset && e.target.dataset.del; if (!id) return;
    if (!confirm("¿Eliminar este registro?")) return;
    saveLog(loadLog().filter((x) => x.id !== id)); renderLog();
  });
  $("btnClear").addEventListener("click", () => {
    if (!loadLog().length) return;
    if (confirm("¿Vaciar todo el registro? Exporte antes un respaldo.")) { saveLog([]); renderLog(); }
  });
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const COLS = ["fecha", "proyecto", "item", "ubicacion", "uso", "modalidad", "metodo", "material", "declarado", "medicion", "calculado", "catalogo", "mas_cercano", "dictamen", "justificacion", "tolerancias", "instrumento", "responsable", "observaciones", "fuentes", "creado"];
  $("btnCsv").addEventListener("click", () => {
    const l = loadLog(); if (!l.length) return alert("No hay registros.");
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = "﻿" + [COLS.join(";"), ...l.map((e) => COLS.map((c) => q(e[c])).join(";"))].join("\r\n");
    download(`registro-calibres-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  });
  $("btnJson").addEventListener("click", () => download(`registro-calibres-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(loadLog(), null, 2), "application/json"));
  $("fileJson").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data)) throw 0;
      const cur = loadLog(), ids = new Set(cur.map((x) => x.id));
      const add = data.filter((x) => x && x.id && !ids.has(x.id));
      saveLog(cur.concat(add)); renderLog(); alert(`${add.length} registro(s) importados.`);
    } catch { alert("Archivo JSON no válido."); }
    e.target.value = "";
  });
  $("btnPrint").addEventListener("click", () => {
    const l = loadLog(); if (!l.length) return alert("No hay registros.");
    $("printArea").innerHTML = `<h1>Acta de verificación de calibre de conductores</h1>
      <p>KoolRed Soluciones · generado ${new Date().toLocaleString("es-CO")}</p>
      <table><thead><tr><th>#</th><th>Fecha</th><th>Proyecto / ítem / ubicación</th><th>Modalidad · material</th><th>Declarado</th><th>Medición</th><th>Calculado (geometría)</th><th>Catálogo (nominal)</th><th>Dictamen</th><th>Responsable</th></tr></thead>
      <tbody>${l.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.fecha)}</td><td>${esc([e.proyecto, e.item, e.ubicacion, e.uso].filter(Boolean).join(" · "))}</td>
        <td>${esc(e.modalidad)} · ${esc(e.material)}<br><small>${esc(e.metodo)}</small></td><td>${esc(e.declarado)}</td><td>${esc(e.medicion)}<br><small>${esc(e.instrumento)}</small></td>
        <td>${esc(e.calculado)}</td><td>${esc(e.catalogo)}</td><td><b>${esc(e.dictamen)}</b><br><small>${esc(e.justificacion)}</small></td><td>${esc(e.responsable)}</td></tr>`).join("")}</tbody></table>
      <p class="foot">Valores CALCULADOS: geometría a partir de la medición. Valores de CATÁLOGO: nominales de ficha oficial del fabricante. Las tolerancias son criterio de interventoría.</p>
      <div class="sign"><div>Inspector</div><div>Interventor</div><div>Contratista</div></div>`;
    window.print();
  });

  /* ---------- Pruebas y fuentes ---------- */
  function renderTests() {
    const t = runTests();
    const ok = t.every((x) => x.pass);
    $("tests").innerHTML = `<p class="${ok ? "t-ok" : "t-fail"}"><b>${t.filter((x) => x.pass).length}/${t.length}</b> casos superados.</p>` +
      `<table class="tests"><thead><tr><th></th><th>Caso</th><th>Esperado</th><th>Obtenido</th></tr></thead><tbody>` +
      t.map((x) => `<tr><td>${x.pass ? "✅" : "❌"}</td><td>${esc(x.name)}</td><td>${esc(x.expect)}</td>
        <td><b>${esc(x.result.status)}</b>${x.result.A ? ` · A = ${x.result.A.toFixed(2)} mm²` : ""}${x.result.nearest ? ` · ${esc(x.result.nearest.cal)}` : ""}<br><small>${esc(x.result.why)}</small></td></tr>`).join("") +
      `</tbody></table><button class="btn" id="loadT1">Cargar caso 1</button> <button class="btn" id="loadT2">Cargar caso 2</button> <button class="btn" id="loadT3">Cargar caso 3</button>`;
    [1, 2, 3].forEach((n) => $("loadT" + n).addEventListener("click", () => loadCase(TEST_CASES[n - 1].input)));
  }
  function loadCase(i) {
    mode = i.mode; syncMode();
    $("material").value = i.material; syncDeclared();
    $("declared").value = i.declared || "";
    document.querySelector(`input[name="method"][value="${i.method || "od"}"]`).checked = true;
    $("D").value = i.D || ""; $("N").value = i.N || ""; $("d").value = i.d || "";
    $("Nst").value = i.Nst || ""; $("dst").value = i.dst || ""; $("sameWires").checked = !!i.sameWires;
    update(); $("resultCard").scrollIntoView({ behavior: "smooth" });
  }
  $("sources").innerHTML = `<ul class="srcs">${Object.entries(SOURCES).map(([k, s]) => `<li>${srcLink(k)}<br><small>${esc(s.norms)}</small></li>`).join("")}</ul>`;

  /* ---------- Init ---------- */
  $("rFecha").value = new Date().toISOString().slice(0, 10);
  ["material"].forEach((id) => $(id).addEventListener("change", () => { syncDeclared(); update(); }));
  ["declared", "D", "N", "d", "Nst", "dst", "sameWires", "tolOD", "tolA"].forEach((id) => $(id).addEventListener("input", update));
  document.querySelectorAll('input[name="method"]').forEach((el) => el.addEventListener("change", update));
  syncMode(); update(); renderLog(); renderTests();
  const hc = /^#caso([1-9])$/.exec(location.hash);
  if (hc && TEST_CASES[hc[1] - 1]) loadCase(TEST_CASES[hc[1] - 1].input);
})();
