/** The issuer form is an untrusted completion signal, never authentication or payment proof.
 * Ignore additional provider fields. Do not log their contents or decode authentication tokens.
 */
export async function readIssuerReturn(request) {
  const limit = 32768;
  const type = request.headers.get('content-type') ?? '';
  const diagnostic = { format: type.startsWith('application/x-www-form-urlencoded') ? 'urlencoded' :
    type.startsWith('multipart/form-data') ? 'multipart' : 'other' };
  const fail = (reason, status=400) => ({ok:false,reason,status,diagnostic});
  if (diagnostic.format === 'other') return fail('unsupported_format',415);
  if (Number(request.headers.get('content-length')) > limit) return fail('body_too_large',413);
  const reader = request.body?.getReader();
  if (!reader) return fail('empty_body');
  const chunks=[]; let total=0;
  try {
    for (;;) {
      const {value,done}=await reader.read();
      if (done) break;
      total+=value.byteLength;
      if(total>limit){await reader.cancel();return fail('body_too_large',413);}
      chunks.push(value);
    }
  } catch { return fail('unreadable_body'); }
  diagnostic.bytes=total;
  const bytes=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let form;
  try{form=await new Response(bytes,{headers:{'content-type':type}}).formData();}
  catch{return fail('invalid_form');}
  // Log known field NAMES only; arbitrary attacker-controlled keys are not echoed.
  diagnostic.knownFields=['TransactionId','MD','Response','JWT'].filter(key=>form.has(key));
  diagnostic.fieldCount=[...form.keys()].length;
  const ids=form.getAll('TransactionId');
  if(ids.length!==1)return fail(ids.length ? 'duplicate_transaction_id':'missing_transaction_id');
  const id=ids[0];
  diagnostic.transactionIdLength=typeof id==='string' ? id.length : null;
  if(typeof id!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(id))return fail('invalid_transaction_id');
  return {ok:true,id,diagnostic};
}
