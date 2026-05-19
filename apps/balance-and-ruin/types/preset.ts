export type FlagPreset = {
  arguments: string;
  creator: string;
  creator_name: string;
  creator_id: number;
  description: string;
  /** flags */
  flags: string;
  hidden: boolean;
  /** label */
  name: string;
  official: boolean;
  /** ISO date string from the API */
  created_at?: string;
  /**
   * ISO date string — tracked client-side in localStorage, keyed per user.
   * Populated at runtime before rendering, not stored on the preset object itself.
   */
  last_downloaded?: string;
};
