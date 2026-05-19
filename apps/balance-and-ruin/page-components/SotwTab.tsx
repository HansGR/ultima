import { useEffect, useState } from "react";
import orderBy from "lodash/orderBy";
import { Link, Card } from "@ff6wc/ui";
import { DISCORD_URL } from "@ff6wc/utils/constants";
import { PageContainer } from "~/components/PageContainer/PageContainer";
import { SotwCard } from "~/components/SotwCard/SotwCard";
import { SeedOfTheWeek } from "~/types/sotw";

type Nullable<T> = T | null;

export const SotwTab = () => {
  const [sotw, setSotw] = useState<Nullable<SeedOfTheWeek>>(null);
  const [sotwId, setSotwId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const queryParameters = new URLSearchParams(window.location.search);
    let id = queryParameters.get("id");

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/sotws`)
      .then((res) => res.json())
      .then((sotws) => {
        const keys = Object.keys(sotws);
        if (!id) {
          // Get the latest SOTW
          const ordered = orderBy(keys, (val) => Number.parseInt(val), "desc");
          id = ordered[0];
        }
        setSotwId(id);
        setSotw(sotws[id]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch SOTW data", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="flex-grow py-2 flex flex-col gap-6">
      {/* Hero Section */}
      <section className="relative py-6 px-4 text-center flex flex-col items-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-header font-bold uppercase tracking-wide mb-2 text-[var(--text-main)]">
            Seed of the Week
          </h1>
          <div className="h-1 w-[100px] bg-blue-500 mx-auto mb-4 rounded-full"></div>
          <p className="text-base md:text-lg text-[var(--text-sub)] max-w-xl mx-auto font-medium leading-relaxed">
            A casual weekly race showcasing unique flagsets submitted by the
            community.
          </p>
        </div>
      </section>

      <PageContainer
        columns={1}
        className="py-2 px-4 md:px-0 flex flex-col gap-6"
      >
        <>
          <Card title="About the Race">
            <div className="flex flex-col gap-4 text-[var(--text-sub)] leading-relaxed">
              <p>
                Seed of the Week (SotW) is a great environment to test your
                skills, learn new tips from other community runners, and
                discover fun, exotic settings.
              </p>
              <p>
                Join the{" "}
                <Link
                  href={DISCORD_URL}
                  target="_blank"
                  className="text-blue-500 hover:text-blue-400 underline transition-colors font-medium"
                >
                  Discord server
                </Link>{" "}
                to play alongside other community members and submit your own
                ideas for upcoming weekly seeds!
              </p>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[var(--text-sub)] font-mono text-sm">
                Loading current seed data...
              </p>
            </div>
          ) : (
            sotw && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-outfit font-semibold text-[var(--text-main)] ml-1">
                  Active Showcase
                </h2>
                <SotwCard sotwId={sotwId} sotw={sotw} />
              </div>
            )
          )}
        </>
      </PageContainer>
    </div>
  );
};
