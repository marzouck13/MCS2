(function () {
    'use strict';

    var chemin = window.location.pathname.split('/');
    var npi = chemin[chemin.length - 1];

    var roleUtilisateur = null;
    var dossierActuel = null;
    var codeSessionCourant = null;

    var elChargement = document.getElementById('chargement');
    var elErreur = document.getElementById('zone-erreur');
    var elTexteErreur = document.getElementById('texte-erreur');
    var elContenu = document.getElementById('contenu-dossier');

    var listeConsultations = document.getElementById('liste-consultations');
    var listeOrdonnances = document.getElementById('liste-ordonnances');
    var listeResultats = document.getElementById('liste-resultats');

    function surClic(id, callback) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', callback);
    }

    function masquerNpi(n) {
        if (!n || n.length < 4) return n || '';
        return n.substring(0, 2) + '******' + n.substring(n.length - 2);
    }

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

    function afficherErreur(message) {
        elChargement.hidden = true;
        elTexteErreur.textContent = message;
        elErreur.hidden = false;
    }

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

    function construireEntete(patient, consentement) {
        document.getElementById('patient-nom').textContent = (patient.prenom || '') + ' ' + (patient.nom || '');
        
        var details = ['NPI : ' + masquerNpi(patient.npi)];
        var age = formaterAge(patient.dateNaissance);
        if (age !== null) details.push(age + ' ans');
        if (patient.sexe === 'M') details.push('Masculin');
        if (patient.sexe === 'F') details.push('Feminin');
        document.getElementById('patient-details').textContent = details.join(' - ');

        var badge = document.getElementById('badge-consentement');
        if (consentement && consentement.type) {
            badge.innerHTML = '<span class="badge badge--succes"><span class="badge__point"></span>Acces ' + (consentement.type === 'general' ? 'general' : 'specifique') + '</span>';
        } else {
            badge.innerHTML = '';
        }

        var badges = document.getElementById('patient-badges');
        badges.innerHTML = '';
        if (patient.groupeSanguin) {
            badges.innerHTML += '<span class="badge badge--danger"><span class="badge__point"></span>Groupe ' + patient.groupeSanguin + '</span>';
        }
        if (patient.allergies) {
            badges.innerHTML += '<span class="badge badge--avertissement">Allergies : ' + patient.allergies + '</span>';
        }
        if (patient.maladiesChroniques) {
            badges.innerHTML += '<span class="badge badge--info">Chronique : ' + patient.maladiesChroniques + '</span>';
        }

        var zoneUrgence = document.getElementById('patient-urgence');
        if (patient.contactUrgenceNom || patient.contactUrgenceTelephone) {
            zoneUrgence.hidden = false;
            zoneUrgence.innerHTML = '<div class="dossier-entete__urgence">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' +
                '<span><strong>Urgence :</strong> ' + (patient.contactUrgenceNom || '') + (patient.contactUrgenceTelephone ? ' - ' + patient.contactUrgenceTelephone : '') + '</span>' +
            '</div>';
        } else {
            zoneUrgence.hidden = true;
            zoneUrgence.innerHTML = '';
        }
    }

    function construireActions() {
        var conteneur = document.getElementById('actions-dossier');
        conteneur.innerHTML = '';

        var peutPrescrire = (roleUtilisateur === 'medecin' || roleUtilisateur === 'sage_femme');
        var peutAjouterResultat = ['medecin', 'infirmier', 'sage_femme', 'technicien_labo'].indexOf(roleUtilisateur) !== -1;

        if (peutPrescrire) {
            var btnConsultation = document.createElement('a');
            btnConsultation.href = '/consultation/' + npi;
            btnConsultation.className = 'bouton bouton--primaire';
            btnConsultation.textContent = 'Nouvelle consultation';
            conteneur.appendChild(btnConsultation);

            var btnOrdonnance = document.createElement('a');
            btnOrdonnance.href = '/ordonnance?npi=' + npi;
            btnOrdonnance.className = 'bouton bouton--secondaire';
            btnOrdonnance.textContent = 'Nouvelle ordonnance';
            conteneur.appendChild(btnOrdonnance);

            var btnTeleconsultation = document.createElement('button');
            btnTeleconsultation.type = 'button';
            btnTeleconsultation.className = 'bouton bouton--neutre';
            btnTeleconsultation.textContent = 'Teleconsultation';
            btnTeleconsultation.addEventListener('click', genererTeleconsultation);
            conteneur.appendChild(btnTeleconsultation);
        }

        if (peutAjouterResultat) {
            var btnResultat = document.createElement('button');
            btnResultat.type = 'button';
            btnResultat.className = 'bouton bouton--neutre';
            btnResultat.textContent = 'Ajouter un resultat';
            btnResultat.addEventListener('click', function () {
                document.getElementById('modale-resultat').hidden = false;
            });
            conteneur.appendChild(btnResultat);
        }
    }

    function peuplerListes(dossier) {
        var consultations = dossier.consultations || [];
        var ordonnances = dossier.ordonnancesActives || [];
        var resultats = dossier.resultatsExamens || [];

        document.getElementById('compteur-consultations').textContent = consultations.length;
        document.getElementById('compteur-ordonnances').textContent = ordonnances.length;
        document.getElementById('compteur-resultats').textContent = resultats.length;

        listeConsultations.innerHTML = consultations.length === 0 
            ? '<div class="etat-vide"><div class="etat-vide__icone"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path><circle cx="20" cy="10" r="2"></circle></svg></div><p class="etat-vide__titre">Aucune consultation</p><p class="etat-vide__desc">Les consultations de ce patient apparaitront ici.</p></div>'
            : consultations.map(window.ComposantsMetier.creerHtmlConsultation).join('');

        listeOrdonnances.innerHTML = ordonnances.length === 0
            ? '<div class="etat-vide"><div class="etat-vide__icone"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div><p class="etat-vide__titre">Aucune ordonnance active</p><p class="etat-vide__desc">Les ordonnances du patient apparaitront ici.</p></div>'
            : ordonnances.map(window.ComposantsMetier.creerHtmlOrdonnance).join('');

        listeResultats.innerHTML = resultats.length === 0
            ? '<div class="etat-vide"><div class="etat-vide__icone"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v6l4 12H5L9 9V3z"></path><path d="M9 15h6"></path></svg></div><p class="etat-vide__titre">Aucun resultat</p><p class="etat-vide__desc">Les resultats d examens apparaitront ici.</p></div>'
            : resultats.map(window.ComposantsMetier.creerHtmlResultat).join('');
    }

    function configurerOnglets() {
        var onglets = document.querySelectorAll('.onglet');
        onglets.forEach(function (onglet) {
            onglet.addEventListener('click', function () {
                onglets.forEach(function (o) { o.classList.remove('onglet--actif'); });
                onglet.classList.add('onglet--actif');

                listeConsultations.hidden = true;
                listeOrdonnances.hidden = true;
                listeResultats.hidden = true;

                document.getElementById('liste-' + onglet.dataset.cible).hidden = false;
            });
        });
    }

    async function genererTeleconsultation() {
        try {
            var rep = await window.ClientMCS.api.post('/api/qr-code/teleconsultation', {
                motif: 'Teleconsultation depuis le dossier patient',
                dureeValiditeMinutes: 30
            });

            if (rep.succes && rep.session) {
                codeSessionCourant = rep.session.codeSession;
                document.getElementById('code-session').textContent = rep.session.codeSession;
                document.getElementById('lien-visio').href = '/visio/' + rep.session.codeSession;
                
                var conteneurQr = document.getElementById('qrcode-teleconsultation');
                conteneurQr.innerHTML = '';
                new QRCode(conteneurQr, {
                    text: rep.session.code,
                    width: 200,
                    height: 200,
                    colorDark: '#0F4C81',
                    colorLight: '#FFFFFF'
                });

                document.getElementById('modale-teleconsultation').hidden = false;
            } else {
                window.Alertes.erreur(rep.message || 'Erreur lors de la creation.');
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur reseau.');
        }
    }

    async function chargerDossier() {
        await chargerRole();
        try {
            var rep = await window.ClientMCS.api.get('/api/medecin/dossier/' + npi);
            if (!rep.succes) throw new Error(rep.message || 'Dossier introuvable.');
            
            dossierActuel = rep.dossier;
            
            construireEntete(rep.patient, rep.consentement);
            construireActions();
            peuplerListes(rep.dossier);
            configurerOnglets();

            elChargement.hidden = true;
            elContenu.hidden = false;
        } catch (err) {
            afficherErreur(err.message || 'Impossible de charger le dossier.');
        }
    }

    surClic('fermer-modale-resultat', function () {
        document.getElementById('modale-resultat').hidden = true;
    });
    surClic('annuler-resultat', function () {
        document.getElementById('modale-resultat').hidden = true;
    });

    var formulaireResultat = document.getElementById('formulaire-resultat');
    if (formulaireResultat) {
        formulaireResultat.addEventListener('submit', async function (ev) {
            ev.preventDefault();
            var btn = document.getElementById('soumettre-resultat');
            btn.disabled = true;
            btn.textContent = 'Enregistrement...';

            try {
                var rep = await window.ClientMCS.api.post('/api/medecin/resultat-examen', {
                    npi: npi,
                    typeExamen: document.getElementById('resultat-type').value,
                    laboratoire: document.getElementById('resultat-labo').value,
                    resultat: document.getElementById('resultat-texte').value,
                    conclusion: document.getElementById('resultat-conclusion').value,
                    dateExamen: new Date().toISOString()
                });

                if (rep.succes) {
                    document.getElementById('modale-resultat').hidden = true;
                    document.getElementById('formulaire-resultat').reset();
                    window.Alertes.succes('Resultat d examen enregistre avec succes.');
                    chargerDossier();
                } else {
                    window.Alertes.erreur(rep.message || 'Erreur lors de l ajout.');
                }
            } catch (err) {
                window.Alertes.erreur(err.message || 'Erreur reseau.');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Enregistrer';
            }
        });
    }

    surClic('fermer-modale-teleconsultation', function () {
        document.getElementById('modale-teleconsultation').hidden = true;
        codeSessionCourant = null;
    });
    surClic('fermer-teleconsultation', function () {
        document.getElementById('modale-teleconsultation').hidden = true;
        codeSessionCourant = null;
    });

    surClic('bouton-partager', async function () {
        if (!codeSessionCourant) return;
        
        var rep = await window.PartageVisio.partagerNatif(codeSessionCourant, 'qrcode-teleconsultation');
        
        if (rep.succes) {
            if (rep.methode === 'presse-papiers') {
                window.Alertes.succes('Le texte et le lien ont ete copies dans le presse-papiers.', 'Partage');
            }
        } else if (!rep.annule) {
            window.Alertes.erreur(rep.message || 'Le partage a echoue.');
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', chargerDossier);
    } else {
        chargerDossier();
    }
})();