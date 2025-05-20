  fetch("../data/recipes.json")
  .then(res => res.json())
  .then(recipes => {
    const container = document.getElementById("container-recipes")

    recipes.forEach(recipe => {
        const div = document.createElement("div")
        div.classList.add("recipe")
        div.innerHTML = `
          <h2>${recipe.nom}</h2>
          <p>Pour${recipe.personnes} personnes</p>
          <ul>
            ${recipe.ingredients.map(ingredient => `
              <li>${ingredient.quantite} ${ingredient.unite} ${ingredient.nom}</li>
            `).join("")}
          </ul>
        `
        container.appendChild(div)
        }) 
  })
 .catch(error => console.error("Erreur de chargement du JSON:", error));