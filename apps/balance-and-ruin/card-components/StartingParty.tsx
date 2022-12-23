import {
  characterNames,
  CHARACTER_POSES,
  FF6Character,
} from "@ff6wc/ff6-types";
import { Card } from "@ff6wc/ui";
import random from "lodash/random";
import startCase from "lodash/startCase";
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  components,
  ControlProps,
  OptionProps,
  SingleValue,
} from "react-select";
import { FlagSlider } from "~/components/FlagSlider/FlagSlider";
import { Select, SelectOption as BaseOption } from "~/components/Select/Select";
import SpriteDrawLoad from "~/components/SpriteDrawLoad/SpriteDrawLoad";
import {
  defaultPaletteString,
  defaultSpritePaletteString,
  defaultSpriteString,
} from "~/constants/graphicConstants";
import { Divider } from "~/design-components/Divider/Divider";
import { setFlag, useFlagValueSelector } from "~/state/flagSlice";

type SelectOption = BaseOption & {
  poseId?: number;
};

const RANDOM = "random";
const RANDOM_NGU = "randomngu";
const NONE = "none";

const [randomOption, randomnguOption, noneOption]: SelectOption[] = [
  { value: RANDOM, label: "Random" },
  { value: RANDOM_NGU, label: "Random (No Gogo/Umaro)" },
  { value: NONE, label: "None" },
];

const randomValues = [RANDOM, RANDOM_NGU];

const useOptions = () => {
  return useMemo(() => {
    const options = [
      randomOption,
      randomnguOption,
      noneOption,
      ...characterNames.map(
        (id) =>
          ({
            value: id,
            poseId: 1,
            label: startCase(id),
          } as SelectOption)
      ),
    ];
    const optionsById = options.reduce((acc, val) => {
      return { ...acc, [val.value]: val };
    }, {} as Record<string, SelectOption>);

    return { options, optionsById };
  }, []);
};

const usePartyOption = (flag: string) => {
  const { optionsById } = useOptions();
  const value = useFlagValueSelector<string>(flag) ?? "-unknown";
  const option = optionsById[value];
  return option;
};

const useSpriteId = (characterId: number) => {
  const rawSprites =
    useFlagValueSelector<string>("-cspr") ?? defaultSpriteString;

  if (characterId === -1) {
    return -1;
  }
  return (
    rawSprites.split(".").map((val) => Number.parseInt(val))[characterId] ?? -1
  );
};

const useSpritePaletteId = (characterId: number) => {
  const rawPalettes =
    useFlagValueSelector<string>("-cpal") ?? defaultPaletteString;

  const rawSpritePalettes =
    useFlagValueSelector<string>("-cspp") ?? defaultSpritePaletteString;

  const spritePalette = rawSpritePalettes
    .split(".")
    .map((val) => Number.parseInt(val))[characterId];
  const paletteId = rawPalettes.split(".").map((val) => Number.parseInt(val))[
    spritePalette
  ];
  return paletteId;
};

const SelectPartyControl = ({
  children,
  selectProps,
  ...props
}: ControlProps<SelectOption, false>) => {
  const value: SingleValue<SelectOption> =
    selectProps.value as unknown as SingleValue<SelectOption>;
  const characterValue = value?.value ?? "";

  const isRandom = randomValues.includes(characterValue);
  const isNgu = characterValue === RANDOM_NGU;

  const characterIdx = characterNames.indexOf(value?.value as FF6Character);
  const poseId = value?.poseId ?? 1;
  const rawSpriteId = useSpriteId(characterIdx);
  const spriteId = useMemo(
    () => (isNgu ? random(0, 11) : isRandom ? random(0, 13) : rawSpriteId),
    [isNgu, isRandom, rawSpriteId]
  );

  const showSprite = spriteId !== -1;
  const colorSprite = characterIdx !== -1;
  const paletteId = useSpritePaletteId(colorSprite ? characterIdx : 0);

  return (
    <components.Control
      {...props}
      selectProps={selectProps}
      className={"WC-SelectPartyControl pl-4"}
    >
      {showSprite ? (
        <span>
          <SpriteDrawLoad
            className={colorSprite ? undefined : "brightness-0"}
            spriteId={spriteId}
            paletteId={paletteId}
            poseId={poseId}
            scale={3}
          />
        </span>
      ) : null}
      {children}
    </components.Control>
  );
};

const partyComponents = {
  Control: SelectPartyControl,
  // Option: SelectPartyOption,
};

const partySelectProps = {
  className: "ff6wc-party-select",
  components: partyComponents,
  defaultValue: noneOption,
};

export const StartingParty = () => {
  const dispatch = useDispatch();

  const { options } = useOptions();
  const sc1Option = usePartyOption("-sc1");
  const sc2Option = usePartyOption("-sc2");
  const sc3Option = usePartyOption("-sc3");
  const sc4Option = usePartyOption("-sc4");

  const onChange = (flag: string) => (selected: SelectOption | null) => {
    if (selected?.value === NONE) {
      dispatch(
        setFlag({
          flag,
          value: null,
        })
      );
      return;
    }
    dispatch(
      setFlag({
        flag,
        value: selected?.value!,
      })
    );
  };

  return (
    <Card title={"Starting Party"}>
      <div className="grid grid-cols-2 gap-4 ">
        <Select
          {...partySelectProps}
          onChange={onChange("-sc1")}
          options={options}
          value={sc1Option}
        />

        <Select
          {...partySelectProps}
          onChange={onChange("-sc2")}
          options={options}
          value={sc2Option}
        />

        <Select
          {...partySelectProps}
          onChange={onChange("-sc3")}
          options={options}
          value={sc3Option}
        />

        <Select
          {...partySelectProps}
          onChange={onChange("-sc4")}
          options={options}
          value={sc4Option}
        />
      </div>
      <Divider />

      <FlagSlider
        flag="-stl"
        helperText="Starting party begins the game at level {{ . }}"
        label="Starting Party Level"
      />
    </Card>
  );
};
