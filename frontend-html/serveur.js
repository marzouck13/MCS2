const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const os = require('os');

const configuration = require('./src/config/variables-environnement');
const { cheminPage, cheminAsset } = require('./src/utilitaires/chemins');
const routesSession = require('./src/routes/session.routes');
const routesPages = require('./src/routes/pages.routes');
const { proxyApi } = require('./src/proxy/api.proxy');

const application = express();

application.use(helmet({ contentSecurityPolicy: false }));
application.use(express.json({ limit: '2mb' }));
application.use(express.urlencoded({ extended: true }));
application.use(cookieParser());

application.use('/css', express.static(cheminAsset('css')));
application.use('/js', express.static(cheminAsset('js')));
application.use('/img', express.static(cheminAsset('img')));
application.use('/partials', express.static(cheminAsset('partials')));

application.use('/session', routesSession);
application.use('/api', proxyApi);
application.use('/', routesPages);

application.use((requete, reponse) => {
    reponse.status(404).sendFile(cheminPage('404.html'));
});

application.use((erreur, requete, reponse, suivant) => {
    console.error('Erreur non gérée :', erreur.message);
    if (reponse.headersSent) {
        return suivant(erreur);
    }
    return reponse.status(500).json({
        succes: false,
        message: 'Erreur interne du serveur.'
    });
});

// ============================================
// Détection de l'adresse IP locale (IPv4 non interne)
// ============================================
function obtenirAdresseIpLocale() {
    const interfaces = os.networkInterfaces();
    for (const nom in interfaces) {
        const iface = interfaces[nom];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

const port = configuration.serveur.port;
const ipLocale = obtenirAdresseIpLocale();

// Ecoute explicite sur 0.0.0.0 pour être accessible depuis le réseau local
application.listen(port, '0.0.0.0', () => {
    console.log('Frontend démarré sur http://localhost:' + port);
    console.log('Accessible sur le réseau : http://' + ipLocale + ':' + port);
    console.log('API backend ciblée : ' + configuration.serveur.urlApiBackend);
});