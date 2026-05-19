const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/drlov/.gemini/antigravity/scratch/ultima/apps/balance-and-ruin';

const PAGE_MAPPINGS = {
  presets: ['Presets.tsx', 'PresetsCard.tsx', 'BetaPresetsCard.tsx'],
  objectives: ['Objectives.tsx', 'ObjectiveCard.tsx'],
  party: ['Party.tsx', 'PartyMembers.tsx', 'StartingParty.tsx'],
  commands: ['Commands.tsx', 'Blitzes.tsx', 'CommandsExcluded.tsx', 'CommandsList.tsx', 'Dances.tsx', 'Lores.tsx', 'OtherCommands.tsx', 'Rages.tsx', 'SketchControl.tsx', 'StealCapture.tsx', 'SwdTechs.tsx', 'Tools.tsx'],
  battle: ['Battle.tsx', 'Bosses.tsx', 'Dragons.tsx', 'Encounters.tsx', 'ExperienceMagicPointsGold.tsx', 'Scaling.tsx', 'BossAI.tsx'],
  magic: ['Magic.tsx', 'Espers.tsx', 'NaturalMagic.tsx', 'Spells.tsx'],
  items: ['Items.tsx', 'Chests.tsx', 'Coliseum.tsx', 'EquipmentPermissions.tsx', 'ItemRestrictions.tsx', 'OtherItems.tsx', 'Shops.tsx', 'StartingGoldAndItems.tsx'],
  misc: ['Gameplay.tsx', 'AuctionHouse.tsx', 'Challenges.tsx', 'Checks.tsx', 'GameModeCard.tsx', 'MiscCard.tsx', 'Movement.tsx'],
  Graphics: ['Graphics.tsx', 'CharacterSprites.tsx', 'SpritePalettes.tsx', 'OtherSprites.tsx'],
  settings: ['Settings.tsx', 'AccessibilityCard.tsx', 'BugFixes.tsx', 'Fixes.tsx'],
  beta: ['BetaPage.tsx', 'BetaCard.tsx', 'WorkshopCard.tsx']
};

const cardDir = path.join(rootDir, 'card-components');
const pageDir = path.join(rootDir, 'page-components');

const index = {};

for (const [tab, files] of Object.entries(PAGE_MAPPINGS)) {
  const uniqueWords = new Set();
  
  files.forEach(file => {
    let content = '';
    
    // Try to read from page-components or card-components
    const cardPath = path.join(cardDir, file);
    const pagePath = path.join(pageDir, file);
    
    if (fs.existsSync(cardPath)) {
      content = fs.readFileSync(cardPath, 'utf-8');
    } else if (fs.existsSync(pagePath)) {
      content = fs.readFileSync(pagePath, 'utf-8');
    }
    
    if (!content) return;
    
    // Extract all labels: label="..." or label={"..."}
    const labelMatches = content.matchAll(/label=(?:"([^"]+)"|\{['"]([^'"]+)['"]\})/gi);
    for (const match of labelMatches) {
      const val = match[1] || match[2];
      if (val && val.length > 2) uniqueWords.add(val.trim());
    }
    
    // Extract object keys: label: "..."
    const objLabelMatches = content.matchAll(/label:\s*(?:"([^"]+)"|'([^']+)')/gi);
    for (const match of objLabelMatches) {
      const val = match[1] || match[2];
      if (val && val.length > 2) uniqueWords.add(val.trim());
    }
    
    // Extract Card titles: title="..." or title={"..."}
    const titleMatches = content.matchAll(/title=(?:"([^"]+)"|\{['"]([^'"]+)['"]\})/gi);
    for (const match of titleMatches) {
      const val = match[1] || match[2];
      if (val && val.length > 2) uniqueWords.add(val.trim());
    }
  });
  
  index[tab] = Array.from(uniqueWords).filter(w => !w.includes('(') && !w.includes('$') && w.length < 30);
}

console.log(JSON.stringify(index, null, 2));
