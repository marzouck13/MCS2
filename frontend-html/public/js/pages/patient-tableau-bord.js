(function () {
    'use strict';

    var elementNom = document.getElementById('hero-nom');
    var elementBadges = document.getElementById('hero-badges');
    var statConsultations = document.getElementById('stat-consultations');
    var statOrdonnances = document.getElementById('stat-ordonnances');
    var statResultats = document.getElementById('stat-resultats');
    var statAcces = document.getElementById('stat-acces');

    function masquerNpi(npi) {
        if (!npi || npi.length < 4) return npi || '';
        return npi.substring(0, 2) + '******' + npi.substring(npi.length - 2);
    }

    function construireBadges(utilisateur) {
        if (!elementBadges) return;
        elementBadges.innerHTML = '';

        if (utilisateur.npi) {
            var badgeNpi = document.createElement('span');
            badgeNpi.className = 'patient-hero__badge';
            badgeNpi.innerHTML =
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>' +
                '</svg>' +
                masquerNpi(utilisateur.npi);
            elementBadges.appendChild(badgeNpi);
        }

        if (utilisateur.groupeSanguin) {
            var badgeGroupe = document.createElement('span');
            badgeGroupe.className = 'patient-hero__badge patient-hero__badge--groupe';
            badgeGroupe.innerHTML =
                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>' +
                '</svg>' +
                utilisateur.groupeSanguin;
            elementBadges.appendChild(badgeGroupe);
        }
    }

    async function chargerUtilisateur() {
        try {
            var rep = await window.ClientMCS.api.get('/api/auth/profil');
            if (rep.succes && rep.utilisateur) {
                var u = rep.utilisateur;
                var nomComplet = ((u.prenom || '') + ' ' + (u.nom || '')).trim();
                if (elementNom) {
                    elementNom.textContent = nomComplet || 'Bienvenue';
                }
                construireBadges(u);
            } else {
                if (elementNom) elementNom.textContent = 'Bienvenue';
            }
        } catch (err) {
            if (elementNom) elementNom.textContent = 'Bienvenue';
        }
    }

    async function chargerStatistiques() {
        try {
            var rep = await window.ClientMCS.api.get('/api/patient/statistiques');
            if (rep.succes && rep.statistiques) {
                var s = rep.statistiques;
                if (statConsultations) statConsultations.textContent = s.consultations || 0;
                if (statOrdonnances) statOrdonnances.textContent = s.ordonnancesActives || 0;
                if (statResultats) statResultats.textContent = s.resultatsExamens || 0;
                if (statAcces) statAcces.textContent = s.acces || 0;
            }
        } catch (err) {
            // Silencieux : les valeurs par défaut restent affichées (0)
        }
    }

    async function initialiser() {
        await Promise.all([
            chargerUtilisateur(),
            chargerStatistiques()
        ]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiser);
    } else {
        initialiser();
    }
})();