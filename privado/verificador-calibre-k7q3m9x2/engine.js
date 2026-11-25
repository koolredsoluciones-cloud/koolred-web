/* =====================================================================
   MOTOR DE VERIFICACIÓN — funciones puras (sin DOM)
   Depende de data.js (BASES, AWG_NOMINAL, SOURCES)
   ===================================================================== */

const MODES = {
  ins_solid:  { label: "Sólido con aislamiento",     short: "Sólido aislado" },
  ins_str:    { label: "Multifilar con aislamiento", short: "Multifilar aislado" },
  bare_solid: { label: "Sólido desnudo",             short: "Sólido desnudo" },
  bare_str:   { label: "Multifilar desnudo",         short: "Multifilar desnudo" },
};

const MATERIALS = {
  ins_solid:  [["cu", "Cobre (THHN/THWN-2)"], ["al", "Aluminio aislado"]],
  ins_str:    [["cu", "Cobre (THHN/THWN-2)"], ["al", "Aluminio aislado"]],
  bare_solid: [["cu", "Cobre"], ["al", "Aluminio"]],
  bare_str:   [["cu", "Cobre clase B"], ["aac", "Aluminio AAC (1350-H19)"], ["aaac", "Aleación AAAC (6201-T81)"], ["acsr", "ACSR (aluminio + acero)"]],
};

const STATUS = {
  OK: "COMPATIBLE",
  FAIL: "NO COMPATIBLE",
  INSUF: "INFORMACIÓN INSUFICIENTE",
  CALC: "CALCULADO SIN CALIBRE DECLARADO",
  INVALID: "ENTRADA INVÁLIDA",
};

function baseKeyFor(mode, material) {
  if (mode === "ins_solid") return material === "cu" ? "insulated_solid" : null;
  if (mode === "ins_str") return material === "cu" ? "insulated_stranded" : null;
  if (mode === "bare_solid") return material === "cu" ? "bare_solid_cu" : "bare_solid_al";
  if (mode === "bare_str") return { cu: "bare_stranded_cu", aac: "bare_stranded_aac", aaac: "bare_stranded_aaac", acsr: "bare_stranded_acsr" }[material] || null;
  return null;
}

/* Calibres que se pueden declarar según construcción */
function declarableCalibres(mode, material) {
  const key = baseKeyFor(mode, material);
  if (key && ["bare_stranded_aac", "bare_stranded_aaac", "bare_stranded_acsr"].includes(key)) {
    return BASES[key].rows.map((r) => ({ value: r.cal + "|" + r.name, label: `${r.cal} · ${r.name}` }));
  }
  return AWG_NOMINAL.map((r) => ({ value: r.cal, label: r.cal }));
}

/* "2,50; 2.51 2,49" → [2.5, 2.51, 2.49] */
function parseReadings(txt) {
  if (txt == null) return [];
  if (typeof txt === "number") return isFinite(txt) && txt > 0 ? [txt] : [];
  return String(txt).trim().split(/[;\s]+/).filter(Boolean)
    .map((t) => Number(t.replace(",", "."))).filter((v) => isFinite(v) && v > 0);
}

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const circ = (d) => Math.PI * d * d / 4;
const pct = (x) => (x >= 0 ? "+" : "") + (x * 100).toFixed(2) + " %";
const f2 = (x) => Number(x).toFixed(2);
const f3 = (x) => Number(x).toFixed(3);

function nearestBy(rows, key, value) {
  let best = null;
  rows.forEach((r) => {
    if (r.suspect || r[key] == null) return;
    const diff = Math.abs(r[key] - value);
    if (!best || diff < best.diff) best = { row: r, diff, dev: (value - r[key]) / r[key] };
  });
  return best;
}

/* D teórico de cableado concéntrico regular 1-7-19-37-61-91 (hilos iguales) */
function concentricOD(n, d) {
  const map = { 1: 1, 7: 3, 19: 5, 37: 7, 61: 9, 91: 11 };
  return map[n] ? map[n] * d : null;
}

function sourceRef(srcKey) {
  return srcKey ? SOURCES[srcKey] : null;
}

function judgeArea(A, Anom, tol) {
  const dev = (A - Anom) / Anom;
  if (Math.abs(dev) <= tol) return { status: STATUS.OK, dev, why: `Desviación de sección ${pct(dev)} dentro de ±${(tol * 100).toFixed(1)} %.` };
  return {
    status: STATUS.FAIL, dev,
    why: dev < 0
      ? `Sección calculada ${pct(dev)} por debajo de la nominal: posible conductor de menor calibre.`
      : `Sección calculada ${pct(dev)} por encima de la nominal: corresponde a un calibre mayor al declarado.`,
  };
}

