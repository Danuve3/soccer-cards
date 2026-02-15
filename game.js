/* ============================================================
   SOCCER CARDS - LA LIGA 2025/26
   Game logic, AI, rendering, and state management
   ============================================================ */

// ==================== GAME STATE ====================
let G={
  phase:'menu',difficulty:'normal',
  deck:[],playerHand:[],cpuHand:[],discard:[],
  playerScore:0,cpuScore:0,
  playerBazas:0,cpuBazas:0,
  playerStreak:0,cpuStreak:0,
  bazaNum:0,
  playerFirst:true,
  playerPlay:[],cpuPlay:[],
  selected:new Set(),
  discardSelected:new Set(),
  discardNeeded:0,
  animating:false
};

// ==================== UTILS ====================
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function vibrate(p){try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
function $(s){return document.querySelector(s)}
function $$(s){return document.querySelectorAll(s)}

// ==================== DECK ====================
function generateDeck(){
  const cards=[];let id=0;
  TEAMS.forEach((team,ti)=>{
    team.p.forEach(([name,rating])=>{
      cards.push({id:id++,type:'player',team:ti,name,rating});
    });
    cards.push({id:id++,type:'shield',team:ti,name:'Escudo '+team.n,rating:0});
    cards.push({id:id++,type:'coach',team:ti,name:team.co,rating:0});
    cards.push({id:id++,type:'legend',team:ti,name:team.l[0],rating:99});
  });
  EVENT_TYPES.forEach(evt=>{
    for(let i=0;i<4;i++){
      cards.push({id:id++,type:'event_'+evt.t,team:null,name:evt.n,rating:null,desc:evt.d,icon:evt.i});
    }
  });
  return cards;
}

// ==================== CARD RENDERING ====================
function cardHTML(card,mini=false,faceDown=false){
  if(faceDown)return`<div class="card${mini?' card-mini':''}"><div class="card-inner"><div class="card-back">\u26BD</div></div></div>`;
  const t=TEAMS[card.team];
  const isEvent=card.type.startsWith('event_');
  const evtClass=isEvent?'type-event type-'+card.type:'type-'+card.type;
  const headerBg=isEvent?'':t?`background:linear-gradient(135deg,${t.c1},${t.c2})`:'';
  const headerStyle=headerBg?` style="${headerBg}"`:'';
  const code=t?t.c:'EVT';
  const icon=card.type==='player'?'\u26BD':card.type==='shield'?'\u{1F6E1}':card.type==='coach'?'\u{1F4CB}':card.type==='legend'?'\u2B50':card.icon||'\u{1F0CF}';
  const ratingDisplay=card.rating!=null&&card.rating>0?card.rating:'';
  const teamName=t?t.n:(card.desc||'');
  let badge='';
  if(card.type==='shield')badge='<span class="card-type-badge">x2</span>';
  else if(card.type==='coach')badge='<span class="card-type-badge">Mister</span>';
  else if(card.type==='legend')badge='<span class="card-type-badge">Leyenda</span>';
  return`<div class="card ${evtClass}${mini?' card-mini':''}" data-id="${card.id}">
<div class="card-inner">
<div class="card-front">
<div class="card-header"${headerStyle}>
<span class="card-team-code">${code}</span>
<span class="card-rating">${ratingDisplay}</span>
</div>
<div class="card-body">
<div class="card-icon">${icon}</div>
<div class="card-name">${card.name}</div>
<div class="card-team-name">${teamName}</div>
</div>
${badge}
</div>
</div>
</div>`;
}

// ==================== SCREENS ====================
function showScreen(name){
  $$('.screen').forEach(s=>{s.classList.remove('active');s.classList.add('hidden')});
  const el=$('#'+name);
  if(el){el.classList.remove('hidden');el.classList.add('active')}
  if(name==='menu')updateMenuState();
  if(name==='stats')updateStats();
}

function updateMenuState(){
  const saved=localStorage.getItem('sc_game');
  const btn=$('#btn-continue');
  if(saved)btn.classList.remove('btn-disabled');
  else btn.classList.add('btn-disabled');
}

// ==================== STATS ====================
function getStats(){
  try{return JSON.parse(localStorage.getItem('sc_stats'))||{wins:0,losses:0,bazas:0,bestStreak:0,played:0,maxPts:0}}
  catch(e){return{wins:0,losses:0,bazas:0,bestStreak:0,played:0,maxPts:0}}
}
function saveStats(s){localStorage.setItem('sc_stats',JSON.stringify(s))}
function updateStats(){
  const s=getStats();
  $('#stat-wins').textContent=s.wins;
  $('#stat-losses').textContent=s.losses;
  $('#stat-bazas').textContent=s.bazas;
  $('#stat-best').textContent=s.bestStreak;
  $('#stat-played').textContent=s.played;
  $('#stat-pts').textContent=s.maxPts;
}
function resetStats(){if(confirm('Borrar todas las estadisticas?')){saveStats({wins:0,losses:0,bazas:0,bestStreak:0,played:0,maxPts:0});updateStats()}}

// ==================== GAME START ====================
async function startGame(diff){
  G={
    phase:'playing',difficulty:diff,
    deck:shuffle(generateDeck()),
    playerHand:[],cpuHand:[],discard:[],
    playerScore:0,cpuScore:0,
    playerBazas:0,cpuBazas:0,
    playerStreak:0,cpuStreak:0,
    bazaNum:0,playerFirst:true,
    playerPlay:[],cpuPlay:[],
    selected:new Set(),discardSelected:new Set(),discardNeeded:0,
    animating:false
  };
  // Deal 7 each
  for(let i=0;i<7;i++){
    G.playerHand.push(G.deck.pop());
    G.cpuHand.push(G.deck.pop());
  }
  showScreen('game');
  renderGame();
  await wait(500);
  await coinToss();
  await nextBaza();
}

async function continueGame(){
  try{
    const saved=JSON.parse(localStorage.getItem('sc_game'));
    if(!saved)return;
    G=saved;
    G.selected=new Set();G.discardSelected=new Set();G.animating=false;
    showScreen('game');
    renderGame();
  }catch(e){console.error(e)}
}

function saveGame(){
  const save={...G,selected:undefined,discardSelected:undefined};
  localStorage.setItem('sc_game',JSON.stringify(save));
}

// ==================== COIN TOSS ====================
async function coinToss(){
  const overlay=$('#coin-overlay');
  const coin=$('#coin-face');
  const text=$('#coin-text');
  const sub=$('#coin-sub');
  G.playerFirst=Math.random()>0.5;
  overlay.classList.add('show');
  coin.textContent='?';
  text.textContent='Lanzando moneda...';
  sub.textContent='';
  coin.classList.add('spinning');
  await wait(2200);
  coin.classList.remove('spinning');
  coin.textContent=G.playerFirst?'\u{1F44A}':'\u{1F916}';
  text.textContent=G.playerFirst?'Tu empiezas!':'Empieza la CPU';
  sub.textContent='Toca para continuar';
  await new Promise(r=>{overlay.onclick=()=>{overlay.classList.remove('show');overlay.onclick=null;r()}});
}

// ==================== GAME FLOW ====================
async function nextBaza(){
  G.bazaNum++;
  G.playerPlay=[];G.cpuPlay=[];
  G.selected=new Set();
  G.turnIndicator=G.playerFirst?'player':'cpu';
  clearPlayZone();
  renderGame();
  if(!G.playerFirst){
    G.animating=true;
    await wait(800);
    cpuTurn();
    renderCpuPlay();
    renderRivalHand();
    await wait(600);
    G.animating=false;
    G.turnIndicator='player';
    renderScoreboard();
    renderHand();
  }
}

function clearPlayZone(){
  $('#pzc-player').innerHTML='';
  $('#pzc-cpu').innerHTML='';
  const r=$('#play-result');r.classList.remove('show','win','lose','draw');r.textContent='';
}

// ==================== PLAYER ACTIONS ====================
function toggleSelect(cardId){
  if(G.animating||G.phase!=='playing')return;
  if(G.playerPlay.length>0)return;
  if(G.selected.has(cardId)){
    G.selected.delete(cardId);
  }else{
    const playable=getPlayableIds();
    if(playable&&!playable.has(cardId)){
      G.selected=new Set([cardId]);
    }else{
      G.selected.add(cardId);
    }
  }
  updatePlayButton();
  renderHand();
}

function updatePlayButton(){
  const btn=$('#btn-play');
  if(G.selected.size>0&&validateSelection()){
    btn.classList.remove('btn-disabled');
  }else{
    btn.classList.add('btn-disabled');
  }
}

function validateSelection(){
  const cards=[...G.selected].map(id=>G.playerHand.find(c=>c.id===id)).filter(Boolean);
  if(cards.length===0)return false;
  const nonEvent=cards.filter(c=>!c.type.startsWith('event_'));
  const events=cards.filter(c=>c.type.startsWith('event_'));
  if(nonEvent.length===0&&events.length>0)return true; // Event-only play
  if(nonEvent.length===0)return false;
  // Check all non-event cards are from the same team
  const team=nonEvent[0].team;
  if(!nonEvent.every(c=>c.team===team))return false;
  // Shield/coach only with player/legend
  const players=nonEvent.filter(c=>c.type==='player'||c.type==='legend');
  const shields=nonEvent.filter(c=>c.type==='shield');
  const coaches=nonEvent.filter(c=>c.type==='coach');
  if((shields.length>0||coaches.length>0)&&players.length===0)return false;
  return true;
}

async function playSelected(){
  if(G.animating||G.selected.size===0||!validateSelection())return;
  G.animating=true;
  G.turnIndicator=null;
  renderScoreboard();
  vibrate(50);
  const playCards=[...G.selected].map(id=>G.playerHand.find(c=>c.id===id)).filter(Boolean);
  G.playerPlay=playCards;
  G.playerHand=G.playerHand.filter(c=>!G.selected.has(c.id));
  G.selected=new Set();
  await handlePreEvents(playCards,'player');
  renderPlayerPlay();
  renderHand();
  if(G.cpuPlay.length===0){
    G.turnIndicator='cpu';
    renderScoreboard();
    await wait(800);
    cpuTurn();
    renderCpuPlay();
    renderRivalHand();
    await wait(600);
  }
  await resolveBaza();
  G.animating=false;
}

// ==================== CPU AI ====================
function cpuTurn(){
  const hand=G.cpuHand;
  if(hand.length===0)return;
  const diff=G.difficulty;
  let play=[];
  // Group by team
  const groups={};
  hand.forEach(c=>{
    if(c.team!=null){
      if(!groups[c.team])groups[c.team]=[];
      groups[c.team].push(c);
    }
  });
  const events=hand.filter(c=>c.type.startsWith('event_'));

  if(diff==='easy'){
    // Play single random non-shield/coach card
    const playable=hand.filter(c=>c.type==='player'||c.type==='legend');
    if(playable.length>0){
      play=[playable[Math.floor(Math.random()*playable.length)]];
    }else{
      play=[hand[0]];
    }
  }else if(diff==='normal'){
    // Try combo of 2+ same-team players
    let bestCombo=null,bestVal=0;
    for(const[ti,cards] of Object.entries(groups)){
      const pl=cards.filter(c=>c.type==='player'||c.type==='legend');
      if(pl.length>=2){
        const val=pl.reduce((s,c)=>s+c.rating,0);
        const shield=cards.find(c=>c.type==='shield');
        const total=shield?val*2:val;
        if(total>bestVal){bestVal=total;bestCombo=[...pl];if(shield)bestCombo.push(shield)}
      }
    }
    if(bestCombo){play=bestCombo}
    else{
      const ranked=hand.filter(c=>c.rating>0).sort((a,b)=>b.rating-a.rating);
      play=ranked.length>0?[ranked[0]]:[hand[0]];
    }
    // Maybe add a yellow/red event
    if(Math.random()>0.5){
      const ev=events.find(c=>c.type==='event_yellow'||c.type==='event_red');
      if(ev)play.push(ev);
    }
  }else{
    // Hard: maximize score, consider opponent
    let bestPlay=null,bestScore=0;
    for(const[ti,cards] of Object.entries(groups)){
      const pl=cards.filter(c=>c.type==='player'||c.type==='legend');
      const shield=cards.find(c=>c.type==='shield');
      const coach=cards.find(c=>c.type==='coach');
      for(let sz=Math.min(pl.length,4);sz>=1;sz--){
        const sorted=pl.sort((a,b)=>b.rating-a.rating);
        const combo=sorted.slice(0,sz);
        let val=combo.reduce((s,c)=>s+c.rating,0);
        const thisPlay=[...combo];
        if(shield&&combo.length>=2){val*=2;thisPlay.push(shield)}
        if(coach){thisPlay.push(coach)}
        if(val>bestScore){bestScore=val;bestPlay=thisPlay}
      }
    }
    // Consider single high card
    const singles=hand.filter(c=>c.rating>0).sort((a,b)=>b.rating-a.rating);
    if(singles.length>0&&singles[0].rating>bestScore){
      bestScore=singles[0].rating;bestPlay=[singles[0]];
    }
    play=bestPlay||[hand[0]];
    // Add scoring events
    const yellow=events.find(c=>c.type==='event_yellow');
    const red=events.find(c=>c.type==='event_red');
    const talk=events.find(c=>c.type==='event_talk');
    if(red&&!play.includes(red))play.push(red);
    else if(yellow&&!play.includes(yellow))play.push(yellow);
    if(talk&&play.filter(c=>c.type==='player'||c.type==='legend').length>=2&&!play.includes(talk))play.push(talk);
  }
  G.cpuPlay=play;
  G.cpuHand=G.cpuHand.filter(c=>!play.some(p=>p.id===c.id));
}

// ==================== EVENTS ====================
async function handlePreEvents(cards,who){
  const swapEvt=cards.find(c=>c.type==='event_swap');
  const stealEvt=cards.find(c=>c.type==='event_steal');
  if(swapEvt){
    await showEventMsg('\u{1F504} Cambio de campo!','Se intercambian las manos');
    const temp=G.playerHand;G.playerHand=G.cpuHand;G.cpuHand=temp;
    renderGame();
  }
  if(stealEvt){
    const target=who==='player'?G.cpuHand:G.playerHand;
    const receiver=who==='player'?G.playerHand:G.cpuHand;
    if(target.length>0){
      const idx=Math.floor(Math.random()*target.length);
      const stolen=target.splice(idx,1)[0];
      receiver.push(stolen);
      await showEventMsg('\u{1F590} Robo de balon!',`Se roba: ${stolen.name}`);
      renderGame();
    }
  }
}

async function showEventMsg(text,sub){
  const o=$('#event-overlay');
  const t=$('#event-text');
  const s=$('#event-sub');
  t.textContent=text;s.textContent=sub;
  o.classList.add('show');
  vibrate([80,40,80]);
  await wait(1500);
  o.classList.remove('show');
  await wait(300);
}

// ==================== BAZA RESOLUTION ====================
async function resolveBaza(){
  let pScore=calcScore(G.playerPlay);
  let cScore=calcScore(G.cpuPlay);
  // Apply coach power (eliminate best rival card)
  const pCoach=G.playerPlay.find(c=>c.type==='coach');
  const cCoach=G.cpuPlay.find(c=>c.type==='coach');
  if(pCoach){
    const rivalPlayers=G.cpuPlay.filter(c=>c.type==='player'||c.type==='legend').sort((a,b)=>b.rating-a.rating);
    if(rivalPlayers.length>0){
      cScore-=rivalPlayers[0].rating;
      await showEventMsg('\u{1F4CB} Entrenador!',`Elimina a ${rivalPlayers[0].name} (${rivalPlayers[0].rating}pts)`);
    }
  }
  if(cCoach){
    const rivalPlayers=G.playerPlay.filter(c=>c.type==='player'||c.type==='legend').sort((a,b)=>b.rating-a.rating);
    if(rivalPlayers.length>0){
      pScore-=rivalPlayers[0].rating;
      await showEventMsg('\u{1F4CB} Entrenador rival!',`Elimina a ${rivalPlayers[0].name} (${rivalPlayers[0].rating}pts)`);
    }
  }
  // Apply events that affect rival
  const pEvents=G.playerPlay.filter(c=>c.type.startsWith('event_'));
  const cEvents=G.cpuPlay.filter(c=>c.type.startsWith('event_'));
  pEvents.forEach(e=>{
    if(e.type==='event_yellow')cScore=Math.max(0,cScore-5);
    if(e.type==='event_red')cScore=Math.floor(cScore/2);
    if(e.type==='event_talk')pScore+=G.playerPlay.filter(c=>c.type==='player'||c.type==='legend').length;
  });
  cEvents.forEach(e=>{
    if(e.type==='event_yellow')pScore=Math.max(0,pScore-5);
    if(e.type==='event_red')pScore=Math.floor(pScore/2);
    if(e.type==='event_talk')cScore+=G.cpuPlay.filter(c=>c.type==='player'||c.type==='legend').length;
  });
  pScore=Math.max(0,pScore);cScore=Math.max(0,cScore);
  // Determine winner
  const result=pScore>cScore?'win':pScore<cScore?'lose':'draw';
  const r=$('#play-result');
  if(result==='win'){
    pScore+=1; // Bonus
    G.playerBazas++;G.playerStreak++;G.cpuStreak=0;
    r.textContent=`GANAS! ${pScore}-${cScore}`;r.className='play-result win';
    vibrate([100,50,100]);
  }else if(result==='lose'){
    cScore+=1;
    G.cpuBazas++;G.cpuStreak++;G.playerStreak=0;
    r.textContent=`PIERDES ${pScore}-${cScore}`;r.className='play-result lose';
    vibrate(200);
  }else{
    r.textContent=`EMPATE ${pScore}-${cScore}`;r.className='play-result draw';
  }
  r.classList.add('show');
  G.playerScore+=pScore;G.cpuScore+=cScore;
  // Discard played cards
  G.discard.push(...G.playerPlay,...G.cpuPlay);
  // Alternate who goes first each round
  G.playerFirst=!G.playerFirst;
  renderScoreboard();
  await wait(2000);
  r.classList.remove('show');
  // Check win conditions
  const winner=checkWin();
  if(winner){
    endGame(winner);return;
  }
  // Draw phase
  await drawPhase();
  saveGame();
  await nextBaza();
}

function calcScore(cards){
  const players=cards.filter(c=>c.type==='player'||c.type==='legend');
  const hasShield=cards.some(c=>c.type==='shield');
  let score=players.reduce((s,c)=>s+(c.rating||0),0);
  if(hasShield&&players.length>0)score*=2;
  return score;
}

function checkWin(){
  if(G.playerScore>=1000)return'player';
  if(G.cpuScore>=1000)return'cpu';
  if(G.playerBazas>=10)return'player';
  if(G.cpuBazas>=10)return'cpu';
  if(G.playerStreak>=7)return'player';
  if(G.cpuStreak>=7)return'cpu';
  // Check if both hands empty and deck empty
  if(G.deck.length===0&&G.playerHand.length===0&&G.cpuHand.length===0)
    return G.playerScore>G.cpuScore?'player':G.cpuScore>G.playerScore?'cpu':'draw';
  return null;
}

// ==================== DRAW PHASE ====================
async function drawPhase(){
  const before=new Set(G.playerHand.map(c=>c.id));
  while(G.playerHand.length<7&&G.deck.length>0)G.playerHand.push(G.deck.pop());
  while(G.cpuHand.length<7&&G.deck.length>0)G.cpuHand.push(G.deck.pop());
  G.newCardIds=new Set(G.playerHand.filter(c=>!before.has(c.id)).map(c=>c.id));
  renderGame();
  G.newCardIds=null;
  // Check if player needs to discard
  if(G.playerHand.length>7){
    await playerDiscard(G.playerHand.length-7);
  }
  // CPU auto-discards lowest
  while(G.cpuHand.length>7){
    const worst=G.cpuHand.reduce((min,c,i)=>(!min||((c.rating||0)<(min.c.rating||0))?{c,i}:min),null);
    if(worst)G.cpuHand.splice(worst.i,1);
    else G.cpuHand.pop();
  }
}

function playerDiscard(count){
  return new Promise(resolve=>{
    G.discardNeeded=count;G.discardSelected=new Set();
    const overlay=$('#discard-overlay');
    const hand=$('#discard-hand');
    $('#discard-count').textContent=count;
    hand.innerHTML=G.playerHand.map(c=>{
      const html=cardHTML(c,false);
      return html.replace('data-id=','onclick="toggleDiscard('+c.id+')" data-id=');
    }).join('');
    overlay.classList.add('show');
    const checkBtn=()=>{
      const btn=$('#btn-discard');
      if(G.discardSelected.size===count)btn.classList.remove('btn-disabled');
      else btn.classList.add('btn-disabled');
    };
    window._discardResolve=resolve;
    window._discardCheck=checkBtn;
    checkBtn();
  });
}

function toggleDiscard(id){
  if(G.discardSelected.has(id))G.discardSelected.delete(id);
  else if(G.discardSelected.size<G.discardNeeded)G.discardSelected.add(id);
  // Update visual
  $$('#discard-hand .card').forEach(el=>{
    const cid=parseInt(el.dataset.id);
    if(G.discardSelected.has(cid))el.classList.add('selected');
    else el.classList.remove('selected');
  });
  if(window._discardCheck)window._discardCheck();
}

function confirmDiscard(){
  if(G.discardSelected.size!==G.discardNeeded)return;
  G.playerHand=G.playerHand.filter(c=>!G.discardSelected.has(c.id));
  G.discardSelected=new Set();
  $('#discard-overlay').classList.remove('show');
  renderGame();
  if(window._discardResolve){window._discardResolve();window._discardResolve=null}
}

// ==================== END GAME ====================
function endGame(winner){
  G.phase='ended';
  localStorage.removeItem('sc_game');
  const stats=getStats();
  stats.played++;
  if(winner==='player'){stats.wins++;stats.bazas+=G.playerBazas;stats.bestStreak=Math.max(stats.bestStreak,G.playerStreak);stats.maxPts=Math.max(stats.maxPts,G.playerScore)}
  else if(winner==='cpu'){stats.losses++;stats.bazas+=G.playerBazas}
  saveStats(stats);
  const title=$('#end-title');
  if(winner==='player'){title.textContent='VICTORIA!';title.className='end-result victory';spawnConfetti()}
  else if(winner==='cpu'){title.textContent='DERROTA';title.className='end-result defeat'}
  else{title.textContent='EMPATE';title.className='end-result defeat'}
  const statsDiv=$('#end-stats');
  const reason=G.playerScore>=1000||G.cpuScore>=1000?'1000 puntos':G.playerBazas>=10||G.cpuBazas>=10?'10 bazas':G.playerStreak>=7||G.cpuStreak>=7?'7 bazas seguidas':'Fin del mazo';
  statsDiv.innerHTML=`
    <div class="end-stat"><span>Tu puntuacion</span><span>${G.playerScore}</span></div>
    <div class="end-stat"><span>CPU puntuacion</span><span>${G.cpuScore}</span></div>
    <div class="end-stat"><span>Bazas ganadas</span><span>${G.playerBazas}</span></div>
    <div class="end-stat"><span>Bazas CPU</span><span>${G.cpuBazas}</span></div>
    <div class="end-stat"><span>Mejor racha</span><span>${Math.max(G.playerStreak,stats.bestStreak)}</span></div>
    <div class="end-stat"><span>Bazas totales</span><span>${G.bazaNum}</span></div>
    <div class="end-stat"><span>Victoria por</span><span>${reason}</span></div>
  `;
  showScreen('endgame');
  vibrate(winner==='player'?[200,100,200,100,200]:200);
}

function spawnConfetti(){
  const colors=['#D4AF37','#E63946','#2ECC71','#3498DB','#9B59B6','#F39C12'];
  for(let i=0;i<40;i++){
    const p=document.createElement('div');
    p.className='confetti-particle';
    p.style.left=Math.random()*100+'vw';
    p.style.background=colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDelay=Math.random()*2+'s';
    p.style.animationDuration=(2+Math.random()*2)+'s';
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),5000);
  }
}

