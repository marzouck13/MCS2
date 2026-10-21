(function () {
    'use strict';

    var cheminActuel = window.location.pathname;

    async function initialiserLayout() {
        try {
            var conteneur = document.getElementById('conteneur-sidebar');
            if (!conteneur) return;

            var reponseHtml = await fetch('/partials/sidebar.html');
            var html = await reponseHtml.text();
            conteneur.innerHTML = html;

            var profil = await window.ClientMCS.api.get('/api/auth/profil');
            if (!profil.succes || !profil.utilisateur) {
                throw new Error('Profil introuvable.');
            }

            var utilisateur = profil.utilisateur;
            configurerNavigation(utilisateur.role);
            mettreAJourProfil(utilisateur);
            configurerEvenements();

        } catch (erreur) {
            console.error('Erreur initialisation layout :', erreur.message);
        }
    }

    function configurerNavigation(role) {
        var liens = document.querySelectorAll('.sidebar__lien');
        
        liens.forEach(function (lien) {
            var rolesAutorises = lien.getAttribute('data-roles').split(',');
            
            if (!rolesAutorises.includes(role)) {
                lien.remove();
                return;
            }

            var lienPath = lien.getAttribute('href');
            if (cheminActuel === lienPath || cheminActuel.startsWith(lienPath + '/')) {
                lien.classList.add('sidebar__lien--actif');
            }
        });
    }

    function mettreAJourProfil(utilisateur) {
        var elNom = document.getElementById('sidebar-nom');
        var elSpecialite = document.getElementById('sidebar-specialite');

        if (elNom) {
            elNom.textContent = (utilisateur.prenom || '') + ' ' + (utilisateur.nom || '');
        }
        if (elSpecialite) {
            elSpecialite.textContent = utilisateur.specialite || utilisateur.role || '';
        }
    }

    function configurerEvenements() {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.getElementById('sidebar-overlay');
        var boutonFermer = document.getElementById('sidebar-fermer');
        var boutonDeconnexion = document.getElementById('sidebar-deconnexion');

        var boutonMenuMobile = document.getElementById('bouton-menu-mobile');
        if (boutonMenuMobile) {
            boutonMenuMobile.addEventListener('click', ouvrirMenu);
        }

        if (boutonFermer) boutonFermer.addEventListener('click', fermerMenu);
        if (overlay) overlay.addEventListener('click', fermerMenu);

        if (boutonDeconnexion) {
            boutonDeconnexion.addEventListener('click', async function () {
                try {
                    await window.ClientMCS.fermerSession();
                } finally {
                    window.location.href = '/connexion';
                }
            });
        }

        function ouvrirMenu() {
            if (sidebar) sidebar.classList.add('sidebar--ouvert');
            if (overlay) overlay.classList.add('sidebar-overlay--visible');
            document.body.style.overflow = 'hidden';
        }

        function fermerMenu() {
            if (sidebar) sidebar.classList.remove('sidebar--ouvert');
            if (overlay) overlay.classList.remove('sidebar-overlay--visible');
            document.body.style.overflow = '';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiserLayout);
    } else {
        initialiserLayout();
    }
})();