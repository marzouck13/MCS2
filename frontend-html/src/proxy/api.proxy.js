const axios = require('axios');
const configuration = require('../config/variables-environnement');

const clientBackend = axios.create({
    baseURL: configuration.serveur.urlApiBackend,
    timeout: 20000
});

const ENTETES_EXCLUS = new Set([
    'host',
    'connection',
    'content-length',
    'cookie',
    'authorization',
    'accept-encoding'
]);

const METHODES_SANS_CORPS = new Set(['GET', 'HEAD', 'DELETE']);

const proxyApi = async (requete, reponse) => {
    const jeton = requete.cookies[configuration.cookies.nomAcces];

    const entetes = {};
    for (const [cle, valeur] of Object.entries(requete.headers)) {
        if (!ENTETES_EXCLUS.has(cle.toLowerCase())) {
            entetes[cle] = valeur;
        }
    }
    entetes['X-Forwarded-For'] = requete.ip;
    if (jeton) {
        entetes['Authorization'] = 'Bearer ' + jeton;
    }

    const aCorps = !METHODES_SANS_CORPS.has(requete.method)
        && requete.body
        && Object.keys(requete.body).length > 0;

    try {
        const reponseBackend = await clientBackend({
            method: requete.method,
            url: requete.originalUrl,
            headers: entetes,
            data: aCorps ? requete.body : undefined,
            validateStatus: () => true
        });

        return reponse.status(reponseBackend.status).json(reponseBackend.data);
    } catch (erreur) {
        console.error('Erreur proxy /api :', erreur.message);
        return reponse.status(502).json({
            succes: false,
            message: 'Impossible de joindre le serveur.',
            code: 'PASSERELLE_INDISPONIBLE'
        });
    }
};

module.exports = { proxyApi };