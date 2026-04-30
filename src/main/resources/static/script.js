const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('image');
const loadingArea = document.getElementById('loadingArea');
const answerPart = document.getElementById('answerPart');
const previewImg = document.getElementById('preview');
const topResultBox = document.getElementById('topResult');
const otherResultsBox = document.getElementById('otherResults');
const rawJson = document.getElementById('rawJson');
const metaTime = document.getElementById('metaTime');
const metaSize = document.getElementById('metaSize');
const themeToggle = document.getElementById('themeToggle');

dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

['dragenter', 'dragover'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragging');
    })
);
['dragleave', 'drop'].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragging');
    })
);
dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

document.querySelectorAll('.sample-btn').forEach((btn) =>
    btn.addEventListener('click', async () => {
        const url = btn.dataset.url;
        try {
            btn.disabled = true;
            const res = await fetch(url);
            const blob = await res.blob();
            const file = new File([blob], 'sample.jpg', { type: blob.type || 'image/jpeg' });
            handleFile(file);
        } catch (err) {
            renderError(new Error('Beispielbild konnte nicht geladen werden: ' + err.message));
        } finally {
            btn.disabled = false;
        }
    })
);

themeToggle.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    themeToggle.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('djl-theme', dark ? 'dark' : 'light');
});

if (localStorage.getItem('djl-theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
}

function handleFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => (previewImg.src = e.target.result);
    reader.readAsDataURL(file);

    metaSize.textContent = `📏 ${formatBytes(file.size)}`;
    answerPart.hidden = true;
    loadingArea.hidden = false;

    const formData = new FormData();
    formData.append('image', file);

    const start = performance.now();
    fetch('/analyze', { method: 'POST', body: formData })
        .then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then((data) => {
            const elapsed = ((performance.now() - start) / 1000).toFixed(2);
            metaTime.textContent = `⏱ ${elapsed} s`;
            renderResults(data);
        })
        .catch(renderError)
        .finally(() => (loadingArea.hidden = true));
}

function renderResults(results) {
    rawJson.textContent = JSON.stringify(results, null, 2);
    const sorted = [...results].sort((a, b) => b.probability - a.probability);
    const top = sorted[0];
    const others = sorted.slice(1, 3);

    topResultBox.innerHTML = `
        <div class="top-label">Wahrscheinlichste Klasse</div>
        <div class="top-name">${cleanClassName(top.className)}</div>
        <div class="top-bar">
            <div class="top-bar-fill" style="width:${(top.probability * 100).toFixed(1)}%"></div>
            <span class="top-pct">${(top.probability * 100).toFixed(1)} %</span>
        </div>
    `;

    otherResultsBox.innerHTML = others.length
        ? `<div class="other-title">Alternative Klassen</div>` +
          others
              .map(
                  (item) => `
            <div class="other-item">
                <span class="other-name">${cleanClassName(item.className)}</span>
                <div class="other-bar">
                    <div class="other-bar-fill" style="width:${(item.probability * 100).toFixed(1)}%"></div>
                </div>
                <span class="other-pct">${(item.probability * 100).toFixed(1)} %</span>
            </div>`
              )
              .join('')
        : '';

    answerPart.hidden = false;
}

function cleanClassName(raw) {
    if (!raw) return '';
    const parts = raw.split(/\s+/);
    const name = parts.length > 1 ? parts.slice(1).join(' ') : raw;
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function renderError(err) {
    topResultBox.innerHTML = `<div class="error-box">⚠️ Fehler: ${err.message}</div>`;
    otherResultsBox.innerHTML = '';
    rawJson.textContent = '';
    answerPart.hidden = false;
}
