import { Card } from "@ff6wc/ui";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import {
  FlagSubflagSelect,
  SubflagOption,
} from "~/components/FlagSubflagSelect/FlagSubflagSelect";

const OPEN_WORLD = {
  flag: "-open",
  helperText: "Unrestricted event access",
  label: "Open World",
  defaultValue: true,
  isStatic: true,
};

const modeOptions: SubflagOption[] = [
  {
    flag: "-cg",
    helperText: "Events locked until required characters recruited",
    label: "Character Gated",
    defaultValue: true,
    isStatic: true,
  },
  OPEN_WORLD,
];

export const GameModeCard = () => {
  return (
    <Card title={"Game Mode"}>
      <CardColumn>
        <FlagSubflagSelect
          label="Game Mode"
          options={modeOptions}
          defaultSelected={OPEN_WORLD}
        />
      </CardColumn>
    </Card>
  );
};
