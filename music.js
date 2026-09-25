
  /* "Twenty-Three" — valse musette. Bass on the one, chords on two and
     three, and a detuned accordion carrying the tune. The birthday song
     (public domain, from Good Morning to All, 1893) is already a waltz,
     so it sits here without being forced. */
  window.__cardMusic = (function () {
    var BPM=156, BEAT=60/BPM, BAR=BEAT*3;
    /* arrives at full voice, then draws back over half a minute to a level
       you could hold a conversation over */
    var LOUD=0.30, LIGHT=0.055, HOLD=3.2, SETTLE=30;
    /* twelve bars of 3/4 */
    var CHORDS=[[65,69,72],[65,69,72],[64,67,70],[64,67,70],
                [65,69,72],[70,74,77],[65,69,72],[64,67,70],
                [65,69,72],[65,69,72],[64,67,70],[65,69,72]];
    var ROOTS=[41,41,36,36,41,34,41,36,41,41,36,41];
    var N=null;
    var TUNE=[
      [[65,2,0.5],[65,2.5,0.5]],
      [[67,0,1],[65,1,1],[70,2,1]],
      [[69,0,2],[65,2,0.5],[65,2.5,0.5]],
      [[67,0,1],[65,1,1],[72,2,1]],
      [[70,0,2],[65,2,0.5],[65,2.5,0.5]],
      [[77,0,1],[74,1,1],[70,2,1]],
      [[69,0,1],[67,1,1],[75,2,0.5],[75,2.5,0.5]],
      [[74,0,1],[70,1,1],[72,2,1]],
      [[70,0,3]],
      N,N,N];
    var ctx=null,master=null,wet=null,noise=null,timer=null,nextBar=0,bar=0,playing=false,ducked=false;
    function hz(m){return 440*Math.pow(2,(m-69)/12);}
    function build(){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      try{ctx=new AC();}catch(e){return false;}
      master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
      var len=Math.floor(ctx.sampleRate*1.6),buf=ctx.createBuffer(2,len,ctx.sampleRate);
      for(var c=0;c<2;c++){var d=buf.getChannelData(c);
        for(var i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4);}
      var v=ctx.createConvolver();v.buffer=buf;wet=ctx.createGain();wet.gain.value=0.30;
      wet.connect(v);v.connect(master);
      var nl=Math.floor(ctx.sampleRate);noise=ctx.createBuffer(1,nl,ctx.sampleRate);
      var nd=noise.getChannelData(0);for(var j=0;j<nl;j++)nd[j]=Math.random()*2-1;return true;}
    function brush(at,lv){var s=ctx.createBufferSource();s.buffer=noise;
      var bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=5200;bp.Q.value=0.5;
      var g=ctx.createGain();g.gain.setValueAtTime(lv,at);
      g.gain.exponentialRampToValueAtTime(0.0001,at+0.07);
      s.connect(bp);bp.connect(g);g.connect(master);s.start(at);s.stop(at+0.1);}
    /* the accordion: reeds slightly out of tune with each other, and a slow
       tremolo over the top — that beating is the whole musette sound */
    function reed(m,at,dur,lv){
      var g=ctx.createGain();
      var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3000;lp.Q.value=0.8;
      var cents=[-16,0,16];
      for(var k=0;k<cents.length;k++){
        var o=ctx.createOscillator();o.type='sawtooth';
        o.frequency.value=hz(m);o.detune.value=cents[k];
        var og=ctx.createGain();og.gain.value=0.3;
        o.connect(og);og.connect(lp);o.start(at);o.stop(at+dur+0.05);
      }
      var sq=ctx.createOscillator();sq.type='square';sq.frequency.value=hz(m);
      var sg=ctx.createGain();sg.gain.value=0.10;sq.connect(sg);sg.connect(lp);
      sq.start(at);sq.stop(at+dur+0.05);
      var trem=ctx.createOscillator();trem.type='sine';trem.frequency.value=5.2;
      var td=ctx.createGain();td.gain.value=0.10;
      trem.connect(td);td.connect(g.gain);trem.start(at);trem.stop(at+dur+0.05);
      g.gain.setValueAtTime(0.0001,at);
      g.gain.linearRampToValueAtTime(lv,at+0.05);
      g.gain.setValueAtTime(lv,at+dur*0.8);
      g.gain.linearRampToValueAtTime(0.0001,at+dur);
      lp.connect(g);g.connect(master);g.connect(wet);}
    function bassN(m,at,dur,lv){var g=ctx.createGain();
      var lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;
      var o=ctx.createOscillator();o.type='triangle';o.frequency.value=hz(m);o.connect(lp);
      o.start(at);o.stop(at+dur+0.04);
      g.gain.setValueAtTime(0.0001,at);g.gain.exponentialRampToValueAtTime(lv,at+0.012);
      g.gain.exponentialRampToValueAtTime(0.0001,at+dur);
      lp.connect(g);g.connect(master);}
    /* guitar chop on two and three */
    function chop(notes,at,dur,lv){var g=ctx.createGain();
      var lp=ctx.createBiquadFilter();lp.type='lowpass';
      lp.frequency.setValueAtTime(2600,at);lp.frequency.exponentialRampToValueAtTime(800,at+dur);
      for(var i=0;i<notes.length;i++){var o=ctx.createOscillator();
        o.type='triangle';o.frequency.value=hz(notes[i]);
        var og=ctx.createGain();og.gain.value=0.4;o.connect(og);og.connect(lp);
        o.start(at+i*0.006);o.stop(at+dur+0.04);}
      g.gain.setValueAtTime(0.0001,at);g.gain.exponentialRampToValueAtTime(lv,at+0.006);
      g.gain.exponentialRampToValueAtTime(0.0001,at+dur);
      lp.connect(g);g.connect(master);g.connect(wet);}
    function scheduleBar(n,at){var i=n%12,chord=CHORDS[i],root=ROOTS[i];
      bassN(root,at,BEAT*0.8,0.26);
      chop(chord,at+BEAT,BEAT*0.42,0.12);
      chop(chord,at+BEAT*2,BEAT*0.42,0.12);
      brush(at+BEAT,0.05);brush(at+BEAT*2,0.05);
      var line=TUNE[i];
      if(line)for(var m=0;m<line.length;m++)
        reed(line[m][0],at+line[m][1]*BEAT,line[m][2]*BEAT*0.95,0.18);}
    function tick(){while(nextBar<ctx.currentTime+1.5){
      if(nextBar<ctx.currentTime)nextBar=ctx.currentTime+0.05;
      scheduleBar(bar,nextBar);nextBar+=BAR;bar++;}}
    function fade(to,se){var now=ctx.currentTime;master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001,master.gain.value),now);
      master.gain.linearRampToValueAtTime(to,now+se);}
    /* the shape of the whole thing: in loud, hold, then ease away */
    function arc(){
      var now=ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(0.0001,now);
      master.gain.linearRampToValueAtTime(LOUD,now+1.3);
      master.gain.setValueAtTime(LOUD,now+HOLD);
      master.gain.linearRampToValueAtTime(LIGHT,now+HOLD+SETTLE);
    }
    /* iPhones will not make a sound until one has actually been started
       inside the gesture itself. A single silent sample does it. */
    function unlock(){
      try{
        var b=ctx.createBuffer(1,1,22050), sN=ctx.createBufferSource();
        sN.buffer=b; sN.connect(ctx.destination); sN.start(0);
      }catch(e){}
    }
    function begin(){
      if(playing){ if(!ducked)arc(); announce(); return; }
      playing=true; bar=0; nextBar=ctx.currentTime+0.1;
      tick(); timer=setInterval(tick,300);
      if(!ducked)arc();
      announce();
    }
    function start(){
      if(!ctx&&!build())return;
      unlock();
      /* only start laying notes down once the context is really awake,
         or they get scheduled against a clock that is not moving */
      if(ctx.state==='suspended'){
        var pr=ctx.resume();
        if(pr&&pr.then){ pr.then(begin)['catch'](function(){}); } else { begin(); }
      } else { begin(); }
    }
    function stop(){if(!playing)return;playing=false;clearInterval(timer);timer=null;
      fade(0.0001,0.8);setTimeout(function(){if(!playing&&ctx)ctx.suspend();},1000);announce();}
    var btn=null;
    function announce(){
      if(!btn)btn=document.getElementById('music');
      if(!btn)return;
      /* say "playing" only when sound is genuinely coming out */
      var live = playing && !!ctx && ctx.state==='running';
      btn.setAttribute('aria-pressed', live?'true':'false');
      btn.setAttribute('aria-label', live?'Stop the music':'Play the music');
      if(live) btn.classList.remove('waiting');
    }
    return {toggle:function(){playing?stop():start();},start:start,
      isPlaying:function(){return playing;},
      running:function(){return !!ctx&&ctx.state==='running';},
      duck:function(){ducked=true;if(playing)fade(0.0001,0.4);},
      unduck:function(){ducked=false;if(playing)fade(LIGHT,1.2);}};
  })();

