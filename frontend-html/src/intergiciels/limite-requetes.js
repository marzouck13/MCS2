const rateLimit = require('express-rate-limit');

const limiteurConnexion = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        succes: false,
        message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
    }
});

module.exports = { limiteurConnexion };