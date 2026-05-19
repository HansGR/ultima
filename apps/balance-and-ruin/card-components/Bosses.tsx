import { Button, Card } from "@ff6wc/ui";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import { FlagSubflagSelect } from "~/components/FlagSubflagSelect/FlagSubflagSelect";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";
import { FlagRange } from "~/components/FlagRange/FlagRange";
import { useDispatch } from "react-redux";
import { setFlag } from "~/state/flagSlice";

const battleOptions = [
  {
    defaultValue: true,
    flag: "-bbs",
    helperText: "Boss battles are shuffled (No repeats)",
    label: "Shuffled",
    isStatic: true,
  },
  {
    defaultValue: true,
    flag: "-bbr",
    helperText: "Boss battles are randomized (Possible repeats)",
    label: "Random",
    isStatic: true,
  },
];

const SHUFFLE_DRAGONS = {
  defaultValue: "shuffle",
  flag: "-drloc",
  helperText: "Dragons battles are shuffled amongst themselves",
  label: "Shuffled",
  isStatic: true,
};
const dragonOptions = [
  {
    defaultValue: "original",
    flag: "-drloc",
    helperText: "Dragons battles are unchanged",
    label: "Original",
    isStatic: true,
  },
  SHUFFLE_DRAGONS,
  {
    defaultValue: "mix",
    flag: "-drloc",
    helperText:
      "Dragons are added to the general boss pool. If boss battles are original, they will shuffle amongst themselves",
    label: "Mixed",
    isStatic: true,
  },
];

const MIX_STATUES = {
  defaultValue: "mix",
  flag: "-stloc",
  helperText:
    "Doom, Goddess, and Poltrgeist are mixed into the general boss pool. If boss battles are original, they will shuffle amongst themselves",
  label: "Mixed",
  isStatic: true,
};
const statueOptions = [
  {
    defaultValue: "original",
    flag: "-stloc",
    helperText:
      "Doom, Goddess, and Poltrgeist are fought in their original locations",
    label: "Original",
    isStatic: true,
  },
  {
    defaultValue: "shuffle",
    flag: "-stloc",
    helperText: "Doom, Goddess, and Poltrgeist are shuffled amongst themselves",
    label: "Shuffled",
    isStatic: true,
  },
  MIX_STATUES,
];

export const Bosses = () => {
  const dispatch = useDispatch();

  const restoreOriginal = () => {
    // null both Boss battle options to return to Original
    dispatch(
      setFlag({
        flag: "-bbs",
        value: null,
      }),
    );
    dispatch(
      setFlag({
        flag: "-bbr",
        value: null,
      }),
    );
    // Dragon location back to original
    dispatch(
      setFlag({
        flag: "-drloc",
        value: "original",
      }),
    );
    // Statue location back to original
    dispatch(
      setFlag({
        flag: "-stloc",
        value: "original",
      }),
    );
    // Marshal Keep Lobos back to true
    dispatch(
      setFlag({
        flag: "-bmkl",
        value: true,
      }),
    );
  };
  return (
    <Card title={"Bosses"}>
      <div className="flex flex-col gap-6 h-full">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button onClick={restoreOriginal} variant="primary">
            All Original
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FlagSubflagSelect
            className="h-full justify-between"
            nullable={{
              description: "Boss battles are unchanged",
              label: "Original",
            }}
            label="Boss Battles"
            options={battleOptions}
          />
          <FlagSubflagSelect
            className="h-full justify-between"
            defaultSelected={MIX_STATUES}
            label="Statue Battles"
            options={statueOptions}
          />
          <FlagSubflagSelect
            className="h-full justify-between"
            defaultSelected={SHUFFLE_DRAGONS}
            label="Dragon Battles"
            options={dragonOptions}
          />
        </div>

        {/* 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-auto pt-4">
          (LEGACY) Flag -bmbd hidden per user request
          <FlagSwitch
            flag="-bmbd"
            label="Shuffle Bosses & Dragons Together"
            helperText="Shuffle/randomize bosses and dragons together"
          />
          <FlagRange
            flag="-rt"
            label="Rizopas Timer"
            helperText="Custom range for seconds before Rizopas will appear"
            min={5}
            max={60}
          />
        </div>
        */}
      </div>
    </Card>
  );
};
