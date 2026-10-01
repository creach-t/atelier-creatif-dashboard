// Extrait <head> d'une vraie page produit publique Ko-fi (https://ko-fi.com/s/<alias>), relevée le 2026-10-01, réduite aux
// balises utiles. Particularités réelles à conserver : entités HTML, suffixe « - <boutique>'s Ko-fi Shop » dans og:title,
// et DEUX balises product:price:amount (l'une porte le montant, l'autre la devise), `content` avant `property`.
export const KOFI_PRODUCT_HTML = `<!doctype html>
<html lang="en">
<head prefix="og: http://ogp.me/ns#">
<meta property="og:site_name" content="Ko-fi">
<meta name="twitter:image" content="https://storage.ko-fi.com/cdn/useruploads/post/de42da65-3f62-432f-93aa-6ef7cfee1437_img_2279.jpeg" />
<meta property="og:title" content="Digital Sticker Mix - Free Download - VirtuallyCreativ&#x27;s Ko-fi Shop" />
<meta property="og:description" content="A mix of digital stickers &amp; more &#x2026;" />
<meta property="og:type" content="product" />
<meta content="12.50" property="product:price:amount">
<meta content="EUR" property="product:price:amount">
<meta property="og:url" content="https://ko-fi.com/s/58d678ea42" />
<meta property="og:image" content="https://storage.ko-fi.com/cdn/useruploads/post/de42da65-3f62-432f-93aa-6ef7cfee1437_img_2279.jpeg" />
</head>
<body></body>
</html>`;
