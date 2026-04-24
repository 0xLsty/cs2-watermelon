export const MESES = ['Todos','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const EXTERIOR_OPTS = ['Factory New','Minimal Wear','Field-Tested','Well-Worn','Battle-Scarred'];
export const EXTERIOR_STYLE = {
  'Factory New': 'text-emerald-300 bg-emerald-400/10 border border-emerald-400/25',
  'Minimal Wear': 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/25',
  'Field-Tested': 'text-yellow-300 bg-yellow-400/10 border border-yellow-400/25',
  'Well-Worn': 'text-orange-300 bg-orange-400/10 border border-orange-400/25',
  'Battle-Scarred': 'text-red-300 bg-red-400/10 border border-red-400/25',
};
export const DEMANDA_STYLE = {
  'Baixa': 'text-slate-300 bg-slate-400/10 border border-slate-400/25',
  'Média': 'text-yellow-300 bg-yellow-400/10 border border-yellow-400/25',
  'Alta': 'text-orange-300 bg-orange-400/10 border border-orange-400/25',
  'Muito Alta': 'text-red-300 bg-red-400/10 border border-red-400/25',
};
export const RARITY_AGENT_STYLE = {
  'Distinguished Agent': 'text-sky-300 bg-sky-400/10 border border-sky-400/25',
  'Exceptional Agent': 'text-purple-300 bg-purple-400/10 border border-purple-400/25',
  'Superior Agent': 'text-pink-300 bg-pink-400/10 border border-pink-400/25',
  'Master Agent': 'text-yellow-300 bg-yellow-400/10 border border-yellow-400/25',
};
export const ACABAMENTO_STYLE = {
  'Holo': 'text-violet-300 bg-violet-400/10 border border-violet-400/25',
  'Gold': 'text-yellow-300 bg-yellow-400/10 border border-yellow-400/25',
  'Foil': 'text-cyan-300 bg-cyan-400/10 border border-cyan-400/25',
  'Glitter': 'text-pink-300 bg-pink-400/10 border border-pink-400/25',
  'Paper': 'text-slate-300 bg-slate-400/10 border border-slate-400/25',
  'Embroidered': 'text-amber-300 bg-amber-400/10 border border-amber-400/25',
};
export const STICKER_TYPE_OPTIONS = ['Major','Arsenal','Operação','Outros'];
export const CAPSULE_TYPE_OPTIONS = ['Legends','Challengers','Contenders','Outro'];
export const DROP_STATUS_OPTIONS = ['Ativa','Descontinuada'];
export const formInicial = {
  asset: '', quantity: '', avgCost: '', current: '',
  image: '', data: '', taxasCompra: '', taxasVenda: '', observacoes: '', liquidity: 'Média',
  float: '', exterior: 'Factory New', stattrak: 'Não',
  colecao: '', arma: '', pattern: '',
  ano: '', campeonato: '', classificacao: 'Major', acabamento: 'Paper',
  timePlayer: '', capsulaOrigem: '', origem: '', variant: '',
  lado: 'CT', raridade: '', operacao: '',
  statusDrop: 'Ativa', demandaAbertura: 'Média',
  tipoCapsula: 'Legends',
  hasStickers: 'Não', sticker1: '', sticker2: '', sticker3: '', sticker4: '', sticker5: '',
  hasPatches: 'Não', patch1: '', patch2: '', patch3: '',
  ativoExistenteId: '',
};
export const SORT_OPTIONS = [
  { label: 'Recente', value: 'recente' },
  { label: 'Antigo', value: 'antigo' },
  { label: 'Maior valor', value: 'valor_desc' },
  { label: 'Menor valor', value: 'valor_asc' },
  { label: 'Maior qtd.', value: 'qtd_desc' },
  { label: 'Menor qtd.', value: 'qtd_asc' },
];
