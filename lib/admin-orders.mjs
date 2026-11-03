/** Adapt existing Stripe rows and verified Worldpay rows without copying or altering either. */
export function normaliseAdminOrder(row,source='orders'){
 if(source==='worldpay')return {...row,order_number:row.reference,customer_name:row.customer?.name,
  customer_email:row.customer?.email,customer_phone:row.customer?.phone,shipping_name:row.customer?.name,
  shipping_address:row.shipping,total_gbp:row.amount_pence/100,payment_status:'paid',payment_provider:'worldpay',
  payment_verified_at:row.verified_at,fulfilment_status:row.royal_mail_order_id?'shipping_prepared':'awaiting_dispatch',
  items:row.items,test_order:row.payment_environment!=='live',source:'worldpay'};
 return {...row,source:'orders',order_number:row.order_number??row.id,customer_name:row.customer_name??row.shipping_name,
  total_gbp:row.total_gbp??row.total_amount_gbp??(Number.isSafeInteger(row.amount_total)?row.amount_total/100:undefined),
  payment_status:row.payment_status??row.status,items:row.items??row.order_items};
}
export function mergeAdminOrders(legacy,verified){
 const paymentIds=new Set(verified.map(x=>x.provider_payment_id).filter(Boolean));
 return [...legacy.filter(x=>!(x.payment_provider==='worldpay'&&paymentIds.has(x.provider_payment_id))).map(x=>normaliseAdminOrder(x)),
  ...verified.map(x=>normaliseAdminOrder(x,'worldpay'))].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,500);
}
