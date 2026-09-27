// Badges de reconnaissance client, partagés entre le Rapport (Clients) et la page Clients.
export const getInitials = (name) =>
  (name || '?').split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

export const getCustomerBadges = ({ count = 0, total = 0 }) => {
  const badges = [];
  if (count >= 3 && total >= 50) badges.push({ icon: '👑', label: 'VIP' });
  else if (total >= 50) badges.push({ icon: '💛', label: 'Généreux·se' });
  else if (count >= 3) badges.push({ icon: '🔄', label: 'Fidèle' });
  if (count >= 5) badges.push({ icon: '⭐', label: 'Super fan' });
  return badges;
};
