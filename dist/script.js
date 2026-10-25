(() => {
  const canvas = document.querySelector('#sprinkles');
  const ctx = canvas.getContext('2d');
  const hero = document.querySelector('.hero');
  const logo = document.querySelector('.logo-wrap');
  const motion = document.querySelector('.motion');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['#ec008c','#0fb4d0','#ffd500','#8cc13a','#9c217c','#989998'];
  let paused = preference.matches, w=0,h=0,particles=[],frame=0,previous=0,time=0;
  let pointer={x:-9999,y:-9999}, scrollY=window.scrollY,targetScroll=scrollY;
  let ripples=[],bounce=0,bounceV=0,lean=0,seed=94,extra=0;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  // Both the homepage and shower use the same curved stroke.
  function paintSprinkle(context,p){
    context.strokeStyle=p.color;context.lineWidth=p.width;context.lineCap='round';
    context.beginPath();context.moveTo(-p.len/2,-1);
    context.quadraticCurveTo(0,p.spin*8,p.len/2,1);context.stroke();
  }
  function resize(){
    w=innerWidth;h=hero.offsetHeight;seed=94;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.height=`${h}px`;ctx.setTransform(dpr,0,0,dpr,0,0);
    const spacing=Math.max(74,Math.min(110,Math.min(w,h)*.145));
    const count=Math.round((w+32)*(h+32)/(spacing*spacing*.86)*(1+extra*.25));
    particles=[];
    // Sample the emptiest space, giving each sprinkle room to dance.
    for(let i=0;i<count;i++){
      let best=null,bestDistance=-1;
      for(let attempt=0;attempt<60;attempt++){
        const point={x:random()*(w+32)-16,y:random()*(h+32)-16};
        let distance=Infinity;
        for(const other of particles)distance=Math.min(distance,(point.x-other.x)**2+(point.y-other.y)**2);
        if(distance>bestDistance){best=point;bestDistance=distance}
      }
      particles.push({...best,len:24+random()*5,width:5.3+random()*.5,angle:random()*Math.PI,depth:.3+random()*.7,color:colors[i%colors.length],dx:0,dy:0,phase:random()*Math.PI*2,spin:(random()-.5)*.65});
    }
    draw(0);
  }
  function draw(dt){
    ctx.clearRect(0,0,w,h);
    const progress=Math.min(scrollY/h,1),active=!paused;
    for(const p of particles){
      const side=p.x<w/2?-1:1;
      const driftX=active?Math.sin(time*.85+p.phase)*(5+9*p.depth):0;
      const driftY=active?Math.cos(time*.72+p.phase*1.7)*(5+9*p.depth):0;
      const x=p.x+driftX+(active?side*progress*progress*w*.26*p.depth:0);
      const y=p.y+driftY-(active?scrollY*p.depth*.35:0);
      const dist=Math.hypot(x-pointer.x,y-pointer.y);
      let tx=0,ty=0,twist=0;
      if(active&&dist<145&&dist>0){const force=(1-dist/145)**2*48;tx=(x-pointer.x)/dist*force;ty=(y-pointer.y)/dist*force}
      p.dx+=(tx-p.dx)*(1-Math.exp(-dt*9));p.dy+=(ty-p.dy)*(1-Math.exp(-dt*9));
      let rx=0,ry=0;
      if(active)for(const ripple of ripples){
        const distance=Math.hypot(p.x-ripple.x,p.y-ripple.y);
        const age=time-ripple.time-distance/850;
        if(age>0&&age<2.8){const wave=Math.sin(age*9)*Math.exp(-age*2.6)*ripple.strength;rx+=(p.x-ripple.x)/Math.max(distance,1)*wave;ry+=(p.y-ripple.y)/Math.max(distance,1)*wave;twist+=wave*.013}
      }
      ctx.save();ctx.translate(x+p.dx+rx,y+p.dy+ry);
      ctx.rotate(p.angle+(active?Math.sin(time*.95+p.phase)*.24+progress*p.spin*5+twist:0));
      paintSprinkle(ctx,p);ctx.restore();
    }
    if(active){
      // Damped spring: a soft squash, overshoot, then a quiet return to rest.
      bounceV+=(-150*bounce-13*bounceV)*dt;bounce+=bounceV*dt;
      const aim=pointer.x<0?0:Math.max(-1,Math.min(1,(pointer.x-w/2)/(w/2)));
      lean+=(aim-lean)*(1-Math.exp(-dt*4));
      const float=Math.sin(time*1.15)*8;
      const rock=Math.sin(time*.72)*1.7+lean*2.3+bounce*16;
      const sx=(1-bounce*.38)*(1-progress*.1),sy=(1+bounce*.48)*(1-progress*.1);
      logo.style.transform=`translateY(${float+Math.min(scrollY*.1,65)}px) rotate(${rock}deg) scale(${sx},${sy})`;
    }else logo.style.transform='';
  }
  function tick(t){const dt=Math.min((t-previous)/1000,.025);previous=t;time+=dt;scrollY+=(targetScroll-scrollY)*(1-Math.exp(-dt*12));ripples=ripples.filter(r=>time-r.time<4.5);draw(dt);frame=requestAnimationFrame(tick)}
  function syncMotion(){
    cancelAnimationFrame(frame);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Play motion':'Pause motion';document.documentElement.classList.toggle('motion-paused',paused);
    if(paused){ripples=[];bounce=0;bounceV=0;pointer={x:-9999,y:-9999};particles.forEach(p=>{p.dx=0;p.dy=0});draw(0)}
    else if(!document.hidden){previous=performance.now();frame=requestAnimationFrame(tick)}
  }
  hero.addEventListener('click',e=>{
    if(paused||e.target.closest('.hero-bottom'))return;
    const onLogo=logo.contains(e.target);
    const bounds=logo.getBoundingClientRect();
    const x=e.detail===0?bounds.x+bounds.width/2:e.clientX;
    const y=(e.detail===0?bounds.y+bounds.height/2:e.clientY)+window.scrollY;
    ripples.push({x,y,time,strength:onLogo?105:75});ripples=ripples.slice(-5);
    if(onLogo)bounceV=Math.max(-5,bounceV-4.2);
  });
  document.querySelector('.more').addEventListener('click',e=>{
    extra=extra>=4?0:extra+1;
    resize();
    if(!paused)ripples.push({x:e.clientX,y:e.clientY+window.scrollY,time,strength:70});
    document.querySelector('.more').innerHTML=extra>=4?'<span aria-hidden="true">↺</span> Reset sprinkles':'<span aria-hidden="true">↝</span> Extra sprinkles?';
    document.querySelector('#sprinkle-status').textContent=extra?'Extra sprinkles added.':'Original sprinkles restored.';
  });
  motion.addEventListener('click',()=>{paused=!paused;syncMotion()});
  preference.addEventListener('change',e=>{paused=e.matches;syncMotion()});
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse')pointer={x:e.clientX,y:e.clientY+window.scrollY}},{passive:true});
  document.addEventListener('pointerleave',()=>{pointer={x:-9999,y:-9999}});
  addEventListener('scroll',()=>{targetScroll=window.scrollY},{passive:true});
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',syncMotion);
  const film=document.querySelector('.film');
  const cinema=document.querySelector('.cinema');
  if(film){
    film.addEventListener('play',()=>cinema.classList.add('is-playing'));
    for(const event of ['pause','ended'])film.addEventListener(event,()=>cinema.classList.remove('is-playing'));
    new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&!film.paused)film.pause()},{threshold:0}).observe(film);
  }

  const stallPhoto=document.querySelector('.stall-photo');
  let showerCanvas=null,showerFrame=0;
  function clearShower(){
    cancelAnimationFrame(showerFrame);showerFrame=0;
    showerCanvas?.remove();showerCanvas=null;
  }
  stallPhoto?.addEventListener('click',()=>{
    clearShower();
    if(paused||preference.matches)return;
    const overlay=document.createElement('canvas');
    overlay.className='stall-shower';overlay.setAttribute('aria-hidden','true');
    overlay.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:20';
    const width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
    overlay.width=width*dpr;overlay.height=height*dpr;
    const context=overlay.getContext('2d');
    context.setTransform(dpr,0,0,dpr,0,0);
    document.body.append(overlay);showerCanvas=overlay;
    const count=Math.max(65,Math.min(150,Math.round(width*height/9000)));
    const rain=Array.from({length:count},(_,i)=>({
      x:(i+.5)/count*width,delay:Math.random()*1500,duration:2400+Math.random()*1000,
      len:24+Math.random()*5,width:5.3+Math.random()*.5,
      spin:(Math.random()-.5)*.65,color:colors[i%colors.length],
      angle:Math.random()*Math.PI,drift:(Math.random()-.5)*90
    }));
    let started=null;
    function fall(now){
      if(started===null)started=now;
      const elapsed=now-started;
      context.clearRect(0,0,width,height);
      let remaining=false;
      for(const p of rain){
        const progress=(elapsed-p.delay)/p.duration;
        if(progress<1)remaining=true;
        if(progress<0||progress>1)continue;
        const x=(p.x+Math.sin(progress*Math.PI)*p.drift+width)%width;
        const y=-35+(height+70)*(progress*.7+progress*progress*.3);
        context.save();context.translate(x,y);context.rotate(p.angle+progress*p.spin*4);
        paintSprinkle(context,p);context.restore();
      }
      if(remaining)showerFrame=requestAnimationFrame(fall);else clearShower();
    }
    showerFrame=requestAnimationFrame(fall);
    document.querySelector('#sprinkle-status').textContent='A sprinkle shower!';
  });
  motion.addEventListener('click',clearShower);
  preference.addEventListener('change',clearShower);
  addEventListener('resize',clearShower,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearShower()});

  resize();syncMotion();
})();


