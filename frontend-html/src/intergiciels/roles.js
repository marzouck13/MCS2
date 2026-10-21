const ROLES = {
    PATIENT: 'patient',
    MEDECIN: 'medecin',
    INFIRMIER: 'infirmier',
    SAGE_FEMME: 'sage_femme',
    TECHNICIEN_LABO: 'technicien_labo',
    PHARMACIEN: 'pharmacien'
};

const exigerRoles = (...rolesAutorises) => (requete, reponse, suivant) => {
    if (!requete.utilisateur) {
        return reponse.redirect('/connexion');
    }
    if (!rolesAutorises.includes(requete.utilisateur.role)) {
        return reponse.redirect('/non-autorise');
    }
    return suivant();
};

module.exports = { ROLES, exigerRoles };