// ==================== RENDERING ====================
function renderGame(){
  renderRivalHand();
  renderHand();
  renderScoreboard();
}

function renderRivalHand(){
  const el=$('#rival-hand');
  el.innerHTML=G.cpuHand.map(()=>'<div class="rival-card-back">\u26BD</div>').join('');
}

function getPlayableIds(){
  if(G.selected.size===0)return null;
  const sel=[...G.selected].map(id=>G.playerHand.find(c=>c.id===id)).filter(Boolean);
  const nonEvent=sel.filter(c=>!c.type.startsWith('event_'));
  const ids=new Set();
  if(nonEvent.length===0){
    G.playerHand.forEach(c=>ids.add(c.id));
  }else{
    const team=nonEvent[0].team;
    G.playerHand.forEach(c=>{
      if(c.type.startsWith('event_')||c.team===team)ids.add(c.id);
    });
  }
  return ids;
}

function renderHand(){
  const el=$('#player-hand');
  const playable=getPlayableIds();
  el.innerHTML=G.playerHand.map((c,i)=>{
    const html=cardHTML(c);
    const sel=G.selected.has(c.id)?' selected':'';
    let extra='';
    if(!sel&&playable&&playable.has(c.id)){extra=' playable'}
    const isNew=G.newCardIds&&G.newCardIds.has(c.id);
    if(isNew)extra+=' card-draw-anim';
    const delay=isNew?` style="animation-delay:${i*0.08}s"`:'';
    return html.replace('class="card ','class="card'+sel+extra+' ').replace('data-id=',`onclick="toggleSelect(${c.id})"${delay} data-id=`);
  }).join('');
  updatePlayButton();
}

