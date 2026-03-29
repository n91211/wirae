/* ============================================================
   tools/ascii576.js — ASKII64
   이미지를 아스키 아트로 변환합니다.
   ============================================================ */

window.ToolRegistry = window.ToolRegistry || {};

window.ToolRegistry['ascii576'] = {
  init(container) {
    container.style.flexDirection  = 'column';
    container.style.alignItems     = 'stretch';
    container.style.justifyContent = 'flex-start';
    container.style.gap            = '1rem';
    container.style.padding        = '1.5rem';

    const CHARS  = ' .:-=+*#%@';
    const RATIOS = [
      { label: '1:1', w: 64, h: 64 },
      { label: '2:3', w: 64, h: 96 },
      { label: '3:2', w: 96, h: 64 },
    ];
    let currentRatio = RATIOS[0];
    let lastImage    = null;

    // ── 드롭 존 ────────────────────────────────────────────
    const dropZone = document.createElement('div');
    dropZone.className = 'ascii-drop';

    const dropLabel = document.createElement('span');
    dropLabel.textContent = '이미지를 여기에 끌어다 놓으세요';
    dropZone.appendChild(dropLabel);

    container.appendChild(dropZone);

    // ── 비율 버튼 ──────────────────────────────────────────
    const ratioRow = document.createElement('div');
    ratioRow.className = 'ascii-ratio-row';
    const ratioBtns = RATIOS.map(ratio => {
      const btn = document.createElement('button');
      btn.className = 'ratio-btn' + (ratio === currentRatio ? ' active' : '');
      btn.textContent = ratio.label;
      btn.addEventListener('click', () => {
        currentRatio = ratio;
        ratioBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateGuide();
        if (lastImage) render();
      });
      ratioRow.appendChild(btn);
      return btn;
    });
    container.appendChild(ratioRow);

    // ── 출력 (고정 높이 래퍼) ──────────────────────────────
    const outputWrapper = document.createElement('div');
    outputWrapper.className = 'ascii-output-wrapper';

    const guide = document.createElement('div');
    guide.className = 'ascii-ratio-guide';
    outputWrapper.appendChild(guide);

    const output = document.createElement('pre');
    output.className = 'ascii-output';
    output.hidden = true;
    outputWrapper.appendChild(output);
    container.appendChild(outputWrapper);

    // ── 복사 버튼 (항상 표시, 비활성 상태로 시작) ──────────
    const copyBtn = document.createElement('button');
    copyBtn.className = 'ascii-copy';
    copyBtn.textContent = '복사';
    copyBtn.disabled = true;
    container.appendChild(copyBtn);

    // ── Canvas (화면에 표시 안 함) ──────────────────────────
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');

    // ── 가이드 업데이트 ────────────────────────────────────
    function updateGuide() {
      const { w, h } = currentRatio;
      const MAX = 300;
      const scale = MAX / Math.max(w, h);
      guide.style.width  = Math.round(w * scale) + 'px';
      guide.style.height = Math.round(h * scale) + 'px';
    }

    // ── 렌더링 ─────────────────────────────────────────────
    function render() {
      const { w, h } = currentRatio;
      canvas.width  = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(lastImage, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let result = '';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i          = (y * w + x) * 4;
          const brightness = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          result          += CHARS[Math.floor(brightness * (CHARS.length - 1))].repeat(2);
        }
        result += '\n';
      }
      output.textContent = result;
      output.hidden      = false;
      guide.hidden       = true;
      copyBtn.disabled   = false;
    }

    // ── 파일 처리 ──────────────────────────────────────────
    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          lastImage = img;
          render();
          dropLabel.textContent = '새 이미지를 끌어다 놓으세요';
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // ── 드래그 앤 드롭 이벤트 ──────────────────────────────
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });

    // ── 복사 ───────────────────────────────────────────────
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(output.textContent).then(() => {
        copyBtn.textContent = '복사됨!';
        setTimeout(() => { copyBtn.textContent = '복사'; }, 1500);
      });
    });

    // ── 초기화 ─────────────────────────────────────────────
    updateGuide();
  },
};
