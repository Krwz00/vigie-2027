# Trombinoscope des candidats

Déposez ici les portraits ronds, nommés `<id>.jpg` (ou `.png`, en ajustant le
champ `photo` dans `lib/candidates.ts`) :

```
lepen.jpg  bardella.jpg  philippe.jpg  melenchon.jpg  attal.jpg
glucksmann.jpg  retailleau.jpg  darmanin.jpg  zemmour.jpg
tondelier.jpg  roussel.jpg  dupontaignan.jpg
```

Recommandations :

- Format carré (ex. 256×256), cadrage visage centré — l'image est rognée en
  cercle (`object-cover` / `preserveAspectRatio="xMidYMid slice"`).
- Sources libres : Wikimedia Commons (licences CC BY / CC BY-SA — créditez).
- **Fallback automatique** : si un fichier est absent ou ne charge pas,
  l'interface affiche le monogramme sur fond de la couleur du candidat
  (aucune image cassée ne s'affiche). L'app fonctionne donc sans photos.
