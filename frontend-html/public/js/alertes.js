(function (global) {
    'use strict';

    var icones = {
        erreur: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        succes: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        avertissement: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17.01"></line></svg>',
        info: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    var titresParDefaut = {
        erreur: 'Erreur',
        succes: 'Succes',
        avertissement: 'Attention',
        info: 'Information'
    };

    var overlay = null;
    var callbackEnCours = null;

    function creerStructure() {
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.className = 'alerte-overlay';
        overlay.hidden = true;
        overlay.innerHTML = 
            '<div class="alerte" role="dialog" aria-modal="true">' +
                '<div class="alerte__icone" id="alerte-icone"></div>' +
                '<h2 class="alerte__titre" id="alerte-titre"></h2>' +
                '<p class="alerte__message" id="alerte-message"></p>' +
                '<div class="alerte__actions">' +
                    '<button type="button" class="bouton bouton--primaire" id="alerte-bouton">OK</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        overlay.querySelector('#alerte-bouton').addEventListener('click', fermer);
        overlay.addEventListener('click', function (ev) {
            if (ev.target === overlay) fermer();
        });

        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape' && overlay && !overlay.hidden) fermer();
        });

        return overlay;
    }

    function fermer() {
        if (!overlay) return;
        overlay.hidden = true;
        if (typeof callbackEnCours === 'function') {
            var cb = callbackEnCours;
            callbackEnCours = null;
            cb();
        }
    }

    function afficher(options) {
        var opts = options || {};
        var type = opts.type || 'info';
        var titre = opts.titre || titresParDefaut[type];
        var message = opts.message || '';
        callbackEnCours = opts.onFermer || null;

        creerStructure();

        var conteneur = overlay.querySelector('.alerte');
        conteneur.className = 'alerte alerte--' + type;

        overlay.querySelector('#alerte-icone').innerHTML = icones[type] || icones.info;
        overlay.querySelector('#alerte-titre').textContent = titre;
        overlay.querySelector('#alerte-message').textContent = message;
        overlay.querySelector('#alerte-bouton').textContent = opts.texteBouton || 'OK';

        overlay.hidden = false;
    }

    global.Alertes = {
        afficher: afficher,
        erreur: function (message, titre) {
            afficher({ type: 'erreur', message: message, titre: titre });
        },
        succes: function (message, titre) {
            afficher({ type: 'succes', message: message, titre: titre });
        },
        avertissement: function (message, titre) {
            afficher({ type: 'avertissement', message: message, titre: titre });
        },
        info: function (message, titre) {
            afficher({ type: 'info', message: message, titre: titre });
        },
        fermer: fermer
    };
})(window);