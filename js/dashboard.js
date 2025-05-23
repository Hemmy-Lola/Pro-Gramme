// Début Hemmy-Lola MATHYS
import { getStock } from './stock.js';

document.addEventListener('DOMContentLoaded', async () => {
    const loadRecipes = async () => {
        const response = await fetch('./data/recipes.json'); 
        const recipes = await response.json();
        return recipes;
    };

    const loadEvents = async () => {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        return events;
    };

    const displayFavoriteRecipes = (recipes) => {
        const favoritesList = document.getElementById('recettes-favorites');
        favoritesList.innerHTML = recipes.map(recipe => `
            <li class="card-item">
                <h3>${recipe.nom}</h3>
                <p>Pour ${recipe.personnes} personnes</p>
            </li>
        `).join('');
    };

    const displayStockAlerts = () => {
        const stockList = document.getElementById('alertes-stock');
        const stock = getStock();
        const alertes = Object.entries(stock)
            .filter(([_, item]) => item.quantite < item.seuil)
            .map(([nom, item]) => ({nom, quantite: item.quantite, seuil: item.seuil}));

        if (alertes.length === 0) {
            stockList.innerHTML = '<li class="card-item">Stock à jour</li>';
            return;
        }

        stockList.innerHTML = alertes.map(alerte => `
            <li class="card-item alert">
                <span>${alerte.nom}</span>
                <span>Quantité: ${alerte.quantite} (Seuil: ${alerte.seuil})</span>
            </li>
        `).join('');
    };

    const displayDailyRecipes = (events) => {
        const dailyList = document.getElementById('recettes-jour');
        const today = new Date();
        const todayEvents = events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === today.toDateString();
        });

        if (todayEvents.length === 0) {
            dailyList.innerHTML = '<li class="card-item">Aucune recette planifiée aujourd\'hui</li>';
            return;
        }

        dailyList.innerHTML = todayEvents.map(event => `
            <li class="card-item">
                <h3>${event.title}</h3>
                <p>${new Date(event.start).toLocaleTimeString()} - ${new Date(event.end).toLocaleTimeString()}</p>
            </li>
        `).join('');
    };

    const updateStats = (recipes, events, stock) => {
        document.getElementById('total-recettes').textContent = recipes.length;
        document.getElementById('total-jour').textContent = events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.toDateString() === new Date().toDateString();
        }).length;
        document.getElementById('total-stocks').textContent = Object.keys(stock).length;
    };

    try {
        const [recipes, events] = await Promise.all([
            loadRecipes(),
            loadEvents()
        ]);
        const stock = getStock();

        displayFavoriteRecipes(recipes);
        displayStockAlerts();
        displayDailyRecipes(events);
        updateStats(recipes, events, stock);
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
});
// Fin Hemmy-Lola MATHYS