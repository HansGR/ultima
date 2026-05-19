import { Card, HelperText } from "@ff6wc/ui";
import startCase from "lodash/startCase";
import { useSelector } from "react-redux";
import { BetaLabel } from "~/components/BetaLabel/BetaLabel";
import { FlagSelect } from "~/components/FlagSelect/FlagSelect";
import { FlagTextInput } from "~/components/FlagInput/FlagInput";
import { FlagSlider } from "~/components/FlagSlider/FlagSlider";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";
import { selectSchema } from "~/state/schemaSlice";

// Master list of flags explicitly hardcoded in page-components and card-components
const USED_FLAGS = [
  "-adeh",
  "-ahtc",
  "-ame",
  "-anca",
  "-ari",
  "-ase",
  "-asr",
  "-bbr",
  "-bbs",
  "-be",
  "-bel",
  "-bmkl",
  "-bnds",
  "-bnu",
  "-brl",
  "-cce",
  "-ccrs",
  "-ccrt",
  "-ccsr",
  "-cg",
  "-checks",
  "-chrm",
  "-cmd",
  "-cms",
  "-cnee",
  "-cnil",
  "-com",
  "-cor",
  "-cosr",
  "-cpal",
  "-cpor",
  "-crm",
  "-crr",
  "-crsr",
  "-crvr",
  "-csb",
  "-cspp",
  "-cspr",
  "-csrp",
  "-das",
  "-dda",
  "-de",
  "-del",
  "-dgne",
  "-dns",
  "-drewards",
  "-drloc",
  "-ebr",
  "-ebs",
  "-eebr",
  "-eer",
  "-elr",
  "-elrt",
  "-emi",
  "-emprp",
  "-emprv",
  "-emps",
  "-ems",
  "-escr",
  "-esr",
  "-esrr",
  "-esrt",
  "-ess",
  "-essrr",
  "-etn",
  "-etr",
  "-eu",
  "-fbs",
  "-fc",
  "-fe",
  "-fedc",
  "-fer",
  "-fj",
  "-fr",
  "-frm",
  "-frw",
  "-fs",
  "-fst",
  "-fvd",
  "-gp",
  "-gpm",
  "-hma",
  "-hmbd",
  "-hmc",
  "-hmce",
  "-hmced",
  "-hmh",
  "-hmt",
  "-iebr",
  "-ieor",
  "-ier",
  "-ierbr",
  "-ieror",
  "-ierr",
  "-iersr",
  "-iertr",
  "-iesr",
  "-ietr",
  "-ir",
  "-lel",
  "-lmprp",
  "-lmprv",
  "-lmps",
  "-lsa",
  "-lsbd",
  "-lsc",
  "-lsce",
  "-lsced",
  "-lsh",
  "-lst",
  "-manualflagstring",
  "-mca",
  "-mmnu",
  "-mmprp",
  "-mmprv",
  "-mmps",
  "-move",
  "-mpm",
  "-msl",
  "-name",
  "-nee",
  "-nfce",
  "-nfps",
  "-nil",
  "-nm1",
  "-nm2",
  "-nmc",
  "-nmmi",
  "-nosaves",
  "-noshoes",
  "-npctips",
  "-npi",
  "-nu",
  "-nxppd",
  "-ond",
  "-open",
  "-pd",
  "-rec1",
  "-rec2",
  "-rec3",
  "-rec4",
  "-rec5",
  "-rec6",
  "-rechu",
  "-rer",
  "-res",
  "-rls",
  "-rnc",
  "-rnl",
  "-rnl1",
  "-rnl2",
  "-rns1",
  "-rns2",
  "-s",
  "-sal",
  "-saw",
  "-sc1",
  "-sc2",
  "-sc3",
  "-sc4",
  "-sca",
  "-scan",
  "-scc",
  "-sch",
  "-scia",
  "-scis",
  "-sdm",
  "-sdr",
  "-sebr",
  "-sed",
  "-sel",
  "-sesb",
  "-sfb",
  "-sfd",
  "-sie",
  "-sirt",
  "-sisr",
  "-sj",
  "-sl",
  "-slr",
  "-smc",
  "-sn",
  "-snbr",
  "-snee",
  "-snes",
  "-snil",
  "-snsb",
  "-sprp",
  "-sprv",
  "-srp3",
  "-srr",
  "-ssd",
  "-ssf0",
  "-ssf4",
  "-ssf8",
  "-stesp",
  "-stl",
  "-stloc",
  "-sto",
  "-stra",
  "-sws",
  "-u254",
  "-unknown",
  "-warp",
  "-wmhc",
  "-wnz",
  "-xga",
  "-xgbd",
  "-xgc",
  "-xgce",
  "-xgced",
  "-xgh",
  "-xgt",
  "-xpm",
  "-ycreature",
  "-yimperial",
  "-ymain",
  "-ymascot",
  "-yrandom",
  "-yreflect",
  "-yremove",
  "-ysketch",
  "-ystone",
  "-yvxz",
];

