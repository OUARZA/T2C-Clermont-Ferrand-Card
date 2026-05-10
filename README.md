# T2C Clermont-Ferrand Card

Carte Lovelace pour Home Assistant permettant d'afficher les prochains passages exposes par l'integration `t2c_clermontferrand`.

## Fonctionnement

La carte se configure avec l'entite `passage_1` d'un arret. Elle reconstruit ensuite automatiquement les entites suivantes avec le meme prefixe :

```yaml
sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_passage_1
sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_passage_2
sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_passage_3
sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_passage_4
sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_passage_5
sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_perturbations_ligne
```

## Installation avec HACS

1. Dans HACS, ajouter ce depot comme depot personnalise.
2. Choisir la categorie `Dashboard`.
3. Installer `T2C Clermont-Ferrand Card`.
4. Redemarrer Home Assistant ou recharger le cache du navigateur si necessaire.

## Utilisation

Depuis l'editeur de dashboard Home Assistant :

1. Ajouter une nouvelle carte.
2. Choisir `T2C Clermont-Ferrand Card`.
3. Selectionner l'arret a afficher dans la liste. La liste affiche les capteurs `sensor.*_passage_1` deja presents dans Home Assistant.

Configuration YAML minimale :

```yaml
type: custom:t2c-clermontferrand-card
entity: sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_passage_1
```

Configuration complete :

```yaml
type: custom:t2c-clermontferrand-card
entity: sensor.ligne_b_direction_royat_pl_allard_arret_les_chapelles_passage_1
title: Les Chapelles
passages: 5
show_perturbations: true
color: "#b00010"
```

## Diagnostic

Si Home Assistant affiche `Custom element doesn't exist: t2c-clermontferrand-card`, ouvrir la console du navigateur sur le dashboard et executer :

```js
customElements.get("t2c-clermontferrand-card")
window.t2cClermontFerrandCardVersion
```

Le premier appel doit retourner une classe JavaScript et le second doit retourner la version chargee de la carte.

La ressource HACS doit etre de type `Module JavaScript` et pointer vers :

```text
/hacsfiles/t2c_clermontferrand_card/t2c_clermontferrand_card.js
```

## Options

| Option | Obligatoire | Defaut | Description |
| --- | --- | --- | --- |
| `entity` | Oui |  | Entite `passage_1` de l'arret a afficher. |
| `title` | Non | Nom de l'entite | Titre affiche en haut de la carte. |
| `passages` | Non | `5` | Nombre de passages a afficher, entre 1 et 10. |
| `show_perturbations` | Non | `true` | Affiche le bloc perturbation si l'entite existe. |
| `color` | Non | `#b00010` | Couleur principale de la ligne. |

## Convention d'entites attendue

La carte attend des entites nommees selon ce schema :

```text
sensor.ligne_X_direction_YYY_arret_ZZZ_passage_1
sensor.ligne_X_direction_YYY_arret_ZZZ_passage_2
sensor.ligne_X_direction_YYY_arret_ZZZ_perturbations_ligne
```

Chaque capteur de passage peut contenir les attributs suivants :

```yaml
destination: Royat Pl. Allard
info: Temps reel
```

L'etat du capteur est utilise comme heure ou temps de depart.
