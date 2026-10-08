(() => {
  const button = document.getElementById("draw");
  const label = button.querySelector(".label");
  const frame = document.getElementById("frame");
  const photo = document.getElementById("photo");
  const status = document.getElementById("status");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FADE_MS = reduceMotion ? 0 : 200;

  let images = [];
  let bag = [];
  let last = null;
  let next = null;
  let busy = false;
  let count = 0;

  const preloaded = new Map();

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function take() {
    if (bag.length === 0) {
      bag = shuffle(images);
      if (bag.length > 1 && bag[0] === last) {
        const j = 1 + Math.floor(Math.random() * (bag.length - 1));
        [bag[0], bag[j]] = [bag[j], bag[0]];
      }
    }
    return bag.shift();
  }

  function preload(src) {
    if (!preloaded.has(src)) {
      const img = new Image();
      const ready = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      img.src = src;
      preloaded.set(src, img.decode ? ready.then(() => img.decode()).catch(() => ready) : ready);
    }
    return preloaded.get(src);
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setBusy(on) {
    busy = on;
    button.disabled = on;
    button.setAttribute("aria-busy", on ? "true" : "false");
  }

  async function draw() {
    if (busy || images.length === 0) return;
    setBusy(true);

    const src = next ?? take();
    next = null;

    try {
      const leaving = !photo.hidden;
      if (leaving) photo.classList.add("is-leaving");
      await Promise.all([preload(src), wait(leaving ? FADE_MS : 0)]);

      photo.src = src;
      photo.hidden = false;
      frame.dataset.state = "filled";
      last = src;
      count += 1;

      if (!leaving) {
        photo.classList.add("is-leaving");
        photo.getBoundingClientRect();
      }
      photo.classList.remove("is-leaving");

      label.textContent = "再抽一張";
      status.textContent = `第 ${count} 抽・也可以按空白鍵抽換`;
    } catch {
      preloaded.delete(src);
      photo.classList.remove("is-leaving");
      status.textContent = "這張圖載入失敗了，再抽一次試試";
    } finally {
      setBusy(false);
    }

    next = take();
    preload(next).catch(() => preloaded.delete(next));
  }

  button.addEventListener("click", draw);

  document.addEventListener("keydown", (e) => {
    if (e.target === button) return;
    if (e.code === "Space" || e.key === "Enter") {
      e.preventDefault();
      draw();
    }
  });

  fetch("images.json", { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then((list) => {
      images = Array.isArray(list) ? list.filter(Boolean) : [];
      if (images.length === 0) {
        status.textContent = "資料夾裡還沒有圖片";
        return;
      }
      button.disabled = false;
      next = take();
      preload(next).catch(() => preloaded.delete(next));
    })
    .catch(() => {
      status.textContent = "圖片清單載入失敗，請重新整理頁面";
    });
})();