export const HiddenFlagsCard = () => {
  const schema = useSelector(selectSchema);

  // 1. Compute unmapped flags, filtering out hardcoded ones AND runtime objective slots (-oa, -ob...)
  const unmappedFlags = Object.keys(schema)
    .filter((flag) => {
      const metadata = schema[flag];
      const isUsed = USED_FLAGS.includes(flag);
      const isObjective = /^-o[a-z]+$/.test(flag);

      // Inspect labels and descriptions for 'deprecated' string
      const textToScan =
        `${metadata?.description || ""} ${metadata?.label || ""}`.toLowerCase();
      const isDeprecated =
        textToScan.includes("deprecated") || textToScan.includes("legacy");

      return !isUsed && !isObjective && !isDeprecated;
    })
    .sort();

  if (unmappedFlags.length === 0) {
    return null;
  }

  // 2. Group flags dynamically by their schema-provided metadata group
  const groups: Record<string, string[]> = {};
  unmappedFlags.forEach((flag) => {
    const metadata = schema[flag];
    let rawGroup = metadata?.group || "Other Settings";

    // Map legacy tags to gorgeous UI subheadings
    if (rawGroup === "optional arguments") rawGroup = "General Configuration";
    if (rawGroup === "Misc.") rawGroup = "Miscellaneous Settings";
    if (rawGroup === "Steal") rawGroup = "Stealing and Item Drops";

    const groupName = startCase(rawGroup);
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(flag);
  });

  return (
    <Card title="Hidden & Unmapped Options">
      <HelperText variant="success" className="mb-6">
        <div>
          The following <strong>{unmappedFlags.length} stable options</strong>{" "}
          exist in the core engine but have no manual card mappings.
        </div>
        <div>
          They have been clustered automatically by their backend subsystem
          definitions.
        </div>
      </HelperText>

      <div className="flex flex-col gap-10 mt-4">
        {Object.entries(groups).map(([groupName, flags]) => (
          <div key={groupName} className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="text-xs font-bold text-blue-500 tracking-widest uppercase">
                {groupName}
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 font-mono rounded-full border border-blue-100 dark:border-blue-900">
                {flags.length} {flags.length === 1 ? "flag" : "flags"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              {flags.map((flag) => {
                const metadata = schema[flag];
                const label = metadata.label || flag;
                const displayLabel = <BetaLabel>{label}</BetaLabel>;

                if (
                  metadata.allowedValues &&
                  metadata.allowedValues.length > 0
                ) {
                  return (
                    <div
                      key={flag}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/20 p-4 backdrop-blur-sm"
                    >
                      <FlagSelect
                        flag={flag}
                        label={displayLabel}
                        nullable
                        nullableLabel="Default"
                      />
                    </div>
                  );
                }

                if (metadata.type === "str" || metadata.type === "lower") {
                  return (
                    <div
                      key={flag}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/20 p-4 backdrop-blur-sm"
                    >
                      <FlagTextInput
                        flag={flag}
                        label={displayLabel}
                        placeholder="Enter value..."
                      />
                    </div>
                  );
                }

                if (metadata.min !== null && metadata.max !== null) {
                  return (
                    <div
                      key={flag}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/20 p-4 backdrop-blur-sm flex flex-col justify-center"
                    >
                      <FlagSlider
                        flag={flag}
                        label={displayLabel}
                        helperText={metadata.description || ""}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={flag}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/20 p-4 backdrop-blur-sm flex flex-col justify-between"
                  >
                    <FlagSwitch
                      flag={flag}
                      label={displayLabel}
                      helperText={metadata.description || ""}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
