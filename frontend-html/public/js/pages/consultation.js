(function () {
    'use strict';

    var segments = window.location.pathname.split('/');
    var npi = segments[segments.length - 1];

    var formulaire = document.getElementById('formulaire-consultation');
    var boutonEnregistrer = document.getElementById('bouton-enregistrer');
    var zoneErreur = document.getElementById('zone-erreur');
    var texteErreur = document.getElementById('texte-erreur');
    var zoneSucces = document.getElementById('zone-succes');
    var lienAnnuler = document.getElementById('lien-annuler');
    var lienOrdonnance = document.getElementById('lien-ordonnance');
    var lienRetourDossier = document.getElementById('lien-retour-dossier');

    lienAnnuler.href = '/dossier/' + npi;
    lienRetourDossier.href = '/dossier/' + npi;

    function afficherErreurChamp(idErreur, idChamp, message) {
        var el = document.getElementById(idErreur);
        var champ = document.getElementById(idChamp);
        el.textContent = message;
        el.hidden = false;
        champ.classList.add('champ__input--erreur');
    }

    function effacerErreurChamp(idErreur, idChamp) {
        var el = document.getElementById(idErreur);
        var champ = document.getElementById(idChamp);
        el.hidden = true;
        el.textContent = '';
        champ.classList.remove('champ__input--erreur');
    }

    function validerNumerique(valeur, min, max, unite) {
        if (!valeur) return null;
        var n = parseFloat(String(valeur).replace(',', '.'));
        if (isNaN(n)) return 'Valeur invalide.';
        if (n < min || n > max) return 'La valeur doit etre entre ' + min + ' et ' + max + ' ' + unite + '.';
        return null;
    }

    document.getElementById('champ-temperature').addEventListener('input', function () {
        effacerErreurChamp('erreur-temperature', 'champ-temperature');
        zoneErreur.hidden = true;
    });
    document.getElementById('champ-poids').addEventListener('input', function () {
        effacerErreurChamp('erreur-poids', 'champ-poids');
        zoneErreur.hidden = true;
    });
    document.getElementById('champ-taille').addEventListener('input', function () {
        effacerErreurChamp('erreur-taille', 'champ-taille');
        zoneErreur.hidden = true;
    });
    document.getElementById('champ-motif').addEventListener('input', function () {
        effacerErreurChamp('erreur-motif', 'champ-motif');
        zoneErreur.hidden = true;
    });

    formulaire.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        zoneErreur.hidden = true;
        effacerErreurChamp('erreur-motif', 'champ-motif');
        effacerErreurChamp('erreur-temperature', 'champ-temperature');
        effacerErreurChamp('erreur-poids', 'champ-poids');
        effacerErreurChamp('erreur-taille', 'champ-taille');

        var motif = document.getElementById('champ-motif').value.trim();
        if (!motif) {
            afficherErreurChamp('erreur-motif', 'champ-motif', 'Le motif est obligatoire.');
            return;
        }

        var temp = document.getElementById('champ-temperature').value;
        var errTemp = validerNumerique(temp, 30, 45, 'Celsius');
        if (errTemp) {
            afficherErreurChamp('erreur-temperature', 'champ-temperature', errTemp);
            return;
        }

        var poids = document.getElementById('champ-poids').value;
        var errPoids = validerNumerique(poids, 1, 500, 'kg');
        if (errPoids) {
            afficherErreurChamp('erreur-poids', 'champ-poids', errPoids);
            return;
        }

        var taille = document.getElementById('champ-taille').value;
        var errTaille = validerNumerique(taille, 30, 250, 'cm');
        if (errTaille) {
            afficherErreurChamp('erreur-taille', 'champ-taille', errTaille);
            return;
        }

        boutonEnregistrer.disabled = true;
        boutonEnregistrer.textContent = 'Enregistrement...';

        var donnees = {
            npi: npi,
            motif: motif,
            diagnostic: document.getElementById('champ-diagnostic').value.trim() || undefined,
            notesMedicales: document.getElementById('champ-notes').value.trim() || undefined,
            tensionArterielle: document.getElementById('champ-tension').value.trim() || undefined,
            temperature: temp ? parseFloat(temp) : undefined,
            poids: poids ? parseFloat(poids) : undefined,
            taille: taille ? parseFloat(taille) : undefined
        };

        try {
            var rep = await window.ClientMCS.api.post('/api/medecin/consultation', donnees);

            if (rep.succes && rep.consultation) {
                formulaire.hidden = true;
                zoneSucces.hidden = false;
                lienOrdonnance.href = '/ordonnance/' + rep.consultation.id + '?npi=' + npi;
            } else {
                texteErreur.textContent = rep.message || 'Impossible d enregistrer la consultation.';
                zoneErreur.hidden = false;
                boutonEnregistrer.disabled = false;
                boutonEnregistrer.textContent = 'Enregistrer la consultation';
            }
        } catch (err) {
            texteErreur.textContent = err.message || 'Erreur lors de l enregistrement.';
            zoneErreur.hidden = false;
            boutonEnregistrer.disabled = false;
            boutonEnregistrer.textContent = 'Enregistrer la consultation';
        }
    });
})();