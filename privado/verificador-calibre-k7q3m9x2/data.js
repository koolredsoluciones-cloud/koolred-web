/* =====================================================================
   BASE DE REFERENCIAS — Verificador de calibre KoolRed
   ---------------------------------------------------------------------
   REGLA: aquí solo hay valores copiados textualmente de fichas oficiales
   de fabricante (Nexans Colombia, consultadas el 2026-11-25).
   - No se interpolan ni se completan diámetros faltantes.
   - Un campo ausente en la fuente se deja en null.
   - Las mediciones de campo NUNCA se agregan a esta base.
   La única tabla calculada es AWG_NOMINAL, que sale de la definición
   matemática del sistema AWG/kcmil (no de un fabricante) y se rotula así.
   ===================================================================== */

const SOURCES = {
  nx_cu_alambre: {
    name: "Nexans Colombia — Alambre de cobre desnudo (ref. familia 21746)",
    url: "https://www.nexans.co/es/products/Construcci%C3%B3n/Cables-de-Cobre-Desnudo/Alambre-de-Cobre-Desnudo/Bare-Coppe21746.html",
    norms: "NTC 359, ASTM B3, ASTM B2, ASTM B1 · temple suave · sólido",
  },
  nx_cu_cable: {
    name: "Nexans Colombia — Cable de cobre desnudo metro a metro (ref. familia 21744)",
    url: "https://www.nexans.co/es/products/Sistemas-Solares/Cables-de-Cobre-Desnudo/Cable-de-Cobre-Desnudo/Bare-Coppe21744.html",
    norms: "ASTM B3, B8, B496 · NTC 307, NTC 359 · cableado concéntrico clase B, temple suave",
  },
  nx_thhn_alambre: {
    name: "Nexans Colombia — Alambre THHN/THWN-2 600 V RoHS",
    url: "https://www.nexans.co/es/products/Construcci%C3%B3n/Cables-de-Cobre-de-Baja-Tensi%C3%B3n-Aislados/Alambre-THHN-THWN-2/Wire-Type-24145.html",
    norms: "Cobre sólido · aislamiento PVC · cubierta nylon · 600 V · 90 °C",
  },
  nx_thhn_cable: {
    name: "Nexans Colombia — Cable THHN/THWN-2 600 V CT RoHS",
    url: "https://www.nexans.co/es/products/Construcci%C3%B3n/Cables-de-Cobre-de-Baja-Tensi%C3%B3n-Aislados/Cable-THHN-THWN-2/Cable-Type24144.html",
    norms: "Cobre suave clase B · aislamiento PVC · cubierta nylon · 600 V · 90 °C",
  },
  nx_aac: {
    name: "Nexans Colombia — Cable AAC 1350-H19",
    url: "https://www.nexans.co/es/products/Redes-de-Transmisi%C3%B3n-y-Distribuci%C3%B3n-de-Energ%C3%ADa/Cables-de-Aluminio-Desnudo/Cable-AAC/AAC-1350-H19.html",
    norms: "ASTM B230 (NTC 360), ASTM B231 (NTC 308) · 7 hilos de aluminio según ficha",
  },
  nx_aaac: {
    name: "Nexans Colombia — Cable AAAC 6201-T81",
    url: "https://www.nexans.co/es/products/Redes-de-Transmisi%C3%B3n-y-Distribuci%C3%B3n-de-Energ%C3%ADa/Cables-de-Aluminio-Desnudo/Cable-AAAC/AAAC-6201-T81.html",
    norms: "ASTM B398 (NTC 2729), ASTM B399 (NTC 2730)",
  },
  nx_acsr: {
    name: "Nexans Colombia — Cable ACSR 1350-H19 con núcleo de acero galvanizado",
    url: "https://www.nexans.co/es/products/Redes-de-Transmisi%C3%B3n-y-Distribuci%C3%B3n-de-Energ%C3%ADa/Cables-de-Aluminio-Desnudo/Cable-ACSR/Cable-ACSR.html",
    norms: "Solo se cargaron las filas leídas textualmente de la ficha (4 AWG a 556,5 kcmil).",
  },
  awg_def: {
    name: "Definición del sistema AWG (ASTM B258) y kcmil — valor CALCULADO, no de fabricante",
    url: "",
    norms: "d(in) = 0,005 · 92^((36−n)/39) · 1 kcmil = 0,506707 mm²",
  },
};

/* ---------- Cobre desnudo SÓLIDO (Nexans 21746) ---------- */
const CU_SOLID_BARE = [
  { cal: "14 AWG", ref: "204628", A: 2.08, dc: 1.628, od: 1.628, kgkm: 18.3, rdc: 8.456 },
  { cal: "12 AWG", ref: "204629", A: 3.31, dc: 2.042, od: 2.042, kgkm: 29.1, rdc: 5.314 },
  { cal: "10 AWG", ref: "204632", A: 5.26, dc: 2.575, od: 2.575, kgkm: 46.3, rdc: 3.346 },
];

