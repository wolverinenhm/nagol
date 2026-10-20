function tick(tasks,now=Date.now()) {
  const fired=[];
  for(const t of tasks) {if(!t.enabled||Date.parse(t.due)>now)continue;
    fired.push({...t});
    if(t.repeat) {const span=t.repeat*60000;t.due=new Date(Date.parse(t.due)+(Math.floor((now-Date.parse(t.due))/span)+1)*span).toISOString();}
    else t.enabled=false;
    t.lastRun=new Date(now).toISOString();
  }return fired;
}
function calendar(tasks) {
  const esc=s=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,'\\$&');
  const stamp=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nagol//EN'];
  for(const t of tasks)lines.push('BEGIN:VEVENT',`UID:${t.id}@nagol.local`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(t.due)}`,`SUMMARY:${esc(t.title)}`,...(t.repeat?[`RRULE:FREQ=MINUTELY;INTERVAL=${t.repeat}`]:[]),'END:VEVENT');
  lines.push('END:VCALENDAR');return lines.join('\r\n')+'\r\n';
}
module.exports={tick,calendar};
