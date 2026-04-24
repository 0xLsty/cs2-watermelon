export const MESES = {
  1: 'Jan',
  2: 'Fev',
  3: 'Mar',
  4: 'Abr',
  5: 'Mai',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Set',
  10: 'Out',
  11: 'Nov',
  12: 'Dez',
};

/**
 * Faz parsing seguro de data no formato DD/MM/AAAA
 */
export function parseDateParts(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || '').trim());
  if (!match) return null;

  const dia = Number(match[1]);
  const mesNum = Number(match[2]);
  const anoNum = Number(match[3]);

  const date = new Date(anoNum, mesNum - 1, dia);

  const isValid =
    date.getFullYear() === anoNum &&
    date.getMonth() === mesNum - 1 &&
    date.getDate() === dia;

  if (!isValid) return null;

  return {
    dia,
    mesNum,
    ano: String(anoNum),
    mes: MESES[mesNum] || null,
  };
}

/**
 * Cria chave única do ativo (evita conflito entre skins parecidas)
 */
export function buildIdentityKey({ asset, category }) {
  return `${asset}::${category}`;
}

/**
 * Calcula preço médio ponderado (incluindo taxas)
 */
export function calculateAverageCost({
  currentQty,
  currentAvg,
  buyQty,
  buyPrice,
  fees = 0,
}) {
  const totalCostAtual = currentQty * currentAvg;
  const totalCostNovo = buyQty * buyPrice + fees;

  const novaQtd = currentQty + buyQty;
  if (novaQtd === 0) return 0;

  return (totalCostAtual + totalCostNovo) / novaQtd;
}

/**
 * Calcula lucro realizado na venda
 */
export function calculateRealizedProfit({
  sellQty,
  sellPrice,
  avgCost,
  fees = 0,
}) {
  return sellQty * sellPrice - fees - avgCost * sellQty;
}

/**
 * Atualiza quantidade após venda
 */
export function applySaleQuantity(currentQty, sellQty) {
  const novaQtd = currentQty - sellQty;
  return novaQtd < 0 ? 0 : novaQtd;
}

/**
 * Validação básica de transação
 */
export function validateTransaction({
  asset,
  category,
  quantity,
  price,
}) {
  if (!asset || !category) return 'Ativo inválido';
  if (quantity <= 0) return 'Quantidade inválida';
  if (price <= 0) return 'Preço inválido';
  return null;
}
