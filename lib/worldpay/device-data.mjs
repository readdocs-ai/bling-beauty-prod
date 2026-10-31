/** Device-data form parameters must originate from a verified Worldpay response. */
export function parseDeviceData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { jwt, url, bin } = value;
  if (typeof jwt !== 'string' || jwt.length < 16 || jwt.length > 16000 || !/^[A-Za-z0-9._-]+$/.test(jwt)) return null;
  if (typeof url !== 'string' || url.length < 1 || url.length > 2048) return null;
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash || parsed.port ||
      parsed.hostname === 'localhost' || !parsed.hostname.includes('.') ||
      /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname) ||
      parsed.hostname.endsWith('.localhost') || parsed.hostname.endsWith('.local') ||
      parsed.hostname.endsWith('.internal')) return null;
  if (typeof bin !== 'string' || !/^[0-9]{6,8}$/.test(bin)) return null;
  return { url: parsed.href, jwt, bin };
}

/** Worldpay's documented Cardinal origins are isolated by payment environment. */
export function deviceDataOrigin(environment='try'){
 if(environment==='live')return 'https://centinelapi.cardinalcommerce.com';
 if(environment==='try')return 'https://centinelapistag.cardinalcommerce.com';
 throw Error('Invalid payment environment');
}
export function parseEnvironmentDeviceData(value,environment='try'){
 const parsed=parseDeviceData(value);
 return parsed&&new URL(parsed.url).origin===deviceDataOrigin(environment)?parsed:null;
}
export function deviceDataCompletion(data,origin,environment,expectedFrame){
 if(!expectedFrame||origin!==deviceDataOrigin(environment))return null;
 if(typeof data==='string'){try{data=JSON.parse(data);}catch{return null;}}
 if(!data||typeof data!=='object'||data.MessageType!=='profile.completed'||data.Status!==true||typeof data.SessionId!=='string'||!/^[A-Za-z0-9_-]{8,200}$/.test(data.SessionId))return null;
 return data.SessionId;
}
