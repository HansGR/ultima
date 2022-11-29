import { Tab } from "@headlessui/react";
import { cva, VariantProps } from "cva";

const tabStyles = cva(
  [
    "group relative min-w-0 flex-1",
    "overflow-hidden",
    "py-3 px-6",
    "border-1 border-transparent",
    "outline-1",
    "outline-blue-500",
    "outline-offset-0",
    "rounded-none",
    "focus:z-10",
    "font-medium",
  ],
  {
    variants: {
      selected: {
        true: "text-gray-900",
        false: "text-gray-500 hover:text-gray-700",
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

const tabUndercarriageStyles = cva(["absolute inset-x-0 bottom-0 h-0.5"], {
  variants: {
    selected: {
      true: "bg-blue-500 bg-opacity-90",
      false: "bg-transparent",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

type TabItem = {
  content: React.ReactNode;
  id: string;
  label: React.ReactNode;
};

export type TabItemProps = VariantProps<typeof tabStyles> & {
  children: React.ReactNode;
  item: TabItem;
  // onClick: (tab: TabItem) => void;
};

export const TabItem = ({ children, item, selected }: TabItemProps) => {
  return (
    <Tab
      className={tabStyles({
        selected,
      })}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className={tabUndercarriageStyles({ selected })}
      />
    </Tab>
  );
};