const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const configuration = require('../config/variables-environnement');
const { limiteurConnexion } = require('../intergiciels/limite-requetes');

const routeur = express.Router();

const clientBackend = axios.create({
    baseURL: configuration.serveur.urlApiBackend,
    timeout: 20000,
    validateStatus: () => true
});

const limiteurOtp = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        succes: false,
        message: 'Trop de demandes d\'OTP. Réessayez dans 5 minutes.'
    }
});

const limiteurConnexionPatient = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        succes: false,
        message: 'Trop de tentatives. Réessayez dans 15 minutes.'
    }
});

const optionsCookiesBase = {
    httpOnly: true,
    sameSite: 'strict',
    secure: configuration.serveur.environnement === 'production',
    path: '/'
};

routeur.post('/ouvrir', limiteurConnexion, async (requete, reponse) => {
    const { npiProfessionnel, motDePasse } = requete.body || {};

    if (!npiProfessionnel || !motDePasse) {
        return reponse.status(400).json({
            succes: false,
            message: 'Numero d\'Identification Personnelle NPI et mot de passe requis.'
        });
    }

    try {
        const rep = await clientBackend.post(
            '/api/auth/professionnel/connexion',
            { npiProfessionnel, motDePasse },
            {
                headers: {
                    'X-Forwarded-For': requete.ip,
                    'User-Agent': requete.headers['user-agent'] || ''
                }
            }
        );

        if (rep.status !== 200 || !rep.data || !rep.data.succes) {
            return reponse.status(rep.status || 401).json({
                succes: false,
                message: (rep.data && rep.data.message) || 'Connexion refusée.'
            });
        }

        const { jeton, jetonRafraichissement, utilisateur } = rep.data;

        reponse.cookie(configuration.cookies.nomAcces, jeton, {
            ...optionsCookiesBase,
            maxAge: configuration.cookies.dureeAccesMs
        });
        reponse.cookie(configuration.cookies.nomRefresh, jetonRafraichissement, {
            ...optionsCookiesBase,
            maxAge: configuration.cookies.dureeRefreshMs
        });

        return reponse.json({ succes: true, utilisateur });
    } catch (erreur) {
        console.error('Erreur /session/ouvrir :', erreur.message);
        return reponse.status(502).json({
            succes: false,
            message: 'Impossible de joindre le serveur.'
        });
    }
});

routeur.post('/patient/demander-otp', limiteurOtp, async (requete, reponse) => {
    const { npi, telephone } = requete.body || {};

    if (!npi || !telephone) {
        return reponse.status(400).json({
            succes: false,
            message: 'NPI et téléphone requis.'
        });
    }

    try {
        const rep = await clientBackend.post(
            '/api/auth/patient/demander-otp',
            { npi, telephone },
            {
                headers: {
                    'X-Forwarded-For': requete.ip,
                    'User-Agent': requete.headers['user-agent'] || ''
                }
            }
        );

        return reponse.status(rep.status || 200).json(rep.data);
    } catch (erreur) {
        console.error('Erreur /session/patient/demander-otp :', erreur.message);
        return reponse.status(502).json({
            succes: false,
            message: 'Impossible de joindre le serveur.'
        });
    }
});

routeur.post('/patient/ouvrir', limiteurConnexionPatient, async (requete, reponse) => {
    const { npi, telephone, codeOtp } = requete.body || {};

    if (!npi || !telephone || !codeOtp) {
        return reponse.status(400).json({
            succes: false,
            message: 'NPI, téléphone et code OTP requis.'
        });
    }

    try {
        const rep = await clientBackend.post(
            '/api/auth/patient/verifier-otp',
            { npi, telephone, codeOtp },
            {
                headers: {
                    'X-Forwarded-For': requete.ip,
                    'User-Agent': requete.headers['user-agent'] || ''
                }
            }
        );

        if (rep.status !== 200 || !rep.data || !rep.data.succes) {
            return reponse.status(rep.status || 401).json({
                succes: false,
                message: (rep.data && rep.data.message) || 'Connexion refusée.'
            });
        }

        const { jeton, jetonRafraichissement, utilisateur } = rep.data;

        reponse.cookie(configuration.cookies.nomAcces, jeton, {
            ...optionsCookiesBase,
            maxAge: configuration.cookies.dureeAccesMs
        });
        reponse.cookie(configuration.cookies.nomRefresh, jetonRafraichissement, {
            ...optionsCookiesBase,
            maxAge: configuration.cookies.dureeRefreshMs
        });

        return reponse.json({ succes: true, utilisateur });
    } catch (erreur) {
        console.error('Erreur /session/patient/ouvrir :', erreur.message);
        return reponse.status(502).json({
            succes: false,
            message: 'Impossible de joindre le serveur.'
        });
    }
});

routeur.post('/fermer', (requete, reponse) => {
    reponse.clearCookie(configuration.cookies.nomAcces);
    reponse.clearCookie(configuration.cookies.nomRefresh);
    return reponse.json({ succes: true });
});

module.exports = routeur;