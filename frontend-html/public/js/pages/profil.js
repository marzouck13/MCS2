(function () {
    'use strict';

    function masquerNpi(npi) {
        if (!npi || npi.length < 4) return npi || '';
        return npi.substring(0, 2) + '******' + npi.substring(npi.length - 2);
    }

    function formaterRole(role) {
        var map = {
            medecin: 'Medecin',
            infirmier: 'Infirmier',
            sage_femme: 'Sage-femme',
            technicien_labo: 'Technicien laboratoire',
            pharmacien: 'Pharmacien'
        };
        return map[role] || role;
    }

    async function chargerProfil() {
        try {
            var rep = await window.ClientMCS.api.get('/api/auth/profil');
            if (!rep.succes || !rep.utilisateur) {
                throw new Error('Profil introuvable.');
            }

            var u = rep.utilisateur;
            var nomComplet = (u.prenom || '') + ' ' + (u.nom || '');
            var estMedecin = u.role === 'medecin' && u.specialite;

            document.getElementById('profil-nom').textContent = (estMedecin ? 'Dr ' : '') + nomComplet;
            
            var roleAffiche = formaterRole(u.role);
            if (u.specialite) roleAffiche += ' - ' + u.specialite;
            document.getElementById('profil-role').textContent = roleAffiche;

            document.getElementById('profil-npi').textContent = masquerNpi(u.npiProfessionnel || u.npi);
            document.getElementById('profil-telephone').textContent = u.telephone || 'Non renseigne';
            document.getElementById('profil-email').textContent = u.email || 'Non renseigne';

            var elEtablissement = document.getElementById('profil-etablissement');
            if (u.etablissementNom) {
                elEtablissement.textContent = u.etablissementNom;
                elEtablissement.style.color = '';
                elEtablissement.style.fontStyle = '';
            } else {
                elEtablissement.textContent = 'Aucun etablissement renseigne';
                elEtablissement.style.color = 'var(--texte-desactive)';
                elEtablissement.style.fontStyle = 'italic';
            }

            document.getElementById('chargement').hidden = true;
            document.getElementById('contenu-profil').hidden = false;
        } catch (err) {
            window.Alertes.erreur(err.message || 'Erreur lors du chargement du profil.');
            document.getElementById('chargement').textContent = 'Erreur de chargement.';
        }
    }

    document.getElementById('bouton-deconnexion').addEventListener('click', async function () {
        try {
            await window.ClientMCS.fermerSession();
        } finally {
            window.location.href = '/connexion';
        }
    });

    chargerProfil();
})();