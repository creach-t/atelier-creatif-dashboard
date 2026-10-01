import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

// Champ texte avec suggestions ancrées dessous — le parent fournit déjà la liste
// filtrée (le filtrage dépend du contexte : produits, clients...) et un message
// affiché quand rien ne correspond, pour signaler qu'une nouvelle entrée sera créée.
export const AutocompleteField = ({
  value,
  onChange,
  onSelect,
  suggestions,
  getKey,
  renderOption,
  newLabel,
  placeholder,
  className = '',
  inputClassName = '',
  required = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        required={required}
        className={inputClassName}
      />
      {open && value.trim() && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-purple-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((option) => (
              <button
                key={getKey(option)}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(option);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-purple-50 text-left"
              >
                {renderOption(option)}
              </button>
            ))
          ) : (
            <p className="flex items-center gap-1.5 px-3 py-2 text-xs text-purple-600">
              <Sparkles size={12} />
              {newLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