/* ---------- Cobre desnudo MULTIFILAR clase B (Nexans 21744) ----------
   La ficha no publica número de hilos ni diámetro de hilo → null.
   El 500 kcmil figura con 29,67 mm, valor incoherente con la sección
   (el 350 kcmil es 17,29 mm y el conductor THHN de 500 kcmil es 19,82 mm).
   Se marca como 'suspect' y se EXCLUYE de la comparación.            */
const CU_STRANDED_BARE = [
  { cal: "8 AWG",    ref: "213787", A: 8.37,   od: 3.7,   n: null, d: null, kgkm: 73.11, rdc: 2.142 },
  { cal: "6 AWG",    ref: "213788", A: 13.3,   od: 4.67,  n: null, d: null, kgkm: 120.39, rdc: 1.346 },
  { cal: "4 AWG",    ref: "213789", A: 21.15,  od: 5.89,  n: null, d: null, kgkm: 191.71, rdc: 0.847 },
  { cal: "2 AWG",    ref: "213790", A: 33.63,  od: 7.42,  n: null, d: null, kgkm: 305, rdc: 0.532 },
  { cal: "1/0 AWG",  ref: "213791", A: 53.51,  od: 9.47,  n: null, d: null, kgkm: 484, rdc: 0.335 },
  { cal: "2/0 AWG",  ref: "213792", A: 67.44,  od: 10.63, n: null, d: null, kgkm: 612, rdc: 0.266 },
  { cal: "3/0 AWG",  ref: "213793", A: 85.03,  od: 11.94, n: null, d: null, kgkm: 771, rdc: 0.2111 },
  { cal: "4/0 AWG",  ref: "213794", A: 107.22, od: 13.4,  n: null, d: null, kgkm: 943, rdc: 0.167 },
  { cal: "250 kcmil", ref: "213795", A: 126.7, od: 14.62, n: null, d: null, kgkm: 1149, rdc: 0.142 },
  { cal: "350 kcmil", ref: "213796", A: 177.3, od: 17.29, n: null, d: null, kgkm: 1608, rdc: 0.1011 },
  { cal: "500 kcmil", ref: "213797", A: 253.4, od: 29.67, n: null, d: null, kgkm: 2295, rdc: 0.071,
    suspect: "La ficha publica 29,67 mm, incoherente con la sección. Excluido hasta confirmar con Nexans." },
];

/* ---------- THHN/THWN-2 SÓLIDO (Nexans 24145) ---------- */
const THHN_SOLID = [
  { cal: "14 AWG", ref: "200300", A: 2.08, dc: 1.63, ins: 0.38, jac: 0.1,  od: 2.73 },
  { cal: "12 AWG", ref: "200303", A: 3.31, dc: 2.05, ins: 0.38, jac: 0.1,  od: 3.15 },
  { cal: "10 AWG", ref: "200305", A: 5.26, dc: 2.59, ins: 0.51, jac: 0.1,  od: 3.95 },
  { cal: "8 AWG",  ref: "200307", A: 8.37, dc: 3.2,  ins: 0.76, jac: 0.13, od: 5.2 },
];

/* ---------- THHN/THWN-2 MULTIFILAR clase B (Nexans 24144) ---------- */
const THHN_STRANDED = [
  { cal: "14 AWG",   ref: "200351", A: 2.08,   dc: 1.77,  ins: 0.38, jac: 0.1,  od: 2.89 },
  { cal: "12 AWG",   ref: "200354", A: 3.31,   dc: 2.22,  ins: 0.38, jac: 0.1,  od: 3.36 },
  { cal: "10 AWG",   ref: "200359", A: 5.26,   dc: 2.79,  ins: 0.51, jac: 0.1,  od: 4.21 },
  { cal: "8 AWG",    ref: "200363", A: 8.37,   dc: 3.52,  ins: 0.76, jac: 0.13, od: 5.53 },
  { cal: "6 AWG",    ref: "200369", A: 13.3,   dc: 4.44,  ins: 0.76, jac: 0.13, od: 6.47 },
  { cal: "4 AWG",    ref: "200373", A: 21.15,  dc: 5.61,  ins: 1.02, jac: 0.15, od: 8.23 },
  { cal: "2 AWG",    ref: "200383", A: 33.63,  dc: 7.09,  ins: 1.02, jac: 0.15, od: 9.72 },
  { cal: "1/0 AWG",  ref: "200390", A: 53.51,  dc: 8.76,  ins: 1.27, jac: 0.18, od: 12.03 },
  { cal: "2/0 AWG",  ref: "200394", A: 67.44,  dc: 9.82,  ins: 1.27, jac: 0.18, od: 13.12 },
  { cal: "3/0 AWG",  ref: "200398", A: 85.03,  dc: 11.44, ins: 1.27, jac: 0.18, od: 14.35 },
  { cal: "4/0 AWG",  ref: "200402", A: 107.22, dc: 12.38, ins: 1.27, jac: 0.18, od: 15.74 },
  { cal: "250 kcmil", ref: "200406", A: 126.68, dc: 14.05, ins: 1.52, jac: 0.2, od: 17.86 },
  { cal: "350 kcmil", ref: "200410", A: 177.35, dc: 16.57, ins: 1.52, jac: 0.2, od: 20.46 },
  { cal: "500 kcmil", ref: "200416", A: 253.35, dc: 19.82, ins: 1.52, jac: 0.2, od: 23.73 },
];

