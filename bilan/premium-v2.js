
/* Export premium Entrepôt Valence — v1, visuel fidèle au modèle validé.
   Données réelles uniquement, aucune valeur d'historique inventée.
   Cette surcouche ne modifie pas la saisie et le partage mobiles. */
renderCanvas = function renderPremiumBilan(){
  recalc();
  const W=1600, H=900, scale=1.5;
  if(board.width!==W*scale || board.height!==H*scale){
    board.width=W*scale; board.height=H*scale;
  }
  const c=board.getContext('2d');
  c.setTransform(scale,0,0,scale,0,0);
  c.clearRect(0,0,W,H);
  const P={
    bg:'#f6f8fa',white:'#ffffff',navy:'#18384e',ink:'#112e43',
    dark:'#102a3e',muted:'#617587',line:'#dae5e9',
    green:'#147847',greenDark:'#08633a',greenBg:'#eff8f1',
    blue:'#1561b9',blueDark:'#074c99',blueBg:'#eef5fc',
    pale:'#edf3f6',pale2:'#f8fbfc'
  };
  const rr=(x,y,w,h,r,fill,stroke)=>{
    c.beginPath();c.roundRect(x,y,w,h,r);
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}
  };
  const txt=(value,x,y,size=18,color=P.ink,weight=500,align='left')=>{
    c.font=weight+' '+size+'px Arial, Helvetica, sans-serif';
    c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
    c.fillText(String(value),x,y);
  };
  const fit=(value,x,y,width,size=18,color=P.ink,weight=600,align='left',min=12)=>{
    const s=String(value);
    c.font=weight+' '+size+'px Arial, Helvetica, sans-serif';
    while(size>min && c.measureText(s).width>width){
      size--;c.font=weight+' '+size+'px Arial, Helvetica, sans-serif';
    }
    txt(s,x,y,size,color,weight,align);
  };
  const line=(x,y,xx,yy,color=P.line,width=1)=>{
    c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);
    c.strokeStyle=color;c.lineWidth=width;c.stroke();
  };
  const shadowCard=(x,y,w,h,r=13)=>{
    c.save();c.shadowColor='rgba(20,48,71,.085)';c.shadowBlur=17;c.shadowOffsetY=5;
    rr(x,y,w,h,r,P.white);c.restore();
    rr(x,y,w,h,r,null,'#e4ecef');
  };
  const grad=(y,h,a,b)=>{
    const g=c.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,a);g.addColorStop(1,b);return g;
  };
  function drawIcon(type,x,y,s,color){
    c.save();c.translate(x,y);c.scale(s/36,s/36);
    c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2.8;
    c.lineCap='round';c.lineJoin='round';
    const path=(steps)=>{c.beginPath();steps(c);c.stroke()};
    if(type==='truck'){
      path(p=>{p.moveTo(2,9);p.lineTo(22,9);p.lineTo(22,27);p.lineTo(2,27);p.closePath();
        p.moveTo(22,16);p.lineTo(29,16);p.lineTo(34,23);p.lineTo(34,27);p.lineTo(22,27)});
      c.beginPath();c.arc(10,29,3,0,7);c.arc(28,29,3,0,7);c.fill();
    }else if(type==='box'){
      path(p=>{p.moveTo(18,3);p.lineTo(33,11);p.lineTo(33,27);p.lineTo(18,35);
        p.lineTo(3,27);p.lineTo(3,11);p.closePath();p.moveTo(3,11);
        p.lineTo(18,19);p.lineTo(33,11);p.moveTo(18,19);p.lineTo(18,35)});
    }else if(type==='clock'){
      path(p=>{p.arc(18,18,15,0,Math.PI*2);p.moveTo(18,8);p.lineTo(18,19);p.lineTo(25,24)});
    }else if(type==='flag'){
      path(p=>{p.moveTo(6,34);p.lineTo(6,4);p.lineTo(28,7);p.lineTo(23,16);
        p.lineTo(30,24);p.lineTo(6,21)});
    }else if(type==='shield'){
      path(p=>{p.moveTo(18,2);p.lineTo(32,7);p.lineTo(30,22);p.quadraticCurveTo(27,30,18,35);
        p.quadraticCurveTo(9,30,6,22);p.lineTo(4,7);p.closePath()});
      path(p=>{p.moveTo(12,18);p.lineTo(17,23);p.lineTo(25,13)});
    }else if(type==='bars'){
      c.fillRect(4,23,6,10);c.fillRect(15,15,6,18);c.fillRect(26,6,6,27);
    }else if(type==='chat'){
      path(p=>{p.moveTo(6,7);p.lineTo(30,7);p.lineTo(30,26);p.lineTo(17,26);p.lineTo(10,33);p.lineTo(10,26);p.lineTo(6,26);p.closePath();
        p.moveTo(12,14);p.lineTo(24,14);p.moveTo(12,20);p.lineTo(20,20)});
    }else if(type==='calendar'){
      path(p=>{p.rect(3,7,30,27);p.moveTo(3,15);p.lineTo(33,15);
        p.moveTo(10,3);p.lineTo(10,10);p.moveTo(26,3);p.lineTo(26,10)});
    }else if(type==='pallet'){
      path(p=>{p.rect(5,10,9,9);p.rect(21,10,9,9);p.rect(12,21,13,8);
        p.moveTo(3,33);p.lineTo(33,33);p.moveTo(6,29);p.lineTo(6,33);p.moveTo(30,29);p.lineTo(30,33)});
    }else if(type==='alert'){
      path(p=>{p.moveTo(18,3);p.lineTo(34,31);p.lineTo(2,31);p.closePath();
        p.moveTo(18,13);p.lineTo(18,22)});
      c.beginPath();c.arc(18,27,1.5,0,7);c.fill();
    }else if(type==='mail'){
      path(p=>{p.rect(2,6,32,24);p.moveTo(3,8);p.lineTo(18,20);p.lineTo(33,8)});
    }
    c.restore();
  }
  const photo=(im,x,y,w,h,r=0)=>{
    if(!im || !im.naturalWidth) return;
    c.save();c.beginPath();c.roundRect(x,y,w,h,r);c.clip();
    const sc=Math.max(w/im.naturalWidth,h/im.naturalHeight);
    const rw=im.naturalWidth*sc,rh=im.naturalHeight*sc;
    c.drawImage(im,x+(w-rw)/2,y+(h-rh)/2,rw,rh);
    c.restore();
  };
  const blockTitle=(x,y,w,title,icon)=>{
    rr(x,y,w,47,9,P.navy);
    drawIcon(icon,x+14,y+8,31,'#ffffff');
    fit(title,x+57,y+24,w-75,25,P.white,700,'left',19);
  };
  const unitTitle=(x,y,w,title,color)=>{
    rr(x,y,w,44,8,color);
    txt(title,x+w/2,y+23,22,P.white,700,'center');
  };
  const metric=(x,y,w,h,label,value,fill,color,icon,large=34)=>{
    rr(x,y,w,h,9,fill);
    if(icon)drawIcon(icon,x+10,y+10,23,color);
    fit(label,x+(icon?38:13),y+23,w-(icon?47:22),15,P.muted,600,'left',12);
    fit(value,x+w/2,y+h-29,w-22,large,color,700,'center',22);
  };


  // FORMAT OFFICIEL : 1600 × 900 (export PNG 2400 × 1350).
  // Les trois visuels proviennent du logo vectoriel et des deux photos du site.
  rr(0,0,W,H,0,P.bg);
  shadowCard(20,9,1560,166,12);
  c.save();c.beginPath();c.roundRect(22,11,1556,162,10);c.clip();
  photo(img,621,11,350,162);
  photo(aerial,927,11,651,162);
  // Bande oblique claire entre les deux photographies réelles.
  c.beginPath();c.moveTo(934,11);c.lineTo(951,11);c.lineTo(913,173);c.lineTo(896,173);
  c.closePath();c.fillStyle='#ffffff';c.fill();
  // Dégradé blanc derrière les titres pour garder une lecture impeccable.
  const whiteFade=c.createLinearGradient(440,0,790,0);
  whiteFade.addColorStop(0,'rgba(255,255,255,1)');
  whiteFade.addColorStop(.57,'rgba(255,255,255,.94)');
  whiteFade.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=whiteFade;c.fillRect(430,11,375,162);
  c.restore();
  if(typeof officialLogo!=='undefined' && officialLogo.naturalWidth){
    c.drawImage(officialLogo,31,24,169,112);
  }
  line(224,26,224,145,'#adbfca',1.5);
  txt('ENTREPÔT VALENCE',244,50,42,P.ink,800);
  txt('BILAN DE FIN DE JOURNÉE',244,92,32,P.green,800);
  txt('UAG / UAD  ·  Équipe après-midi',245,125,19,P.navy,600);
  txt('ANTICIPER DEMAIN   |   ORGANISER ENSEMBLE   |   RÉUSSIR ENSEMBLE',
      246,153,12,P.muted,700);
  // Cartouche date / passation
  rr(1272,25,284,104,12,'rgba(17,43,63,.96)');
  drawIcon('calendar',1290,40,39,'#ffffff');
  txt(dt($('date').value),1428,57,28,P.white,800,'center');
  txt('Passation aux équipes',1418,91,15,'#e0edf5',500,'center');
  txt('du matin',1418,109,15,'#e0edf5',500,'center');

  // L’organisation est strictement celle du modèle validé.
  blockTitle(20,187,768,'RÉCEPTION & 2RP','truck');
  blockTitle(801,187,779,'PRÉPARATION  ·  RELIQUATS','box');
  // Cadres blancs, tons discrets verts (UAG) et bleus (UAD).
  shadowCard(20,243,374,308,11);
  shadowCard(406,243,381,308,11);
  shadowCard(801,243,380,308,11);
  shadowCard(1193,243,387,308,11);
  unitTitle(26,249,362,'UA GAUCHE  ·  UAG',P.green);
  unitTitle(412,249,369,'UA DROITE  ·  UAD',P.blue);
  unitTitle(807,249,368,'UA GAUCHE  ·  UAG',P.green);
  unitTitle(1199,249,375,'UA DROITE  ·  UAD',P.blue);

  function reception(x,side,color,fill,w){
    txt('RÉCEPTION',x+12,314,17,P.ink,750);
    line(x+11,330,x+w-11,330,'#d9e4e9');
    const tileWidth=(w-33)/3;
    const recv=[['BR2',side+'_br2','pallet'],['Camions',side+'_cam','truck'],
      ['Conteneurs',side+'_cont','box']];
    recv.forEach(([label,field,icon],i)=>{
      metric(x+6+i*(tileWidth+5),337,tileWidth,82,label,fnum(num(field)),
        fill,color,icon,32);
    });
    rr(x+6,426,w-12,26,5,'#f1f6f8');
    txt('2RP',x+15,440,17,P.ink,800);
    txt('PH + Rangement',x+66,440,13,P.muted,500);
    const data=[['PH',fnum(num(side+'_ph')),'box'],
      ['Rangement',fnum(num(side+'_rang')),'pallet'],
      ['Total 2RP',fnum(pairTotal(side)),'bars']];
    data.forEach(([label,value,icon],i)=>{
      metric(x+6+i*(tileWidth+5),460,tileWidth,80,label,value,
        i===2?(side==='l'?'#e5f3e9':'#e7f0fd'):fill,color,icon,32);
    });
  }
  reception(26,'l',P.green,P.greenBg,362);
  reception(412,'r',P.blue,P.blueBg,369);

  function preparation(x,side,color,fill,w){
    const data=[
      ['Prises restantes',fnum(num(side+'_picks')),'box'],
      ['Heures restantes',num(side+'_hours')==null?'—':fnum(num(side+'_hours'))+' h','clock'],
      ['Fin prévue demain',hour(side+'_end'),'flag']
    ];
    data.forEach(([label,value,icon],i)=>{
      const y=301+i*81;
      rr(x,y,w,76,9,fill);
      drawIcon(icon,x+15,y+20,34,color);
      fit(label,x+60,y+36,w-208,17,P.ink,600,'left',13);
      fit(value,x+w-14,y+39,164,35,color,800,'right',23);
    });
  }
  preparation(807,'l',P.green,P.greenBg,368);
  preparation(1199,'r',P.blue,P.blueBg,375);

  // Synthèse globale : les prises et les heures sont calculées, la fin est choisie par le manager.
  shadowCard(20,563,1560,98,12);
  rr(26,569,1548,86,8,grad(569,86,'#f8fbfd','#ecf3f7'));
  const totalPicks=both(num('l_picks'),num('r_picks'));
  const totalHours=both(num('l_hours'),num('r_hours'));
  const kpis=[
    ['PRISES RESTANTES  ·  TOTAL',fnum(totalPicks),'box'],
    ['HEURES RESTANTES  ·  TOTAL',totalHours==null?'—':fnum(totalHours)+' h','clock'],
    ['FIN PRÉVISIONNELLE  ·  DEMAIN',hour('globalEnd'),'flag']
  ];
  kpis.forEach(([label,value,icon],i)=>{
    const x=35+i*515;
    if(i)line(x-10,582,x-10,643,'#bfd2dd',1.5);
    drawIcon(icon,x+35,585,40,P.navy);
    fit(label,x+95,592,399,17,P.navy,700,'left',13);
    fit(value,x+95,627,401,42,P.ink,800,'left',25);
  });

  // Bandeau du bas : sécurité, consignes pour demain, historique, comme sur l’image.
  const parts=[
    [20,675,446,'SÉCURITÉ','shield'],
    [477,675,538,'COMMENTAIRES POUR DEMAIN','chat'],
    [1026,675,554,'HISTORIQUE DES RELIQUATS','bars']
  ];
  for(const [x,y,w,title,icon] of parts){
    shadowCard(x,y,w,177,11);
    rr(x,y,w,43,9,P.navy);
    drawIcon(icon,x+14,y+8,29,P.white);
    fit(title,x+55,y+23,w-65,21,P.white,750,'left',16);
  }
  const safety=[
    ['Accidents',val('accidents')],
    ['Situations à signaler',val('alerts')],
    ['Presque-accidents',val('nearmiss')]
  ];
  safety.forEach(([label,value],i)=>{
    const y=729+i*37;
    rr(33,y,420,33,7,'#f0f6f8');
    fit(label,46,y+17,320,15,P.navy,600);
    rr(385,y+3,58,27,6,value==='0'?'#e5f5e9':'#e1edf3');
    txt(value===''?'—':value,414,y+17,23,value==='0'?P.green:P.navy,800,'center');
  });
  rr(492,728,507,112,8,'#f3f8fa');
  const comment=val('comments')||'Aucune consigne saisie';
  const words=comment.replace(/\s+/g,' ').trim().split(/\s+/);
  let rows=[],row='';
  c.font='17px Arial';
  for(const word of words){
    const maybe=row?row+' '+word:word;
    if(c.measureText(maybe).width>475 && row){rows.push(row);row=word;}
    else row=maybe;
  }
  if(row)rows.push(row);
  for(let i=0;i<Math.min(rows.length,5);i++){
    const v=i===4 && rows.length>5?rows[i].slice(0,38)+'…':rows[i];
    txt(v,505,748+i*20,17,P.ink,500);
  }
  rr(1040,726,526,116,8,'#fafcfd');
  const historyPoints=history();
  if(historyPoints.length===0){
    txt('Historique disponible après les premiers bilans.',
      1305,795,16,P.muted,500,'center');
  }else{
    rr(1386,727,10,10,2,P.green);
    txt('UAG',1403,732,13,P.navy,700);
    rr(1470,727,10,10,2,P.blue);
    txt('UAD',1487,732,13,P.navy,700);
    const left=1075,right=1548,base=824,top=753;
    const all=historyPoints.flatMap(([,r])=>[+r.l_picks||0,+r.r_picks||0]);
    const max=Math.max(1,...all)*1.14;
    for(let i=0;i<4;i++){
      const y=base-i*(base-top)/3;
      line(left,y,right,y,'#dae6ec',1);
    }
    const slot=(right-left)/historyPoints.length;
    const bw=Math.min(22,Math.max(10,slot*.23));
    historyPoints.forEach(([day,r],i)=>{
      const mid=left+(i+.5)*slot;
      [[+r.l_picks||0,P.green,-bw-2],[+r.r_picks||0,P.blue,2]].forEach(([n,color,delta])=>{
        const hh=(n/max)*(base-top);
        if(hh>0.1)rr(mid+delta,base-hh,bw,hh,1.5,color);
      });
      txt(day.slice(8,10)+'/'+day.slice(5,7),mid,838,12,P.muted,550,'center');
    });
  }
  line(20,870,1580,870,'#cfdde3');
  txt('ENTREPÔT VALENCE  |  Performance  ·  Sécurité  ·  Passation managers',
      27,886,15,P.navy,600);
  line(1030,885,1378,885,'#77ba33',4);
  txt('ENSEMBLE, PLUS LOIN !',1574,884,16,P.green,800,'right');
  return board;
};
