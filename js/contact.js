// Form animations and interactions
const formInputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');

formInputs.forEach(input => {

    // Handle floating labels
    input.addEventListener('input', () => {
        const label = input.nextElementSibling;

        if (input.value.trim() !== '') {
            label.classList.add('active');
        }

        else {
            label.classList.remove('active');
        }
    });

    // Add focus effects
    input.addEventListener('focus', () => {
        input.parentElement.style.transform = 'scale(1.02)';
    });

    input.addEventListener('blur', () => {
        input.parentElement.style.transform = 'scale(1)';
    });
});

// Form submission
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Basic form validation
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'serviceType', 'message'];
    let isValid = true;

    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);

        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#ff6b6b';

            setTimeout(() => {
                field.style.borderColor = '#e9ecef';
            }

                , 3000);
        }
    });

    if (isValid) {
        // Show success message (you can replace this with actual form submission)
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        submitBtn.style.background = '#28a745';

        setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = 'linear-gradient(45deg, #007bff, #0056b3)';
            contactForm.reset();
        }

            , 3000);
    }

    else {
        // Show error message
        alert('Please fill in all required fields.');
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
}

    ;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}

    , observerOptions);

// Observe fade-in elements
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Method cards hover effect
const methodCards = document.querySelectorAll('.method-card');

methodCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-15px) scale(1.02)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Contact detail click tracking (for analytics)
document.querySelectorAll('.contact-detail').forEach(link => {
    link.addEventListener('click', () => {
        // You can add analytics tracking here
        console.log('Contact method used:', link.textContent);
    });
});