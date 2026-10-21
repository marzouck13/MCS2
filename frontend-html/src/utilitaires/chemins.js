const path = require('path');

const RACINE_PUBLIC = path.join(__dirname, '..', '..', 'public');

const cheminPage = (nomFichier) => path.join(RACINE_PUBLIC, 'pages', nomFichier);
const cheminAsset = (sousDossier) => path.join(RACINE_PUBLIC, sousDossier);

module.exports = { cheminPage, cheminAsset, RACINE_PUBLIC };