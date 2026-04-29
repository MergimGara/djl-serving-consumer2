function checkFiles(files) {
    if (!files || files.length === 0) return;
    const file = files[0];

    const previewImg = document.getElementById('preview');
    const reader = new FileReader();
    reader.onload = (e) => { previewImg.src = e.target.result; };
    reader.readAsDataURL(file);

    document.getElementById('answerPart').style.display = 'none';
    document.getElementById('loadingArea').style.display = 'block';

    const formData = new FormData();
    formData.append('image', file);

    fetch('/analyze', { method: 'POST', body: formData })
        .then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then((data) => renderResults(data))
        .catch((err) => renderError(err))
        .finally(() => {
            document.getElementById('loadingArea').style.display = 'none';
        });
}

function renderResults(results) {
    const container = document.getElementById('answer');
    container.innerHTML = '';

    const tpl = document.getElementById('result-item-template');
    const sorted = [...results].sort((a, b) => b.probability - a.probability);

    sorted.forEach((item, idx) => {
        const node = tpl.content.cloneNode(true);
        const bar = node.querySelector('.progress-bar');
        const label = node.querySelector('.bar-label');
        const pct = Math.round(item.probability * 1000) / 10;

        bar.style.width = pct + '%';
        bar.setAttribute('aria-valuenow', pct);
        if (idx === 0) bar.classList.add('top-result');

        const cleanName = cleanClassName(item.className);
        label.textContent = `${cleanName} — ${pct}%`;
        container.appendChild(node);
    });

    document.getElementById('answerPart').style.display = 'block';
}

function cleanClassName(raw) {
    if (!raw) return '';
    const parts = raw.split(/\s+/);
    return parts.length > 1 ? parts.slice(1).join(' ') : raw;
}

function renderError(err) {
    const container = document.getElementById('answer');
    container.innerHTML = `<div class="error-box">Fehler: ${err.message}</div>`;
    document.getElementById('answerPart').style.display = 'block';
}