/**
 * input: { mode, material, declared, D, method, N, d, Nst, dst, sameWires, tolOD, tolA }
 *   D, d, dst: número o texto con varias lecturas
 *   tolOD, tolA: fracción (0.05 = 5 %)
 */
function evaluate(input) {
  const res = { status: null, why: "", calc: [], catalog: [], nearest: null, notes: [], sources: [], input };
  const tolOD = input.tolOD ?? 0.05;
  const tolA = input.tolA ?? 0.03;
  const mode = input.mode;
  const key = baseKeyFor(mode, input.material);
  const base = key ? BASES[key] : null;
  if (base && base.src) res.sources.push(sourceRef(base.src));
  const [declCal, declName] = (input.declared || "").split("|");

  /* ---------------- CON AISLAMIENTO ---------------- */
  if (mode === "ins_solid" || mode === "ins_str") {
    const Dr = parseReadings(input.D);
    if (!Dr.length) return { ...res, status: STATUS.INVALID, why: "Ingrese el diámetro exterior medido (sobre el aislamiento)." };
    const D = mean(Dr);
    res.measured = { D, readings: Dr };
    if (!base) return { ...res, status: STATUS.INSUF, why: "No hay en la base un catálogo verificado de conductores de aluminio aislados. No se compara contra valores no verificados." };
    res.notes.push("El diámetro exterior depende del espesor de aislamiento y cubierta de cada fabricante. La comparación es contra Nexans THHN/THWN-2; otro fabricante o tipo de aislamiento (XHHW, THW, LSHF…) puede diferir.");
    res.notes.push("El diámetro exterior no prueba la sección del cobre. Si hay duda, verifique en una muestra pelada con la modalidad desnudo.");
    const near = nearestBy(base.rows, "od", D);
    if (near) res.nearest = { cal: near.row.cal, kind: "Diámetro exterior de catálogo más cercano", value: near.row.od, unit: "mm", dev: near.dev, src: base.src };
    if (!declCal) {
      if (!near || Math.abs(near.dev) > tolOD) return { ...res, status: STATUS.INSUF, why: `El diámetro medido (${f2(D)} mm) no coincide, dentro de ±${(tolOD * 100).toFixed(1)} %, con ninguna referencia del catálogo cargado.` };
      return { ...res, status: STATUS.CALC, why: `Sin calibre declarado. El diámetro medido coincide con ${near.row.cal} de catálogo (${pct(near.dev)}).` };
    }
    const ref = base.rows.find((r) => r.cal === declCal);
    if (!ref) return { ...res, status: STATUS.INSUF, why: `No hay referencia verificada de diámetro exterior para ${declCal} en «${base.label}».` };
    const dev = (D - ref.od) / ref.od;
    res.catalog.push(
      { label: `Diámetro exterior nominal ${ref.cal}`, value: f2(ref.od), unit: "mm", src: base.src, ref: ref.ref },
      { label: "Diámetro del conductor", value: f2(ref.dc), unit: "mm", src: base.src },
      { label: "Espesor de aislamiento / cubierta", value: `${ref.ins} / ${ref.jac}`, unit: "mm", src: base.src },
      { label: "Sección nominal", value: f2(ref.A), unit: "mm²", src: base.src },
    );
    res.calc.push({ label: "Desviación del diámetro medido frente al catálogo", value: pct(dev), unit: "", formula: "(D medido − D catálogo) / D catálogo" });
    const ok = Math.abs(dev) <= tolOD;
    return { ...res, status: ok ? STATUS.OK : STATUS.FAIL, dev,
      why: ok ? `Diámetro exterior ${pct(dev)} frente al catálogo, dentro de ±${(tolOD * 100).toFixed(1)} %.`
              : `Diámetro exterior ${pct(dev)} frente al catálogo de ${ref.cal}, fuera de ±${(tolOD * 100).toFixed(1)} %. Más cercano: ${near ? near.row.cal : "—"}.` };
  }

  /* ---------------- SÓLIDO DESNUDO ---------------- */
  if (mode === "bare_solid") {
    const Dr = parseReadings(input.D);
    if (!Dr.length) return { ...res, status: STATUS.INVALID, why: "Ingrese el diámetro medido del alambre." };
    const D = mean(Dr);
    res.measured = { D, readings: Dr };
    const A = circ(D);
    res.A = A;
    res.calc.push({ label: "Sección real estimada", value: f2(A), unit: "mm²", formula: `A = π × D² / 4 = π × ${f3(D)}² / 4` });
    res.sources.push(SOURCES.awg_def);
    const near = nearestBy(AWG_NOMINAL, "A", A);
    res.nearest = { cal: near.row.cal, kind: "Calibre comercial más cercano por sección", value: f2(near.row.A), unit: "mm²", dev: near.dev, src: "awg_def" };
    const cat = base.rows.find((r) => r.cal === near.row.cal);
    if (cat) res.catalog.push({ label: `Nexans ${cat.cal} · sección / diámetro`, value: `${f2(cat.A)} / ${f3(cat.dc)}`, unit: "mm² / mm", src: base.src, ref: cat.ref });
    if (input.material === "al") res.notes.push("No hay catálogo verificado de alambre sólido de aluminio en la base. La sección se contrasta solo con la definición AWG, que es geométrica e independiente del metal.");
    if (!declCal) return { ...res, status: STATUS.CALC, why: `Sección calculada ${f2(A)} mm². Calibre comercial más cercano: ${near.row.cal}.` };
    const nom = AWG_NOMINAL.find((r) => r.cal === declCal);
    res.catalog.push({ label: `Sección nominal AWG ${declCal} (definición)`, value: f2(nom.A), unit: "mm²", src: "awg_def" });
    const catDecl = base.rows.find((r) => r.cal === declCal);
    if (catDecl && catDecl !== cat) res.catalog.push({ label: `Nexans ${catDecl.cal} · sección / diámetro`, value: `${f2(catDecl.A)} / ${f3(catDecl.dc)}`, unit: "mm² / mm", src: base.src, ref: catDecl.ref });
    const j = judgeArea(A, nom.A, tolA);
    return { ...res, status: j.status, dev: j.dev, why: j.why + ` Más cercano: ${near.row.cal}.` };
  }

  /* ---------------- MULTIFILAR DESNUDO ---------------- */
  if (mode === "bare_str") {
    if (!base) return { ...res, status: STATUS.INVALID, why: "Seleccione el material / construcción." };
    const suspects = base.rows.filter((r) => r.suspect);
    suspects.forEach((r) => res.notes.push(`${r.cal}: ${r.suspect}`));

    /* Método 1 — diámetro exterior total */
    if (input.method !== "geo") {
      const Dr = parseReadings(input.D);
      if (!Dr.length) return { ...res, status: STATUS.INVALID, why: "Ingrese el diámetro exterior total del cable (sin desarmarlo)." };
      const D = mean(Dr);
      res.measured = { D, readings: Dr };
      res.notes.push("El diámetro exterior total no prueba la sección: un cable con menos hilos, hilos más delgados o compactado puede dar un diámetro parecido. Para confirmar la sección use el método geométrico.");
      const near = nearestBy(base.rows, "od", D);
      if (near) res.nearest = { cal: near.row.cal + (near.row.name ? " · " + near.row.name : ""), kind: "Diámetro exterior de catálogo más cercano (misma construcción)", value: near.row.od, unit: "mm", dev: near.dev, src: base.src };
      if (!declCal) {
        if (!near || Math.abs(near.dev) > tolOD) return { ...res, status: STATUS.INSUF, why: `No existe referencia verificada de «${base.label}» que coincida con ${f2(D)} mm dentro de ±${(tolOD * 100).toFixed(1)} %.` };
        return { ...res, status: STATUS.CALC, why: `Sin calibre declarado. Coincide con ${res.nearest.cal} (${pct(near.dev)}).` };
      }
      let refs = base.rows.filter((r) => r.cal === declCal && (!declName || r.name === declName));
      const susp = refs.filter((r) => r.suspect);
      refs = refs.filter((r) => !r.suspect);
      if (!refs.length) {
        const why = susp.length
          ? `La única referencia de ${declCal} en «${base.label}» tiene un diámetro publicado incoherente y está excluida. Información insuficiente para comparar.`
          : `No existe referencia verificada de diámetro exterior para ${declCal} en «${base.label}». No se compara contra otras construcciones (alambre sólido ni conductor de cable aislado).`;
        return { ...res, status: STATUS.INSUF, why, nearest: null };
      }
      let best = null;
      refs.forEach((r) => { const dev = (D - r.od) / r.od; if (!best || Math.abs(dev) < Math.abs(best.dev)) best = { r, dev }; });
      const r = best.r;
      res.catalog.push({ label: `Diámetro exterior nominal ${r.cal}${r.name ? " · " + r.name : ""}`, value: f2(r.od), unit: "mm", src: base.src, ref: r.ref });
      if (r.A != null) res.catalog.push({ label: "Sección nominal", value: f2(r.A), unit: "mm²", src: base.src });
      if (r.AAl != null) res.catalog.push({ label: `Construcción ${r.nAl}/${r.nSt} · área Al / acero`, value: `${f2(r.AAl)} / ${f2(r.ASt)}`, unit: "mm²", src: base.src });
      if (r.n) res.catalog.push({ label: "Hilos × diámetro de hilo", value: `${r.n} × ${r.d}`, unit: "mm", src: base.src });
      res.calc.push({ label: "Desviación del diámetro exterior", value: pct(best.dev), unit: "", formula: "(D medido − D catálogo) / D catálogo" });
      const ok = Math.abs(best.dev) <= tolOD;
      return { ...res, status: ok ? STATUS.OK : STATUS.FAIL, dev: best.dev,
        why: ok ? `Diámetro exterior ${pct(best.dev)} frente al catálogo, dentro de ±${(tolOD * 100).toFixed(1)} %.`
                : `Diámetro exterior ${pct(best.dev)} frente al catálogo, fuera de ±${(tolOD * 100).toFixed(1)} %.` };
    }

    /* Método 2 — geométrico N × π × d² / 4 */
    if (!input.sameWires) return { ...res, status: STATUS.INVALID, why: "El método geométrico solo es válido con hilos circulares del mismo diámetro. Confirme esa condición o use el método 1." };
    const N = Math.round(Number(input.N));
    const dr = parseReadings(input.d);
    if (!(N >= 2) || !dr.length) return { ...res, status: STATUS.INVALID, why: "Ingrese la cantidad de hilos (N ≥ 2) y el diámetro individual medido." };
    const d = mean(dr);
    res.measured = { N, d, readings: dr };
    const A = N * circ(d);
    res.A = A;
    const isAcsr = key === "bare_stranded_acsr";
    res.calc.push({ label: isAcsr ? "Área de aluminio calculada" : "Sección calculada", value: f2(A), unit: "mm²", formula: `A = N × π × d² / 4 = ${N} × π × ${f3(d)}² / 4` });
    let ASt = null, Nst = 0, dst = null;
    if (isAcsr) {
      Nst = Math.round(Number(input.Nst));
      const dsr = parseReadings(input.dst);
      if (!(Nst >= 1) || !dsr.length) return { ...res, status: STATUS.INVALID, why: "Para ACSR ingrese también la cantidad y el diámetro de los hilos de acero del núcleo." };
      dst = mean(dsr);
      ASt = Nst * circ(dst);
      res.measured.Nst = Nst; res.measured.dst = dst;
      res.calc.push({ label: "Área de acero calculada", value: f2(ASt), unit: "mm²", formula: `A = ${Nst} × π × ${f3(dst)}² / 4` });
    }
    const Dth = isAcsr ? (Nst === 1 && N === 6 && Math.abs(d - dst) / d < 0.02 ? 3 * d : null) : concentricOD(N, d);
    if (Dth) res.calc.push({ label: "Diámetro exterior teórico (cableado concéntrico)", value: f2(Dth), unit: "mm", formula: "D ≈ (2k + 1) × d, k = capas" });

    if (base.metal === "cu") {
      res.sources.push(SOURCES.awg_def);
      const near = nearestBy(AWG_NOMINAL, "A", A);
      res.nearest = { cal: near.row.cal, kind: "Calibre comercial más cercano por sección", value: f2(near.row.A), unit: "mm²", dev: near.dev, src: "awg_def" };
      const cat = base.rows.find((r) => r.cal === near.row.cal && !r.suspect);
      if (cat) res.catalog.push({ label: `Nexans ${cat.cal} · sección / diámetro exterior`, value: `${f2(cat.A)} / ${f2(cat.od)}`, unit: "mm² / mm", src: base.src, ref: cat.ref });
      res.notes.push("La ficha Nexans de cable desnudo no publica número ni diámetro de hilos. El número de hilos no se compara contra catálogo.");
      if (!declCal) return { ...res, status: STATUS.CALC, why: `Sección calculada ${f2(A)} mm². Calibre comercial más cercano: ${near.row.cal}.` };
      const nom = AWG_NOMINAL.find((r) => r.cal === declCal);
      res.catalog.push({ label: `Sección nominal AWG ${declCal} (definición)`, value: f2(nom.A), unit: "mm²", src: "awg_def" });
      const j = judgeArea(A, nom.A, tolA);
      return { ...res, status: j.status, dev: j.dev, why: j.why + ` Más cercano: ${near.row.cal}.` };
    }

    /* Aluminio AAC / AAAC / ACSR: comparación contra área de aluminio de catálogo */
    const near = nearestBy(base.rows, isAcsr ? "AAl" : "A", A);
    res.nearest = { cal: `${near.row.cal} · ${near.row.name}`, kind: "Referencia de catálogo más cercana por área de aluminio", value: f2(isAcsr ? near.row.AAl : near.row.A), unit: "mm²", dev: near.dev, src: base.src };
    if (!declCal) return { ...res, status: STATUS.CALC, why: `Área calculada ${f2(A)} mm². Referencia más cercana: ${res.nearest.cal}.` };
    let refs = base.rows.filter((r) => r.cal === declCal && (!declName || r.name === declName));
    if (!refs.length) return { ...res, status: STATUS.INSUF, why: `No hay referencia verificada para ${declCal} en «${base.label}».` };
    const r = refs[0];
    const Anom = isAcsr ? r.AAl : r.A;
    res.catalog.push({ label: `${isAcsr ? "Área de aluminio" : "Área"} nominal ${r.cal} · ${r.name}`, value: f2(Anom), unit: "mm²", src: base.src, ref: r.ref });
    if (isAcsr) res.catalog.push({ label: `Construcción ${r.nAl}/${r.nSt} · área de acero`, value: f2(r.ASt), unit: "mm²", src: base.src });
    res.catalog.push({ label: "Hilos × diámetro de catálogo", value: isAcsr ? `${r.nAl} × ${r.dAl} Al + ${r.nSt} × ${r.dSt} acero` : `${r.n} × ${r.d}`, unit: "mm", src: base.src });
    const nCat = isAcsr ? r.nAl : r.n;
    let constrOk = N === nCat && (!isAcsr || Nst === r.nSt);
    if (!constrOk) res.notes.push(`La construcción medida (${N}${isAcsr ? "/" + Nst : ""} hilos) no coincide con la de catálogo (${nCat}${isAcsr ? "/" + r.nSt : ""}).`);
    const j = judgeArea(A, Anom, tolA);
    if (j.status === STATUS.OK && !constrOk) return { ...res, status: STATUS.FAIL, dev: j.dev, why: j.why + " Pero la cantidad de hilos no corresponde a la construcción declarada." };
    if (isAcsr) {
      const dSt = (ASt - r.ASt) / r.ASt;
      res.calc.push({ label: "Desviación del área de acero", value: pct(dSt), unit: "", formula: "(A calc − A catálogo) / A catálogo" });
      if (Math.abs(dSt) > tolA && j.status === STATUS.OK) return { ...res, status: STATUS.FAIL, dev: j.dev, why: j.why + ` Pero el núcleo de acero se desvía ${pct(dSt)}.` };
    }
    return { ...res, status: j.status, dev: j.dev, why: j.why };
  }

  return { ...res, status: STATUS.INVALID, why: "Seleccione una modalidad." };
}

