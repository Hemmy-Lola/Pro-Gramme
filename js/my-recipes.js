// Début Abraham LAWSON
const container = document.getElementById("container-recipes");
const recipes = JSON.parse(localStorage.getItem("recipes")) || [];

if (recipes.length === 0) {
  container.innerHTML = "<p>Aucune recette pour le moment.</p>";
} else {
  recipes.forEach(recipe => {
    const div = document.createElement("div");
    div.classList.add("recipe");
    div.innerHTML = `
      <h2>${recipe.nom}</h2>
      <p>Pour ${recipe.personnes} personnes</p>
      <ul>
        ${recipe.ingredients.map(ingredient => `
          <li>${ingredient.quantite} ${ingredient.unite} ${ingredient.nom}</li>
        `).join("")}
      </ul>
    `;
    container.appendChild(div);
  });
}
// Fin Abraham LAWSON