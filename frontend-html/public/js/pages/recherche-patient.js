(function () {
    'use strict';

    var LONGUEUR_NPI = 10;
    var regexNpi = /^[0-9]{10}$/;

    var formulaire = document.getElementById('formulaire-recherche');
    var champNpi = document.getElementById('champ-npi');
    var bouton = document.getElementById('bouton-rechercher');
    var erreurNpi = document.getElementById('erreur-npi');
    var zoneErreur = document.getElementById('zone-erreur');
    var texteErreur = document.getElementById('texte-erreur');
    var zoneResultat = document.getElementById('zone-resultat');
    var zoneVide = document.getElementById('zone-vide');

    var roleUtilisateur = null;

    function formaterAge(dateNaissance) {
        if (!dateNaissance) return null;
        var naissance = new Date(dateNaissance);
        if (isNaN(naissance.getTime())) return null;
        var auj = new Date();
        var age = auj.getFullYear() - naissance.getFullYear();
        var m = auj.getMonth() - naissance.getMonth();
        if (m < 0 || (m === 0 && auj.getDate() < naissance.getDate())) age--;
        return age >= 0 ? age : null;
    }

    function formaterSexe(sexe) {
        if (sexe === 'M') return 'Masculin';
        if (sexe === 'F') return 'Feminin';
        return '';
    }

    function masquerNpi(npi) {
        if (!npi || npi.length < 4) return npi || '';
        var debut = npi.substring(0, 2);
        var fin = npi.substring(npi.length - 2);
        return debut + '******' + fin;
    }

    champNpi.addEventListener('input', function (ev) {
        var propre = String(ev.target.value).replace(/[^0-9]/g, '').slice(0, LONGUEUR_NPI);
        if (propre !== ev.target.value) ev.target.value = propre;
        erreurNpi.hidden = true;
        erreurNpi.textContent = '';
        champNpi.classList.remove('champ__input--erreur');
        zoneErreur.hidden = true;
    });

    function afficherErreur(message, surChamp) {
        if (surChamp) {
            erreurNpi.textContent = message;
            erreurNpi.hidden = false;
            champNpi.classList.add('champ__input--erreur');
        } else {
            texteErreur.textContent = message;
            zoneErreur.hidden = false;
        }
    }

    function effacerResultat() {
        zoneResultat.hidden = true;
        zoneVide.hidden = false;
    }

    async function chargerRole() {
        try {
            var rep = await window.ClientMCS.api.get('/api/auth/profil');
            if (rep.succes && rep.utilisateur) {
                roleUtilisateur = rep.utilisateur.role;
            }
        } catch {
            roleUtilisateur = 'medecin';
        }
    }

    function construireBadges(patient) {
        var badges = document.getElementById('resultat-badges');
        badges.innerHTML = '';

        if (patient.groupeSanguin) {
            var b1 = document.createElement('span');
            b1.className = 'badge badge--danger';
            b1.innerHTML = '<span class="badge__point"></span>Groupe ' + patient.groupeSanguin;
            badges.appendChild(b1);
        }
        if (patient.allergies) {
            var b2 = document.createElement('span');
            b2.className = 'badge badge--avertissement';
            b2.textContent = 'Allergies connues';
            badges.appendChild(b2);
        }
        if (patient.maladiesChroniques) {
            var b3 = document.createElement('span');
            b3.className = 'badge badge--info';
            b3.textContent = 'Maladies chroniques';
            badges.appendChild(b3);
        }
    }

    function afficherResultat(patient, consentement) {
        zoneVide.hidden = true;
        zoneResultat.hidden = false;

        // Affichage console pour diagnostiquer le probleme de consentement
        console.log('Patient recherche :', patient.npi);
        console.log('Consentement recu du serveur :', consentement);

        var consentementAccorde = consentement && consentement.autorise === true;
        var bandeau = document.getElementById('resultat-bandeau');
        bandeau.className = 'carte-patient__bandeau' + (consentementAccorde ? ' carte-patient__bandeau--succes' : '');

        var initiale = (patient.prenom || patient.nom || '?')[0].toUpperCase();
        document.getElementById('resultat-initiale').textContent = initiale;
        document.getElementById('resultat-nom').textContent = (patient.prenom || '') + ' ' + (patient.nom || '');
        document.getElementById('resultat-npi').textContent = 'NPI : ' + masquerNpi(patient.npi);

        var age = formaterAge(patient.dateNaissance);
        var lignes = [];
        if (age !== null) lignes.push(age + ' ans');
        if (patient.sexe) lignes.push(formaterSexe(patient.sexe));
        document.getElementById('resultat-age').textContent = lignes.join(' - ') || '-';

        document.getElementById('resultat-ville').textContent = patient.ville || '';

        construireBadges(patient);

        var consEl = document.getElementById('resultat-consentement');
        var consTitre = document.getElementById('resultat-consentement-titre');
        var consDesc = document.getElementById('resultat-consentement-desc');

        if (consentementAccorde) {
            consEl.className = 'carte-patient__consentement carte-patient__consentement--succes';
            consTitre.textContent = 'Acces autorise';
            consDesc.textContent = 'Le patient vous a autorise a consulter son dossier' +
                (consentement.type === 'general' ? ' (consentement general).' : ' (consentement specifique).');
        } else {
            consEl.className = 'carte-patient__consentement carte-patient__consentement--avertissement';
            consTitre.textContent = 'Consentement non accorde';
            consDesc.textContent = 'Ce patient ne vous a pas encore autorise a consulter son dossier. Demandez-lui d\'accorder l\'acces depuis son application mobile.';
        }

        var actions = document.getElementById('resultat-actions');
        actions.innerHTML = '';

        if (consentementAccorde) {
            var btnOuvrir = document.createElement('a');
            btnOuvrir.className = 'bouton bouton--primaire';
            if (roleUtilisateur === 'pharmacien') {
                btnOuvrir.href = '/pharmacie?npi=' + patient.npi;
            } else {
                btnOuvrir.href = '/dossier/' + patient.npi;
            }
            btnOuvrir.textContent = 'Ouvrir le dossier';
            actions.appendChild(btnOuvrir);
        } else {
            var btnUrgence = document.createElement('a');
            btnUrgence.className = 'bouton bouton--danger';
            btnUrgence.href = '/urgence?npi=' + patient.npi;
            btnUrgence.textContent = 'Acces urgence (dernier recours)';
            actions.appendChild(btnUrgence);
        }
    }

    formulaire.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        zoneErreur.hidden = true;
        erreurNpi.hidden = true;
        champNpi.classList.remove('champ__input--erreur');

        if (!regexNpi.test(champNpi.value)) {
            afficherErreur('Le NPI doit contenir exactement 10 chiffres.', true);
            return;
        }

        bouton.disabled = true;
        bouton.textContent = 'Recherche...';

        try {
            var url = roleUtilisateur === 'pharmacien'
                ? '/api/pharmacie/patient/' + champNpi.value
                : '/api/medecin/patient/' + champNpi.value;

            var rep = await window.ClientMCS.api.get(url);

            if (!rep.succes || !rep.patient) {
                throw new Error(rep.message || 'Patient introuvable.');
            }

            afficherResultat(rep.patient, rep.consentement || null);
        } catch (err) {
            effacerResultat();
            afficherErreur(err.message || 'Impossible d\'effectuer la recherche.', false);
        } finally {
            bouton.disabled = false;
            bouton.textContent = 'Rechercher le patient';
        }
    });

    async function initialiser() {
        await chargerRole();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiser);
    } else {
        initialiser();
    }
})();