export type CaptureAction={kind:'integrated'|'card-v7';href:string};
export function safeTryCaptureAction(href:unknown):CaptureAction;
export function resolveCaptureAction(attempt:unknown,details:unknown):CaptureAction;
