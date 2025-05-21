import {
  deduireIngredientsRecette,
  verifierDisponibiliteRecette,
  ajouterAuStock,
  afficherStock
} from './stock.js';

let recettes = [];

document.addEventListener('DOMContentLoaded', () => {
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

  // Preparation de la recette adaptee
  const recetteAdaptee = recette.ingredients.map(ingr => {
    let qteCalc = ingr.quantite * ratio;
    if (/unites?|unite/i.test(ingr.unite)) {
      qteCalc = Math.ceil(qteCalc);
    } else {
      qteCalc = parseFloat(qteCalc.toFixed(2));
    }
    return { ...ingr, quantite: qteCalc };
  });

  // Verification de disponibilite dans le stock
  if (!verifierDisponibiliteRecette(recetteAdaptee)) {
    const alerte = document.createElement('p');
    alerte.textContent = '❌ Ingredients insuffisants en stock pour cette recette.';
    alerte.style.color = 'red';
    liste.appendChild(alerte);
    return;
  }

  // Alerte douce si des unites sont en fraction
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

    msg.innerHTML = `ℹ️ Pour les ingredients comme <strong>${noms}</strong>, la quantite calculee tombe sur un nombre non entier. 
    Comme on ne peut pas facilement utiliser une demi-unite (par exemple un demi-oeuf), nous avons arrondi a l’unite superieure pour garantir un bon resultat.`;

    liste.appendChild(msg);
  }

  // Message explicatif
  const titre = document.createElement('p');
  if (nb !== nbCible) {
    titre.innerHTML = `
      Vous avez demande une recette pour <strong>${nb}</strong> personnes.<br>
      La recette d'origine est prevue pour <strong>${base}</strong> personnes.<br>
      Pour eviter les fractions compliquees, nous vous proposons une version adaptee pour <strong>${nbCible}</strong> personnes,
      ce qui correspond a <strong>${multiple}×</strong> la recette initiale.
    `;
  } else {
    titre.textContent = `Ingredients adaptes pour ${nb} personnes :`;
  }
  liste.appendChild(titre);

  // Affichage des ingredients adaptes
  recetteAdaptee.forEach(ingr => {
    const li = document.createElement('li');
    li.textContent = `${ingr.nom} : ${ingr.quantite} ${ingr.unite}`;
    liste.appendChild(li);
  });

  // Mise a jour du stock
  deduireIngredientsRecette(recetteAdaptee);
  afficherStock();
}