/* ---------------- CASOS DE PRUEBA ---------------- */
const TEST_CASES = [
  {
    name: "Sólido desnudo de 2,50 mm",
    expect: "Sección 4,91 mm² · calibre comercial más cercano 10 AWG",
    input: { mode: "bare_solid", material: "cu", declared: "", D: "2.50" },
    check: (r) => f2(r.A) === "4.91" && r.nearest && r.nearest.cal === "10 AWG",
  },
  {
    name: "Multifilar desnudo 7 × 0,776 mm",
    expect: "Sección ≈ 3,31 mm² · 12 AWG",
    input: { mode: "bare_str", material: "cu", method: "geo", N: 7, d: "0.776", sameWires: true, declared: "12 AWG" },
    check: (r) => f2(r.A) === "3.31" && r.nearest && r.nearest.cal === "12 AWG" && r.status === STATUS.OK,
  },
  {
    name: "Multifilar desnudo D = 2,50 mm, declarado 12 AWG",
    expect: "Solo referencias de su construcción → información insuficiente",
    input: { mode: "bare_str", material: "cu", method: "od", D: "2.50", declared: "12 AWG" },
    check: (r) => r.status === STATUS.INSUF && r.catalog.length === 0,
  },
];

function runTests() {
  return TEST_CASES.map((t) => {
    const r = evaluate(t.input);
    let pass = false;
    try { pass = !!t.check(r); } catch (e) { pass = false; }
    return { ...t, result: r, pass };
  });
}

if (typeof module !== "undefined") module.exports = { evaluate, runTests, STATUS, parseReadings };
