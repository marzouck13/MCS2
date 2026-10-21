(function (global) {
    'use strict';

    function formaterDateHeure(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var jour = String(d.getDate()).padStart(2, '0');
        var mois = String(d.getMonth() + 1).padStart(2, '0');
        var annee = d.getFullYear();
        var heures = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        return jour + '/' + mois + '/' + annee + ' ' + heures + ':' + minutes;
    }

    function formaterDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var jour = String(d.getDate()).padStart(2, '0');
        var mois = String(d.getMonth() + 1).padStart(2, '0');
        var annee = d.getFullYear();
        return jour + '/' + mois + '/' + annee;
    }

    function tronquer(texte, max) {
        if (!texte) return '';
        if (texte.length <= max) return texte;
        return texte.substring(0, max - 3) + '...';
    }

    function formaterNomProfessionnel(prenom, nom, specialite) {
        var nomComplet = ((prenom || '') + ' ' + (nom || '')).trim();
        if (!nomComplet) return 'Medecin non specifie';
        if (specialite) {
            return 'Dr ' + nomComplet + ' (' + specialite + ')';
        }
        return 'Dr ' + nomComplet;
    }

    function creerHtmlConsultation(c) {
        // Mapping snake_case (backend) -> variables locales
        var dateConsultation = c.dateConsultation || c.date_consultation;
        var medecinNom = c.medecinNom || c.medecin_nom;
        var medecinPrenom = c.medecinPrenom || c.medecin_prenom;
        var specialite = c.specialite;
        var etablissementNom = c.etablissementNom || c.etablissement_nom;
        var etablissementVille = c.etablissementVille || c.etablissement_ville;
        var tensionArterielle = c.tensionArterielle || c.tension_arterielle;

        var medecin = formaterNomProfessionnel(medecinPrenom, medecinNom, specialite);

        var constantes = [];
        if (tensionArterielle) constantes.push('Tension : ' + tensionArterielle + ' mmHg');
        if (c.temperature) constantes.push('Temp : ' + c.temperature + ' C');
        if (c.poids) constantes.push('Poids : ' + c.poids + ' kg');
        if (c.taille) constantes.push('Taille : ' + c.taille + ' cm');

        var constantesHtml = constantes.map(function (t) {
            return '<span class="constante-tag">' + t + '</span>';
        }).join('');

        return '<div class="carte-metier">' +
            '<div class="carte-metier__entete">' +
                '<div class="carte-metier__icone carte-metier__icone--primaire">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"></path><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"></path><circle cx="20" cy="10" r="2"></circle></svg>' +
                '</div>' +
                '<div>' +
                    '<p class="carte-metier__date">' + formaterDateHeure(dateConsultation) + '</p>' +
                    '<p class="carte-metier__medecin">' + medecin + '</p>' +
                    (etablissementNom ? '<p class="carte-metier__etablissement">' + etablissementNom + (etablissementVille ? ' - ' + etablissementVille : '') + '</p>' : '') +
                '</div>' +
            '</div>' +
            (c.motif ? '<div class="carte-metier__section"><p class="carte-metier__label">Motif</p><p class="carte-metier__texte">' + tronquer(c.motif, 200) + '</p></div>' : '') +
            (c.diagnostic ? '<div class="carte-metier__section"><p class="carte-metier__label">Diagnostic</p><p class="carte-metier__texte">' + tronquer(c.diagnostic, 200) + '</p></div>' : '') +
            (constantesHtml ? '<div class="carte-metier__constantes">' + constantesHtml + '</div>' : '') +
        '</div>';
    }

    function creerHtmlOrdonnance(o) {
        var code = o.codeOrdonnance || o.code_ordonnance || 'Code inconnu';
        var datePresc = o.datePrescription || o.date_prescription;
        var medecinNom = o.medecinNom || o.medecin_nom;
        var medecinPrenom = o.medecinPrenom || o.medecin_prenom;
        var specialite = o.specialite;
        var dureeTraitement = o.dureeTraitement || o.duree_traitement;
        var instructions = o.instructions;
        
        var meds = Array.isArray(o.medicaments) ? o.medicaments : [];
        var medsHtml = meds.slice(0, 5).map(function (m) {
            return '<li style="font-size:13px; margin-bottom:4px;">' +
                '<strong>' + (m.nom || 'Medicament') + '</strong>' +
                (m.dosage ? ' - ' + m.dosage : '') +
                (m.frequence ? ' - ' + m.frequence : '') +
                (m.duree ? ' - ' + m.duree : '') +
            '</li>';
        }).join('');

        if (meds.length > 5) {
            medsHtml += '<li style="font-size:12px; font-style:italic; color:var(--texte-secondaire); list-style:none;">+ ' + (meds.length - 5) + ' autre(s)</li>';
        }

        var medecin = formaterNomProfessionnel(medecinPrenom, medecinNom, specialite);

        return '<div class="carte-metier">' +
            '<div class="carte-metier__entete">' +
                '<div class="carte-metier__icone carte-metier__icone--succes">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' +
                '</div>' +
                '<div>' +
                    '<p class="carte-metier__code">' + code + '</p>' +
                    '<p class="carte-metier__medecin">Prescrite le ' + formaterDateHeure(datePresc) + ' par ' + medecin + '</p>' +
                '</div>' +
            '</div>' +
            '<div class="carte-metier__section">' +
                '<p class="carte-metier__label">Medicaments (' + meds.length + ')</p>' +
                '<ul style="margin:0; padding-left:16px;">' + medsHtml + '</ul>' +
            '</div>' +
            (dureeTraitement ? '<div class="carte-metier__section"><p class="carte-metier__label">Duree du traitement</p><p class="carte-metier__texte">' + dureeTraitement + '</p></div>' : '') +
            (instructions ? '<div style="background:var(--fond); padding:12px; border-radius:var(--rayon-md);"><p class="carte-metier__label">Instructions</p><p class="carte-metier__texte">' + instructions + '</p></div>' : '') +
        '</div>';
    }

    function creerHtmlResultat(r) {
        var typeExamen = r.typeExamen || r.type_examen;
        var dateExamen = r.dateExamen || r.date_examen;
        var dateCreation = r.dateCreation || r.date_creation;
        var laboratoire = r.laboratoire;
        var medecinNom = r.medecinNom || r.medecin_nom;
        var medecinPrenom = r.medecinPrenom || r.medecin_prenom;
        var specialite = r.specialite;

        var medecin = (medecinNom || medecinPrenom)
            ? formaterNomProfessionnel(medecinPrenom, medecinNom, specialite)
            : null;

        return '<div class="carte-metier">' +
            '<div class="carte-metier__entete">' +
                '<div class="carte-metier__icone carte-metier__icone--info">' +
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6v6l4 12H5L9 9V3z"></path><path d="M9 15h6"></path></svg>' +
                '</div>' +
                '<div>' +
                    '<p class="carte-metier__date">' + (typeExamen || 'Examen') + '</p>' +
                    '<p class="carte-metier__medecin">' + (dateExamen ? formaterDateHeure(dateExamen) : formaterDateHeure(dateCreation)) + '</p>' +
                    (laboratoire ? '<p class="carte-metier__etablissement">' + laboratoire + '</p>' : '') +
                    (medecin ? '<p class="carte-metier__etablissement">Prescripteur : ' + medecin + '</p>' : '') +
                '</div>' +
            '</div>' +
            (r.resultat ? '<div class="carte-metier__section"><p class="carte-metier__label">Resultat</p><p class="carte-metier__texte">' + tronquer(r.resultat, 300) + '</p></div>' : '') +
            (r.conclusion ? '<div style="background:var(--primaire-transparent); padding:12px; border-radius:var(--rayon-md);"><p class="carte-metier__label" style="color:var(--primaire);">Conclusion</p><p class="carte-metier__texte">' + tronquer(r.conclusion, 300) + '</p></div>' : '') +
        '</div>';
    }

    global.ComposantsMetier = {
        creerHtmlConsultation: creerHtmlConsultation,
        creerHtmlOrdonnance: creerHtmlOrdonnance,
        creerHtmlResultat: creerHtmlResultat
    };
})(window);