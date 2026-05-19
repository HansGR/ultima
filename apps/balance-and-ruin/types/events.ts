export interface EventData {
  id: string;
  title: string;
  status: "Upcoming" | "Current" | "Archived";
  date: string;
  shortDescription: string;
  description: string;
  rulesLink?: string;
  participants?: number;
  signupLink?: string;
  signupButtonColor?: string;
  discordLink?: string;
  image?: string;
  rulesButtonColor?: string;
}
