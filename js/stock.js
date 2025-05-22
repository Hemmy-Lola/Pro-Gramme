// stock.js

let stockData = {};

export function getStock() {
  return stockData;
}

export function chargerStockJSON() {
  return fetch('../data/stock.json')
    .then(response => response.json())
    .then(data => {
      stockData = {};
      data.forEach(({ nom, quantite, unite }) => {
        const key = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
        stockData[key] = { nom, quantite, unite };
      });
      afficherStock(); // pour afficher dans <ul id="stock-liste"> si présent
    });
}

// Affichage dans <ul id="stock-liste"> (ex: calculator.html)
export function afficherStock() {
  const liste = document.getElementById('stock-liste');
  if (!liste) return;

  liste.innerHTML = '';

  Object.values(stockData).forEach(({ nom, quantite, unite }) => {
    const li = document.createElement('li');
    li.textContent = `${nom} : ${quantite} ${unite}`;
    liste.appendChild(li);
  });
}

// Affichage dans tableau <tbody id="table-stock"> (ex: stocks.html)
export function afficherStockDansTable(tableBody) {
  if (!tableBody) return;

  tableBody.innerHTML = '';

  const entries = Object.values(stockData);
  if (entries.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3">Aucun ingrédient pour le moment.</td></tr>';
    return;
  }

  entries.forEach(({ nom, quantite, unite }) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${nom}</td>
      <td>${quantite}</td>
      <td>${unite}</td>
    `;
    tableBody.appendChild(row);
  });
}

export function verifierDisponibiliteRecette(ingredients) {
  return ingredients.every(({ nom, quantite, unite }) => {
    const key = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
    const stockItem = stockData[key];
    return stockItem && stockItem.quantite >= quantite;
  });
}

export function deduireIngredientsRecette(ingredients) {
  let possible = true;

  // 1 - Vérification disponibilité
  ingredients.forEach(({ nom, quantite, unite }) => {
    const key = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
    const item = stockData[key];

    if (!item || item.quantite < quantite) {
      possible = false;
    }
  });

  if (!possible) return false;

  // 2 - Déduction stock
  ingredients.forEach(({ nom, quantite, unite }) => {
    const key = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
    stockData[key].quantite -= quantite;
  });

  // Mise à jour affichage si liste visible (optionnel)
  afficherStock();

  return true;
}
