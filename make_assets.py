"""Generate original procedural PIKOPIA loop and bespoke mascot app icons."""
import numpy as np, wave
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
out=Path(__file__).parent/'www'/'assets';out.mkdir(exist_ok=True)
sr=22050;bpm=122;beat=60/bpm; bars=8;dur=bars*4*beat;n=int((dur+0.13)*sr)
track=np.zeros(n,dtype=np.float64)
rng=np.random.default_rng(327)
def hz(midi):return 440*2**((midi-69)/12)
def note(t,midi,beats=.4,vol=.08,kind='bell'):
    start=int(t*sr); length=int(min(beats*beat, dur-t)*sr)
    if length<=0:return
    x=np.arange(length)/sr; f=hz(midi)
    if kind=='bell':
        sig=(np.sin(2*np.pi*f*x)+.20*np.sin(2*np.pi*2*f*x)+.08*np.sin(2*np.pi*3.02*f*x))*np.exp(-5*x/max(.17,length/sr))
    elif kind=='bass':
        sig=(np.sin(2*np.pi*f*x)+.18*np.sin(2*np.pi*2*f*x))*np.minimum(1,x*80)*np.exp(-3*x/max(.25,length/sr))
    else:
        sig=(np.sin(2*np.pi*f*x)+.12*np.sin(2*np.pi*2*f*x))*np.minimum(1,x*60)*np.exp(-3.6*x/max(.1,length/sr))
    track[start:start+length]+=vol*sig
def drum(t,typ):
    start=int(t*sr); length=min(int(.15*sr),n-start)
    if length<=0:return
    x=np.arange(length)/sr
    if typ=='kick': sig=np.sin(2*np.pi*(92-35*x)*x)*np.exp(-48*x)*.13
    elif typ=='hat': sig=rng.normal(size=length)*np.exp(-75*x)*.028
    else: sig=rng.normal(size=length)*np.exp(-35*x)*.046
    track[start:start+length]+=sig
chords=[[62,66,69,74],[59,62,66,71],[55,59,62,67],[57,61,64,69]]
melody=[74,78,81,78,76,74,71,74, 71,74,78,74,69,71,74,76,
        79,78,74,71,74,76,78,74, 76,73,69,73,76,78,76,73,
        74,81,78,76,74,78,81,86, 83,81,78,74,71,74,78,81,
        79,74,76,78,79,83,81,79, 76,73,76,78,81,78,74,73]
for bar in range(bars):
    chord=chords[bar%4]
    t=bar*4*beat
    note(t,chord[0]-12,2.8,.16,'bass')
    note(t+2*beat,chord[2]-12,1.7,.10,'bass')
    for j in range(8):
        arpn=chord[[0,2,1,3,1,2,0,3][j]]
        note(t+j*.5*beat,arpn, .38, .06,'bell')
    for j in range(4):
        drum(t+j*beat,'kick' if j in [0,2] else 'hat')
    drum(t+beat,'clap');drum(t+3*beat,'clap')
    for j in range(4):drum(t+(j+.5)*beat,'hat')
for i,mid in enumerate(melody):note(i*.5*beat,mid,.34,.055,'lead')
fade_n=int(.10*sr)
track[-fade_n:]*=np.linspace(1,0,fade_n)
peak=np.max(np.abs(track));track=track*min(.90/peak,1.0)
samples=np.int16(np.clip(track,-1,1)*32767)
with wave.open(str(out/'bgm-pikopia.wav'),'wb') as f:
    f.setnchannels(1);f.setsampwidth(2);f.setframerate(sr);f.writeframes(samples.tobytes())
for size in [192,512]:
  K=4;S=size*K;im=Image.new('RGB',(S,S),(71,55,144));d=ImageDraw.Draw(im)
  d.ellipse((-S//2,-S//3,S//2,S//2),fill=(99,76,173))
  d.ellipse((S*.48,-S*.12,S*1.12,S*.58),fill=(86,64,162))
  # Original 'Piko': geometric prism bird, dark edge and golden faceted body
  def poly(coords,fill,width=0,stroke=(48,35,78)):
    coords=[(int(x*S),int(y*S)) for x,y in coords]
    d.polygon(coords,fill=fill)
    if width:d.line(coords+[coords[0]],fill=stroke,width=width*K,joint='curve')
  poly([(0.35,.43),(.07,.31),(.22,.73),(.39,.68)],(92,219,221),4)
  poly([(.65,.43),(.93,.31),(.78,.73),(.61,.68)],(92,177,231),4)
  poly([(.50,.11),(.75,.32),(.82,.61),(.71,.81),(.5,.9),(.29,.81),(.18,.61),(.25,.32)],(255,213,125),6)
  poly([(.50,.13),(.75,.32),(.50,.38),(.25,.32)],(255,239,173),0)
  poly([(.25,.32),(.5,.38),(.5,.9),(.29,.81),(.18,.61)],(255,195,121),0)
  poly([(.5,.11),(.54,.01),(.62,.12)],(255,136,178),4)
  d.arc((int(.31*S),int(.41*S),int(.48*S),int(.53*S)),0,180,fill=(47,35,73),width=6*K)
  d.arc((int(.53*S),int(.41*S),int(.70*S),int(.53*S)),0,180,fill=(47,35,73),width=6*K)
  d.ellipse((int(.25*S),int(.55*S),int(.36*S),int(.62*S)),fill=(255,146,166))
  d.ellipse((int(.64*S),int(.55*S),int(.75*S),int(.62*S)),fill=(255,146,166))
  d.arc((int(.45*S),int(.58*S),int(.57*S),int(.67*S)),10,170,fill=(47,35,73),width=4*K)
  poly([(.50,.23),(.53,.30),(.6,.31),(.55,.36),(.56,.43),(.5,.39),(.44,.43),(.45,.36),(.40,.31),(.47,.30)],(255,255,251),1,stroke=(234,140,137))
  im.resize((size,size),Image.Resampling.LANCZOS).save(out/f'icon-{size}.png')
print('assets created',[(p.name,p.stat().st_size) for p in out.iterdir()])
