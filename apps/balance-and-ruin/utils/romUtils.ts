import {
  DEFAULT_IN_GAME_CONFIG,
  WINDOW_PALETTE_DEFAULTS,
  FONT_PALETTE_DEFAULTS,
} from "~/types/inGameConfig";

const headerSize = 0x200;
const originalSize = 3145728;
const headeredSize = headerSize + originalSize;
const validHash =
  "0f51b4fca41b7fd509e4b8f9d543151f68efa5e97b08493e4b2a0c06f5d8d5e2";

type BufferType = Uint8Array | Buffer;

export function removeHeader(rom: BufferType) {
  if (rom.length === headeredSize) {
    return rom.slice(headerSize);
  }
  return rom;
}

export async function isValidROM(rom: BufferType) {
  if (rom.length !== originalSize) {
    return {
      success: false,
      message: `Invalid ROM size. Please upload an uncompressed US version 1.0 ROM file. Expected ${originalSize} and received ${rom.length}.`,
    };
  }

  let romHashData = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", rom)),
  );
  let romHashHex = romHashData
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  if (romHashHex !== validHash) {
    return {
      success: false,
      message:
        "Invalid ROM hash. Please upload an uncompressed US version 1.0 ROM file",
    };
  }
  return {
    success: true,
    message: "",
  };
}

/**
 * In-place patches a decrypted ROM Uint8Array with user's preferred system configurations.
 * Translated directly from the repository's original python utility implementation.
 */
export function applyInGameConfig(patched: Uint8Array) {
  if (typeof window === "undefined") return;

  const saved = localStorage.getItem("in_game_config");
  let config = DEFAULT_IN_GAME_CONFIG;
  if (saved) {
    try {
      config = { ...DEFAULT_IN_GAME_CONFIG, ...JSON.parse(saved) };
    } catch (e) {}
  }

  // 1. Config 1 (Fixed location $0370B9): c mmm w bbb
  const c = config.cmdSet === "short" ? 1 : 0;
  const mmm = Math.max(0, Math.min(5, config.msgSpeed - 1));
  const w = config.batMode === "wait" ? 1 : 0;
  const bbb = Math.max(0, Math.min(5, config.batSpeed - 1));

  const config1Byte = (c << 7) | (mmm << 4) | (w << 3) | bbb;
  if (0x0370b9 < patched.length) {
    patched[0x0370b9] = config1Byte;
  }

  // 2. Config 2 (Dynamic location from $0370C3 operand): mbcccsss
  // Following python pack_config_byte specification:
  // Controller2=0, CustomButtons=0, FontWindowPaletteSelect=0 (1 offset 1), SpellOrder=(spellOrder-1)
  if (0x0370c3 + 1 < patched.length) {
    const lowByte2 = patched[0x0370c3];
    const highByte2 = patched[0x0370c3 + 1];
    const config2Address = 0x030000 + (highByte2 * 256 + lowByte2) + 1;

    const sss = Math.max(0, Math.min(5, (config.spellOrder || 1) - 1)); // 3 bits spell order
    const config2Byte = sss; // All other MSB bits remain zero according to the python specification

    if (config2Address < patched.length) {
      patched[config2Address] = config2Byte;
    }
  }

  // 3. Config 3 (Dynamic location from $0370C6 operand): gcsrwwww
  if (0x0370c6 + 1 < patched.length) {
    const lowByte3 = patched[0x0370c6];
    const highByte3 = patched[0x0370c6 + 1];
    const config3Address = 0x030000 + (highByte3 * 256 + lowByte3) + 1;

    const g = config.gauge === "off" ? 1 : 0;
    const cur = config.cursor === "memory" ? 1 : 0;
    const s = config.sound === "mono" ? 1 : 0;
    const r = config.reequip === "empty" ? 1 : 0;
    const wwww = Math.max(0, Math.min(7, (config.wallpaper || 1) - 1)); // 4 bits wallpaper/window type

    const config3Byte = (g << 7) | (cur << 6) | (s << 5) | (r << 4) | wwww;

    if (config3Address < patched.length) {
      patched[config3Address] = config3Byte;
    }
  }

  // 4. Patch global Font Color (2 bytes) to legacy addresses 0x18e806 and 0x03709F
  const fontColor = config.fontColor || [0, 28, 27];
  const val = (fontColor[2] << 10) | (fontColor[1] << 5) | fontColor[0];
  const low = val & 0xFF;
  const high = (val >> 8) & 0xFF;

  if (0x18e806 + 1 < patched.length) {
    patched[0x18e806] = low;
    patched[0x18e806 + 1] = high;
  }
  if (0x03709f + 1 < patched.length) {
    patched[0x03709f] = low;
    patched[0x03709f + 1] = high;
  }

  // 5. Patch discrete Window Palette arrays for all 8 slots (0x2d1c02 offset by 0x20)
  // Following python specification, Window palettes consist of 7 colors (14 bytes) starting at the baseline.
  for (let i = 1; i <= 8; i++) {
    const key = `window${i}`;
    const startAddress = 0x2d1c02 + (i - 1) * 0x20;
    if (startAddress + 13 >= patched.length) continue;

    const winPalette = config.windowPalettes?.[key] || WINDOW_PALETTE_DEFAULTS[key] || WINDOW_PALETTE_DEFAULTS.window1;

    // Write Window Palette (7 colors / 14 bytes)
    for (let cIdx = 0; cIdx < 7; cIdx++) {
      const color = winPalette[cIdx] || [0, 0, 0];
      const wVal = (color[2] << 10) | (color[1] << 5) | color[0];
      patched[startAddress + cIdx * 2] = wVal & 0xFF;
      patched[startAddress + cIdx * 2 + 1] = (wVal >> 8) & 0xFF;
    }
    // Nested font palettes are not patched, adhering strictly to reference script.
  }
}

