(function () {
    'use strict';

    var elChargement = document.getElementById('chargement');
    var listeConsentements = document.getElementById('liste-consentements');
    var boutonNouveau = document.getElementById('bouton-nouveau-consentement');
    var modaleCreation = document.getElementById('modale-creation');
    var fermerModaleCreation = document.getElementById('fermer-modale-creation');

    var champNpiPro = document.getElementById('champ-npi-pro');
    var boutonRechercherPro = document.getElementById('bouton-rechercher-pro');
    var badgeProTrouve = document.getElementById('badge-pro-trouve');
    var nomProTrouve = document.getElementById('nom-pro-trouve');
    var specProTrouve = document.getElementById('spec-pro-trouve');
    var boutonChangerPro = document.getElementById('bouton-changer-pro');
    var actionsNpi = document.getElementById('actions-npi');
    var etape2 = document.getElementById('etape-2');
    var boutonAccorder = document.getElementById('bouton-accorder');
    var erreurCreation = document.getElementById('erreur-creation');
    var texteErreurCreation = document.getElementById('texte-erreur-creation');

    var filtres = document.querySelectorAll('.patient-consentements__filtre');

    var proTrouve = null;
    var filtreStatut = '';

    async function chargerConsentements() {
        elChargement.hidden = false;
        listeConsentements.hidden = true;

        try {
            var url = '/api/patient/consentements';
            if (filtreStatut) url += '?statut=' + filtreStatut;

            var rep = await window.ClientMCS.api.get(url);
            if (rep.succes) {
                var consentements = rep.consentements || [];
                if (consentements.length === 0) {
                    listeConsentements.innerHTML =
                        '<div class="patient-consentements__vide">' +
                            '<div class="patient-consentements__vide-icone">' +
                                '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>' +
                            '</div>' +
                            '<p class="patient-consentements__vide-titre">Aucun consentement</p>' +
                            '<p class="patient-consentements__vide-texte">' + (filtreStatut ? 'Aucun consentement avec ce statut.' : 'Vous n\'avez accordé aucun accès à votre dossier pour le moment.') + '</p>' +
                        '</div>';
                } else {
                    listeConsentements.innerHTML = consentements.map(rendreCarte).join('');
                    attacherEvenements();
                }
                listeConsentements.hidden = false;
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur de chargement.');
        } finally {
            elChargement.hidden = true;
        }
    }

    function rendreCarte(c) {
        var estTuteur = c.typeConsentement === 'acces_tuteur';
        var estActif = c.statut === 'actif';
        
        var nom = estTuteur ? (c.tuteurPrenom + ' ' + c.tuteurNom) : (c.professionnelNom ? 'Dr ' + c.professionnelPrenom + ' ' + c.professionnelNom : 'Tous les professionnels');
        var typeLabel = estTuteur ? 'Consentement tuteur' : (c.typeConsentement === 'acces_medecin' ? 'Accès médecin' : 'Accès pharmacie');
        
        var initiale = nom.replace('Dr ', '').charAt(0).toUpperCase() || '?';
        var badgeClass = estActif ? 'actif' : 'revoque';
        var badgeTexte = estActif ? 'Actif' : 'Révoqué';

        var dateDebut = c.dateDebut ? new Date(c.dateDebut).toLocaleDateString('fr-FR') : '-';
        var dateExp = c.dateExpiration ? new Date(c.dateExpiration).toLocaleDateString('fr-FR') : 'Sans limite';

        return '<div class="patient-consentement__carte">' +
            '<div class="patient-consentement__entete">' +
                '<div class="patient-consentement__avatar">' + initiale + '</div>' +
                '<div class="patient-consentement__infos">' +
                    '<p class="patient-consentement__nom">' + nom + '</p>' +
                    '<p class="patient-consentement__type">' + typeLabel + '</p>' +
                '</div>' +
                '<span class="patient-consentement__badge patient-consentement__badge--' + badgeClass + '">' + badgeTexte + '</span>' +
            '</div>' +
            '<div class="patient-consentement__details">' +
                '<div class="patient-consentement__detail">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
                    'Accordé le ' + dateDebut +
                '</div>' +
                '<div class="patient-consentement__detail">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
                    'Expire le ' + dateExp +
                '</div>' +
            '</div>' +
            (estActif
                ? '<div class="patient-consentement__actions">' +
                    '<button type="button" class="bouton bouton--danger" data-action="revoquer" data-id="' + c.id + '">Révoquer</button>' +
                  '</div>'
                : '') +
        '</div>';
    }

    function attacherEvenements() {
        listeConsentements.querySelectorAll('button[data-action="revoquer"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-id');
                if (confirm('Voulez-vous vraiment révoquer ce consentement ? Le professionnel n\'aura plus accès à votre dossier.')) {
                    window.ClientMCS.api.delete('/api/patient/consentements/' + id).then(function (rep) {
                        if (rep.succes) {
                            window.Alertes.succes('Consentement révoqué.');
                            chargerConsentements();
                        } else {
                            window.Alertes.erreur(rep.message || 'Erreur.');
                        }
                    }).catch(function (err) {
                        window.Alertes.erreur(err.message || 'Erreur réseau.');
                    });
                }
            });
        });
    }

    // ============================================
    // Modale création
    // ============================================
    function ouvrirModale() {
        champNpiPro.value = '';
        proTrouve = null;
        badgeProTrouve.hidden = true;
        actionsNpi.hidden = false;
        etape2.hidden = true;
        champNpiPro.disabled = false;
        erreurCreation.hidden = true;

        modaleCreation.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function fermerModaleFn() {
        modaleCreation.hidden = true;
        document.body.style.overflow = '';
    }

    champNpiPro.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    });

    boutonRechercherPro.addEventListener('click', async function () {
        var npi = champNpiPro.value.trim();
        if (npi.length !== 10) {
            window.Alertes.erreur('Le NPI doit contenir 10 chiffres.');
            return;
        }

        boutonRechercherPro.disabled = true;
        boutonRechercherPro.textContent = 'Recherche...';

        try {
            var rep = await window.ClientMCS.api.get('/api/patient/professionnels/' + npi);
            if (!rep.succes || !rep.professionnel) {
                throw new Error(rep.message || 'Professionnel introuvable.');
            }
            proTrouve = rep.professionnel;
            
            var specialite = proTrouve.specialite || proTrouve.typeProfessionnel || 'Professionnel de santé';
            nomProTrouve.textContent = 'Dr ' + proTrouve.prenom + ' ' + proTrouve.nom;
            specProTrouve.textContent = specialite;
            
            badgeProTrouve.hidden = false;
            actionsNpi.hidden = true;
            etape2.hidden = false;
            champNpiPro.disabled = true;
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur de recherche.');
        } finally {
            boutonRechercherPro.disabled = false;
            boutonRechercherPro.textContent = 'Rechercher le professionnel';
        }
    });

    boutonChangerPro.addEventListener('click', function () {
        proTrouve = null;
        badgeProTrouve.hidden = true;
        actionsNpi.hidden = false;
        etape2.hidden = true;
        champNpiPro.disabled = false;
        champNpiPro.value = '';
        champNpiPro.focus();
    });

    boutonAccorder.addEventListener('click', async function () {
        if (!proTrouve) return;

        var type = document.getElementById('champ-type').value;
        var dureeVal = document.getElementById('champ-duree').value;
        
        var donnees = {
            professionnelId: proTrouve.id,
            typeConsentement: type
        };
        if (dureeVal) {
            donnees.dureeHeures = parseInt(dureeVal, 10);
        }

        boutonAccorder.disabled = true;
        boutonAccorder.textContent = 'Création...';
        erreurCreation.hidden = true;

        try {
            var rep = await window.ClientMCS.api.post('/api/patient/consentements', donnees);
            if (!rep.succes) {
                throw new Error(rep.message || 'Erreur.');
            }
            fermerModaleFn();
            window.Alertes.succes('Consentement accordé.');
            chargerConsentements();
        } catch (err) {
            texteErreurCreation.textContent = err.message || 'Erreur.';
            erreurCreation.hidden = false;
        } finally {
            boutonAccorder.disabled = false;
            boutonAccorder.textContent = 'Accorder le consentement';
        }
    });

    boutonNouveau.addEventListener('click', ouvrirModale);
    fermerModaleCreation.addEventListener('click', fermerModaleFn);
    modaleCreation.addEventListener('click', function (e) { if (e.target === modaleCreation) fermerModaleFn(); });

    filtres.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filtres.forEach(function (b) { b.classList.remove('patient-consentements__filtre--actif'); });
            btn.classList.add('patient-consentements__filtre--actif');
            filtreStatut = btn.getAttribute('data-statut');
            chargerConsentements();
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modaleCreation.hidden) fermerModaleFn();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerConsentements);
    } else {
        chargerConsentements();
    }
})();