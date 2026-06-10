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

            // Валідація першого кроку
            if (!displayName.value.trim() || !email.value.trim() || !password.value) {
                errorMessage.innerText = 'Будь ласка, заповніть усі поля першого кроку.';
                return;
            }

            // Перемикання класів для відображення
            step1.classList.remove('active');
            step2.classList.add('active');
            formTitle.innerText = 'Реєстрація (Крок 2/2)';
        });
    }

    // Крок 2 -> Крок 1
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            errorMessage.innerText = '';
            step2.classList.remove('active');
            step1.classList.add('active');
            formTitle.innerText = 'Реєстрація (Крок 1/2)';
        });
    }

    // Відправка форми на сервер
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Зупиняємо перезавантаження сторінки
            errorMessage.innerText = '';

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
                // Звертаємось до нашого Node.js бекенду
                const response = await fetch('http://localhost:5000/api/auth/register', {
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
                
                // 2. 🔥 ДОДАТКОВО: Зберігаємо фізичні метрики для майбутніх розрахунків ШІ (Етапи 5 та 6)
                localStorage.setItem('userName', payload.displayName);
                localStorage.setItem('userWeight', payload.weight);
                localStorage.setItem('userHeight', payload.height);
                localStorage.setItem('userGender', payload.gender);
                localStorage.setItem('userBirthDate', payload.birthDate);
                
                // Показуємо повідомлення користувачу
                alert(`Вітаємо, ${data.user.displayName}! Реєстрація пройшла успішно.`);
                
                // Перенаправляємо на головну сторінку з AI-дашбордом
                window.location.href = 'dashboard.html';

            } catch (error) {
                errorMessage.innerText = error.message;
            }
        });
    }
});