/* ---------- AAC 1350-H19 (Nexans) — A = área de aluminio ---------- */
const AAC = [
  { cal: "4 AWG",      name: "Rose",  ref: "200036", n: 7, d: 1.96, A: 21.2,  od: 5.88 },
  { cal: "2 AWG",      name: "Iris",  ref: "200037", n: 7, d: 2.47, A: 33.6,  od: 7.42 },
  { cal: "1/0 AWG",    name: "Poppy", ref: "200040", n: 7, d: 3.12, A: 53.5,  od: 9.36 },
  { cal: "2/0 AWG",    name: "Aster", ref: "200042", n: 7, d: 3.5,  A: 67.4,  od: 10.51 },
  { cal: "3/0 AWG",    name: "Phlox", ref: "200044", n: 7, d: 3.93, A: 85,    od: 11.8 },
  { cal: "4/0 AWG",    name: "Oxlip", ref: "200045", n: 7, d: 4.42, A: 107,   od: 13.25 },
  { cal: "266.8 kcmil", name: "Daisy", ref: "200047", n: 7, d: 4.96, A: 134.6, od: 14.88 },
];

/* ---------- AAAC 6201-T81 (Nexans) — calibre en kcmil de aleación ---------- */
const AAAC = [
  { cal: "48.69 kcmil", name: "Alton",    ref: "210676", n: 7,  d: 2.12, A: 24.7,  od: 6.36 },
  { cal: "77.47 kcmil", name: "Ames",     ref: "200057", n: 7,  d: 2.67, A: 39.25, od: 8.02 },
  { cal: "123.3 kcmil", name: "Azusa",    ref: "200058", n: 7,  d: 3.37, A: 62.48, od: 10.11 },
  { cal: "155.4 kcmil", name: "Anaheim",  ref: "209804", n: 7,  d: 3.78, A: 78.74, od: 11.35 },
  { cal: "195.7 kcmil", name: "Amherst",  ref: null,     n: 7,  d: 4.25, A: 99.2,  od: 12.74 },
  { cal: "246.9 kcmil", name: "Alliance", ref: "203070", n: 7,  d: 4.77, A: 125,   od: 14.31 },
  { cal: "312.8 kcmil", name: "Butte",    ref: "200055", n: 19, d: 3.26, A: 159,   od: 16.3 },
  { cal: "394.5 kcmil", name: "Canton",   ref: "204944", n: 19, d: 3.66, A: 200,   od: 18.3 },
  { cal: "465.4 kcmil", name: "Cairo",    ref: "209805", n: 19, d: 3.98, A: 236,   od: 19.88 },
  { cal: "559.5 kcmil", name: "Darien",   ref: "200053", n: 19, d: 4.36, A: 284,   od: 21.79 },
  { cal: "740.8 kcmil", name: "Flint",    ref: "205742", n: 37, d: 3.59, A: 375,   od: 25.16 },
  { cal: "927.2 kcmil", name: "Greeley",  ref: "200051", n: 37, d: 4.02, A: 470,   od: 28.15 },
];

