import { useQuery } from "react-query";
import Head from "next/head";
import { cx } from "cva";
import { AppHeader } from "~/components/AppHeader/AppHeader";
import { HomeFooter } from "~/components/Footer/Footer";
import { EventCard } from "~/components/EventCard/EventCard";
import { EventData } from "~/types/events";
import { openSans } from "~/pages/_app";
import { PageContainer } from "~/components/PageContainer/PageContainer";

import { parseCSV } from "~/utils/csvParser";
import { Disclosure, Transition } from "@headlessui/react";
import { HiChevronDown } from "react-icons/hi2";

const EVENTS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSZFZgv3BKozWuZeoHmfWQMFdQAYU-4FlxTLwf6sXFxyQBQRoCsmygcjn_9ErYllzBOx7VrzmTs9Sf/pub?output=csv";

export default function EventsPage() {
  const { data, isLoading, error } = useQuery<EventData[]>(
    "events",
    async () => {
      const res = await fetch(`${EVENTS_CSV_URL}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      const csvText = await res.text();
      const rawData = parseCSV(csvText);

      // Map CSV strings to EventData interface
      return rawData.map((row: any) => ({
        ...row,
        rulesLink: row.rules || row.rulesLink,
        participants: row.participants
          ? parseInt(row.participants, 10)
          : undefined,
        signupButtonColor:
          row.signupButtonColor || row.signupColor || row["Signup Color"],
        rulesButtonColor:
          row.rulesButtonColor || row.rulesColor || row["Rules Color"],
      })) as EventData[];
    },
  );

  const upcomingEvents = data?.filter((e) => e.status === "Upcoming") || [];
  const currentEvents = data?.filter((e) => e.status === "Current") || [];
  const archivedEvents = data?.filter((e) => e.status === "Archived") || [];

  const sections = [
    { title: "Upcoming Events", events: upcomingEvents, defaultOpen: true },
    { title: "Current Events", events: currentEvents, defaultOpen: true },
    { title: "Archived Events", events: archivedEvents, defaultOpen: false },
  ];

  return (
    <>
      <Head>
        <title>Events - FF6 Worlds Collide</title>
        <meta
          name="description"
          content="Highlighting community events and races for Final Fantasy VI Worlds Collide"
        />
      </Head>

      <div className="flex flex-col min-h-screen">
        <AppHeader />

        <main className={cx(openSans.className, "flex-grow py-8")}>
          {/* Hero Section */}
          <section className="relative py-8 px-6 text-center flex flex-col items-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-header font-bold uppercase tracking-wide mb-3 text-[var(--text-main)]">
                Community Events
              </h1>
              <div className="h-1 w-[120px] bg-blue-500 mx-auto mb-6 rounded-full"></div>
              <p className="text-lg md:text-xl text-[var(--text-sub)] max-w-2xl mx-auto font-medium leading-relaxed">
                Test your mettle and pick up some new tricks! Our events are a
                great place to sharpen your skills and connect with the
                community.
              </p>
            </div>
          </section>

          {/* Events List wrapped in PageContainer for unified width */}
          <PageContainer columns={1} className="py-4">
            <>
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[var(--text-sub)] font-mono">
                    Loading events...
                  </p>
                </div>
              )}

              {error && (
                <div className="text-center py-12 border border-red-300/30 bg-red-500/5 rounded-xl">
                  <p className="text-red-500 font-medium">
                    Error loading events. Please try again later.
                  </p>
                </div>
              )}

              {data && (
                <div className="flex flex-col gap-12">
                  {sections.map(
                    (section, idx) =>
                      section.events.length > 0 && (
                        <Disclosure key={idx} defaultOpen={section.defaultOpen}>
                          {({ open }) => (
                            <div className="flex flex-col gap-6">
                              <Disclosure.Button className="flex items-center justify-between w-full pb-4 border-b border-[var(--border-light)] hover:text-blue-500 transition-colors text-left group">
                                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-[var(--text-main)] group-hover:text-blue-500 transition-colors font-header">
                                  {section.title}
                                  <span className="ml-4 text-sm font-mono text-[var(--text-sub)] opacity-60 normal-case tracking-normal font-normal">
                                    ({section.events.length})
                                  </span>
                                </h2>
                                <HiChevronDown
                                  className={cx(
                                    "transition-transform duration-300 text-[var(--text-sub)] group-hover:text-blue-500",
                                    open ? "rotate-180" : "",
                                  )}
                                  size={24}
                                />
                              </Disclosure.Button>

                              <Transition
                                show={open}
                                enter="transition duration-150 ease-out"
                                enterFrom="transform opacity-0 -translate-y-4"
                                enterTo="transform opacity-100 translate-y-0"
                                leave="transition duration-100 ease-out"
                                leaveFrom="transform opacity-100 translate-y-0"
                                leaveTo="transform opacity-0 -translate-y-4"
                              >
                                <Disclosure.Panel className="flex flex-col gap-4">
                                  {section.events.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                  ))}
                                </Disclosure.Panel>
                              </Transition>
                            </div>
                          )}
                        </Disclosure>
                      ),
                  )}

                  {data.length === 0 && (
                    <div className="text-center py-20 text-[var(--text-sub)] border-2 border-dashed border-[var(--border-light)] rounded-xl">
                      <p>No events found at the moment. Check back soon!</p>
                    </div>
                  )}
                </div>
              )}
            </>
          </PageContainer>
        </main>

        <HomeFooter />
      </div>
    </>
  );
}
