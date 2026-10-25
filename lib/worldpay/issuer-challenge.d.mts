export type IssuerChallenge = { url: string; jwt: string; reference: string };
export function parseIssuerChallenge(value: unknown): IssuerChallenge | null;
