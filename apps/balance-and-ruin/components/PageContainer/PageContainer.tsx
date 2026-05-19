import { cva, VariantProps } from "cva";

export type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof styles>;

const styles = cva(["m-auto grid grid-flow-dense gap-6 items-start w-full"], {
  defaultVariants: {
    columns: 1,
  },
  variants: {
    columns: {
      // Single-column pages (Presets, Generate, Settings, Fixes…)
      // Capped at 860 px — matches card-reading comfort and the Presets layout.
      1: ["grid-cols-1", "max-w-[860px]", "p-5"],
      // Two-column pages (Gameplay, Items, Commands…)
      2: ["grid-cols-1 lg:grid-cols-2", "max-w-[1100px]", "p-5"],
      // Three-column pages (Battle, Graphics…) — let them breathe.
      3: [
        "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        "max-w-full lg:max-w-[1400px]",
        "p-5",
      ],
      null: [],
    },
  },
});

export const PageContainer = ({
  children,
  className,
  columns,
}: PageContainerProps) => {
  return <div className={styles({ columns, className })}>{children}</div>;
};

const gridItemStyles = cva([], {
  defaultVariants: {
    size: "single",
  },
  variants: {
    size: {
      single: ["col-span-1"],
      double: ["col-span-1 md:col-span-2"],
      full: ["col-span-full"],
    },
  },
});

export type GridItemProps = {
  children: React.ReactNode;
  className?: string;
} & VariantProps<typeof gridItemStyles>;

export const GridItem = ({ children, size, className }: GridItemProps) => {
  return <div className={gridItemStyles({ size, className })}>{children}</div>;
};
