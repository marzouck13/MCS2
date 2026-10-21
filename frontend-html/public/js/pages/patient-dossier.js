(function () {
    'use strict';

    // ============================================
    // DOM
    // ============================================
    var elChargement = document.getElementById('chargement');
    var elErreur = document.getElementById('zone-erreur');
    var elTexteErreur = document.getElementById('texte-erreur');
    var elContenu = document.getElementById('contenu-dossier');

    var listeConsultations = document.getElementById('liste-consultations');
    var listeOrdonnances = document.getElementById('liste-ordonnances');
    var listeResultats = document.getElementById('liste-resultats');

    // ============================================
    // Utilitaires
    // ============================================
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

    function masquerNpi(npi) {
        if (!npi || npi.length < 4) return npi || '';
        return npi.substring(0, 2) + '******' + npi.substring(npi.length - 2);
    }

    function formaterSexe(sexe) {
        if (sexe === 'M') return 'Masculin';
        if (sexe === 'F') return 'Feminin';
        return '';
    }

    // ============================================
    // En-tête patient
    // ============================================
    function rendreEnTete(patient) {
        if (!patient) return;

        var initiale = (patient.prenom || patient.nom || '?')[0].toUpperCase();
        document.getElementById('patient-initiale').textContent = initiale;
        document.getElementById('patient-nom').textContent =
            (patient.prenom || '') + ' ' + (patient.nom || '');

        var details = [];
        if (patient.npi) details.push('NPI : ' + masquerNpi(patient.npi));
        var age = formaterAge(patient.dateNaissance);
        if (age !== null) details.push(age + ' ans');
        if (patient.sexe) details.push(formaterSexe(patient.sexe));
        document.getElementById('patient-details').textContent = details.join(' • ');

        // Badges
        var badges = document.getElementById('patient-badges');
        badges.innerHTML = '';

        if (patient.groupeSanguin) {
            badges.innerHTML +=
                '<span class="badge badge--danger">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>' +
                    '</svg>' +
                    'Groupe ' + patient.groupeSanguin +
                '</span>';
        }

        if (patient.allergies) {
            badges.innerHTML +=
                '<span class="badge badge--avertissement">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>' +
                        '<line x1="12" y1="9" x2="12" y2="13"></line>' +
                        '<line x1="12" y1="17" x2="12" y2="17.01"></line>' +
                    '</svg>' +
                    'Allergies : ' + patient.allergies +
                '</span>';
        }

        if (patient.maladiesChroniques) {
            badges.innerHTML +=
                '<span class="badge badge--info">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' +
                    '</svg>' +
                    'Chronique : ' + patient.maladiesChroniques +
                '</span>';
        }

        // Contact d'urgence
        var zoneUrgence = document.getElementById('patient-urgence');
        if (patient.contactUrgenceNom || patient.contactUrgenceTelephone) {
            zoneUrgence.hidden = false;
            var nomContact = patient.contactUrgenceNom || 'Non renseigne';
            var telContact = patient.contactUrgenceTelephone || '';
            zoneUrgence.innerHTML =
                '<div class="patient-dossier__urgence">' +
                    '<svg class="patient-dossier__urgence-icone" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>' +
                    '</svg>' +
                    '<div>' +
                        '<strong>Contact d\'urgence :</strong> ' + nomContact +
                        (telContact ? '__' + telContact : '') +
                    '</div>' +
                '</div>';
        } else {
            zoneUrgence.hidden = true;
            zoneUrgence.innerHTML = '';
        }
    }

    // ============================================
    // Rendu des listes (réutilisation composants-metier.js)
    // ============================================
    function rendreEtatVide(icone, titre, description) {
        return (
            '<div class="patient-dossier__vide">' +
                '<div class="patient-dossier__vide-icone">' + icone + '</div>' +
                '<p class="patient-dossier__vide-titre">' + titre + '</p>' +
                '<p class="patient-dossier__vide-desc">' + description + '</p>' +
            '</div>'
        );
    }

    function rendreConsultations(consultations) {
        if (!consultations || consultations.length === 0) {
            listeConsultations.innerHTML = rendreEtatVide(
                '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path>' +
                    '<path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path>' +
                    '<circle cx="20" cy="10" r="2"></circle>' +
                '</svg>',
                'Aucune consultation',
                'Vos consultations apparaitront ici apres votre premiere visite chez un medecin.'
            );
            return;
        }

        listeConsultations.innerHTML = consultations
            .map(function (c) {
                return window.ComposantsMetier.creerHtmlConsultation(c);
            })
            .join('');
    }

    function rendreOrdonnances(dossier) {
        var actives = dossier.ordonnancesActives || [];
        var passees = dossier.ordonnancesPassees || [];

        if (actives.length === 0 && passees.length === 0) {
            listeOrdonnances.innerHTML = rendreEtatVide(
                '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>' +
                    '<polyline points="14 2 14 8 20 8"></polyline>' +
                '</svg>',
                'Aucune ordonnance',
                'Vos ordonnances apparaitront ici apres prescription par un medecin.'
            );
            return;
        }

        var html = '';

        if (actives.length > 0) {
            html += '<h3 class="patient-dossier__section-titre">Ordonnances actives (' + actives.length + ')</h3>';
            html += actives
                .map(function (o) {
                    return window.ComposantsMetier.creerHtmlOrdonnance(o);
                })
                .join('');
        }

        if (passees.length > 0) {
            html += '<h3 class="patient-dossier__section-titre">Historique (' + passees.length + ')</h3>';
            html += passees
                .map(function (o) {
                    return window.ComposantsMetier.creerHtmlOrdonnance(o);
                })
                .join('');
        }

        listeOrdonnances.innerHTML = html;
    }

    function rendreResultats(resultats) {
        if (!resultats || resultats.length === 0) {
            listeResultats.innerHTML = rendreEtatVide(
                '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M9 3h6v6l4 12H5L9 9V3z"></path>' +
                    '<path d="M9 15h6"></path>' +
                '</svg>',
                'Aucun resultat d\'examen',
                'Vos resultats d\'examens (analyses, radiologies) apparaitront ici.'
            );
            return;
        }

        listeResultats.innerHTML = resultats
            .map(function (r) {
                return window.ComposantsMetier.creerHtmlResultat(r);
            })
            .join('');
    }

    // ============================================
    // Onglets
    // ============================================
    function configurerOnglets() {
        var onglets = document.querySelectorAll('#onglets-dossier .onglet');
        onglets.forEach(function (onglet) {
            onglet.addEventListener('click', function () {
                onglets.forEach(function (o) {
                    o.classList.remove('onglet--actif');
                });
                onglet.classList.add('onglet--actif');

                listeConsultations.hidden = true;
                listeOrdonnances.hidden = true;
                listeResultats.hidden = true;

                var cible = onglet.getAttribute('data-cible');
                document.getElementById('liste-' + cible).hidden = false;
            });
        });
    }

    // ============================================
    // Erreur / chargement
    // ============================================
    function afficherErreur(message) {
        elChargement.hidden = true;
        elTexteErreur.textContent = message;
        elErreur.hidden = false;
    }

    // ============================================
    // Chargement principal
    // ============================================
    async function chargerDossier() {
        try {
            // Récupérer profil patient + dossier en parallèle
            var resultats = await Promise.all([
                window.ClientMCS.api.get('/api/auth/profil'),
                window.ClientMCS.api.get('/api/patient/dossier')
            ]);

            var repProfil = resultats[0];
            var repDossier = resultats[1];

            if (!repProfil.succes || !repProfil.utilisateur) {
                throw new Error('Profil introuvable.');
            }

            if (!repDossier.succes || !repDossier.dossier) {
                throw new Error(repDossier.message || 'Dossier introuvable.');
            }

            var patient = repProfil.utilisateur;
            var dossier = repDossier.dossier;

            // En-tête
            rendreEnTete(patient);

            // Compteurs
            var consultations = dossier.consultations || [];
            var ordonnancesActives = dossier.ordonnancesActives || [];
            var ordonnancesPassees = dossier.ordonnancesPassees || [];
            var resultatsExamens = dossier.resultatsExamens || [];

            document.getElementById('compteur-consultations').textContent = consultations.length;
            document.getElementById('compteur-ordonnances').textContent = ordonnancesActives.length + ordonnancesPassees.length;
            document.getElementById('compteur-resultats').textContent = resultatsExamens.length;

            // Listes
            rendreConsultations(consultations);
            rendreOrdonnances(dossier);
            rendreResultats(resultatsExamens);

            // Onglets
            configurerOnglets();

            elChargement.hidden = true;
            elContenu.hidden = false;

        } catch (err) {
            afficherErreur(err.message || 'Impossible de charger votre dossier.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerDossier);
    } else {
        chargerDossier();
    }
})();