(function () {
    'use strict';

    var LONGUEUR_NPI = 10;
    var LONGUEUR_MIN_MDP = 8;
    var regexNpi = /^[0-9]{10}$/;
    var regexTelephone = /^(\+229)?01[0-9]{8}$/;
    var regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var formulaire = document.getElementById('formulaire-inscription');
    var bouton = document.getElementById('bouton-inscription');
    var zoneErreur = document.getElementById('zone-erreur');
    var texteErreur = document.getElementById('texte-erreur');
    var zoneSucces = document.getElementById('zone-succes');
    var texteSucces = document.getElementById('texte-succes');

    var champNpi = document.getElementById('champ-npi');
    var champNom = document.getElementById('champ-nom');
    var champPrenom = document.getElementById('champ-prenom');
    var champType = document.getElementById('champ-type');
    var champSpecialite = document.getElementById('champ-specialite');
    var champEtablissement = document.getElementById('champ-etablissement');
    var champOrdre = document.getElementById('champ-ordre');
    var champTelephone = document.getElementById('champ-telephone');
    var champEmail = document.getElementById('champ-email');
    var champMdp = document.getElementById('champ-mdp');
    var champConfirmation = document.getElementById('champ-confirmation');
    var champConditions = document.getElementById('champ-conditions');

    var erreurNpi = document.getElementById('erreur-npi');
    var erreurNom = document.getElementById('erreur-nom');
    var erreurPrenom = document.getElementById('erreur-prenom');
    var erreurType = document.getElementById('erreur-type');
    var erreurSpecialite = document.getElementById('erreur-specialite');
    var erreurEtablissement = document.getElementById('erreur-etablissement');
    var erreurTelephone = document.getElementById('erreur-telephone');
    var erreurEmail = document.getElementById('erreur-email');
    var erreurMdp = document.getElementById('erreur-mdp');
    var erreurConfirmation = document.getElementById('erreur-confirmation');
    var erreurConditions = document.getElementById('erreur-conditions');

    var mdpVisible = false;
    var confVisible = false;

    function initialiserBasculeMdp(boutonId, champ, iconeOuvertId, iconeFermeId, etatRef, libelleAfficher, libelleMasquer) {
        var boutonBascule = document.getElementById(boutonId);
        var iconeOuvert = document.getElementById(iconeOuvertId);
        var iconeFerme = document.getElementById(iconeFermeId);

        boutonBascule.addEventListener('click', function () {
            if (etatRef.nom === 'mdp') {
                mdpVisible = !mdpVisible;
                champ.type = mdpVisible ? 'text' : 'password';
                basculerIcones(mdpVisible);
            } else {
                confVisible = !confVisible;
                champ.type = confVisible ? 'text' : 'password';
                basculerIcones(confVisible);
            }
            function basculerIcones(visible) {
                if (visible) {
                    iconeOuvert.setAttribute('hidden', '');
                    iconeFerme.removeAttribute('hidden');
                    boutonBascule.setAttribute('aria-label', libelleMasquer);
                } else {
                    iconeFerme.setAttribute('hidden', '');
                    iconeOuvert.removeAttribute('hidden');
                    boutonBascule.setAttribute('aria-label', libelleAfficher);
                }
            }
        });
    }

    initialiserBasculeMdp('bouton-afficher-mdp', champMdp, 'icone-oeil-ouvert', 'icone-oeil-ferme', { nom: 'mdp' }, 'Afficher le mot de passe', 'Masquer le mot de passe');
    initialiserBasculeMdp('bouton-afficher-confirmation', champConfirmation, 'icone-conf-ouvert', 'icone-conf-ferme', { nom: 'conf' }, 'Afficher la confirmation', 'Masquer la confirmation');

    champNpi.addEventListener('input', function (ev) {
        var propre = String(ev.target.value).replace(/[^0-9]/g, '').slice(0, LONGUEUR_NPI);
        if (propre !== ev.target.value) ev.target.value = propre;
        effacerErreurChamp(erreurNpi, champNpi);
    });

    champTelephone.addEventListener('input', function (ev) {
        var propre = String(ev.target.value).replace(/[^0-9+]/g, '').slice(0, 13);
        if (propre !== ev.target.value) ev.target.value = propre;
        effacerErreurChamp(erreurTelephone, champTelephone);
    });

    [champNom, champPrenom, champType, champSpecialite, champEtablissement, champEmail, champMdp, champConfirmation]
        .forEach(function (champ) {
            champ.addEventListener('input', function () {
                var map = {
                    'champ-nom': [erreurNom, champNom],
                    'champ-prenom': [erreurPrenom, champPrenom],
                    'champ-type': [erreurType, champType],
                    'champ-specialite': [erreurSpecialite, champSpecialite],
                    'champ-etablissement': [erreurEtablissement, champEtablissement],
                    'champ-email': [erreurEmail, champEmail],
                    'champ-mdp': [erreurMdp, champMdp],
                    'champ-confirmation': [erreurConfirmation, champConfirmation]
                };
                var paire = map[champ.id];
                if (paire) effacerErreurChamp(paire[0], paire[1]);
            });
        });

    champType.addEventListener('change', function () {
        effacerErreurChamp(erreurType, champType);
    });

    champConditions.addEventListener('change', function () {
        erreurConditions.hidden = true;
        erreurConditions.textContent = '';
    });

    function effacerErreurChamp(el, champ) {
        if (el) {
            el.hidden = true;
            el.textContent = '';
        }
        if (champ) champ.classList.remove('champ__input--erreur');
    }

    function afficherErreurChamp(el, champ, message) {
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
        if (champ) champ.classList.add('champ__input--erreur');
    }

    function afficherErreurGenerale(message) {
        texteErreur.textContent = message;
        zoneErreur.hidden = false;
        zoneSucces.hidden = true;
    }

    function afficherSucces(message) {
        texteSucces.textContent = message;
        zoneSucces.hidden = false;
        zoneErreur.hidden = true;
    }

    function validerMotDePasse(mdp) {
        if (!mdp) return 'Le mot de passe est obligatoire.';
        if (mdp.length < LONGUEUR_MIN_MDP) return 'Le mot de passe doit contenir au moins ' + LONGUEUR_MIN_MDP + ' caracteres.';
        if (!/[A-Z]/.test(mdp)) return 'Le mot de passe doit contenir au moins une majuscule.';
        if (!/[0-9]/.test(mdp)) return 'Le mot de passe doit contenir au moins un chiffre.';
        return null;
    }

    function valider() {
        var valide = true;

        if (!regexNpi.test(champNpi.value)) {
            afficherErreurChamp(erreurNpi, champNpi, 'Le NPI doit contenir exactement 10 chiffres.');
            valide = false;
        }
        if (!champNom.value.trim()) {
            afficherErreurChamp(erreurNom, champNom, 'Le nom est obligatoire.');
            valide = false;
        }
        if (!champPrenom.value.trim()) {
            afficherErreurChamp(erreurPrenom, champPrenom, 'Le prenom est obligatoire.');
            valide = false;
        }
        if (!champType.value) {
            afficherErreurChamp(erreurType, champType, 'Selectionnez un type de professionnel.');
            valide = false;
        }
        if (!champSpecialite.value.trim()) {
            afficherErreurChamp(erreurSpecialite, champSpecialite, 'La specialite est obligatoire.');
            valide = false;
        }
        if (!champEtablissement.value.trim()) {
            afficherErreurChamp(erreurEtablissement, champEtablissement, 'L\'etablissement est obligatoire.');
            valide = false;
        }
        if (!regexTelephone.test(champTelephone.value.replace(/\s/g, ''))) {
            afficherErreurChamp(erreurTelephone, champTelephone, 'Numero invalide. Format : 01XXXXXXXX ou +22901XXXXXXXX.');
            valide = false;
        }
        if (champEmail.value.trim() && !regexEmail.test(champEmail.value.trim())) {
            afficherErreurChamp(erreurEmail, champEmail, 'Adresse email invalide.');
            valide = false;
        }
        var erreurMdpMsg = validerMotDePasse(champMdp.value);
        if (erreurMdpMsg) {
            afficherErreurChamp(erreurMdp, champMdp, erreurMdpMsg);
            valide = false;
        }
        if (champMdp.value !== champConfirmation.value) {
            afficherErreurChamp(erreurConfirmation, champConfirmation, 'Les mots de passe ne correspondent pas.');
            valide = false;
        }
        if (!champConditions.checked) {
            erreurConditions.textContent = 'Vous devez accepter les conditions d\'utilisation.';
            erreurConditions.hidden = false;
            valide = false;
        }
        return valide;
    }

    function nettoyerErreurs() {
        [
            [erreurNpi, champNpi], [erreurNom, champNom], [erreurPrenom, champPrenom],
            [erreurType, champType], [erreurSpecialite, champSpecialite],
            [erreurEtablissement, champEtablissement], [erreurTelephone, champTelephone],
            [erreurEmail, champEmail], [erreurMdp, champMdp], [erreurConfirmation, champConfirmation]
        ].forEach(function (paire) {
            effacerErreurChamp(paire[0], paire[1]);
        });
        erreurConditions.hidden = true;
        erreurConditions.textContent = '';
        zoneErreur.hidden = true;
    }

    formulaire.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        nettoyerErreurs();

        if (!valider()) return;

        bouton.disabled = true;
        bouton.textContent = 'Creation en cours...';

        var donnees = {
            npiProfessionnel: champNpi.value,
            nom: champNom.value.trim(),
            prenom: champPrenom.value.trim(),
            typeProfessionnel: champType.value,
            specialite: champSpecialite.value.trim(),
            etablissementNom: champEtablissement.value.trim(),
            numeroOrdre: champOrdre.value.trim() || undefined,
            telephone: champTelephone.value,
            email: champEmail.value.trim() || undefined,
            motDePasse: champMdp.value
        };

        try {
            var reponse = await window.ClientMCS.api.post('/api/auth/professionnel/inscription', donnees);

            if (!reponse.succes) {
                throw new Error(reponse.message || 'Inscription refusee.');
            }

            afficherSucces('Votre compte a ete cree. Redirection vers la connexion...');
            bouton.textContent = 'Compte cree';

            setTimeout(function () {
                window.location.href = '/connexion';
            }, 2500);
        } catch (erreur) {
            afficherErreurGenerale(erreur.message || 'Impossible de creer le compte.');
            bouton.disabled = false;
            bouton.textContent = 'Creer mon compte';
        }
    });
})();