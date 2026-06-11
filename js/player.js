document.addEventListener('DOMContentLoaded', () => {
    // База треків (стрімінг по URL з інтернету)
    const playlist = [
        {
            id: 1,
            title: "Cyberpunk Synthwave",
            artist: "White Bat Audio",
            src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", 
            cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300" 
        },
        {
            id: 2,
            title: "Power Running Drive",
            artist: "EDM Workout Mix",
            src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            cover: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300"
        },
        {
            id: 3,
            title: "Lofi Cardio Chill",
            artist: "Chillhop Beats",
            src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
            cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=300"
        }
    ];

    let currentTrackIndex = 0;
    let isPlaying = false;
    const audio = new Audio();

    // Елементи інтерфейсу
    const trackTitle = document.getElementById('player-title');
    const trackArtist = document.getElementById('player-artist');
    const trackCover = document.getElementById('player-cover');
    const btnPlay = document.getElementById('player-play');
    const btnPrev = document.getElementById('player-prev');
    const btnNext = document.getElementById('player-next');
    const volumeSlider = document.getElementById('player-volume');
    const progressBar = document.getElementById('player-progress');

    function loadTrack(index) {
        const track = playlist[index];
        if (!track) return;
        audio.src = track.src;
        if (trackTitle) trackTitle.innerText = track.title;
        if (trackArtist) trackArtist.innerText = track.artist;
        if (trackCover) trackCover.src = track.cover;
        if (progressBar) progressBar.value = 0;
    }

    function togglePlay() {
        if (playlist.length === 0) return;
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            if (btnPlay) btnPlay.innerHTML = '▶';
        } else {
            audio.play().catch(err => console.log("Взаємодія...", err));
            isPlaying = true;
            if (btnPlay) btnPlay.innerHTML = '⏸';
        }
    }

    function nextTrack() {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) audio.play().catch(e => console.log(e));
    }

    function prevTrack() {
        currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentTrackIndex);
        if (isPlaying) audio.play().catch(e => console.log(e));
    }

    if (btnPlay) btnPlay.addEventListener('click', togglePlay);
    if (btnNext) btnNext.addEventListener('click', nextTrack);
    if (btnPrev) btnPrev.addEventListener('click', prevTrack);

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audio.volume = e.target.value / 100;
        });
    }

    audio.addEventListener('ended', nextTrack);

    audio.addEventListener('timeupdate', () => {
        if (progressBar && audio.duration) {
            progressBar.value = (audio.currentTime / audio.duration) * 100;
        }
    });

    if (progressBar) {
        progressBar.addEventListener('input', (e) => {
            if (audio.duration) {
                audio.currentTime = (e.target.value / 100) * audio.duration;
            }
        });
    }

    loadTrack(currentTrackIndex);
});