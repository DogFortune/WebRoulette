const PALETTE = [
    '#e8c97a', '#c44f3a', '#5b9bd5', '#7abd7e', '#d57a5b',
    '#a07abf', '#5bbfbf', '#d5a05b', '#bf7a9e', '#7a9ebf'
];

const DEFAULTS = ['1', '2', '3', '4', '5'];

let entries = [...DEFAULTS];
let spinning = false;
let currentAngle = 0;
let animId = null;

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const entryList = document.getElementById('entryList');
const btnSpin = document.getElementById('btnSpin');
const btnAdd = document.getElementById('btnAdd');
const btnShuffle = document.getElementById('btnShuffle');
const resultBox = document.getElementById('resultBox');
const resultText = document.getElementById('resultText');
const resultDot = document.getElementById('resultDot');

/**
 * 乱数を作ります。
 * @returns 0.0以上、1.0未満の乱数1つ
 */
function cryptoRandom() {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    // 結合して64bit整数にしてから割る事でより精度の高い乱数を作る。
    return (arr[0] * 2 ** 32 + arr[1]) / (2 ** 64);
}

function cryptoRandomInt(min, max) {
    const range = max - min;
    const bits = Math.ceil(Math.log2(range + 1));
    const bytes = Math.ceil(bits / 8);
    const mask = (1 << bits) - 1;
    let val;
    do {
        const arr = new Uint8Array(bytes);
        crypto.getRandomValues(arr);
        val = arr.reduce((acc, b, i) => acc | (b << (i * 8)), 0) & mask;
    } while (val > range);
    return min + val;
}

function resizeCanvas() {
    const size = canvas.parentElement.offsetWidth;
    canvas.width = size;
    canvas.height = size;
    drawWheel(currentAngle);
}

function drawWheel(angle) {
    const n = entries.length;
    if (n === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx * 0.96;
    const slice = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < n; i++) {
        const start = angle + i * slice - Math.PI / 2;
        const end = start + slice;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = PALETTE[i % PALETTE.length];
        ctx.fill();
        ctx.strokeStyle = '#0d0d0f';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
        const mid = angle + i * slice + slice / 2 - Math.PI / 2;
        const textR = r * 0.68;
        const tx = cx + textR * Math.cos(mid);
        const ty = cy + textR * Math.sin(mid);
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(mid + Math.PI / 2);
        ctx.fillStyle = '#0d0d0f';
        ctx.font = `bold ${Math.max(11, Math.min(17, r / (n * 0.7)))}px 'Noto Sans JP', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = entries[i].length > 10 ? entries[i].slice(0, 10) + '…' : entries[i];
        ctx.fillText(label, 0, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.13, 0, 2 * Math.PI);
    ctx.fillStyle = '#0d0d0f';
    ctx.fill();
    ctx.strokeStyle = '#2a2a32';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function renderEntries() {
    entryList.innerHTML = '';
    entries.forEach((e, i) => {
        const row = document.createElement('div');
        row.className = 'entry-row';

        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.background = PALETTE[i % PALETTE.length];

        const input = document.createElement('input');
        input.className = 'entry-input';
        input.value = e;
        input.maxLength = 30;
        input.addEventListener('input', () => {
            entries[i] = input.value;
            drawWheel(currentAngle);
        });

        const del = document.createElement('button');
        del.className = 'btn-remove';
        del.textContent = '×';
        del.title = '削除';
        del.addEventListener('click', () => {
            if (entries.length <= 2) return;
            entries.splice(i, 1);
            renderEntries();
            drawWheel(currentAngle);
        });

        row.append(dot, input, del);
        entryList.appendChild(row);
    });
}

function spin() {
    if (spinning || entries.length < 2) return;
    spinning = true;
    btnSpin.disabled = true;
    resultBox.classList.remove('lit');
    resultText.classList.remove('show');
    resultDot.style.display = 'none';

    const extraRotations = cryptoRandomInt(5, 10) * 2 * Math.PI;
    const landingSlice = cryptoRandomInt(0, entries.length - 1);
    const sliceAngle = (2 * Math.PI) / entries.length;
    const offsetInSlice = cryptoRandom() * sliceAngle * 0.6 + sliceAngle * 0.2;
    const target = extraRotations + landingSlice * sliceAngle + offsetInSlice;

    const duration = 3500 + cryptoRandomInt(0, 800);
    const startAngle = currentAngle;
    const startTime = performance.now();

    function easeOut(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    function tick(now) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        currentAngle = startAngle + target * easeOut(t);
        drawWheel(currentAngle);

        if (t < 1) {
            animId = requestAnimationFrame(tick);
        } else {
            currentAngle = startAngle + target;
            drawWheel(currentAngle);
            spinning = false;
            btnSpin.disabled = false;
            showResult();
        }
    }

    animId = requestAnimationFrame(tick);
}

function showResult() {
    const n = entries.length;
    const sliceAngle = (2 * Math.PI) / n;
    const normalised = (((-currentAngle % (2 * Math.PI)) + 2 * Math.PI)) % (2 * Math.PI);
    const idx = Math.floor(normalised / sliceAngle) % n;
    const winner = entries[idx] || entries[0];

    resultDot.style.background = PALETTE[idx % PALETTE.length];
    resultDot.style.display = 'block';
    resultText.textContent = winner;
    resultBox.classList.add('lit');
    setTimeout(() => resultText.classList.add('show'), 30);
}

btnAdd.addEventListener('click', () => {
    if (entries.length >= 20) return;
    entries.push(`選択肢 ${entries.length + 1}`);
    renderEntries();
    drawWheel(currentAngle);
    entryList.scrollTop = entryList.scrollHeight;
});

btnShuffle.addEventListener('click', () => {
    for (let i = entries.length - 1; i > 0; i--) {
        const j = cryptoRandomInt(0, i);
        [entries[i], entries[j]] = [entries[j], entries[i]];
    }
    renderEntries();
    drawWheel(currentAngle);
});

btnSpin.addEventListener('click', spin);

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
renderEntries();