function renderPlayerPlay(){
  const el=$('#pzc-player');
  el.innerHTML=G.playerPlay.map((c,i)=>{
    let html=cardHTML(c,true);
    return html.replace('class="card ','class="card card-play-anim ').replace('data-id=',`style="animation-delay:${i*0.1}s" data-id=`);
  }).join('');
}

function renderCpuPlay(){
  const el=$('#pzc-cpu');
  el.innerHTML=G.cpuPlay.map((c,i)=>{
    let html=cardHTML(c,true);
    return html.replace('class="card ','class="card card-play-anim ').replace('data-id=',`style="animation-delay:${i*0.1+0.15}s" data-id=`);
  }).join('');
}

function animateScore(el,target){
  const start=parseInt(el.textContent)||0;
  if(target===start)return;
  el.classList.remove('score-bump');
  void el.offsetWidth;
  el.classList.add('score-bump');
  const diff=target-start;
  const duration=400;
  const t0=performance.now();
  function tick(now){
    const p=Math.min((now-t0)/duration,1);
    const e=1-Math.pow(1-p,3);
    el.textContent=Math.round(start+diff*e);
    if(p<1)requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderScoreboard(){
  animateScore($('#sc-player'),G.playerScore);
  animateScore($('#sc-cpu'),G.cpuScore);
  $('#sc-bazas').textContent=`Baza ${G.bazaNum} \u00B7 ${G.playerBazas}-${G.cpuBazas}`;
  const streak=G.playerStreak>1?`Racha: ${G.playerStreak}`:G.cpuStreak>1?`Racha CPU: ${G.cpuStreak}`:'';
  $('#sc-streak').textContent=streak;
  $('#sc-deck').textContent=`Mazo: ${G.deck.length}`;
  const turnEl=$('#sc-turn');
  if(G.turnIndicator==='player'){turnEl.textContent='TU TURNO';turnEl.className='turn-indicator turn-player'}
  else if(G.turnIndicator==='cpu'){turnEl.textContent='TURNO CPU';turnEl.className='turn-indicator turn-cpu'}
  else{turnEl.textContent='';turnEl.className='turn-indicator'}
}

// ==================== GAME MENU ====================
function showGameMenu(){$('#game-menu-overlay').classList.add('show')}
function hideGameMenu(){$('#game-menu-overlay').classList.remove('show')}
function saveAndQuit(){saveGame();hideGameMenu();showScreen('menu')}

// ==================== INIT ====================
function init(){
  updateMenuState();
  // Register service worker
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(e=>console.log('SW error:',e));
  }
}
document.addEventListener('DOMContentLoaded',init);
