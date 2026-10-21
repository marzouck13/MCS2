(function () {
    'use strict';

    var MIROTALK_DOMAINE = 'p2p.mirotalk.com';
    var PREFIXE_SALLE = 'MCS-';

    var segments = window.location.pathname.split('/');
    var codeSession = segments[segments.length - 1];

    var iframe = document.getElementById('visio-iframe');
    var chargement = document.getElementById('visio-chargement');
    var titre = document.getElementById('visio-titre');
    var boutonCopier = document.getElementById('bouton-copier');
    var boutonQuitter = document.getElementById('bouton-quitter');

    var urlVisio = null;

    if (!codeSession || codeSession === '') {
        window.Alertes.erreur('Code de session manquant dans l URL.', 'Erreur');
        boutonCopier.disabled = true;
        chargement.hidden = true;
        return;
    }

    titre.textContent = 'Visio - ' + codeSession;

    async function recupererNomUtilisateur() {
        try {
            var rep = await window.ClientMCS.api.get('/api/auth/profil');
            if (rep.succes && rep.utilisateur) {
                var prenom = (rep.utilisateur.prenom || '').trim();
                var nom = (rep.utilisateur.nom || '').trim();
                var complet = (prenom + ' ' + nom).trim();
                if (complet) {
                    var prefixe = rep.utilisateur.role === 'medecin' ? 'Dr ' : '';
                    return prefixe + complet;
                }
            }
        } catch {
            // Silencieux : on utilisera la valeur par defaut
        }
        return 'Medecin';
    }

    function construireUrl(nomUtilisateur) {
        var nomSalle = PREFIXE_SALLE + codeSession;
        return 'https://' + MIROTALK_DOMAINE + '/join'
            + '?room=' + encodeURIComponent(nomSalle)
            + '&name=' + encodeURIComponent(nomUtilisateur);
    }

    async function initialiser() {
        try {
            var nomUtilisateur = await recupererNomUtilisateur();
            urlVisio = construireUrl(nomUtilisateur);

            iframe.addEventListener('load', function () {
                chargement.hidden = true;
            });

            iframe.src = urlVisio;

            // Securite : si l'iframe ne charge pas en 8s, on masque le spinner
            setTimeout(function () {
                if (!chargement.hidden) {
                    chargement.hidden = true;
                }
            }, 8000);

        } catch (err) {
            chargement.hidden = true;
            window.Alertes.erreur('Impossible de preparer la salle : ' + err.message);
        }
    }

    boutonCopier.addEventListener('click', async function () {
        if (!urlVisio) return;
        try {
            await navigator.clipboard.writeText(urlVisio);
            window.Alertes.succes('Lien de visio copie dans le presse-papiers.', 'Lien copie');
        } catch {
            window.Alertes.erreur('Impossible de copier le lien. Votre navigateur ne supporte peut-etre pas cette fonction.');
        }
    });

    boutonQuitter.addEventListener('click', function () {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/tableau-bord';
        }
    });

    window.addEventListener('beforeunload', function () {
        iframe.src = 'about:blank';
    });

    initialiser();
})();