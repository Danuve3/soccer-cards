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
  animating:false,
  // New mechanics
  playerBet:1,cpuBet:1,
  playerFormation:null,cpuFormation:null,
  epicMode:null, // {who:'player'|'cpu', remaining:3}
  cpuPersonality:null,
  // Match format
  period:'first_half', // first_half, second_half, extra_time, penalties
  penaltyRound:0,penaltyPlayer:0,penaltyCpu:0
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
<span class="card-rating">${ratingDisplay}</span>
<span class="card-team-code">${code}</span>
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
    animating:false,
    playerBet:1,cpuBet:1,
    playerFormation:null,cpuFormation:null,
    epicMode:null,cpuPersonality:null,
    period:'first_half',penaltyRound:0,penaltyPlayer:0,penaltyCpu:0
  };
  // Pick CPU personality first (needed for formation choice)
  G.cpuPersonality=pickCpuPersonality(diff);
  showScreen('game');
  renderGame();
  // Formation selection
  await showFormationOverlay();
  G.cpuFormation=cpuPickFormation();
  const pInfo=CPU_PERSONALITIES[G.cpuPersonality];
  await showEventMsg(`\u{1F3DF}\uFE0F Formacion: ${G.playerFormation.name}`,G.playerFormation.desc);
  await showEventMsg(`\u{1F916} CPU: ${G.cpuFormation.name}`,`${pInfo.icon} ${pInfo.name} - ${pInfo.desc}`);
  // Deal cards (4-4-2 gets 7)
  const playerCards=G.playerFormation.id==='442'?7:6;
  const cpuCards=G.cpuFormation.id==='442'?7:6;
  for(let i=0;i<Math.max(playerCards,cpuCards);i++){
    if(i<playerCards&&G.deck.length>0)G.playerHand.push(G.deck.pop());
    if(i<cpuCards&&G.deck.length>0)G.cpuHand.push(G.deck.pop());
  }
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
    G.epicMode=G.epicMode||null;
    G.playerFormation=G.playerFormation||null;
    G.cpuFormation=G.cpuFormation||null;
    G.cpuPersonality=G.cpuPersonality||null;
    G.playerBet=G.playerBet||1;G.cpuBet=G.cpuBet||1;
    G.period=G.period||'first_half';
    G.penaltyRound=G.penaltyRound||0;G.penaltyPlayer=G.penaltyPlayer||0;G.penaltyCpu=G.penaltyCpu||0;
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
  G.playerBet=1;G.cpuBet=1;
  clearPlayZone();
  renderGame();
  // Check epic mode
  checkEpicMode();
  // Formation 3-5-2: peek at one rival card
  if(G.playerFormation&&G.playerFormation.id==='352'&&G.cpuHand.length>0){
    const peekCard=G.cpuHand[Math.floor(Math.random()*G.cpuHand.length)];
    await showEventMsg('\u{1F441}\uFE0F Espionaje!',`Rival tiene: ${peekCard.name}${peekCard.rating?' ('+peekCard.rating+')':''}`);
  }
  // Bet phase
  if(G.period==='extra_time'){
    // Extra time: forced minimum 2x
    G.cpuBet=Math.max(2,cpuBet());
    await showBetOverlay(2);
  }else{
    G.cpuBet=cpuBet();
    await showBetOverlay();
  }
  renderScoreboard();
  G.turnIndicator=G.playerFirst?'player':'cpu';
  renderScoreboard();
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

// === FORMATIONS ===
const FORMATIONS=[
  {id:'433',name:'4-3-3',label:'Ataque',desc:'+15% puntuacion en combos de 3+ jugadores',icon:'\u2694\uFE0F',color:'var(--red)'},
  {id:'442',name:'4-4-2',label:'Equilibrio',desc:'Empiezas con 7 cartas en vez de 6',icon:'\u2696\uFE0F',color:'var(--gold)'},
  {id:'541',name:'5-4-1',label:'Defensa',desc:'Eventos rivales tienen 50% menos efecto',icon:'\u{1F6E1}\uFE0F',color:'var(--blue)'},
  {id:'352',name:'3-5-2',label:'Control',desc:'Ves 1 carta de la mano rival cada baza',icon:'\u{1F441}\uFE0F',color:'var(--purple)'}
];

function showFormationOverlay(){
  return new Promise(resolve=>{
    const o=$('#formation-overlay');
    o.classList.add('show');
    $$('.formation-card').forEach(card=>{
      card.onclick=()=>{
        const fid=card.dataset.formation;
        const formation=FORMATIONS.find(f=>f.id===fid);
        G.playerFormation=formation;
        o.classList.remove('show');
        resolve(formation);
      };
    });
  });
}

function cpuPickFormation(){
  const diff=G.difficulty;
  if(diff==='easy')return FORMATIONS[1]; // Balanced
  if(diff==='normal')return FORMATIONS[Math.floor(Math.random()*FORMATIONS.length)];
  // Hard: pick based on personality
  const p=G.cpuPersonality;
  if(p==='aggressive')return FORMATIONS[0]; // 4-3-3
  if(p==='conservative')return FORMATIONS[2]; // 5-4-1
  if(p==='tactical')return FORMATIONS[3]; // 3-5-2
  return FORMATIONS[0]; // Default: attack
}

function applyFormationToScore(score,cards,formation){
  if(!formation)return score;
  if(formation.id==='433'){
    const players=cards.filter(c=>c.type==='player'||c.type==='legend');
    if(players.length>=3)score=Math.round(score*1.15);
  }
  return score;
}

