const express = require('express');
const cors = require('cors');
const app = express();

// 🔥 НАЛАШТУВАННЯ CORS: Надаємо доступ твоєму GitHub Pages та локальному серверу
app.use(cors({
    origin: [
        'https://kashtamcuk.github.io', 
        'http://localhost:5500', 
        'http://127.0.0.1:5500'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// 1. Реєстрація
app.post('/api/auth/register', (req, res) => {
    console.log("Отримано запит на реєстрацію:", req.body);
    res.status(201).json({ 
        message: "Акаунт успішно створено!",
        token: "fake-jwt-token-for-testing",
        user: { displayName: req.body.displayName || "Атлет", email: req.body.email }
    });
});

// 2. Дашборд — Обробка GET-запиту (для перевірки в браузері)
app.get('/api/dashboard/init', (req, res) => {
    console.log("Отримано GET-запит на дані дашборду.");
    res.status(200).json({
        aiAdvice: "Привіт! Твій калькулятор налаштовано. На основі твоїх параметрів рекомендую почати з помірних кардіо-тренувань 3 рази на тиждень та підтримувати водний баланс. Не забувай записувати прогрес!",
        caloriesTarget: 2100,
        waterTarget: 2.5,
        caloriesCurrent: 0,
        waterCurrent: 0
    });
});

// 3. Дашборд — Обробка POST-запиту (про всяк випадок для скриптів)
app.post('/api/dashboard/init', (req, res) => {
    console.log("Отримано POST-запит на дані дашборду.");
    res.status(200).json({
        aiAdvice: "Привіт! Твій калькулятор налаштовано. На основі твоїх параметрів рекомендую почати з помірних кардіо-тренувань 3 рази на тиждень та підтримувати водний баланс. Не забувай записувати прогрес!",
        caloriesTarget: 2100,
        waterTarget: 2.5,
        caloriesCurrent: 0,
        waterCurrent: 0
    });
});

// 🔥 ФІКС ДЛЯ ДЕПЛОЮ: Зчитуємо порт, який видасть Render, або використовуємо 5000 локально
const PORT = process.env.PORT || 5000;

// 🔥 ФІКС ДЛЯ МЕРЕЖІ: Додаємо '0.0.0.0', щоб сервер слухав зовнішні запити
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер успішно запущено на порту ${PORT}`);
});