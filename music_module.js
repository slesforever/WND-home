/**
 * WND ARCHIVE - MUSIC & AUDIO CONTROLLER
 */

let audioCtx = null;
let ytPlayer = null;
let isBgmPlaying = false;

// 1. YouTube Player API
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

// 2. Web Audio API (柔和和弦與點擊音效)
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// 開機啟動音效 (暖色調 A Major 和弦)
function playSoftChime() {
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const notes = [440, 554.37, 659.25]; // A4, C#5, E5

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + (i * 0.08));

    gain.gain.setValueAtTime(0.06, now + (i * 0.08));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (i * 0.08) + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now + (i * 0.08));
    osc.stop(now + (i * 0.08) + 0.6);
  });
}

// UI 輕點音效
function playTapSfx() {
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.03);
}

// 3. 點擊開機畫面進入系統
function startSystem() {
  playSoftChime();

  if (ytPlayer && ytPlayer.playVideo) {
    ytPlayer.playVideo();
    isBgmPlaying = true;
    const bgmIcon = document.getElementById('bgm-icon');
    if (bgmIcon) bgmIcon.innerText = '❚❚';
  }

  const bootScreen = document.getElementById('boot-screen');
  if (bootScreen) {
    bootScreen.classList.add('fade-out');
    setTimeout(() => {
      bootScreen.style.display = 'none';
    }, 800);
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

// 5. BGM 播放 / 暫停控制
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
