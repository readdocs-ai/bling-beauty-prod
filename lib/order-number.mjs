/** Public display only. Never use this number as payment evidence or authentication. */
export function customerOrderNumber(order){
 const value=order?.order_number;
 const number=typeof value==='string'&&/^[1-9][0-9]*$/.test(value)?Number(value):value;
 return Number.isSafeInteger(number)&&number>=100001?`BLING-${number}`:order?.reference??'';
}
