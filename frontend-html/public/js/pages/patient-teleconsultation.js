(function () {
    'use strict';

    var CLE_HISTORIQUE = 'mcs_patient_historique_teleconsultation';
    var MAX_HISTORIQUE = 10;

    // DOM
    var onglets = document.querySelectorAll('.patient-teleconsultation__onglet');
    var contenuCode = document.getElementById('onglet-code');
    var contenuScan = document.getElementById('onglet-scan');
    var champCode = document.getElementById('champ-code');
    var boutonRejoindre = document.getElementById('bouton-rejoindre');
    var boutonOuvrirCamera = document.getElementById('bouton-ouvrir-camera');
    var modaleScanner = document.getElementById('modale-scanner');
    var fermerModaleScanner = document.getElementById('fermer-modale-scanner');
    var scannerOverlayChargement = document.getElementById('scanner-overlay-chargement');
    var scannerOverlayTraitement = document.getElementById('scanner-overlay-traitement');
    var historiqueConteneur = document.getElementById('historique');
    var listeHistorique = document.getElementById('liste-historique');
    var boutonEffacerHistorique = document.getElementById('bouton-effacer-historique');

    var scannerInstance = null;
    var enTraitement = false;

    // ============================================
    // Onglets
    // ============================================
    onglets.forEach(function (btn) {
        btn.addEventListener('click', function () {
            onglets.forEach(function (b) { b.classList.remove('patient-teleconsultation__onglet--actif'); });
            btn.classList.add('patient-teleconsultation__onglet--actif');
            var onglet = btn.getAttribute('data-onglet');
            
            contenuCode.hidden = onglet !== 'code';
            contenuScan.hidden = onglet !== 'scan';
        });
    });

    // ============================================
    // Saisie code
    // ============================================
    champCode.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20);
        boutonRejoindre.disabled = !ev.target.value.trim();
    });

    boutonRejoindre.addEventListener('click', function () {
        var code = champCode.value.trim();
        if (!code) return;
        activerSession(code);
    });

    // ============================================
    // Activation
    // ============================================
    async function activerSession(code) {
        boutonRejoindre.disabled = true;
        boutonRejoindre.textContent = 'Connexion...';

        try {
            var rep = await window.ClientMCS.api.post('/api/qr-code/teleconsultation/activer', {
                codeSession: code,
                codeQr: code
            });

            if (!rep.succes || !rep.session) {
                throw new Error(rep.message || 'Session introuvable ou expirée.');
            }

            sauvegarderHistorique(rep.session, code);
            window.location.href = '/patient/visio/' + (rep.session.codeSession || code);
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur lors de la connexion.');
            boutonRejoindre.disabled = false;
            boutonRejoindre.textContent = 'Rejoindre la session';
        }
    }

    // ============================================
    // Scanner QR
    // ============================================
    boutonOuvrirCamera.addEventListener('click', function () {
        modaleScanner.hidden = false;
        document.body.style.overflow = 'hidden';
        demarrerScanner();
    });

    fermerModaleScanner.addEventListener('click', fermerScanner);
    modaleScanner.addEventListener('click', function (e) { if (e.target === modaleScanner) fermerScanner(); });

    function demarrerScanner() {
        scannerOverlayChargement.hidden = false;
        scannerOverlayTraitement.hidden = true;

        if (scannerInstance) return;

        scannerInstance = new Html5Qrcode('reader');
        var config = { fps: 10, qrbox: { width: 250, height: 250 } };

        scannerInstance.start(
            { facingMode: 'environment' },
            config,
            function (texteDecode) {
                if (enTraitement) return;
                enTraitement = true;
                scannerOverlayChargement.hidden = true;
                scannerOverlayTraitement.hidden = false;
                
                setTimeout(function () {
                    fermerScanner();
                    activerSession(texteDecode);
                }, 1000);
            },
            function () {
                // Erreur de lecture (ignorer)
            }
        ).then(function () {
            scannerOverlayChargement.hidden = true;
        }).catch(function (err) {
            window.Alertes.erreur('Impossible d\'accéder à la caméra.');
            fermerScanner();
        });
    }

    function fermerScanner() {
        modaleScanner.hidden = true;
        document.body.style.overflow = '';
        enTraitement = false;
        
        if (scannerInstance) {
            if (scannerInstance.isScanning) {
                scannerInstance.stop().catch(function () {});
            }
            scannerInstance = null;
        }
    }

    // ============================================
    // Historique (localStorage)
    // ============================================
    function chargerHistorique() {
        try {
            var data = JSON.parse(localStorage.getItem(CLE_HISTORIQUE) || '[]');
            if (data.length === 0) {
                historiqueConteneur.hidden = true;
                return;
            }

            listeHistorique.innerHTML = data.map(function (item) {
                return '<div class="patient-teleconsultation__historique-item" data-code="' + item.code + '">' +
                    '<div class="patient-teleconsultation__historique-icone">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path><rect x="3" y="6" width="12" height="12" rx="2"></rect></svg>' +
                    '</div>' +
                    '<div class="patient-teleconsultation__historique-infos">' +
                        '<p class="patient-teleconsultation__historique-nom">' + (item.medecin || 'Medecin') + '</p>' +
                        '<p class="patient-teleconsultation__historique-meta">' + item.codeSession + '</p>' +
                    '</div>' +
                    '<p class="patient-teleconsultation__historique-date">' + item.date + '</p>' +
                '</div>';
            }).join('');

            listeHistorique.querySelectorAll('.patient-teleconsultation__historique-item').forEach(function (el) {
                el.addEventListener('click', function () {
                    var code = el.getAttribute('data-code');
                    champCode.value = code;
                    boutonRejoindre.disabled = false;
                    onglets[0].click(); // Retour à l'onglet code
                });
            });

            historiqueConteneur.hidden = false;
        } catch (e) {
            historiqueConteneur.hidden = true;
        }
    }

    function sauvegarderHistorique(session, codeUtilise) {
        try {
            var data = JSON.parse(localStorage.getItem(CLE_HISTORIQUE) || '[]');
            
            var entree = {
                code: codeUtilise,
                codeSession: session.codeSession || codeUtilise,
                medecin: session.medecin || 'Medecin',
                date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
            };

            // Supprimer les doublons du même code
            data = data.filter(function (d) { return d.code !== codeUtilise; });
            data.unshift(entree);
            
            localStorage.setItem(CLE_HISTORIQUE, JSON.stringify(data.slice(0, MAX_HISTORIQUE)));
        } catch (e) {
            // Silencieux
        }
    }

    boutonEffacerHistorique.addEventListener('click', function () {
        if (confirm('Effacer l\'historique local des sessions récentes ?')) {
            localStorage.removeItem(CLE_HISTORIQUE);
            historiqueConteneur.hidden = true;
        }
    });

    // ============================================
    // Démarrage
    // ============================================
    chargerHistorique();
})();