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

      // Affiche les ingrédients de base quand une recette est sélectionnée
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
  titre.textContent = `Ingrédients pour ${recette.personnes} personnes :`;
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

  // Alerte douce si des unités sont en fraction
  const problematiques = recette.ingredients.filter(ingr => {
    if (/unités?|unité/i.test(ingr.unite)) {
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
    Comme on ne peut pas facilement utiliser une demi-unité (par exemple un demi-œuf), nous avons arrondi à l’unité supérieure pour vous garantir un bon résultat.`;

    liste.appendChild(msg);
  }

  // Message explicatif uniquement si nb demandé ≠ quantité finale
  const titre = document.createElement('p');
  if (nb !== nbCible) {
    titre.innerHTML = `
      Vous avez demandé une recette pour <strong>${nb}</strong> personnes.<br>
      La recette d'origine est prévue pour <strong>${base}</strong> personnes.<br>
      Afin de garantir des quantités simples à utiliser en cuisine (éviter les fractions comme 1,33 œufs), nous vous proposons une version adaptée pour <strong>${nbCible}</strong> personnes,
      ce qui correspond à <strong>${multiple}×</strong> la recette initiale.
    `;
  } else {
    titre.textContent = `Ingrédients adaptés pour ${nb} personnes :`;
  }
  liste.appendChild(titre);

  // Affichage des ingrédients adaptés
  recette.ingredients.forEach(ingr => {
    let qteCalc = ingr.quantite * ratio;

    if (/unités?|unité/i.test(ingr.unite)) {
      qteCalc = Math.ceil(qteCalc);
    } else {
      qteCalc = parseFloat(qteCalc.toFixed(2));
    }

    const li = document.createElement('li');
    li.textContent = `${ingr.nom} : ${qteCalc} ${ingr.unite}`;
    liste.appendChild(li);
  });
}
