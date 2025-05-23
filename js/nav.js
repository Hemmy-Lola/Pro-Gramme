// Début Hemmy-Lola MATHYS
document.addEventListener('DOMContentLoaded', () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const navMenu = document.querySelector('.nav-menu');

    burgerMenu.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !burgerMenu.contains(e.target)) {
            navMenu.classList.remove('active');
            burgerMenu.classList.remove('active');
        }
    });
});
// Fin Hemmy-Lola MATHYS