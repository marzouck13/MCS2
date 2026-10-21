(function () {
    'use strict';

    var regexNpi = /^[0-9]{10}$/;
    var npiCourant = null;

    var formulaire = document.getElementById('formulaire-urgence');
    var champNpi = document.getElementById('champ-npi');
    var erreurNpi = document.getElementById('erreur-npi');
    var zoneSaisie = document.getElementById('zone-saisie');
    var zoneResultats = document.getElementById('zone-resultats');

    var modaleConfirmation = document.getElementById('modale-confirmation');
    var checkConfirmation = document.getElementById('check-confirmation');
    var boutonConfirmer = document.getElementById('confirmer-acces');

    var params = new URLSearchParams(window.location.search);
    var npiUrl = params.get('npi');

    function formaterAge(dateNaissance) {
        if (!dateNaissance) return null;
        var naissance = new Date(dateNaissance);
        if (isNaN(naissance.getTime())) return null;
        var auj = new Date();
        var age = auj.getFullYear() - naissance.getFullYear();
        var m = auj.getMonth() - naissance.getMonth();
        if (m < 0 || (m === 0 && auj.getDate() < naissance.getDate())) age--;
        return age >= 0 ? age : null;
    }

    function masquerNpi(npi) {
        if (!npi || npi.length < 4) return npi || '';
        return npi.substring(0, 2) + '******' + npi.substring(npi.length - 2);
    }

    champNpi.addEventListener('input', function (ev) {
        ev.target.value = ev.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        erreurNpi.hidden = true;
    });

    checkConfirmation.addEventListener('change', function () {
        boutonConfirmer.disabled = !checkConfirmation.checked;
    });

    formulaire.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!regexNpi.test(champNpi.value)) {
            erreurNpi.textContent = 'Le NPI doit contenir exactement 10 chiffres.';
            erreurNpi.hidden = false;
            return;
        }
        npiCourant = champNpi.value;
        modaleConfirmation.hidden = false;
    });

    function fermerModale() {
        modaleConfirmation.hidden = true;
        checkConfirmation.checked = false;
        boutonConfirmer.disabled = true;
    }

    document.getElementById('fermer-modale').addEventListener('click', fermerModale);
    document.getElementById('annuler-confirmation').addEventListener('click', fermerModale);

    boutonConfirmer.addEventListener('click', async function () {
        boutonConfirmer.disabled = true;
        boutonConfirmer.textContent = 'Acces...';

        try {
            var rep = await window.ClientMCS.api.get('/api/urgence/' + npiCourant + '?motif=Acces urgence web');
            if (rep.succes && rep.patient) {
                fermerModale();
                afficherResultats(rep.patient);
            } else {
                window.Alertes.erreur(rep.message || 'Impossible de recuperer les donnees.');
                fermerModale();
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur reseau.');
            fermerModale();
        } finally {
            boutonConfirmer.textContent = "Confirmer l'acces";
        }
    });

    function afficherResultats(patient) {
        zoneSaisie.hidden = true;
        zoneResultats.hidden = false;

        var initiale = (patient.prenom || '?')[0].toUpperCase();
        document.getElementById('resultat-initiale').textContent = initiale;
        document.getElementById('resultat-nom').textContent = patient.prenom + ' ' + patient.nom;

        var details = ['NPI : ' + masquerNpi(patient.npi)];
        var age = formaterAge(patient.dateNaissance);
        if (age !== null) details.push(age + ' ans');
        if (patient.sexe === 'M') details.push('Masculin');
        if (patient.sexe === 'F') details.push('Feminin');
        document.getElementById('resultat-details').textContent = details.join(' - ');

        document.getElementById('resultat-groupe').textContent = patient.groupeSanguin || 'Non renseigne';
        document.getElementById('resultat-allergies').textContent = patient.allergies || 'Aucune connue';
        document.getElementById('resultat-maladies').textContent = patient.maladiesChroniques || 'Aucune connue';

        if (patient.contactUrgenceNom || patient.contactUrgenceTelephone) {
            document.getElementById('resultat-contact').hidden = false;
            document.getElementById('contact-nom').textContent = patient.contactUrgenceNom || 'Non renseigne';
            document.getElementById('contact-tel').textContent = patient.contactUrgenceTelephone || '';
        }
    }

    // Si le NPI est deja dans l'URL, pre-remplir
    if (npiUrl && regexNpi.test(npiUrl)) {
        champNpi.value = npiUrl;
        modaleConfirmation.hidden = false;
        npiCourant = npiUrl;
    }
})();