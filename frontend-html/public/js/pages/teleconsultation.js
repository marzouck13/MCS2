(function () {
    'use strict';

    if (!window.Alertes || !window.PartageVisio) {
        console.error('Erreur critique : les scripts alertes.js ou partage-visio.js ne sont pas charges.');
        return;
    }

    var listeSessions = document.getElementById('liste-sessions');
    var zoneChargement = document.getElementById('zone-chargement');
    var boutonNouvelleSession = document.getElementById('bouton-nouvelle-session');
    var modaleCreation = document.getElementById('modale-creation');
    var modaleQr = document.getElementById('modale-qr');
    var formulaireCreation = document.getElementById('formulaire-creation');
    var boutonGenerer = document.getElementById('bouton-generer');

    var sessionAffichee = null;

    function formaterDateHeure(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var jour = String(d.getDate()).padStart(2, '0');
        var mois = String(d.getMonth() + 1).padStart(2, '0');
        var heures = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        return jour + '/' + mois + '/' + d.getFullYear() + ' ' + heures + ':' + minutes;
    }

    function badgeStatut(statut) {
        var map = {
            en_attente: 'avertissement',
            active: 'succes',
            terminee: 'neutre',
            annulee: 'danger',
            expiree: 'neutre'
        };
        var variante = map[statut] || 'neutre';
        var texte = statut.replace(/_/g, ' ');
        texte = texte.charAt(0).toUpperCase() + texte.slice(1);
        var point = ['avertissement', 'succes'].indexOf(variante) !== -1 ? '<span class="badge__point"></span>' : '';
        return '<span class="badge badge--' + variante + '">' + point + texte + '</span>';
    }

    async function chargerSessions() {
        zoneChargement.hidden = false;
        listeSessions.hidden = true;
        
        try {
            var rep = await window.ClientMCS.api.get('/api/qr-code/teleconsultation/mes-sessions');
            var sessions = (rep.succes && rep.sessions) ? rep.sessions : [];

            if (sessions.length === 0) {
                listeSessions.innerHTML =
                    '<div class="teleconsultation__vide">' +
                        '<div class="teleconsultation__vide-icone">' +
                            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path><rect x="3" y="6" width="12" height="12" rx="2"></rect></svg>' +
                        '</div>' +
                        '<h2 class="teleconsultation__vide-titre">Aucune session de teleconsultation</h2>' +
                        '<p class="teleconsultation__vide-desc">Creez une session pour inviter un patient a vous rejoindre.</p>' +
                        '<button type="button" class="bouton bouton--secondaire" id="bouton-premiere-session">Creer ma premiere session</button>' +
                    '</div>';
                document.getElementById('bouton-premiere-session').addEventListener('click', function () {
                    modaleCreation.hidden = false;
                });
            } else {
                listeSessions.innerHTML = sessions.map(function (s) {
                    var actions = '';
                    var sessionActive = ['terminee', 'annulee', 'expiree'].indexOf(s.statut) === -1;

                    if (sessionActive) {
                        actions += '<button type="button" class="bouton bouton--neutre bouton--petit" data-action="qr" data-id="' + s.id + '">Partager</button>';
                        actions += '<a href="/visio/' + s.code_session + '" class="bouton bouton--primaire bouton--petit" style="text-decoration: none;">Rejoindre</a>';
                        actions += '<button type="button" class="bouton bouton--secondaire bouton--petit" data-action="terminer" data-id="' + s.id + '">Terminer</button>';
                    }

                    if (s.statut === 'en_attente') {
                        actions += '<button type="button" class="bouton bouton--danger bouton--petit" data-action="annuler" data-id="' + s.id + '">Annuler</button>';
                    }

                    return '<div class="session-carte">' +
                        '<div class="session-carte__haut">' +
                            '<div class="session-carte__icone">' +
                                '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"></path><rect x="3" y="6" width="12" height="12" rx="2"></rect></svg>' +
                            '</div>' +
                            '<div style="flex: 1;">' +
                                '<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">' +
                                    '<p class="session-carte__code">' + s.code_session + '</p>' +
                                    badgeStatut(s.statut) +
                                '</div>' +
                                '<p class="session-carte__meta">Motif : ' + (s.motif || 'Non specifie') + '</p>' +
                                '<p class="session-carte__date">Creee le ' + formaterDateHeure(s.date_creation) + '</p>' +
                            '</div>' +
                        '</div>' +
                        '<div class="session-carte__actions">' + actions + '</div>' +
                    '</div>';
                }).join('');

                attacherEvenements(sessions);
            }

            zoneChargement.hidden = true;
            listeSessions.hidden = false;
        } catch (err) {
            window.Alertes.erreur('Impossible de charger les sessions : ' + err.message);
            zoneChargement.hidden = true;
        }
    }

    function attacherEvenements(sessions) {
        listeSessions.querySelectorAll('button[data-action]').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                var action = btn.getAttribute('data-action');
                var id = btn.getAttribute('data-id');

                if (action === 'qr') {
                    var session = sessions.find(function (s) { return s.id === id; });
                    if (session) {
                        afficherQr(session);
                    }

                } else if (action === 'terminer') {
                    var sessionCible = sessions.find(function (s) { return s.id === id; });
                    var messageConfirmation = sessionCible && sessionCible.statut === 'en_attente'
                        ? 'Marquer cette session comme terminee ?\n\nLa session sera close. Le QR code associe ne sera plus utilisable.'
                        : 'Voulez-vous vraiment terminer cette session ?';

                    if (confirm(messageConfirmation)) {
                        try {
                            var repTerminer = await window.ClientMCS.api.post('/api/qr-code/teleconsultation/' + id + '/terminer', {});
                            if (repTerminer.succes) {
                                window.Alertes.succes('Session terminee.');
                                chargerSessions();
                            } else {
                                window.Alertes.erreur(repTerminer.message || 'Erreur.');
                            }
                        } catch (errTerminer) {
                            window.Alertes.erreur(errTerminer.message || 'Erreur reseau.');
                        }
                    }

                } else if (action === 'annuler') {
                    if (confirm('Voulez-vous vraiment annuler cette session ?\n\nLe QR code associe ne sera plus utilisable.')) {
                        try {
                            var rep = await window.ClientMCS.api.post('/api/qr-code/teleconsultation/' + id + '/annuler', {});
                            if (rep.succes) {
                                window.Alertes.succes('Session annulee.');
                                chargerSessions();
                            } else {
                                window.Alertes.erreur(rep.message || 'Erreur lors de l annulation.');
                            }
                        } catch (err) {
                            window.Alertes.erreur(err.message || 'Erreur reseau.');
                        }
                    }
                }
            });
        });
    }

    function afficherQr(session) {
        sessionAffichee = session;
        document.getElementById('code-session-qr').textContent = session.code_session;

        var conteneur = document.getElementById('qrcode-session');
        conteneur.innerHTML = '';
        new QRCode(conteneur, {
            text: session.code_qr,
            width: 200,
            height: 200,
            colorDark: '#0F4C81',
            colorLight: '#FFFFFF'
        });

        modaleQr.hidden = false;
    }

    boutonNouvelleSession.addEventListener('click', function () {
        modaleCreation.hidden = false;
    });

    document.getElementById('fermer-modale-creation').addEventListener('click', function () {
        modaleCreation.hidden = true;
    });
    document.getElementById('annuler-creation').addEventListener('click', function () {
        modaleCreation.hidden = true;
    });

    formulaireCreation.addEventListener('submit', async function (ev) {
        ev.preventDefault();
        boutonGenerer.disabled = true;
        boutonGenerer.textContent = 'Creation...';

        try {
            var motif = document.getElementById('champ-motif').value.trim();
            var rep = await window.ClientMCS.api.post('/api/qr-code/teleconsultation', {
                motif: motif || 'Teleconsultation',
                dureeValiditeMinutes: 30
            });

            if (rep.succes && rep.session) {
                modaleCreation.hidden = true;
                formulaireCreation.reset();
                afficherQr({
                    code_session: rep.session.codeSession,
                    code_qr: rep.session.code,
                    motif: rep.session.motif,
                    id: rep.session.id
                });
                chargerSessions();
            } else {
                window.Alertes.erreur(rep.message || 'Erreur lors de la creation.');
            }
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur reseau.');
        } finally {
            boutonGenerer.disabled = false;
            boutonGenerer.textContent = 'Generer la session';
        }
    });

    document.getElementById('fermer-modale-qr').addEventListener('click', function () {
        modaleQr.hidden = true;
        sessionAffichee = null;
    });
    document.getElementById('fermer-qr').addEventListener('click', function () {
        modaleQr.hidden = true;
        sessionAffichee = null;
    });

    document.getElementById('bouton-partager').addEventListener('click', async function () {
        if (!sessionAffichee) return;
        
        var rep = await window.PartageVisio.partagerNatif(sessionAffichee.code_session, 'qrcode-session');
        
        if (rep.succes) {
            if (rep.methode === 'presse-papiers') {
                window.Alertes.succes('Le texte et le lien ont ete copies dans le presse-papiers.', 'Partage');
            }
        } else if (!rep.annule) {
            window.Alertes.erreur(rep.message || 'Le partage a echoue.');
        }
    });

    chargerSessions();
})();