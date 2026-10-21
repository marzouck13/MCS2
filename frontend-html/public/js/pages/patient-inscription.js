(function () {
    'use strict';

    var LONGUEUR_NPI = 10;
    var GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    var regexNpi = /^[0-9]{10}$/;
    var regexTel = /^(\+229)?01[0-9]{8}$/;
    var regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var champNpi = document.getElementById('champ-npi');
    var erreurNpi = document.getElementById('erreur-npi');
    var actionsNpi = document.getElementById('actions-npi');
    var boutonVerifierNpi = document.getElementById('bouton-verifier-npi');
    var badgeVerifie = document.getElementById('badge-verifie');
    var infosAnip = document.getElementById('infos-anip');
    var formulaire = document.getElementById('formulaire-inscription');
    var boutonInscription = document.getElementById('bouton-inscription');
    var zoneErreur = document.getElementById('zone-erreur');
    var texteErreur = document.getElementById('texte-erreur');
    var zoneSucces = document.getElementById('zone-succes');
    var texteSucces = document.getElementById('texte-succes');

    var npiVerifie = false;
    var sexeSelectionne = '';
    var groupeSelectionne = '';

    // Remplir la grille des groupes sanguins
    var grilleGroupes = document.getElementById('grille-groupes-sanguins');
    GROUPES_SANGUINS.forEach(function (g) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bouton-groupe';
        btn.textContent = g;
        btn.addEventListener('click', function () {
            var dejaActif = btn.classList.contains('bouton-groupe--actif');
            grilleGroupes.querySelectorAll('.bouton-groupe').forEach(function (b) {
                b.classList.remove('bouton-groupe--actif');
            });
            if (!dejaActif) {
                btn.classList.add('bouton-groupe--actif');
                groupeSelectionne = g;
            } else {
                groupeSelectionne = '';
            }
        });
        grilleGroupes.appendChild(btn);
    });

    // Toggle sexe
    document.querySelectorAll('.bouton-sexe').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.bouton-sexe').forEach(function (b) {
                b.classList.remove('bouton-sexe--actif');
            });
            btn.classList.add('bouton-sexe--actif');
            sexeSelectionne = btn.getAttribute('data-sexe');
        });
    });

    champNpi.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9]/g, '').slice(0, LONGUEUR_NPI);
        erreurNpi.hidden = true;
        erreurNpi.textContent = '';
        champNpi.classList.remove('champ__input--erreur');
        zoneErreur.hidden = true;
    });

    function afficherErreurChamp(idChamp, idErreur, message) {
        var champ = document.getElementById(idChamp);
        var erreur = document.getElementById(idErreur);
        if (erreur) {
            erreur.textContent = message;
            erreur.hidden = false;
        }
        if (champ) champ.classList.add('champ__input--erreur');
    }

    function cacherErreurChamp(idChamp, idErreur) {
        var champ = document.getElementById(idChamp);
        var erreur = document.getElementById(idErreur);
        if (erreur) {
            erreur.hidden = true;
            erreur.textContent = '';
        }
        if (champ) champ.classList.remove('champ__input--erreur');
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

    // Étape 1 : vérifier NPI
    boutonVerifierNpi.addEventListener('click', async function () {
        zoneErreur.hidden = true;
        cacherErreurChamp('champ-npi', 'erreur-npi');

        var npi = champNpi.value.trim();
        if (!regexNpi.test(npi)) {
            afficherErreurChamp('champ-npi', 'erreur-npi', 'Le NPI doit contenir exactement 10 chiffres.');
            return;
        }

        boutonVerifierNpi.disabled = true;
        boutonVerifierNpi.textContent = 'Vérification...';

        try {
            var rep = await window.ClientMCS.api.post('/api/auth/verifier-npi', { npi: npi });

            if (!rep.succes || !rep.npiValide) {
                throw new Error(rep.message || 'NPI introuvable auprès de l\'ANIP.');
            }

            if (rep.dejaInscrit) {
                afficherErreurGenerale('Ce NPI est déjà inscrit sur Mon Carnet Sante. Connectez-vous plutôt.');
                setTimeout(function () {
                    window.location.href = '/patient/connexion';
                }, 3000);
                return;
            }

            npiVerifie = true;
            champNpi.disabled = true;
            actionsNpi.hidden = true;
            badgeVerifie.hidden = false;

            var info = rep.informationsAnip || {};
            var prenomAnip = info.prenom || '';
            var nomAnip = info.nom || '';
            infosAnip.textContent = (prenomAnip + ' ' + nomAnip).trim() || 'NPI valide';

            // Pré-remplir les champs
            if (info.nom) document.getElementById('champ-nom').value = info.nom;
            if (info.prenom) document.getElementById('champ-prenom').value = info.prenom;
            if (info.dateNaissance) {
                document.getElementById('champ-date-naissance').value = info.dateNaissance;
            }

            formulaire.hidden = false;
            setTimeout(function () {
                formulaire.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (err) {
            afficherErreurChamp('champ-npi', 'erreur-npi', err.message || 'Erreur lors de la vérification.');
        } finally {
            boutonVerifierNpi.disabled = false;
            boutonVerifierNpi.textContent = 'Vérifier mon NPI';
        }
    });

    // Étape 2 : soumettre le formulaire
    formulaire.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        zoneErreur.hidden = true;
        zoneSucces.hidden = true;

        // Nettoyer les erreurs précédentes
        ['champ-nom', 'champ-prenom', 'champ-date-naissance', 'champ-telephone',
         'champ-email', 'champ-contact-tel'].forEach(function (id) {
            cacherErreurChamp(id, id.replace('champ-', 'erreur-'));
        });
        document.getElementById('erreur-sexe').hidden = true;

        var nom = document.getElementById('champ-nom').value.trim();
        var prenom = document.getElementById('champ-prenom').value.trim();
        var dateNaissance = document.getElementById('champ-date-naissance').value;
        var lieuNaissance = document.getElementById('champ-lieu-naissance').value.trim();
        var telephone = document.getElementById('champ-telephone').value.trim();
        var email = document.getElementById('champ-email').value.trim();
        var adresse = document.getElementById('champ-adresse').value.trim();
        var ville = document.getElementById('champ-ville').value.trim();
        var allergies = document.getElementById('champ-allergies').value.trim();
        var maladies = document.getElementById('champ-maladies').value.trim();
        var contactNom = document.getElementById('champ-contact-nom').value.trim();
        var contactTel = document.getElementById('champ-contact-tel').value.trim();

        var valide = true;

        if (!nom) {
            afficherErreurChamp('champ-nom', 'erreur-nom', 'Le nom est obligatoire.');
            valide = false;
        }
        if (!prenom) {
            afficherErreurChamp('champ-prenom', 'erreur-prenom', 'Le prénom est obligatoire.');
            valide = false;
        }
        if (!dateNaissance) {
            afficherErreurChamp('champ-date-naissance', 'erreur-date-naissance', 'La date de naissance est obligatoire.');
            valide = false;
        } else if (new Date(dateNaissance) > new Date()) {
            afficherErreurChamp('champ-date-naissance', 'erreur-date-naissance', 'La date ne peut pas être dans le futur.');
            valide = false;
        }
        if (!sexeSelectionne) {
            document.getElementById('erreur-sexe').textContent = 'Le sexe est obligatoire.';
            document.getElementById('erreur-sexe').hidden = false;
            valide = false;
        }
        if (!regexTel.test(telephone)) {
            afficherErreurChamp('champ-telephone', 'erreur-telephone', 'Format attendu : 01XXXXXXXX.');
            valide = false;
        }
        if (email && !regexEmail.test(email)) {
            afficherErreurChamp('champ-email', 'erreur-email', 'Adresse email invalide.');
            valide = false;
        }
        if (contactTel && !regexTel.test(contactTel)) {
            afficherErreurChamp('champ-contact-tel', 'erreur-contact-tel', 'Format attendu : 01XXXXXXXX.');
            valide = false;
        }

        if (!valide) return;

        boutonInscription.disabled = true;
        boutonInscription.textContent = 'Création en cours...';

        var donnees = {
            npi: champNpi.value.trim(),
            nom: nom,
            prenom: prenom,
            dateNaissance: dateNaissance,
            lieuNaissance: lieuNaissance || undefined,
            sexe: sexeSelectionne,
            telephone: telephone,
            email: email || undefined,
            adresse: adresse || undefined,
            ville: ville || undefined,
            groupeSanguin: groupeSelectionne || undefined,
            allergies: allergies || undefined,
            maladiesChroniques: maladies || undefined,
            contactUrgenceNom: contactNom || undefined,
            contactUrgenceTelephone: contactTel || undefined
        };

        try {
            var rep = await window.ClientMCS.api.post('/api/auth/patient/inscription', donnees);
            if (!rep.succes) {
                throw new Error(rep.message || 'Inscription impossible.');
            }

            afficherSucces('Votre carnet a été créé. Redirection vers la connexion...');
            boutonInscription.textContent = 'Compte créé';

            setTimeout(function () {
                window.location.href = '/patient/connexion';
            }, 2500);
        } catch (err) {
            afficherErreurGenerale(err.message || 'Erreur lors de l\'inscription.');
            boutonInscription.disabled = false;
            boutonInscription.textContent = 'Créer mon carnet';
        }
    });
})();