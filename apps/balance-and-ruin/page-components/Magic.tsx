import { Espers } from "~/card-components/Espers";
import { NaturalMagic } from "~/card-components/NaturalMagic";
import { Spells } from "~/card-components/Spells";
import {
  GridItem,
  PageContainer,
} from "~/components/PageContainer/PageContainer";

export const Magic = () => {
  return (
    <PageContainer columns={2} className="!items-stretch">
      <GridItem className="h-full [&>*]:h-full">
        <Spells />
      </GridItem>
      <GridItem className="h-full [&>*]:h-full">
        <NaturalMagic />
      </GridItem>
      <GridItem size="full" className="h-full [&>*]:h-full">
        <Espers />
      </GridItem>
    </PageContainer>
  );
};
