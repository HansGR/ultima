export type InGameConfig = {
  // Page 1
  batMode: "active" | "wait";
  batSpeed: number;
  msgSpeed: number;
  cmdSet: "window" | "short";
  gauge: "on" | "off";
  sound: "stereo" | "mono";
  cursor: "reset" | "memory";
  reequip: "optimum" | "empty";

  // Page 2
  spellOrder: number;
  wallpaper: number;
  
  // Discrete multi-element window palettes for each of the 8 styles!
  windowPalettes: Record<string, [number, number, number][]>;
  
  // Global font color (single R,G,B triple mapped by the python CLI script)
  fontColor: [number, number, number];
};

export const WINDOW_PALETTE_DEFAULTS: Record<string, [number, number, number][]> = {
  window1: [[25, 28, 28], [20, 22, 22], [16, 16, 16], [10, 10, 10], [5, 6, 6], [6, 6, 17], [5, 5, 16]],
  window2: [[14, 15, 15], [8, 9, 9], [7, 8, 8], [6, 7, 7], [5, 6, 6], [4, 5, 5], [1, 2, 2]],
  window3: [[7, 13, 16], [6, 10, 13], [4, 7, 10], [3, 6, 7], [2, 4, 5], [2, 3, 4], [10, 15, 19]],
  window4: [[17, 12, 4], [15, 11, 4], [14, 9, 3], [12, 8, 2], [19, 21, 20], [7, 9, 8], [4, 6, 5]],
  window5: [[13, 11, 8], [12, 11, 8], [12, 10, 7], [11, 9, 6], [10, 8, 4], [7, 7, 4], [2, 2, 2]],
  window6: [[19, 19, 19], [13, 15, 15], [10, 12, 11], [8, 10, 9], [6, 8, 7], [4, 6, 5], [1, 3, 2]],
  window7: [[15, 21, 14], [12, 17, 11], [9, 15, 8], [7, 13, 6], [5, 10, 4], [4, 7, 4], [2, 5, 3]],
  window8: [[20, 12, 13], [25, 24, 22], [20, 19, 16], [26, 17, 0], [25, 13, 0], [20, 11, 0], [4, 4, 4]],
};

export const DEFAULT_FONT_COLOR: [number, number, number] = [0, 28, 27];

export const DEFAULT_IN_GAME_CONFIG: InGameConfig = {
  batMode: "wait",
  batSpeed: 3,
  msgSpeed: 3,
  cmdSet: "window",
  gauge: "on",
  sound: "stereo",
  cursor: "reset",
  reequip: "optimum",

  spellOrder: 1,
  wallpaper: 1,
  windowPalettes: { ...WINDOW_PALETTE_DEFAULTS },
  fontColor: [...DEFAULT_FONT_COLOR],
};
