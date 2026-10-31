"use client";
import { useEffect, useRef, useState } from "react";
import { parseEnvironmentDeviceData,deviceDataCompletion } from "@/lib/worldpay/device-data.mjs";
/** Only the matching Live/Try Cardinal frame can supply the DDC reference. */
export default function WorldpayDeviceData({deviceData,onComplete,environment='try'}:{deviceData:unknown;onComplete:(reference:string)=>void;environment?:'try'|'live'}) {
  const valid = parseEnvironmentDeviceData(deviceData,environment);
  const form = useRef<HTMLFormElement>(null);
  const [started,setStarted] = useState(false);
  const completed = useRef(false);
  useEffect(()=>{
    if (!valid) return;
    const receive=(event:MessageEvent)=>{
      if(completed.current)return;
      const reference=deviceDataCompletion(event.data,event.origin,environment,
        event.source===document.querySelector<HTMLIFrameElement>('iframe[name=bling-worldpay-ddc-frame]')?.contentWindow);
      if(!reference)return;
      completed.current=true;onComplete(reference);
    };
    window.addEventListener('message',receive);
    return ()=>window.removeEventListener('message',receive);
  },[valid?.url,onComplete,environment]);
  useEffect(()=>{if(valid && !started && form.current){setStarted(true);form.current.submit();}},[valid?.url,valid?.jwt,started]);
  if(!valid)return <p role="alert">Device security check unavailable. Payment is not confirmed.</p>;
  return <section aria-label="Card security check">
    <p>Checking card security information. Payment is not confirmed.</p>
    <form ref={form} action={valid.url} target="bling-worldpay-ddc-frame" method="POST">
      <input type="hidden" name="JWT" value={valid.jwt}/><input type="hidden" name="Bin" value={valid.bin}/>
    </form>
    <iframe name="bling-worldpay-ddc-frame" title="Card security device check" className="h-1 w-1 border-0" referrerPolicy="no-referrer"/>
  </section>;
}
