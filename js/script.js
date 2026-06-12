document.addEventListener('DOMContentLoaded', () => {
    // Елементи кроків та заголовку
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const formTitle = document.getElementById('form-title');
    const errorMessage = document.getElementById('error-message');
    const form = document.getElementById('register-form');

    // Кнопки навігації
    const btnNext = document.getElementById('btn-next');
    const btnBack = document.getElementById('btn-back');

    // Поля введення
    const displayName = document.getElementById('displayName');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const birthDate = document.getElementById('birthDate');
    const gender = document.getElementById('gender');
    const weight = document.getElementById('weight');
    const height = document.getElementById('height');

    // Крок 1 -> Крок 2
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            // Очищення помилок
            errorMessage.innerText = '';

            // Перевіряємо, чи існують поля в HTML (запобіжник від помилок розмітки)
            if (!displayName || !email || !password) {
                console.error("Критична помилка: Деякі поля Кроку 1 відсутні в HTML.");
                errorMessage.innerText = 'Помилка завантаження форми. Перевірте HTML-код.';
                return;
            }

            // Валідація першого кроку
            if (!displayName.value.trim() || !email.value.trim() || !password.value) {
                errorMessage.innerText = 'Будь ласка, заповніть усі поля першого кроку.';
                return;
            }

            // 🔥 ГОЛОВНИЙ ФІКС ДЛЯ HTML5 ВАЛІДАЦІЇ:
            // Видаляємо обов'язковість (required) з полів першого кроку прямо перед тим, як їх сховати.
            displayName.removeAttribute('required');
            email.removeAttribute('required');
            password.removeAttribute('required');

            // Перемикання класів для відображення
            step1.classList.remove('active');
            step2.classList.add('active');
            formTitle.innerText = 'Реєстрація (Крок 2/2)';

            // Тимчасово вимикаємо стандартну валідацію HTML5 для форми при сабміті
            if (form) {
                form.setAttribute('novalidate', 'true');
            }
        });
    }

    // Крок 2 -> Крок 1
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            errorMessage.innerText = '';
            step2.classList.remove('active');
            step1.classList.add('active');
            formTitle.innerText = 'Реєстрація (Крок 1/2)';

            // Якщо повернулися назад — повертаємо атрибути required та стандартну валідацію
            if (displayName && email && password) {
                displayName.setAttribute('required', 'true');
                email.setAttribute('required', 'true');
                password.setAttribute('required', 'true');
            }

            if (form) {
                form.removeAttribute('novalidate');
            }
        });
    }

    // Відправка форми на сервер
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Зупиняємо перезавантаження сторінки
            errorMessage.innerText = '';

            // Додаткова валідація другого кроку перед відправкою
            if (!birthDate.value || !weight.value || !height.value) {
                errorMessage.innerText = 'Будь ласка, заповніть усі поля другого кроку.';
                return;
            }

            // Збір усіх даних в один об'єкт
            const payload = {
                displayName: displayName.value.trim(),
                email: email.value.trim(),
                password: password.value,
                birthDate: birthDate.value,
                gender: gender.value,
                weight: parseFloat(weight.value) || 0,
                height: parseFloat(height.value) || 0
            };

            try {
                // 🚀 ДИНАМІЧНИЙ URL ДЛЯ ХОСТИНГУ:
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                
                // Автоматично підставляємо твій робочий сервер на Render, якщо ми в інтернеті
                const backendUrl = isLocalhost ? 'http://localhost:5000' : 'https://dashboard-m7vg.onrender.com';

                // Звертаємось до нашого Node.js бекенду
                const response = await fetch(`${backendUrl}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Сталася помилка під час реєстрації.');
                }

                // 1. Зберігаємо JWT токен для авторизації
                localStorage.setItem('token', data.token);
                
                // 2. Зберігаємо фізичні метрики для майбутніх розрахунків ШІ
                localStorage.setItem('userName', payload.displayName);
                localStorage.setItem('userWeight', payload.weight);
                localStorage.setItem('userHeight', payload.height);
                localStorage.setItem('userGender', payload.gender);
                localStorage.setItem('userBirthDate', payload.birthDate);
                
                // Показуємо повідомлення користувачу
                alert(`Вітаємо, ${data.user ? data.user.displayName : payload.displayName}! Реєстрація пройшла успішно.`);
                
                // Перенаправляємо на головну сторінку з AI-дашбордом
                window.location.href = 'dashboard.html';

            } catch (error) {
                errorMessage.innerText = "Помилка з'єднання з сервером: " + error.message;
            }
        });
    }
});