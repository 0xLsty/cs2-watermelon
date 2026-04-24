import {
  EXTERIOR_OPTS,
  EXTERIOR_STYLE,
  ACABAMENTO_STYLE,
  RARITY_AGENT_STYLE,
  DEMANDA_STYLE,
  STICKER_TYPE_OPTIONS,
  CAPSULE_TYPE_OPTIONS,
  DROP_STATUS_OPTIONS,
} from '../config/constants';
import { Badge, Field, SelectField, DetailRow } from './ui';

function CategoryTypeBadge({ ativo }) {
  const cat = ativo.category;
  const d = ativo.details;
  if (!d) return null;

  if (cat === 'Skin') {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.stattrak === 'Sim' && (
          <Badge className="text-orange-300 bg-orange-400/10 border border-orange-400/25">StatTrak™</Badge>
        )}
        {d.exterior && d.exterior !== '-' && (
          <Badge className={`text-base px-3 py-1 font-semibold ${EXTERIOR_STYLE[d.exterior] || 'text-white/60 bg-white/5 border border-white/10'}`}>
            {d.exterior}
          </Badge>
        )}
      </div>
    );
  }
  if (cat === 'Sticker') {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.acabamento && d.acabamento !== '-' && (
          <Badge className={`text-base px-3 py-1 font-semibold ${ACABAMENTO_STYLE[d.acabamento] || 'text-white/60 bg-white/5 border border-white/10'}`}>
            {d.acabamento}
          </Badge>
        )}
      </div>
    );
  }
  if (cat === 'Agente') {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge className={d.lado === 'CT' ? 'text-sky-300 bg-sky-400/10 border border-sky-400/25' : 'text-orange-300 bg-orange-400/10 border border-orange-400/25'}>
          {d.lado}
        </Badge>
        {d.raridade && d.raridade !== '-' && (
          <Badge className={RARITY_AGENT_STYLE[d.raridade] || 'text-white/60 bg-white/5 border border-white/10'}>
            {d.raridade}
          </Badge>
        )}
      </div>
    );
  }
  if (cat === 'Caixa' || cat === 'Cápsula') {
    const isAtiva = (d.statusDrop || '').startsWith('Ativa');
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.statusDrop && d.statusDrop !== '-' && (
          <Badge className={`text-base px-3 py-1 font-semibold ${isAtiva ? 'text-emerald-300 bg-emerald-400/10 border border-emerald-400/25' : 'text-red-300 bg-red-400/10 border border-red-400/25'}`}>
            {isAtiva ? 'Ativa' : 'Descontinuada'}
          </Badge>
        )}
      </div>
    );
  }
  if (cat === 'Charm') {
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {d.raridade && d.raridade !== '-' && (
          <Badge className={d.raridade === 'Extraordinary' ? 'text-yellow-300 bg-yellow-400/10 border border-yellow-400/25' : 'text-purple-300 bg-purple-400/10 border border-purple-400/25'}>
            {d.raridade}
          </Badge>
        )}
      </div>
    );
  }
  return null;
}

