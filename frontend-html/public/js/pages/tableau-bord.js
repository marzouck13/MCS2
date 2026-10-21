(function () {
    'use strict';

    var elementNom = document.getElementById('hero-nom');
    var elementSpecialite = document.getElementById('hero-specialite');
    var statConsultations = document.getElementById('stat-consultations');
    var statOrdonnances = document.getElementById('stat-ordonnances');
    var statAcces = document.getElementById('stat-acces');
    var listeConsultations = document.getElementById('liste-consultations');
    var lienVoirPlus = document.getElementById('lien-voir-plus');
    var zoneErreur = document.getElementById('zone-erreur');
    var texteErreur = document.getElementById('texte-erreur');

    function formaterDateHeure(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var jour = String(d.getDate()).padStart(2, '0');
        var mois = String(d.getMonth() + 1).padStart(2, '0');
        var annee = d.getFullYear();
        var heures = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        return jour + '/' + mois + '/' + annee + ' ' + heures + ':' + minutes;
    }

    function afficherErreur(message) {
        texteErreur.textContent = message;
        zoneErreur.hidden = false;
    }

    function lireChamp(objet, cleCamel, cleSnake, defaut) {
        if (objet[cleCamel] !== undefined && objet[cleCamel] !== null) return objet[cleCamel];
        if (objet[cleSnake] !== undefined && objet[cleSnake] !== null) return objet[cleSnake];
        return defaut;
    }

    async function chargerDonnees() {
        try {
            var reponses = await Promise.all([
                window.ClientMCS.api.get('/api/auth/profil').catch(function () { return null; }),
                window.ClientMCS.api.get('/api/medecin/statistiques').catch(function () { return null; }),
                window.ClientMCS.api.get('/api/medecin/mes-consultations?limite=5').catch(function () { return null; })
            ]);

            var profil = reponses[0];
            var stats = reponses[1];
            var consultations = reponses[2];

            if (profil && profil.succes && profil.utilisateur) {
                var u = profil.utilisateur;
                var estMedecin = u.specialite && u.role === 'medecin';
                elementNom.textContent = (estMedecin ? 'Dr ' : '') + (u.prenom || '') + ' ' + (u.nom || '');
                elementSpecialite.textContent = (u.specialite || 'Professionnel de sante') + (u.etablissementNom ? ' - ' + u.etablissementNom : '');
            }

            if (stats && stats.succes && stats.statistiques) {
                statConsultations.textContent = stats.statistiques.totalConsultations || 0;
                statOrdonnances.textContent = stats.statistiques.totalOrdonnances || 0;
                statAcces.textContent = stats.statistiques.totalAcces || 0;
            }

            if (consultations && consultations.succes && consultations.consultations) {
                var liste = consultations.consultations;
                listeConsultations.innerHTML = '';

                if (liste.length === 0) {
                    listeConsultations.innerHTML = '<div class="tableau-bord__vide">Aucune consultation pour le moment.</div>';
                } else {
                    lienVoirPlus.hidden = false;
                    liste.forEach(function (c) {
                        var patientNom = lireChamp(c, 'patientNom', 'patient_nom', '');
                        var patientPrenom = lireChamp(c, 'patientPrenom', 'patient_prenom', '');
                        var patientNpi = lireChamp(c, 'patientNpi', 'patient_npi', null);
                        var dateConsultation = lireChamp(c, 'dateConsultation', 'date_consultation', null);
                        var motif = c.motif || '';

                        var nomComplet = (patientPrenom + ' ' + patientNom).trim();
                        var nomAffiche = nomComplet || 'Patient inconnu';
                        var initiale = nomAffiche[0] ? nomAffiche[0].toUpperCase() : '?';

                        var detail = formaterDateHeure(dateConsultation);
                        if (motif) {
                            detail += ' - ' + motif;
                        }

                        var lien = patientNpi ? '/dossier/' + patientNpi : '#';

                        var ligne = document.createElement('a');
                        ligne.href = lien;
                        ligne.className = 'tableau-bord__ligne';
                        ligne.innerHTML =
                            '<div class="tableau-bord__ligne-avatar">' + initiale + '</div>' +
                            '<div class="tableau-bord__ligne-info">' +
                                '<p class="tableau-bord__ligne-nom">' + nomAffiche + '</p>' +
                                '<p class="tableau-bord__ligne-detail">' + detail + '</p>' +
                            '</div>' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--texte-desactive)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

                        listeConsultations.appendChild(ligne);
                    });
                }
            }

        } catch (erreur) {
            afficherErreur(erreur.message || 'Impossible de charger les donnees du tableau de bord.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerDonnees);
    } else {
        chargerDonnees();
    }
})();