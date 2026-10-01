// Fixtures anonymisées (données inventées) d'exports Etsy. Colonnes modélisées sur la documentation Etsy :
// non vérifiées sur un export réel (voir src/sources/etsy.js).
export const ETSY_ITEMS_CSV = `Sale Date,Item Name,Buyer,Quantity,Price,Coupon Code,Discount Amount,Order Shipping,Order Sales Tax,Item Total,Currency,Transaction ID,Listing ID,Date Shipped,Order ID,Variations
03/14/24,Sticker Renard,acheteuse_un,2,3.50,,0.00,2.90,0.00,7.00,EUR,111,901,03/16/24,5000001,
03/14/24,Carte postale Hibou,acheteuse_un,1,2.00,,0.00,2.90,0.00,2.00,EUR,112,902,03/16/24,5000001,
03/20/24,"Print A5, encadré",acheteur_deux,1,"12,00",,0.00,4.50,0.00,"12,00",EUR,113,903,,5000002,
not-a-date,Sticker Renard,acheteur_trois,1,3.50,,0.00,0.00,0.00,3.50,EUR,114,901,,5000003,
03/22/24,Sticker Renard,acheteur_quatre,1,3.50,,0.00,0.00,0.00,3.50,EUR,115,901,,,
`;

export const ETSY_ORDERS_CSV = `Sale Date,Order ID,Buyer User ID,Full Name,Number of Items,Currency,Order Value,Shipping,Order Total,Status,Card Processing Fees,Order Net,Date Shipped
2024-03-14,6000001,u1,Alice Martin,3,EUR,9.00,2.90,11.90,Paid,0.90,11.00,03/16/24
2024-03-20,6000002,u2,Bob Durand,1,EUR,12.00,4.50,16.50,Paid,,16.50,
2024-03-21,6000001,u1,Alice Martin,3,EUR,9.00,2.90,11.90,Paid,0.90,11.00,03/16/24
`;
