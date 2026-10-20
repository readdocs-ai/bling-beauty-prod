'use client';
import { useEffect,useState } from 'react';
export function PaymentResult({reference}:{reference:string}){
 const [message,setMessage]=useState('Checking payment status securely…');
 useEffect(()=>{
  if(!/^BLING-[0-9a-f-]{36}$/.test(reference)){setMessage('Payment status is not yet confirmed. Please check your email.');return;}
  let active=true;
  (async()=>{
   try{
    const response=await fetch(`/api/checkout/status?reference=${encodeURIComponent(reference)}`,{cache:'no-store'});
    const result=await response.json();
    if(!active)return;
    setMessage(result.status==='paid'?'Payment confirmed. Your order has been recorded.':result.status==='failed'?'Payment was not successful. No paid order was recorded.':'Payment is not yet confirmed. Please check your email or contact us before trying again.');
   }catch{if(active)setMessage('We could not confirm your payment yet. Please contact us before trying again.');}
  })();
  return()=>{active=false;};
 },[reference]);
 return <p role="status" className="mt-4 text-sm text-soft-black/70">{message}</p>;
}
