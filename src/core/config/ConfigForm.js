import React from 'react';
import { Minus, Plus } from 'lucide-react';

const INPUT = 'w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent';

export const Segmented = ({ value, options, onChange, size = 'md', ariaLabel }) => (
  <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1 p-1 bg-purple-50/70 rounded-xl">
    {options.map((o) => {
      const active = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={active}
          onClick={() => onChange(o.value)}
          className={`flex-1 whitespace-nowrap rounded-lg font-medium transition-all ${size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
            active ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-purple-600'
          }`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

export const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-purple-500' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const Stepper = ({ value, onChange, min = 1, max = 20, step = 1 }) => (
  <div className="inline-flex items-center gap-1 p-1 bg-purple-50/70 rounded-xl">
    <button type="button" aria-label="Moins" onClick={() => onChange(Math.max(min, value - step))} className="p-2 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30" disabled={value <= min}>
      <Minus size={14} />
    </button>
    <span className="w-9 text-center text-sm font-semibold tabular-nums">{value}</span>
    <button type="button" aria-label="Plus" onClick={() => onChange(Math.min(max, value + step))} className="p-2 rounded-lg text-gray-600 hover:bg-white disabled:opacity-30" disabled={value >= max}>
      <Plus size={14} />
    </button>
  </div>
);

const Chips = ({ value = [], options, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((o) => {
      const on = value.includes(o.value);
      return (
        <button
          key={o.value}
          type="button"
          aria-pressed={on}
          onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${on ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

const TINTS = {
  purple: '#a78bfa', pink: '#f472b6', amber: '#fbbf24', emerald: '#34d399', sky: '#38bdf8', rose: '#fb7185',
};
export const TINT_OPTIONS = Object.keys(TINTS).map((k) => ({ value: k, label: k }));
export const tintColor = (name) => TINTS[name] || TINTS.purple;

const Swatches = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2.5">
    {Object.entries(TINTS).map(([name, hex]) => (
      <button
        key={name}
        type="button"
        aria-label={name}
        aria-pressed={value === name}
        onClick={() => onChange(name)}
        className={`w-8 h-8 rounded-full transition-transform ${value === name ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : 'hover:scale-105'}`}
        style={{ background: hex }}
      />
    ))}
  </div>
);

// Un champ du schéma : le type décide du contrôle. Ajouter un type de contrôle = un `case` ici, et il devient
// disponible pour tous les widgets.
const Field = ({ field, value, onChange }) => {
  switch (field.type) {
    case 'select':
      return field.options.length <= 4 || field.display === 'segmented'
        ? <Segmented value={value} options={field.options} onChange={onChange} ariaLabel={field.label} />
        : (
          <select className={INPUT} value={value} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
    case 'toggle':
      return <Toggle checked={Boolean(value)} onChange={onChange} label={field.label} />;
    case 'number':
      return <Stepper value={Number(value)} onChange={onChange} min={field.min} max={field.max} step={field.step} />;
    case 'multiselect':
      return <Chips value={value} options={field.options} onChange={onChange} />;
    case 'color':
      return <Swatches value={value} onChange={onChange} />;
    case 'textarea':
      return <textarea className={`${INPUT} min-h-[8rem]`} value={value || ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
    default:
      return <input className={INPUT} type="text" value={value || ''} placeholder={field.placeholder} maxLength={field.maxLength || 80} onChange={(e) => onChange(e.target.value)} />;
  }
};

// Formulaire généré depuis un schéma : [{ key, label, type, options?, help?, when? }].
// `when(config)` masque un champ tant qu'il n'a pas de sens (ex. « cumul » seulement pour un graphique).
export const ConfigForm = ({ schema, config, onChange }) => (
  <div className="space-y-5">
    {schema.filter((f) => !f.when || f.when(config)).map((field) => {
      const inline = field.type === 'toggle';
      return (
        <div key={field.key} className={inline ? 'flex items-center justify-between gap-4' : ''}>
          <div className={inline ? 'min-w-0' : 'mb-2'}>
            <label className="block text-sm font-semibold text-gray-800">{field.label}</label>
            {field.help && <p className="text-xs text-gray-500 mt-0.5">{field.help}</p>}
          </div>
          <Field field={field} value={config[field.key]} onChange={(v) => onChange({ [field.key]: v })} />
        </div>
      );
    })}
  </div>
);