function getFormationEventReduction(formation){
  if(!formation)return 1;
  if(formation.id==='541')return 0.5;
  return 1;
}

// === CPU PERSONALITIES ===
const CPU_PERSONALITIES={
  conservative:{name:'El Conservador',desc:'Acumula cartas buenas, juega sueltas al inicio',icon:'\u{1F9D0}'},
  aggressive:{name:'El Agresivo',desc:'Siempre juega el combo mas grande posible',icon:'\u{1F525}'},
  trickster:{name:'El Tramposo',desc:'Prioriza eventos y cartas especiales',icon:'\u{1F3AD}'},
  tactical:{name:'El Tactico',desc:'Analiza y se adapta a tu estilo',icon:'\u{1F9E0}'}
};

function pickCpuPersonality(diff){
  if(diff==='easy')return 'conservative';
  if(diff==='normal'){
    const opts=['conservative','aggressive','trickster','tactical'];
    return opts[Math.floor(Math.random()*opts.length)];
  }
  // Hard: weighted towards tactical and aggressive
  const r=Math.random();
  if(r<0.35)return 'tactical';
  if(r<0.65)return 'aggressive';
  if(r<0.85)return 'trickster';
  return 'conservative';
}

// === TEAM ABILITIES ===
async function applyTeamAbility(abilityInfo,who,myCards,rivalCards,myScore,rivalScore){
  const a=abilityInfo.ability;
  const tName=abilityInfo.teamName;
  const label=who==='player'?'':'CPU: ';
  await showEventMsg(`\u{26A1} ${label}${a.name}!`,`${tName}: ${a.desc}`);
  const players=myCards.filter(c=>c.type==='player'||c.type==='legend');
  const events=myCards.filter(c=>c.type.startsWith('event_'));
  switch(a.effect){
    case 'bonus': myScore+=a.value;break;
    case 'draw':
      if(G.deck.length>0){
        const drawn=G.deck.pop();
        if(who==='player')G.playerHand.push(drawn);else G.cpuHand.push(drawn);
      }
      break;
    case 'block_events':
      // Handled in event resolution - mark flag
      if(who==='player')G._blockCpuEvents=true;else G._blockPlayerEvents=true;
      break;
    case 'per_player': myScore+=players.length*a.value;break;
    case 'recover':
      if(G.discard.length>0){
        const best=G.discard.filter(c=>c.rating>0).sort((x,y)=>y.rating-x.rating)[0];
        if(best){
          G.discard=G.discard.filter(c=>c.id!==best.id);
          if(who==='player')G.playerHand.push(best);else G.cpuHand.push(best);
        }
      }
      break;
    case 'legend_bonus':
      if(myCards.some(c=>c.type==='legend'))myScore+=a.value;
      break;
    case 'shield_coach':
      if(who==='player')G._shieldCoachPlayer=true;else G._shieldCoachCpu=true;
      break;
    case 'underdog':
      const myTotal=who==='player'?G.playerScore:G.cpuScore;
      const rivalTotal=who==='player'?G.cpuScore:G.playerScore;
      if(myTotal<rivalTotal)myScore+=a.value;
      break;
    case 'event_damage': rivalScore-=events.length*a.value;break;
    case 'event_synergy': myScore+=events.length*a.value;break;
    case 'per_card': myScore+=myCards.length*a.value;break;
    case 'double_bonus':
      if(who==='player')G._doubleBonusPlayer=true;else G._doubleBonusCpu=true;
      break;
    case 'exact_three':
      if(myCards.length===3)myScore+=a.value;
      break;
    case 'super_coach':
      if(who==='player')G._superCoachPlayer=true;else G._superCoachCpu=true;
      break;
    case 'underrated':
      myScore+=players.filter(c=>(c.rating||0)<78).length*a.value;
      break;
    case 'shield_protect':
      if(myCards.some(c=>c.type==='shield')){
        if(who==='player')G._blockCpuEvents=true;else G._blockPlayerEvents=true;
      }
      break;
    case 'solo':
      if(players.length===1)myScore+=a.value;
      break;
    case 'scout':
      // Show one rival card (visual only, doesn't affect score)
      break;
    case 'counter':
      if(rivalCards.length>myCards.length)myScore+=a.value;
      break;
    case 'variety':{
      const types=new Set(myCards.map(c=>c.type.startsWith('event_')?'event':c.type));
      myScore+=types.size*a.value;
      break;
    }
  }
  rivalScore=Math.max(0,rivalScore);
  return{myScore,rivalScore};
}

// === BET SYSTEM ===
function showBetOverlay(minBet=1){
  return new Promise(resolve=>{
    const o=$('#bet-overlay');
    // Render player's current hand inside the bet overlay
    $('#bet-current-hand').innerHTML=G.playerHand.map(c=>cardHTML(c)).join('');
    // Disable bets below minimum
    $$('.bet-btn').forEach(btn=>{
      const val=parseInt(btn.dataset.bet);
      if(val<minBet){btn.classList.add('btn-disabled')}else{btn.classList.remove('btn-disabled')}
      btn.onclick=()=>{
        if(val<minBet)return;
        G.playerBet=val;
        o.classList.remove('show');
        resolve(val);
      };
    });
    o.classList.add('show');
  });
}

