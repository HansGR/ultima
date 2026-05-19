import { BetaCard } from "~/card-components/BetaCard";
import { BetaPresets } from "~/card-components/BetaPresetsCard";
import { WorkshopCard } from "~/card-components/WorkshopCard";
import { HiddenFlagsCard } from "~/card-components/HiddenFlagsCard";
import {
  GridItem,
  PageContainer,
} from "~/components/PageContainer/PageContainer";

export const BetaPage = () => {
  return (
    <PageContainer columns={2} className="!items-stretch">
      <GridItem size="full">
        <BetaPresets />
      </GridItem>

      <GridItem className="h-full [&>*]:h-full">
        <BetaCard />
      </GridItem>

      <GridItem className="h-full [&>*]:h-full">
        <WorkshopCard />
      </GridItem>

      <GridItem size="full">
        <HiddenFlagsCard />
      </GridItem>
    </PageContainer>
  );
};
