/**
 * @typedef {'low'|'medium'|'high'} FestivalIntensity
 * @typedef {{part:string,effect:string,at:number,duration:number,stagger?:number}} EntranceStage
 * @typedef {{id:string,name:string,greeting:string,teluguGreeting?:string,message:string,motif:string,
 * colors:{deep:string,accent:string,tint:string,gold:string,petal:string,leaf:string},
 * assets:{module:string,motif:string},heroAnimation:{id:string,durationMs:number,stages:EntranceStage[]},
 * pageEffects:{primary:string,secondary:string,pattern:string},greetingVariants?:Record<string,{greeting:string,teluguGreeting?:string}>,
 * effect:string}} FestivalTheme
 * @typedef {{enabled:boolean,festival:string,intensity:FestivalIntensity,greetingVariant:string}} FestivalSettings
 */
export const FESTIVAL_INTENSITIES=Object.freeze({
  low: Object.freeze({label:'Minimal',edges:2,sections:2,headings:2,particles:3}),
  medium: Object.freeze({label:'Subtle',edges:4,sections:3,headings:4,particles:5}),
  high: Object.freeze({label:'Festive',edges:6,sections:4,headings:6,particles:8}),
});
const stage=(part,effect,at,duration,stagger=0)=>({part,effect,at,duration,stagger});
const theme=(id,name,greeting,teluguGreeting,message,motif,colors,primary,secondary,pattern,animation,stages,effect,extra={})=>Object.freeze({
  id,name,greeting,teluguGreeting,message,motif,
  colors:Object.freeze(Object.fromEntries(['deep','accent','tint','gold','petal','leaf'].map((key,i)=>[key,colors[i]]))),
  assets:Object.freeze({module:'/festival-artwork.js',motif}),
  heroAnimation:Object.freeze({id:animation,durationMs:4200,stages:Object.freeze(stages)}),
  pageEffects:Object.freeze({primary,secondary,pattern}),effect,...extra,
});
/** @type {ReadonlyArray<FestivalTheme>} */
export const FESTIVALS=Object.freeze([
  theme('sankranti','Sankranti','Happy Sankranti!','సంక్రాంతి శుభాకాంక్షలు','A harvest of happiness and joyful journeys.','kite',
    ['#184c70','#226f9b','#f0f8fc','#e9b84e','#e98759','#70a777'],'kite','sun','strings','kite-flight',
    [stage('kite-one','fly-left',0,2300),stage('kite-two','fly-right',450,2200),stage('sun','illuminate',100,3000)],'Two flying kites, golden sunlight and fine kite-string accents'),
  theme('bhogi','Bhogi','Happy Bhogi!','భోగి శుభాకాంక్షలు','Warm wishes for bright new beginnings.','bonfire',
    ['#67391f','#a45724','#fff8ed','#eac06c','#df8647','#82955f'],'ember','spark','warmth','bonfire-glow',
    [stage('flame','kindle',150,2400,180),stage('embers','rise',600,2000)],'A small glowing bonfire, rising embers and warm gold details'),
  theme('pongal','Pongal','Happy Pongal!','','May happiness and prosperity overflow.','pongal',
    ['#315337','#487340','#f7faef','#dfba55','#c97542','#71a957'],'kolam','sugarcane','kolam','pongal-overflow',
    [stage('pot','rise',0,1600),stage('overflow','overflow',800,1700),stage('steam','rise',1500,1700)],'A decorated overflowing Pongal pot, sugarcane and delicate kolam patterns'),
  theme('kanuma','Kanuma','Happy Kanuma!','కనుమ పండుగ శుభాకాంక్షలు','Celebrating the land and the joy of harvest.','cattle',
    ['#43522d','#647537','#faf8ef','#dbad48','#d17a40','#85a65d'],'grain','flower','harvest','harvest-arrival',
    [stage('cattle','arrive',250,2100),stage('leaf','unfold',300,1300,120)],'A decorated cow, marigolds and restrained harvest motifs'),
  theme('maha-shivaratri','Maha Shivaratri','Happy Maha Shivaratri!','మహాశివరాత్రి శుభాకాంక్షలు','May peace and light guide every journey.','trident',
    ['#202e52','#625a96','#f6f6fc','#a6b2cb','#8c79b9','#83a99f'],'moon','star','moonlight','silver-trishul',
    [stage('trishul','draw',100,2400),stage('damaru','reveal',1300,1300),stage('moon','illuminate',200,2600)],'An elegant trishul and damaru, silver moonlight and tiny stars'),
  theme('holi','Holi','Happy Holi!','హోలీ శుభాకాంక్షలు','Colourful days. Joyful journeys.','colours',
    ['#60344f','#a44179','#fff7fb','#e9bd4c','#dd739d','#67b7a0'],'colour','spark','colour','powder-bursts',
    [stage('powder-left','powder-left',100,2300),stage('powder-right','powder-right',700,2200)],'Two soft powder bursts and small translucent corner splashes'),
  theme('ugadi','Ugadi','Happy Ugadi!','ఉగాది శుభాకాంక్షలు','Fresh hopes and wonderful new beginnings.','toran',
    ['#355131','#547536','#f8faef','#d3b24a','#d5a145','#75a350'],'toran','flower','leaves','mango-leaf-unfold',
    [stage('leaf','unfold',100,1600,150),stage('bowl','rise',1000,1500)],'Unfolding mango-leaf torans, spring flowers and an Ugadi greeting'),
  theme('sri-rama-navami','Sri Rama Navami','Happy Sri Rama Navami!','శ్రీరామ నవమి శుభాకాంక్షలు','Wishing every home peace and harmony.','bow',
    ['#683d24','#ab682c','#fff9ef','#dfb355','#d78d49','#91aa67'],'bow','marigold','garland','golden-bow-reveal',
    [stage('bow','draw',100,2200),stage('arrow','arrow',1100,1600),stage('halo','illuminate',500,3000)],'A softly revealed golden bow and arrow with marigold details'),
  theme('hanuman-jayanti','Hanuman Jayanti','Happy Hanuman Jayanti!','హనుమాన్ జయంతి శుభాకాంక్షలు','Wishing you strength and a peaceful path ahead.','gada',
    ['#653c2c','#9c6333','#fff8f0','#d2a551','#c1804c','#8f9e68'],'ribbon','flower','ribbons','gada-radiance',
    [stage('gada','gada',200,2400),stage('rays','illuminate',1200,2500)],'A bronze-gold gada, gentle radiance and fine saffron ribbons'),
  theme('akshaya-tritiya','Akshaya Tritiya','Happy Akshaya Tritiya!','','May good fortune grow with every beginning.','lotus',
    ['#62502b','#8b6e2d','#fffcf1','#c7a04c','#e0be73','#9cae77'],'lotus','spark','lotus','lotus-opening',
    [stage('lotus-petal','lotus',200,2000,170),stage('coins','illuminate',1000,2200)],'A golden lotus opening petal by petal with a restrained shimmer'),
  theme('raksha-bandhan','Raksha Bandhan','Happy Raksha Bandhan!','','Celebrating bonds that travel with us.','rakhi',
    ['#663a43','#a3455c','#fff6f6','#cfad63','#d77f94','#a1ad73'],'rakhi','thread','threads','rakhi-turn',
    [stage('rakhi','rakhi',100,2400),stage('thread','draw',400,2200)],'A gently turning rakhi and delicate red-and-gold thread borders'),
  theme('krishna-janmashtami','Krishna Janmashtami','Happy Krishna Janmashtami!','కృష్ణాష్టమి శుభాకాంక్షలు','May joy and laughter fill your home.','flute',
    ['#254959','#39777b','#f3faf8','#c6a956','#cc9d60','#59a58c'],'feather','flute','feathers','flute-and-feather',
    [stage('flute','flute',100,1800),stage('feather','feather',1100,2200),stage('notes','rise',1600,1600)],'A golden flute followed by a peacock feather and delicate musical details'),
  theme('ganesh-chaturthi','Ganesh Chaturthi / Vinayaka Chavithi','Happy Vinayaka Chavithi!','వినాయక చవితి శుభాకాంక్షలు','Auspicious beginnings and smooth journeys.','ganesha',
    ['#70452c','#a5652f','#fff9ee','#d6a94d','#dc9b5b','#9aaf68'],'modak','marigold','garland','ganesha-petal-reveal',
    [stage('ganesha','draw',100,2600),stage('petal','petal',1000,1800,120)],'Refined Ganesha line art, soft flower petals and small modak motifs'),
  theme('dussehra','Dussehra / Vijayadashami','Happy Dussehra!','దసరా శుభాకాంక్షలు','Celebrating hope and the triumph of good.','victory',
    ['#653236','#993b39','#fff8f0','#d5ac55','#d38241','#96a06a'],'marigold','bow','ornaments','victory-light',
    [stage('victory-bow','draw',100,2200),stage('victory-arrow','arrow',1200,1300),stage('victory-light','illuminate',1000,2800)],'A ceremonial bow and arrow with a soft golden burst and crimson accents'),
  theme('bonalu','Bonalu','Happy Bonalu!','బోనాల శుభాకాంక్షలు','Celebrating Telangana’s devotion and community.','bonam',
    ['#6a3538','#a64844','#fff8ef','#d9b04b','#cc784f','#74a453'],'neem','bonam','telangana','bonam-illumination',
    [stage('bonam','rise',100,2100),stage('bonam-light','illuminate',1200,2300),stage('leaf','unfold',400,1200,130)],'A decorated Bonam pot, neem leaves and Telangana-inspired borders'),
  theme('bathukamma','Bathukamma','Happy Bathukamma!','బతుకమ్మ శుభాకాంక్షలు','Flowers, togetherness and Telangana’s joy.','flowers',
    ['#6e3c52','#ab4c72','#fff8fb','#e0ba49','#d67a9f','#78a15a'],'flower','petal','flowers','bathukamma-assembly',
    [stage('flower-tier','assemble',100,1400,340),stage('flower-crown','reveal',1900,1100)],'Flowers assemble into five traditional Bathukamma tiers with gently drifting petals'),
  theme('diwali','Diwali','Happy Diwali!','దీపావళి శుభాకాంక్షలు','Light, happiness and joyful journeys.','diya',
    ['#182b48','#956b2e','#fffaf0','#d3ac58','#d48a45','#8ca278'],'diya','spark','lights','diya-lighting',
    [stage('diya-light','kindle',200,1300,550),stage('firework','firework',1800,2100,200)],'Diyas light in sequence, followed by restrained golden fireworks'),
  theme('onam','Onam','Happy Onam!','','Wishing you prosperity and togetherness.','pookalam',
    ['#39523a','#648044','#fbfbf0','#d8b542','#cf8c54','#83a65d'],'pookalam','banana','floral-rings','pookalam-assembly',
    [stage('pookalam-flower','assemble',100,1500,115),stage('pookalam-centre','lotus',1300,1600)],'Flowers assemble into a traditional pookalam with banana-leaf accents'),
  theme('ramzan','Ramzan','Ramzan Mubarak!','','Wishing your family peace and blessings.','lanterns',
    ['#183c49','#32705a','#f4faf5','#cead64','#8eb7a0','#6e9f82'],'lantern','moon','arches','crescent-lanterns',
    [stage('moon','moon',100,2100),stage('lantern-light','illuminate',700,1500,650)],'A golden crescent and two softly illuminated lanterns',
    {greetingVariants:Object.freeze({default:{greeting:'Ramzan Mubarak!'},eid:{greeting:'Eid Mubarak!',teluguGreeting:'ఈద్ శుభాకాంక్షలు'}})}),
  theme('christmas','Christmas','Merry Christmas!','','Warm wishes for a joyful season.','tree',
    ['#254c3b','#a24549','#f6faf5','#d2b573','#cb7b7e','#609577'],'ornament','snow','evergreen','tree-lighting',
    [stage('tree','reveal',100,1500),stage('tree-light','illuminate',600,1100,360),stage('tree-star','illuminate',2200,1700)],'An evergreen tree lights up gradually, with a glowing star and light edge snowfall'),
]);
/** @type {Readonly<FestivalSettings>} */
export const DEFAULT_FESTIVAL=Object.freeze({enabled:false,festival:'sankranti',intensity:'low',greetingVariant:'default'});
export const isFestivalId=id=>typeof id==='string'&&FESTIVALS.some(f=>f.id===id);
export const isFestivalIntensity=value=>typeof value==='string'&&Object.hasOwn(FESTIVAL_INTENSITIES,value);
export function isGreetingVariant(id,value) {
  const config=FESTIVALS.find(f=>f.id===id);
  return !!config&&typeof value==='string'&&(value==='default'||!!config.greetingVariants&&Object.hasOwn(config.greetingVariants,value));
}
export function normalizeFestivalSettings(value) {
  if(!value||!isFestivalId(value.festival))return {...DEFAULT_FESTIVAL};
  return {enabled:value.enabled===true,festival:value.festival,intensity:isFestivalIntensity(value.intensity)?value.intensity:'low',greetingVariant:isGreetingVariant(value.festival,value.greetingVariant)?value.greetingVariant:'default'};
}
export function validateFestivalSettings(value) {
  return !!value&&!Array.isArray(value)&&typeof value.enabled==='boolean'&&isFestivalId(value.festival)
    &&(value.intensity===undefined||isFestivalIntensity(value.intensity))
    &&(value.greetingVariant===undefined||isGreetingVariant(value.festival,value.greetingVariant));
}
export const FESTIVAL_PALETTES=FESTIVALS.map(f=>`body[data-festival="${f.id}"]{${Object.entries(f.colors).map(([key,value])=>`--festival-${key}:${value}`).join(';')}}`).join('\n');
