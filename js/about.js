// Counter animation for stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.innerText);
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            if (counter.innerText.includes('%')) {
                counter.innerText = Math.floor(current) + '%';
            } else if (counter.innerText.includes('+')) {
                counter.innerText = Math.floor(current) + '+';
            } else if (counter.innerText.includes('/')) {
                counter.innerText = '24/7';
            } else {
                counter.innerText = Math.floor(current);
            }
        }, 20);
    });
}