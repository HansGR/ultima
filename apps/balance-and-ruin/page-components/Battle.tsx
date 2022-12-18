import { Bosses } from "~/card-components/Bosses";
import { ExperienceMagicPointsGold } from "~/card-components/ExperienceMagicPointsGold";
import { Scaling } from "~/card-components/Scaling";
import { PageColumn } from "~/components/PageColumn/PageColumn";
import { PageContainer } from "~/components/PageContainer/PageContainer";

export const Battle = () => {
  return (
    <PageContainer>
      <PageColumn>
        <ExperienceMagicPointsGold />
        <Bosses />
      </PageColumn>
      <PageColumn>
        <Scaling />
      </PageColumn>
    </PageContainer>
  );
};
