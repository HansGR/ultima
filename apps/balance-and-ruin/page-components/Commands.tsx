import { Blitzes } from "~/card-components/Blitzes";
import { CommandsExcluded } from "~/card-components/CommandsExcluded";
import { CommandsList } from "~/card-components/CommandsList";
import { Dances } from "~/card-components/Dances";
import { Lores } from "~/card-components/Lores";
import { OtherCommands } from "~/card-components/OtherCommands";
import { Rages } from "~/card-components/Rages";
import { SketchControl } from "~/card-components/SketchControl";
import { StealCapture } from "~/card-components/StealCapture";
import { SwdTechs } from "~/card-components/SwdTechs";
import { PageContainer } from "~/components/PageContainer/PageContainer";

export const Commands = () => {
  return (
    <PageContainer columns={3} className="!items-stretch">
      {/* Row 1: Main Commands List (Massive - Full Width!) */}
      <div className="col-span-full h-full [&>*]:h-full">
        <CommandsList />
      </div>

      {/* Row 2: Excluded Commands (Dense - Full Width!) */}
      <div className="col-span-full h-full [&>*]:h-full">
        <CommandsExcluded />
      </div>

      {/* Row 3: Dense Items Tiers */}
      <div className="h-full [&>*]:h-full">
        <StealCapture />
      </div>

      <div className="h-full [&>*]:h-full">
        <Lores />
      </div>

      <div className="h-full [&>*]:h-full">
        <Dances />
      </div>

      {/* Row 4: Short Items Tiers */}
      <div className="h-full [&>*]:h-full">
        <Rages />
      </div>

      <div className="h-full [&>*]:h-full">
        <Blitzes />
      </div>

      <div className="h-full [&>*]:h-full">
        <SwdTechs />
      </div>

      {/* Row 5: Final Short Items */}
      <div className="h-full [&>*]:h-full">
        <SketchControl />
      </div>

      <div className="h-full [&>*]:h-full">
        <OtherCommands />
      </div>
    </PageContainer>
  );
};
