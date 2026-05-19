import {
  CharacterSprites,
  type CharacterSpritesProps,
} from "~/card-components/CharacterSprites";
import {
  GridItem,
  PageContainer,
} from "~/components/PageContainer/PageContainer";
import useSWR from "swr";
import { SpritePalettes } from "~/card-components/SpritePalettes";
import { OtherSprites } from "~/card-components/OtherSprites";

export const Graphics = () => {
  const { data } = useSWR<CharacterSpritesProps>(["/api/sprites"], async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/sprites`,
    );
    const result = await response.json();
    return result as CharacterSpritesProps;
  });

  const { palettes = [], portraits = [], sprites = [] } = data || {};

  return (
    <PageContainer columns={2} className="!items-stretch">
      <GridItem size="full" className="h-full [&>*]:h-full">
        <CharacterSprites
          palettes={palettes}
          portraits={portraits}
          sprites={sprites}
        />
      </GridItem>

      <GridItem className="h-full [&>*]:h-full">
        <SpritePalettes palettes={palettes} />
      </GridItem>
      <GridItem className="h-full [&>*]:h-full">
        <OtherSprites
          palettes={palettes}
          portraits={portraits}
          sprites={sprites}
        />
      </GridItem>
    </PageContainer>
  );
};
