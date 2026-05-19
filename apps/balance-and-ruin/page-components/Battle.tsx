import { Bosses } from "~/card-components/Bosses";
import { Dragons } from "~/card-components/Dragons";
import { Encounters } from "~/card-components/Encounters";
import { ExperienceMagicPointsGold } from "~/card-components/ExperienceMagicPointsGold";
import { Scaling } from "~/card-components/Scaling";
import { PageContainer } from "~/components/PageContainer/PageContainer";

export const Battle = () => {
  return (
    <PageContainer columns={2} className="!items-stretch">
      {/* Row 1: Scaling (Massive, make full-width so it becomes shallow!) */}
      <div className="col-span-full h-full [&>*]:h-full">
        <Scaling />
      </div>

      {/* Row 2: Bosses (Massive, make full-width!) */}
      <div className="col-span-full h-full [&>*]:h-full">
        <Bosses />
      </div>

      {/* Row 3: Encounters (Short) & Experience/GP (Short) - share a row! */}
      <div className="h-full [&>*]:h-full">
        <Encounters />
      </div>

      <div className="h-full [&>*]:h-full">
        <ExperienceMagicPointsGold />
      </div>
    </PageContainer>
  );
};
