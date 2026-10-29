'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function RoyalMailImport({orderId,claimed,imported,enabled,canCheck}:{orderId:string;claimed:boolean;imported:boolean;enabled:boolean;canCheck:boolean}){
 const router=useRouter(),[busy,setBusy]=useState(false),[locked,setLocked]=useState(claimed),[result,setResult]=useState('');
 async function run(path:string,body:object){
  if(busy)return;setBusy(true);setResult('');
  try{const response=await fetch('/admin/api/royal-mail/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
   const data=await response.json();if(!response.ok){if(data.retrySafe===true)setLocked(false);throw Error(data.error??'Royal Mail request was not confirmed');}
   setResult(data.orderIdentifier?`Royal Mail order ${data.orderIdentifier}${data.trackingNumber?` — tracking ${data.trackingNumber}`:''}. Review it in Click & Drop before applying postage.`:data.message??'Check completed.');router.refresh();
  }catch(e){setResult(e instanceof Error?e.message:'Outcome unknown. Check the existing import before trying anything else.');}
  finally{setBusy(false);}
 }
 return <section className="mt-5 rounded-xl border p-4"><h2 className="font-semibold">Royal Mail Click &amp; Drop</h2>
 <p className="mt-2 text-sm">Create a draft under Bling Beauty Products after packing this paid order. Apply postage and print the label in Click &amp; Drop.</p>
 {!enabled&&<p className="mt-2 text-sm">Production Royal Mail configuration is incomplete. Import is unavailable.</p>}
 {!imported&&!locked&&<form className="mt-4 grid gap-3" onSubmit={e=>{e.preventDefault();if(busy)return;const form=new FormData(e.currentTarget);setLocked(true);void run('import',{orderId,weightGrams:Number(form.get('weight')),taxPence:Math.round(Number(form.get('tax'))*100),packageFormat:String(form.get('format'))});}}>
 <label className="grid gap-1 text-sm">Measured total packed weight (grams)<input required type="number" min="1" max="30000" step="1" name="weight" className="rounded border p-2"/></label>
 <label className="grid gap-1 text-sm">Actual tax included in the order total (£; enter 0 if none)<input required type="number" min="0" step="0.01" name="tax" className="rounded border p-2"/></label>
 <label className="grid gap-1 text-sm">Parcel format<select required name="format" defaultValue="" className="rounded border p-2"><option value="" disabled>Choose packed parcel format</option><option value="smallParcel">Small parcel</option><option value="mediumParcel">Medium parcel</option><option value="largeParcel">Large parcel</option><option value="parcel">Parcel (account format)</option></select></label>
 <button disabled={busy||!enabled} className="rounded bg-black p-3 text-white disabled:opacity-50">{busy?'Importing…':'Create Royal Mail draft once'}</button></form>}
 {(locked||imported)&&<button disabled={busy||!canCheck} onClick={()=>void run('reconcile',{orderId})} className="mt-4 rounded border p-3 disabled:opacity-50">{busy?'Checking…':'Check existing import / update tracking'}</button>}
 {result&&<p className="mt-3 text-sm" role="status">{result}</p>}
 <p className="mt-3 text-xs">If an import times out, check the existing import. This control never automatically retries an order creation. Destinations requiring customs information are handled manually.</p></section>;
}
