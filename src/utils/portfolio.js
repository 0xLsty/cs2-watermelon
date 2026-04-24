import {
  EXTERIOR_OPTS,
  STICKER_TYPE_OPTIONS,
  CAPSULE_TYPE_OPTIONS,
  DROP_STATUS_OPTIONS,
} from '../config/constants';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  const n = Number(value || 0);
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

function formatAssetCount(count) {
  return count === 1 ? '1 ativo' : `${count} ativos`;
}

function parseDateParts(dateString) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateString || '');
  if (!match) return null;
  const [, , mes, ano] = match;
  const nomes = { '01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril','05':'Maio','06':'Junho','07':'Julho','08':'Agosto','09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro' };
  return { mes: nomes[mes], ano };
}

function applyDateMask(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}

function toNumber(value) {
  if (value === '' || value == null) return 0;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function toPositiveInt(value) {
  const n = Math.floor(toNumber(value));
  return Number.isFinite(n) ? n : NaN;
}

function getCategoryFields(category) {
  if (category === 'Skin') return [
    { label: 'Arma', key: 'arma', placeholder: 'Ex.: AK-47' },
    { label: 'Coleção', key: 'colecao', placeholder: 'Ex.: Arms Deal' },
    { label: 'Float', key: 'float', placeholder: 'Ex.: 0.1523' },
    { label: 'Pattern / Seed', key: 'pattern', placeholder: 'Ex.: 661' },
    { label: 'Exterior', key: 'exterior', type: 'select', options: EXTERIOR_OPTS },
    { label: 'StatTrak™', key: 'stattrak', type: 'select', options: ['Não', 'Sim'] },
  ];
  if (category === 'Sticker') return [
    { label: 'Cápsula de origem', key: 'capsulaOrigem', placeholder: 'Ex.: Elemental Craft / Budapest 2025' },
    { label: 'Tipo', key: 'classificacao', type: 'select', options: STICKER_TYPE_OPTIONS },
    { label: 'Acabamento', key: 'acabamento', type: 'select', options: ['Paper','Holo','Foil','Gold','Glitter','Embroidered'] },
    { label: 'Nome / Descrição', key: 'timePlayer', placeholder: 'Ex.: Katowice 2014' },
  ];
  if (category === 'Agente') return [
    { label: 'Lado', key: 'lado', type: 'select', options: ['CT','TR'] },
    { label: 'Raridade', key: 'raridade', type: 'select', options: ['Distinguished Agent','Exceptional Agent','Superior Agent','Master Agent'] },
    { label: 'Operação / Coleção', key: 'operacao', placeholder: 'Ex.: Riptide' },
  ];
  if (category === 'Caixa') return [
    { label: 'Coleção / Operação', key: 'operacao', placeholder: 'Ex.: Breakout' },
    { label: 'Status de drop', key: 'statusDrop', type: 'select', options: DROP_STATUS_OPTIONS },
    { label: 'Demanda de abertura', key: 'demandaAbertura', type: 'select', options: ['Baixa','Média','Alta','Muito Alta'] },
  ];
  if (category === 'Cápsula') return [
    { label: 'Nome / Origem', key: 'capsulaOrigem', placeholder: 'Ex.: Elemental Craft / Budapest 2025' },
    { label: 'Tipo de cápsula', key: 'tipoCapsula', type: 'select', options: CAPSULE_TYPE_OPTIONS },
    { label: 'Status', key: 'statusDrop', type: 'select', options: DROP_STATUS_OPTIONS },
  ];
  if (category === 'Charm') return [
    { label: 'Coleção / Origem', key: 'origem', placeholder: 'Ex.: Missing Link' },
    { label: 'Raridade', key: 'raridade', type: 'select', options: ['Remarkable','Extraordinary'] },
    { label: 'Variante', key: 'variant', placeholder: 'Ex.: Azul / Padrão' },
  ];
  return [];
}

function createDetails(category, form) {
  return {
    tipo: category,
    float: form.float || '-', exterior: form.exterior || '-',
    stattrak: form.stattrak || 'Não', colecao: form.colecao || '-',
    arma: form.arma || '-', pattern: form.pattern || '-',
    ano: form.ano || '-', campeonato: form.campeonato || '-',
    classificacao: form.classificacao || '-', acabamento: form.acabamento || '-',
    timePlayer: form.timePlayer || '-', capsulaOrigem: form.capsulaOrigem || '-',
    lado: form.lado || '-', raridade: form.raridade || '-',
    operacao: form.operacao || '-', statusDrop: form.statusDrop || '-',
    demandaAbertura: form.demandaAbertura || '-', tipoCapsula: form.tipoCapsula || '-',
    origem: form.origem || '-', variant: form.variant || '-',
    hasStickers: form.hasStickers || 'Não',
    sticker1: form.sticker1 || '-', sticker2: form.sticker2 || '-',
    sticker3: form.sticker3 || '-', sticker4: form.sticker4 || '-',
    sticker5: form.sticker5 || '-',
    hasPatches: form.hasPatches || 'Não',
    patch1: form.patch1 || '-', patch2: form.patch2 || '-', patch3: form.patch3 || '-',
    observacoes: form.observacoes || '',
  };
}

function buildExtra(category, d) {
  if (category === 'Skin') {
    const stQtd = [d.sticker1,d.sticker2,d.sticker3,d.sticker4,d.sticker5].filter(s => s && s !== '-').length;
    const st = d.hasStickers === 'Sim' ? ` · ${stQtd} sticker${stQtd !== 1 ? 's' : ''}` : '';
    const tk = d.stattrak === 'Sim' ? ' · ST™' : '';
    const floatVal = d.float && d.float !== '-' ? ` · ${parseFloat(d.float).toFixed(2)}` : '';
    return `${d.exterior}${tk}${floatVal}${st}`;
  }
  if (category === 'Sticker') {
    const cap = d.capsulaOrigem && d.capsulaOrigem !== '-' ? d.capsulaOrigem : '';
    const acab = d.acabamento && d.acabamento !== '-' ? d.acabamento : '';
    return [cap, acab].filter(Boolean).join(' · ');
  }
  if (category === 'Agente') {
    const ptQtd = [d.patch1,d.patch2,d.patch3].filter(p => p && p !== '-').length;
    const pt = d.hasPatches === 'Sim' ? ` · ${ptQtd} patch${ptQtd !== 1 ? 'es' : ''}` : '';
    return `${d.lado} · ${d.raridade}${pt}`;
  }
  if (category === 'Caixa') {
    const status = d.statusDrop && d.statusDrop !== '-' ? (d.statusDrop.startsWith('Ativa') ? 'Ativa' : 'Descontinuada') : '';
    return status;
  }
  if (category === 'Cápsula') {
    const nome = d.capsulaOrigem && d.capsulaOrigem !== '-' ? d.capsulaOrigem : '';
    const status = d.statusDrop && d.statusDrop !== '-' ? (d.statusDrop.startsWith('Ativa') ? 'Ativa' : 'Descontinuada') : '';
    return [nome, status].filter(Boolean).join(' · ');
  }
  if (category === 'Charm') return `${d.origem !== '-' ? d.origem : ''} · ${d.variant !== '-' ? d.variant : ''}`.replace(/^·\s|·\s$/g, '').trim();
  return '-';
}

function buildIdentityKey(category, details, assetName) {
  const n = (assetName || '').trim().toLowerCase();
  if (category === 'Skin') return [category,n,details.exterior,details.float,details.pattern,details.stattrak,details.hasStickers,details.sticker1,details.sticker2,details.sticker3,details.sticker4,details.sticker5].join('|');
  if (category === 'Sticker') return [category,n,details.capsulaOrigem,details.classificacao,details.acabamento,details.timePlayer].join('|');
  if (category === 'Agente') return [category,n,details.hasPatches,details.patch1,details.patch2,details.patch3].join('|');
  if (category === 'Cápsula') return [category,n,details.capsulaOrigem,details.tipoCapsula].join('|');
  if (category === 'Charm') return [category,n,details.origem,details.raridade,details.variant].join('|');
  return [category,n].join('|');
}

function buildTableExtra(category, d) {
  if (!d) return '';
  if (category === 'Skin') {
    const floatVal = d.float && d.float !== '-' ? parseFloat(d.float).toFixed(2) : null;
    const state = d.exterior && d.exterior !== '-' ? d.exterior : null;
    const tk = d.stattrak === 'Sim' ? 'ST™' : null;
    return [state, tk, floatVal ? `Float ${floatVal}` : null].filter(Boolean).join(' · ');
  }
  if (category === 'Sticker') {
    const cap = d.capsulaOrigem && d.capsulaOrigem !== '-' ? d.capsulaOrigem : null;
    const acab = d.acabamento && d.acabamento !== '-' ? d.acabamento : null;
    return [cap, acab].filter(Boolean).join(' · ');
  }
  if (category === 'Agente') {
    return [d.lado !== '-' ? d.lado : null, d.raridade !== '-' ? d.raridade : null].filter(Boolean).join(' · ');
  }
  if (category === 'Caixa') {
    return d.statusDrop && d.statusDrop !== '-' ? (d.statusDrop.startsWith('Ativa') ? 'Ativa' : 'Descontinuada') : '';
  }
  if (category === 'Cápsula') {
    const nome = d.capsulaOrigem && d.capsulaOrigem !== '-' ? d.capsulaOrigem : null;
    const status = d.statusDrop && d.statusDrop !== '-' ? (d.statusDrop.startsWith('Ativa') ? 'Ativa' : 'Descontinuada') : null;
    return [nome, status].filter(Boolean).join(' · ');
  }
  if (category === 'Charm') {
    return [d.origem !== '-' ? d.origem : null, d.variant !== '-' ? d.variant : null].filter(Boolean).join(' · ');
  }
  return '';
}

export {
  formatCurrency,
  formatPercent,
  formatAssetCount,
  parseDateParts,
  applyDateMask,
  toNumber,
  toPositiveInt,
  getCategoryFields,
  createDetails,
  buildExtra,
  buildIdentityKey,
  buildTableExtra,
};
