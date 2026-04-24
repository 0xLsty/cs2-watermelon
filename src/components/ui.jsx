function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div>
      <div className={`mt-2 text-sm font-medium ${highlight || 'text-white/90'}`}>{value}</div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = 'text' }) {
  return (
    <label>
      <div className="mb-2 text-sm text-white/55">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label>
      <div className="mb-2 text-sm text-white/55">{label}</div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-[#10141b] px-4 py-3 text-sm text-white outline-none"
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function CategoryField({ field, value, onChange }) {
  if (field.type === 'select') {
    return <SelectField label={field.label} value={value || field.options[0]} onChange={onChange} options={field.options} />;
  }
  return <Field label={field.label} placeholder={field.placeholder} value={value} onChange={onChange} />;
}

function ItemImage({ src, alt, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${className || ''}`}>
      <img
        src={src}
        alt={alt}
        className="max-h-full max-w-full object-contain"
        onError={e => { e.currentTarget.src = 'https://placehold.co/96x96/111827/F9FAFB?text=ITEM'; }}
      />
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-white/85 font-medium">{typeof value === 'string' ? value : value}</span>
    </div>
  );
}

export { PencilIcon, Badge, InfoItem, Field, SelectField, CategoryField, ItemImage, DetailRow };
