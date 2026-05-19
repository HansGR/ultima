import { Card } from "@ff6wc/ui";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import { FlagNumberInput } from "~/components/FlagNumberInput/FlagNumberInput";
import { FlagSlider } from "~/components/FlagSlider/FlagSlider";
import { FlagTextInput } from "~/components/FlagInput/FlagInput";

export const StartingGoldAndItems = () => {
  return (
    <Card title={"Starting Gold/Items"}>
      <CardColumn>
        <FlagNumberInput
          description="Begin the game with {{ . }} gold"
          flag="-gp"
          label="Starting Gold"
          type="int"
        />
        <div className="hidden md:block" />

        <FlagSlider
          flag="-sshoes"
          helperText="Begin the game with {{ . }} Sprint Shoes"
          label="Starting Sprint Shoes"
        />
        <FlagSlider
          flag="-smc"
          helperText="Begin the game with {{ . }} Moogle Charms"
          label="Starting Moogle Charms"
        />

        <FlagSlider
          helperText="Begin the game with {{ . }} Fenix Downs"
          flag="-sfd"
          label="Starting Fenix Downs"
        />
        <FlagSlider
          helperText="Begin the game with {{ . }} Warp Stones"
          flag="-sws"
          label="Starting Warp Stones"
        />

        <FlagSlider
          flag="-sj"
          label="Starting Junk"
          helperText="Begin the game with {{.}} unique low tier items (weapons, armors, helmets, shields, and relics)"
        />
        <FlagSlider
          helperText="Begin the game with {{ . }} different random tools"
          flag="-sto"
          label="Starting Tools"
        />
      </CardColumn>
    </Card>
  );
};
