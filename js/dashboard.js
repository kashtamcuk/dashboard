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

    // 🔥 НОВІ ЕЛЕМЕНТИ: Віджет музичного плеєра на Дашборді
    const trackTitle = document.getElementById('player-title');
    const trackArtist = document.getElementById('player-artist');
    const trackCover = document.getElementById('player-cover');
    const btnPlay = document.getElementById('player-play');
    const btnPrev = document.getElementById('player-prev');
    const btnNext = document.getElementById('player-next');
    const volumeSlider = document.getElementById('player-volume');
    const progressBar = document.getElementById('player-progress');

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
        
        // 🔥 ПЛАВНА АНІМАЦІЯ ВОДИ ПРИ ЗАВАНТАЖЕННІ ТА КЛІКАХ
        if (waterProgressFill) {
            waterProgressFill.style.width = '0%'; // Скидаємо в 0 для старту анімації
            setTimeout(() => {
                waterProgressFill.style.width = `${percentage}%`;
            }, 150);
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

    // Перша ініціалізація води
    updateWaterUI();


    // ==========================================
    // 4. ЕТАП 5: ЧИСТИЙ РОЗРАХУНОК КАЛОРІЙ (ТІЛЬКИ З GPS-КАРТИ)
    // ==========================================
    
    function renderCalories(targetCalories) {
        // Забираємо калорії, які реальна активність набігала на GPS-мапі за сьогодні
        const totalBurned = parseInt(localStorage.getItem('todayBurnedCalories')) || 0;
        const dailyGoal = targetCalories || 2100;

        // Виводимо числа на екран
        if (calBurned) calBurned.innerText = totalBurned;
        if (calTarget) calTarget.innerText = dailyGoal;

        // Рахуємо відсоток прогресу
        const percent = Math.min((totalBurned / dailyGoal) * 100, 100);

        // 🔥 ПЛАВНА АНІМАЦІЯ КАЛОРІЙ ПРИ ЗАВАНТАЖЕННІ СТОРІНКИ
        if (caloriesProgressFill) {
            caloriesProgressFill.style.width = '0%'; // Старт з нуля
            setTimeout(() => {
                caloriesProgressFill.style.width = `${percent}%`;
            }, 150);
        }

        // Оновлюємо текстовий відсоток
        if (caloriesPercentDisplay) {
            caloriesPercentDisplay.innerText = `${Math.floor(percent)}%`;
        }
    }


    // ==========================================
    // 5. ЗАПИТ ДО БЕКЕНД СЕРВЕРА (ІНІЦІАЛІЗАЦІЯ ПІДКАЗОК ШІ)
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

        // Сервер тепер віддає ТІЛЬКИ глобальну ціль (наприклад 2100)
        renderCalories(parseInt(data.caloriesTarget) || 2100);

    } catch (error) {
        console.error('Помилка завантаження дашборду:', error);
        
        if (skeletonBlock) skeletonBlock.style.display = 'none';
        
        if (aiAdviceText) {
            aiAdviceText.innerText = 'Не вдалося завантажити глобальні поради ШІ. Працює локальний ШІ-асистент.';
            aiAdviceText.style.color = '#ff6b6b';
        }

        // Автономний режим (Fallback) — малюємо чисті калорії з GPS-карти
        console.log('🤖 AI: Ввімкнено автономний режим трекера.');
        renderCalories(2100);
    }

    // ==========================================
    // 6. ВІДОБРАЖЕННЯ ОСТАННЬОГО ТРЕНУВАННЯ З КАРТИ
    // ==========================================
    function renderLastWorkout() {
        const lastActivity = localStorage.getItem('lastWorkoutActivity');
        const lastDistance = localStorage.getItem('lastWorkoutDistance');
        const lastTime = localStorage.getItem('lastWorkoutTime');

        const activityEl = document.getElementById('last-workout-activity');
        const distanceEl = document.getElementById('last-workout-distance');
        const timeEl = document.getElementById('last-workout-time');
        const feedbackEl = document.getElementById('ai-workout-feedback');

        if (lastActivity && lastDistance && lastTime) {
            if (activityEl) activityEl.innerText = lastActivity;
            if (distanceEl) distanceEl.innerText = `${parseFloat(lastDistance).toFixed(2)} км`;
            if (timeEl) timeEl.innerText = lastTime;

            if (feedbackEl) {
                const dist = parseFloat(lastDistance);
                if (dist > 5) {
                    feedbackEl.innerText = `🤖 AI: Ого, ${dist.toFixed(1)} км — це потужно! Ти справжній кіборг, так тримати! 🏆`;
                    feedbackEl.style.color = '#00f5d4';
                } else if (dist > 0) {
                    feedbackEl.innerText = `🤖 AI: Чудова робота! ${dist.toFixed(1)} км ідуть у твою скарбничку здоров'я. Не збавляй темп!`;
                    feedbackEl.style.color = '#00a2ff';
                }
            }
        }
    }

    // Запускаємо рендер історії
    renderLastWorkout();


    // ==========================================
    // 🔥 7. ЛОГІКА АВТОНОМНОГО МІНІ-ПЛЕЄРА НА ГОЛОВНІЙ СТОРІНЦІ
    // ==========================================
    // Цей блок оживляє кнопки плеєра, якщо користувач сидить на головному дашборді
    if (trackTitle && btnPlay) {
        const playlist = [
            {
                title: "Cyberpunk Synthwave",
                artist: "White Bat Audio",
                src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
                cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300" 
            },
            {
                title: "Power Running Drive",
                artist: "EDM Workout Mix",
                src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
                cover: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300"
            }
        ];

        let currentTrackIndex = 0;
        let isPlaying = false;
        const audioWidget = new Audio();

        function loadWidgetTrack(index) {
            const track = playlist[index];
            if (!track) return;
            audioWidget.src = track.src;
            if (trackTitle) trackTitle.innerText = track.title;
            if (trackArtist) trackArtist.innerText = track.artist;
            if (trackCover) trackCover.src = track.cover;
            if (progressBar) progressBar.value = 0;
        }

        btnPlay.addEventListener('click', () => {
            if (isPlaying) {
                audioWidget.pause();
                isPlaying = false;
                btnPlay.innerHTML = '▶';
            } else {
                audioWidget.play().catch(e => console.log("Очікування кліку...", e));
                isPlaying = true;
                btnPlay.innerHTML = '⏸';
            }
        });

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
                loadWidgetTrack(currentTrackIndex);
                if (isPlaying) audioWidget.play().catch(e => console.log(e));
            });
        }

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
                loadWidgetTrack(currentTrackIndex);
                if (isPlaying) audioWidget.play().catch(e => console.log(e));
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                audioWidget.volume = e.target.value / 100;
            });
        }

        audioWidget.addEventListener('timeupdate', () => {
            if (progressBar && audioWidget.duration) {
                progressBar.value = (audioWidget.currentTime / audioWidget.duration) * 100;
            }
        });

        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                if (audioWidget.duration) {
                    audioWidget.currentTime = (e.target.value / 100) * audioWidget.duration;
                }
            });
        }

        // Перше завантаження першого треку у віджет
        loadWidgetTrack(currentTrackIndex);
    }
});