document.addEventListener('DOMContentLoaded', () => {
    const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    // Smooth Scrolling for Navigation Links
    const navLinks = document.querySelectorAll('nav ul li a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            let targetId = this.getAttribute('href');
            // Special case for logo link to hero
            if (targetId === '#hero' && this.closest('.logo')) {
                 targetId = '#hero'; // Ensure it always goes to hero section top
            }
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = document.getElementById('header').offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: scrollBehavior
                });
            }
            // Close mobile nav if open
            if(document.querySelector('.nav-links').classList.contains('nav-active')){
                toggleNav();
            }
        });
    });

    // Logo smooth scroll to hero top
    const logoLink = document.querySelector('#header .logo a');
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                 window.scrollTo({
                    top: 0, // Hero section is at the very top before header adjustment
                    behavior: scrollBehavior
                });
            }
        });
    }

    // Back to Top smooth scroll
    const backToTopLink = document.querySelector('.back-to-top');
    if (backToTopLink) {
        backToTopLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: scrollBehavior
            });
        });
    }

    // Mobile Navigation Toggle
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinkItems = document.querySelectorAll('.nav-links li');

    const toggleNav = () => {
        // Toggle Nav
        nav.classList.toggle('nav-active');
        burger.setAttribute('aria-expanded', nav.classList.contains('nav-active'));

        // Animate Links
        navLinkItems.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });

        // Burger Animation
        burger.classList.toggle('toggle');
    };

    if (burger) {
        burger.addEventListener('click', toggleNav);
    }

    // Dynamic Year in Footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Optional: Highlight active nav link on scroll (basic version)
    const sections = document.querySelectorAll('main section[id]');
    const headerHeight = document.getElementById('header').offsetHeight;

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 50; // Add a little offset
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
        // Special case for hero, if nothing else is active, hero should be
        if (current === '' && window.scrollY < sections[0].offsetTop - headerHeight - 50) {
             const heroLink = document.querySelector('nav ul li a[href="#hero"]');
             if(heroLink) heroLink.classList.add('active');
        } else if (current === '') {
            // if scrolled to bottom and last section isn't filling screen
            const lastSection = sections[sections.length-1];
            if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) { // 50px buffer for footer
                current = lastSection.getAttribute('id');
                 navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href').substring(1) === current) {
                        link.classList.add('active');
                    }
                });
            }
        }
    });
}); 