// === EPIC MODE (COMEBACK MECHANIC) ===
function checkEpicMode(){
  if(G.epicMode&&G.epicMode.remaining>0){
    G.epicMode.remaining--;
    if(G.epicMode.remaining<=0)G.epicMode=null;
    return;
  }
  const scoreDiff=G.playerScore-G.cpuScore;
  const bazaDiff=G.playerBazas-G.cpuBazas;
  if(scoreDiff<=-200||bazaDiff<=-4){
    G.epicMode={who:'player',remaining:3};
  }else if(scoreDiff>=200||bazaDiff>=4){
    G.epicMode={who:'cpu',remaining:3};
  }else{
    G.epicMode=null;
  }
}

function getEpicBonus(who,cards){
  if(!G.epicMode||G.epicMode.who!==who)return 0;
  const playerCount=cards.filter(c=>c.type==='player'||c.type==='legend').length;
  return playerCount*10; // +10 per player card
}

function cpuBet(){
  const diff=G.difficulty;
  const hand=G.cpuHand;
  // Evaluate hand strength
  const maxRating=Math.max(...hand.map(c=>c.rating||0));
  const totalRating=hand.filter(c=>c.rating>0).reduce((s,c)=>s+c.rating,0);
  const hasShield=hand.some(c=>c.type==='shield');
  const personality=G.cpuPersonality;

  if(diff==='easy')return 1;
  if(diff==='normal'){
    if(totalRating>300&&hasShield)return 2;
    return 1;
  }
  // Hard: smarter betting based on hand quality and personality
  if(personality==='aggressive'){
    if(totalRating>250)return 3;
    if(totalRating>150)return 2;
    return 1;
  }
  if(personality==='conservative')return 1;
  // Default hard
  if(totalRating>350&&hasShield)return 3;
  if(totalRating>250||maxRating>=90)return 2;
  return 1;
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
    cpuTurn(G.playerPlay); // CPU sees player's cards and can respond
    renderCpuPlay();
    renderRivalHand();
    await wait(600);
  }
  await resolveBaza();
  G.animating=false;
}

