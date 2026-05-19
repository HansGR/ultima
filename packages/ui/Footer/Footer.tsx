import styles from "./Footer.module.css";

export type FooterProps = {
  messages: React.ReactNode[];
};

export const Footer = (props: FooterProps) => {
  const { messages } = props;
  return (
    <div className={styles.footer}>
      {messages.map((m, idx) => (
        <div className={styles.footerText} key={idx}>
          {m}
        </div>
      ))}
    </div>
  );
};
