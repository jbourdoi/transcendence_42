
interface ColorPalette {
  player: string[];
  playerComp: string[];
  colorBall: string;
  colorBallComp: string;
}

export const color = {
  player: [
    "#4FC3FF",
    "#E040FB",
    "#2EFFC3",
    "#FF5252",
    "#FFEB3B",
    "#7C7CFF",
    "#18FFFF",
    "#FF9F43"
  ],
  playerComp: [
    "#08182E",
    "#2A083A",
    "#062E1A",
    "#3A0A0A",
    "#2E2A05",
    "#1A0E2E",
    "#0A2E2A",
    "#2E1405"
  ],
  colorBall: "#F5F7FA",
  colorBallComp: "#2A2A2A"
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60)      [r, g, b] = [c, x, 0];
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
  else if (300 <= h && h < 360) [r, g, b] = [c, 0, x];

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


/**
 * Génère une palette dynamique pour 2 à 8 joueurs
 * @param nbPlayers Nombre de joueurs (2-8)
 */
export function generatePaletteHex(nbPlayers: number): ColorPalette {
    if (nbPlayers < 2 || nbPlayers > 8) return color;

    const player: string[] = [];
    const playerComp: string[] = [];

    const step = 360 / nbPlayers;

    // Générer un ordre de indices qui alterne pour maximiser le contraste
    const indices: number[] = [];
    for (let i = 0; i < nbPlayers; i++) {
        // on prend les pairs puis les impairs
        if (i % 2 === 0) indices.push(i);
    }
    for (let i = 0; i < nbPlayers; i++) {
        if (i % 2 === 1) indices.push(i);
    }

    for (let i = 0; i < nbPlayers; i++) {
        const idx = indices[i];
        const hue = (idx * step) % 360;

        // Paddle lumineux
        const pad = hslToHex(hue, 90, 55);

        // Cage sombre
        const comp = hslToHex(hue, 60, 30);

        player.push(pad);
        playerComp.push(comp);
    }

    return {
        player,
        playerComp,
        colorBall: "#F5F7FA",
        colorBallComp: "#2A2A2A"
    };
}

