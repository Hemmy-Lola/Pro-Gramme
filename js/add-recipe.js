function addIngredient() {
  const container = document.getElementById("ingredients");
  const div = document.createElement("div");
  div.classList.add("ingredient");

  div.innerHTML = `
    <input type="text" name="ingredient-nom[]" placeholder="Nom" required>
    <input type="number" name="ingredient-quantite[]" placeholder="Quantité" required>
    <input type="text" name="ingredient-unite[]" placeholder="Unité" required>
  `;

  container.appendChild(div);
}

document.getElementById("recipe-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = e.target;
  const nom = form.nom.value;
  const personnes = parseInt(form.personnes.value);

  const noms = Array.from(form.querySelectorAll('[name="ingredient-nom[]"]')).map(input => input.value);
  const quantites = Array.from(form.querySelectorAll('[name="ingredient-quantite[]"]')).map(input => parseFloat(input.value));
  const unites = Array.from(form.querySelectorAll('[name="ingredient-unite[]"]')).map(input => input.value);

  const ingredients = noms.map((nom, i) => ({
    nom,
    quantite: quantites[i],
    unite: unites[i]
  }));

  const newRecipe = { nom, personnes, ingredients };

  const existing = JSON.parse(localStorage.getItem("recipes")) || [];

  existing.push(newRecipe);

  localStorage.setItem("recipes", JSON.stringify(existing));

  alert("Recette ajoutée !");
  form.reset();

  window.location.href = "my-recipes.html";
});