// ==================== CPU AI ====================
function cpuTurn(rivalPlay){
  const hand=G.cpuHand;
  if(hand.length===0)return;
  const diff=G.difficulty;
  const personality=G.cpuPersonality||'aggressive';
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
  const rivalScore=rivalPlay?calcScore(rivalPlay):0;
  const rivalHasEvents=rivalPlay?rivalPlay.some(c=>c.type.startsWith('event_')):false;

  // Helper: find best combo across all teams
  function findBestCombo(maxSize){
    let best=null,bestVal=0;
    for(const[ti,cards] of Object.entries(groups)){
      const pl=cards.filter(c=>c.type==='player'||c.type==='legend');
      const shield=cards.find(c=>c.type==='shield');
      const coach=cards.find(c=>c.type==='coach');
      for(let sz=Math.min(pl.length,maxSize);sz>=1;sz--){
        const sorted=[...pl].sort((a,b)=>b.rating-a.rating);
        const combo=sorted.slice(0,sz);
        let val=combo.reduce((s,c)=>s+c.rating,0);
        const thisPlay=[...combo];
        if(shield&&combo.length>=2){val*=2;thisPlay.push(shield)}
        if(coach)thisPlay.push(coach);
        if(val>bestVal){bestVal=val;best=thisPlay}
      }
    }
    return{play:best,score:bestVal};
  }

  if(personality==='conservative'){
    // Save big combos, play small cards early
    if(G.bazaNum<=3){
      // Early game: play lowest single card
      const ranked=hand.filter(c=>c.rating>0).sort((a,b)=>a.rating-b.rating);
      play=ranked.length>0?[ranked[0]]:[hand[0]];
    }else{
      // Mid/late game: unleash combos
      const combo=findBestCombo(4);
      if(combo.play)play=combo.play;
      else{
        const ranked=hand.filter(c=>c.rating>0).sort((a,b)=>b.rating-a.rating);
        play=ranked.length>0?[ranked[0]]:[hand[0]];
      }
    }
    // Conservative: only use events defensively
    if(rivalPlay&&rivalHasEvents){
      const varCard=events.find(c=>c.type==='event_var');
      if(varCard&&!play.includes(varCard))play.push(varCard);
    }
  }else if(personality==='aggressive'){
    // Always play biggest combo possible
    const combo=findBestCombo(5);
    if(combo.play)play=combo.play;
    else{
      const ranked=hand.filter(c=>c.rating>0).sort((a,b)=>b.rating-a.rating);
      play=ranked.length>0?[ranked[0]]:[hand[0]];
    }
    // Always add offensive events
    const red=events.find(c=>c.type==='event_red');
    const yellow=events.find(c=>c.type==='event_yellow');
    const talk=events.find(c=>c.type==='event_talk');
    if(red&&!play.includes(red))play.push(red);
    if(yellow&&!play.includes(yellow))play.push(yellow);
    if(talk&&play.filter(c=>c.type==='player'||c.type==='legend').length>=2&&!play.includes(talk))play.push(talk);
  }else if(personality==='trickster'){
    // Prioritize events and special cards
    // Play a small combo as base, then stack events
    const ranked=hand.filter(c=>c.rating>0).sort((a,b)=>b.rating-a.rating);
    play=ranked.length>0?[ranked[0]]:[hand[0]];
    // Add ALL available events
    events.forEach(e=>{if(!play.includes(e))play.push(e)});
    // Try to use swap/steal if going first
    if(!rivalPlay){
      const swap=events.find(c=>c.type==='event_swap');
      const steal=events.find(c=>c.type==='event_steal');
      if(swap&&!play.includes(swap))play.push(swap);
      if(steal&&!play.includes(steal))play.push(steal);
    }
  }else if(personality==='tactical'){
    // Adapt based on situation
    if(rivalPlay&&rivalScore>0){
      // Responding: find cheapest combo that beats rival
      let cheapWin=null,cheapWinVal=Infinity;
      for(const[ti,cards] of Object.entries(groups)){
        const pl=cards.filter(c=>c.type==='player'||c.type==='legend');
        const shield=cards.find(c=>c.type==='shield');
        const coach=cards.find(c=>c.type==='coach');
        for(let sz=1;sz<=Math.min(pl.length,4);sz++){
          const sorted=[...pl].sort((a,b)=>b.rating-a.rating);
          const combo=sorted.slice(0,sz);
          let val=combo.reduce((s,c)=>s+c.rating,0);
          const thisPlay=[...combo];
          if(shield&&combo.length>=2){val*=2;thisPlay.push(shield)}
          if(coach){
            const rivalBest=rivalPlay.filter(c=>c.type==='player'||c.type==='legend').sort((a,b)=>b.rating-a.rating);
            if(rivalBest.length>0)val+=rivalBest[0].rating; // Effective value includes coach neutralization
            thisPlay.push(coach);
          }
          if(val>rivalScore&&thisPlay.length<cheapWinVal){
            cheapWinVal=thisPlay.length;cheapWin=thisPlay;
          }
        }
      }
      if(cheapWin)play=cheapWin;
      else{
        // Can't beat rival cheaply, go all in
        const combo=findBestCombo(4);
        play=combo.play||[hand[0]];
      }
      // Tactical event use
      const varCard=events.find(c=>c.type==='event_var');
      if(varCard&&rivalHasEvents&&!play.includes(varCard))play.push(varCard);
      const myScore=calcScore(play);
      if(myScore<=rivalScore){
        const red=events.find(c=>c.type==='event_red');
        const yellow=events.find(c=>c.type==='event_yellow');
        if(red&&!play.includes(red))play.push(red);
        else if(yellow&&!play.includes(yellow))play.push(yellow);
      }
    }else{
      // Playing first: medium combo, save resources
      let bestCombo=null,bestVal=0;
      for(const[ti,cards] of Object.entries(groups)){
        const pl=cards.filter(c=>c.type==='player'||c.type==='legend');
        if(pl.length>=2){
          const sorted=[...pl].sort((a,b)=>b.rating-a.rating);
          const combo=sorted.slice(0,2);
          const val=combo.reduce((s,c)=>s+c.rating,0);
          if(val>bestVal){bestVal=val;bestCombo=[...combo]}
        }
      }
      if(bestCombo)play=bestCombo;
      else{
        const ranked=hand.filter(c=>c.rating>0).sort((a,b)=>b.rating-a.rating);
        play=ranked.length>0?[ranked[0]]:[hand[0]];
      }
      // Moderate event use
      if(Math.random()>0.4){
        const yellow=events.find(c=>c.type==='event_yellow');
        if(yellow&&!play.includes(yellow))play.push(yellow);
      }
    }
  }else{
    // Fallback (default): same as aggressive
    const combo=findBestCombo(4);
    play=combo.play||[hand[0]];
    const red=events.find(c=>c.type==='event_red');
    if(red&&!play.includes(red))play.push(red);
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
  // Apply Epic Mode bonus
  const pEpicBonus=getEpicBonus('player',G.playerPlay);
  const cEpicBonus=getEpicBonus('cpu',G.cpuPlay);
  if(pEpicBonus>0){pScore+=pEpicBonus;await showEventMsg('\u{1F525} Modo Epico!',`+${pEpicBonus} pts de comeback`)}
  if(cEpicBonus>0){cScore+=cEpicBonus;await showEventMsg('\u{1F525} Modo Epico CPU!',`+${cEpicBonus} pts de comeback`)}
  // Apply team abilities
  const pAbility=getTeamAbility(G.playerPlay);
  const cAbility=getTeamAbility(G.cpuPlay);
  if(pAbility){
    const r=await applyTeamAbility(pAbility,'player',G.playerPlay,G.cpuPlay,pScore,cScore);
    pScore=r.myScore;cScore=r.rivalScore;
  }
  if(cAbility){
    const r=await applyTeamAbility(cAbility,'cpu',G.cpuPlay,G.playerPlay,cScore,pScore);
    cScore=r.myScore;pScore=r.rivalScore;
  }
  // Reset ability flags
  G._blockCpuEvents=false;G._blockPlayerEvents=false;
  G._shieldCoachPlayer=false;G._shieldCoachCpu=false;
  G._doubleBonusPlayer=false;G._doubleBonusCpu=false;
  G._superCoachPlayer=false;G._superCoachCpu=false;
  // (Team abilities set flags above before coach/events resolve)
  // Re-apply team abilities for flag-setting
  const pAbilityPre=getTeamAbility(G.playerPlay);
  const cAbilityPre=getTeamAbility(G.cpuPlay);
  if(pAbilityPre){const a=pAbilityPre.ability;
    if(a.effect==='block_events')G._blockCpuEvents=true;
    if(a.effect==='shield_coach')G._shieldCoachPlayer=true;
    if(a.effect==='double_bonus')G._doubleBonusPlayer=true;
    if(a.effect==='super_coach')G._superCoachPlayer=true;
    if(a.effect==='shield_protect'&&G.playerPlay.some(c=>c.type==='shield'))G._blockCpuEvents=true;
  }
  if(cAbilityPre){const a=cAbilityPre.ability;
    if(a.effect==='block_events')G._blockPlayerEvents=true;
    if(a.effect==='shield_coach')G._shieldCoachCpu=true;
    if(a.effect==='double_bonus')G._doubleBonusCpu=true;
    if(a.effect==='super_coach')G._superCoachCpu=true;
    if(a.effect==='shield_protect'&&G.cpuPlay.some(c=>c.type==='shield'))G._blockPlayerEvents=true;
  }
  // Apply coach power (eliminate best rival card)
  const pCoach=G.playerPlay.find(c=>c.type==='coach');
  const cCoach=G.cpuPlay.find(c=>c.type==='coach');
  if(pCoach&&!G._shieldCoachCpu){
    const rivalPlayers=G.cpuPlay.filter(c=>c.type==='player'||c.type==='legend').sort((a,b)=>b.rating-a.rating);
    const removeCount=G._superCoachPlayer?2:1;
    for(let i=0;i<Math.min(removeCount,rivalPlayers.length);i++){
      cScore-=rivalPlayers[i].rating;
      await showEventMsg('\u{1F4CB} Entrenador!',`Elimina a ${rivalPlayers[i].name} (${rivalPlayers[i].rating}pts)`);
    }
  }
  if(cCoach&&!G._shieldCoachPlayer){
    const rivalPlayers=G.playerPlay.filter(c=>c.type==='player'||c.type==='legend').sort((a,b)=>b.rating-a.rating);
    const removeCount=G._superCoachCpu?2:1;
    for(let i=0;i<Math.min(removeCount,rivalPlayers.length);i++){
      pScore-=rivalPlayers[i].rating;
      await showEventMsg('\u{1F4CB} Entrenador rival!',`Elimina a ${rivalPlayers[i].name} (${rivalPlayers[i].rating}pts)`);
    }
  }
  // Apply events that affect rival
  const pEvents=G.playerPlay.filter(c=>c.type.startsWith('event_'));
  const cEvents=G.cpuPlay.filter(c=>c.type.startsWith('event_'));
  // Check for VAR: cancels rival events
  const pHasVar=pEvents.some(e=>e.type==='event_var');
  const cHasVar=cEvents.some(e=>e.type==='event_var');
  if(pHasVar&&cEvents.length>0){
    await showEventMsg('\u{1F4FA} VAR!','Se anulan los eventos de la CPU');
  }
  if(cHasVar&&pEvents.length>0){
    await showEventMsg('\u{1F4FA} VAR rival!','Se anulan tus eventos');
  }
  let activePlayerEvents=cHasVar?[]:pEvents.filter(e=>e.type!=='event_var');
  let activeCpuEvents=pHasVar?[]:cEvents.filter(e=>e.type!=='event_var');
  // Block events via team abilities
  if(G._blockPlayerEvents){activePlayerEvents=[];if(pEvents.length>0)await showEventMsg('\u{1F6AB} Eventos bloqueados!','La habilidad rival anula tus eventos')}
  if(G._blockCpuEvents){activeCpuEvents=[];if(cEvents.length>0)await showEventMsg('\u{1F6AB} Eventos CPU bloqueados!','Tu habilidad anula los eventos rivales')}
  const pEpicMult=(G.epicMode&&G.epicMode.who==='player')?2:1;
  const cEpicMult=(G.epicMode&&G.epicMode.who==='cpu')?2:1;
  // Formation 5-4-1 reduces incoming event effects by 50%
  const pDefense=getFormationEventReduction(G.cpuFormation); // CPU's defense reduces player events effect
  const cDefense=getFormationEventReduction(G.playerFormation); // Player's defense reduces CPU events effect
  activePlayerEvents.forEach(e=>{
    if(e.type==='event_yellow')cScore=Math.max(0,cScore-Math.round(15*pEpicMult*pDefense));
    if(e.type==='event_red'){const penalty=Math.min(Math.floor(cScore*0.3*pEpicMult*pDefense),Math.round(40*pEpicMult*pDefense));cScore=Math.max(0,cScore-penalty)}
    if(e.type==='event_talk')pScore+=G.playerPlay.filter(c=>c.type==='player'||c.type==='legend').length*5*pEpicMult;
  });
  activeCpuEvents.forEach(e=>{
    if(e.type==='event_yellow')pScore=Math.max(0,pScore-Math.round(15*cEpicMult*cDefense));
    if(e.type==='event_red'){const penalty=Math.min(Math.floor(pScore*0.3*cEpicMult*cDefense),Math.round(40*cEpicMult*cDefense));pScore=Math.max(0,pScore-penalty)}
    if(e.type==='event_talk')cScore+=G.cpuPlay.filter(c=>c.type==='player'||c.type==='legend').length*5*cEpicMult;
  });
  pScore=Math.max(0,pScore);cScore=Math.max(0,cScore);
  // Apply formation bonuses to base score
  pScore=applyFormationToScore(pScore,G.playerPlay,G.playerFormation);
  cScore=applyFormationToScore(cScore,G.cpuPlay,G.cpuFormation);
  // Apply bets
  pScore=Math.round(pScore*G.playerBet);
  cScore=Math.round(cScore*G.cpuBet);
  // Determine winner
  const result=pScore>cScore?'win':pScore<cScore?'lose':'draw';
  const r=$('#play-result');
  if(result==='win'){
    const baseBonus=G._doubleBonusPlayer?2:1;
    const streakBonus=G.playerStreak>=2?G.playerStreak*5:0; // +5,+10,+15... per streak
    pScore+=baseBonus+streakBonus;
    G.playerBazas++;G.playerStreak++;G.cpuStreak=0;
    const streakTxt=streakBonus>0?` (+${streakBonus} racha)`:'';
    r.textContent=`GANAS! ${pScore}-${cScore}${streakTxt}`;r.className='play-result win';
    vibrate([100,50,100]);
  }else if(result==='lose'){
    const baseBonus=G._doubleBonusCpu?2:1;
    const streakBonus=G.cpuStreak>=2?G.cpuStreak*5:0;
    cScore+=baseBonus+streakBonus;
    G.cpuBazas++;G.cpuStreak++;G.playerStreak=0;
    r.textContent=`PIERDES ${pScore}-${cScore}`;r.className='play-result lose';
    vibrate(200);
  }else{
    G.playerStreak=0;G.cpuStreak=0;
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
  // Check match state
  const matchState=checkWin();
  if(matchState==='halftime'){
    await handleHalftime();return;
  }
  if(matchState==='extra_time'){
    await handleExtraTime();return;
  }
  if(matchState==='penalties'){
    await handlePenalties();return;
  }
  if(matchState==='player'||matchState==='cpu'||matchState==='draw'){
    endGame(matchState);return;
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

// Check if team ability triggers (3+ cards from same team)
function getTeamAbility(cards){
  const nonEvent=cards.filter(c=>!c.type.startsWith('event_'));
  if(nonEvent.length<3)return null;
  const team=nonEvent[0].team;
  if(team==null)return null;
  if(!nonEvent.every(c=>c.team===team))return null;
  const players=nonEvent.filter(c=>c.type==='player'||c.type==='legend');
  if(players.length<3)return null;
  return{teamIdx:team,ability:TEAM_ABILITIES[team],teamName:TEAMS[team].n};
}

function checkWin(){
  const HALF_LENGTH=10;
  const EXTRA_LENGTH=3;
  if(G.period==='first_half'&&G.bazaNum>=HALF_LENGTH){
    return'halftime';
  }
  if(G.period==='second_half'&&G.bazaNum>=HALF_LENGTH*2){
    if(G.playerBazas!==G.cpuBazas)
      return G.playerBazas>G.cpuBazas?'player':'cpu';
    return'extra_time';
  }
  if(G.period==='extra_time'&&G.bazaNum>=HALF_LENGTH*2+EXTRA_LENGTH){
    if(G.playerBazas!==G.cpuBazas)
      return G.playerBazas>G.cpuBazas?'player':'cpu';
    return'penalties';
  }
  // Deck exhaustion fallback
  if(G.deck.length===0&&G.playerHand.length===0&&G.cpuHand.length===0){
    if(G.playerBazas!==G.cpuBazas)
      return G.playerBazas>G.cpuBazas?'player':'cpu';
    if(G.period==='first_half')return'halftime';
    if(G.period==='second_half')return'extra_time';
    return'penalties';
  }
  return null;
}

// ==================== MATCH FLOW ====================
async function handleHalftime(){
  await showEventMsg('\u{1F3DF}\uFE0F Descanso!',`${G.playerScore} - ${G.cpuScore}`);
  // Allow player to change formation
  await showHalftimeOverlay();
  // CPU may also change formation
  G.cpuFormation=cpuPickFormation();
  await showEventMsg(`\u{1F916} CPU cambia a ${G.cpuFormation.name}`,G.cpuFormation.desc);
  G.period='second_half';
  G.epicMode=null;
  saveGame();
  await nextBaza();
}

function showHalftimeOverlay(){
  return new Promise(resolve=>{
    const o=$('#halftime-overlay');
    $('#ht-score').textContent=`${G.playerBazas} - ${G.cpuBazas}`;
    $('#ht-formation').textContent=`Formacion actual: ${G.playerFormation.name}`;
    // Render current hand
    $('#ht-current-hand').innerHTML=G.playerHand.map(c=>cardHTML(c)).join('');
    o.classList.add('show');
    // Keep same formation
    $('#btn-ht-keep').onclick=()=>{o.classList.remove('show');resolve()};
    // Change formation
    $$('#halftime-overlay .formation-card').forEach(card=>{
      card.onclick=()=>{
        const fid=card.dataset.formation;
        G.playerFormation=FORMATIONS.find(f=>f.id===fid);
        o.classList.remove('show');
        resolve();
      };
    });
  });
}

async function handleExtraTime(){
  await showEventMsg('\u{231B} Prorroga!','3 bazas con apuesta minima x2');
  G.period='extra_time';
  G.epicMode=null;
  saveGame();
  await nextBaza();
}

async function handlePenalties(){
  await showEventMsg('\u{26BD} Penaltis!','5 rondas · 1 carta por ronda');
  G.period='penalties';
  G.penaltyRound=0;G.penaltyPlayer=0;G.penaltyCpu=0;
  for(let round=1;round<=5;round++){
    G.penaltyRound=round;
    // Refill hands if needed
    while(G.playerHand.length<1&&G.deck.length>0)G.playerHand.push(G.deck.pop());
    while(G.cpuHand.length<1&&G.deck.length>0)G.cpuHand.push(G.deck.pop());
    if(G.playerHand.length===0&&G.cpuHand.length===0)break;
    renderGame();
    await showEventMsg(`\u{26BD} Penalti ${round}/5`,`${G.penaltyPlayer} - ${G.penaltyCpu}`);
    // Player picks one card
    const pCard=await pickPenaltyCard();
    // CPU picks highest card
    const cCard=G.cpuHand.sort((a,b)=>(b.rating||0)-(a.rating||0))[0];
    G.cpuHand=G.cpuHand.filter(c=>c.id!==cCard.id);
    const pVal=pCard.rating||0;
    const cVal=cCard.rating||0;
    G.playerPlay=[pCard];G.cpuPlay=[cCard];
    renderPlayerPlay();renderCpuPlay();
    await wait(800);
    if(pVal>=cVal)G.penaltyPlayer++;
    if(cVal>=pVal)G.penaltyCpu++;
    const rEl=$('#play-result');
    if(pVal>cVal){rEl.textContent=`GOL! ${pVal} vs ${cVal}`;rEl.className='play-result win'}
    else if(cVal>pVal){rEl.textContent=`PARADO ${pVal} vs ${cVal}`;rEl.className='play-result lose'}
    else{rEl.textContent=`DOBLE GOL ${pVal}`;rEl.className='play-result draw'}
    rEl.classList.add('show');
    await wait(1800);
    rEl.classList.remove('show');
    G.discard.push(pCard,cCard);
    G.playerPlay=[];G.cpuPlay=[];
    clearPlayZone();
    // Early finish: if one side can't be caught
    const remaining=5-round;
    if(G.penaltyPlayer>G.penaltyCpu+remaining||G.penaltyCpu>G.penaltyPlayer+remaining)break;
  }
  // Penalty result
  if(G.penaltyPlayer!==G.penaltyCpu){
    endGame(G.penaltyPlayer>G.penaltyCpu?'player':'cpu');
  }else{
    // Sudden death
    await showEventMsg('\u{1F631} Muerte subita!','Gana el primero que falle');
    let sdRound=0;
    while(G.penaltyPlayer===G.penaltyCpu){
      sdRound++;
      while(G.playerHand.length<1&&G.deck.length>0)G.playerHand.push(G.deck.pop());
      while(G.cpuHand.length<1&&G.deck.length>0)G.cpuHand.push(G.deck.pop());
      if(G.playerHand.length===0&&G.cpuHand.length===0)break;
      renderGame();
      const pCard=await pickPenaltyCard();
      const cCard=G.cpuHand.sort((a,b)=>(b.rating||0)-(a.rating||0))[0];
      G.cpuHand=G.cpuHand.filter(c=>c.id!==cCard.id);
      G.playerPlay=[pCard];G.cpuPlay=[cCard];
      renderPlayerPlay();renderCpuPlay();
      await wait(800);
      const pVal=pCard.rating||0,cVal=cCard.rating||0;
      if(pVal>=cVal)G.penaltyPlayer++;
      if(cVal>=pVal)G.penaltyCpu++;
      const rEl=$('#play-result');
      rEl.textContent=`${pVal} vs ${cVal}`;
      rEl.className='play-result '+(pVal>cVal?'win':cVal>pVal?'lose':'draw');
      rEl.classList.add('show');
      await wait(1500);
      rEl.classList.remove('show');
      G.discard.push(pCard,cCard);
      G.playerPlay=[];G.cpuPlay=[];clearPlayZone();
      if(sdRound>10)break; // Safety
    }
    endGame(G.penaltyPlayer>=G.penaltyCpu?'player':'cpu');
  }
}

function pickPenaltyCard(){
  return new Promise(resolve=>{
    const el=$('#player-hand');
    el.innerHTML=G.playerHand.map(c=>{
      const html=cardHTML(c);
      return html.replace('data-id=',`onclick="window._penaltyPick(${c.id})" data-id=`);
    }).join('');
    window._penaltyPick=(id)=>{
      const card=G.playerHand.find(c=>c.id===id);
      if(!card)return;
      G.playerHand=G.playerHand.filter(c=>c.id!==id);
      window._penaltyPick=null;
      resolve(card);
    };
  });
}

// ==================== DRAW PHASE ====================
async function drawPhase(){
  const playerMax=(G.playerFormation&&G.playerFormation.id==='442')?7:6;
  const cpuMax=(G.cpuFormation&&G.cpuFormation.id==='442')?7:6;
  const playerNeed=playerMax-G.playerHand.length;
  const cpuNeed=cpuMax-G.cpuHand.length;
  const totalNeed=playerNeed+cpuNeed;
  if(totalNeed<=0||G.deck.length===0)return;

  // Draft: reveal cards for player to pick
  const available=[];
  const revealCount=Math.min(totalNeed+2,G.deck.length); // Show a few extra choices
  for(let i=0;i<revealCount;i++)available.push(G.deck.pop());

  let pickedCards=[];
  if(playerNeed>0&&available.length>0){
    const pickCount=Math.min(playerNeed,available.length);
    pickedCards=await showDraftOverlay(available,pickCount);
    pickedCards.forEach(c=>G.playerHand.push(c));
    // Remove picked from available
    const pickedIds=new Set(pickedCards.map(c=>c.id));
    const remaining=available.filter(c=>!pickedIds.has(c.id));
    // CPU picks best from remaining
    const cpuPickCount=Math.min(cpuNeed,remaining.length);
    const cpuPicks=remaining.sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,cpuPickCount);
    cpuPicks.forEach(c=>G.cpuHand.push(c));
    // Return unpicked to deck
    const allPicked=new Set([...pickedIds,...cpuPicks.map(c=>c.id)]);
    remaining.filter(c=>!allPicked.has(c.id)).forEach(c=>G.deck.push(c));
    shuffle(G.deck);
  }else{
    // Only CPU needs cards
    const cpuPickCount=Math.min(cpuNeed,available.length);
    const cpuPicks=available.slice(0,cpuPickCount);
    cpuPicks.forEach(c=>G.cpuHand.push(c));
    available.slice(cpuPickCount).forEach(c=>G.deck.push(c));
    shuffle(G.deck);
  }

  G.newCardIds=new Set(pickedCards.map(c=>c.id));
  renderGame();
  G.newCardIds=null;
  // Handle overflow
  if(G.playerHand.length>playerMax)await playerDiscard(G.playerHand.length-playerMax);
  while(G.cpuHand.length>cpuMax){
    const worst=G.cpuHand.reduce((min,c,i)=>(!min||((c.rating||0)<(min.c.rating||0))?{c,i}:min),null);
    if(worst)G.cpuHand.splice(worst.i,1);
    else G.cpuHand.pop();
  }
}

function showDraftOverlay(available,pickCount){
  return new Promise(resolve=>{
    const o=$('#draft-overlay');
    const hand=$('#draft-hand');
    const picked=new Set();
    $('#draft-count').textContent=pickCount;
    $('#draft-remaining').textContent=pickCount;
    hand.innerHTML=available.map(c=>{
      const html=cardHTML(c,false);
      return html.replace('data-id=','onclick="toggleDraft('+c.id+')" data-id=');
    }).join('');
    o.classList.add('show');
    // Render player's current hand (read-only, full size) inside the draft overlay
    $('#draft-current-hand').innerHTML=G.playerHand.map(c=>cardHTML(c)).join('');
    window._draftAvailable=available;
    window._draftPicked=picked;
    window._draftMax=pickCount;
    window._draftResolve=resolve;
    const checkBtn=()=>{
      const btn=$('#btn-draft');
      $('#draft-remaining').textContent=pickCount-picked.size;
      if(picked.size===pickCount)btn.classList.remove('btn-disabled');
      else btn.classList.add('btn-disabled');
    };
    window._draftCheck=checkBtn;
    checkBtn();
  });
}

function toggleDraft(id){
  const picked=window._draftPicked;
  if(picked.has(id))picked.delete(id);
  else if(picked.size<window._draftMax)picked.add(id);
  $$('#draft-hand .card').forEach(el=>{
    const cid=parseInt(el.dataset.id);
    if(picked.has(cid))el.classList.add('selected');
    else el.classList.remove('selected');
  });
  if(window._draftCheck)window._draftCheck();
}

function confirmDraft(){
  const picked=window._draftPicked;
  if(picked.size!==window._draftMax)return;
  const cards=window._draftAvailable.filter(c=>picked.has(c.id));
  $('#draft-overlay').classList.remove('show');
  if(window._draftResolve){window._draftResolve(cards);window._draftResolve=null}
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
  const reason=G.period==='penalties'?`Penaltis (${G.penaltyPlayer}-${G.penaltyCpu})`:G.period==='extra_time'?'Prorroga':G.period==='second_half'?'Tiempo reglamentario':'1er tiempo';
  const cpuP=G.cpuPersonality?CPU_PERSONALITIES[G.cpuPersonality]:null;
  statsDiv.innerHTML=`
    <div class="end-stat"><span>Resultado</span><span>${G.playerBazas} - ${G.cpuBazas}</span></div>
    <div class="end-stat"><span>Mejor racha</span><span>${Math.max(G.playerStreak,stats.bestStreak)}</span></div>
    <div class="end-stat"><span>Bazas totales</span><span>${G.bazaNum}</span></div>
    <div class="end-stat"><span>Resultado por</span><span>${reason}</span></div>
    ${G.playerFormation?`<div class="end-stat"><span>Tu formacion</span><span>${G.playerFormation.name}</span></div>`:''}
    ${cpuP?`<div class="end-stat"><span>CPU rival</span><span>${cpuP.icon} ${cpuP.name}</span></div>`:''}
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
  animateScore($('#sc-player'),G.playerBazas);
  animateScore($('#sc-cpu'),G.cpuBazas);
  const periodLabel=G.period==='first_half'?'1er Tiempo':G.period==='second_half'?'2do Tiempo':G.period==='extra_time'?'Prorroga':'Penaltis';
  const bazaInPeriod=G.period==='first_half'?G.bazaNum:G.period==='second_half'?G.bazaNum-10:G.period==='extra_time'?G.bazaNum-20:G.penaltyRound;
  const periodMax=G.period==='extra_time'?3:G.period==='penalties'?5:10;
  $('#sc-period').textContent=periodLabel;
  $('#sc-bazas').textContent=`Baza ${bazaInPeriod}/${periodMax}`;
  let streak=G.playerStreak>1?`Racha: ${G.playerStreak}`:G.cpuStreak>1?`Racha CPU: ${G.cpuStreak}`:'';
  if(G.epicMode)streak+=` \u{1F525} Epico: ${G.epicMode.who==='player'?'Tu':'CPU'} (${G.epicMode.remaining})`;
  $('#sc-streak').textContent=streak;
  $('#sc-deck').textContent=`Mazo: ${G.deck.length}`;
  // Show bets
  const betInfo=$('#sc-bets');
  if(betInfo){
    if(G.playerBet>1||G.cpuBet>1){
      const pBet=G.playerBet>1?`Tu: ${G.playerBet}x`:'';
      const cBet=G.cpuBet>1?`CPU: ${G.cpuBet}x`:'';
      betInfo.textContent=[pBet,cBet].filter(Boolean).join(' · ');
      betInfo.className='bet-indicator'+(G.playerBet>=3||G.cpuBet>=3?' bet-max':' bet-high');
    }else{
      betInfo.textContent='';betInfo.className='bet-indicator';
    }
  }
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
