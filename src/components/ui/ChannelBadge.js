import React from 'react';

export const CHANNELS = {
  kofi: { label: 'Ko-fi', icon: '💜', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  reel: { label: 'Reel', icon: '🏪', className: 'bg-pink-100 text-pink-800 border-pink-200' },
};

export const ChannelBadge = ({ channel }) => {
  const info = CHANNELS[channel] || { label: channel, icon: '📦', className: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${info.className}`}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
};
