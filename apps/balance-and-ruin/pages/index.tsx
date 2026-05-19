import { ButtonLink, DiscordButton } from "@ff6wc/ui";
import type { GetStaticPropsContext, NextPage } from "next";
import { HiPencil } from "react-icons/hi2";
import { WIKI_URL } from "@ff6wc/utils/constants";
import { HomeFooter } from "~/components/Footer/Footer";
import { SotwButton } from "~/components/SotwButton/SotwButton";
import { SpriteDrawAnimation } from "~/components/SpriteDrawAnimation/SpriteDrawAnimation";
import Head from "next/head";
import Link from "next/link";
import styles from "./index.module.css";

export async function getStaticProps(context: GetStaticPropsContext) {
  return {
    props: {},
  };
}

export default function NewLandingPage() {
  return (
    <>
      <Head>
        <title>FF6 Worlds Collide</title>
        <meta
          name="description"
          content="Final Fantasy VI open-world randomizer"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.container}>
        <div className={styles.heroBackground}></div>

        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.mainTitle}>Worlds Collide</h1>
            <div className={styles.titleDivider} />
            <h2 className={styles.subTitle}>Final Fantasy VI Randomizer</h2>

            <p className={styles.description}>
              Worlds Collide (WC) is an open-world randomizer for Final Fantasy
              VI on the SNES. Players begin aboard the airship and can travel
              freely between the World of Balance and the World of Ruin to
              discover characters and espers. Once you&apos;ve gathered enough,
              you can face off against Kefka.
            </p>
            <p className={styles.description}>
              Options within WC include options to randomize characters,
              commands, espers, treasure, shops and more with over 200 flags to
              customize each playthrough.
            </p>
          </div>
        </header>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Getting Started</h3>

          <div className={styles.grid}>
            {/* Discord Card */}
            <div className={styles.gridItem}>
              <div className={styles.gridItemTitle}>
                <SpriteDrawAnimation
                  delay={150}
                  spriteId={5}
                  paletteId={0}
                  poses={[16, 17]}
                />
                <span>Discord</span>
              </div>
              <div className={styles.gridItemContent}>
                Join our Discord server to talk with the community and learn
                about the latest news and events.
              </div>
              <div className={styles.actionArea}>
                <DiscordButton />
              </div>
            </div>

            {/* SOTW Card */}
            <div className={styles.gridItem}>
              <div className={styles.gridItemTitle}>
                <SpriteDrawAnimation
                  delay={150}
                  spriteId={21}
                  paletteId={3}
                  poses={[29, 30]}
                />
                <span>Seed of the Week</span>
              </div>
              <div className={styles.gridItemContent}>
                Play a weekly seed submitted by a community member. You can post
                your time in the discord and see how you compare to others!
              </div>
              <div className={styles.actionArea}>
                <SotwButton />
              </div>
            </div>

            {/* Wiki Card */}
            <div className={styles.gridItem}>
              <div className={styles.gridItemTitle}>
                <SpriteDrawAnimation
                  delay={300}
                  spriteId={15}
                  paletteId={0}
                  poses={[25, 25, 26]}
                />
                <span>Wiki</span>
              </div>
              <div className={styles.gridItemContent}>
                Visit the wiki for guides, resources, and how to get the most
                out of WC.
              </div>
              <div className={styles.actionArea}>
                <ButtonLink
                  className={styles.primaryButton}
                  href={WIKI_URL}
                  variant="primary"
                >
                  <HiPencil size="24" />
                  Wiki
                </ButtonLink>
              </div>
            </div>

            {/* Randomizer Card */}
            <div className={styles.gridItem}>
              <div className={styles.gridItemTitle}>
                <SpriteDrawAnimation
                  delay={300}
                  spriteId={0}
                  paletteId={74}
                  poses={[1, 0, 1, 2]}
                />
                <span>Randomizer</span>
              </div>
              <div className={styles.gridItemContent}>
                Generate a random seed and begin to play Worlds Collide.
              </div>
              <div className={styles.actionArea}>
                <Link href="/create" className={styles.primaryButton}>
                  Customize
                </Link>
              </div>
            </div>
          </div>
        </section>

        <HomeFooter />
      </div>
    </>
  );
}
