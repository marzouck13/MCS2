(function () {
    'use strict';

    var GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var REGEX_TEL = /^(\+229)?01[0-9]{8}$/;

    // DOM
    var elChargement = document.getElementById('chargement');
    var elContenu = document.getElementById('contenu-profil');
    var modeLecture = document.getElementById('mode-lecture');
    var modeEdition = document.getElementById('mode-edition');
    var boutonModifier = document.getElementById('bouton-modifier');
    var boutonAnnuler = document.getElementById('bouton-annuler');
    var boutonEnregistrer = document.getElementById('bouton-enregistrer');
    var boutonDeconnexion = document.getElementById('bouton-deconnexion');

    var erreurEdition = document.getElementById('erreur-edition');
    var texteErreurEdition = document.getElementById('texte-erreur-edition');
    var erreurEmail = document.getElementById('erreur-email');
    var erreurContactTel = document.getElementById('erreur-contact-tel');

    var champEmail = document.getElementById('champ-email');
    var champAdresse = document.getElementById('champ-adresse');
    var champVille = document.getElementById('champ-ville');
    var champAllergies = document.getElementById('champ-allergies');
    var champMaladies = document.getElementById('champ-maladies');
    var champContactNom = document.getElementById('champ-contact-nom');
    var champContactTel = document.getElementById('champ-contact-tel');
    var grilleGroupes = document.getElementById('grille-groupes');

    var profilActuel = null;
    var groupeSelectionne = '';

    // ============================================
    // Utilitaires
    // ============================================
    function masquerNpi(npi) {
        if (!npi || npi.length < 4) return npi || '';
        return npi.substring(0, 2) + '******' + npi.substring(npi.length - 2);
    }

    function calculerAge(dateNaissance) {
        if (!dateNaissance) return null;
        var n = new Date(dateNaissance);
        if (isNaN(n.getTime())) return null;
        var auj = new Date();
        var age = auj.getFullYear() - n.getFullYear();
        var m = auj.getMonth() - n.getMonth();
        if (m < 0 || (m === 0 && auj.getDate() < n.getDate())) age--;
        return age >= 0 ? age : null;
    }

    function formaterDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return String(d.getDate()).padStart(2, '0') + '/' +
               String(d.getMonth() + 1).padStart(2, '0') + '/' +
               d.getFullYear();
    }

    function formaterSexe(sexe) {
        if (sexe === 'M') return 'Masculin';
        if (sexe === 'F') return 'Féminin';
        return '';
    }

    function afficherValeur(idElement, valeur, fallbackVide) {
        var el = document.getElementById(idElement);
        if (!el) return;
        var texte = valeur || fallbackVide || 'Non renseigné';
        el.textContent = texte;
        if (!valeur) {
            el.classList.add('valeur-vide');
        } else {
            el.classList.remove('valeur-vide');
        }
    }

    // ============================================
    // Carte identité
    // ============================================
    function rendreIdentite(p) {
        var initiale = (p.prenom || p.nom || '?').charAt(0).toUpperCase();
        document.getElementById('identite-initiale').textContent = initiale;
        document.getElementById('identite-nom').textContent =
            ((p.prenom || '') + ' ' + (p.nom || '')).trim();
        document.getElementById('identite-npi').textContent = masquerNpi(p.npi);

        var age = calculerAge(p.dateNaissance);
        var ageParties = [];
        if (age !== null) ageParties.push(age + ' ans');
        if (p.sexe) ageParties.push(formaterSexe(p.sexe));
        document.getElementById('identite-age-sexe').textContent =
            ageParties.join(' • ') || 'Informations non renseignées';

        if (p.dateNaissance) {
            document.getElementById('identite-date-naissance').textContent =
                'Né(e) le ' + formaterDate(p.dateNaissance);
        } else {
            document.getElementById('identite-date-naissance').textContent = '';
        }
    }

    // ============================================
    // Mode lecture
    // ============================================
    function rendreLecture(p) {
        afficherValeur('lecture-email', p.email, 'Non renseigné');

        var adresseComplete = '';
        if (p.adresse && p.ville) adresseComplete = p.adresse + ', ' + p.ville;
        else if (p.adresse) adresseComplete = p.adresse;
        else if (p.ville) adresseComplete = p.ville;
        afficherValeur('lecture-adresse', adresseComplete, 'Non renseigné');

        afficherValeur('lecture-groupe',
            p.groupeSanguin ? 'Groupe sanguin : ' + p.groupeSanguin : null,
            'Non renseigné');
        afficherValeur('lecture-allergies',
            p.allergies ? 'Allergies : ' + p.allergies : null,
            'Aucune allergie connue');
        afficherValeur('lecture-maladies',
            p.maladiesChroniques ? 'Maladies chroniques : ' + p.maladiesChroniques : null,
            'Aucune maladie chronique connue');

        var contact = '';
        if (p.contactUrgenceNom || p.contactUrgenceTelephone) {
            contact = (p.contactUrgenceNom || '') + (p.contactUrgenceTelephone ? ' — ' + p.contactUrgenceTelephone : '');
        }
        afficherValeur('lecture-contact-urgence', contact, 'Non renseigné');

        // Alerte santé si toutes les infos médicales sont vides
        var alerte = document.getElementById('alerte-sante');
        var aSante = p.groupeSanguin || p.allergies || p.maladiesChroniques ||
                     p.contactUrgenceNom || p.contactUrgenceTelephone;
        alerte.hidden = !!aSante;
    }

    // ============================================
    // Mode édition
    // ============================================
    function rendreEdition(p) {
        champEmail.value = p.email || '';
        champAdresse.value = p.adresse || '';
        champVille.value = p.ville || '';
        champAllergies.value = p.allergies || '';
        champMaladies.value = p.maladiesChroniques || '';
        champContactNom.value = p.contactUrgenceNom || '';
        champContactTel.value = p.contactUrgenceTelephone || '';

        groupeSelectionne = p.groupeSanguin || '';
        construireGrilleGroupes();

        // Nettoyer les erreurs
        erreurEdition.hidden = true;
        erreurEmail.hidden = true;
        erreurContactTel.hidden = true;
        champEmail.classList.remove('champ__input--erreur');
        champContactTel.classList.remove('champ__input--erreur');
    }

    function construireGrilleGroupes() {
        grilleGroupes.innerHTML = '';
        GROUPES_SANGUINS.forEach(function (g) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'patient-profil__bouton-groupe';
            if (g === groupeSelectionne) {
                btn.classList.add('patient-profil__bouton-groupe--actif');
            }
            btn.textContent = g;
            btn.addEventListener('click', function () {
                var dejaActif = btn.classList.contains('patient-profil__bouton-groupe--actif');
                grilleGroupes.querySelectorAll('.patient-profil__bouton-groupe').forEach(function (b) {
                    b.classList.remove('patient-profil__bouton-groupe--actif');
                });
                if (!dejaActif) {
                    btn.classList.add('patient-profil__bouton-groupe--actif');
                    groupeSelectionne = g;
                } else {
                    groupeSelectionne = '';
                }
            });
            grilleGroupes.appendChild(btn);
        });
    }

    // ============================================
    // Bascule lecture / édition
    // ============================================
    function basculerVersEdition() {
        if (!profilActuel) return;
        rendreEdition(profilActuel);
        modeLecture.hidden = true;
        modeEdition.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function basculerVersLecture() {
        modeEdition.hidden = true;
        modeLecture.hidden = false;
    }

    // ============================================
    // Enregistrement
    // ============================================
    async function enregistrer() {
        erreurEdition.hidden = true;
        erreurEmail.hidden = true;
        erreurContactTel.hidden = true;
        champEmail.classList.remove('champ__input--erreur');
        champContactTel.classList.remove('champ__input--erreur');

        var email = champEmail.value.trim();
        var contactTel = champContactTel.value.trim();
        var valide = true;

        if (email && !REGEX_EMAIL.test(email)) {
            erreurEmail.textContent = 'Adresse email invalide.';
            erreurEmail.hidden = false;
            champEmail.classList.add('champ__input--erreur');
            valide = false;
        }

        if (contactTel && !REGEX_TEL.test(contactTel)) {
            erreurContactTel.textContent = 'Format attendu : 01XXXXXXXX.';
            erreurContactTel.hidden = false;
            champContactTel.classList.add('champ__input--erreur');
            valide = false;
        }

        if (!valide) return;

        var donnees = {
            email: email || null,
            adresse: champAdresse.value.trim() || null,
            ville: champVille.value.trim() || null,
            groupeSanguin: groupeSelectionne || null,
            allergies: champAllergies.value.trim() || null,
            maladiesChroniques: champMaladies.value.trim() || null,
            contactUrgenceNom: champContactNom.value.trim() || null,
            contactUrgenceTelephone: contactTel || null
        };

        boutonEnregistrer.disabled = true;
        boutonEnregistrer.textContent = 'Enregistrement...';

        try {
            var rep = await window.ClientMCS.api.put('/api/patient/profil', donnees);
            if (!rep.succes) {
                throw new Error(rep.message || 'Impossible de mettre à jour le profil.');
            }

            // Recharger le profil pour être synchronisé avec le serveur
            await chargerProfil();
            basculerVersLecture();
            window.Alertes.succes('Profil mis à jour avec succès.');
        } catch (err) {
            texteErreurEdition.textContent = err.message || 'Erreur lors de la mise à jour.';
            erreurEdition.hidden = false;
        } finally {
            boutonEnregistrer.disabled = false;
            boutonEnregistrer.textContent = 'Enregistrer les modifications';
        }
    }

    // ============================================
    // Chargement initial
    // ============================================
    async function chargerProfil() {
        try {
            var rep = await window.ClientMCS.api.get('/api/auth/profil');
            if (!rep.succes || !rep.utilisateur) {
                throw new Error('Profil introuvable.');
            }

            profilActuel = rep.utilisateur;
            rendreIdentite(profilActuel);
            rendreLecture(profilActuel);

            elChargement.hidden = true;
            elContenu.hidden = false;
        } catch (err) {
            elChargement.textContent = 'Erreur : ' + (err.message || 'Impossible de charger le profil.');
            elChargement.className = 'message message--erreur';
        }
    }

    // ============================================
    // Déconnexion
    // ============================================
    async function deconnecter() {
        if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
        try {
            await window.ClientMCS.fermerSession();
        } finally {
            window.location.href = '/patient/connexion';
        }
    }

    // ============================================
    // Événements
    // ============================================
    boutonModifier.addEventListener('click', basculerVersEdition);
    boutonAnnuler.addEventListener('click', basculerVersLecture);
    boutonEnregistrer.addEventListener('click', enregistrer);
    boutonDeconnexion.addEventListener('click', deconnecter);

    champEmail.addEventListener('input', function () {
        erreurEmail.hidden = true;
        champEmail.classList.remove('champ__input--erreur');
    });

    champContactTel.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9+]/g, '').slice(0, 13);
        erreurContactTel.hidden = true;
        champContactTel.classList.remove('champ__input--erreur');
    });

    // ============================================
    // Démarrage
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerProfil);
    } else {
        chargerProfil();
    }
})();