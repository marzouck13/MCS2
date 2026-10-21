require('dotenv').config();

const lire = (nom, defaut = null) => {
    const valeur = process.env[nom];
    if (valeur === undefined || valeur === '') return defaut;
    return String(valeur).trim().replace(/^["']|["']$/g, '');
};

const obligatoire = (nom) => {
    const valeur = lire(nom);
    if (!valeur) throw new Error('Variable d\'environnement manquante : ' + nom);
    return valeur;
};

const configuration = {
    serveur: {
        port: parseInt(lire('PORT', '3000'), 10),
        environnement: lire('NODE_ENV', 'developpement'),
        urlApiBackend: obligatoire('URL_API_BACKEND')
    },
    authentification: {
        cleSecreteJwt: obligatoire('JWT_SECRET')
    },
    cookies: {
        nomAcces: 'mcs_acces',
        nomRefresh: 'mcs_refresh',
        dureeAccesMs: 24 * 60 * 60 * 1000,
        dureeRefreshMs: 7 * 24 * 60 * 60 * 1000
    }
};

module.exports = configuration;