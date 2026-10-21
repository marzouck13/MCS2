(function (global) {
    'use strict';

    var MIROTALK_DOMAINE = 'p2p.mirotalk.com';
    var PREFIXE_SALLE = 'MCS-';

    function construireUrlVisio(codeSession) {
        var nomSalle = PREFIXE_SALLE + codeSession;
        return 'https://' + MIROTALK_DOMAINE + '/join'
            + '?room=' + encodeURIComponent(nomSalle)
            + '&name=' + encodeURIComponent('Patient');
    }

    function construireTexte(codeSession) {
        var urlVisio = construireUrlVisio(codeSession);
        return 'Bonjour,\n\nVeuillez rejoindre ma teleconsultation Mon Carnet Sante.\n\n'
            + 'Code d\'acces : ' + codeSession + '\n\n'
            + 'Scannez le QR code joint ou cliquez sur le lien :\n' + urlVisio;
    }

    function recupererCanvasQr(conteneurId) {
        var conteneur = document.getElementById(conteneurId);
        if (!conteneur) return null;
        return conteneur.querySelector('canvas');
    }

    function genererDataUrl(conteneurId) {
        var canvas = recupererCanvasQr(conteneurId);
        if (!canvas) return null;
        try {
            return canvas.toDataURL('image/png');
        } catch {
            return null;
        }
    }

    async function partagerNatif(codeSession, conteneurId) {
        var texte = construireTexte(codeSession);
        var dataUrl = genererDataUrl(conteneurId);

        if (navigator.share) {
            if (dataUrl && navigator.canShare) {
                try {
                    var blob = await (await fetch(dataUrl)).blob();
                    var fichier = new File([blob], 'QR-' + codeSession + '.png', { type: 'image/png' });
                    if (navigator.canShare({ files: [fichier] })) {
                        await navigator.share({
                            title: 'Teleconsultation Mon Carnet Sante',
                            text: texte,
                            files: [fichier]
                        });
                        return { succes: true, methode: 'fichier' };
                    }
                } catch (err) {
                    if (err.name === 'AbortError') return { succes: false, annule: true };
                }
            }

            try {
                await navigator.share({
                    title: 'Teleconsultation Mon Carnet Sante',
                    text: texte
                });
                return { succes: true, methode: 'texte' };
            } catch (err) {
                if (err.name === 'AbortError') return { succes: false, annule: true };
                return { succes: false, message: err.message };
            }
        } else {
            try {
                await navigator.clipboard.writeText(texte);
                return { succes: true, methode: 'presse-papiers' };
            } catch {
                return { succes: false, message: 'Le partage natif n\'est pas supporte par ce navigateur.' };
            }
        }
    }

    function partageNatifDisponible() {
        return typeof navigator.share === 'function';
    }

    global.PartageVisio = {
        construireUrlVisio: construireUrlVisio,
        construireTexte: construireTexte,
        genererDataUrl: genererDataUrl,
        partagerNatif: partagerNatif,
        partageNatifDisponible: partageNatifDisponible
    };
})(window);