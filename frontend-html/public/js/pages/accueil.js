(function () {
    'use strict';

    // ============================================
    // 1. Smooth scroll sur liens d'ancrage
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(function (ancre) {
        ancre.addEventListener('click', function (ev) {
            var cibleId = this.getAttribute('href');
            if (cibleId === '#' || cibleId === '') return;

            var cible = document.querySelector(cibleId);
            if (!cible) return;

            ev.preventDefault();

            window.scrollTo({
                top: cible.offsetTop - 80,
                behavior: 'smooth'
            });
        });
    });

    // ============================================
    // 2. Animation reveal au scroll
    // ============================================
    var observateur = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
            if (entree.isIntersecting) {
                entree.target.classList.add('visible');
                observateur.unobserve(entree.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(function (element) {
        observateur.observe(element);
    });

    // ============================================
    // 3. Formulaire de contact (mailto)
    // ============================================
    var formulaireContact = document.getElementById('formulaire-contact');
    if (formulaireContact) {
        formulaireContact.addEventListener('submit', function (ev) {
            ev.preventDefault();

            var nom = document.getElementById('contact-nom').value.trim();
            var email = document.getElementById('contact-email').value.trim();
            var sujet = document.getElementById('contact-sujet').value.trim();
            var message = document.getElementById('contact-message').value.trim();

            var corps = 'Nom : ' + nom + '\n'
                + 'Email : ' + email + '\n\n'
                + message;

            var lienMail = 'mailto:contact@moncarnetsante.bj'
                + '?subject=' + encodeURIComponent(sujet)
                + '&body=' + encodeURIComponent(corps);

            window.location.href = lienMail;
        });
    }

    // ============================================
    // 4. Menu burger mobile
    // ============================================
    var burger = document.getElementById('accueil-burger');
    var overlay = document.getElementById('accueil-menu-overlay');
    var panneau = document.getElementById('accueil-menu-mobile');
    var boutonFermer = document.getElementById('accueil-menu-fermer');

    var menuOuvert = false;

    function ouvrirMenu() {
        if (menuOuvert) return;
        menuOuvert = true;

        overlay.hidden = false;
        // Forcer le reflow pour que la transition d'opacité se déclenche
        void overlay.offsetWidth;

        overlay.classList.add('accueil-menu-overlay--visible');
        panneau.classList.add('accueil-menu-mobile--ouvert');
        panneau.setAttribute('aria-hidden', 'false');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function fermerMenu() {
        if (!menuOuvert) return;
        menuOuvert = false;

        overlay.classList.remove('accueil-menu-overlay--visible');
        panneau.classList.remove('accueil-menu-mobile--ouvert');
        panneau.setAttribute('aria-hidden', 'true');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';

        // Attendre la fin de la transition avant de cacher l'overlay
        setTimeout(function () {
            if (!menuOuvert) {
                overlay.hidden = true;
            }
        }, 250);
    }

    if (burger) {
        burger.addEventListener('click', ouvrirMenu);
    }

    if (boutonFermer) {
        boutonFermer.addEventListener('click', fermerMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', fermerMenu);
    }

    // Fermer au clic sur un lien du menu
    if (panneau) {
        panneau.querySelectorAll('.accueil-menu-mobile__lien, .accueil-menu-mobile__actions a').forEach(function (lien) {
            lien.addEventListener('click', function () {
                fermerMenu();
            });
        });
    }

    // Fermer avec la touche Echap
    document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && menuOuvert) {
            fermerMenu();
        }
    });

    // Fermer automatiquement si on repasse sur desktop
    var mediaQuery = window.matchMedia('(min-width: 768px)');
    function gererChangementMedia(e) {
        if (e.matches && menuOuvert) {
            fermerMenu();
        }
    }

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', gererChangementMedia);
    } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(gererChangementMedia);
    }

    // Fermer si la page est masquée (changement d'onglet, etc.)
    document.addEventListener('visibilitychange', function () {
        if (document.hidden && menuOuvert) {
            fermerMenu();
        }
    });
})();