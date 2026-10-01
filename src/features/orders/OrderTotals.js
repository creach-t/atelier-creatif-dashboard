import React from 'react';
import { money } from '../../core/metrics/format';

// Récapitulatif des montants : écart éventuel (don / remise), total payé, puis commission et net en point de vente.
export const OrderTotals = ({ gap, undetailed, totals, onRemoveGap }) => {
  const { total, commissionRate, commissionAmount, net } = totals;

  return (
    <div className="pt-2 border-t border-purple-100 space-y-2">
      {gap !== 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {undetailed ? 'Montant non détaillé' : gap > 0 ? 'Don / prix libre' : 'Remise'}
            <button type="button" onClick={onRemoveGap} title="Retirer cet écart du total" className="ml-2 text-xs text-purple-600 hover:underline">
              Retirer
            </button>
          </span>
          <span className={`font-medium ${gap > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {gap > 0 ? '+' : '−'}{money(Math.abs(gap))}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Total{commissionRate > 0 ? ' payé' : ''}</span>
        <span className={`${commissionRate > 0 ? 'text-sm font-semibold' : 'text-lg font-bold'} text-gray-900`}>{money(total)}</span>
      </div>
      {commissionRate > 0 && (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Commission ({commissionRate} %)</span>
            <span className="text-rose-500 font-medium">−{money(commissionAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Net perçu</span>
            <span className="text-lg font-bold text-gray-900">{money(net)}</span>
          </div>
        </>
      )}
    </div>
  );
};
