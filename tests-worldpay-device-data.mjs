import assert from 'node:assert/strict';
import { parseDeviceData } from './lib/worldpay/device-data.mjs';
import { classifyIntegrated3DS } from './lib/worldpay/three-ds-flow.mjs';
const jwt='abcdefghijklmnopqrstuvwxyz.0123456789.signature';
assert.equal(parseDeviceData({jwt,url:'https://secure.example.com/ddc'})?.jwt,jwt);
for (const url of ['http://secure.example.com/ddc','https://localhost/ddc','https://127.0.0.1/ddc','https://192.168.1.1/ddc','https://172.16.1.1/ddc','https://secure.example.com@localhost/ddc','https://secure.example.com/#x','https://service.internal/ddc'])
  assert.equal(parseDeviceData({jwt,url}),null,url);
assert.equal(parseDeviceData({jwt:'oops',url:'https://secure.example.com/ddc'}),null);
const action={method:'POST',href:'https://try.access.worldpay.com/api/payments/order/supply3dsDeviceData'};
const base={outcome:'3dsDeviceDataRequired',_actions:{supply3dsDeviceData:action},deviceDataCollection:{jwt,url:'https://secure.example.com/ddc'}};
assert.equal(classifyIntegrated3DS(base,202).step,'device_data');
assert.equal(classifyIntegrated3DS({...base,deviceDataCollection:{jwt,url:'https://localhost/ddc'}},202).step,'unknown');
console.log('Worldpay device data assertions passed');
