import { characterNames } from "@ff6wc/ff6-types";
import { Card } from "@ff6wc/ui";
import startCase from "lodash/startCase";
import { useSelector } from "react-redux";
import { Deprecated } from "~/components/Deprecated/Deprecated";
import { FlagRange } from "~/components/FlagRange/FlagRange";
import { FlagSelectOption } from "~/components/FlagSelect/FlagSelect";
import { FlagSingleOrRange } from "~/components/FlagSingleOrRange/FlagSingleOrRange";
import { FlagSlider } from "~/components/FlagSlider/FlagSlider";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";
import { selectSchema } from "~/state/schemaSlice";
import { AppState } from "~/state/store";

const [random, randomngu]: FlagSelectOption[] = [
  { value: "random", label: "Random" },
  { value: "randomngu", label: "Random (No Gogo/Umaro)" },
];

const options = [
  random,
  randomngu,
  ...characterNames.map(
    (id) =>
      ({
        value: id,
        label: startCase(id),
      }) as FlagSelectOption,
  ),
];

export const PartyMembers = () => {
  // -stlr needs WorldsCollide #172; offer the range only when the backend's
  // flag schema has it, otherwise a range would fail generation
  const supportsRandomStartLevel = useSelector(
    (state: AppState) => "-stlr" in selectSchema(state),
  );

  return (
    <Card title={"Party Members"}>
      <div className="flex flex-col flex-wrap gap-2">
        {supportsRandomStartLevel ? (
          <FlagSingleOrRange
            singleFlag="-stl"
            rangeFlag="-stlr"
            label="Starting Party Level"
            singleHelperText={(level) =>
              `Starting party begins the game at level ${level}`
            }
            rangeHelperText={(low, high) =>
              `Each character starts at a random level from ${low} to ${high}`
            }
          />
        ) : (
          <FlagSlider
            flag="-stl"
            helperText="Starting party begins the game at level {{ . }}"
            label="Starting Party Level"
          />
        )}
        <FlagSwitch flag={"-sal"} label={"Start Average Level"} />
        <FlagSwitch flag={"-sn"} label={"Start Naked"} />
        <Deprecated>
          <FlagSwitch flag={"-eu"} label={"Equipable Umaro"} />
        </Deprecated>
        <FlagRange
          flag={"-csrp"}
          helperText="Each character stat is set to {{.}}% of the original value"
          label={"Character Stats"}
        />
      </div>
    </Card>
  );
};
