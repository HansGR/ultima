import { Card } from "@ff6wc/ui";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";
import { BetaLabel } from "~/components/BetaLabel/BetaLabel";
import {
  FlagSubflagSelect,
  SubflagOption,
} from "~/components/FlagSubflagSelect/FlagSubflagSelect";

const STANDARD_IR = {
  defaultValue: "standard",
  flag: "-ir",
  helperText: () => (
    <span className="block mt-1.5 mb-2 leading-relaxed opacity-90">
      Possible Item Rewards: ValiantKnife, Illumina, Ragnarok, Atma Weapon,
      Pearl Lance, Aura Lance, Magus Rod, Fixed Dice, Aegis Shld, Flame Shld,
      Ice Shld, Thunder Shld, Genji Shld, Paladin Shld, Force Shld, Red Cap, Cat
      Hood, Genji Helmet, Force Armor, Genji Armor, Minerva, BehemothSuit, Snow
      Muffler, Economizer, Genji Glove, Offering, Gem Box, Dragon Horn, Marvel
      Shoes, Exp. Egg
    </span>
  ),
  label: "Standard",
  isStatic: true,
};

const irOptions: SubflagOption[] = [
  {
    defaultValue: "none",
    flag: "-ir",
    helperText: () => (
      <span className="block mt-1.5 mb-2 leading-relaxed opacity-90">
        No Item Rewards are possible!
      </span>
    ),
    label: "None",
    isStatic: true,
  },
  STANDARD_IR,
  {
    defaultValue: "stronger",
    flag: "-ir",
    helperText: () => (
      <span className="block mt-1.5 mb-2 leading-relaxed opacity-90">
        Possible High Tier Item Rewards: ValiantKnife, Illumina, Ragnarok, Atma
        Weapon, Aura Lance, Fixed Dice, Flame Shld, Ice Shld, Thunder Shld,
        Paladin Shld, Force Shld, Minerva, BehemothSuit, Snow Muffler, Genji
        Glove, Offering, Dragon Horn, Exp. Egg
      </span>
    ),
    label: "Stronger",
    isStatic: true,
  },
  {
    defaultValue: "premium",
    flag: "-ir",
    helperText: () => (
      <span className="block mt-1.5 mb-2 leading-relaxed opacity-90">
        Possible High Tier Item Rewards: ValiantKnife, Illumina, Ragnarok, Atma
        Weapon, Fixed Dice, Flame Shld, Ice Shld, Thunder Shld, Paladin Shld,
        Minerva, Genji Glove, Offering, Exp. Egg
      </span>
    ),
    label: "Premium",
    isStatic: true,
  },
];

export const Checks = () => {
  return (
    <Card title={"Checks"}>
      <div className="flex flex-col gap-6 w-full h-full">
        <div className="flex flex-col gap-2">
          <FlagSwitch
            flag="-nfce"
            label="No Free Characters/Espers"
            helperText={
              <span className="block mt-1 leading-relaxed opacity-90">
                Remove character/esper rewards from: Auction House, Collapsing
                House, Figaro Castle Throne, Gau's Father's House, Kohlingen
                Inn, Narshe Weapon Shop, Sealed Gate, South Figaro Basement, Mt.
                Zozo, and Lone Wolf
              </span>
            }
          />
        </div>

        <div className="border-t border-white/10 pt-4 flex-1">
          <FlagSubflagSelect
            defaultSelected={STANDARD_IR}
            label={<>Item Rewards</>}
            options={irOptions}
          />
        </div>
      </div>
    </Card>
  );
};
