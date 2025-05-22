import {
  deduireIngredientsRecette,
  verifierDisponibiliteRecette,
  afficherStock,
  chargerStockJSON,
  getStock
} from './stock.js';

let recettes = [];

document.addEventListener('DOMContentLoaded', () => {
  chargerStockJSON().then(() => {
    // Affiche le stock initial dans la liste
    afficherStock();

    fetch('../data/recipes.json')
      .then(response => response.json())
      .then(data => {
        recettes = data;
        const select = document.getElementById('recette-select');

        data.forEach((recette, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = recette.nom;
          select.appendChild(option);
        });

        select.addEventListener('change', afficherIngredientsInitial);
      });

    document.getElementById('recette-form').addEventListener('submit', function (e) {
      e.preventDefault();
      adapterRecette();
    });
  });
});

function afficherIngredientsInitial() {
  const index = document.getElementById('recette-select').value;
  const liste = document.getElementById('ingredients-liste');
  liste.innerHTML = '';

  if (!recettes[index]) return;

  const recette = recettes[index];

  const titre = document.createElement('p');
  titre.textContent = `Ingredients pour ${recette.personnes} personnes :`;
  liste.appendChild(titre);

  recette.ingredients.forEach(ingr => {
    const li = document.createElement('li');
    li.textContent = `${ingr.nom} : ${ingr.quantite} ${ingr.unite}`;
    liste.appendChild(li);
  });
}

function adapterRecette() {
  const index = document.getElementById('recette-select').value;
  const nb = parseFloat(document.getElementById('nb-personnes').value);
  const liste = document.getElementById('ingredients-liste');
  liste.innerHTML = '';

  if (isNaN(nb) || nb <= 0 || !recettes[index]) {
    liste.innerHTML = '<li>Veuillez entrer un nombre de personnes valide.</li>';
    return;
  }

  const recette = recettes[index];
  const base = recette.personnes;
  const multiple = Math.ceil(nb / base);
  const nbCible = base * multiple;
  const ratio = nbCible / base;

  // Préparation de la recette adaptée
  const recetteAdaptee = recette.ingredients.map(ingr => {
    let qteCalc = ingr.quantite * ratio;
    if (/unites?|unite/i.test(ingr.unite)) {
      qteCalc = Math.ceil(qteCalc);
    } else {
      qteCalc = parseFloat(qteCalc.toFixed(2));
    }
    return { ...ingr, quantite: qteCalc };
  });

  // Vérification de disponibilité dans le stock
  if (!verifierDisponibiliteRecette(recetteAdaptee)) {
    const alerte = document.createElement('p');
    alerte.textContent = '❌ Ingredients insuffisants en stock pour cette recette.';
    alerte.style.color = 'red';

    // Détail des manques
    recetteAdaptee.forEach(({ nom, quantite, unite }) => {
      const key = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
      const stockItem = getStock()[key];
      const disponible = stockItem ? stockItem.quantite : 0;

      if (!stockItem || disponible < quantite) {
        const li = document.createElement('li');
        li.style.color = 'darkred';
        li.textContent = `⛔ ${nom} : requis ${quantite} ${unite}, disponible ${disponible} ${unite}`;
        liste.appendChild(li);
      }
    });

    liste.appendChild(alerte);
    return;
  }

  // Alerte douce si des unités sont en fraction
  const problematiques = recette.ingredients.filter(ingr => {
    if (/unites?|unite/i.test(ingr.unite)) {
      const calc = ingr.quantite * ratio;
      return calc % 1 !== 0;
    }
    return false;
  });

  if (problematiques.length > 0) {
    const msg = document.createElement('p');
    msg.style.color = '#aa5c00';
    msg.style.backgroundColor = '#fff4e5';
    msg.style.border = '1px solid #e0b76d';
    msg.style.padding = '0.5rem';
    msg.style.borderRadius = '4px';

    const noms = problematiques.map(p => p.nom).join(', ');

    msg.innerHTML = `ℹ️ Pour les ingrédients comme <strong>${noms}</strong>, la quantité calculée tombe sur un nombre non entier. 
    Comme on ne peut pas facilement utiliser une demi-unité (par exemple un demi-œuf), nous avons arrondi à l’unité supérieure pour garantir un bon résultat.`;

    liste.appendChild(msg);
  }

  // Message explicatif
  const titre = document.createElement('p');
  if (nb !== nbCible) {
    titre.innerHTML = `
      Vous avez demandé une recette pour <strong>${nb}</strong> personnes.<br>
      La recette d'origine est prévue pour <strong>${base}</strong> personnes.<br>
      Pour éviter les fractions compliquées, nous vous proposons une version adaptée pour <strong>${nbCible}</strong> personnes,
      ce qui correspond à <strong>${multiple}×</strong> la recette initiale.
    `;
  } else {
    titre.textContent = `Ingrédients adaptés pour ${nb} personnes :`;
  }
  liste.appendChild(titre);

  // Affichage des ingrédients adaptés
  recetteAdaptee.forEach(ingr => {
    const li = document.createElement('li');
    li.textContent = `${ingr.nom} : ${ingr.quantite} ${ingr.unite}`;
    liste.appendChild(li);
  });

  // Mise à jour du stock
  if (deduireIngredientsRecette(recetteAdaptee)) {
    sauvegarderStock(); // si tu as cette fonction, sinon la supprimer ou adapter
    afficherStock();
  } else {
    const erreur = document.createElement('p');
    erreur.textContent = '❌ Impossible de déduire les ingrédients du stock.';
    erreur.style.color = 'red';
    liste.appendChild(erreur);
  }
}
