document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    // This is the password for the gate. Change it to whatever you want.
    const CORRECT_PASSWORD = 'admin123';

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const enteredPassword = passwordInput.value;

        if (enteredPassword === CORRECT_PASSWORD) {
            // Password is correct. Store a token in sessionStorage.
            // This token will be checked by the scheduler page.
            sessionStorage.setItem('isLoggedIn', 'true');
            
            // Redirect to the main scheduler application.
            window.location.href = 'scheduler.html';
        } else {
            // Password is incorrect. Show an error message.
            errorMessage.style.display = 'block';
            passwordInput.focus();
        }
    });
}); 