function ProfileDetails({ ativo, onEdit, editMode, editData, onEditChange, onEditSave, onEditCancel }) {
  const d = ativo.details || {};
  const cat = ativo.category;
  const stickers = [d.sticker1, d.sticker2, d.sticker3, d.sticker4, d.sticker5].filter(s => s && s !== '-');
  const patches = [d.patch1, d.patch2, d.patch3].filter(p => p && p !== '-');

  if (editMode) {
    return (
      <div className="mt-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/30">Editar detalhes</div>
            <div className="mt-1 text-sm text-white/75">Ajuste os campos específicos do ativo</div>
          </div>
        </div>

        <div className="space-y-4">
          {cat === 'Skin' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Arma" value={editData.arma} onChange={v => onEditChange('arma', v)} placeholder="AK-47" />
              <Field label="Coleção" value={editData.colecao} onChange={v => onEditChange('colecao', v)} placeholder="Arms Deal" />
              <Field label="Float" value={editData.float} onChange={v => onEditChange('float', v)} placeholder="0.1523" />
              <Field label="Pattern" value={editData.pattern} onChange={v => onEditChange('pattern', v)} placeholder="661" />
              <SelectField label="Exterior" value={editData.exterior} options={EXTERIOR_OPTS} onChange={v => onEditChange('exterior', v)} />
              <SelectField label="StatTrak™" value={editData.stattrak} options={['Não','Sim']} onChange={v => onEditChange('stattrak', v)} />
            </div>
          )}
          {cat === 'Sticker' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cápsula de origem" value={editData.capsulaOrigem} onChange={v => onEditChange('capsulaOrigem', v)} placeholder="Budapest 2025" />
              <SelectField label="Tipo" value={editData.classificacao} options={STICKER_TYPE_OPTIONS} onChange={v => onEditChange('classificacao', v)} />
              <SelectField label="Acabamento" value={editData.acabamento} options={['Paper','Holo','Foil','Gold','Glitter','Embroidered']} onChange={v => onEditChange('acabamento', v)} />
              <Field label="Nome / Descrição" value={editData.timePlayer} onChange={v => onEditChange('timePlayer', v)} placeholder="Katowice 2014" />
            </div>
          )}
          {cat === 'Agente' && (
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Lado" value={editData.lado} options={['CT','TR']} onChange={v => onEditChange('lado', v)} />
              <SelectField label="Raridade" value={editData.raridade} options={['Distinguished Agent','Exceptional Agent','Superior Agent','Master Agent']} onChange={v => onEditChange('raridade', v)} />
              <Field label="Operação / Coleção" value={editData.operacao} onChange={v => onEditChange('operacao', v)} placeholder="Riptide" />
            </div>
          )}
          {cat === 'Caixa' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Coleção / Operação" value={editData.operacao} onChange={v => onEditChange('operacao', v)} placeholder="Breakout" />
              <SelectField label="Status de drop" value={editData.statusDrop} options={DROP_STATUS_OPTIONS} onChange={v => onEditChange('statusDrop', v)} />
              <SelectField label="Demanda de abertura" value={editData.demandaAbertura} options={['Baixa','Média','Alta','Muito Alta']} onChange={v => onEditChange('demandaAbertura', v)} />
            </div>
          )}
          {cat === 'Cápsula' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome / Origem" value={editData.capsulaOrigem} onChange={v => onEditChange('capsulaOrigem', v)} placeholder="Budapest 2025" />
              <SelectField label="Tipo de cápsula" value={editData.tipoCapsula} options={CAPSULE_TYPE_OPTIONS} onChange={v => onEditChange('tipoCapsula', v)} />
              <SelectField label="Status" value={editData.statusDrop} options={DROP_STATUS_OPTIONS} onChange={v => onEditChange('statusDrop', v)} />
            </div>
          )}
          {cat === 'Charm' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Coleção / Origem" value={editData.origem} onChange={v => onEditChange('origem', v)} placeholder="Missing Link" />
              <SelectField label="Raridade" value={editData.raridade} options={['Remarkable','Extraordinary']} onChange={v => onEditChange('raridade', v)} />
              <Field label="Variante" value={editData.variant} onChange={v => onEditChange('variant', v)} placeholder="Azul" />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-white/55">Observações</label>
            <textarea
              rows={3}
              value={editData.observacoes || ''}
              onChange={e => onEditChange('observacoes', e.target.value)}
              placeholder="Notas sobre o ativo..."
              className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onEditSave} className="cursor-pointer rounded-xl bg-white px-4 py-2 text-xs font-medium text-black">Salvar</button>
            <button onClick={onEditCancel} className="cursor-pointer rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {d.observacoes && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Observações</div>
          <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{d.observacoes}</p>
        </div>
      )}

      {cat === 'Skin' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Detalhes da skin</div>
          {d.stattrak === 'Sim' && <Badge className="text-orange-300 bg-orange-400/10 border border-orange-400/25">StatTrak™</Badge>}
          {d.arma && d.arma !== '-' && <DetailRow label="Arma" value={d.arma} />}
          {d.float && d.float !== '-' && <DetailRow label="Float" value={parseFloat(d.float).toFixed(6)} />}
          {d.pattern && d.pattern !== '-' && <DetailRow label="Pattern / Seed" value={d.pattern} />}
          {d.colecao && d.colecao !== '-' && <DetailRow label="Coleção" value={d.colecao} />}
        </div>
      )}

      {cat === 'Sticker' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Detalhes do sticker</div>
          {d.capsulaOrigem && d.capsulaOrigem !== '-' && <DetailRow label="Cápsula / Origem" value={d.capsulaOrigem} />}
          {d.classificacao && d.classificacao !== '-' && <DetailRow label="Tipo" value={d.classificacao} />}
          {d.timePlayer && d.timePlayer !== '-' && <DetailRow label="Nome / Descrição" value={d.timePlayer} />}
        </div>
      )}

      {cat === 'Agente' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Detalhes do agente</div>
          {d.operacao && d.operacao !== '-' && <DetailRow label="Operação" value={d.operacao} />}
        </div>
      )}

      {cat === 'Caixa' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Detalhes da caixa</div>
          {d.operacao && d.operacao !== '-' && <DetailRow label="Coleção / Operação" value={d.operacao} />}
          {d.demandaAbertura && d.demandaAbertura !== '-' && (
            <DetailRow label="Demanda de abertura" value={<Badge className={DEMANDA_STYLE[d.demandaAbertura] || 'text-white/60 bg-white/5 border border-white/10'}>{d.demandaAbertura}</Badge>} />
          )}
        </div>
      )}

      {cat === 'Cápsula' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Detalhes da cápsula</div>
          {d.capsulaOrigem && d.capsulaOrigem !== '-' && <DetailRow label="Nome / Origem" value={d.capsulaOrigem} />}
          {d.tipoCapsula && d.tipoCapsula !== '-' && <DetailRow label="Tipo" value={d.tipoCapsula} />}
        </div>
      )}

      {cat === 'Charm' && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Detalhes do charm</div>
          {d.origem && d.origem !== '-' && <DetailRow label="Coleção" value={d.origem} />}
          {d.variant && d.variant !== '-' && <DetailRow label="Variante" value={d.variant} />}
        </div>
      )}

      {stickers.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Stickers colados ({stickers.length})</div>
          <div className="space-y-2">{stickers.map((s, i) => <div key={i} className="flex items-center gap-2.5"><div className="h-1.5 w-1.5 rounded-full bg-violet-400/60 shrink-0" /><span className="text-sm text-white/75">{s}</span></div>)}</div>
        </div>
      )}

      {patches.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Patches ({patches.length})</div>
          <div className="space-y-2">{patches.map((p, i) => <div key={i} className="flex items-center gap-2.5"><div className="h-1.5 w-1.5 rounded-full bg-sky-400/60 shrink-0" /><span className="text-sm text-white/75">{p}</span></div>)}</div>
        </div>
      )}
    </div>
  );
}

export { CategoryTypeBadge, ProfileDetails };
