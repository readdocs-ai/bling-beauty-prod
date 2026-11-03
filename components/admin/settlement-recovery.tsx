'use client';
import {useState} from 'react';
export default function SettlementRecovery(){
 const [busy,setBusy]=useState(false),[status,setStatus]=useState('');
 async function recover(){
  if(busy)return;setBusy(true);setStatus('Checking saved payment notifications…');
  try{const r=await fetch('/admin/api/worldpay-settlement-recovery',{method:'POST'});const data=await r.json();
   setStatus(r.ok?`Review completed: ${(data.outcomes??[]).join(', ')||'No pending notifications'}. Refresh this page for current records.`:data.error??'Review unavailable');
  }catch{setStatus('Review unavailable. No payment was retried.');}finally{setBusy(false);}
 }
 return <div><button type="button" disabled={busy} onClick={recover} className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50">{busy?'Checking…':'Process pending test notifications'}</button>
 <p className="mt-2 text-sm">Checks saved signed notifications and pending emails. It cannot authorise or capture a payment. Uncertain email deliveries require separate review.</p><p role="status" aria-live="polite" className="mt-2 text-sm">{status}</p></div>;
}