/* ---------- ACSR (Nexans) — solo filas leídas textualmente ---------- */
const ACSR = [
  { cal: "4 AWG",       name: "Swan",      ref: "200000", nAl: 6,  nSt: 1, dAl: 2.118, dSt: 2.118, AAl: 21.14,  ASt: 3.52,  od: 6.36 },
  { cal: "2 AWG",       name: "Sparrow",   ref: "200001", nAl: 6,  nSt: 1, dAl: 2.672, dSt: 2.672, AAl: 33.64,  ASt: 5.61,  od: 8.01 },
  { cal: "1/0 AWG",     name: "Raven",     ref: "200002", nAl: 6,  nSt: 1, dAl: 3.371, dSt: 3.371, AAl: 53.55,  ASt: 8.92,  od: 10.11 },
  { cal: "2/0 AWG",     name: "Quail",     ref: "200005", nAl: 6,  nSt: 1, dAl: 3.782, dSt: 3.782, AAl: 67.4,   ASt: 11.23, od: 11.35 },
  { cal: "3/0 AWG",     name: "Pigeon",    ref: "203265", nAl: 6,  nSt: 1, dAl: 4.247, dSt: 4.247, AAl: 85,     ASt: 14.17, od: 12.74 },
  { cal: "4/0 AWG",     name: "Penguin",   ref: "200006", nAl: 6,  nSt: 1, dAl: 4.77,  dSt: 4.77,  AAl: 107.22, ASt: 17.87, od: 14.31 },
  { cal: "266.8 kcmil", name: "Partridge", ref: "200012", nAl: 26, nSt: 7, dAl: 2.573, dSt: 2.002, AAl: 135.19, ASt: 22.04, od: 16.29 },
  { cal: "336.4 kcmil", name: "Linnet",    ref: "200014", nAl: 26, nSt: 7, dAl: 2.888, dSt: 2.245, AAl: 170.32, ASt: 27.71, od: 18.3 },
  { cal: "397.5 kcmil", name: "Brant",     ref: null,     nAl: 24, nSt: 7, dAl: 3.267, dSt: 2.179, AAl: 201.19, ASt: 26.1,  od: 19.61 },
  { cal: "397.5 kcmil", name: "Ibis",      ref: "208999", nAl: 26, nSt: 7, dAl: 3.139, dSt: 2.441, AAl: 201.21, ASt: 32.76, od: 19.89 },
  { cal: "477 kcmil",   name: "Flicker",   ref: "200025", nAl: 24, nSt: 7, dAl: 3.581, dSt: 2.388, AAl: 241.72, ASt: 31.35, od: 21.49 },
  { cal: "477 kcmil",   name: "Hawk",      ref: "200029", nAl: 26, nSt: 7, dAl: 3.439, dSt: 2.675, AAl: 241.51, ASt: 39.34, od: 21.79 },
  { cal: "556.5 kcmil", name: "Parakeet",  ref: "204201", nAl: 24, nSt: 7, dAl: 3.868, dSt: 2.578, AAl: 282.02, ASt: 36.54, od: 23.21 },
  { cal: "556.5 kcmil", name: "Dove",      ref: "207358", nAl: 26, nSt: 7, dAl: 3.716, dSt: 2.891, AAl: 281.98, ASt: 45.95, od: 23.53 },
];

/* ---------- Secciones nominales AWG/kcmil (CALCULADAS por definición) ---------- */
const AWG_NOMINAL = (() => {
  const g = [["18", 18], ["16", 16], ["14", 14], ["12", 12], ["10", 10], ["8", 8], ["6", 6], ["4", 4], ["3", 3],
    ["2", 2], ["1", 1], ["1/0", 0], ["2/0", -1], ["3/0", -2], ["4/0", -3]];
  const out = g.map(([label, n]) => {
    const dmm = 0.127 * Math.pow(92, (36 - n) / 39);
    return { cal: label + " AWG", A: Math.PI * dmm * dmm / 4, dSolid: dmm };
  });
  [250, 300, 350, 400, 500, 600, 750, 1000].forEach((k) => out.push({ cal: k + " kcmil", A: k * 0.506707, dSolid: null }));
  return out;
})();

/* Bases de catálogo por modalidad / construcción */
const BASES = {
  insulated_solid:    { label: "Cobre THHN/THWN-2 sólido",      rows: THHN_SOLID,       src: "nx_thhn_alambre", metal: "cu" },
  insulated_stranded: { label: "Cobre THHN/THWN-2 multifilar",  rows: THHN_STRANDED,    src: "nx_thhn_cable",   metal: "cu" },
  bare_solid_cu:      { label: "Cobre desnudo sólido",          rows: CU_SOLID_BARE,    src: "nx_cu_alambre",   metal: "cu" },
  bare_solid_al:      { label: "Aluminio desnudo sólido",       rows: [],               src: null,              metal: "al" },
  bare_stranded_cu:   { label: "Cobre desnudo multifilar clase B", rows: CU_STRANDED_BARE, src: "nx_cu_cable",  metal: "cu" },
  bare_stranded_aac:  { label: "Aluminio AAC 1350-H19",         rows: AAC,              src: "nx_aac",          metal: "al" },
  bare_stranded_aaac: { label: "Aleación AAAC 6201-T81",        rows: AAAC,             src: "nx_aaac",         metal: "al" },
  bare_stranded_acsr: { label: "ACSR (aluminio + acero)",       rows: ACSR,             src: "nx_acsr",         metal: "al" },
};
