/** Server-only readiness: no credentials are returned. */
import {liveReadiness} from './worldpay/live-policy.mjs';
export function worldpayReadiness(){
 const result=liveReadiness(process.env);
 return {environment:process.env.WORLDPAY_ENVIRONMENT??'unconfigured',
  credentialsConfigured:result.checks.apiUsername&&result.checks.apiPassword&&result.checks.merchantEntity,
  missingEnvironmentVariables:Object.entries(result.checks).filter(([,ok])=>!ok).map(([name])=>name),
  liveCheckoutEnabled:result.ready,reason:result.ready?'Live configuration present; verify ordering state and end-to-end payment.':'Live payment configuration is incomplete.'};
}
