export type ThreeDSStep = 'device_data' | 'challenge' | 'authorised' | 'settlement_requested' | 'declined' | 'unknown';
export const THREE_DS_STEPS: Readonly<Record<string, ThreeDSStep>>;
export function classifyIntegrated3DS(data: unknown, status: number): { step: ThreeDSStep; next?: { href: string; method: 'POST' }; deviceDataCollection?: { jwt: string; url: string; bin?: string }; challenge?: { url: string; jwt: string; reference: string; payload?: string } };
export function mayContinue3DS(currentStep: ThreeDSStep, requestedAction: string): boolean;
