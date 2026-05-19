import { Listbox, Transition } from "@headlessui/react";
import { Fragment, KeyboardEvent, useMemo, useState } from "react";
import { HiChevronDown, HiMagnifyingGlass } from "react-icons/hi2";
import { cx } from "cva";
import { renderDescription } from "~/utils/renderDescription";

export type SelectOption = {
  readonly helperText?: React.ReactNode;
  readonly value: string;
  readonly label: string;
  readonly defaultValue?: any;
  readonly dynamicValue?: any;
  [key: string]: any;
};

export type SelectGroup = {
  readonly label: string;
  readonly options: SelectOption[];
};

type SelectProps = {
  className?: string;
  containerClassName?: string;
  components?: any;
  defaultValue?: SelectOption;
  /** When true, pressing arrow key up/down on a closed select option will select the next option. */
  nextOnArrowKeys?: boolean;
  onChange: (selected: SelectOption | null) => void;
  options: (SelectOption | SelectGroup)[];
  placeholder?: string;
  value: SelectOption | null;
  renderOption?: (option: any) => React.ReactNode;
  renderValue?: (option: any) => React.ReactNode;
  isSearchable?: boolean;
  filterOption?: (option: SelectOption, needle: string) => boolean;
};

export const Select = ({
  className,
  containerClassName,
  defaultValue,
  options,
  onChange,
  placeholder,
  nextOnArrowKeys,
  value,
  renderOption,
  renderValue,
  isSearchable = false,
  filterOption,
}: SelectProps) => {
  const activeOption = value ?? defaultValue ?? null;
  const [searchQuery, setSearchQuery] = useState("");

  const flatOptions = useMemo(() => {
    const list: SelectOption[] = [];
    options.forEach((item) => {
      if ("options" in item) {
        list.push(...item.options);
      } else {
        list.push(item);
      }
    });
    return list;
  }, [options]);

  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    open: boolean,
  ) => {
    if (nextOnArrowKeys && !open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const idx = flatOptions.findIndex(
          (opt) => opt.value === activeOption?.value,
        );
        let nextIdx = idx;

        if (e.key === "ArrowDown") {
          nextIdx = idx === -1 ? 0 : Math.min(idx + 1, flatOptions.length - 1);
        } else if (e.key === "ArrowUp") {
          nextIdx = idx === -1 ? 0 : Math.max(idx - 1, 0);
        }

        if (nextIdx !== idx && flatOptions[nextIdx]) {
          onChange(flatOptions[nextIdx]);
        }
      }
    }
  };

  // Custom Filter Logic
  const filteredItems = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return options;

    const matches = (opt: SelectOption) => {
      if (filterOption) {
        return filterOption(opt, searchQuery);
      }
      return (
        opt.label.toLowerCase().includes(needle) ||
        opt.value.toLowerCase().includes(needle) ||
        (typeof opt.helperText === "string" &&
          opt.helperText.toLowerCase().includes(needle))
      );
    };

    return options
      .map((item) => {
        if ("options" in item) {
          const matchingSubOptions = item.options.filter(matches);
          if (matchingSubOptions.length > 0) {
            return {
              ...item,
              options: matchingSubOptions,
            };
          }
          return null;
        }
        return matches(item) ? item : null;
      })
      .filter(Boolean) as (SelectOption | SelectGroup)[];
  }, [options, searchQuery, filterOption]);

  return (
    <div
      className={cx("relative w-full flex flex-col gap-1", containerClassName)}
    >
      <Listbox
        value={activeOption}
        onChange={(val) => {
          onChange(val);
          setSearchQuery(""); // Reset search query on select
        }}
      >
        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              onKeyDown={(e) => handleKeyDown(e, open)}
              className={cx(
                "relative w-full min-h-[42px] py-2 pl-3 pr-10 text-left transition-all duration-200 cursor-pointer",
                "bg-[var(--bg-input)] border border-[var(--border-input)] rounded shadow-sm",
                "hover:border-neutral-400 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500",
                className,
              )}
            >
              <span className="flex items-center gap-2 truncate text-sm font-medium text-[var(--text-main)]">
                {activeOption
                  ? renderValue
                    ? renderValue(activeOption)
                    : activeOption.label
                  : (placeholder ?? "Select option...")}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <HiChevronDown
                  className={cx(
                    "w-5 h-5 text-[var(--text-sub)] transition-transform duration-200",
                    open ? "rotate-180" : "",
                  )}
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              afterLeave={() => setSearchQuery("")}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 -translate-y-1 scale-95"
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 -translate-y-1 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
            >
              <Listbox.Options
                className={cx(
                  "absolute w-full py-1 mt-1.5 overflow-auto text-base sm:text-sm rounded shadow-xl max-h-[400px] ring-1 ring-black/5 focus:outline-none z-[100]",
                  "bg-[var(--bg-menu)] border border-[var(--border-light)] flex flex-col",
                )}
              >
                {isSearchable && (
                  <div className="sticky top-0 z-10 px-2 py-2 bg-[var(--bg-menu)] border-b border-[var(--border-light)]/60 flex items-center gap-2">
                    <HiMagnifyingGlass className="text-[var(--text-sub)] w-4 h-4 ml-1 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()} // Prevent arrow key propagation inside search box
                      placeholder="Search..."
                      className="w-full px-2 py-1 text-xs bg-[var(--bg-input)] border border-[var(--border-input)] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-[var(--text-main)]"
                    />
                  </div>
                )}

                <div className="overflow-y-auto flex-1">
                  {filteredItems.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--text-sub)] italic text-center">
                      No options found
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => {
                      if ("options" in item) {
                        // Render Group Header & Sub-Options
                        return (
                          <div
                            key={`group-${item.label}-${idx}`}
                            className="border-b border-[var(--border-light)]/20 last:border-0"
                          >
                            <div className="sticky top-0 z-10 px-4 py-1.5 text-xs font-bold tracking-wider uppercase bg-slate-800/30 text-blue-400 select-none backdrop-blur-sm border-b border-t border-[var(--border-light)]/10">
                              {item.label}
                            </div>
                            {item.options.map((option, subIdx) => (
                              <Listbox.Option
                                key={`${option.value}-${subIdx}`}
                                className={({ active, selected }) =>
                                  cx(
                                    "relative cursor-pointer select-none py-2.5 px-4 transition-all duration-100",
                                    active
                                      ? "bg-blue-600 text-white"
                                      : selected
                                        ? "bg-[var(--border-light)]/40 text-[var(--text-main)] font-semibold"
                                        : "text-[var(--text-main)]",
                                  )
                                }
                                value={option}
                              >
                                {({ active, selected }) => (
                                  <div className="flex flex-col pl-2 border-l border-blue-500/20">
                                    {renderOption ? (
                                      renderOption(option)
                                    ) : (
                                      <>
                                        <span
                                          className={cx(
                                            "block truncate",
                                            selected
                                              ? "font-semibold"
                                              : "font-normal",
                                          )}
                                        >
                                          {option.label}
                                        </span>
                                        {option.helperText && (
                                          <span
                                            className={cx(
                                              "block text-xs mt-0.5 font-normal break-words whitespace-normal leading-relaxed opacity-85",
                                              active
                                                ? "text-blue-100"
                                                : "text-[var(--text-sub)]",
                                            )}
                                          >
                                            {renderDescription(
                                              option.helperText,
                                              option.dynamicValue ??
                                                option.defaultValue ??
                                                null,
                                            )}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </div>
                        );
                      }

                      // Render Flat Option
                      const option = item;
                      return (
                        <Listbox.Option
                          key={`${option.value}-${idx}`}
                          className={({ active, selected }) =>
                            cx(
                              "relative cursor-pointer select-none py-2.5 px-4 transition-all duration-100",
                              active
                                ? "bg-blue-600 text-white"
                                : selected
                                  ? "bg-[var(--border-light)]/40 text-[var(--text-main)] font-semibold"
                                  : "text-[var(--text-main)]",
                            )
                          }
                          value={option}
                        >
                          {({ active, selected }) => (
                            <div className="flex flex-col">
                              {renderOption ? (
                                renderOption(option)
                              ) : (
                                <>
                                  <span
                                    className={cx(
                                      "block truncate",
                                      selected
                                        ? "font-semibold"
                                        : "font-normal",
                                    )}
                                  >
                                    {option.label}
                                  </span>
                                  {option.helperText && (
                                    <span
                                      className={cx(
                                        "block text-xs mt-0.5 font-normal break-words whitespace-normal leading-relaxed opacity-85",
                                        active
                                          ? "text-blue-100"
                                          : "text-[var(--text-sub)]",
                                      )}
                                    >
                                      {renderDescription(
                                        option.helperText,
                                        option.dynamicValue ??
                                          option.defaultValue ??
                                          null,
                                      )}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </Listbox.Option>
                      );
                    })
                  )}
                </div>
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
    </div>
  );
};
