(function () {
    'use strict';

    var elChargement = document.getElementById('chargement');
    var zoneContenu = document.getElementById('zone-contenu');
    var statsRepartition = document.getElementById('stats-repartition');
    var listeAcces = document.getElementById('liste-acces');
    var filtres = document.querySelectorAll('.patient-journal__filtre');

    var journal = [];
    var filtreActif = 'tous';

    var COULEURS_TYPE = {
        lecture: 'var(--info)',
        modification: 'var(--avertissement)',
        urgence: 'var(--urgence)'
    };

    var ICONES_TYPE = {
        lecture: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
        modification: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
        urgence: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17.01"></line>'
    };

    function formaterDateHeure(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    function formaterRelative(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var diff = Math.floor((Date.now() - d.getTime()) / 60000);
        if (diff < 1) return "A l'instant";
        if (diff < 60) return 'Il y a ' + diff + ' min';
        if (diff < 1440) return 'Il y a ' + Math.floor(diff / 60) + ' h';
        return 'Il y a ' + Math.floor(diff / 1440) + ' j';
    }

    function rendreStats(repartition) {
        if (!repartition || repartition.length === 0) {
            statsRepartition.innerHTML = '';
            return;
        }

        var html = repartition.map(function (r) {
            var type = r.type_acces || r.typeAcces;
            var total = r.total || 0;
            var couleur = COULEURS_TYPE[type] || 'var(--texte)';
            return '<div class="patient-journal__stat">' +
                '<p class="patient-journal__stat-valeur" style="color: ' + couleur + ';">' + total + '</p>' +
                '<p class="patient-journal__stat-label">' + type.charAt(0).toUpperCase() + type.slice(1) + '</p>' +
            '</div>';
        }).join('');

        statsRepartition.innerHTML = html;
    }

    function rendreEntree(e) {
        var type = e.type_acces || e.typeAcces || 'lecture';
        var couleur = COULEURS_TYPE[type] || 'var(--texte)';
        var icone = ICONES_TYPE[type] || ICONES_TYPE.lecture;

        var nomPro = 'Professionnel de sante';
        if ((e.professionnel_nom || e.professionnelNom) && (e.professionnel_prenom || e.professionnelPrenom)) {
            var prenom = e.professionnel_prenom || e.professionnelPrenom;
            var nom = e.professionnel_nom || e.professionnelNom;
            var specialite = e.specialite || e.professionnel_specialite || e.type_professionnel;
            nomPro = 'Dr ' + prenom + ' ' + nom + (specialite ? ' (' + specialite + ')' : '');
        }

        var etablissement = e.etablissement_nom || e.etablissementNom || '';
        var ville = e.etablissement_ville || e.etablissementVille || '';
        var date = e.date_acces || e.dateAcces;

        return '<div class="patient-journal__entree">' +
            '<div class="patient-journal__entree-icone" style="background-color: ' + couleur + '20; color: ' + couleur + ';">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + icone + '</svg>' +
            '</div>' +
            '<div class="patient-journal__entree-contenu">' +
                '<div class="patient-journal__entree-entete">' +
                    '<p class="patient-journal__entree-nom">' + nomPro + '</p>' +
                    '<span class="patient-journal__entree-badge" style="background-color: ' + couleur + '20; color: ' + couleur + ';">' + type + '</span>' +
                '</div>' +
                (etablissement ? '<p class="patient-journal__entree-meta">' + etablissement + (ville ? ' - ' + ville : '') + '</p>' : '') +
                (e.motif ? '<p class="patient-journal__entree-motif">' + e.motif + '</p>' : '') +
                '<div class="patient-journal__entree-date">' +
                    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
                    formaterRelative(date) + ' - ' + formaterDateHeure(date) +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function appliquerFiltres() {
        var entrees = journal.filter(function (e) {
            if (filtreActif === 'tous') return true;
            return (e.type_acces || e.typeAcces) === filtreActif;
        });

        if (entrees.length === 0) {
            listeAcces.innerHTML =
                '<div class="patient-journal__vide">' +
                    '<div class="patient-journal__vide-icone">' +
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>' +
                    '</div>' +
                    '<p class="patient-journal__vide-titre">Aucun acces enregistre</p>' +
                    '<p class="patient-journal__vide-texte">' + (filtreActif === 'tous' ? 'Chaque consultation de votre dossier par un professionnel de sante apparaitra ici.' : 'Aucun acces de ce type pour le moment.') + '</p>' +
                '</div>';
            return;
        }

        listeAcces.innerHTML = entrees.map(rendreEntree).join('');
    }

    async function chargerJournal() {
        try {
            var rep = await window.ClientMCS.api.get('/api/patient/journal-acces');
            if (rep.succes) {
                journal = rep.journalAcces || [];
                rendreStats(rep.repartition || []);
                appliquerFiltres();
                zoneContenu.hidden = false;
            } else {
                throw new Error(rep.message || 'Erreur.');
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Impossible de charger le journal.');
        } finally {
            elChargement.hidden = true;
        }
    }

    filtres.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filtres.forEach(function (b) { b.classList.remove('patient-journal__filtre--actif'); });
            btn.classList.add('patient-journal__filtre--actif');
            filtreActif = btn.getAttribute('data-filtre');
            appliquerFiltres();
        });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerJournal);
    } else {
        chargerJournal();
    }
})();