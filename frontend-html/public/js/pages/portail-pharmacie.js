(function () {
    'use strict';

    var modeRecherche = 'npi';
    var ordonnanceADelivrer = null;
    var patientCourant = null;

    var ongletNpi = document.getElementById('onglet-npi');
    var ongletCode = document.getElementById('onglet-code');
    var formulaire = document.getElementById('formulaire-recherche');
    var champSaisie = document.getElementById('champ-saisie');
    var boutonRechercher = document.getElementById('bouton-rechercher');
    var zoneErreur = document.getElementById('zone-erreur');
    var texteErreur = document.getElementById('texte-erreur');
    var zoneResultats = document.getElementById('zone-resultats');
    var entetePatient = document.getElementById('entete-patient');
    var titreOrdonnances = document.getElementById('titre-ordonnances');
    var listeOrdonnances = document.getElementById('liste-ordonnances');
    var listeHistorique = document.getElementById('liste-historique');

    var modaleDelivrance = document.getElementById('modale-delivrance');
    var codeADelivrer = document.getElementById('code-a-delivrer');

    function formaterDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var jour = String(d.getDate()).padStart(2, '0');
        var mois = String(d.getMonth() + 1).padStart(2, '0');
        return jour + '/' + mois + '/' + d.getFullYear();
    }

    function masquerNpi(npi) {
        if (!npi || npi.length < 4) return npi || '';
        return npi.substring(0, 2) + '******' + npi.substring(npi.length - 2);
    }

    function afficherErreur(message) {
        texteErreur.textContent = message;
        zoneErreur.hidden = false;
    }

    function cacherErreur() {
        zoneErreur.hidden = true;
    }

    function changerMode(nouveauMode) {
        modeRecherche = nouveauMode;
        cacherErreur();
        zoneResultats.hidden = true;
        champSaisie.value = '';

        if (nouveauMode === 'npi') {
            ongletNpi.classList.add('pharmacie__onglet--actif');
            ongletCode.classList.remove('pharmacie__onglet--actif');
            champSaisie.placeholder = 'Ex : 2222222222';
            champSaisie.maxLength = 10;
            champSaisie.inputMode = 'numeric';
        } else {
            ongletCode.classList.add('pharmacie__onglet--actif');
            ongletNpi.classList.remove('pharmacie__onglet--actif');
            champSaisie.placeholder = 'Ex : ORD-XXXXXXXXXX';
            champSaisie.maxLength = 20;
            champSaisie.inputMode = 'text';
        }
    }

    ongletNpi.addEventListener('click', function () { changerMode('npi'); });
    ongletCode.addEventListener('click', function () { changerMode('code'); });

    champSaisie.addEventListener('input', function (ev) {
        if (modeRecherche === 'npi') {
            ev.target.value = ev.target.value.replace(/[^0-9]/g, '').slice(0, 10);
        } else {
            ev.target.value = ev.target.value.toUpperCase();
        }
        cacherErreur();
    });

    function afficherEntetePatient(patient) {
        patientCourant = patient;
        var initiale = (patient.prenom || '?')[0].toUpperCase();
        entetePatient.innerHTML = 
            '<div class="pharmacie__resultat-entete">' +
                '<div class="pharmacie__resultat-avatar">' + initiale + '</div>' +
                '<div>' +
                    '<p class="pharmacie__resultat-nom">' + patient.prenom + ' ' + patient.nom + '</p>' +
                    '<p class="pharmacie__resultat-detail">NPI : ' + masquerNpi(patient.npi) + (patient.ville ? ' | ' + patient.ville : '') + '</p>' +
                '</div>' +
            '</div>';
    }

    function creerHtmlOrdonnance(o, patient) {
        var code = o.code_ordonnance || o.codeOrdonnance || 'Code inconnu';
        var datePresc = o.date_prescription || o.datePrescription;
        var meds = Array.isArray(o.medicaments) ? o.medicaments : [];
        var medsHtml = meds.map(function (m) {
            return '<li class="ordonnance-pharmacie__med-item">' +
                '<span><strong>' + (m.nom || 'Medicament') + '</strong>' +
                (m.dosage ? ' - ' + m.dosage : '') +
                (m.frequence ? ' - ' + m.frequence : '') +
                (m.duree ? ' - ' + m.duree : '') + '</span>' +
            '</li>';
        }).join('');

        var medecinNom = o.medecin_nom || o.medecinNom || '';
        var medecinPrenom = o.medecin_prenom || o.medecinPrenom || '';
        
        var html = 
            '<div class="ordonnance-pharmacie">' +
                '<div class="ordonnance-pharmacie__entete">' +
                    '<p class="ordonnance-pharmacie__code">' + code + '</p>' +
                    '<span class="badge badge--succes"><span class="badge__point"></span>Active</span>' +
                '</div>' +
                '<div class="ordonnance-pharmacie__meta">' +
                    'Prescrite le ' + formaterDate(datePresc) + 
                    (medecinNom ? ' par <strong>Dr ' + medecinPrenom + ' ' + medecinNom + '</strong>' : '') +
                    (patient ? '<br>Patient : <strong>' + patient.prenom + ' ' + patient.nom + '</strong>' : '') +
                '</div>' +
                '<div class="ordonnance-pharmacie__medicaments">' +
                    '<p class="ordonnance-pharmacie__med-label">Medicaments</p>' +
                    '<ul class="ordonnance-pharmacie__med-liste">' + medsHtml + '</ul>' +
                '</div>' +
                (o.instructions ? '<div class="ordonnance-pharmacie__instructions"><strong>Instructions :</strong> ' + o.instructions + '</div>' : '') +
                '<button type="button" class="bouton bouton--primaire bouton--pleine-largeur" data-id="' + o.id + '" data-code="' + code + '">Delivrer cette ordonnance</button>' +
            '</div>';

        return html;
    }

    function attacherEvenementsDelivrance() {
        var boutons = listeOrdonnances.querySelectorAll('button[data-id]');
        boutons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                ordonnanceADelivrer = {
                    id: btn.getAttribute('data-id'),
                    code: btn.getAttribute('data-code')
                };
                codeADelivrer.textContent = ordonnanceADelivrer.code;
                modaleDelivrance.hidden = false;
            });
        });
    }

    async function rechercherNpi(npi) {
        var repPatient = await window.ClientMCS.api.get('/api/pharmacie/patient/' + npi);
        if (!repPatient.succes) throw new Error(repPatient.message || 'Patient introuvable.');

        afficherEntetePatient(repPatient.patient);

        var repOrdonnances = await window.ClientMCS.api.get('/api/pharmacie/ordonnances/' + npi);
        var ordonnances = (repOrdonnances.succes && repOrdonnances.ordonnances) ? repOrdonnances.ordonnances : [];

        zoneResultats.hidden = false;
        titreOrdonnances.textContent = 'Ordonnances actives (' + ordonnances.length + ')';

        if (ordonnances.length === 0) {
            listeOrdonnances.innerHTML = '<div class="carte" style="text-align:center; color:var(--texte-secondaire); font-size:13px;">Aucune ordonnance active pour ce patient.</div>';
        } else {
            listeOrdonnances.innerHTML = ordonnances.map(function (o) {
                return creerHtmlOrdonnance(o, repPatient.patient);
            }).join('');
            attacherEvenementsDelivrance();
        }
    }

    async function rechercherCode(code) {
        var rep = await window.ClientMCS.api.get('/api/pharmacie/ordonnance/' + code);
        if (!rep.succes) throw new Error(rep.message || 'Ordonnance introuvable.');

        entetePatient.innerHTML = '';
        zoneResultats.hidden = false;
        titreOrdonnances.textContent = 'Ordonnance trouvee';
        listeOrdonnances.innerHTML = creerHtmlOrdonnance(rep.ordonnance, null);
        attacherEvenementsDelivrance();
    }

    formulaire.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        cacherErreur();

        var valeur = champSaisie.value.trim();
        if (!valeur) {
            afficherErreur('Veuillez saisir une valeur.');
            return;
        }

        if (modeRecherche === 'npi' && valeur.length !== 10) {
            afficherErreur('Le NPI doit contenir exactement 10 chiffres.');
            return;
        }

        boutonRechercher.disabled = true;
        boutonRechercher.textContent = 'Recherche...';

        try {
            if (modeRecherche === 'npi') {
                await rechercherNpi(valeur);
            } else {
                await rechercherCode(valeur);
            }
        } catch (err) {
            zoneResultats.hidden = true;
            afficherErreur(err.message || 'Erreur lors de la recherche.');
        } finally {
            boutonRechercher.disabled = false;
            boutonRechercher.textContent = 'Rechercher';
        }
    });

    async function confirmerDelivrance() {
        if (!ordonnanceADelivrer) return;
        
        var bouton = document.getElementById('confirmer-delivrance');
        bouton.disabled = true;
        bouton.textContent = 'Delivrance...';

        try {
            var rep = await window.ClientMCS.api.post('/api/pharmacie/ordonnance/' + ordonnanceADelivrer.id + '/delivrer', {});
            if (rep.succes) {
                modaleDelivrance.hidden = true;
                if (modeRecherche === 'npi' && patientCourant) {
                    await rechercherNpi(patientCourant.npi);
                } else {
                    zoneResultats.hidden = true;
                    champSaisie.value = '';
                }
                chargerHistorique();
            } else {
                alert(rep.message || 'Erreur lors de la delivrance.');
            }
        } catch (err) {
            alert(err.message || 'Erreur reseau.');
        } finally {
            bouton.disabled = false;
            bouton.textContent = 'Confirmer la delivrance';
            ordonnanceADelivrer = null;
        }
    }

    async function chargerHistorique() {
        try {
            var rep = await window.ClientMCS.api.get('/api/pharmacie/ordonnances-delivrees?limite=10');
            if (rep.succes && rep.ordonnances) {
                if (rep.ordonnances.length === 0) {
                    listeHistorique.innerHTML = '<div style="padding: 16px; text-align: center; font-size: 13px; color: var(--texte-secondaire);">Aucune ordonnance delivree pour le moment.</div>';
                    return;
                }
                listeHistorique.innerHTML = rep.ordonnances.map(function (h) {
                    return '<div class="historique__ligne">' +
                        '<div>' +
                            '<p class="historique__code">' + (h.code_ordonnance || h.codeOrdonnance) + '</p>' +
                            '<p class="historique__patient">Patient : ' + (h.patient_prenom || '') + ' ' + (h.patient_nom || '') + '</p>' +
                        '</div>' +
                        '<div class="historique__meta">' +
                            '<p class="historique__date">' + formaterDate(h.date_delivrance || h.dateDelivrance) + '</p>' +
                            '<p class="historique__statut"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Delivree</p>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }
        } catch {
            listeHistorique.innerHTML = '<div style="padding: 16px; text-align: center; font-size: 13px; color: var(--texte-secondaire);">Erreur chargement historique.</div>';
        }
    }

    // ============================================
    // NOUVELLE FONCTION : Initialisation depuis l'URL
    // ============================================
    async function initialiserDepuisUrl() {
        var params = new URLSearchParams(window.location.search);
        var npiParam = params.get('npi');
        
        if (npiParam && npiParam.length === 10) {
            changerMode('npi');
            champSaisie.value = npiParam;
            boutonRechercher.disabled = true;
            boutonRechercher.textContent = 'Recherche...';
            
            try {
                await rechercherNpi(npiParam);
            } catch (err) {
                zoneResultats.hidden = true;
                afficherErreur(err.message || 'Erreur lors de la recherche automatique.');
            } finally {
                boutonRechercher.disabled = false;
                boutonRechercher.textContent = 'Rechercher';
            }
        }
    }

    document.getElementById('fermer-modale-delivrance').addEventListener('click', function () {
        modaleDelivrance.hidden = true;
        ordonnanceADelivrer = null;
    });
    document.getElementById('annuler-delivrance').addEventListener('click', function () {
        modaleDelivrance.hidden = true;
        ordonnanceADelivrer = null;
    });
    document.getElementById('confirmer-delivrance').addEventListener('click', confirmerDelivrance);

    // Démarrage
    chargerHistorique();
    initialiserDepuisUrl();
})();