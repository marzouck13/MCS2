(function (global) {
    'use strict';

    var CHEMINS_EXCLUS_REDIRECTION_401 = [
        '/session/ouvrir',
        '/session/patient/ouvrir',
        '/session/patient/demander-otp'
    ];

    function estCheminExclu(chemin) {
        for (var i = 0; i < CHEMINS_EXCLUS_REDIRECTION_401.length; i++) {
            if (chemin.indexOf(CHEMINS_EXCLUS_REDIRECTION_401[i]) !== -1) {
                return true;
            }
        }
        return false;
    }

    async function appelApi(chemin, options) {
        var optionsFinales = options || {};
        var reponse = await fetch(chemin, {
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                ...(optionsFinales.headers || {})
            },
            method: optionsFinales.method || 'GET',
            body: optionsFinales.body
        });

        if (reponse.status === 401 && !estCheminExclu(chemin)) {
            var estEspacePatient = window.location.pathname.indexOf('/patient/') === 0;
            window.location.href = estEspacePatient ? '/patient/connexion' : '/connexion';
            throw new Error('Session expiree.');
        }

        var donnees = await reponse.json().catch(function () { return {}; });
        if (!reponse.ok) {
            var erreur = new Error(donnees.message || 'Erreur HTTP ' + reponse.status);
            erreur.statut = reponse.status;
            erreur.donnees = donnees;
            throw erreur;
        }
        return donnees;
    }

    global.ClientMCS = {
        ouvrirSession: function (npiProfessionnel, motDePasse) {
            return appelApi('/session/ouvrir', {
                method: 'POST',
                body: JSON.stringify({ npiProfessionnel: npiProfessionnel, motDePasse: motDePasse })
            });
        },
        fermerSession: function () {
            return appelApi('/session/fermer', { method: 'POST' });
        },
        patient: {
            demanderOtp: function (npi, telephone) {
                return appelApi('/session/patient/demander-otp', {
                    method: 'POST',
                    body: JSON.stringify({ npi: npi, telephone: telephone })
                });
            },
            ouvrirSession: function (npi, telephone, codeOtp) {
                return appelApi('/session/patient/ouvrir', {
                    method: 'POST',
                    body: JSON.stringify({ npi: npi, telephone: telephone, codeOtp: codeOtp })
                });
            }
        },
        api: {
            get: function (chemin) {
                return appelApi(chemin, { method: 'GET' });
            },
            post: function (chemin, corps) {
                return appelApi(chemin, { method: 'POST', body: JSON.stringify(corps || {}) });
            },
            put: function (chemin, corps) {
                return appelApi(chemin, { method: 'PUT', body: JSON.stringify(corps || {}) });
            },
            delete: function (chemin) {
                return appelApi(chemin, { method: 'DELETE' });
            }
        }
    };
})(window);