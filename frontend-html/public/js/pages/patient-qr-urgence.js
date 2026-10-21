(function () {
    'use strict';

    var elChargement = document.getElementById('chargement');
    var zoneAucunQr = document.getElementById('zone-aucun-qr');
    var zoneQrActif = document.getElementById('zone-qr-actif');
    var zoneApercu = document.getElementById('zone-apercu');
    var boutonGenerer = document.getElementById('bouton-generer');
    var boutonRevoquer = document.getElementById('bouton-revoquer');
    var boutonAfficherGrand = document.getElementById('bouton-afficher-grand');
    var modale = document.getElementById('modale-qr-grand');
    var fermerModale = document.getElementById('fermer-modale');
    var fermerBas = document.getElementById('bouton-fermer-bas');
    var boutonTelecharger = document.getElementById('bouton-telecharger');
    var boutonPartager = document.getElementById('bouton-partager');
    var modalCanvas = document.getElementById('modal-canvas-conteneur');
    var modalCodeTexte = document.getElementById('modal-code-texte');
    var modalDateExp = document.getElementById('modal-date-expiration');

    var codeQrTexte = document.getElementById('code-qr-texte');
    var dateExpiration = document.getElementById('date-expiration');
    var qrCanvasConteneur = document.getElementById('qr-canvas-conteneur');
    var apercuListe = document.getElementById('apercu-liste');

    var qrUrgenceActuel = null;
    var utilisateurActuel = null;

    function rendreApercu(utilisateur) {
        if (!utilisateur) { zoneApercu.hidden = true; return; }

        utilisateurActuel = utilisateur;
        zoneApercu.hidden = false;

        var infos = [
            { icone: 'water', label: 'Groupe sanguin', valeur: utilisateur.groupeSanguin || 'Non renseigné', manquant: !utilisateur.groupeSanguin },
            { icone: 'alert', label: 'Allergies', valeur: utilisateur.allergies || 'Aucune connue', manquant: false },
            { icone: 'heart', label: 'Maladies chroniques', valeur: utilisateur.maladiesChroniques || 'Aucune connue', manquant: false },
            { icone: 'phone', label: 'Contact d\'urgence', valeur: utilisateur.contactUrgenceNom ? utilisateur.contactUrgenceNom + (utilisateur.contactUrgenceTelephone ? ' - ' + utilisateur.contactUrgenceTelephone : '') : 'Non renseigné', manquant: !utilisateur.contactUrgenceTelephone }
        ];

        var iconesSvg = {
            water: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>',
            alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17.01"></line>',
            heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>',
            phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>'
        };

        apercuListe.innerHTML = infos.map(function (info) {
            return '<div class="qr-urgence__apercu-item">' +
                '<div class="qr-urgence__apercu-item-icone' + (info.manquant ? ' qr-urgence__apercu-item-icone--manquant' : '') + '">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + iconesSvg[info.icone] + '</svg>' +
                '</div>' +
                '<div>' +
                    '<p class="qr-urgence__apercu-item-label">' + info.label + '</p>' +
                    '<p class="qr-urgence__apercu-item-valeur' + (info.manquant ? ' qr-urgence__apercu-item-valeur--manquant' : '') + '">' + info.valeur + '</p>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    function afficherEtatVide() {
        qrUrgenceActuel = null;
        zoneAucunQr.hidden = false;
        zoneQrActif.hidden = true;
    }

    function afficherQrActif(qr) {
        qrUrgenceActuel = qr;
        zoneAucunQr.hidden = true;
        zoneQrActif.hidden = false;

        codeQrTexte.textContent = qr.code;

        if (qr.dateExpiration) {
            var d = new Date(qr.dateExpiration);
            dateExpiration.textContent = d.toLocaleDateString('fr-FR');
        } else {
            dateExpiration.textContent = '-';
        }

        qrCanvasConteneur.innerHTML = '';
        new QRCode(qrCanvasConteneur, {
            text: qr.code,
            width: 200,
            height: 200,
            colorDark: '#C0392B',
            colorLight: '#FFFFFF'
        });
    }

    async function chargerQrUrgence() {
        try {
            var resultats = await Promise.all([
                window.ClientMCS.api.get('/api/qr-code/mes-codes?type=urgence_permanent'),
                window.ClientMCS.api.get('/api/auth/profil')
            ]);

            var repQr = resultats[0];
            var repProfil = resultats[1];

            if (repProfil.succes && repProfil.utilisateur) rendreApercu(repProfil.utilisateur);

            if (repQr.succes && repQr.qrCodes && repQr.qrCodes.length > 0) {
                var qr = repQr.qrCodes[0];
                afficherQrActif({
                    id: qr.id,
                    code: qr.code_qr || qr.codeQr,
                    dateExpiration: qr.date_expiration || qr.dateExpiration
                });
            } else {
                afficherEtatVide();
            }
        } catch (err) {
            window.Alertes.erreur('Impossible de charger les données.');
            afficherEtatVide();
        } finally {
            elChargement.hidden = true;
        }
    }

    async function genererQrUrgence() {
        var infosManquantes = [];
        if (utilisateurActuel && !utilisateurActuel.groupeSanguin) infosManquantes.push('groupe sanguin');
        if (utilisateurActuel && !utilisateurActuel.contactUrgenceTelephone) infosManquantes.push('contact d\'urgence');

        if (infosManquantes.length > 0) {
            if (!confirm('Votre QR d\'urgence ne contiendra pas toutes les informations utiles car vous n\'avez pas renseigné : ' + infosManquantes.join(', ') + '. Voulez-vous quand même le générer ?')) return;
        }

        boutonGenerer.disabled = true;
        boutonGenerer.textContent = 'Génération...';

        try {
            var rep = await window.ClientMCS.api.post('/api/qr-code/generer-urgence', {});
            if (!rep.succes || !rep.qrCode) throw new Error(rep.message || 'Erreur de génération.');

            afficherQrActif({
                id: rep.qrCode.id,
                code: rep.qrCode.code,
                dateExpiration: rep.qrCode.dateExpiration
            });
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur lors de la génération.');
        } finally {
            boutonGenerer.disabled = false;
            boutonGenerer.textContent = 'Générer mon QR d\'urgence';
        }
    }

    function ouvrirModale() {
        if (!qrUrgenceActuel) return;

        modalCodeTexte.textContent = qrUrgenceActuel.code;
        if (qrUrgenceActuel.dateExpiration) {
            var d = new Date(qrUrgenceActuel.dateExpiration);
            modalDateExp.textContent = 'Valable jusqu\'au ' + d.toLocaleDateString('fr-FR');
        }

        modalCanvas.innerHTML = '';
        new QRCode(modalCanvas, {
            text: qrUrgenceActuel.code,
            width: 260,
            height: 260,
            colorDark: '#C0392B',
            colorLight: '#FFFFFF'
        });

        modale.hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function fermerModaleFn() {
        modale.hidden = true;
        document.body.style.overflow = '';
    }

    function telechargerQr() {
        if (!qrUrgenceActuel) return;
        window.UtilsQR.telecharger('modal-canvas-conteneur', 'QR-Urgence-' + (utilisateurActuel ? utilisateurActuel.prenom + '-' + utilisateurActuel.nom : 'MCS') + '.png');
    }

    function partagerQr() {
        if (!qrUrgenceActuel) return;
        window.UtilsQR.partager(
            'modal-canvas-conteneur',
            'QR-Urgence-' + (utilisateurActuel ? utilisateurActuel.prenom + '-' + utilisateurActuel.nom : 'MCS') + '.png',
            'Mon Carnet Sante - QR d\'urgence',
            'Voici mon QR d\'urgence Mon Carnet Sante. En cas d\'urgence, faites-le scanner par un professionnel de santé.'
        );
    }

    boutonGenerer.addEventListener('click', genererQrUrgence);
    boutonAfficherGrand.addEventListener('click', ouvrirModale);
    fermerModale.addEventListener('click', fermerModaleFn);
    fermerBas.addEventListener('click', fermerModaleFn);
    modale.addEventListener('click', function (e) { if (e.target === modale) fermerModaleFn(); });
    boutonTelecharger.addEventListener('click', telechargerQr);
    boutonPartager.addEventListener('click', partagerQr);

    boutonRevoquer.addEventListener('click', async function () {
        if (!confirm('Voulez-vous vraiment révoquer ce QR d\'urgence ? Il ne sera plus accepté en cas d\'urgence.')) return;
        try {
            var rep = await window.ClientMCS.api.delete('/api/qr-code/urgence-permanent');
            if (rep.succes) {
                window.Alertes.succes('QR d\'urgence révoqué.');
                afficherEtatVide();
            } else {
                window.Alertes.erreur(rep.message || 'Erreur.');
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur réseau.');
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modale.hidden) fermerModaleFn();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerQrUrgence);
    } else {
        chargerQrUrgence();
    }
})();