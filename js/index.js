document.addEventListener('DOMContentLoaded', function () {
    // Find the contact form on homepage
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get submit button to show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Get form inputs
            const nameInput = contactForm.querySelector('input[name="name"]');
            const emailInput = contactForm.querySelector('input[name="email"]');
            const phoneInput = contactForm.querySelector('input[name="phone"]');
            const locationInput = contactForm.querySelector('input[name="location"]');
            const messageInput = contactForm.querySelector('textarea[name="message"]');

            // Get values safely
            const fullName = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const location = locationInput ? locationInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';

            // Split name into First and Last for the backend
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'Guest';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Prepare data for backend
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('location', location);
            formData.append('message', message);
            formData.append('serviceType', 'General Inquiry'); // Default service type

            // Send to backend
            fetch('backend/submit_form.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('✅ Thank you for your inquiry! We will contact you soon.');
                        contactForm.reset();
                    } else {
                        alert('⚠️ Error: ' + (data.error || 'Submission failed.'));
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    alert('❌ Network error. Please check your connection or try again later.');
                })
                .finally(() => {
                    // Always reset the button
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                });
        });
    }
});