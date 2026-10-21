(function (global) {
    'use strict';

    function getCanvas(conteneurId) {
        var conteneur = document.getElementById(conteneurId);
        if (!conteneur) return null;
        return conteneur.querySelector('canvas');
    }

    function telecharger(conteneurId, nomFichier) {
        var canvas = getCanvas(conteneurId);
        if (!canvas) {
            if (global.Alertes) global.Alertes.erreur('Impossible de générer l\'image du QR code.');
            return;
        }
        var lien = document.createElement('a');
        lien.href = canvas.toDataURL('image/png');
        lien.download = nomFichier;
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);
    }

    async function partager(conteneurId, nomFichier, titre, texte) {
        var canvas = getCanvas(conteneurId);
        if (!canvas) {
            if (global.Alertes) global.Alertes.erreur('Impossible de générer l\'image du QR code.');
            return;
        }

        var dataUrl = canvas.toDataURL('image/png');

        // Fallback si l'API Web Share n'est pas supportée
        if (!navigator.share) {
            telecharger(conteneurId, nomFichier);
            if (global.Alertes) global.Alertes.info('Le téléchargement du QR code a démarré.');
            return;
        }

        try {
            var blob = await (await fetch(dataUrl)).blob();
            var file = new File([blob], nomFichier, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: titre,
                    text: texte
                });
            } else {
                // Si le partage de fichier n'est pas supporté (ex: partage de texte uniquement)
                telecharger(conteneurId, nomFichier);
                if (global.Alertes) global.Alertes.info('Le téléchargement du QR code a démarré.');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('Partage échoué, fallback vers téléchargement', err);
                telecharger(conteneurId, nomFichier);
            }
        }
    }

    global.UtilsQR = {
        getCanvas: getCanvas,
        telecharger: telecharger,
        partager: partager
    };
})(window);