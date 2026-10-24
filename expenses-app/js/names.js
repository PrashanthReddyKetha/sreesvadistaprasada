// Turns the name printed on a receipt into the plain name used to compare prices between suppliers.
// Order of trust: a name the owner set herself, then this list, then the printed name tidied up.

import { key } from "./util.js";

// [compare-as name, words that mean it]. The longest matching phrase wins, so "coconut milk" beats "coconut".
const LIST = [
  ["Sona Masoori rice", ["sona masoori", "sona masuri", "sona mahsuri", "sm rice"]],
  ["Basmati rice", ["basmati"]],
  ["Idli rice", ["idli rice", "idly rice", "parboiled rice"]],
  ["Ponni rice", ["ponni"]],
  ["Rice", ["rice"]],
  ["Toor dal", ["toor dal", "toor", "toovar", "tuvar", "tur dal", "arhar", "kandi pappu", "red gram"]],
  ["Urad dal", ["urad dal", "urad", "urid", "minapa pappu", "minappappu", "black gram split", "white lentils", "urad gota"]],
  ["Whole urad", ["whole urad", "sabut urad", "black urad whole", "urad whole"]],
  ["Chana dal", ["chana dal", "channa dal", "senaga pappu", "bengal gram", "split chickpeas"]],
  ["Moong dal", ["moong dal", "mung dal", "pesara pappu", "yellow moong", "moong split"]],
  ["Whole moong", ["whole moong", "green moong", "green gram", "pesalu", "mung beans", "moong whole"]],
  ["Masoor dal", ["masoor", "red lentils"]],
  ["Chickpeas", ["chick peas", "chickpeas", "kabuli chana", "chole", "garbanzo"]],
  ["Chickpeas (tinned)", ["chick peas in", "chickpeas in"]],
  ["Black chickpeas", ["kala chana", "black chana", "black chickpeas", "brown chickpeas"]],
  ["Kidney beans", ["rajma", "kidney beans"]],
  ["Peanuts", ["peanuts", "peanut", "groundnuts", "palli", "verusenaga"]],
  ["Cashews", ["cashew", "cashews", "kaju", "jeedi pappu"]],
  ["Almonds", ["almonds", "almond", "badam"]],
  ["Raisins", ["raisins", "kismis", "sultanas"]],
  ["Sooji / rava", ["sooji", "suji", "semolina", "upma rava", "bombay rava", "rava"]],
  ["Idli rava", ["idli rava", "idly rava"]],
  ["Poha", ["poha", "atukulu", "beaten rice", "flattened rice", "aval"]],
  ["Vermicelli", ["vermicelli", "semiya", "sevai"]],
  ["Besan", ["besan", "gram flour", "senaga pindi"]],
  ["Rice flour", ["rice flour", "biyyam pindi"]],
  ["Ragi flour", ["ragi flour", "ragi", "finger millet", "nachni", "ragulu"]],
  ["Chapati atta", ["atta", "chapati flour", "chapatti flour", "chakki", "wheat flour"]],
  ["Maida", ["maida", "plain flour"]],
  ["Jaggery", ["jaggery", "bellam", "gur", "gud"]],
  ["Sugar", ["sugar"]],
  ["Salt", ["salt"]],
  ["Tamarind", ["tamarind", "chintapandu", "imli"]],
  ["Red chilli powder", ["chilli powder", "chili powder", "red chilli powder", "kashmiri chilli powder", "karam podi", "mirchi powder", "kashmiri chilli"]],
  ["Dry red chillies", ["dry red chilli", "dry red chillies", "dried red chilli", "dried red chillies", "whole red chilli", "whole red chillies", "endu mirapakaya", "guntur chilli", "byadgi"]],
  ["Turmeric powder", ["turmeric", "haldi", "pasupu"]],
  ["Coriander powder", ["coriander powder", "dhaniya powder", "dhania powder", "ground coriander"]],
  ["Coriander seeds", ["coriander seeds", "dhaniya seeds", "dhania seeds", "dhaniyalu", "whole coriander"]],
  ["Coriander leaves", ["coriander", "coriander leaves", "fresh coriander", "kothimeera", "cilantro", "dhania leaves", "dhaniya leaves"]],
  ["Cumin seeds", ["cumin", "jeera", "jeelakarra"]],
  ["Mustard seeds", ["mustard seeds", "mustard seed", "rai", "avalu"]],
  ["Fenugreek seeds", ["fenugreek", "fenugreek seeds", "methi seeds", "menthulu"]],
  ["Fenugreek leaves", ["methi leaves", "kasuri methi", "fenugreek leaves", "fresh methi"]],
  ["Asafoetida", ["asafoetida", "hing", "inguva"]],
  ["Garam masala", ["garam masala"]],
  ["Sambar powder", ["sambar powder", "sambar masala", "sambhar powder", "sambhar masala"]],
  ["Rasam powder", ["rasam powder", "rasam masala"]],
  ["Black pepper", ["black pepper", "peppercorns", "pepper corns", "miriyalu"]],
  ["Cardamom", ["cardamom", "elaichi", "elachi", "yalakulu"]],
  ["Cloves", ["cloves", "lavangalu", "laung"]],
  ["Cinnamon", ["cinnamon", "dalchini", "dalchina chekka"]],
  ["Bay leaves", ["bay leaf", "bay leaves", "tej patta"]],
  ["Curry leaves", ["curry leaves", "curry leaf", "karivepaku", "kadi patta", "kari patta"]],
  ["Mint", ["mint", "pudina"]],
  ["Green chillies", ["green chilli", "green chillies", "green chili", "green chilies", "pachi mirchi", "pachi mirapakaya", "finger chilli", "finger chillies"]],
  ["Ginger", ["ginger", "allam", "adrak"]],
  ["Ginger paste", ["ginger paste", "crushed ginger", "minced ginger"]],
  ["Garlic", ["garlic", "vellulli", "lahsun"]],
  ["Garlic paste", ["garlic paste", "crushed garlic", "minced garlic"]],
  ["Ginger garlic paste", ["ginger garlic paste", "ginger & garlic paste", "ginger and garlic paste", "ginger garlic"]],
  ["Onions", ["onion", "onions", "ullipaya", "ullipayalu", "pyaz"]],
  ["Shallots", ["shallots", "shallot", "sambar onions", "small onions"]],
  ["Tomatoes", ["tomato", "tomatoes", "tamata"]],
  ["Potatoes", ["potato", "potatoes", "aloo", "bangala dumpa"]],
  ["Okra", ["okra", "bhindi", "bendakaya", "ladies finger", "lady finger", "ladys finger"]],
  ["Aubergine", ["aubergine", "aubergines", "brinjal", "brinjals", "vankaya", "baingan", "eggplant"]],
  ["Drumsticks", ["drumstick", "drumsticks", "munagakaya", "moringa"]],
  ["Bottle gourd", ["bottle gourd", "lauki", "sorakaya", "dudhi"]],
  ["Ridge gourd", ["ridge gourd", "beerakaya", "turai"]],
  ["Bitter gourd", ["bitter gourd", "karela", "kakarakaya"]],
  ["Carrots", ["carrot", "carrots"]],
  ["Green beans", ["green beans", "french beans", "fine beans"]],
  ["Cabbage", ["cabbage"]],
  ["Cauliflower", ["cauliflower"]],
  ["Spinach", ["spinach", "palak", "palakura"]],
  ["Cucumber", ["cucumber", "cucumbers"]],
  ["Lemons", ["lemon", "lemons", "nimmakaya"]],
  ["Limes", ["lime", "limes"]],
  ["Coconut", ["coconut", "kobbari", "fresh coconut"]],
  ["Desiccated coconut", ["desiccated coconut", "coconut powder", "dry coconut", "copra"]],
  ["Coconut milk", ["coconut milk"]],
  ["Coconut oil", ["coconut oil"]],
  ["Sunflower oil", ["sunflower oil"]],
  ["Groundnut oil", ["groundnut oil", "peanut oil", "verusenaga nune"]],
  ["Sesame oil", ["sesame oil", "gingelly oil", "gingelly", "nuvvula nune", "til oil"]],
  ["Vegetable oil", ["vegetable oil", "rapeseed oil"]],
  ["Mustard oil", ["mustard oil"]],
  ["Ghee", ["ghee", "neyyi"]],
  ["Butter", ["butter"]],
  ["Paneer", ["paneer"]],
  ["Milk", ["milk", "whole milk", "semi skimmed", "semi-skimmed"]],
  ["Yogurt", ["yogurt", "yoghurt", "curd", "dahi", "perugu"]],
  ["Cheese", ["cheese", "cheddar"]],
  ["Eggs", ["egg", "eggs", "kodi guddu"]],
  ["Chicken", ["chicken", "kodi"]],
  ["Lamb / mutton", ["lamb", "mutton", "goat"]],
  ["Fish", ["fish", "tilapia", "salmon", "basa"]],
  ["Prawns", ["prawn", "prawns", "shrimp"]],
  ["Mango pulp", ["mango pulp"]],
  ["Pickle", ["pickle", "achar", "avakaya"]],
  ["Papad", ["papad", "poppadoms", "poppadums", "appadalu", "appalam"]],
  ["Tea", ["tea"]],
  ["Coffee", ["coffee", "filter coffee"]],
  ["Takeaway containers", ["container", "containers", "takeaway box", "takeaway boxes", "food box", "food boxes", "tubs"]],
  ["Foil containers", ["foil container", "foil containers", "foil trays", "foil tray"]],
  ["Lids", ["lid", "lids"]],
  ["Carrier bags", ["carrier bag", "carrier bags", "paper bags", "paper bag", "bag for life"]],
  ["Cling film", ["cling film", "clingfilm"]],
  ["Kitchen foil", ["kitchen foil", "aluminium foil", "tin foil"]],
  ["Napkins", ["napkins", "serviettes"]],
  ["Gloves", ["gloves", "glove"]],
  ["Bin bags", ["bin bags", "bin liners", "refuse sacks"]],
  ["Washing-up liquid", ["washing up liquid", "washing-up liquid", "fairy liquid"]],
  ["Kitchen roll", ["kitchen roll", "kitchen towel"]],
  ["Antibacterial spray", ["antibacterial", "anti-bacterial", "disinfectant", "sanitiser", "sanitizer"]],
];
const PHRASES = LIST.flatMap(([std, words]) => words.map((w) => [w, std])).sort((a, b) => b[0].length - a[0].length);
const RX = PHRASES.map(([w, std]) => [new RegExp(`(?:^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z])`), std]);

