import {
  characterNames,
  CHARACTER_POSES,
  FF6Character,
} from "@ff6wc/ff6-types";
import { Card, HelperText } from "@ff6wc/ui";
import random from "lodash/random";
import startCase from "lodash/startCase";
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  Select,
  SelectOption as BaseOption,
  AutoPanText,
} from "~/components/Select/Select";
import SpriteDrawLoad from "~/components/SpriteDrawLoad/SpriteDrawLoad";
import {
  defaultCharacterNameString,
  defaultPaletteString,
  defaultSpritePaletteString,
  defaultSpriteString,
} from "~/constants/graphicConstants";
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

const useCharacterNames = () => {
  const rawNames = (
    useFlagValueSelector<string>("-name") ?? defaultCharacterNameString
  ).split(".");
  const actualNames = defaultCharacterNameString.split(".");

  return characterNames.map((name, characterId) => {
    const regularName = startCase(actualNames[characterId].toLowerCase());
    if (actualNames[characterId] === rawNames[characterId]) {
      return regularName;
    }
    return `${rawNames[characterId]} (${regularName})`;
  });
};

const useOptions = () => {
  const customCharacterNames = useCharacterNames();

  return useMemo(() => {
    const options = [
      randomOption,
      randomnguOption,
      noneOption,
      ...characterNames.map(
        (characterName, idx) =>
          ({
            value: characterName,
            poseId: 1,
            label: customCharacterNames[idx],
          }) as SelectOption,
      ),
    ];
    const optionsById = options.reduce(
      (acc, val) => {
        return { ...acc, [val.value]: val };
      },
      {} as Record<string, SelectOption>,
    );

    return { options, optionsById };
  }, [customCharacterNames]);
};

const SC_FLAGS = ["-sc1", "-sc2", "-sc3", "-sc4"];

/**
 * The required characters flag (-rc) holds a space-separated list of
 * characters (or random/randomngu) that must remain in the party at all
 * times. WC adds each required character to the starting party, so a slot
 * marked "required" stores its value in -rc INSTEAD of -scN — listing a
 * random token in both flags would create two separate starting characters.
 */
const useRequiredCharacters = (): string[] => {
  const raw = useFlagValueSelector<string[] | string | boolean>("-rc");
  return useMemo(() => {
    if (Array.isArray(raw)) {
      return raw;
    }
    if (typeof raw === "string") {
      return raw.split(" ").filter(Boolean);
    }
    // `true` is the deprecated bool -rc (random clock) — ignore it
    return [];
  }, [raw]);
};

