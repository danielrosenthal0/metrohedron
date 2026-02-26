const MTA_LINE_COLORS: Record<string, string> = {
  A: "#0062CF",
  C: "#0062CF",
  E: "#0062CF",
  B: "#EB6800",
  D: "#EB6800",
  F: "#EB6800",
  M: "#EB6800",
  G: "#799534",
  J: "#8E5C33",
  Z: "#8E5C33",
  L: "#7C858C",
  N: "#F6BC26",
  Q: "#F6BC26",
  R: "#F6BC26",
  W: "#F6BC26",
  "1": "#D82233",
  "2": "#D82233",
  "3": "#D82233",
  "4": "#009952",
  "5": "#009952",
  "6": "#009952",
  "7": "#9A38A1",
  T: "#008EB7",
  SIR: "#08179C",
  S: "#7C858C",
  H: "#7C858C",
  FS: "#7C858C",
  GS: "#7C858C",
  SI: "#08179C",
};

function normalizeHexColor(color?: string | null) {
  if (!color) return null;
  const trimmed = color.trim();
  if (!trimmed) return null;

  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const isHex = /^#[0-9A-Fa-f]{6}$/.test(withHash);
  return isHex ? withHash.toUpperCase() : null;
}

export function resolveMtaLineColor(
  lineName?: string,
  ...candidates: Array<string | undefined | null>
) {
  for (const candidate of candidates) {
    const normalized = normalizeHexColor(candidate);
    if (normalized) return normalized;
  }

  if (lineName) {
    const key = lineName.trim().toUpperCase();
    if (MTA_LINE_COLORS[key]) return MTA_LINE_COLORS[key];
  }

  return "#2563EB";
}

