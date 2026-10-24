
/* Export premium Entrepôt Valence — v1, visuel fidèle au modèle validé.
   Données réelles uniquement, aucune valeur d'historique inventée.
   Cette surcouche ne modifie pas la saisie et le partage mobiles. */
renderCanvas = function renderPremiumBilan(){
  recalc();
  const W=1600, H=1000, scale=1.5;
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

  rr(0,0,W,H,0,P.bg);
  // True Valence warehouse photos supplied by the user.
  shadowCard(20,14,1560,168,13);
  c.save();c.beginPath();c.roundRect(23,17,1554,162,10);c.clip();
  photo(img,520,17,525,162,0);
  photo(aerial,1043,17,534,162,0);
  const fog=c.createLinearGradient(160,0,795,0);
  fog.addColorStop(0,'rgba(255,255,255,1)');
  fog.addColorStop(.56,'rgba(255,255,255,1)');
  fog.addColorStop(.99,'rgba(255,255,255,0)');
  c.fillStyle=fog;c.fillRect(20,17,795,162);
  const shade=c.createLinearGradient(0,20,0,180);
  shade.addColorStop(0,'rgba(17,42,60,0)');shade.addColorStop(1,'rgba(17,42,60,.16)');
  c.fillStyle=shade;c.fillRect(770,17,807,162);
  c.restore();
  // Compact Leroy Merlin-inspired brand block, with authentic site photography.
  c.beginPath();c.moveTo(36,40);c.lineTo(77,40);c.lineTo(56.5,21);c.closePath();
  c.fillStyle='#70bc34';c.fill();
  txt('LEROY MERLIN',88,36,19,P.ink,700);
  txt('LOGISTIQUE',88,56,12,P.green,700);
  txt('ENTREPÔT VALENCE',38,100,42,P.ink,800);
  txt('BILAN DE FIN DE JOURNÉE',40,135,29,P.green,800);
  txt('UAD / UAG  ·  Équipe après-midi',40,164,17,P.muted,500);
  rr(1280,32,280,79,11,'rgba(16,43,64,.95)');
  drawIcon('calendar',1299,46,32,'#ffffff');
  txt(dt($('date').value),1442,61,27,P.white,700,'center');
  txt('Passation aux équipes du matin',1440,91,14,'#d9e7ed',500,'center');

  // 2 main areas as approved.
  blockTitle(20,197,765,'RÉCEPTION & 2RP','truck');
  blockTitle(801,197,779,'PRÉPARATION  ·  RELIQUATS','box');
  shadowCard(20,251,374,356);shadowCard(406,251,379,356);
  shadowCard(801,251,380,356);shadowCard(1193,251,387,356);
  unitTitle(26,257,362,'UA GAUCHE  ·  UAD',P.green);
  unitTitle(412,257,367,'UA DROITE  ·  UAG',P.blue);
  unitTitle(807,257,368,'UA GAUCHE  ·  UAD',P.green);
  unitTitle(1199,257,375,'UA DROITE  ·  UAG',P.blue);

  function reception(x,side,color,fill,totalW){
    txt('RÉCEPTION',x+12,321,18,P.ink,750);
    line(x+12,337,x+totalW-12,337);
    const w=(totalW-34)/3;
    const cols=[['BR2',side+'_br2','pallet'],['Camions',side+'_cam','truck'],
      ['Conteneurs',side+'_cont','box']];
    cols.forEach(([name,key,icon],i)=>{
      metric(x+8+i*(w+5),346,w,100,name,fnum(num(key)),fill,color,icon,35);
    });
    txt('2RP',x+12,472,19,P.ink,750);
    txt('PH + Rangement',x+64,474,14,P.muted,500);
    line(x+12,491,x+totalW-12,491);
    const vals=[['PH',fnum(num(side+'_ph'))],['Rangement',fnum(num(side+'_rang'))],
      ['Total 2RP',fnum(pairTotal(side))]];
    vals.forEach(([name,value],i)=>{
      const bx=x+8+i*(w+5);
      const fl=i===2?(side==='l'?'#e4f4e7':'#e2effe'):fill;
      metric(bx,501,w,94,name,value,fl,color,i===2?'bars':i===0?'box':'pallet',34);
    });
  }
  reception(26,'l',P.green,P.greenBg,362);
  reception(412,'r',P.blue,P.blueBg,367);

  function preparation(x,side,color,fill,w){
    const data=[
      ['Prises restantes',fnum(num(side+'_picks')),'box'],
      ['Heures restantes',num(side+'_hours')===null?'—':fnum(num(side+'_hours'))+' h','clock'],
      ['Fin prévue demain',hour(side+'_end'),'flag']
    ];
    data.forEach(([title,value,icon],i)=>{
      const yy=311+i*96;
      rr(x,yy,w,87,11,fill);
      drawIcon(icon,x+15,yy+24,33,color);
      fit(title,x+57,yy+26,w-68,17,P.muted,600,'left',13);
      fit(value,x+w-17,yy+62,w-33,40,color,800,'right',25);
    });
  }
  preparation(807,'l',P.green,P.greenBg,368);
  preparation(1199,'r',P.blue,P.blueBg,375);

  // The totals are derived from typed values, never filled with example data.
  shadowCard(20,620,1560,112,12);
  rr(26,626,1548,100,10,grad(626,100,'#f6fafc','#ebf2f5'));
  const sums=[
    ['PRISES RESTANTES  ·  TOTAL',fnum(both(num('l_picks'),num('r_picks'))),'box'],
    ['HEURES RESTANTES  ·  TOTAL',both(num('l_hours'),num('r_hours'))===null?'—':fnum(both(num('l_hours'),num('r_hours')))+' h','clock'],
    ['FIN PRÉVISIONNELLE  ·  DEMAIN',hour('globalEnd'),'flag']
  ];
  sums.forEach(([label,value,icon],i)=>{
    const x=34+i*517;
    if(i)line(x-10,638,x-10,715,'#cddce3',2);
    drawIcon(icon,x+28,654,45,P.navy);
    fit(label,x+91,651,401,17,P.muted,700);
    fit(value,x+91,692,401,45,P.ink,800);
  });

  // End-of-day reading: security, notes and historical picks on one line.
  const areas=[
    [20,746,405,'SÉCURITÉ','shield'],
    [438,746,591,'COMMENTAIRES POUR DEMAIN','chat'],
    [1042,746,538,'HISTORIQUE DES RELIQUATS','bars']
  ];
  for(const [x,y,w,title,icon] of areas){
    shadowCard(x,y,w,207,11);
    rr(x,y,w,45,9,P.navy);
    drawIcon(icon,x+13,y+7,31,P.white);
    fit(title,x+56,y+24,w-70,22,P.white,700,'left',16);
  }
  const safety=[
    ['Accidents',val('accidents')],
    ['Situations à signaler',val('alerts')],
    ['Presque-accidents',val('nearmiss')]
  ];
  safety.forEach(([label,value],i)=>{
    const yy=801+i*47;
    rr(30,yy,385,41,8,i%2===0?'#f1f6f8':'#f8fafb');
    fit(label,46,yy+21,285,16,P.ink,600);
    rr(347,yy+5,58,31,7,value==='0'?'#e4f3e8':'#e7eef3');
    txt(value===''?'—':value,376,yy+21,23,value==='0'?P.green:P.navy,750,'center');
  });
  rr(451,802,565,139,9,'#f5f9fa');
  const comments=val('comments')||'Aucune consigne saisie';
  const words=comments.replace(/\s+/g,' ').trim().split(' ');
  const textX=469,textRight=995;
  const lines=[];let current='';
  c.font='18px Arial';
  words.forEach(word=>{
    const candidate=current?current+' '+word:word;
    if(c.measureText(candidate).width>textRight-textX && current){
      lines.push(current);current=word;
    }else current=candidate;
  });
  if(current)lines.push(current);
  lines.slice(0,6).forEach((v,i)=>{
    if(i===5 && lines.length>6) v=v.replace(/.{0,3}$/,'…');
    txt(v,textX,827+i*20,18,P.ink,500);
  });

  rr(1055,800,512,140,10,'#f9fbfc');
  const hist=history();
  if(hist.length===0){
    txt('L’historique se construit au fil des bilans.',1310,863,18,P.muted,500,'center');
  }else{
    rr(1373,801,10,10,2,P.green);
    txt('UAD',1390,808,13,P.muted,700);
    rr(1455,801,10,10,2,P.blue);
    txt('UAG',1472,808,13,P.muted,700);
    const left=1096,right=1553,top=831,base=918;
    const vals=hist.flatMap(([,r])=>[Number(r.l_picks)||0,Number(r.r_picks)||0]);
    const max=Math.max(1,...vals)*1.16;
    for(let i=0;i<3;i++){
      const yy=base-i*43;
      line(left,yy,right,yy,'#dbe5e9',1);
    }
    const slot=(right-left)/hist.length;
    const bw=Math.min(23,Math.max(11,slot*.24));
    hist.forEach(([day,r],i)=>{
      const mid=left+(i+.5)*slot;
      [[+r.l_picks||0,P.green,-bw-3],[+r.r_picks||0,P.blue,3]].forEach(([n,color,dx])=>{
        const hh=Math.max(n>0?1:0,(n/max)*82);
        rr(mid+dx,base-hh,bw,hh,2,color);
      });
      txt(day.slice(8,10)+'/'+day.slice(5,7),mid,934,13,P.muted,500,'center');
    });
  }
  line(20,969,1580,969,'#cfdde3');
  txt('ENTREPÔT VALENCE  •  Performance  ·  Sécurité  ·  Passation managers',26,984,15,P.muted,600);
  line(965,985,1310,985,'#80bb41',4);
  txt('ENSEMBLE, PLUS LOIN !',1575,984,15,P.green,800,'right');
  return board;
};
