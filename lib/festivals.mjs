// Public festival copy is shared by the API and admin preview. Dates are manual.
export const FESTIVALS = Object.freeze([
  { id:'sankranti', name:'Sankranti', greeting:'Happy Sankranti', message:'A harvest of happiness. A year of joyful journeys.', effect:'Swaying kites, harvest sunshine and drifting confetti', motif:'kite' },
  { id:'bhogi', name:'Bhogi', greeting:'Happy Bhogi', message:'New beginnings, brighter days and joyful journeys ahead.', effect:'A glowing bonfire with gently rising embers', motif:'bonfire' },
  { id:'pongal', name:'Pongal', greeting:'Happy Pongal', message:'May happiness and prosperity overflow in every home.', effect:'A festive Pongal pot, sugarcane and curling steam', motif:'pongal' },
  { id:'kanuma', name:'Kanuma', greeting:'Happy Kanuma', message:'Celebrating our cattle, our land and the joy of harvest.', effect:'Decorated cattle, harvest garlands and swaying leaves', motif:'cattle' },
  { id:'maha-shivaratri', name:'Maha Shivaratri', greeting:'Blessed Maha Shivaratri', message:'May peace and light guide every journey.', effect:'A crescent, trident and softly drifting bilva leaves', motif:'trident' },
  { id:'holi', name:'Holi', greeting:'Happy Holi', message:'Here’s to colourful days and joyful journeys together.', effect:'Floating clouds of colour and playful colour droplets', motif:'colours' },
  { id:'ugadi', name:'Ugadi', greeting:'Ugadi Subhakankshalu', message:'Fresh hopes. New beginnings. Wishing you a wonderful year.', effect:'A mango-leaf toran, Ugadi pachadi and blossoms', motif:'toran' },
  { id:'sri-rama-navami', name:'Sri Rama Navami', greeting:'Happy Sri Rama Navami', message:'Wishing your home peace, happiness and harmony.', effect:'An ornamental bow, an arrow and floating flower petals', motif:'bow' },
  { id:'hanuman-jayanti', name:'Hanuman Jayanti', greeting:'Happy Hanuman Jayanti', message:'Wishing you strength, courage and a peaceful path ahead.', effect:'A ceremonial gada with warm, gently moving rays', motif:'gada' },
  { id:'akshaya-tritiya', name:'Akshaya Tritiya', greeting:'Happy Akshaya Tritiya', message:'May prosperity and good fortune grow with every new beginning.', effect:'A golden lotus, coins and slowly gleaming stars', motif:'lotus' },
  { id:'raksha-bandhan', name:'Raksha Bandhan', greeting:'Happy Raksha Bandhan', message:'Celebrating the bonds that stay with us on every journey.', effect:'A handcrafted rakhi with flowing threads and floral details', motif:'rakhi' },
  { id:'krishna-janmashtami', name:'Krishna Janmashtami', greeting:'Happy Krishna Janmashtami', message:'May joy, love and laughter fill your home.', effect:'A flute, peacock feather, butter pot and floating music notes', motif:'flute' },
  { id:'ganesh-chaturthi', name:'Ganesh Chaturthi / Vinayaka Chavithi', greeting:'Happy Vinayaka Chavithi', message:'Wishing you auspicious beginnings and smooth journeys.', effect:'A respectful Ganesha line illustration, modaks and flower petals', motif:'ganesha' },
  { id:'dussehra', name:'Dussehra / Vijayadashami', greeting:'Happy Vijayadashami', message:'Celebrating hope, courage and the triumph of good.', effect:'A victory arch, a ceremonial bow and golden leaves', motif:'victory' },
  { id:'bonalu', name:'Bonalu', greeting:'Bonalu Subhakankshalu', message:'Celebrating Telangana’s spirit, devotion and community.', effect:'A decorated bonam pot, neem leaves and a gentle flame', motif:'bonam' },
  { id:'bathukamma', name:'Bathukamma', greeting:'Happy Bathukamma', message:'A celebration of flowers, togetherness and Telangana’s joy.', effect:'A tiered Bathukamma flower arrangement with drifting petals', motif:'flowers' },
  { id:'diwali', name:'Diwali', greeting:'Happy Diwali', message:'May every journey be filled with light and happiness.', effect:'Glowing diyas and softly blooming festive sparkles', motif:'diya' },
  { id:'onam', name:'Onam', greeting:'Happy Onam', message:'Wishing you a beautiful season of prosperity and togetherness.', effect:'A floral pookalam, a boat and gently turning flower rings', motif:'pookalam' },
  { id:'ramzan', name:'Ramzan', greeting:'Ramzan Mubarak', message:'Wishing you and your family peace, kindness and blessings.', effect:'A crescent moon, swaying lanterns and a starry sky', motif:'lanterns' },
  { id:'christmas', name:'Christmas', greeting:'Merry Christmas', message:'Warm wishes for a joyful season and bright journeys ahead.', effect:'An evergreen tree, ornaments and slowly falling snow', motif:'tree' },
].map(Object.freeze));

export const DEFAULT_FESTIVAL = Object.freeze({ enabled:false, festival:'sankranti' });
export const isFestivalId = id => typeof id === 'string' && FESTIVALS.some(f => f.id === id);
export function normalizeFestivalSettings(value) {
  if (!value || !isFestivalId(value.festival)) return { ...DEFAULT_FESTIVAL };
  return { enabled:value.enabled === true, festival:value.festival };
}