const SIZE = /\b\d+(?:\.\d+)?\s*(?:x\s*\d+(?:\.\d+)?\s*)?(?:kg|kilo|kilos|g|gm|gms|grams?|ml|l|lt|ltr|litres?|liters?|pcs|pk|pack)\b/gi;

// The printed name without the quantity in front or pack sizes, lower case: the key a learned name is kept under.
export function cleanName(raw) {
  return key(String(raw || "").replace(/^\s*\d+\s*x\s+/i, "").replace(SIZE, " ").replace(/[^\p{L}\p{N}&'\- ]+/gu, " "));
}

export function standardize(raw, learned = {}) {
  const c = cleanName(raw);
  if (!c) return { standard: "", source: "none" };
  if (learned[c]) return { standard: learned[c], source: "learned" };
  for (const [rx, std] of RX) {
    if (rx.test(c)) {
      const frozen = /\bfrozen\b/.test(c) && !/\(frozen\)/.test(std);
      return { standard: frozen ? std + " (frozen)" : std, source: "list" };
    }
  }
  // Not in the list: the printed name, tidied, so it at least lines up with itself next time.
  const tidy = c.replace(/\b(asda|tesco|sainsbury'?s|lidl|aldi|extra special|finest|everyday|essentials|british|ktc|trs|natco|heera|laxmi|swad|taj|surya|east end|rajah|shan|mdh|everest|aachi|priya)\b/g, " ").replace(/\s+/g, " ").trim() || c;
  return { standard: tidy.charAt(0).toUpperCase() + tidy.slice(1), source: "guess" };
}

export const knownStandards = () => [...new Set(LIST.map(([s]) => s))];
