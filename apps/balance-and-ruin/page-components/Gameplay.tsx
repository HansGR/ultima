import { AuctionHouse } from "~/card-components/AuctionHouse";
import { Challenges } from "~/card-components/Challenges";
import { Checks } from "~/card-components/Checks";
import { Coliseum } from "~/card-components/Coliseum";
import { GameModeCard } from "~/card-components/GameModeCard";
import { MiscCard } from "~/card-components/MiscCard";
import { Movement } from "~/card-components/Movement";
import { PageContainer } from "~/components/PageContainer/PageContainer";

export const Gameplay = () => {
  return (
    <PageContainer columns={3} className="!items-stretch">
      {/* Row 1: Game Mode, Movement, Challenges */}
      <div className="h-full [&>*]:h-full">
        <GameModeCard />
      </div>

      <div className="h-full [&>*]:h-full">
        <Movement />
      </div>

      <div className="h-full [&>*]:h-full">
        <Challenges />
      </div>

      {/* Row 2: Full width Coliseum */}
      <div className="col-span-full h-full [&>*]:h-full">
        <Coliseum />
      </div>

      {/* Row 3: Checks (Double width for optimal space) & Auction House (Single width) */}
      <div className="h-full [&>*]:h-full col-span-1 md:col-span-2">
        <Checks />
      </div>

      <div className="h-full [&>*]:h-full col-span-1">
        <AuctionHouse />
      </div>

      {/* Row 4: Other / MiscCard (Massive - Full Width!) */}
      <div className="col-span-full h-full [&>*]:h-full">
        <MiscCard />
      </div>
    </PageContainer>
  );
};
