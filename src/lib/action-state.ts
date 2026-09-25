export type ActionState =
  | {
      error?: string;
      ok?: string;
      /** Echoed non-secret form values so the form can be re-filled after an error. */
      values?: Record<string, string>;
    }
  | undefined;
