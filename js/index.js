// Form submission (basic validation)
const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    // Add your form submission logic here
    alert('Thank you for your inquiry! We will contact you soon.');
});


document.addEventListener('DOMContentLoaded', function() {
    // Find the contact form on homepage
    const contactForm = document.querySelector('form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            console.log('Contact form submitted!'); // Debug
            
            // Get form inputs
            const nameInput = contactForm.querySelector('input[type="text"]');
            const emailInput = contactForm.querySelector('input[type="email"]');
            const phoneInput = contactForm.querySelector('input[type="tel"]');
            const locationInput = contactForm.querySelectorAll('input[type="text"]')[1]; // Second text input
            const messageInput = contactForm.querySelector('textarea');
            
            // Get values
            const fullName = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const location = locationInput ? locationInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';
            
            // Split name into first and last
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'Guest';
            const lastName = nameParts.slice(1).join(' ') || 'User';
            
            console.log('Form data:', { firstName, lastName, email, phone, location, message }); // Debug
            
            // Validation
            if (!email || !phone || !message) {
                alert('Please fill in all required fields (Email, Phone, Message)!');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address!');
                return;
            }
            
            // Phone validation (Sri Lankan format)
            const phoneRegex = /^(\+94|0)?[7][0-9]{8}$/;
            if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
                alert('Please enter a valid Sri Lankan phone number!');
                return;
            }
            
            // Get submit button
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Prepare form data
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('location', location);
            formData.append('message', message);
            formData.append('serviceType', 'General Inquiry');
            
            // Send to backend
            fetch('../backend/simple_contact.php', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('Response status:', response.status); // Debug
                return response.json();
            })
            .then(data => {
                console.log('Response data:', data); // Debug
                
                if (data.success) {
                    alert('✅ Thank you for your inquiry! We will contact you soon.');
                    contactForm.reset();
                } else {
                    alert('❌ Error: ' + (data.error || 'Submission failed. Please try again.'));
                }
                
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            })
            .catch(error => {
                console.error('Fetch error:', error); // Debug
                alert('❌ Network error. Please check your connection and try again.');
                
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        });
    } else {
        console.log('Contact form not found on this page'); // Debug
    }
});