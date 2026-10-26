"use client";
import { useEffect, useRef, useState } from "react";
import { parseDeviceData } from "@/lib/worldpay/device-data.mjs";
const TRUSTED_ORIGIN = 'https://centinelapistag.cardinalcommerce.com';
/** Only the Worldpay Try Cardinal frame can supply a successful DDC reference. */
export default function WorldpayDeviceData({deviceData,onComplete}:{deviceData:unknown;onComplete:(reference:string)=>void}) {
  const valid = parseDeviceData(deviceData);
  const form = useRef<HTMLFormElement>(null);
  const [started,setStarted] = useState(false);
  const completed = useRef(false);
  useEffect(()=>{
    if (!valid) return;
    const receive=(event:MessageEvent)=>{
      if (event.origin!==TRUSTED_ORIGIN || completed.current || event.source !== document.querySelector<HTMLIFrameElement>('iframe[name=bling-worldpay-ddc-frame]')?.contentWindow) return;
      let data:unknown=event.data;
      if (typeof data==='string') {try {data=JSON.parse(data);}catch{return;}}
      if (!data || typeof data!=='object') return;
      const msg=data as Record<string,unknown>;
      if (msg.MessageType!=='profile.completed' || msg.Status!==true ||
          typeof msg.SessionId!=='string' || !/^[A-Za-z0-9_-]{8,200}$/.test(msg.SessionId)) return;
      completed.current=true; onComplete(msg.SessionId);
    };
    window.addEventListener('message',receive);
    return ()=>window.removeEventListener('message',receive);
  },[valid?.url,onComplete]);
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
