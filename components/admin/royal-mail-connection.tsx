'use client';
import {useState} from 'react';
export default function RoyalMailConnection(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function check(){if(busy)return;setBusy(true);try{const response=await fetch('/admin/api/royal-mail/connection',{method:'POST',cache:'no-store'});const data=await response.json();setMessage(response.ok?'Connected: the Royal Mail API accepted the key. No orders or labels were created.':data.error??'Connection failed');}catch{setMessage('Unable to verify connectivity.');}finally{setBusy(false);}}
 return <div className="mt-4"><button disabled={busy} onClick={()=>void check()} className="rounded border px-4 py-2 disabled:opacity-50">{busy?'Checking…':'Check Royal Mail connection (read-only)'}</button>{message&&<p role="status" className="mt-3 text-sm">{message}</p>}</div>;
}
