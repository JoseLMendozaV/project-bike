import { xf } from './functions.js';
import './db.js';
import './views/views.js';
import './connectionManager.js';


function startServiceWorker() {
    if('serviceWorker' in navigator) {
        try {
            const reg = navigator.serviceWorker.register('./sw.js');
            console.log(`SW: register success.`);
            console.log('Cache Version: Flux-v003');
        } catch(err) {
            console.log(`SW: register error: `, err);
        }
    };
}


function start() {
    console.log('start app.');

    // startServiceWorker(); // stable version only

    xf.dispatch('app:start');
}

function stop() {}

start();


//other functions

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 72,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});