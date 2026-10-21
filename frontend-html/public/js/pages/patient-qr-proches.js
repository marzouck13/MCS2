(function () {
    'use strict';

    var elChargement = document.getElementById('chargement');
    var listeProches = document.getElementById('liste-proches');
    var etatVide = document.getElementById('etat-vide');
    var boutonAjouterProche = document.getElementById('bouton-ajouter-proche');
    var boutonPremierProche = document.getElementById('bouton-premier-proche');
    var modaleAjout = document.getElementById('modale-ajout');
    var fermerModaleAjout = document.getElementById('fermer-modale-ajout');
    var modaleAfficher = document.getElementById('modale-afficher');
    var fermerModaleAfficher = document.getElementById('fermer-modale-afficher');

    var champNpiProche = document.getElementById('champ-npi-proche');
    var boutonVerifierNpi = document.getElementById('bouton-verifier-npi');
    var badgeNpiVerifie = document.getElementById('badge-npi-verifie');
    var nomProcheVerifie = document.getElementById('nom-proche-verifie');
    var etape2 = document.getElementById('etape-2');
    var actionsNpi = document.getElementById('actions-npi');
    var champConsentement = document.getElementById('champ-consentement');
    var boutonEnregistrer = document.getElementById('bouton-enregistrer-proche');
    var formulaire = document.getElementById('formulaire-ajout');
    var champDureeStandard = document.getElementById('champ-duree-standard');

    var modalAfficherCanvas = document.getElementById('modal-afficher-canvas');
    var modalAfficherNom = document.getElementById('modal-afficher-nom');
    var modalAfficherRelation = document.getElementById('modal-afficher-relation');
    var modalAfficherCode = document.getElementById('modal-afficher-code');
    var modalAfficherDate = document.getElementById('modal-afficher-date');
    var boutonTelechargerQr = document.getElementById('bouton-telecharger-qr');
    var boutonPartagerQr = document.getElementById('bouton-partager-qr');

    var npiVerifie = null;
    var qrAffiche = null;

    var LABELS_RELATION = {
        'enfant': 'Enfant', 'conjoint': 'Conjoint(e)', 'parent': 'Parent',
        'frere_soeur': 'Frère ou sœur', 'grand_parent': 'Grand-parent', 'autre': 'Autre'
    };

    async function chargerProches() {
        elChargement.hidden = false;
        listeProches.hidden = true;
        etatVide.hidden = true;

        try {
            var rep = await window.ClientMCS.api.get('/api/qr-code/proches');
            window._prochesCache = (rep.succes && rep.qrProches) ? rep.qrProches : [];

            if (window._prochesCache.length > 0) {
                listeProches.innerHTML = window._prochesCache.map(rendreCarte).join('');
                attacherEvenements();
                listeProches.hidden = false;
            } else {
                etatVide.hidden = false;
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur de chargement.');
            etatVide.hidden = false;
        } finally {
            elChargement.hidden = true;
        }
    }

    function rendreCarte(qr) {
        var estUrgence = qr.type_qr === 'urgence_permanent';
        var estActif = qr.est_actif !== false && qr.consentement_actif !== false;
        var relation = LABELS_RELATION[qr.relation] || qr.relation;
        var couleurClasse = estUrgence ? 'urgence' : 'standard';

        var dateCreation = qr.date_creation ? new Date(qr.date_creation).toLocaleDateString('fr-FR') : '-';
        var dateExpiration = qr.date_expiration ? new Date(qr.date_expiration).toLocaleDateString('fr-FR') : 'Sans limite';
        var badgeClass = estActif ? 'actif' : 'inactif';
        var badgeTexte = estActif ? 'ACTIF' : 'DÉSACTIVÉ';

        return '<div class="qr-proche__carte' + (estActif ? '' : ' qr-proche__carte--inactive') + '">' +
            '<div class="qr-proche__entete">' +
                '<div class="qr-proche__avatar qr-proche__avatar--' + couleurClasse + '">' +
                    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        (estUrgence
                            ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17.01"></line>'
                            : '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><line x1="14" y1="14" x2="14" y2="14.01"></line><line x1="21" y1="14" x2="21" y2="21"></line><line x1="14" y1="21" x2="14" y2="21.01"></line><line x1="18" y1="21" x2="18" y2="21.01"></line><line x1="21" y1="18" x2="21" y2="18.01"></line>')
                    + '</svg>' +
                '</div>' +
                '<div class="qr-proche__infos">' +
                    '<p class="qr-proche__nom">' + qr.prenom_proche + ' ' + qr.nom_proche + '</p>' +
                    '<p class="qr-proche__meta">' + relation + ' • ' + (estUrgence ? 'Urgence' : 'Standard') + '</p>' +
                '</div>' +
                '<span class="qr-proche__badge qr-proche__badge--' + badgeClass + '">' + badgeTexte + '</span>' +
            '</div>' +
            '<div class="qr-proche__details">' +
                '<div class="qr-proche__detail">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
                    'Créé le ' + dateCreation +
                '</div>' +
                '<div class="qr-proche__detail">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
                    'Expire le ' + dateExpiration +
                '</div>' +
            '</div>' +
            (estActif
                ? '<div class="qr-proche__actions">' +
                    '<button type="button" class="bouton bouton--neutre" data-action="afficher" data-id="' + qr.id + '">Afficher le QR</button>' +
                    '<button type="button" class="bouton bouton--danger" data-action="supprimer" data-id="' + qr.id + '">Désactiver</button>' +
                  '</div>'
                : '') +
        '</div>';
    }

    function attacherEvenements() {
        listeProches.querySelectorAll('button[data-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.getAttribute('data-action');
                var id = btn.getAttribute('data-id');

                if (action === 'afficher') {
                    var qr = window._prochesCache.find(function (p) { return p.id === id; });
                    if (qr) ouvrirQr(qr);
                } else if (action === 'supprimer') {
                    if (confirm('Voulez-vous vraiment désactiver ce QR code ?')) {
                        window.ClientMCS.api.delete('/api/qr-code/proches/' + id).then(function (rep) {
                            if (rep.succes) {
                                window.Alertes.succes('QR désactivé.');
                                chargerProches();
                            } else {
                                window.Alertes.erreur(rep.message || 'Erreur.');
                            }
                        }).catch(function (err) {
                            window.Alertes.erreur(err.message || 'Erreur.');
                        });
                    }
                }
            });
        });
    }

    champNpiProche.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        if (npiVerifie) {
            npiVerifie = null;
            badgeNpiVerifie.hidden = true;
            actionsNpi.hidden = false;
            etape2.hidden = true;
            champNpiProche.disabled = false;
        }
    });

    boutonVerifierNpi.addEventListener('click', async function () {
        var npi = champNpiProche.value.trim();
        if (npi.length !== 10) {
            window.Alertes.erreur('Le NPI doit contenir 10 chiffres.');
            return;
        }

        boutonVerifierNpi.disabled = true;
        boutonVerifierNpi.textContent = 'Vérification...';

        try {
            var rep = await window.ClientMCS.api.post('/api/auth/verifier-npi', { npi: npi });
            if (!rep.succes || !rep.npiValide) throw new Error(rep.message || 'NPI introuvable.');
            if (!rep.dejaInscrit) throw new Error('Ce proche n\'est pas encore inscrit sur Mon Carnet Sante.');

            npiVerifie = npi;
            var info = rep.informationsAnip || {};
            nomProcheVerifie.textContent = ((info.prenom || '') + ' ' + (info.nom || '')).trim() || 'NPI valide';
            badgeNpiVerifie.hidden = false;
            actionsNpi.hidden = true;
            etape2.hidden = false;
            champNpiProche.disabled = true;
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur de vérification.');
        } finally {
            boutonVerifierNpi.disabled = false;
            boutonVerifierNpi.textContent = 'Vérifier le NPI';
        }
    });

    document.querySelectorAll('input[name="type-qr"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            document.querySelectorAll('.qr-proches__type-option').forEach(function (opt) {
                opt.classList.remove('qr-proches__type-option--actif');
            });
            radio.closest('.qr-proches__type-option').classList.add('qr-proches__type-option--actif');
            var estStandard = radio.value === 'standard';
            champDureeStandard.style.display = estStandard ? 'block' : 'none';
        });
    });
    document.querySelector('.qr-proches__type-option[data-type="standard"]').classList.add('qr-proches__type-option--actif');

    champConsentement.addEventListener('change', function () {
        boutonEnregistrer.disabled = !champConsentement.checked;
    });

    formulaire.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        if (!npiVerifie) return window.Alertes.erreur('Veuillez d\'abord vérifier le NPI.');

        var relation = document.getElementById('champ-relation').value;
        var motif = document.getElementById('champ-motif').value;
        var typeQr = document.querySelector('input[name="type-qr"]:checked').value;

        if (!relation) return window.Alertes.erreur('Sélectionnez une relation.');
        if (!motif) return window.Alertes.erreur('Sélectionnez votre qualité de tuteur.');

        var donnees = { npiProche: npiVerifie, relation: relation, motifTutelle: motif, typeQr: typeQr };
        if (typeQr === 'standard') donnees.dureeHeures = parseInt(document.getElementById('champ-duree').value, 10);

        boutonEnregistrer.disabled = true;
        boutonEnregistrer.textContent = 'Génération...';

        try {
            var rep = await window.ClientMCS.api.post('/api/qr-code/proches', donnees);
            if (!rep.succes || !rep.qrProche) throw new Error(rep.message || 'Erreur de génération.');
            fermerModaleAjoutFn();
            window.Alertes.succes('QR code créé pour ' + rep.qrProche.prenomProche + '.');
            chargerProches();
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur.');
        } finally {
            boutonEnregistrer.disabled = !champConsentement.checked;
            boutonEnregistrer.textContent = 'Générer le QR code';
        }
    });

    function ouvrirModaleAjoutFn() {
        formulaire.reset();
        npiVerifie = null;
        champNpiProche.disabled = false;
        badgeNpiVerifie.hidden = true;
        actionsNpi.hidden = false;
        etape2.hidden = true;
        champConsentement.checked = false;
        boutonEnregistrer.disabled = true;
        document.querySelectorAll('.qr-proches__type-option').forEach(function (o) { o.classList.remove('qr-proches__type-option--actif'); });
        document.querySelector('.qr-proches__type-option[data-type="standard"]').classList.add('qr-proches__type-option--actif');
        champDureeStandard.style.display = 'block';
        modaleAjout.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function fermerModaleAjoutFn() {
        modaleAjout.hidden = true;
        document.body.style.overflow = '';
    }

    boutonAjouterProche.addEventListener('click', ouvrirModaleAjoutFn);
    boutonPremierProche.addEventListener('click', ouvrirModaleAjoutFn);
    fermerModaleAjout.addEventListener('click', fermerModaleAjoutFn);
    modaleAjout.addEventListener('click', function (e) { if (e.target === modaleAjout) fermerModaleAjoutFn(); });

    function ouvrirQr(qr) {
        qrAffiche = qr;
        var relation = LABELS_RELATION[qr.relation] || qr.relation;
        modalAfficherNom.textContent = qr.prenom_proche + ' ' + qr.nom_proche;
        modalAfficherRelation.textContent = relation;
        modalAfficherCode.textContent = qr.code_qr;
        modalAfficherDate.textContent = qr.date_expiration ? 'Valable jusqu\'au ' + new Date(qr.date_expiration).toLocaleDateString('fr-FR') : 'Sans limite de durée';

        modalAfficherCanvas.innerHTML = '';
        new QRCode(modalAfficherCanvas, {
            text: qr.code_qr,
            width: 240,
            height: 240,
            colorDark: qr.type_qr === 'urgence_permanent' ? '#C0392B' : '#0F4C81',
            colorLight: '#FFFFFF'
        });

        modaleAfficher.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function fermerModaleAfficherFn() {
        modaleAfficher.hidden = true;
        document.body.style.overflow = '';
    }

    fermerModaleAfficher.addEventListener('click', fermerModaleAfficherFn);
    modaleAfficher.addEventListener('click', function (e) { if (e.target === modaleAfficher) fermerModaleAfficherFn(); });

    boutonTelechargerQr.addEventListener('click', function () {
        if (!qrAffiche) return;
        window.UtilsQR.telecharger('modal-afficher-canvas', 'QR-' + qrAffiche.prenom_proche + '-' + qrAffiche.nom_proche + '.png');
    });

    boutonPartagerQr.addEventListener('click', function () {
        if (!qrAffiche) return;
        window.UtilsQR.partager(
            'modal-afficher-canvas',
            'QR-' + qrAffiche.prenom_proche + '-' + qrAffiche.nom_proche + '.png',
            'Mon Carnet Sante - QR Proche',
            'Voici le QR code de ' + qrAffiche.prenom_proche + ' pour accéder à son dossier médical.'
        );
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (!modaleAjout.hidden) fermerModaleAjoutFn();
            if (!modaleAfficher.hidden) fermerModaleAfficherFn();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerProches);
    } else {
        chargerProches();
    }
})();