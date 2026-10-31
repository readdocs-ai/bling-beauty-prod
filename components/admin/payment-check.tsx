'use client';
import {useState} from 'react';
export default function PaymentCheck(){
 const [reference,setReference]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState('');
 async function check(){
  if(busy)return;setBusy(true);setResult('Checking Worldpay…');
  try{
   const response=await fetch('/admin/api/worldpay-payment-check',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({reference:reference.trim()})});
   const data=await response.json();
   setResult(response.ok?`Stored status: ${data.storedStatus}; stored stage: ${data.storedProviderStage??'not started'}. Worldpay: ${data.state}; ${data.reason}; event: ${data.event??'none'}${data.paymentId?`; payment ID: ${data.paymentId}`:''}. No payment was retried or order changed.`:data.error??'Check unavailable');
  }catch{setResult('Check unavailable. No payment was retried.');}finally{setBusy(false);}
 }
 return <section className="mt-8 rounded-xl border p-5"><h2 className="text-xl">Check an existing Worldpay payment</h2><p className="mt-2 text-sm">Read-only lookup by order reference. It cannot start, retry, settle or mark a payment paid.</p><form className="mt-4 flex flex-wrap gap-3" onSubmit={e=>{e.preventDefault();void check();}}><label className="flex flex-1 flex-col gap-1">Order reference<input required value={reference} onChange={e=>setReference(e.target.value)} placeholder="BLING-…" className="rounded border p-2"/></label><button disabled={busy} className="self-end rounded bg-black px-4 py-2 text-white disabled:opacity-50">{busy?'Checking…':'Check Worldpay (read-only)'}</button></form><p role="status" aria-live="polite" className="mt-3 break-words text-sm">{result}</p></section>;
}
