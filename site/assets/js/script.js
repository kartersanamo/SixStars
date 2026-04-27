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

    function parseMinutes(value) {
        if (!value) return null;
        var match = value.trim().match(/^(\d+)h\s*(\d+)m$/i);
        if (!match) return null;
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }

    function formatMinutes(totalMinutes) {
        var hours = Math.floor(totalMinutes / 60);
        var minutes = totalMinutes % 60;
        return hours + "h " + minutes + "m";
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    async function readMemberHours(pagePath) {
        var response = await fetch(pagePath, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Failed to load " + pagePath + ": " + response.status);
        }

        var html = await response.text();
        var doc = new DOMParser().parseFromString(html, "text/html");
        var nameEl = doc.querySelector(".member-page-title");
        var roleEl = doc.querySelector(".member-page-role");
        var entries = doc.querySelectorAll(".time-tracking .time-entry");
        var iterations = { 1: null, 2: null, 3: null };

        entries.forEach(function (entry) {
            if (entry.classList.contains("total")) return;
            var periodEl = entry.querySelector(".time-period");
            var hoursEl = entry.querySelector(".time-hours");
            if (!periodEl || !hoursEl) return;

            var periodMatch = periodEl.textContent.match(/Iteration\s+(\d+)/i);
            if (!periodMatch) return;

            var iterationNumber = parseInt(periodMatch[1], 10);
            if (!(iterationNumber in iterations)) return;
            iterations[iterationNumber] = parseMinutes(hoursEl.textContent.trim());
        });

        var total = Object.keys(iterations).reduce(function (sum, key) {
            var minutes = iterations[key];
            return sum + (typeof minutes === "number" ? minutes : 0);
        }, 0);

        return {
            name: nameEl ? nameEl.textContent.trim() : "Unknown",
            role: roleEl ? roleEl.textContent.trim() : "",
            iterations: iterations,
            total: total,
        };
    }

    function buildTimeItem(label, minutes, memberTotal, extraClass) {
        var className = "time-item" + (extraClass ? " " + extraClass : "");
        var isNumeric = typeof minutes === "number";
        var display = isNumeric ? formatMinutes(minutes) : "—";
        var barWidth = isNumeric && memberTotal > 0 ? ((minutes / memberTotal) * 100).toFixed(1) + "%" : "0%";

        return (
            '<div class="' +
            className +
            '">' +
            '<div class="time-item-header">' +
            "<span>" +
            escapeHtml(label) +
            "</span>" +
            "<span>" +
            escapeHtml(display) +
            "</span>" +
            "</div>" +
            '<div class="time-bar-track" aria-hidden="true"><div class="time-bar-fill" style="width:' +
            barWidth +
            '"></div></div>' +
            "</div>"
        );
    }

    function buildMemberCard(member) {
        var i1 = member.iterations[1];
        var i2 = member.iterations[2];
        var i3 = member.iterations[3];

        return (
            '<div class="time-card">' +
            "<h3>" +
            escapeHtml(member.name) +
            "</h3>" +
            '<p class="member-role-badge">' +
            escapeHtml(member.role) +
            "</p>" +
            '<div class="time-breakdown">' +
            buildTimeItem("Iteration 1", i1, member.total, "") +
            buildTimeItem("Iteration 2", i2, member.total, "") +
            buildTimeItem("Iteration 3", i3, member.total, "time-item--future") +
            buildTimeItem("Total", member.total, member.total || 1, "total") +
            "</div>" +
            "</div>"
        );
    }

    async function hydrateTimeTrackingPage() {
        var isTimeTrackingPage = window.location.pathname.endsWith("/time-tracking.html") || window.location.pathname === "/time-tracking.html";
        if (!isTimeTrackingPage) return;

        var timeGrid = document.querySelector(".time-grid");
        var totalEl = document.querySelector(".summary-card .total-hours");
        var statCards = document.querySelectorAll(".iteration-stats .stat-card");
        if (!timeGrid || !totalEl || statCards.length < 3) return;

        var memberPages = [
            "/team/peter-ingalsbe.html",
            "/team/matthew-peterson.html",
            "/team/georgia-rushing.html",
            "/team/karter-sanamo.html",
            "/team/nolan-schirripa.html",
            "/team/christine-seng.html",
        ];

        try {
            var members = await Promise.all(memberPages.map(readMemberHours));
            var memberMarkup = members.map(buildMemberCard).join("");
            var iterationTotals = { 1: 0, 2: 0, 3: 0 };

            members.forEach(function (member) {
                [1, 2, 3].forEach(function (iteration) {
                    var minutes = member.iterations[iteration];
                    if (typeof minutes === "number") {
                        iterationTotals[iteration] += minutes;
                    }
                });
            });

            var totalToDate = iterationTotals[1] + iterationTotals[2] + iterationTotals[3];

            timeGrid.innerHTML = memberMarkup;
            totalEl.innerHTML =
                escapeHtml(formatMinutes(totalToDate)) +
                ' <span class="total-hours-unit">total logged</span>';

            var statOne = statCards[0].querySelector(".stat-hours");
            var statTwo = statCards[1].querySelector(".stat-hours");
            var statThree = statCards[2].querySelector(".stat-hours");
            if (statOne) statOne.textContent = formatMinutes(iterationTotals[1]);
            if (statTwo) statTwo.textContent = formatMinutes(iterationTotals[2]);
            if (statThree) {
                statThree.textContent = iterationTotals[3] > 0 ? formatMinutes(iterationTotals[3]) : "—";
            }
        } catch (error) {
            console.error("Time tracking auto-calc failed:", error);
        }
    }

    hydrateTimeTrackingPage();

})();
