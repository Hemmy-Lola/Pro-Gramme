let stock = {};

export function ajouterAuStock(nom, quantite, unite) {
  const cle = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
  if (stock[cle]) {
    stock[cle].quantite += quantite;
  } else {
    stock[cle] = { nom, quantite, unite };
  }
}

export function retirerDuStock(nom, quantite, unite) {
  const cle = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
  if (!stock[cle]) {
    console.warn(`L'ingrédient "${nom}" n'existe pas dans le stock.`);
    return false;
  }

  if (stock[cle].quantite < quantite) {
    console.warn(`Pas assez de "${nom}" dans le stock.`);
    return false;
  }

  stock[cle].quantite -= quantite;
  return true;
}

export function afficherStock() {
  console.table(Object.values(stock));
}

export function verifierDisponibiliteRecette(ingredients) {
  return ingredients.every(ingr => {
    const cle = `${ingr.nom.toLowerCase()}|${ingr.unite.toLowerCase()}`;
    return stock[cle] && stock[cle].quantite >= ingr.quantite;
  });
}

export function deduireIngredientsRecette(ingredients) {
  const toutDisponible = verifierDisponibiliteRecette(ingredients);

  if (!toutDisponible) {
    console.warn("Stock insuffisant pour réaliser la recette.");
    return false;
  }

  ingredients.forEach(ingr => {
    retirerDuStock(ingr.nom, ingr.quantite, ingr.unite);
  });

  return true;
}
