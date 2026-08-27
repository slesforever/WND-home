/**
 * SCHALE SYSTEM - MUSIC & AUDIO CONTROLLER
 * Handles YouTube BGM (Unwelcome School) & Web Audio SFX
 */

let audioCtx = null;
let ytPlayer = null;
let isBgmPlaying = false;

// 1. YouTube Player API 載入 (Unwelcome School - eMqWJDP28p8)
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-player', {
    height: '0',
    width: '0',
    videoId: 'eMqWJDP28p8',
    playerVars: {
      'autoplay': 0,
      'controls': 0,
      'loop': 1,
      'playlist': 'eMqWJDP28p8'
    }
  });
}

// 2. Web Audio API 音效系統 (清澈清爽音調)
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// 開機點擊音效 (清澈水滴/水晶音)
function playStartChime() {
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  freqs.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + (idx * 0.04));

    gain.gain.setValueAtTime(0.05, now + (idx * 0.04));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.04) + 0.4);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now + (idx * 0.04));
    osc.stop(now + (idx * 0.04) + 0.4);
  });
}

// 切換頁籤輕點音
function playTapSfx() {
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(450, now + 0.03);

  gain.gain.setValueAtTime(0.03, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}

// 3. 點擊「TOUCH TO START」觸發開機與音樂
function startSystem() {
  playStartChime();

  // 觸發 YouTube 音樂播放
  if (ytPlayer && ytPlayer.playVideo) {
    ytPlayer.unMute();
    ytPlayer.setVolume(80);
    ytPlayer.playVideo();
    isBgmPlaying = true;
    
    const bgmIcon = document.getElementById('bgm-icon');
    if (bgmIcon) bgmIcon.innerText = '❚❚';
  }

  // 開機畫面淡出
  const bootScreen = document.getElementById('boot-screen');
  if (bootScreen) {
    bootScreen.classList.add('fade-out');
    setTimeout(() => {
      bootScreen.style.display = 'none';
    }, 600);
  }
}

// 4. 切換頁籤
function switchTab(index) {
  playTapSfx();
  const tabs = document.querySelectorAll('.tab-item');
  const pages = document.querySelectorAll('.page');

  tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
  pages.forEach((page, i) => page.classList.toggle('active', i === index));
}

// 5. 音樂手動開關
function toggleBgm() {
  playTapSfx();
  if (!ytPlayer) return;

  const bgmIcon = document.getElementById('bgm-icon');

  if (isBgmPlaying) {
    ytPlayer.pauseVideo();
    isBgmPlaying = false;
    if (bgmIcon) bgmIcon.innerText = '♪';
  } else {
    ytPlayer.playVideo();
    isBgmPlaying = true;
    if (bgmIcon) bgmIcon.innerText = '❚❚';
  }
}
