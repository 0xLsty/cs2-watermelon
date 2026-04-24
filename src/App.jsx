import { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryTypeBadge, ProfileDetails } from './components/ProfileDetails';
import { PencilIcon, InfoItem, Field, SelectField, CategoryField, ItemImage } from './components/ui';
import { formInicial, MESES, SORT_OPTIONS } from './config/constants';
import { IS_ELECTRON, dbGet, dbSet } from './services/storage';
import {
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
  calculateAverageCost,
  calculateRealizedProfit,
} from './utils/portfolio';

export default function CSInvestmentsDashboard() {
  const [abaAtiva, setAbaAtiva] = useState('portfolio');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalPrecoAberto, setModalPrecoAberto] = useState(false);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [modalEditarAtivoAberto, setModalEditarAtivoAberto] = useState(false);
  const [modalConfirmarExclusao, setModalConfirmarExclusao] = useState(null); // item a excluir

  const [mesFiltro, setMesFiltro] = useState('Todos');
  const [anoFiltro, setAnoFiltro] = useState('Todos');
  const [portfolioSort, setPortfolioSort] = useState('recente');

  const [tipoLancamento, setTipoLancamento] = useState('Compra');
  const [categoriaCompra, setCategoriaCompra] = useState('Skin');

  const [portfolio, setPortfolio] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(!IS_ELECTRON);

  const [ativoSelecionadoId, setAtivoSelecionadoId] = useState(null);
  const [ativoPrecoEditando, setAtivoPrecoEditando] = useState(null);
  const [ativoAdicionando, setAtivoAdicionando] = useState(null);

  const [novoPrecoAtual, setNovoPrecoAtual] = useState('');
  const [qtdAdicionar, setQtdAdicionar] = useState('');
  const [precoAdicionar, setPrecoAdicionar] = useState('');
  const [dataAdicionar, setDataAdicionar] = useState('');

  const [form, setForm] = useState(formInicial);
  const [erroForm, setErroForm] = useState('');

  // Inline edit for ativo selecionado details
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  const imageUrlInputRef = useRef(null);

  // ── Persistence ──
  useEffect(() => {
    if (!IS_ELECTRON) return;
    (async () => {
      const [p, h] = await Promise.all([dbGet('portfolio'), dbGet('historico')]);
      if (Array.isArray(p)) setPortfolio(p);
      if (Array.isArray(h)) setHistorico(h);
      await dbSet('schemaVersion', 1);
      setDbLoaded(true);
    })();
  }, []);
  useEffect(() => { if (!dbLoaded) return; dbSet('portfolio', portfolio); }, [portfolio, dbLoaded]);
  useEffect(() => { if (!dbLoaded) return; dbSet('historico', historico); }, [historico, dbLoaded]);

  // ── Lock scroll ──
  useEffect(() => {
    const orig = document.body.style.overflow;
    if (modalAberto || modalPrecoAberto || modalAdicionarAberto) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, [modalAberto, modalPrecoAberto, modalAdicionarAberto]);

  const ativoSelecionado = portfolio.find(i => i.id === ativoSelecionadoId) || portfolio[0] || null;

  // ── Computed ──
  const anosDinamicos = useMemo(() => {
    const anos = [...new Set(historico.map(i => i.ano))].filter(Boolean).sort();
    return ['Todos', ...anos];
  }, [historico]);

  const historicoFiltrado = useMemo(() =>
    historico.filter(i => {
      const mOk = mesFiltro === 'Todos' || i.mes === mesFiltro;
      const aOk = anoFiltro === 'Todos' || i.ano === anoFiltro;
      return mOk && aOk;
    }), [historico, mesFiltro, anoFiltro]);

  const portfolioOrdenado = useMemo(() => {
    const arr = [...portfolio];
    if (portfolioSort === 'recente')    return arr.reverse();
    if (portfolioSort === 'antigo')     return arr;
    if (portfolioSort === 'valor_desc') return arr.sort((a,b) => b.current*b.quantity - a.current*a.quantity);
    if (portfolioSort === 'valor_asc')  return arr.sort((a,b) => a.current*a.quantity - b.current*b.quantity);
    if (portfolioSort === 'qtd_desc')   return arr.sort((a,b) => b.quantity - a.quantity);
    if (portfolioSort === 'qtd_asc')    return arr.sort((a,b) => a.quantity - b.quantity);
    return arr;
  }, [portfolio, portfolioSort]);

  const metricas = useMemo(() => {
    const investido = portfolio.reduce((a, i) => a + i.avgCost * i.quantity, 0);
    const atual     = portfolio.reduce((a, i) => a + i.current * i.quantity, 0);
    const taxasTotal = portfolio.reduce((a, i) => a + (i.taxasCompra || 0), 0);
    const pnl        = atual - investido;
    const pnlPercent = investido > 0 ? (pnl / investido) * 100 : 0;
    const top5       = [...portfolio].sort((a,b) => b.current*b.quantity - a.current*a.quantity).slice(0,5);
    const top5Val    = top5.reduce((a,i) => a + i.current * i.quantity, 0);
    const conc       = atual > 0 ? (top5Val / atual) * 100 : 0;
    const allocMap   = portfolio.reduce((a,i) => {
      a[i.category] = (a[i.category] || 0) + i.current * i.quantity;
      return a;
    }, {});
    const allocation = Object.entries(allocMap).map(([name, value]) => ({
      name, value: atual > 0 ? `${((value/atual)*100).toFixed(0)}%` : '0%',
    }));
    return { investido, atual, taxasTotal, pnl, pnlPercent, concentracao: conc, allocation };
  }, [portfolio]);

  const summary = [
    { label: 'Capital Investido Total',      value: formatCurrency(metricas.investido), delta: formatPercent(metricas.pnlPercent) },
    { label: 'Valor de Mercado Atual',        value: formatCurrency(metricas.atual),     delta: formatAssetCount(portfolio.length) },
    { label: 'Lucro/Prejuízo Não Realizado',  value: formatCurrency(metricas.pnl),       delta: formatPercent(metricas.pnlPercent) },
    { label: 'Concentração do Portfólio',     value: `${metricas.concentracao.toFixed(1)}%`, delta: 'Top 5 ativos' },
  ];

  // ── Form helpers ──
  function atualizarCampo(campo, valor) {
    if (campo === 'data') valor = applyDateMask(valor);
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErroForm('');
  }

  // ── Modais ──
  function abrirModal() { setForm(formInicial); setTipoLancamento('Compra'); setCategoriaCompra('Skin'); setErroForm(''); setModalAberto(true); }
  function fecharModal() { setModalAberto(false); setForm(formInicial); setErroForm(''); }

  function abrirModalPreco(item) {
    setAtivoPrecoEditando(item);
    setNovoPrecoAtual(String(item.current));
    setModalPrecoAberto(true);
  }
  function fecharModalPreco() { setModalPrecoAberto(false); setAtivoPrecoEditando(null); setNovoPrecoAtual(''); }
  function salvarPrecoAtual() {
    const valor = toNumber(novoPrecoAtual);
    if (isNaN(valor) || valor < 0) return;
    setPortfolio(prev => prev.map(i => i.id === ativoPrecoEditando.id ? { ...i, current: valor } : i));
    fecharModalPreco();
  }

  function abrirModalAdicionar(item) {
    setAtivoAdicionando(item);
    setQtdAdicionar(''); setPrecoAdicionar(''); setDataAdicionar(''); setErroForm('');
    setModalAdicionarAberto(true);
  }
  function fecharModalAdicionar() {
    setModalAdicionarAberto(false); setAtivoAdicionando(null);
    setQtdAdicionar(''); setPrecoAdicionar(''); setDataAdicionar(''); setErroForm('');
  }
  function confirmarAdicionarQuantidade() {
    const qtd   = toPositiveInt(qtdAdicionar);
    const preco = toNumber(precoAdicionar);
    const data  = parseDateParts(dataAdicionar);
    if (!ativoAdicionando) return;
    if (!data)               { setErroForm('Data inválida. Use dd/mm/aaaa.'); return; }
    if (isNaN(qtd) || qtd < 1) { setErroForm('Quantidade deve ser um número inteiro positivo.'); return; }
    if (isNaN(preco) || preco <= 0) { setErroForm('Preço unitário inválido.'); return; }
    const novaQtd = ativoAdicionando.quantity + qtd;
    const novoPM = calculateAverageCost({
      currentQty: ativoAdicionando.quantity,
      currentAvg: ativoAdicionando.avgCost,
      buyQty: qtd,
      buyPrice: preco,
      fees: 0,
    });
    setPortfolio(prev => prev.map(i =>
      i.id === ativoAdicionando.id ? { ...i, quantity: novaQtd, avgCost: novoPM } : i
    ));
    setHistorico(prev => [{
      id: Date.now(), data: dataAdicionar, mes: data.mes, ano: data.ano,
      tipo: 'Compra', ativo: ativoAdicionando.asset, categoria: ativoAdicionando.category,
      assetId: ativoAdicionando.id, identityKey: ativoAdicionando.identityKey,
      quantidade: qtd, precoUnitario: preco, taxas: 0, valorTotal: qtd * preco,
    }, ...prev]);
    fecharModalAdicionar();
  }

  // ── Edit ativo details ──
  function abrirEditDetails() {
    if (!ativoSelecionado) return;
    setEditData({ ...(ativoSelecionado.details || {}), observacoes: ativoSelecionado.details?.observacoes || '' });
    setEditMode(true);
  }
  function cancelarEditDetails() { setEditMode(false); setEditData({}); }
  function salvarEditDetails() {
    if (!ativoSelecionado) return;
    const novosDetalhes = { ...ativoSelecionado.details, ...editData };
    const novoExtra = buildExtra(ativoSelecionado.category, novosDetalhes);
    setPortfolio(prev => prev.map(i =>
      i.id === ativoSelecionado.id
        ? { ...i, details: novosDetalhes, extra: novoExtra }
        : i
    ));
    setEditMode(false);
    setEditData({});
  }

  // ── Salvar compra ──
  function salvarCompra() {
    const quantidade  = toPositiveInt(form.quantity);
    const precoCompra = toNumber(form.avgCost);
    const precoAtual  = toNumber(form.current || form.avgCost);
    const taxasCompra = toNumber(form.taxasCompra || 0);
    const data        = parseDateParts(form.data);
    if (!form.asset.trim())          { setErroForm('Informe o nome do ativo.'); return; }
    if (!data)                        { setErroForm('Data inválida. Use dd/mm/aaaa.'); return; }
    if (isNaN(quantidade)||quantidade<1) { setErroForm('Quantidade deve ser um número inteiro maior que zero.'); return; }
    if (isNaN(precoCompra)||precoCompra<=0) { setErroForm('Preço unitário inválido.'); return; }

    const detalhes    = createDetails(categoriaCompra, { ...form, observacoes: form.observacoes || '' });
    const identityKey = buildIdentityKey(categoriaCompra, detalhes, form.asset);
    const existente   = portfolio.find(i => i.identityKey === identityKey);

    if (existente && !['Skin','Agente'].includes(categoriaCompra)) {
      setErroForm('Este ativo já existe no portfólio.');
      return;
    }

    const novoId = existente ? existente.id : Date.now();

    if (existente) {
      const novaQtd = existente.quantity + quantidade;
      const novoPM = calculateAverageCost({
        currentQty: existente.quantity,
        currentAvg: existente.avgCost,
        buyQty: quantidade,
        buyPrice: precoCompra,
        fees: taxasCompra,
      });

      setPortfolio(prev => prev.map(i => i.id === existente.id
        ? { ...i, quantity: novaQtd, avgCost: novoPM, current: precoAtual,
            liquidity: form.liquidity || i.liquidity, image: form.image || i.image,
            taxasCompra: (i.taxasCompra || 0) + taxasCompra,
            details: detalhes, extra: buildExtra(categoriaCompra, detalhes) }
        : i
      ));
    } else {
      setPortfolio(prev => [...prev, {
        id: novoId, identityKey, asset: form.asset.trim(),
        category: categoriaCompra,
        quantity: quantidade,
        avgCost: (precoCompra * quantidade + taxasCompra) / quantidade,
        current: precoAtual,
        liquidity: form.liquidity, taxasCompra,
        image: form.image || 'https://placehold.co/96x96/111827/F9FAFB?text=ITEM',
        details: detalhes, extra: buildExtra(categoriaCompra, detalhes),
      }]);
      setAtivoSelecionadoId(novoId);
    }

    setHistorico(prev => [{
      id: Date.now()+1, data: form.data, mes: data.mes, ano: data.ano,
      tipo: 'Compra', ativo: form.asset.trim(), categoria: categoriaCompra,
      assetId: novoId, identityKey,
      quantidade, precoUnitario: precoCompra,
      taxas: taxasCompra, valorTotal: quantidade * precoCompra + taxasCompra,
    }, ...prev]);
    fecharModal();
  }

  // ── Salvar venda ──
  function salvarVenda() {
    const ativo  = portfolio.find(i => i.id === Number(form.ativoExistenteId));
    const qtd    = toPositiveInt(form.quantity);
    const preco  = toNumber(form.avgCost);
    const taxas  = toNumber(form.taxasVenda || 0);
    const data   = parseDateParts(form.data);
    if (!ativo)                 { setErroForm('Selecione um item do portfólio.'); return; }
    if (!data)                  { setErroForm('Data inválida. Use dd/mm/aaaa.'); return; }
    if (isNaN(qtd)||qtd<1)      { setErroForm('Quantidade deve ser um número inteiro positivo.'); return; }
    if (isNaN(preco)||preco<=0) { setErroForm('Preço unitário inválido.'); return; }
    if (qtd > ativo.quantity)   { setErroForm(`Quantidade vendida (${qtd}) maior que em carteira (${ativo.quantity}).`); return; }
    const novaQtd = ativo.quantity - qtd;
    setPortfolio(prev =>
      prev.map(i => i.id === ativo.id ? { ...i, quantity: novaQtd } : i)
          .filter(i => i.quantity > 0)
    );
    setHistorico(prev => [{
      id: Date.now(), data: form.data, mes: data.mes, ano: data.ano,
      tipo: 'Venda', ativo: ativo.asset, categoria: ativo.category,
      assetId: ativo.id,
      identityKey: ativo.identityKey,
      quantidade: qtd, precoUnitario: preco, taxas,
      valorTotal: qtd * preco - taxas,
      lucro: calculateRealizedProfit({ sellQty: qtd, sellPrice: preco, avgCost: ativo.avgCost, fees: taxas }),
      ativoSnapshot: ativo,
    }, ...prev]);
    fecharModal();
  }

  // ── Excluir transação do histórico ──
  function confirmarExclusaoTransacao() {
    const item = modalConfirmarExclusao;
    if (!item) return;

    const matchesHistorico = (ativo) => {
      if (item.identityKey) return ativo.identityKey === item.identityKey;
      if (item.assetId) return ativo.id === item.assetId;
      return ativo.asset === item.ativo && ativo.category === item.categoria;
    };

    if (item.tipo === 'Compra') {
      setPortfolio(prev => {
        return prev.map(ativo => {
          if (!matchesHistorico(ativo)) return ativo;

          const novaQtd = ativo.quantity - item.quantidade;
          if (novaQtd <= 0) return null;

          const custoAtual = ativo.avgCost * ativo.quantity;
          const custoRemovido = (item.precoUnitario * item.quantidade) + (item.taxas || 0);
          const novoPM = (custoAtual - custoRemovido) / novaQtd;

          return {
            ...ativo,
            quantity: novaQtd,
            avgCost: Math.max(0, Number.isFinite(novoPM) ? novoPM : ativo.avgCost),
            taxasCompra: Math.max(0, (ativo.taxasCompra || 0) - (item.taxas || 0)),
          };
        }).filter(Boolean);
      });
    } else if (item.tipo === 'Venda') {
      setPortfolio(prev => {
        const existente = prev.find(matchesHistorico);

        if (existente) {
          return prev.map(a =>
            matchesHistorico(a)
              ? { ...a, quantity: a.quantity + item.quantidade }
              : a
          );
        }

        if (item.ativoSnapshot) {
          return [
            ...prev,
            {
              ...item.ativoSnapshot,
              quantity: item.quantidade,
            },
          ];
        }

        return prev;
      });
    }

    setHistorico(prev => prev.filter(h => h.id !== item.id));
    setModalConfirmarExclusao(null);
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#f5f7fa] overflow-x-hidden">
      <main className="mx-auto max-w-[1600px] px-8 py-8">

        {/* Header */}
        <header className="mb-8 flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/35">WATERMELON</div>
              <h1 className="mt-1 text-4xl font-semibold tracking-tight">CS2</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">
                Controle profissional de investimentos em ativos digitais do ecossistema Counter-Strike.
                
              </p>
            </div>
          </div>
          <button
            onClick={abrirModal}
            className="cursor-pointer rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 shrink-0"
          >
            + Novo lançamento
          </button>
        </header>

        {/* Tabs */}
        <section className="mb-6 flex items-center gap-2">
          {['portfolio','historico'].map(aba => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`cursor-pointer rounded-2xl px-4 py-2.5 text-sm transition ${
                abaAtiva === aba ? 'bg-white text-black' : 'border border-white/10 bg-white/[0.03] text-white/65'
              }`}
            >
              {aba === 'portfolio' ? 'Portfólio' : 'Histórico'}
            </button>
          ))}
        </section>

        {/* ── Portfolio tab ── */}
        {abaAtiva === 'portfolio' && (
          <>
            {/* Summary cards */}
            <section className="grid grid-cols-4 gap-4">
              {summary.map(item => {
                const isNeg = item.label.includes('Lucro') && metricas.pnl < 0;
                const deltaColor = item.label.includes('Capital') || item.label.includes('Lucro')
                  ? metricas.pnlPercent >= 0 ? 'text-emerald-300' : 'text-red-300'
                  : 'text-white/50';
                return (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/35">{item.label}</div>
                    <div className={`mt-5 text-3xl font-semibold tracking-tight ${isNeg ? 'text-red-300' : ''}`}>{item.value}</div>
                    <div className={`mt-2 text-sm ${deltaColor}`}>{item.delta}</div>
                  </div>
                );
              })}
            </section>

            {/* Main grid */}
            <section className="mt-6 grid grid-cols-[1.15fr,0.85fr] gap-6">

              {/* Portfolio table */}
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/35">Portfólio Consolidado</div>
                    <div className="mt-2 text-xl font-semibold tracking-tight">Posições em carteira</div>
                  </div>
                  <select
                    value={portfolioSort}
                    onChange={e => setPortfolioSort(e.target.value)}
                    className="cursor-pointer rounded-2xl border border-white/10 bg-[#10141b] px-3 py-2 text-xs text-white/70 outline-none"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-white/[0.03] text-white/45">
                      <tr>
                        {['Ativo','Categoria','Qtd.','Preço médio','Preço atual','P/L','Liquidez'].map(h => (
                          <th key={h} className="px-4 py-4 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioOrdenado.length === 0 ? (
                        <tr className="border-t border-white/10 text-white/50">
                          <td colSpan={7} className="px-4 py-10 text-center">Nenhum ativo cadastrado ainda.</td>
                        </tr>
                      ) : portfolioOrdenado.map(row => {
                        const pnlPct = row.avgCost > 0 ? ((row.current - row.avgCost) / row.avgCost) * 100 : 0;
                        const selected = ativoSelecionadoId === row.id || (!ativoSelecionadoId && portfolioOrdenado[0]?.id === row.id);
                        // Build concise extra for table
                        const tableExtra = buildTableExtra(row.category, row.details);
                        return (
                          <tr
                            key={row.id}
                            onClick={() => { setAtivoSelecionadoId(row.id); setEditMode(false); }}
                            className={`cursor-pointer border-t border-white/10 text-white/80 transition ${
                              selected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                            }`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {/* Fixed image: contain, not cover, no crop */}
                                <div className="h-12 w-12 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-black/30 shrink-0">
                                  <img
                                    src={row.image}
                                    alt={row.asset}
                                    className="max-h-full max-w-full object-contain"
                                    onError={e => { e.currentTarget.src = 'https://placehold.co/96x96/111827/F9FAFB?text=ITEM'; }}
                                  />
                                </div>
                                <div>
                                  <div className="font-medium text-white">{row.asset}</div>
                                  <div className="mt-0.5 text-xs text-white/40 max-w-[180px] truncate">{tableExtra}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{row.category}</td>
                            <td className="px-4 py-4">{row.quantity}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(row.avgCost)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className="whitespace-nowrap">{formatCurrency(row.current)}</span>
                                <button
                                  onClick={e => { e.stopPropagation(); abrirModalPreco(row); }}
                                  className="cursor-pointer text-white/40 hover:text-white transition"
                                >
                                  <PencilIcon />
                                </button>
                              </div>
                            </td>
                            <td className={`px-4 py-4 font-medium ${pnlPct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                              {formatPercent(pnlPct)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span>{row.liquidity}</span>
                                <button
                                  onClick={e => { e.stopPropagation(); abrirModalAdicionar(row); }}
                                  className="cursor-pointer inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-white/10 text-[13px] font-medium leading-none text-white/60 transition hover:border-white/30 hover:text-white"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right panel */}
              <div className="space-y-6">
                {/* Allocation */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/35">Alocação</div>
                  <div className="mt-2 text-xl font-semibold tracking-tight">Exposição por classe</div>
                  <div className="mt-6 space-y-4">
                    {metricas.allocation.length === 0 ? (
                      <div className="text-sm text-white/45">Sem dados para exibir.</div>
                    ) : metricas.allocation.map(item => (
                      <div key={item.name}>
                        <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                          <span>{item.name}</span><span>{item.value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div className="h-1.5 rounded-full bg-white/70 transition-all" style={{ width: item.value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asset profile */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/35">Perfil do ativo</div>
                  <div className="mt-2 text-xl font-semibold tracking-tight">Ativo selecionado</div>

                  {!ativoSelecionado ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-10 text-center text-sm text-white/45">
                      Selecione um ativo da tabela para ver os detalhes.
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5 overflow-y-auto max-h-[600px]">
                      {/* Header */}
                      <div className="flex items-start gap-4">
                        {/* Image: contain, no crop */}
                        <div className="h-20 w-20 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center bg-black/30 shrink-0">
                          <img
                            src={ativoSelecionado.image}
                            alt={ativoSelecionado.asset}
                            className="max-h-full max-w-full object-contain"
                            onError={e => { e.currentTarget.src = 'https://placehold.co/96x96/111827/F9FAFB?text=ITEM'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-semibold leading-tight">{ativoSelecionado.asset}</div>
                          <div className="mt-0.5 text-xs text-white/40">{ativoSelecionado.category}</div>
                          {/* Category-specific type badge (NOT exterior for non-skins) */}
                          <CategoryTypeBadge ativo={ativoSelecionado} />
                        </div>
                        {/* Edit details button */}
                        <button
                          onClick={abrirEditDetails}
                          className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition shrink-0"
                          title="Editar detalhes"
                        >
                          <PencilIcon />
                        </button>
                      </div>

                      {/* Financial summary */}
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <InfoItem label="Qtd. em carteira"   value={String(ativoSelecionado.quantity)} />
                        <InfoItem label="Liquidez"           value={ativoSelecionado.liquidity} />
                        <InfoItem label="Preço médio"        value={formatCurrency(ativoSelecionado.avgCost)} />
                        <InfoItem label="Preço atual"        value={formatCurrency(ativoSelecionado.current)} />
                        <InfoItem
                          label="Valor investido"
                          value={
                            <div>
                              <div>{formatCurrency(ativoSelecionado.avgCost * ativoSelecionado.quantity)}</div>
                              {(ativoSelecionado.taxasCompra || 0) > 0 && (
                                <div className="mt-0.5 text-[10px] text-white/30">
                                  + {formatCurrency(ativoSelecionado.taxasCompra)} em taxas
                                </div>
                              )}
                            </div>
                          }
                        />
                        <InfoItem
                          label="Valor de mercado"
                          value={formatCurrency(ativoSelecionado.current * ativoSelecionado.quantity)}
                        />
                        <InfoItem
                          label="P/L não realizado"
                          value={(() => {
                            const pl = (ativoSelecionado.current - ativoSelecionado.avgCost) * ativoSelecionado.quantity;
                            const pct = ativoSelecionado.avgCost > 0
                              ? ((ativoSelecionado.current - ativoSelecionado.avgCost) / ativoSelecionado.avgCost) * 100 : 0;
                            return `${formatCurrency(pl)} (${formatPercent(pct)})`;
                          })()}
                          highlight={ativoSelecionado.current >= ativoSelecionado.avgCost ? 'text-emerald-300' : 'text-red-300'}
                        />
                      </div>

                      {/* Category-specific details */}
                      <ProfileDetails
                        ativo={ativoSelecionado}
                        editMode={editMode}
                        editData={editData}
                        onEdit={abrirEditDetails}
                        onEditChange={(k, v) => setEditData(prev => ({ ...prev, [k]: v }))}
                        onEditSave={salvarEditDetails}
                        onEditCancel={cancelarEditDetails}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Histórico tab ── */}
        {abaAtiva === 'historico' && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/35">Movimentações</div>
                <div className="mt-2 text-xl font-semibold tracking-tight">Histórico de lançamentos</div>
              </div>
              <div className="flex items-center gap-3">
                <select value={mesFiltro} onChange={e => setMesFiltro(e.target.value)}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none">
                  {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={anoFiltro} onChange={e => setAnoFiltro(e.target.value)}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none">
                  {anosDinamicos.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-white/45">
                  <tr>
                    {['Data','Tipo','Ativo','Categoria','Qtd.','Preço unit.','Taxas','Valor total',''].map(h => (
                      <th key={h} className="px-4 py-4 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historicoFiltrado.length === 0 ? (
                    <tr className="border-t border-white/10 text-white/50">
                      <td colSpan={9} className="px-4 py-10 text-center">Nenhum lançamento encontrado.</td>
                    </tr>
                  ) : historicoFiltrado.map(item => (
                    <tr key={item.id} className="border-t border-white/10 text-white/80">
                      <td className="px-4 py-4 whitespace-nowrap">{item.data}</td>
                      <td className={`px-4 py-4 font-medium ${item.tipo === 'Compra' ? 'text-emerald-300' : 'text-red-300'}`}>{item.tipo}</td>
                      <td className="px-4 py-4 font-medium text-white">{item.ativo}</td>
                      <td className="px-4 py-4">{item.categoria}</td>
                      <td className="px-4 py-4">{item.quantidade}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(item.precoUnitario)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(item.taxas || 0)}</td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium">{formatCurrency(item.valorTotal)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setModalConfirmarExclusao(item)}
                          className="cursor-pointer inline-flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 text-white/35 transition hover:border-red-400/40 hover:text-red-300"
                          title="Excluir transação"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Modal: editar preço ── */}
        {modalPrecoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f1319] p-6">
              <div className="text-lg font-semibold">Editar preço atual</div>
              <div className="mt-1 text-sm text-white/45">{ativoPrecoEditando?.asset}</div>
              <div className="mt-5">
                <label className="mb-2 block text-sm text-white/55">Novo preço atual (USD)</label>
                <input type="number" min="0" step="0.01" value={novoPrecoAtual}
                  onChange={e => setNovoPrecoAtual(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={fecharModalPreco} className="cursor-pointer rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/70">Cancelar</button>
                <button onClick={salvarPrecoAtual} className="cursor-pointer rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: adicionar quantidade ── */}
        {modalAdicionarAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f1319] p-6">
              <div className="text-lg font-semibold">Adicionar mais unidades</div>
              <div className="mt-1 text-sm text-white/45">{ativoAdicionando?.asset}</div>
              {erroForm && (
                <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erroForm}</div>
              )}
              <div className="mt-5 grid grid-cols-1 gap-4">
                <Field label="Quantidade adicional (inteiro)" placeholder="Ex.: 10" value={qtdAdicionar} onChange={setQtdAdicionar} type="number" />
                <Field label="Preço unitário (USD)" placeholder="Ex.: 125.00" value={precoAdicionar} onChange={setPrecoAdicionar} type="number" />
                <Field label="Data da compra" placeholder="dd/mm/aaaa" value={dataAdicionar} onChange={v => setDataAdicionar(applyDateMask(v))} />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={fecharModalAdicionar} className="cursor-pointer rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/70">Cancelar</button>
                <button onClick={confirmarAdicionarQuantidade} className="cursor-pointer rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: novo lançamento ── */}
        {modalAberto && (
          <div className="fixed inset-0 z-50 bg-black/70 px-4 py-6 overflow-y-auto">
            <div className="mx-auto flex min-h-screen max-w-5xl items-start justify-center pt-8 pb-8">
              <div className="w-full rounded-3xl border border-white/10 bg-[#0f1319] shadow-2xl shadow-black/40">

                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/35">Novo lançamento</div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight">Registrar compra ou venda</div>
                  </div>
                  <button onClick={fecharModal} className="cursor-pointer rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/70">Fechar</button>
                </div>

                <div className="px-6 py-6">
                  {erroForm && (
                    <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erroForm}</div>
                  )}

                  <div className="grid grid-cols-[280px,1fr] gap-6">
                    {/* Left: image + tipo + taxas */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-5">
                      <div className="text-sm font-medium text-white">Imagem do item</div>

                      {tipoLancamento === 'Compra' ? (
                        <>
                          <button type="button" onClick={() => imageUrlInputRef.current?.focus()}
                            className="mt-1 flex h-44 w-full cursor-pointer items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#10141b] p-4 overflow-hidden">
                            {form.image ? (
                              <img src={form.image} alt="Preview" className="max-h-full max-w-full object-contain" />
                            ) : (
                              <div className="text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-2xl text-white/40">+</div>
                                <div className="mt-3 text-sm text-white/60">Foto do item</div>
                                <div className="mt-1 text-xs text-white/30">Cole a URL abaixo</div>
                              </div>
                            )}
                          </button>
                          <div>
                            <label className="mb-2 block text-sm text-white/55">URL da imagem</label>
                            <input ref={imageUrlInputRef} value={form.image}
                              onChange={e => atualizarCampo('image', e.target.value)}
                              placeholder="https://..."
                              className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
                          </div>
                        </>
                      ) : (
                        <div className="mt-1 rounded-3xl border border-white/10 bg-[#10141b] p-3 h-44 overflow-hidden flex items-center justify-center">
                          {portfolio.find(i => i.id === Number(form.ativoExistenteId)) ? (
                            <img src={portfolio.find(i => i.id === Number(form.ativoExistenteId)).image}
                              alt="Item" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <div className="text-sm text-white/35">Selecione um item</div>
                          )}
                        </div>
                      )}

                      {/* Tipo */}
                      <div>
                        <label className="mb-2 block text-sm text-white/55">Tipo de lançamento</label>
                        <select value={tipoLancamento}
                          onChange={e => { setTipoLancamento(e.target.value); setErroForm(''); }}
                          className="cursor-pointer w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none">
                          <option>Compra</option>
                          <option>Venda</option>
                        </select>
                      </div>

                      {/* Taxas (imediatamente abaixo do tipo) */}
                      {tipoLancamento === 'Compra' ? (
                        <Field label="Taxa de compra (USD)" placeholder="Ex.: 2.50" value={form.taxasCompra} onChange={v => atualizarCampo('taxasCompra', v)} type="number" />
                      ) : (
                        <Field label="Taxa de venda (USD)" placeholder="Ex.: 2.50" value={form.taxasVenda} onChange={v => atualizarCampo('taxasVenda', v)} type="number" />
                      )}
                    </div>

                    {/* Right: form fields */}
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                      {tipoLancamento === 'Compra' ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <SelectField label="Categoria" value={categoriaCompra} options={['Skin','Sticker','Agente','Caixa','Cápsula','Charm']}
                              onChange={v => { setCategoriaCompra(v); atualizarCampo('category', v); }} />
                            <SelectField label="Liquidez" value={form.liquidity} options={['Baixa','Média','Alta']}
                              onChange={v => atualizarCampo('liquidity', v)} />
                            <Field label="Nome do ativo" placeholder="Ex.: AWP | Lightning Strike" value={form.asset} onChange={v => atualizarCampo('asset', v)} />
                            <div>
                              <label className="mb-2 block text-sm text-white/55">Quantidade (unidades inteiras)</label>
                              <input type="number" min="1" step="1" value={form.quantity}
                                onChange={e => atualizarCampo('quantity', e.target.value)}
                                placeholder="Ex.: 10"
                                className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
                            </div>
                            <div>
                              <Field label="Preço unitário (USD)" placeholder="Ex.: 125.00" value={form.avgCost} onChange={v => atualizarCampo('avgCost', v)} type="number" />
                              {/* Capital investido com taxas, discreto */}
                              {(toNumber(form.avgCost) > 0 && toPositiveInt(form.quantity) > 0) && (
                                <div className="mt-1.5 text-[10px] text-white/30">
                                  Capital: {formatCurrency(toNumber(form.avgCost) * toPositiveInt(form.quantity))}
                                  {toNumber(form.taxasCompra) > 0 && ` + ${formatCurrency(toNumber(form.taxasCompra))} taxa = ${formatCurrency(toNumber(form.avgCost) * toPositiveInt(form.quantity) + toNumber(form.taxasCompra))}`}
                                </div>
                              )}
                            </div>
                            <Field label="Data da compra" placeholder="dd/mm/aaaa" value={form.data} onChange={v => atualizarCampo('data', v)} />
                            <Field label="Preço atual (USD)" placeholder="Ex.: 145.00 (opcional)" value={form.current} onChange={v => atualizarCampo('current', v)} type="number" />
                          </div>

                          {/* Category-specific fields */}
                          <div className="mt-6 border-t border-white/10 pt-6">
                            <div className="mb-4 text-sm font-medium text-white">Informações específicas — {categoriaCompra}</div>
                            <div className="grid grid-cols-3 gap-4">
                              {getCategoryFields(categoriaCompra).map(field => (
                                <CategoryField key={field.key} field={field} value={form[field.key]} onChange={v => atualizarCampo(field.key, v)} />
                              ))}
                            </div>

                            {categoriaCompra === 'Skin' && (
                              <div className="mt-4">
                                <SelectField label="Possui stickers?" value={form.hasStickers} options={['Não','Sim']}
                                  onChange={v => atualizarCampo('hasStickers', v)} />
                                {form.hasStickers === 'Sim' && (
                                  <div className="mt-4 grid grid-cols-2 gap-4">
                                    {[1,2,3,4,5].map(n => (
                                      <Field key={n} label={`Sticker ${n}`} placeholder="Nome do sticker"
                                        value={form[`sticker${n}`]} onChange={v => atualizarCampo(`sticker${n}`, v)} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {categoriaCompra === 'Agente' && (
                              <div className="mt-4">
                                <SelectField label="Possui patches?" value={form.hasPatches} options={['Não','Sim']}
                                  onChange={v => atualizarCampo('hasPatches', v)} />
                                {form.hasPatches === 'Sim' && (
                                  <div className="mt-4 grid grid-cols-2 gap-4">
                                    {[1,2,3].map(n => (
                                      <Field key={n} label={`Patch ${n}`} placeholder="Nome do patch"
                                        value={form[`patch${n}`]} onChange={v => atualizarCampo(`patch${n}`, v)} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        /* VENDA */
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="mb-2 block text-sm text-white/55">Selecionar item do portfólio</label>
                            <select value={form.ativoExistenteId} onChange={e => atualizarCampo('ativoExistenteId', e.target.value)}
                              className="cursor-pointer w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none">
                              <option value="">Selecione um item</option>
                              {portfolio.map(i => (
                                <option key={i.id} value={i.id}>{i.asset} — {i.category} (x{i.quantity})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm text-white/55">Quantidade vendida (inteira)</label>
                            <input type="number" min="1" step="1" value={form.quantity}
                              onChange={e => atualizarCampo('quantity', e.target.value)}
                              placeholder="Ex.: 1"
                              className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" />
                          </div>
                          <Field label="Preço unitário da venda (USD)" placeholder="Ex.: 250.00" value={form.avgCost} onChange={v => atualizarCampo('avgCost', v)} type="number" />
                          <Field label="Data da venda" placeholder="dd/mm/aaaa" value={form.data} onChange={v => atualizarCampo('data', v)} />
                        </div>
                      )}

                      <div className="mt-6">
                        <label className="mb-2 block text-sm text-white/55">Observações</label>
                        <textarea rows={3} value={form.observacoes} onChange={e => atualizarCampo('observacoes', e.target.value)}
                          placeholder="Tese de investimento, contexto de mercado, notas operacionais..."
                          className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 resize-none" />
                      </div>

                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button onClick={fecharModal} className="cursor-pointer rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/70">Cancelar</button>
                        <button onClick={tipoLancamento === 'Compra' ? salvarCompra : salvarVenda}
                          className="cursor-pointer rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black">
                          Salvar lançamento
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ── Modal: confirmar exclusão ── */}
        {modalConfirmarExclusao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f1319] p-6">
              <div className="text-lg font-semibold">Excluir transação</div>
              <div className="mt-1 text-sm text-white/45">Esta ação é irreversível.</div>
              <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/45">Ativo</span>
                  <span className="font-medium text-white">{modalConfirmarExclusao.ativo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">Tipo</span>
                  <span className={`font-medium ${modalConfirmarExclusao.tipo === 'Compra' ? 'text-emerald-300' : 'text-red-300'}`}>{modalConfirmarExclusao.tipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">Data</span>
                  <span className="text-white/70">{modalConfirmarExclusao.data}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/45">Valor</span>
                  <span className="text-white/70">{formatCurrency(modalConfirmarExclusao.valorTotal)}</span>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setModalConfirmarExclusao(null)} className="cursor-pointer rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/70">Cancelar</button>
                <button onClick={confirmarExclusaoTransacao} className="cursor-pointer rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-medium text-red-300 hover:bg-red-400/20 transition">Excluir</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
