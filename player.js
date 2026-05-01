// ==========================
// ELEMENTOS
// ==========================
const audio = document.getElementById("audio");
const fileInput = document.getElementById("fileInput");
const playBtn = document.getElementById("playBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const trackName = document.getElementById("trackName");
const progress = document.getElementById("progress");
const playlistUI = document.getElementById("playlistUI");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const volumeSlider = document.getElementById("volume");
const muteBtn = document.getElementById("muteBtn");
const cover = document.getElementById("cover");
const vinyl = document.querySelector(".vinyl");

const miniCover = document.getElementById("miniCover");
const miniTrackName = document.getElementById("miniTrackName");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const dropZone = document.getElementById("dropZone");

const addMusicFloat = document.getElementById("addMusicFloat");
const miniPlaylist = document.getElementById("miniPlaylist");

// ==========================
// ESTADO
// ==========================
let playlist = [];
let currentIndex = 0;
let isShuffle = false;
let repeatMode = 0;
let currentObjectURL = null;
let draggedIndex = null;

const DEFAULT_COVER = "assets/default-cover.png";

// ==========================
// 🎧 FADE
// ==========================
function fadeIn() {
  const targetVolume = parseFloat(volumeSlider.value) || 1;

  audio.volume = 0;
  audio.play();

  let interval = setInterval(() => {
    audio.volume = Math.min(audio.volume + 0.05, targetVolume);

    if (audio.volume >= targetVolume) {
      audio.volume = targetVolume;
      clearInterval(interval);
    }
  }, 20);
}

function fadeOut() {
  return new Promise((resolve) => {
    let interval = setInterval(() => {
      audio.volume = Math.max(audio.volume - 0.05, 0);

      if (audio.volume <= 0) {
        clearInterval(interval);
        audio.pause();
        audio.volume = parseFloat(volumeSlider.value) || 1;
        resolve();
      }
    }, 20);
  });
}

// ==========================
// SEGURANÇA EXTRA
// ==========================
audio.addEventListener("play", () => {
  if (audio.volume === 0) {
    audio.volume = parseFloat(volumeSlider.value) || 1;
  }
});

// ==========================
// ARQUIVOS
// ==========================
function handleFiles(files) {
  const valid = Array.from(files).filter((f) => f.type.startsWith("audio/"));

  if (!valid.length) return;

  playlist = [...playlist, ...valid];

  if (!audio.src) loadTrack(0);

  renderPlaylist();
}

fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

dropZone.addEventListener("dragover", (e) => e.preventDefault());
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
});

// ==========================
// MINI PLAYLIST
// ==========================
function renderMiniPlaylist() {
  if (!miniPlaylist) return;

  miniPlaylist.innerHTML = "";

  playlist.slice(0, 6).forEach((file, index) => {
    const div = document.createElement("div");
    div.className = "mini-track";

    const name = file.name.replace(/\.[^/.]+$/, "");
    div.textContent = name.slice(0, 20);

    if (index === currentIndex) {
      div.classList.add("active");
    }

    div.onclick = async () => {
      currentIndex = index;
      await fadeOut();
      loadTrack(index);
      fadeIn();
      renderPlaylist();
    };

    miniPlaylist.appendChild(div);
  });
}

