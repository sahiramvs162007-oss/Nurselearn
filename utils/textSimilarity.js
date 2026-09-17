function normalizeText(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

// Devuelve un porcentaje 0-100 de qué tan parecidas son dos respuestas
function similarityPercent(correcta, dada) {
  const a = normalizeText(correcta);
  const b = normalizeText(dada);
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  const distancia = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const ratio = Math.max(0, 1 - distancia / maxLen);
  return Math.round(ratio * 100);
}

module.exports = { normalizeText, levenshtein, similarityPercent };
