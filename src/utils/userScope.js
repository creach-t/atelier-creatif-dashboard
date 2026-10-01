// Les réglages gardés dans le navigateur (localStorage) appartiennent à un compte : sur un navigateur partagé,
// un second compte ne doit jamais retrouver la disposition, les notes ou les habitudes du premier.
// App.js renseigne l'utilisateur connecté avant de monter l'interface.
let userId = '';

export const setUserScope = (id) => { userId = id || ''; };
export const scopedKey = (base) => (userId ? `${base}.${userId}` : base);
