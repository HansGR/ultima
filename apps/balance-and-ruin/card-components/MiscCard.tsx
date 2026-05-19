import { Card } from "@ff6wc/ui";
import { BetaLabel } from "~/components/BetaLabel/BetaLabel";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import {
  FlagSubflagSelect,
  SubflagOption,
} from "~/components/FlagSubflagSelect/FlagSubflagSelect";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";

const timerOptions: SubflagOption[] = [
  {
    flag: "-etr",
    defaultValue: true,
    label: "Random",
    helperText:
      "Collapsing House, Opera House, and Floating Continent timers are randomized",
    isStatic: true,
  },
  {
    flag: "-etn",
    defaultValue: true,
    label: "None",
    helperText:
      "Collapsing House, Opera House, and Floating Continent timers are removed",
    isStatic: true,
  },
];
const YNPC_HELPER =
  "Pressing the Y button while next to NPCs has various effects";

const yNpcOptions: SubflagOption[] = [
  {
    flag: "-ymascot",
    defaultValue: true,
    label: "Mascot",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-ycreature",
    defaultValue: true,
    label: "Creature",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-yimperial",
    defaultValue: true,
    label: "Imperial",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-ymain",
    defaultValue: true,
    label: "Main Character",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-yreflect",
    defaultValue: true,
    label: "Reflect",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-ystone",
    defaultValue: true,
    label: "Stone",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-yvxz",
    defaultValue: true,
    label: "Vanish/X-Zone",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-ysketch",
    defaultValue: true,
    label: "Sketch",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-yrandom",
    defaultValue: true,
    label: "Random",
    helperText: "",
    isStatic: true,
  },
  {
    flag: "-yremove",
    defaultValue: true,
    label: "Remove",
    helperText: "",
    isStatic: true,
  },
].map((opt) => ({ ...opt, helperText: YNPC_HELPER }));

export const MiscCard = () => {
  return (
    <Card title={"Other"}>
      <div className="flex flex-col gap-6 h-full">
        {/* Row 1: The Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FlagSubflagSelect
            nullable={{ description: YNPC_HELPER, label: "None" }}
            label="Y NPC"
            options={yNpcOptions}
          />

          <FlagSubflagSelect
            label="Event Timers"
            options={timerOptions}
            nullable={{
              description:
                "Collapsing House, Opera House, and Floating Continent timers unmodified",
              label: "Original",
            }}
          />
        </div>

        {/* Divider line */}
        <div className="border-t border-white/10" />

        {/* Row 2: The Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-auto">
          <FlagSwitch flag="-ond" label="Original Name Display" />
          <FlagSwitch flag="-npctips" label="NPC Tips" />
        </div>
      </div>
    </Card>
  );
};
