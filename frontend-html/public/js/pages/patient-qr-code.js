(function () {
    'use strict';

    var elChargement = document.getElementById('chargement');
    var zoneAucunQr = document.getElementById('zone-aucun-qr');
    var zoneQrActif = document.getElementById('zone-qr-actif');
    var chipsDuree = document.getElementById('chips-duree');
    var boutonGenerer = document.getElementById('bouton-generer');
    var boutonRegenerer = document.getElementById('bouton-regenerer');
    var boutonInvalider = document.getElementById('bouton-invalider');
    var boutonTelecharger = document.getElementById('bouton-telecharger');
    var boutonPartager = document.getElementById('bouton-partager');
    var dureeAffichee = document.getElementById('duree-affichee');
    var codeQrTexte = document.getElementById('code-qr-texte');
    var compteARebours = document.getElementById('compte-a-rebours');
    var barreProgression = document.getElementById('barre-progression');
    var dateExpiration = document.getElementById('date-expiration');
    var qrCanvasConteneur = document.getElementById('qr-canvas-conteneur');

    var dureeSelectionnee = 15;
    var qrActuel = null;
    var intervalleCompteur = null;

    // Sélecteur de durée
    if (chipsDuree) {
        chipsDuree.querySelectorAll('.qr-patient__chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                chipsDuree.querySelectorAll('.qr-patient__chip').forEach(function (c) {
                    c.classList.remove('qr-patient__chip--actif');
                });
                chip.classList.add('qr-patient__chip--actif');
                dureeSelectionnee = parseInt(chip.getAttribute('data-duree'), 10);
            });
        });
    }

    // Compte à rebours
    function demarrerCompteur() {
        if (intervalleCompteur) clearInterval(intervalleCompteur);
        if (!qrActuel || !qrActuel.dateExpiration) return;

        var dateExp = new Date(qrActuel.dateExpiration).getTime();
        var dureeTotale = (qrActuel.dureeMinutes || dureeSelectionnee) * 60;

        intervalleCompteur = setInterval(function () {
            var restant = Math.max(0, Math.floor((dateExp - Date.now()) / 1000));
            var minutes = Math.floor(restant / 60);
            var secondes = restant % 60;
            var procheExpiration = restant < 60;

            compteARebours.textContent = 'Expire dans ' +
                String(minutes).padStart(2, '0') + ':' +
                String(secondes).padStart(2, '0');

            compteARebours.parentElement.classList.toggle('qr-patient__compte--danger', procheExpiration);

            var pourcentage = dureeTotale > 0
                ? Math.min(100, (restant / dureeTotale) * 100)
                : 0;
            barreProgression.style.width = pourcentage + '%';
            barreProgression.classList.toggle('qr-patient__barre-remplie--danger', procheExpiration);

            if (restant <= 0) {
                clearInterval(intervalleCompteur);
                intervalleCompteur = null;
                window.Alertes.info('Votre QR code a expiré. Vous pouvez en générer un nouveau.');
                afficherEtatVide();
            }
        }, 1000);
    }

    // Affichage
    function afficherEtatVide() {
        qrActuel = null;
        if (intervalleCompteur) clearInterval(intervalleCompteur);
        zoneAucunQr.hidden = false;
        zoneQrActif.hidden = true;
    }

    function afficherQrActif(qr) {
        qrActuel = qr;
        zoneAucunQr.hidden = true;
        zoneQrActif.hidden = false;

        dureeAffichee.textContent = 'Durée : ' + (qr.dureeMinutes || dureeSelectionnee) + ' min';
        codeQrTexte.textContent = qr.code;

        var dateExp = new Date(qr.dateExpiration);
        dateExpiration.textContent = 'Expire le ' +
            dateExp.toLocaleDateString('fr-FR') + ' à ' +
            dateExp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        qrCanvasConteneur.innerHTML = '';
        new QRCode(qrCanvasConteneur, {
            text: qr.code,
            width: 240,
            height: 240,
            colorDark: '#0F4C81',
            colorLight: '#FFFFFF'
        });

        demarrerCompteur();
    }

    // Génération
    async function genererQr(dureeMinutes) {
        boutonGenerer.disabled = true;
        boutonGenerer.textContent = 'Génération...';

        try {
            var rep = await window.ClientMCS.api.post('/api/qr-code/generer', {
                invaliderPrecedents: true,
                dureeMinutes: dureeMinutes
            });

            if (!rep.succes || !rep.qrCode) {
                throw new Error(rep.message || 'Impossible de générer le QR code.');
            }

            afficherQrActif({
                id: rep.qrCode.id,
                code: rep.qrCode.code,
                dateExpiration: rep.qrCode.dateExpiration,
                dureeMinutes: rep.qrCode.dureeValiditeMinutes || dureeMinutes
            });
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur lors de la génération.');
        } finally {
            boutonGenerer.disabled = false;
            boutonGenerer.textContent = 'Générer le QR code';
        }
    }

    // Chargement initial
    async function chargerQrActif() {
        try {
            var rep = await window.ClientMCS.api.get('/api/qr-code/mes-codes?type=standard');
            if (rep.succes && rep.qrCodes && rep.qrCodes.length > 0) {
                var recent = rep.qrCodes[0];
                var dateExp = new Date(recent.date_expiration || recent.dateExpiration);
                if (dateExp > new Date()) {
                    var duree = Math.max(1, Math.round((dateExp - new Date(recent.date_creation || new Date())) / 60000));
                    afficherQrActif({
                        id: recent.id,
                        code: recent.code_qr || recent.codeQr,
                        dateExpiration: recent.date_expiration || recent.dateExpiration,
                        dureeMinutes: duree
                    });
                } else {
                    afficherEtatVide();
                }
            } else {
                afficherEtatVide();
            }
        } catch (err) {
            window.Alertes.erreur('Impossible de charger les QR codes.');
            afficherEtatVide();
        } finally {
            elChargement.hidden = true;
        }
    }

    // Événements
    boutonGenerer.addEventListener('click', function () { genererQr(dureeSelectionnee); });
    boutonRegenerer.addEventListener('click', function () { genererQr(qrActuel ? qrActuel.dureeMinutes : dureeSelectionnee); });

    boutonTelecharger.addEventListener('click', function () {
        if (!qrActuel) return;
        window.UtilsQR.telecharger('qr-canvas-conteneur', 'QR-Code-' + qrActuel.code + '.png');
    });

    boutonPartager.addEventListener('click', function () {
        if (!qrActuel) return;
        window.UtilsQR.partager(
            'qr-canvas-conteneur',
            'QR-Code-' + qrActuel.code + '.png',
            'Mon Carnet Sante - QR Code',
            'Voici mon QR code pour accéder à mon dossier médical.'
        );
    });

    boutonInvalider.addEventListener('click', async function () {
        if (!confirm('Voulez-vous vraiment invalider tous vos QR codes standards ?')) return;
        try {
            var rep = await window.ClientMCS.api.delete('/api/qr-code/mes-codes');
            if (rep.succes) {
                window.Alertes.succes('Vos QR codes ont été invalidés.');
                afficherEtatVide();
            } else {
                window.Alertes.erreur(rep.message || 'Erreur lors de l\'invalidation.');
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur réseau.');
        }
    });

    window.addEventListener('beforeunload', function () {
        if (intervalleCompteur) clearInterval(intervalleCompteur);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerQrActif);
    } else {
        chargerQrActif();
    }
})();