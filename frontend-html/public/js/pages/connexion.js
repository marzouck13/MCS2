(function () {
    'use strict';

    var LONGUEUR_NPI = 10;
    var regexNpi = /^[0-9]{10}$/;

    var formulaire = document.getElementById('formulaire-connexion');
    var champNpi = document.getElementById('champ-npi');
    var champMdp = document.getElementById('champ-mdp');
    var bouton = document.getElementById('bouton-connexion');
    var zoneErreur = document.getElementById('zone-erreur');
    var texteErreur = document.getElementById('texte-erreur');
    var erreurNpi = document.getElementById('erreur-npi');
    var erreurMdp = document.getElementById('erreur-mdp');

    var boutonAfficherMdp = document.getElementById('bouton-afficher-mdp');
    var iconeOeilOuvert = document.getElementById('icone-oeil-ouvert');
    var iconeOeilFerme = document.getElementById('icone-oeil-ferme');
    var mdpVisible = false;

    champNpi.addEventListener('input', function (evenement) {
        var propre = String(evenement.target.value).replace(/[^0-9]/g, '').slice(0, LONGUEUR_NPI);
        if (propre !== evenement.target.value) {
            evenement.target.value = propre;
        }
        effacerErreur(erreurNpi);
        champNpi.classList.remove('champ__input--erreur');
    });

    champMdp.addEventListener('input', function () {
        effacerErreur(erreurMdp);
        champMdp.classList.remove('champ__input--erreur');
    });

    boutonAfficherMdp.addEventListener('click', function () {
        mdpVisible = !mdpVisible;
        champMdp.type = mdpVisible ? 'text' : 'password';
        
        if (mdpVisible) {
            iconeOeilOuvert.setAttribute('hidden', '');
            iconeOeilFerme.removeAttribute('hidden');
            boutonAfficherMdp.setAttribute('aria-label', 'Masquer le mot de passe');
        } else {
            iconeOeilFerme.setAttribute('hidden', '');
            iconeOeilOuvert.removeAttribute('hidden');
            boutonAfficherMdp.setAttribute('aria-label', 'Afficher le mot de passe');
        }
    });

    function effacerErreur(el) {
        if (!el) return;
        el.hidden = true;
        el.textContent = '';
    }

    function afficherErreur(el, champ, message) {
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
        if (champ) champ.classList.add('champ__input--erreur');
    }

    function afficherErreurGenerale(message) {
        texteErreur.textContent = message;
        zoneErreur.hidden = false;
    }

    function cacherErreurGenerale() {
        zoneErreur.hidden = true;
    }

    function valider() {
        var valide = true;

        if (!regexNpi.test(champNpi.value)) {
            afficherErreur(erreurNpi, champNpi, 'Le NPI doit contenir exactement 10 chiffres.');
            valide = false;
        }
        if (!champMdp.value) {
            afficherErreur(erreurMdp, champMdp, 'Le mot de passe est obligatoire.');
            valide = false;
        }
        return valide;
    }

    formulaire.addEventListener('submit', async function (evenement) {
        evenement.preventDefault();
        cacherErreurGenerale();
        effacerErreur(erreurNpi);
        effacerErreur(erreurMdp);
        champNpi.classList.remove('champ__input--erreur');
        champMdp.classList.remove('champ__input--erreur');

        if (!valider()) return;

        bouton.disabled = true;
        bouton.textContent = 'Connexion...';

        try {
            var reponse = await window.ClientMCS.ouvrirSession(champNpi.value, champMdp.value);

            if (!reponse.succes || !reponse.utilisateur) {
                throw new Error(reponse.message || 'Connexion refusee.');
            }

            var destination = reponse.utilisateur.role === 'pharmacien'
                ? '/pharmacie'
                : '/tableau-bord';

            window.location.href = destination;
        } catch (erreur) {
            afficherErreurGenerale(erreur.message || 'Impossible de vous connecter.');
            bouton.disabled = false;
            bouton.textContent = 'Se connecter';
        }
    });
})();