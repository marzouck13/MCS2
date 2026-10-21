(function () {
    'use strict';

    var scanner = null;
    var enTraitement = false;
    var roleUtilisateur = null;

    var overlayChargement = document.getElementById('overlay-chargement');
    var overlayTraitement = document.getElementById('overlay-traitement');
    var zoneErreurCamera = document.getElementById('zone-erreur-camera');
    var texteErreurCamera = document.getElementById('texte-erreur-camera');
    var boutonReessayer = document.getElementById('bouton-reessayer');

    async function chargerRole() {
        try {
            var rep = await window.ClientMCS.api.get('/api/auth/profil');
            if (rep.succes && rep.utilisateur) {
                roleUtilisateur = rep.utilisateur.role;
            }
        } catch {
            roleUtilisateur = 'medecin';
        }
    }

    async function traiterScan(code) {
        if (enTraitement) return;
        enTraitement = true;

        overlayTraitement.hidden = false;

        try {
            if (scanner && scanner.isScanning) {
                await scanner.pause(true);
            }
        } catch {
            // Ignorer
        }

        try {
            var rep = await window.ClientMCS.api.post('/api/qr-code/scanner', { codeQr: code });

            if (!rep.succes) {
                throw new Error(rep.message || 'QR code invalide.');
            }

            if (rep.type === 'urgence_permanent' || (rep.type === 'proche' && rep.sousType === 'urgence_permanent')) {
                var npiUrgence = rep.patient ? rep.patient.npi : (rep.proche ? rep.proche.npi : null);
                window.location.href = '/urgence?npi=' + npiUrgence;
                return;
            }

            if (rep.type === 'teleconsultation') {
                window.Alertes.info('Ce QR code est destine a une teleconsultation patient.');
                relancerScan();
                return;
            }

            var npiCible = rep.patient ? rep.patient.npi : (rep.proche ? rep.proche.npi : null);
            if (!npiCible) {
                throw new Error('NPI introuvable dans la reponse.');
            }

            if (roleUtilisateur === 'pharmacien') {
                window.location.href = '/pharmacie?npi=' + npiCible;
            } else {
                window.location.href = '/dossier/' + npiCible;
            }

        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur lors du scan.', 'Scan impossible');
            relancerScan();
        }
    }

    function relancerScan() {
        overlayTraitement.hidden = true;
        enTraitement = false;
        if (scanner && scanner.isScanning) {
            try {
                scanner.resume();
            } catch {
                demarrerScanner();
            }
        } else {
            demarrerScanner();
        }
    }

    function afficherErreurCamera(message) {
        overlayChargement.hidden = true;
        zoneErreurCamera.hidden = false;
        texteErreurCamera.textContent = message;
    }

    async function demarrerScanner() {
        zoneErreurCamera.hidden = true;
        overlayChargement.hidden = false;

        try {
            await new Promise(function (resolve) { setTimeout(resolve, 300); });

            if (scanner) {
                try {
                    if (scanner.isScanning) {
                        await scanner.stop();
                    }
                } catch {
                    // Ignorer
                }
                scanner = null;
            }

            scanner = new Html5Qrcode('reader');

            var config = {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            };

            await scanner.start(
                { facingMode: 'environment' },
                config,
                function (texteDecode) {
                    traiterScan(texteDecode);
                },
                function () {
                    // Ignorer les erreurs de lecture
                }
            );

            overlayChargement.hidden = true;
        } catch (err) {
            console.error('Erreur camera :', err);
            afficherErreurCamera('Impossible d\'acceder a la camera. Verifiez les permissions de votre navigateur et assurez-vous d\'utiliser HTTPS ou localhost.');
        }
    }

    boutonReessayer.addEventListener('click', function () {
        demarrerScanner();
    });

    async function initialiser() {
        await chargerRole();
        demarrerScanner();
    }

    window.addEventListener('beforeunload', function () {
        if (scanner && scanner.isScanning) {
            scanner.stop().catch(function () {});
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiser);
    } else {
        initialiser();
    }
})();