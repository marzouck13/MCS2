const jwt = require('jsonwebtoken');
const configuration = require('../config/variables-environnement');

const verifierJeton = (requete, reponse, suivant) => {
    const jeton = requete.cookies[configuration.cookies.nomAcces];
    const chemin = requete.originalUrl.split('?')[0];
    const estEspacePatient = chemin.indexOf('/patient/') === 0;
    const redirection = estEspacePatient ? '/patient/connexion' : '/connexion';

    if (!jeton) {
        return reponse.redirect(redirection);
    }

    try {
        requete.utilisateur = jwt.verify(jeton, configuration.authentification.cleSecreteJwt);
        return suivant();
    } catch {
        reponse.clearCookie(configuration.cookies.nomAcces);
        reponse.clearCookie(configuration.cookies.nomRefresh);
        return reponse.redirect(redirection);
    }
};

module.exports = { verifierJeton };