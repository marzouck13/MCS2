(function () {
    'use strict';

    var MIROTALK_DOMAINE = 'p2p.mirotalk.com';
    var PREFIXE_SALLE = 'MCS-';

    var segments = window.location.pathname.split('/');
    var codeSession = segments[segments.length - 1];

    var iframe = document.getElementById('visio-iframe');
    var chargement = document.getElementById('visio-chargement');
    var titre = document.getElementById('visio-titre');
    var boutonQuitter = document.getElementById('bouton-quitter');
    var boutonOuvrirOnglet = document.getElementById('bouton-ouvrir-onglet');
    var boutonOuvrirOngletChargement = document.getElementById('bouton-ouvrir-onglet-chargement');
    var aide = document.getElementById('visio-aide');

    if (!codeSession) {
        window.Alertes.erreur('Code de session manquant.');
        boutonQuitter.disabled = true;
        chargement.hidden = true;
        return;
    }

    titre.textContent = 'Visio - ' + codeSession;

    var nomSalle = PREFIXE_SALLE + codeSession;
    var urlVisio = 'https://' + MIROTALK_DOMAINE + '/join'
        + '?room=' + encodeURIComponent(nomSalle)
        + '&name=' + encodeURIComponent('Patient');

    // ============================================
    // Ouvrir dans un nouvel onglet
    // ============================================
    function ouvrirDansNouvelOnglet() {
        window.open(urlVisio, '_blank', 'noopener,noreferrer');
    }

    boutonOuvrirOnglet.addEventListener('click', ouvrirDansNouvelOnglet);
    boutonOuvrirOngletChargement.addEventListener('click', ouvrirDansNouvelOnglet);

    // ============================================
    // Détection mobile : basculer directement vers le nouvel onglet
    // ============================================
    function estMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    if (estMobile()) {
        // Sur mobile, afficher un message clair avec bouton direct
        aide.textContent = 'Sur mobile, les restrictions de sécurité empêchent l\'affichage de la visio intégrée. Cliquez sur le bouton ci-dessous pour ouvrir la salle dans un nouvel onglet.';
    }

    // ============================================
    // Chargement de l'iframe (desktop)
    // ============================================
    iframe.addEventListener('load', function () {
        // Masquer le chargement après 3 secondes si l'iframe est chargée
        setTimeout(function () {
            if (!chargement.hidden) {
                chargement.hidden = true;
            }
        }, 3000);
    });

    iframe.src = urlVisio;

    // ============================================
    // Fallback après 8 secondes : l'iframe est probablement bloquée
    // ============================================
    setTimeout(function () {
        if (!chargement.hidden) {
            // L'iframe ne charge pas, afficher le message d'aide
            aide.textContent = 'La salle met du temps à s\'afficher. Sur mobile, cela peut être dû aux restrictions de sécurité. Cliquez sur "Ouvrir la salle dans un nouvel onglet".';
        }
    }, 8000);

    // ============================================
    // Quitter
    // ============================================
    boutonQuitter.addEventListener('click', function () {
        window.location.href = '/patient/teleconsultation';
    });

    window.addEventListener('beforeunload', function () {
        iframe.src = 'about:blank';
    });
})();