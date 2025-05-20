const recipes = [
    {
      "nom": "Gâteau au chocolat",
      "personnes": 4,
      "ingredients": [
        { "nom": "Farine", "quantite": 200, "unite": "g" },
        { "nom": "Sucre", "quantite": 100, "unite": "g" },
        { "nom": "Œufs", "quantite": 3, "unite": "unités" }
      ]
    },
    {
      "nom": "Crêpes",
      "personnes": 2,
      "ingredients": [
        { "nom": "Farine", "quantite": 125, "unite": "g" },
        { "nom": "Lait", "quantite": 250, "unite": "ml" },
        { "nom": "Œufs", "quantite": 1, "unite": "unité" }
      ]
    },
    {
      "nom": "Soupe de légumes",
      "personnes": 6,
      "ingredients": [
        { "nom": "Carottes", "quantite": 500, "unite": "g" },
        { "nom": "Pommes de terre", "quantite": 400, "unite": "g" },
        { "nom": "Poireaux", "quantite": 2, "unite": "unités" }
      ]
    }
  ]

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