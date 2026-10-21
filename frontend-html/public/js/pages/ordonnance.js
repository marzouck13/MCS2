(function () {
    'use strict';

    var segments = window.location.pathname.split('/');
    var consultationIdParam = segments.length > 2 && segments[2] !== '' ? segments[2] : null;

    var params = new URLSearchParams(window.location.search);
    var npi = params.get('npi');

    var elChargement = document.getElementById('chargement');
    var elErreur = document.getElementById('zone-erreur');
    var elTexteErreur = document.getElementById('texte-erreur');
    var formulaire = document.getElementById('formulaire-ordonnance');
    var zoneSucces = document.getElementById('zone-succes');
    var selectConsultation = document.getElementById('champ-consultation');
    var listeMedicaments = document.getElementById('liste-medicaments');
    var boutonAjouter = document.getElementById('bouton-ajouter-medicament');
    var boutonGenerer = document.getElementById('bouton-generer');
    var lienAnnuler = document.getElementById('lien-annuler');
    var lienRetourDossier = document.getElementById('lien-retour-dossier');
    var boutonImprimer = document.getElementById('bouton-imprimer');

    function formaterDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var jour = String(d.getDate()).padStart(2, '0');
        var mois = String(d.getMonth() + 1).padStart(2, '0');
        var annee = d.getFullYear();
        return jour + '/' + mois + '/' + annee;
    }

    function afficherErreur(message) {
        elChargement.hidden = true;
        formulaire.hidden = true;
        elTexteErreur.textContent = message;
        elErreur.hidden = false;
    }

    function creerLigneMedicament(index) {
        var div = document.createElement('div');
        div.className = 'medicament-ligne';

        var entete = document.createElement('div');
        entete.className = 'medicament-ligne__entete';

        var titre = document.createElement('span');
        titre.className = 'medicament-ligne__titre';
        titre.textContent = 'Medicament ' + (index + 1);
        entete.appendChild(titre);

        if (index > 0) {
            var btnSuppr = document.createElement('button');
            btnSuppr.type = 'button';
            btnSuppr.className = 'medicament-ligne__supprimer';
            btnSuppr.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path></svg>';
            btnSuppr.setAttribute('aria-label', 'Supprimer');
            btnSuppr.addEventListener('click', function () {
                div.remove();
                mettreAJourTitres();
            });
            entete.appendChild(btnSuppr);
        }

        div.appendChild(entete);

        var grille = document.createElement('div');
        grille.className = 'medicament-ligne__grille';

        var champs = [
            { nom: 'nom', label: 'Nom', type: 'text', placeholder: 'Ex : Paracetamol', requis: true },
            { nom: 'dosage', label: 'Dosage', type: 'text', placeholder: 'Ex : 500 mg' },
            { nom: 'frequence', label: 'Frequence', type: 'text', placeholder: 'Ex : 3 fois / jour' },
            { nom: 'duree', label: 'Duree', type: 'text', placeholder: 'Ex : 5 jours' },
            { nom: 'quantite', label: 'Quantite', type: 'number', placeholder: 'Ex : 15' }
        ];

        champs.forEach(function (c) {
            var champDiv = document.createElement('div');
            champDiv.className = 'champ';
            var label = document.createElement('label');
            label.className = 'champ__label';
            label.textContent = c.label;
            if (c.requis) {
                var span = document.createElement('span');
                span.className = 'champ__obligatoire';
                span.textContent = ' *';
                label.appendChild(span);
            }
            var input = document.createElement('input');
            input.type = c.type;
            input.className = 'champ__input med-' + c.nom;
            input.placeholder = c.placeholder;
            if (c.requis) input.required = true;
            champDiv.appendChild(label);
            champDiv.appendChild(input);
            grille.appendChild(champDiv);
        });

        div.appendChild(grille);
        return div;
    }

    function mettreAJourTitres() {
        var lignes = listeMedicaments.querySelectorAll('.medicament-ligne');
        lignes.forEach(function (ligne, i) {
            var titre = ligne.querySelector('.medicament-ligne__titre');
            if (titre) titre.textContent = 'Medicament ' + (i + 1);

            var btn = ligne.querySelector('.medicament-ligne__supprimer');
            if (i === 0 && btn) btn.remove();
            if (i > 0 && !btn) {
                var entete = ligne.querySelector('.medicament-ligne__entete');
                var btnSuppr = document.createElement('button');
                btnSuppr.type = 'button';
                btnSuppr.className = 'medicament-ligne__supprimer';
                btnSuppr.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path></svg>';
                btnSuppr.setAttribute('aria-label', 'Supprimer');
                btnSuppr.addEventListener('click', function () {
                    ligne.remove();
                    mettreAJourTitres();
                });
                entete.appendChild(btnSuppr);
            }
        });
    }

    function initialiserFormulaire() {
        listeMedicaments.innerHTML = '';
        listeMedicaments.appendChild(creerLigneMedicament(0));
    }

    boutonAjouter.addEventListener('click', function () {
        var index = listeMedicaments.querySelectorAll('.medicament-ligne').length;
        listeMedicaments.appendChild(creerLigneMedicament(index));
    });

    async function chargerDossier() {
        if (!npi) {
            afficherErreur('NPI manquant dans l URL.');
            return;
        }

        try {
            var rep = await window.ClientMCS.api.get('/api/medecin/dossier/' + npi);
            if (!rep.succes) {
                throw new Error(rep.message || 'Impossible de charger le dossier.');
            }

            var consultations = (rep.dossier && rep.dossier.consultations) || [];

            selectConsultation.innerHTML = '<option value="">Choisir une consultation</option>';
            consultations.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = formaterDate(c.dateConsultation) + ' - ' + (c.motif || 'Sans motif');
                if (consultationIdParam && c.id === consultationIdParam) {
                    opt.selected = true;
                }
                selectConsultation.appendChild(opt);
            });

            if (consultations.length === 0) {
                selectConsultation.disabled = true;
                selectConsultation.innerHTML = '<option value="">Aucune consultation disponible</option>';
            }

            elChargement.hidden = true;
            formulaire.hidden = false;

            lienAnnuler.href = '/dossier/' + npi;
            lienRetourDossier.href = '/dossier/' + npi;

            initialiserFormulaire();
        } catch (err) {
            afficherErreur(err.message || 'Impossible de charger le dossier.');
        }
    }

    formulaire.addEventListener('submit', async function (ev) {
        ev.preventDefault();

        if (!selectConsultation.value) {
            alert('Veuillez selectionner une consultation.');
            return;
        }

        var lignes = listeMedicaments.querySelectorAll('.medicament-ligne');
        var medicaments = [];

        for (var i = 0; i < lignes.length; i++) {
            var ligne = lignes[i];
            var nom = ligne.querySelector('.med-nom').value.trim();
            if (!nom) continue;

            medicaments.push({
                nom: nom,
                dosage: ligne.querySelector('.med-dosage').value.trim() || undefined,
                frequence: ligne.querySelector('.med-frequence').value.trim() || undefined,
                duree: ligne.querySelector('.med-duree').value.trim() || undefined,
                quantite: ligne.querySelector('.med-quantite').value ? parseInt(ligne.querySelector('.med-quantite').value, 10) : undefined
            });
        }

        if (medicaments.length === 0) {
            alert('Ajoutez au moins un medicament.');
            return;
        }

        boutonGenerer.disabled = true;
        boutonGenerer.textContent = 'Generation...';

        var donnees = {
            npi: npi,
            consultationId: selectConsultation.value,
            medicaments: medicaments,
            instructions: document.getElementById('champ-instructions').value.trim() || undefined,
            dureeTraitement: document.getElementById('champ-duree-traitement').value.trim() || undefined
        };

        try {
            var rep = await window.ClientMCS.api.post('/api/medecin/ordonnance', donnees);

            if (rep.succes && rep.ordonnance) {
                formulaire.hidden = true;
                zoneSucces.hidden = false;
                document.getElementById('texte-code-ordonnance').textContent = rep.ordonnance.codeOrdonnance || rep.ordonnance.code_ordonnance || '-';
            } else {
                alert(rep.message || 'Erreur lors de la creation.');
                boutonGenerer.disabled = false;
                boutonGenerer.textContent = 'Generer l ordonnance';
            }
        } catch (err) {
            alert(err.message || 'Erreur reseau.');
            boutonGenerer.disabled = false;
            boutonGenerer.textContent = 'Generer l\'ordonnance';
        }
    });

    boutonImprimer.addEventListener('click', function () {
        window.print();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerDossier);
    } else {
        chargerDossier();
    }
})();