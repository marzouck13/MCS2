const express = require('express');
const { verifierJeton } = require('../intergiciels/auth');
const { exigerRoles, ROLES } = require('../intergiciels/roles');
const { cheminPage } = require('../utilitaires/chemins');

const routeur = express.Router();

// ============================================
// PAGES PUBLIQUES
// ============================================
routeur.get('/', (requete, reponse) => reponse.sendFile(cheminPage('accueil.html')));
routeur.get('/accueil', (requete, reponse) => reponse.sendFile(cheminPage('accueil.html')));

routeur.get('/connexion', (requete, reponse) =>
    reponse.sendFile(cheminPage('connexion.html'))
);

routeur.get('/inscription', (requete, reponse) =>
    reponse.sendFile(cheminPage('inscription.html'))
);

routeur.get('/patient/connexion', (requete, reponse) =>
    reponse.sendFile(cheminPage('patient-connexion.html'))
);

routeur.get('/patient/inscription', (requete, reponse) =>
    reponse.sendFile(cheminPage('patient-inscription.html'))
);

routeur.get('/non-autorise', (requete, reponse) =>
    reponse.sendFile(cheminPage('non-autorise.html'))
);

// ============================================
// PAGES PATIENT PROTÉGÉES
// ============================================
routeur.get(
    '/patient/tableau-bord',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-tableau-bord.html'))
);

routeur.get(
    '/patient/dossier',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-dossier.html'))
);

routeur.get(
    '/patient/qr-code',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-qr-code.html'))
);

routeur.get(
    '/patient/qr-urgence',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-qr-urgence.html'))
);

routeur.get(
    '/patient/qr-proches',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-qr-proches.html'))
);

routeur.get(
    '/patient/journal-acces',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-journal-acces.html'))
);

routeur.get(
    '/patient/consentements',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-consentements.html'))
);

routeur.get(
    '/patient/teleconsultation',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-teleconsultation.html'))
);

routeur.get(
    '/patient/visio/:codeSession',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-salle-visio.html'))
);

routeur.get(
    '/patient/profil',
    verifierJeton,
    exigerRoles(ROLES.PATIENT),
    (requete, reponse) => reponse.sendFile(cheminPage('patient-profil.html'))
);

// ============================================
// PAGES PROFESSIONNEL DE SANTÉ
// ============================================
routeur.get(
    '/tableau-bord',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.INFIRMIER, ROLES.SAGE_FEMME, ROLES.TECHNICIEN_LABO),
    (requete, reponse) => reponse.sendFile(cheminPage('tableau-bord.html'))
);

routeur.get(
    '/recherche-patient',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.INFIRMIER, ROLES.SAGE_FEMME, ROLES.TECHNICIEN_LABO, ROLES.PHARMACIEN),
    (requete, reponse) => reponse.sendFile(cheminPage('recherche-patient.html'))
);

routeur.get(
    '/dossier/:npi',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.INFIRMIER, ROLES.SAGE_FEMME, ROLES.TECHNICIEN_LABO),
    (requete, reponse) => reponse.sendFile(cheminPage('dossier-patient.html'))
);

routeur.get(
    '/consultation/:npi',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.SAGE_FEMME),
    (requete, reponse) => reponse.sendFile(cheminPage('consultation.html'))
);

routeur.get(
    '/ordonnance',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.SAGE_FEMME),
    (requete, reponse) => reponse.sendFile(cheminPage('ordonnance.html'))
);

routeur.get(
    '/ordonnance/:consultationId',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.SAGE_FEMME),
    (requete, reponse) => reponse.sendFile(cheminPage('ordonnance.html'))
);

routeur.get(
    '/pharmacie',
    verifierJeton,
    exigerRoles(ROLES.PHARMACIEN),
    (requete, reponse) => reponse.sendFile(cheminPage('portail-pharmacie.html'))
);

routeur.get(
    '/scanner-qr',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.INFIRMIER, ROLES.SAGE_FEMME, ROLES.TECHNICIEN_LABO, ROLES.PHARMACIEN),
    (requete, reponse) => reponse.sendFile(cheminPage('scanner-qr.html'))
);

routeur.get(
    '/teleconsultation',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.SAGE_FEMME),
    (requete, reponse) => reponse.sendFile(cheminPage('teleconsultation.html'))
);

routeur.get(
    '/visio/:codeSession',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.SAGE_FEMME),
    (requete, reponse) => reponse.sendFile(cheminPage('salle-visio.html'))
);

routeur.get(
    '/profil',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.INFIRMIER, ROLES.SAGE_FEMME, ROLES.TECHNICIEN_LABO, ROLES.PHARMACIEN),
    (requete, reponse) => reponse.sendFile(cheminPage('profil.html'))
);

routeur.get(
    '/urgence',
    verifierJeton,
    exigerRoles(ROLES.MEDECIN, ROLES.INFIRMIER),
    (requete, reponse) => reponse.sendFile(cheminPage('mode-urgence.html'))
);

routeur.get('/guide-patient', (requete, reponse) => 
    reponse.sendFile(cheminPage('guide-patient.html'))
);
routeur.get('/faq-technique', (requete, reponse) => 
    reponse.sendFile(cheminPage('faq-technique.html'))
);
routeur.get('/cgu', (requete, reponse) => 
    reponse.sendFile(cheminPage('cgu.html'))
);
routeur.get('/confidentialite', (requete, reponse) => 
    reponse.sendFile(cheminPage('confidentialite.html'))
);

module.exports = routeur;