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

      // Affiche les ingrédients initiaux dès la première sélection
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
  const ratio = nb / recette.personnes;

  const titre = document.createElement('p');
  titre.textContent = `Ingrédients adaptés pour ${nb} personnes :`;
  liste.appendChild(titre);

  recette.ingredients.forEach(ingr => {
    const qte = (ingr.quantite * ratio).toFixed(2);
    const li = document.createElement('li');
    li.textContent = `${ingr.nom} : ${qte} ${ingr.unite}`;
    liste.appendChild(li);
  });
}
