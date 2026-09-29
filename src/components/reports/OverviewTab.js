import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { Card } from '../ui/Card';
import { CHANNELS } from '../ui/ChannelBadge';
import { netOf } from '../../utils/orderAmounts';

const PALETTE = ['#a78bfa', '#f472b6', '#fbbf24', '#34d399'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg text-sm border border-purple-100 bg-white">
      <p className="text-xs mb-1 font-semibold text-gray-500">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.stroke || p.fill }} className="font-bold">
          {Number(p.value).toFixed(2)}€
        </p>
      ))}
    </div>
  );
};

export const OverviewTab = ({ stats, orders }) => {
  const channelData = Object.keys(CHANNELS).map((channel, i) => {
    const channelOrders = orders.filter((o) => o.channel === channel);
    const value = channelOrders.reduce((s, o) => s + netOf(o), 0);
    return { name: CHANNELS[channel].label, value: Math.round(value * 100) / 100, color: PALETTE[i % PALETTE.length] };
  }).filter((c) => c.value > 0);

  const maxDay = Math.max(1, ...stats.dayData.map((d) => d.montant));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Évolution des revenus</h3>
        <p className="text-sm text-gray-500 mb-4">Mois par mois, avec cumul</p>
        {stats.monthlyData.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">Pas encore assez de données.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gMontant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gCumul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} width={48} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="cumul" stroke="#a78bfa" strokeWidth={2} fill="url(#gCumul)" dot={false} strokeDasharray="5 3" />
              <Area type="monotone" dataKey="montant" stroke="#f472b6" strokeWidth={2.5} fill="url(#gMontant)" dot={{ fill: '#f472b6', r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-5 mt-2 justify-center text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-pink-400 inline-block" /> Revenus</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-400 inline-block" style={{ borderTop: '2px dashed' }} /> Cumul</span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Répartition par canal</h3>
          <p className="text-sm text-gray-500 mb-4">Sur la période affichée</p>
          {channelData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">Aucune donnée.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={4} dataKey="value">
                    {channelData.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2">
                {channelData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />{c.name}</span>
                    <span className="font-semibold text-gray-900">{c.value.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenus par jour</h3>
          <p className="text-sm text-gray-500 mb-4">Quand tes ventes se concentrent</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.dayData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} width={44} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="montant" radius={[6, 6, 0, 0]}>
                {stats.dayData.map((d, i) => (
                  <Cell key={i} fill={d.montant === maxDay ? '#fbbf24' : '#c4b5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
