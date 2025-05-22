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

// Ajouter un ingrédient au stock
export function ajouterAuStock(nom, quantite, unite) {
  if (!nom || quantite <= 0 || !unite) {
    throw new Error('Données invalides pour l\'ajout au stock');
  }

  const key = `${nom.toLowerCase()}|${unite.toLowerCase()}`;
  
  // Si l'ingrédient existe déjà, on ajoute à la quantité existante
  if (stockData[key]) {
    stockData[key].quantite += parseFloat(quantite);
  } else {
    // Sinon, on crée une nouvelle entrée
    stockData[key] = {
      nom: nom,
      quantite: parseFloat(quantite),
      unite: unite
    };
  }

  // Mise à jour de l'affichage
  afficherStock();
  
  // On retourne les données mises à jour pour pouvoir les utiliser
  return stockData;
}

// Sauvegarder les modifications dans le fichier JSON
export function sauvegarderStock() {
  const stockArray = Object.values(stockData);
  
  return fetch('../data/stock.json', {
    method: 'PUT', // ou POST selon votre API
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(stockArray)
  })
  .catch(error => {
    console.error('Erreur lors de la sauvegarde du stock:', error);
    throw error;
  });
}

// Initialiser le formulaire d'ajout
export function initialiserFormulaire() {
  const form = document.getElementById('form-ajout');
  if (!form) return;

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const nom = document.getElementById('nom').value.trim();
    const quantite = parseFloat(document.getElementById('quantite').value);
    const unite = document.getElementById('unite').value;
    
    try {
      ajouterAuStock(nom, quantite, unite);
      
      // Mise à jour du tableau si présent
      const tableStock = document.getElementById('table-stock');
      if (tableStock) {
        afficherStockDansTable(tableStock);
      }
      
      // Afficher un message de succès
      const message = document.getElementById('message');
      if (message) {
        message.style.display = 'block';
        message.style.background = '#dfd';
        message.style.color = '#060';
        message.textContent = `${nom} ajouté au stock avec succès!`;
        
        // Faire disparaître le message après 3 secondes
        setTimeout(() => {
          message.style.display = 'none';
        }, 3000);
      }
      
      // Réinitialiser le formulaire
      form.reset();
      document.getElementById('nom').focus();
      
    } catch (error) {
      // Afficher un message d'erreur
      const message = document.getElementById('message');
      if (message) {
        message.style.display = 'block';
        message.style.background = '#fdd';
        message.style.color = '#900';
        message.textContent = error.message || 'Erreur lors de l\'ajout au stock';
      }
    }
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
