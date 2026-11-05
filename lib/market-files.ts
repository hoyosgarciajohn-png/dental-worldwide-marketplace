import {createHash} from 'node:crypto';
export const MAX_FILE_BYTES=5*1024*1024;
export function inspectFictionalFile(p:Record<string,unknown>){
 if(Object.keys(p).some(k=>!['enquiry_id','name','mime','base64','key'].includes(k)))throw Error('invalid_request');
 const {name,mime,base64}=p;
 if(typeof name!=='string'||!/^FICTIONAL[ a-zA-Z0-9_.-]{1,90}\.(pdf|png|jpe?g)$/i.test(name))throw Error('fictional_file_required');
 if(typeof base64!=='string'||base64.length>Math.ceil(MAX_FILE_BYTES/3)*4||(base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)))throw Error('file_invalid');
 const bytes=Buffer.from(base64,'base64');if(bytes.toString('base64')!==base64)throw Error('file_invalid');if(!bytes.length||bytes.length>MAX_FILE_BYTES)throw Error('file_size');
 const pdf=bytes.subarray(0,5).toString()==='%PDF-',png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const actual=pdf?'application/pdf':png?'image/png':jpg?'image/jpeg':null;
 if(!actual||actual!==mime||!(pdf?/\.pdf$/i:png?/\.png$/i:/\.jpe?g$/i).test(name))throw Error('file_type');
 return {bytes,name,mime:actual,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
}
// Exercises quarantine behavior only; it is not a malware scanner.
export function simulatedScan(bytes:Buffer):'clean'|'rejected'|'error'{
 const s=bytes.toString();if(s.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE'))return 'rejected';
 if(s.includes('FICTIONAL_SCAN_TIMEOUT')||!s.includes('FICTIONAL'))return 'error';return 'clean';
}
