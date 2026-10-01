import {
  Home, ShoppingCart, Palette, Users, TrendingUp, LayoutGrid, Star, Heart, Wallet, Sparkles, Package,
  CalendarDays, Trophy, Zap, Gift, Coffee, Rocket, Briefcase, Flame, Bookmark,
} from 'lucide-react';

// Icônes proposables pour une page : nom stocké dans l'espace de travail -> composant.
export const PAGE_ICONS = {
  home: Home, cart: ShoppingCart, palette: Palette, users: Users, chart: TrendingUp, layout: LayoutGrid,
  star: Star, heart: Heart, wallet: Wallet, sparkles: Sparkles, package: Package, calendar: CalendarDays,
  trophy: Trophy, zap: Zap, gift: Gift, coffee: Coffee, rocket: Rocket, briefcase: Briefcase, flame: Flame, bookmark: Bookmark,
};

export const pageIcon = (name) => PAGE_ICONS[name] || LayoutGrid;
