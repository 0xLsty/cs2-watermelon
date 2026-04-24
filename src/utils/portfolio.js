const MONTHS = {
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

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function compactParts(parts) {
  return parts
    .map(part => normalizeText(part))
    .filter(Boolean)
    .join('::');
}

export function formatCurrency(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatPercent(value) {
  const n = Number(value || 0);
  const sign = n > 0 ? '+' : '';
  return `${sign}${(Number.isFinite(n) ? n : 0).toFixed(2)}%`;
}

export function formatAssetCount(value) {
  const n = Number(value || 0);
  return `${n} ${n === 1 ? 'ativo' : 'ativos'}`;
}

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
    mes: MONTHS[mesNum],
  };
}

export function applyDateMask(value) {
  const onlyNumbers = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (onlyNumbers.length <= 2) return onlyNumbers;
  if (onlyNumbers.length <= 4) return `${onlyNumbers.slice(0, 2)}/${onlyNumbers.slice(2)}`;
  return `${onlyNumbers.slice(0, 2)}/${onlyNumbers.slice(2, 4)}/${onlyNumbers.slice(4)}`;
}

export function toNumber(value) {
  if (typeof value === 'number') return value;
  const normalized = String(value || '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

export function toPositiveInt(value) {
  const n = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

export function calculateAverageCost({ currentQty, currentAvg, buyQty, buyPrice, fees = 0 }) {
  const qAtual = Number(currentQty || 0);
  const pmAtual = Number(currentAvg || 0);
  const qCompra = Number(buyQty || 0);
  const precoCompra = Number(buyPrice || 0);
  const taxas = Number(fees || 0);

  const novaQtd = qAtual + qCompra;
  if (novaQtd <= 0) return 0;

  return ((qAtual * pmAtual) + (qCompra * precoCompra) + taxas) / novaQtd;
}

export function calculateRealizedProfit({ sellQty, sellPrice, avgCost, fees = 0 }) {
  const qtd = Number(sellQty || 0);
  const preco = Number(sellPrice || 0);
  const pm = Number(avgCost || 0);
  const taxas = Number(fees || 0);

  return (qtd * preco) - taxas - (qtd * pm);
}

export function getCategoryFields(category) {
  const common = {
    Skin: [
      { key: 'collection', label: 'Coleção', placeholder: 'Ex.: The Dust Collection' },
      { key: 'rarity', label: 'Raridade', placeholder: 'Ex.: Classified' },
      { key: 'wear', label: 'Exterior', placeholder: 'Ex.: Factory New' },
      { key: 'float', label: 'Float', placeholder: 'Ex.: 0.0123' },
      { key: 'pattern', label: 'Pattern', placeholder: 'Ex.: 661' },
      { key: 'statTrak', label: 'StatTrak?', type: 'select', options: ['Não', 'Sim'] },
    ],
    Sticker: [
      { key: 'event', label: 'Evento', placeholder: 'Ex.: Katowice 2014' },
      { key: 'team', label: 'Time / Artista', placeholder: 'Ex.: iBUYPOWER' },
      { key: 'type', label: 'Tipo', placeholder: 'Ex.: Holo' },
      { key: 'rarity', label: 'Raridade', placeholder: 'Ex.: Exotic' },
    ],
    Agente: [
      { key: 'collection', label: 'Operação / Coleção', placeholder: 'Ex.: Broken Fang' },
      { key: 'rarity', label: 'Raridade', placeholder: 'Ex.: Master' },
      { key: 'faction', label: 'Facção', placeholder: 'Ex.: CT' },
    ],
    Caixa: [
      { key: 'collection', label: 'Coleção', placeholder: 'Ex.: Dreams & Nightmares' },
      { key: 'dropStatus', label: 'Status de drop', placeholder: 'Ex.: Raro' },
    ],
    Cápsula: [
      { key: 'event', label: 'Evento', placeholder: 'Ex.: Paris 2023' },
      { key: 'type', label: 'Tipo', placeholder: 'Ex.: Legends' },
    ],
    Charm: [
      { key: 'collection', label: 'Coleção', placeholder: 'Ex.: Missing Link' },
      { key: 'rarity', label: 'Raridade', placeholder: 'Ex.: Extraordinary' },
      { key: 'pattern', label: 'Pattern', placeholder: 'Ex.: 12345' },
    ],
  };

  return common[category] || [];
}

export function createDetails(category, form) {
  const details = {
    observacoes: form.observacoes || '',
  };

  for (const field of getCategoryFields(category)) {
    details[field.key] = form[field.key] || '';
  }

  if (category === 'Skin') {
    details.hasStickers = form.hasStickers || 'Não';
    details.stickers = [1, 2, 3, 4, 5]
      .map(n => form[`sticker${n}`])
      .filter(Boolean);
  }

  if (category === 'Agente') {
    details.hasPatches = form.hasPatches || 'Não';
    details.patches = [1, 2, 3]
      .map(n => form[`patch${n}`])
      .filter(Boolean);
  }

  return details;
}

export function buildIdentityKey(category, details = {}, asset = '') {
  const base = [category, asset];

  if (category === 'Skin') {
    return compactParts([
      ...base,
      details.wear,
      details.float,
      details.pattern,
      details.statTrak,
      ...(details.stickers || []),
    ]);
  }

  if (category === 'Sticker') {
    return compactParts([
      ...base,
      details.event,
      details.team,
      details.type,
    ]);
  }

  if (category === 'Agente') {
    return compactParts([
      ...base,
      details.faction,
      ...(details.patches || []),
    ]);
  }

  if (category === 'Charm') {
    return compactParts([
      ...base,
      details.pattern,
    ]);
  }

  return compactParts(base);
}

export function buildExtra(category, details = {}) {
  const parts = [];

  if (details.rarity) parts.push(details.rarity);
  if (details.wear) parts.push(details.wear);
  if (details.float) parts.push(`Float ${details.float}`);
  if (details.pattern) parts.push(`Pattern ${details.pattern}`);
  if (details.event) parts.push(details.event);
  if (details.team) parts.push(details.team);
  if (details.type) parts.push(details.type);
  if (details.faction) parts.push(details.faction);
  if (details.dropStatus) parts.push(details.dropStatus);

  if (category === 'Skin' && details.stickers?.length) {
    parts.push(`${details.stickers.length} sticker${details.stickers.length > 1 ? 's' : ''}`);
  }

  if (category === 'Agente' && details.patches?.length) {
    parts.push(`${details.patches.length} patch${details.patches.length > 1 ? 'es' : ''}`);
  }

  return parts.filter(Boolean).join(' • ');
}

export function buildTableExtra(category, details = {}) {
  const extra = buildExtra(category, details);
  return extra || 'Sem detalhes adicionais';
}
