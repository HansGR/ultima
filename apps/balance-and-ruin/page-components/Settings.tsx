import { PageContainer } from "~/components/PageContainer/PageContainer";
import { BossAI } from "~/card-components/BossAI";
import { BugFixes } from "~/card-components/BugFixes";
import { AccessibilityCard } from "~/card-components/AccessibilityCard";
import { InGameConfigCard } from "~/card-components/InGameConfigCard";
import { Deprecated } from "~/components/Deprecated/Deprecated";
import { FlagPreset } from "~/types/preset";

type SettingsProps = {
  presets: Record<string, FlagPreset>;
};

export const Settings = ({ presets: rawPresets }: SettingsProps) => {
  return (
    <PageContainer columns={1}>
      <Deprecated>
        <BugFixes />
        <BossAI />
      </Deprecated>
      <AccessibilityCard />
      <InGameConfigCard />
    </PageContainer>
  );
};
