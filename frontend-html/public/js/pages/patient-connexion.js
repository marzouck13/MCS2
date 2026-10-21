(function () {
    'use strict';

    var LONGUEUR_NPI = 10;
    var LONGUEUR_OTP = 6;
    var DUREE_OTP_SECONDES = 5 * 60;
    var DELAI_RENVOI_SECONDES = 30;

    var regexNpi = /^[0-9]{10}$/;
    var regexTel = /^(\+229)?01[0-9]{8}$/;
    var regexOtp = /^[0-9]{6}$/;

    var etapeIdentifiants = document.getElementById('etape-identifiants');
    var etapeOtp = document.getElementById('etape-otp');
    var formIdentifiants = document.getElementById('formulaire-identifiants');
    var formOtp = document.getElementById('formulaire-otp');
    var boutonRecevoirCode = document.getElementById('bouton-recevoir-code');
    var boutonSeConnecter = document.getElementById('bouton-se-connecter');
    var boutonRetour = document.getElementById('bouton-retour');
    var boutonRenvoyer = document.getElementById('bouton-renvoyer');
    var champNpi = document.getElementById('champ-npi');
    var champTel = document.getElementById('champ-telephone');
    var champOtp = document.getElementById('champ-otp');
    var erreurNpi = document.getElementById('erreur-npi');
    var erreurTel = document.getElementById('erreur-telephone');
    var erreurOtp = document.getElementById('erreur-otp');
    var zoneErreurEt1 = document.getElementById('zone-erreur-etape1');
    var texteErreurEt1 = document.getElementById('texte-erreur-etape1');
    var zoneErreurEt2 = document.getElementById('zone-erreur-etape2');
    var texteErreurEt2 = document.getElementById('texte-erreur-etape2');
    var encartDev = document.getElementById('encart-dev');
    var codeDev = document.getElementById('code-dev');
    var telAffiche = document.getElementById('tel-affiche');
    var compteurValidite = document.getElementById('compteur-validite');

    var intervalleCompteur = null;
    var secondesRestantes = 0;
    var secondesAvantRenvoi = 0;

    champNpi.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9]/g, '').slice(0, LONGUEUR_NPI);
        cacherErreurChamp(erreurNpi, champNpi);
        zoneErreurEt1.hidden = true;
    });

    champTel.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9+]/g, '').slice(0, 13);
        cacherErreurChamp(erreurTel, champTel);
        zoneErreurEt1.hidden = true;
    });

    champOtp.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9]/g, '').slice(0, LONGUEUR_OTP);
        cacherErreurChamp(erreurOtp, champOtp);
        zoneErreurEt2.hidden = true;
    });

    function afficherErreurChamp(el, champ, msg) {
        if (!el) return;
        el.textContent = msg;
        el.hidden = false;
        if (champ) champ.classList.add('champ__input--erreur');
    }

    function cacherErreurChamp(el, champ) {
        if (!el) return;
        el.hidden = true;
        el.textContent = '';
        if (champ) champ.classList.remove('champ__input--erreur');
    }

    function afficherErreurGenerale(zone, texte, message) {
        texte.textContent = message;
        zone.hidden = false;
    }

    function formaterTemps(secondes) {
        var m = Math.floor(secondes / 60);
        var s = secondes % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function demarrerCompteurs() {
        secondesRestantes = DUREE_OTP_SECONDES;
        secondesAvantRenvoi = DELAI_RENVOI_SECONDES;
        compteurValidite.textContent = formaterTemps(secondesRestantes);
        boutonRenvoyer.disabled = true;
        boutonRenvoyer.textContent = 'Renvoyer dans ' + secondesAvantRenvoi + ' s';

        if (intervalleCompteur) clearInterval(intervalleCompteur);
        intervalleCompteur = setInterval(function () {
            if (secondesRestantes > 0) secondesRestantes--;
            compteurValidite.textContent = formaterTemps(secondesRestantes);

            if (secondesAvantRenvoi > 0) {
                secondesAvantRenvoi--;
                if (secondesAvantRenvoi > 0) {
                    boutonRenvoyer.textContent = 'Renvoyer dans ' + secondesAvantRenvoi + ' s';
                } else {
                    boutonRenvoyer.disabled = false;
                    boutonRenvoyer.textContent = 'Renvoyer le code';
                }
            }

            if (secondesRestantes === 0 && secondesAvantRenvoi === 0) {
                clearInterval(intervalleCompteur);
                intervalleCompteur = null;
            }
        }, 1000);
    }

    formIdentifiants.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        zoneErreurEt1.hidden = true;
        cacherErreurChamp(erreurNpi, champNpi);
        cacherErreurChamp(erreurTel, champTel);

        var npi = champNpi.value.trim();
        var tel = champTel.value.trim();

        if (!regexNpi.test(npi)) {
            afficherErreurChamp(erreurNpi, champNpi, 'Le NPI doit contenir exactement 10 chiffres.');
            return;
        }
        if (!regexTel.test(tel)) {
            afficherErreurChamp(erreurTel, champTel, 'Format attendu : 01XXXXXXXX.');
            return;
        }

        boutonRecevoirCode.disabled = true;
        boutonRecevoirCode.textContent = 'Envoi du code...';

        try {
            var rep = await window.ClientMCS.patient.demanderOtp(npi, tel);
            if (!rep.succes) {
                throw new Error(rep.message || 'Impossible d\'envoyer le code.');
            }

            telAffiche.textContent = tel;
            champOtp.value = '';
            cacherErreurChamp(erreurOtp, champOtp);

            if (rep.codeOtpDev) {
                encartDev.hidden = false;
                codeDev.textContent = rep.codeOtpDev;
            } else {
                encartDev.hidden = true;
            }

            etapeIdentifiants.hidden = true;
            etapeOtp.hidden = false;
            demarrerCompteurs();

            setTimeout(function () { champOtp.focus(); }, 200);
        } catch (err) {
            afficherErreurGenerale(zoneErreurEt1, texteErreurEt1, err.message || 'Erreur lors de l\'envoi.');
        } finally {
            boutonRecevoirCode.disabled = false;
            boutonRecevoirCode.textContent = 'Recevoir un code';
        }
    });

    formOtp.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        zoneErreurEt2.hidden = true;
        cacherErreurChamp(erreurOtp, champOtp);

        var otp = champOtp.value.trim();
        if (!regexOtp.test(otp)) {
            afficherErreurChamp(erreurOtp, champOtp, 'Le code doit contenir 6 chiffres.');
            return;
        }

        boutonSeConnecter.disabled = true;
        boutonSeConnecter.textContent = 'Connexion...';

        try {
            var rep = await window.ClientMCS.patient.ouvrirSession(
                champNpi.value.trim(),
                champTel.value.trim(),
                otp
            );
            if (!rep.succes) {
                throw new Error(rep.message || 'Code incorrect.');
            }
            if (intervalleCompteur) {
                clearInterval(intervalleCompteur);
                intervalleCompteur = null;
            }
            window.location.href = '/patient/tableau-bord';
        } catch (err) {
            afficherErreurGenerale(zoneErreurEt2, texteErreurEt2, err.message || 'Erreur de connexion.');
            boutonSeConnecter.disabled = false;
            boutonSeConnecter.textContent = 'Se connecter';
        }
    });

    boutonRetour.addEventListener('click', function () {
        if (intervalleCompteur) {
            clearInterval(intervalleCompteur);
            intervalleCompteur = null;
        }
        etapeOtp.hidden = true;
        etapeIdentifiants.hidden = false;
        zoneErreurEt2.hidden = true;
        encartDev.hidden = true;
    });

    boutonRenvoyer.addEventListener('click', async function () {
        if (secondesAvantRenvoi > 0) return;
        boutonRenvoyer.disabled = true;
        boutonRenvoyer.textContent = 'Envoi...';

        try {
            var rep = await window.ClientMCS.patient.demanderOtp(
                champNpi.value.trim(),
                champTel.value.trim()
            );
            if (!rep.succes) throw new Error(rep.message || 'Erreur.');
            if (rep.codeOtpDev) {
                encartDev.hidden = false;
                codeDev.textContent = rep.codeOtpDev;
            }
            demarrerCompteurs();
        } catch (err) {
            afficherErreurGenerale(zoneErreurEt2, texteErreurEt2, err.message || 'Erreur.');
            boutonRenvoyer.disabled = false;
            boutonRenvoyer.textContent = 'Renvoyer le code';
        }
    });

    window.addEventListener('beforeunload', function () {
        if (intervalleCompteur) clearInterval(intervalleCompteur);
    });
})();