type PartySlot = {
  /** the -scN flag this slot writes to when not required */
  scFlag: string;
  /** character/random token displayed in this slot, or NONE */
  value: string;
  /** whether this slot's character is stored in -rc */
  required: boolean;
  /** index of this slot's entry within the -rc list (-1 when not required) */
  rcIndex: number;
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

/**
 * SpriteCell — a proper React component so hooks can safely be called inside.
 * Renders the character sprite at the given scale, or nothing for "None".
 */
const SpriteCell = ({
  option,
  scale = 2,
}: {
  option: SelectOption;
  scale?: number;
}) => {
  const characterValue = option?.value ?? "";
  const isRandom = randomValues.includes(characterValue);
  const isNgu = characterValue === RANDOM_NGU;

  const characterIdx = characterNames.indexOf(characterValue as FF6Character);
  const poseId = option?.poseId ?? 1;
  const rawSpriteId = useSpriteId(characterIdx);
  const spriteId = useMemo(
    () => (isNgu ? random(0, 11) : isRandom ? random(0, 13) : rawSpriteId),
    [isNgu, isRandom, rawSpriteId],
  );

  const showSprite = spriteId !== -1;
  const colorSprite = characterIdx !== -1;
  const paletteId = useSpritePaletteId(colorSprite ? characterIdx : 0);

  if (!showSprite) {
    const isScale3 = scale === 3;
    return (
      <div
        style={{
          width: isScale3 ? 48 : 32,
          height: isScale3 ? 72 : 48,
        }}
        className="flex-shrink-0 inline-block"
      />
    );
  }

  return (
    <span className="relative flex-shrink-0 inline-flex items-center">
      <SpriteDrawLoad
        className={colorSprite ? undefined : "brightness-0"}
        spriteId={spriteId}
        paletteId={paletteId}
        poseId={poseId}
        scale={scale}
      />
      {!colorSprite ? (
        <span className="absolute flex top-0 bottom-0 left-0 right-0 items-center justify-center text-xl">
          ?
        </span>
      ) : null}
    </span>
  );
};

/**
 * SpriteSelect — wraps the Headless UI Select with character sprite rendering
 * in both the trigger button (renderValue) and each dropdown row (renderOption).
 */
const SpriteSelect = ({
  flag,
  options,
  value,
  onChange,
}: {
  flag: string;
  options: SelectOption[];
  value: SelectOption | undefined;
  onChange: (selected: SelectOption | null) => void;
}) => {
  const renderValue = (opt: SelectOption) => (
    <span className="flex items-center gap-2 min-w-0 flex-1">
      <SpriteCell option={opt} scale={3} />
      <AutoPanText text={opt.label} className="flex-1" />
    </span>
  );

  const renderOption = (opt: SelectOption) => (
    <span className="flex items-center gap-2 min-w-0 flex-1">
      <SpriteCell option={opt} scale={2} />
      <AutoPanText text={opt.label} className="flex-1" />
    </span>
  );

  return (
    <Select
      defaultValue={noneOption}
      onChange={onChange}
      options={options}
      value={value ?? noneOption}
      renderValue={renderValue}
      renderOption={renderOption}
    />
  );
};

export const StartingParty = () => {
  const dispatch = useDispatch();

  const { options, optionsById } = useOptions();

  const sc1 = useFlagValueSelector<string>("-sc1");
  const sc2 = useFlagValueSelector<string>("-sc2");
  const sc3 = useFlagValueSelector<string>("-sc3");
  const sc4 = useFlagValueSelector<string>("-sc4");
  const scValues = [sc1, sc2, sc3, sc4];

  const requiredCharacters = useRequiredCharacters();

  // Assign each slot its value: slots with an -scN value show it unchecked;
  // the remaining slots display the -rc entries, in order, checked.
  let rcCursor = 0;
  const slots: PartySlot[] = SC_FLAGS.map((scFlag, idx) => {
    const scValue = scValues[idx];
    if (scValue) {
      return { scFlag, value: scValue, required: false, rcIndex: -1 };
    }
    if (rcCursor < requiredCharacters.length) {
      const rcIndex = rcCursor++;
      return {
        scFlag,
        value: requiredCharacters[rcIndex],
        required: true,
        rcIndex,
      };
    }
    return { scFlag, value: NONE, required: false, rcIndex: -1 };
  });

  // -rc entries that don't fit in the four slots (only possible via a pasted
  // flag string that over-fills the party) — WC rejects these at generation.
  const overflowCount = requiredCharacters.length - rcCursor;

  const setRequiredCharacters = (next: string[]) => {
    dispatch(setFlag({ flag: "-rc", value: next.length ? next : null }));
  };

  const filterOptions = (slotIndex: number) => {
    const exclude = slots
      .filter((_, idx) => idx !== slotIndex)
      .map((slot) => slot.value)
      .concat(requiredCharacters.slice(rcCursor))
      .filter((val) => characterNames.includes(val as FF6Character));
    return options.filter(({ value }) => !exclude.includes(value));
  };

  const onSelectChange =
    (slot: PartySlot) => (selected: SelectOption | null) => {
      const value = selected?.value;
      if (slot.required) {
        const next = [...requiredCharacters];
        if (!value || value === NONE) {
          next.splice(slot.rcIndex, 1);
        } else {
          next[slot.rcIndex] = value;
        }
        setRequiredCharacters(next);
        return;
      }
      dispatch(
        setFlag({
          flag: slot.scFlag,
          value: !value || value === NONE ? null : value,
        }),
      );
    };

  const onRequiredToggle = (slot: PartySlot, slotIndex: number) => () => {
    if (slot.required) {
      // move the character back from -rc into this slot's -scN flag
      const next = [...requiredCharacters];
      next.splice(slot.rcIndex, 1);
      setRequiredCharacters(next);
      dispatch(setFlag({ flag: slot.scFlag, value: slot.value }));
      return;
    }
    if (slot.value === NONE) {
      return;
    }
    // move the character from -scN into -rc, inserting at the position that
    // keeps it rendered in this same slot
    const insertAt = slots
      .slice(0, slotIndex)
      .filter(({ required }) => required).length;
    const next = [...requiredCharacters];
    next.splice(insertAt, 0, slot.value);
    dispatch(setFlag({ flag: slot.scFlag, value: null }));
    setRequiredCharacters(next);
  };

  return (
    <Card title={"Starting Party"}>
      <HelperText>
        Check &ldquo;Required?&rdquo; to force that character to remain in your
        party at all times (<code>-rc</code>)
      </HelperText>
      <div className="grid grid-cols-2 gap-4">
        {slots.map((slot, slotIndex) => {
          const disabled = !slot.required && slot.value === NONE;
          return (
            <div key={slot.scFlag} className="flex flex-col gap-2">
              <SpriteSelect
                flag={slot.scFlag}
                onChange={onSelectChange(slot)}
                options={filterOptions(slotIndex)}
                value={optionsById[slot.value]}
              />
              <label
                className={`flex items-center gap-2 ${
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={slot.required}
                  disabled={disabled}
                  onChange={onRequiredToggle(slot, slotIndex)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Required?
                </span>
              </label>
            </div>
          );
        })}
      </div>
      {overflowCount > 0 ? (
        <HelperText>
          Warning: {overflowCount} required character
          {overflowCount === 1 ? " does" : "s do"} not fit in the four party
          slots — seed generation will fail. Remove starting or required
          characters until at most four remain.
        </HelperText>
      ) : null}
    </Card>
  );
};
