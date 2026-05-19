export type CardColumnProps = {
  children: React.ReactNode;
};

export const CardColumn = ({ children }: CardColumnProps) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-x-8 gap-y-4 w-full [&>hr]:col-span-full [&>.col-span-full]:col-span-full">
      {children}
    </div>
  );
};
