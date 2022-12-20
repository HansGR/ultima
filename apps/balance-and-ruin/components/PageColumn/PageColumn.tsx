export type PageColumnProps = {
  children: React.ReactNode;
};

export const PageColumn = ({ children }: PageColumnProps) => {
  return (
    <div className="flex flex-col gap-4 flex-grow flex-shrink">{children}</div>
  );
};
