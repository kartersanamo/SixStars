(function () {
    "use strict";

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener("click", function (e) {
            var id = this.getAttribute("href");
            if (!id || id === "#") return;
            var target = document.querySelector(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    var navbar = document.querySelector(".navbar");
    if (navbar) {
        window.addEventListener(
            "scroll",
            function () {
                navbar.classList.toggle("is-scrolled", window.pageYOffset > 8);
            },
            { passive: true }
        );
        navbar.classList.toggle("is-scrolled", window.pageYOffset > 8);
    }

    var revealOptions = { threshold: 0.12, rootMargin: "0px 0px -24px 0px" };
    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, revealOptions);

    document.querySelectorAll(".js-reveal").forEach(function (el) {
        revealObserver.observe(el);
    });

    var sections = document.querySelectorAll("section[id]");
    var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    function updateActiveNav() {
        var scrollY = window.pageYOffset;
        var navH = 96;
        sections.forEach(function (section) {
            var top = section.offsetTop - navH;
            var height = section.offsetHeight;
            var id = section.getAttribute("id");
            var link =
                document.querySelector('.nav-links a[href="#' + id + '"]') ||
                document.querySelector('.nav-links a[href$="#' + id + '"]');
            if (!link) return;
            if (scrollY >= top && scrollY < top + height) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    if (sections.length && navLinks.length) {
        window.addEventListener("scroll", updateActiveNav, { passive: true });
        updateActiveNav();
    }

})();
