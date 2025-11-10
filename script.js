AOS.init({duration:800, once:true});

// Tabs
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc=>tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// LocalStorage für gebuchte Termine
let booked = JSON.parse(localStorage.getItem('booked')) || {};
const calendarEl = document.getElementById('calendar');
const timeEl = document.getElementById('timeSlots');
const today = new Date(); today.setHours(0,0,0,0);
let selectedDate = null;

// Kalender generieren
function generateCalendar(){
  calendarEl.innerHTML='';
  const start = new Date(today); start.setDate(start.getDate()+1);
  for(let i=0;i<14;i++){
    const day = new Date(start); day.setDate(start.getDate()+i);
    const dayEl = document.createElement('div');
    dayEl.className='day'; dayEl.textContent=day.getDate();
    dayEl.dataset.date=day.toISOString().split('T')[0];
    dayEl.addEventListener('click', ()=>{
      document.querySelectorAll('.day').forEach(d=>d.classList.remove('selected'));
      dayEl.classList.add('selected'); selectedDate=dayEl.dataset.date;
      generateTimeSlots(selectedDate);
    });
    calendarEl.appendChild(dayEl);
  }
}

// Uhrzeiten generieren
function generateTimeSlots(date){
  timeEl.innerHTML='';
  const dt = new Date(date); const dayOfWeek = dt.getDay();
  let startHour = (dayOfWeek>=1 && dayOfWeek<=5)?15:10;
  let endHour = (dayOfWeek>=1 && dayOfWeek<=5)?20:20;
  for(let h=startHour; h<=endHour; h++){
    const slot = document.createElement('div'); slot.className='time-slot';
    slot.textContent=h+":00"; slot.dataset.hour=h;
    if(booked[date] && booked[date].includes(h)) slot.classList.add('booked');
    slot.addEventListener('click', ()=>{
      if(slot.classList.contains('booked')) return;
      document.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('selected'));
      slot.classList.add('selected');
    });
    timeEl.appendChild(slot);
  }
}

generateCalendar();

// Form Submission + Telegram + LocalStorage
const BOT_TOKEN = "DEIN_BOT_TOKEN";
const CHAT_ID = "DEINE_CHAT_ID";
document.getElementById('terminForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const name=document.getElementById('name').value;
  const groesse=document.getElementById('groesse').value;
  const felge=document.getElementById('felge').value;
  const nachricht=document.getElementById('nachricht').value;
  const kontakt=document.getElementById('kontaktinfo').value;
  const timeSlot=document.querySelector('.time-slot.selected');
  if(!selectedDate || !timeSlot){ alert('Datum/Uhrzeit wählen'); return;}
  const datum=selectedDate; const stunde=parseInt(timeSlot.dataset.hour);

  const msg = `🛞 Neuer Termin:\n👤 ${name}\n📏 Reifengröße: ${groesse} Zoll\n⚙️ Felge: ${felge}\n📅 Datum: ${datum} ${stunde}:00\n💬 Nachricht: ${nachricht}\n📞 Kontakt: ${kontakt}`;

  try{
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({chat_id:CHAT_ID,text:msg,parse_mode:'Markdown'})
    });
    if(!booked[datum]) booked[datum]=[];
    booked[datum].push(stunde);
    localStorage.setItem('booked', JSON.stringify(booked));
    document.getElementById('feedback').textContent='Termin erfolgreich gesendet ✅';
    document.getElementById('terminForm').reset();
    generateTimeSlots(datum);
  }catch(err){
    document.getElementById('feedback').textContent='Fehler beim Senden ❌';
  }
});
