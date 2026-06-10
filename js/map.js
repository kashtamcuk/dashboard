document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([49.0, 24.0], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    let watchId = null;
    let userPath = []; 
    let routePolyline = null; 
    let userMarker = null; 
    
    let timerInterval = null;
    let totalDistance = 0; 
    let selectedActivity = 'walking'; 
    
    // Змінна для збереження блокування екрану (Кишеньковий режим)
    let wakeLock = null;

    const btnActivity = document.querySelectorAll('.btn-activity');
    const btnStart = document.getElementById('btn-start'); 
    const btnStop = document.getElementById('btn-stop');
    const panelSetup = document.getElementById('panel-setup');
    const panelTracking = document.getElementById('panel-tracking');
    const aiMapAdvice = document.getElementById('ai-map-advice');
    
    const distDisplay = document.getElementById('stat-distance');
    const leftDisplay = document.getElementById('stat-left');
    const timeDisplay = document.getElementById('stat-time');
    const speedDisplay = document.getElementById('stat-speed');
    const progressDisplay = document.getElementById('stat-progress');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 16);
            userMarker = L.marker([latitude, longitude]).addTo(map).bindPopup('Ти тут').openPopup();
        });
    }

    const aiTips = {
        walking: "Для ходьби я рекомендую обирати місцеві парки та затишні пішохідні зони подалі від автомобільних доріг.",
        running: "Для бігу чудово підійдуть стадіони або грунтові доріжки в парках. Намагайся тримати рівний пульс!",
        cycling: "Велосипед вимагає простору. Обирай маршрути з велодоріжками, де менше світлофорів і перехресть.",
        scooter: "Для самоката потрібен ідеальний асфальт. Уникай бруківки та високих бордюрів для твоєї безпеки.",
        skates: "Ролики обожнюють гладке покриття. Спеціалізовані роллердроми або рівні паркові алеї — твій вибір.",
        hiking: "Похід — це виклик. Перевір зручність взуття, заряди телефон та візьми з собою достатній запас води."
    };

    btnActivity.forEach(btn => {
        btn.addEventListener('click', () => {
            if(localStorage.getItem('isWorkoutActive') === 'true') return; 
            btnActivity.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedActivity = btn.getAttribute('data-type');
            if (aiMapAdvice && aiTips[selectedActivity]) aiMapAdvice.innerText = aiTips[selectedActivity];
        });
    });

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    // ФУНКЦІЇ КЕРУВАННЯ ЖИВЛЕННЯМ (WAKE LOCK API)
    async function activateWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('🤖 AI: Кишеньковий режим активовано! Процесор і GPS не заснуть.');
            }
        } catch (err) {
            console.warn(`Не вдалося активувати фоновий режим: ${err.message}`);
        }
    }

    function deactivateWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release()
                .then(() => {
                    wakeLock = null;
                    console.log('🤖 AI: Режим сну відновлено.');
                });
        }
    }

    function updateTrackingMetrics() {
        const startTime = parseInt(localStorage.getItem('workoutStartTime'));
        if (!startTime) return;

        const elapsedTime = Date.now() - startTime;
        if (timeDisplay) timeDisplay.innerText = formatTime(elapsedTime);

        const targetType = localStorage.getItem('workoutTargetType');
        const targetValue = parseFloat(localStorage.getItem('workoutTargetValue'));

        if (distDisplay) distDisplay.innerText = totalDistance.toFixed(2);

        const currentSpeed = (totalDistance / (elapsedTime / 3600000)).toFixed(1);
        if (speedDisplay) speedDisplay.innerText = isNaN(currentSpeed) || !isFinite(currentSpeed) ? "0.0" : currentSpeed;

        let percent = 0;
        if (targetType === 'distance') {
            percent = Math.min((totalDistance / targetValue) * 100, 100);
            if (leftDisplay) leftDisplay.innerText = `${Math.max(0, (targetValue - totalDistance).toFixed(2))} км`;
        } else {
            const minsPassed = elapsedTime / 60000;
            percent = Math.min((minsPassed / targetValue) * 100, 100);
            if (leftDisplay) leftDisplay.innerText = `${Math.max(0, (targetValue - minsPassed).toFixed(1))} хв`;
        }
        if (progressDisplay) progressDisplay.innerText = `${Math.floor(percent)}%`;

        if (percent >= 100) {
            console.log("Ціль досягнута!");
        }
    }

    function startListeningGPS() {
        if (!navigator.geolocation) return;

        watchId = navigator.geolocation.watchPosition(position => {
            const { latitude, longitude, speed } = position.coords;
            const newPos = [latitude, longitude];

            if (userMarker) userMarker.setLatLng(newPos);
            else userMarker = L.marker(newPos).addTo(map);
            map.panTo(newPos);

            if (userPath.length > 0) {
                const lastPos = userPath[userPath.length - 1];
                const diff = calculateDistance(lastPos[0], lastPos[1], latitude, longitude);
                if (diff > 0.002) { 
                    totalDistance += diff;
                    localStorage.setItem('workoutTotalDistance', totalDistance); 
                }
            }

            userPath.push(newPos);
            localStorage.setItem('workoutUserPath', JSON.stringify(userPath)); 

            if (routePolyline) {
                routePolyline.setLatLngs(userPath);
            } else {
                routePolyline = L.polyline(userPath, { color: '#00a2ff', weight: 6, opacity: 0.8 }).addTo(map);
            }

            updateTrackingMetrics();
        }, error => console.error(error), {
            enableHighAccuracy: true,
            maximumAge: 0
        });
    }

    // КЛІК: СТАРТ
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            const targetType = document.getElementById('target-type').value;
            const targetValue = parseFloat(document.getElementById('target-value').value) || 5;

            // Активуємо утримання процесора для кишені
            activateWakeLock();

            localStorage.setItem('isWorkoutActive', 'true');
            localStorage.setItem('workoutStartTime', Date.now().toString());
            localStorage.setItem('workoutTargetType', targetType);
            localStorage.setItem('workoutTargetValue', targetValue.toString());
            localStorage.setItem('workoutTotalDistance', '0');
            localStorage.setItem('workoutUserPath', JSON.stringify([]));
            localStorage.setItem('workoutActivity', selectedActivity);

            panelSetup.style.display = 'none';
            panelTracking.style.display = 'block';

            totalDistance = 0;
            userPath = [];

            timerInterval = setInterval(updateTrackingMetrics, 1000);
            startListeningGPS();
        });
    }

    // КЛІК: СТОП
    // КЛІК: СТОП (Модернізований для розрахунку калорій)
    if (btnStop) {
        btnStop.addEventListener('click', () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
            clearInterval(timerInterval);

            // Зупиняємо кишеньковий режим
            deactivateWakeLock();

            const startTime = parseInt(localStorage.getItem('workoutStartTime'));
            const elapsedTimeSec = (Date.now() - startTime) / 1000; // Час у секундах
            const elapsedTimeHours = elapsedTimeSec / 3600; // Переводимо в години

            // Коефіцієнти MET для ШІ-калькулятора під кожну твою кнопку
            const metValues = {
                walking: 3.5,
                running: 8.0,
                cycling: 6.0,
                scooter: 4.0,
                skates: 5.0,
                hiking: 6.5
            };

            const activity = localStorage.getItem('workoutActivity') || 'walking';
            const currentMET = metValues[activity] || 3.5;
            const userWeight = 70; // Базова середня вага для розрахунків у кг

            // Головна формула: MET * Вага * Час у годинах
            const burnedCalories = Math.round(currentMET * userWeight * elapsedTimeHours);

            // Рятуємо фінальні дані тренування в пам'ять
            localStorage.setItem('lastWorkoutDistance', totalDistance.toFixed(2));
            localStorage.setItem('lastWorkoutTime', elapsedTimeSec.toString());
            localStorage.setItem('lastWorkoutActivity', activity);
            localStorage.setItem('lastWorkoutCalories', burnedCalories.toString());

            // Плюсуємо калорії до загального щоденного лічильника
            let todayCalories = parseInt(localStorage.getItem('todayBurnedCalories')) || 0;
            todayCalories += burnedCalories;
            localStorage.setItem('todayBurnedCalories', todayCalories.toString());

            // Очищаємо прапорці активної сесії
            localStorage.removeItem('isWorkoutActive');
            localStorage.removeItem('workoutStartTime');

            alert(`Тренування завершено!\nПройдено: ${totalDistance.toFixed(2)} км\nСпалено: ${burnedCalories} ккал 🔥`);
            window.location.href = 'dashboard.html';
        });
    }

    if (localStorage.getItem('isWorkoutActive') === 'true') {
        panelSetup.style.display = 'none';
        panelTracking.style.display = 'block';

        // Перезапускаємо утримання фону, якщо сторінка була оновлена під час тренування
        activateWakeLock();

        totalDistance = parseFloat(localStorage.getItem('workoutTotalDistance')) || 0;
        userPath = JSON.parse(localStorage.getItem('workoutUserPath')) || [];
        selectedActivity = localStorage.getItem('workoutActivity') || 'walking';

        btnActivity.forEach(b => {
            b.classList.remove('selected');
            if(b.getAttribute('data-type') === selectedActivity) b.classList.add('selected');
        });
        if (aiMapAdvice && aiTips[selectedActivity]) aiMapAdvice.innerText = aiTips[selectedActivity];

        if (userPath.length > 0) {
            routePolyline = L.polyline(userPath, { color: '#00a2ff', weight: 6, opacity: 0.8 }).addTo(map);
            const lastPos = userPath[userPath.length - 1];
            map.setView(lastPos, 16);
            if (userMarker) userMarker.setLatLng(lastPos);
        }

        timerInterval = setInterval(updateTrackingMetrics, 1000);
        startListeningGPS();
    }
    
    // Обробка ситуації, коли користувач згорнув і розгорнув браузер назад вручну
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && localStorage.getItem('isWorkoutActive') === 'true') {
            activateWakeLock();
        }
    });
});