// ==========================
// PLAYLIST
// ==========================
function renderPlaylist() {
  playlistUI.innerHTML = "";

  playlist.forEach((file, index) => {
    const li = document.createElement("li");
    li.draggable = true;

    li.innerHTML = `
      <span class="track-name">${file.name}</span>
      <span class="remove-btn">🗑️</span>
    `;

    if (index === currentIndex) li.classList.add("active");

    li.addEventListener("click", async () => {
      currentIndex = index;
      await fadeOut();
      loadTrack(index);
      fadeIn();
      renderPlaylist();
    });

    li.querySelector(".remove-btn").onclick = (e) => {
      e.stopPropagation();
      playlist.splice(index, 1);
      if (index < currentIndex) {
        currentIndex--;
      } else if (index === currentIndex) {
        if (playlist.length === 0) {
          audio.src = "";
          trackName.textContent = "Nenhuma música carregada";
          miniTrackName.textContent = "Nenhuma música";
          cover.src = DEFAULT_COVER;
          miniCover.src = DEFAULT_COVER;
          vinyl.classList.remove("playing");
          playBtn.textContent = "▶";
        } else {
          currentIndex = Math.min(currentIndex, playlist.length - 1);
          loadTrack(currentIndex);
        }
      }
      renderPlaylist();
    };

    li.addEventListener("dragstart", () => {
      draggedIndex = index;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

    li.addEventListener("dragover", (e) => e.preventDefault());

    li.addEventListener("drop", (e) => {
      e.preventDefault();

      if (draggedIndex === null) return;

      const targetIndex = index;
      const item = playlist.splice(draggedIndex, 1)[0];
      let insertIndex = targetIndex;
      if (draggedIndex < targetIndex) {
        insertIndex--;
      }
      playlist.splice(insertIndex, 0, item);

      if (draggedIndex === currentIndex) {
        currentIndex = insertIndex;
      } else if (draggedIndex < currentIndex && insertIndex >= currentIndex) {
        currentIndex--;
      } else if (draggedIndex > currentIndex && insertIndex <= currentIndex) {
        currentIndex++;
      }

      draggedIndex = null;
      renderPlaylist();
    });

    playlistUI.appendChild(li);
  });

  renderMiniPlaylist();
}

// ==========================
// LOAD TRACK
// ==========================
function loadTrack(index) {
  const file = playlist[index];
  if (!file) return;

  if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);

  currentObjectURL = URL.createObjectURL(file);
  audio.src = currentObjectURL;

  const name = file.name.replace(/\.[^/.]+$/, "");
  trackName.textContent = name;
  miniTrackName.textContent = name;

  if (window.jsmediatags) {
    jsmediatags.read(file, {
      onSuccess: function (tag) {
        const picture = tag.tags.picture;

        if (picture) {
          let base64 = "";
          picture.data.forEach((b) => (base64 += String.fromCharCode(b)));

          const url = `data:${picture.format};base64,${btoa(base64)}`;

          cover.src = url;
          miniCover.src = url;
        } else {
          cover.src = DEFAULT_COVER;
          miniCover.src = DEFAULT_COVER;
        }
      },
      onError: () => {
        cover.src = DEFAULT_COVER;
        miniCover.src = DEFAULT_COVER;
      },
    });
  } else {
    cover.src = DEFAULT_COVER;
    miniCover.src = DEFAULT_COVER;
  }

  // 🔥 GARANTE SINCRONIZAÇÃO
  renderMiniPlaylist();
}

// ==========================
// CONTROLES
// ==========================
playBtn.onclick = async () => {
  if (!audio.src) return;

  if (audio.paused) {
    fadeIn();
    vinyl.classList.add("playing");
    playBtn.textContent = "⏸";
  } else {
    await fadeOut();
    vinyl.classList.remove("playing");
    playBtn.textContent = "▶";
  }
};

nextBtn.onclick = async () => {
  if (!playlist.length) return;

  await fadeOut();

  currentIndex = isShuffle
    ? Math.floor(Math.random() * playlist.length)
    : (currentIndex + 1) % playlist.length;

  loadTrack(currentIndex);
  fadeIn();
  renderMiniPlaylist();
};

prevBtn.onclick = async () => {
  if (!playlist.length) return;

  await fadeOut();

  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;

  loadTrack(currentIndex);
  fadeIn();
  renderMiniPlaylist();
};

// ==========================
// AUTO NEXT
// ==========================
audio.addEventListener("ended", async () => {
  if (!playlist.length) return;

  if (repeatMode === 2) {
    audio.currentTime = 0;
    fadeIn();
    return;
  }

  await fadeOut();

  currentIndex = isShuffle
    ? Math.floor(Math.random() * playlist.length)
    : currentIndex + 1;

  if (currentIndex >= playlist.length) {
    if (repeatMode === 1) {
      currentIndex = 0;
    } else {
      return;
    }
  }

  loadTrack(currentIndex);
  fadeIn();
  renderMiniPlaylist();
});

// ==========================
// BOTÕES
// ==========================
shuffleBtn.onclick = () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active");
};

repeatBtn.onclick = () => {
  repeatMode = (repeatMode + 1) % 3;
  repeatBtn.classList.toggle("active", repeatMode > 0);
  if (repeatMode === 2) {
    repeatBtn.textContent = "🔂";
  } else if (repeatMode === 1) {
    repeatBtn.textContent = "🔁";
  } else {
    repeatBtn.textContent = "🔁";
  }
};

// ==========================
// PROGRESS
// ==========================
audio.ontimeupdate = () => {
  progress.value = audio.currentTime;
  progress.max = audio.duration || 0;

  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
};

progress.oninput = () => {
  audio.currentTime = progress.value;
};

// ==========================
// VOLUME
// ==========================
volumeSlider.oninput = () => {
  audio.volume = volumeSlider.value;
};

muteBtn.onclick = () => {
  if (audio.volume > 0) {
    audio.volume = 0;
    muteBtn.textContent = "🔇";
  } else {
    audio.volume = volumeSlider.value || 1;
    muteBtn.textContent = "🔊";
  }
};

// ==========================
// UTIL
// ==========================
function formatTime(t) {
  if (!t) return "00:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ==========================
// MOBILE BOTÃO
// ==========================
if (addMusicFloat) {
  addMusicFloat.onclick = () => {
    fileInput.click();
  };
}
