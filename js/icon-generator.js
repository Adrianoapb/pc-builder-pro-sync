/**
 * Gerador de ícones PWA inline via Canvas
 * Executado automaticamente ao carregar o app
 * Cria ícones em memória se os arquivos não estiverem disponíveis
 */

(function generatePWAIcon() {
  function drawIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background gradient indigo → purple
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#8b5cf6');

    // Rounded rect
    const r = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    const cx = size / 2;
    const cy = size / 2;
    const sq = size * 0.38;

    // CPU body
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(cx - sq/2, cy - sq/2, sq, sq);

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = size * 0.036;
    ctx.lineJoin = 'round';
    ctx.strokeRect(cx - sq/2, cy - sq/2, sq, sq);

    // Pins
    const pinLen = size * 0.09;
    const pinW = size * 0.028;
    const pinCount = 3;
    const spacing = sq / (pinCount + 1);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';

    for (let i = 1; i <= pinCount; i++) {
      const offset = spacing * i;
      // Top
      ctx.fillRect(cx - sq/2 + offset - pinW/2, cy - sq/2 - pinLen, pinW, pinLen);
      // Bottom
      ctx.fillRect(cx - sq/2 + offset - pinW/2, cy + sq/2, pinW, pinLen);
      // Left
      ctx.fillRect(cx - sq/2 - pinLen, cy - sq/2 + offset - pinW/2, pinLen, pinW);
      // Right
      ctx.fillRect(cx + sq/2, cy - sq/2 + offset - pinW/2, pinLen, pinW);
    }

    // Inner grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = size * 0.012;
    const innerPad = sq * 0.2;
    const innerSize = sq - innerPad * 2;
    ctx.strokeRect(cx - innerSize/2, cy - innerSize/2, innerSize, innerSize);

    // Center dot
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.04, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL('image/png');
  }

  // Cria ícone base que pode ser usado via link
  try {
    const iconData192 = drawIcon(192);
    // Adiciona como favicon dinamicamente
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconData192;

    // Apple touch icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (appleLink) appleLink.href = drawIcon(180);

    console.log('[Icons] Ícones PWA gerados via canvas');
  } catch(e) {
    console.warn('[Icons] Não foi possível gerar ícones:', e);
  }
})();
