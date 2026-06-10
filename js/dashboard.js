document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 1. ЕЛЕМЕНТИ ІНТЕРФЕЙСУ (ДОМ)
    // ==========================================
    
    // Елементи ШІ та калорій
    const aiAdviceText = document.getElementById('ai-advice-text');
    const skeletonBlock = document.getElementById('ai-response');
    const calBurned = document.getElementById('cal-burned');
    const calTarget = document.getElementById('cal-target');
    const caloriesProgressFill = document.getElementById('calories-progress-fill'); // Смужка калорій
    const caloriesPercentDisplay = document.getElementById('calories-percent');    // Відсоток калорій

    // Елементи Водного Трекера
    const waterCurrentEl = document.getElementById('water-current');
    const waterTargetEl = document.getElementById('water-target');
    const waterProgressFill = document.getElementById('water-progress-fill');
    const aiWaterText = document.getElementById('ai-water-text');
    const waterButtons = document.querySelectorAll('.btn-water');
    const btnWaterReset = document.getElementById('btn-water-reset');

    // Налаштування користувача з Етапу 1
    const userWeight = parseFloat(localStorage.getItem('userWeight')) || 70; // дефолт 70кг
    const userName = localStorage.getItem('userName') || 'Атлет';

    // ==========================================
    // 2. ЛОГІКА АВТОМАТИЧНОГО СКИДАННЯ НА НОВИЙ ДЕНЬ
    // ==========================================
    const todayDate = new Date().toISOString().split('T')[0]; // Формат "РРРР-ММ-ДД"
    
    // Перевірка дати для води та калорій
    const waterLastSavedDate = localStorage.getItem('waterLastSavedDate');
    const caloriesLastSavedDate = localStorage.getItem('caloriesLastSavedDate');
    
    let currentWater = 0;

    // Скидання води, якщо настав новий день
    if (waterLastSavedDate === todayDate) {
        currentWater = parseFloat(localStorage.getItem('todayWater')) || 0;
    } else {
        currentWater = 0;
        localStorage.setItem('todayWater', currentWater);
        localStorage.setItem('waterLastSavedDate', todayDate);
    }

    // Скидання накопичених калорій з карти, якщо настав новий день
    if (caloriesLastSavedDate !== todayDate) {
        localStorage.setItem('todayBurnedCalories', '0');
        localStorage.setItem('caloriesLastSavedDate', todayDate);
    }

    // ==========================================
    // 3. ФУНКЦІОНАЛ ВОДНОГО ТРЕКЕРА
    // ==========================================
    
    // Формула: 35 мл на 1 кг ваги
    const calculatedWaterTarget = parseFloat((userWeight * 0.035).toFixed(1)); 

    function updateWaterUI() {
        if (waterCurrentEl) waterCurrentEl.innerText = currentWater.toFixed(2);
        if (waterTargetEl) waterTargetEl.innerText = calculatedWaterTarget;

        const percentage = Math.min((currentWater / calculatedWaterTarget) * 100, 100);
        if (waterProgressFill) {
            waterProgressFill.style.width = `${percentage}%`;
        }

        if (aiWaterText) {
            if (currentWater === 0) {
                aiWaterText.innerText = `🤖 AI: Привіт, ${userName}! Твоя індивідуальна норма на сьогодні — ${calculatedWaterTarget}л. Ти ще не зробив жодного ковтка, час випити склянку води!`;
                aiWaterText.style.color = '#ffb703';
            } else if (currentWater < calculatedWaterTarget * 0.4) {
                aiWaterText.innerText = `🤖 AI: Початок є, але цього замало для твоєї ваги. Нагадую: регулярне пиття прискорює метаболізм!`;
                aiWaterText.style.color = '#00a2ff';
            } else if (currentWater < calculatedWaterTarget) {
                const left = (calculatedWaterTarget - currentWater).toFixed(2);
                aiWaterText.innerText = `🤖 AI: Чудовий темп, ${userName}! Залишилось випити всього ${left}л до виконання цілі.`;
                aiWaterText.style.color = '#00f5d4';
            } else if (currentWater >= calculatedWaterTarget && currentWater < calculatedWaterTarget + 1.5) {
                aiWaterText.innerText = `🤖 AI: Ідеально! Денну норму води виконано на 100%. Твій організм каже тобі дякую! 🏆`;
                aiWaterText.style.color = '#00f5d4';
            } else if (currentWater >= calculatedWaterTarget + 1.5 && currentWater < 6) {
                aiWaterText.innerText = `🤖 AI: Воу, ${userName}, пригальмуй трохи! Ти вже випив ${currentWater.toFixed(2)}л. Перевищення норми — це добре під час тренувань, але не пий занадто багато за раз!`;
                aiWaterText.style.color = '#ffb703';
            } else {
                aiWaterText.innerText = `🤖 AI: 🛑 УВАГА! ${currentWater.toFixed(2)} ЛІТРІВ?! Ти що, Аквамен? Перебір води так само шкідливий, як і дефіцит. Зупинись, або твої нирки оголосять страйк! 🧜‍♂️`;
                aiWaterText.style.color = '#ff6b6b';
            }
        }

        localStorage.setItem('todayWater', currentWater);
        localStorage.setItem('waterLastSavedDate', todayDate);
    }

    waterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseFloat(button.getAttribute('data-amount'));
            currentWater += amount;
            updateWaterUI();
        });
    });

    if (btnWaterReset) {
        btnWaterReset.addEventListener('click', () => {
            currentWater = 0;
            updateWaterUI();
        });
    }

    // Ініціалізація води
    updateWaterUI();


    // ==========================================
    // 4. ЕТАП 5: РОЗРАХУНОК ТА ОНОВЛЕННЯ КАЛОРІЙ
    // ==========================================
    
    function renderCalories(currentServerCalories, targetCalories) {
        // Забираємо калорії, які набігли з GPS-карти за сьогодні
        const gpsCalories = parseInt(localStorage.getItem('todayBurnedCalories')) || 0;
        
        // Фінальна сума: те, що прийшло з бази (сервера) + активність з мапи
        const totalBurned = currentServerCalories + gpsCalories;
        const dailyGoal = targetCalories || 2100;

        // Виводимо числа на екран
        if (calBurned) calBurned.innerText = totalBurned;
        if (calTarget) calTarget.innerText = dailyGoal;

        // Рахуємо відсоток прогресу
        const percent = Math.min((totalBurned / dailyGoal) * 100, 100);

        // Рухаємо неонову смужку прогресу
        if (caloriesProgressFill) {
            caloriesProgressFill.style.width = `${percent}%`;
        }

        // Оновлюємо текстовий відсоток (якщо є такий елемент у верстці)
        if (caloriesPercentDisplay) {
            caloriesPercentDisplay.innerText = `${Math.floor(percent)}%`;
        }
    }


    // ==========================================
    // 5. ЗАПИТ ДО БЕКЕНД СЕРВЕРА (ІНІЦІАЛІЗАЦІЯ)
    // ==========================================
    try {
        const response = await fetch('http://localhost:5000/api/dashboard/init', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Помилка сервера: ${response.status}`);
        }

        const data = await response.json();

        // Приховуємо скелетон (анімацію завантаження)
        if (skeletonBlock) skeletonBlock.style.display = 'none';

        // Виводимо головну пораду ШІ
        if (aiAdviceText) {
            aiAdviceText.innerText = data.aiAdvice;
        }

        // Рендеримо калорії, поєднуючи дані з сервера та GPS
        renderCalories(parseInt(data.caloriesCurrent) || 0, parseInt(data.caloriesTarget) || 2100);

    } catch (error) {
        console.error('Помилка завантаження дашборду:', error);
        
        if (skeletonBlock) skeletonBlock.style.display = 'none';
        
        if (aiAdviceText) {
            aiAdviceText.innerText = 'Не вдалося завантажити глобальні поради ШІ. Перевірте з\'єднання з сервером.';
            aiAdviceText.style.color = '#ff6b6b';
        }

        // Резервний варіант (Fallback): якщо сервер лежить, додаток все одно покаже калорії з GPS
        console.log('🤖 AI: Ввімкнено автономний режим відображення калорій.');
        renderCalories(0, 2100);
    }
});