/** Calendar fields are not instants. Old demo handoffs encoded their date at UTC midnight. */
export function formatCalendarDate(value:string,locale:string):string{
 const day=value.slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return '—';
 const date=new Date(`${day}T00:00:00Z`);
 if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==day)return '—';
 return new Intl.DateTimeFormat(locale,{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'}).format(date);
}
/** Timed records retain their instant; date displays use the practice's Cali timezone. */
export function formatCaliDate(value:string,locale:string):string{
 const date=new Date(value);
 if(!Number.isFinite(+date))return '—';
 return new Intl.DateTimeFormat(locale,{year:'numeric',month:'numeric',day:'numeric',timeZone:'America/Bogota'}).format(date);
}
