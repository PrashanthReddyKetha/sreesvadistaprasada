/**
 * A paragraph of its own for every dish page, keyed by the dish's slug.
 *
 * Rules these follow (see docs/ops/seo/SEO_STATUS.md):
 *  - What the dish is, where it comes from and how it is eaten — general,
 *    well-known facts — plus what the menu's own description says about ours.
 *  - No health, allergen or dietary claims; no "only" or "best"; nothing about
 *    how the kitchen works that the menu description does not already say.
 *  - Any dish suggested alongside must be on the live menu.
 * A dish without an entry simply shows its menu description. Server-side only:
 * the dish page passes one entry to the client, so this file is not shipped
 * to browsers.
 */
import { CATEGORY_SEO } from '@/lib/categorySeo';
import { buildItemUrl } from '@/lib/itemUrl';

export const DISH_COPY = {
  // ── Breakfast: with chicken curry ─────────────────────────────────────────
  'idli-3-pcs-chicken-curry': "In Andhra homes idli is as likely to meet chicken curry as chutney, especially on a weekend morning. This plate pairs three soft steamed idlis with a bowl of our spicy Andhra chicken curry — tear the idli, dip it, and let it soak up the gravy. A non-veg South Indian breakfast in the Telugu style.",
  'plain-dosa-2-pcs-chicken-curry': "Dosa with chicken curry is a Telugu weekend habit: the crisp plain dosa stands in for bread and the curry does the rest. You get two thin dosas and a bowl of spicy Andhra chicken curry for dunking. Order it when a masala dosa feels too polite.",
  'vada-3-pcs-chicken-curry': "Medu vada — garelu in Telugu — is the crisp urad dal fritter that Andhra families pair with chicken curry at festivals and Sunday breakfasts. Here the vadas come with a bowl of our spicy Andhra chicken curry: crunch outside, soft inside, and a gravy made for dipping.",

  // ── Breakfast: dosas ──────────────────────────────────────────────────────
  'beetroot-dosa-2-pcs': "A dosa made on our fermented rice-and-lentil batter with beetroot worked in, which turns it a vivid pink and adds a gentle, earthy sweetness. It is one of the milder dosas on the menu. Two to a plate — good with sambar, or beside a masala dosa if you are sharing.",
  'butter-dosa-2-pcs': "The plain dosa's richer cousin: the same fermented batter, roasted on the tawa with butter until golden and fragrant. Softer and rounder in flavour than a ghee dosa, and a favourite with children. Two dosas per plate, with sambar and chutneys.",
  'carrot-dosa-2-pcs': "Grated carrot and mild spices are mixed through the dosa batter, giving a lightly sweet, colourful dosa that stays crisp at the edges. A gentle option if you prefer little heat. Two per plate with sambar and chutneys — and a good partner for the beetroot dosa.",
  'cheese-dosa': "A crisp dosa folded around melted cheese and spiced potato — the crossover order that children ask for and adults finish. The tang of the fermented batter still comes through underneath the richness. Have it with sambar, or with a mango lassi on the side.",
  'ghee-dosa-2-pcs': "A plain dosa roasted in ghee until deep golden, which gives it a nuttier flavour and an extra-crisp finish. Ghee dosa is the simple pleasure of a South Indian tiffin room: no filling, nothing to hide behind. Two per plate, with sambar and chutneys.",
  'masala-dosa': "The most famous dosa of all: a thin, crisp crepe of fermented rice and urad dal batter wrapped around a mildly spiced potato masala. Ours comes two to a plate with sambar and chutneys. If this is your first South Indian breakfast in Milton Keynes, start here.",
  'nellore-ghee-karam-dosa-2-pcs': "Nellore, on the Andhra coast, is known for the heat of its food, and this is its dosa: spread with fiery red karam — a chilli and garlic paste — and finished with ghee as it roasts. Rich, hot and aromatic. Choose a plain or ghee dosa instead if you like things mild.",
  'onion-dosa': "Chopped onion and a little green chilli are pressed into the dosa as it cooks, so the onion caramelises against the hot tawa while the dosa crisps underneath. Sweet, savoury and a touch sharp. Good with sambar and coconut chutney.",
  'paneer-dosa': "A crisp dosa filled with crumbled paneer cooked with spices and green chillies — more substantial than a masala dosa, with soft cheese against the crackle of the crepe. Comes with sambar and chutneys.",
  'plain-dosa-2-pcs': "The dosa by which any South Indian kitchen is judged: nothing but fermented rice and urad dal batter, spread thin on a hot tawa until golden and crisp at the edges. Two per plate, with sambar and coconut chutney. Add a bowl of chicken curry for the Andhra version of breakfast.",
  'upma-dosa': "Two tiffin classics in one: a crisp dosa carrying a layer of soft, savoury semolina upma. The contrast is the point — crunch first, then the gentle, spiced upma. Comes with sambar and chutneys.",

  // ── Breakfast: lighter plates ─────────────────────────────────────────────
  'avocado-toast': "Not everything on our breakfast menu is South Indian. This is toasted sourdough with smashed avocado, chilli flakes and a squeeze of lemon — a lighter plate for the mornings you want something familiar, alongside the dosas and idli everyone else is ordering.",
  'bread-omelette-english-breakfast': "Bread omelette is the breakfast of Indian railway platforms and street carts: a spiced omelette cooked together with soft buttered bread and folded into a sandwich. This is the version from our English Breakfast selection — plain, filling and quick.",
  'cheese-bread-omelette-english-breakfast': "The street-cart bread omelette with a layer of melted cheese: a spiced omelette folded into soft buttered bread. It sits in our English Breakfast selection for the mornings that call for something simple and comforting.",
  'overnight-oats-bowl': "Rolled oats soaked overnight in milk and honey until creamy, then topped with kiwi, banana, apple, berries, seed granola and pumpkin seeds. It is the one cold breakfast bowl on a menu of hot South Indian tiffins — for the days you want fruit rather than chilli.",

  // ── Breakfast: idli and vada ──────────────────────────────────────────────
  'button-idli': "Button idlis are miniature idlis — the same steamed rice-and-lentil cakes, made bite-sized so they soak up sambar faster. Popular with children and easy to share. They come with sambar and chutneys.",
  'ghee-karam-button-idli': "Mini idlis tossed in warm ghee and Andhra karam, a red chilli paste, so every bite is coated. The small size means more surface for the spice to cling to. A hotter, richer take on button idli.",
  'ghee-karam-idli-3-pcs': "A favourite of Andhra tiffin centres: soft idlis tossed in warm ghee and karam, the region's fiery red chilli paste. The ghee rounds off the heat without hiding it. Three idlis to a plate — choose plain idli if you prefer no spice.",
  'idli-3-pcs': "Idli is the gentlest of South Indian breakfasts: steamed cakes of fermented rice and urad dal batter, soft enough to break with a spoon. Ours come three to a plate with sambar and chutneys. Add a vada for crunch, or chicken curry for the Andhra way.",
  'perugu-vada-2-pcs': "Perugu vada is the Telugu name for dahi vada: medu vadas soaked in thick whisked curd and finished with a tempering of mustard seeds and curry leaves, with ginger and a little green chilli. Cool, tangy and soft — the opposite of a vada straight from the fryer.",
  'sambar-idli-2-pcs': "Idlis served already dunked in hot sambar, so they drink up the lentil-and-tamarind broth and turn spoon-soft. It is how many South Indian cafés serve idli by default. Comes with coconut chutney.",
  'sambar-vada-2-pcs': "Crisp medu vadas left to soak in warm sambar until the outside softens and the inside takes on the broth. A staple of South Indian cafés, and the one to pick if you like your vada tender rather than crunchy.",
  'vada-3-pcs': "Medu vada — garelu in Telugu — is a ring-shaped fritter of ground urad dal, fried so the outside is crisp and the inside stays soft and fluffy. Three to a plate with sambar and coconut chutney. It pairs naturally with idli.",

  // ── Breakfast: poori and others ───────────────────────────────────────────
  'poha': "Poha is flattened rice, softened and sautéed with mustard seeds, turmeric, onion and green chilli, then finished with lime. Light and quick, it is a breakfast eaten across much of India. A good choice when a dosa feels like too much.",
  'poori-2pcs': "Poori is whole-wheat dough rolled thin and deep-fried until it puffs into a golden balloon. Ours come two to a plate with potato kurma for scooping. A festive, filling South Indian breakfast.",
  'uggani': "Uggani comes from Rayalaseema in southern Andhra: puffed rice softened and stir-fried with onion, green chilli, peanuts and lemon. It is savoury, a little crunchy and quick to eat — and its traditional partner is mirchi bhajji, which is also on our menu.",
  'upma': "Upma is semolina roasted and cooked with mustard seeds, onion, green chilli and vegetables into a soft, savoury porridge. A South Indian morning staple — plain, warming and quick to eat. Good with a spoon of sambar.",

  // ── Drinks ────────────────────────────────────────────────────────────────
  'abc-juice': "ABC stands for apple, beetroot and carrot — blended fresh into a deep red juice that is naturally sweet. A popular juice-stall order across India, and a mild counterpoint to a spicy meal.",
  'apple-juice': "Apple juice pressed fresh, with no added sugar. Crisp and simple — an easy choice for children, or alongside a breakfast dosa.",
  'carrot-juice': "Carrot juice pressed fresh to order: naturally sweet, bright orange and smooth. A juice-stall classic that sits well next to a savoury tiffin.",
  'lemon-water-salt': "Nimbu pani the salted way: freshly squeezed lemon juice with water and a pinch of black salt. Sharp and savoury rather than sweet — the drink Indians reach for in hot weather, and a good match for fried snacks.",
  'lemon-water-sweet': "Sweet nimbu pani: fresh lemon juice with water and sugar. Simple and refreshing, and a gentle way to cool down after a spicy curry.",
  'mango-lassi': "Lassi is a yoghurt drink from the Punjab, and mango lassi is its most loved version. Ours blends Alphonso mango with creamy yoghurt and a little cardamom. Thick, sweet and cooling — the drink to order with our spicier Andhra dishes.",
  'masala-buttermilk': "Known as majjiga in Telugu, this is thin, chilled yoghurt seasoned with roasted cumin, ginger, coriander and green chilli. Savoury rather than sweet, it is how a South Indian meal traditionally ends. Order it with biryani or a spicy Andhra chicken curry.",
  'orange-juice': "Sweet oranges squeezed fresh, with no added sugar and no preservatives. Straightforward, bright and good with breakfast.",
  'pineapple-juice': "Fresh pineapple juice — sweet with a tangy edge. A tropical, cooling drink to have beside a plate of something hot.",
  'sweet-lassi': "The original lassi: thick, chilled yoghurt blended with sugar and a hint of cardamom. Creamy and cooling — a classic way to take the edge off a spicy meal.",

  // ── Svadista: biryani ─────────────────────────────────────────────────────
  'chicken-dum-biryani': "Dum means the pot is sealed and the biryani finishes over gentle heat, so the basmati steams in the chicken and its masala. Ours layers chicken with rice, fried onions and whole spices in the Andhra style, which runs hotter than a Mughlai biryani. Good with Chicken 65 or a glass of masala buttermilk.",
  'chicken-fry-piece-biryani': "Fry piece biryani is an Andhra favourite: marinated chicken is fried until crisp and layered into spiced basmati, rather than cooked in the rice. You get the crunch of fried chicken and the fragrance of biryani on one plate. Pair it with gongura chicken curry or masala buttermilk.",

  // ── Svadista: curries ─────────────────────────────────────────────────────
  'andhra-egg-curry': "Kodi guddu kura — boiled eggs simmered in an Andhra gravy of onion, tomato and ground spices. It is everyday home cooking in Telugu households, made for mixing into hot rice. Try it with sambar rice or garlic rice.",
  'chicken-curry-2': "The home-style chicken curry of a Telugu kitchen: chicken cooked on the bone with onion, tomato and a ground spice blend. Cooking on the bone gives the gravy its depth. Eat it with rice, or order it with idli or dosa the Andhra way.",
  'egg-fry': "Kodi guddu vepudu: hard-boiled eggs fried with onion, curry leaves and Andhra spices until the masala clings to them. A dry dish rather than a curry — good beside rice and tomato pappu, or with sambar rice.",
  'fish-pulusu-2': "Pulusu is the Andhra word for a tangy, tamarind-based stew, and chepala pulusu — fish pulusu — is the pride of the coast. Ours simmers fish fillets in tamarind gravy with onion and coastal spices. Sharp, spicy and made to be eaten with plain rice.",
  'gongura-chicken-curry': "Gongura is the sour sorrel leaf that defines Andhra cooking, and gongura chicken is its most celebrated dish. The chicken is slow-cooked with the leaves and Andhra spices, so the gravy is tangy as well as hot. A signature of the Krishna delta — eat it with rice and a little ghee.",
  'spicy-andhra-chicken-curry': "The hotter of our chicken curries: chicken on the bone in an intensely spiced Andhra masala with green chillies. Andhra food is known for its heat, and this dish shows why. Order it with plenty of rice — and a masala buttermilk.",

  // ── Svadista: egg specials ────────────────────────────────────────────────
  'bread-omelette': "A staple of Indian street carts and railway stations: a spiced omelette cooked with soft buttered bread and folded into a sandwich. Simple, filling and at its happiest eaten hot.",
  'cheese-bread-omelette': "The Indian street-style bread omelette with melted cheese folded in — a spiced omelette and soft buttered bread in one sandwich. Comforting at any time of day.",
  'cheese-omelette': "A light, fluffy omelette filled with melted cheese and seasoned with black pepper. Mild, with no chilli heat — an easy choice alongside spicier dishes.",
  'egg-bhurji': "Egg bhurji is India's scrambled egg: cooked with onion, tomato, green chilli and spices until soft and savoury. A street-stall favourite, usually scooped up with bread. Try it with a butter dosa.",
  'egg-dosa-2pcs': "An egg is spread over the dosa as it cooks, so a thin spiced omelette sets onto the crisp crepe. A street-side classic across South India. Two per plate, good with sambar.",

  // ── Svadista: Indo-Chinese ────────────────────────────────────────────────
  'chicken-fried-rice': "Indo-Chinese fried rice as Indian street stalls make it: basmati tossed in a hot wok with chicken, egg, vegetables and soy sauce. Mild, savoury and a meal on its own — or share it alongside Chicken 65.",
  'schezwan-egg-fried-rice': "Egg fried rice the Indo-Chinese way: basmati tossed in a hot wok with scrambled egg, spring onion and soy sauce. Schezwan is the Indian kitchen's take on Sichuan flavours, and a fixture of street-stall menus. Good with chicken lollipop.",

  // ── Svadista: rice bowl ───────────────────────────────────────────────────
  'rice-chicken-curry-pickle-omelette': "What a Telugu home puts on the table for lunch, in one bowl: hot rice, chicken curry, mango pickle and a spiced omelette. Mix a little of everything into each mouthful. A complete non-veg meal for one.",

  // ── Svadista: starters ────────────────────────────────────────────────────
  'chicken-65': "Chicken 65 is said to have been created in Chennai in 1965, and it has been South India's favourite starter ever since. Chicken is marinated with yoghurt, red chilli and curry leaves, then fried until crisp outside and juicy inside. Order it before a biryani.",
  'chicken-drumsticks-5-pcs': "Five chicken drumsticks marinated in Andhra spices and fried to a deep golden crunch. Food to eat with your hands — a sharing starter before biryani or curry.",
  'chicken-fry': "Kodi vepudu, Andhra chicken fry: chicken on the bone marinated in spices and fried until crisp. A dry dish with no gravy, eaten as a starter or as a side with rice and pappu.",
  'chicken-ghee-roast': "Ghee roast comes from the Mangalore coast: chicken roasted in ghee with a paste of red chillies, tamarind and spices until the masala turns dark and clings to the meat. Rich, tangy and hot. Good with garlic rice.",
  'chicken-lollipop-5-pcs': "Chicken lollipop is an Indo-Chinese favourite: a chicken winglet with the meat pushed to one end of the bone, marinated in spices and fried crisp. Five to a portion — easy to pick up, hard to stop eating.",
  'chicken-lollipop-dry-5-pcs': "The dry version of chicken lollipop: five frenched winglets in a deeply spiced coating, fried crisp with no sauce. More masala and more crunch than the classic.",
  'chicken-pakoda': "Chicken pakoda is the tea-time snack of Andhra street corners: small pieces of chicken dipped in spiced chickpea-flour batter and fried until golden and crunchy. Share it as a starter.",
  'chicken-wings': "Crispy chicken wings tossed in our house masala — spicy and a little sticky. A sharing starter that goes well with a cold drink.",
  'garlic-pepper-chicken': "A dry Andhra-style stir-fry: chicken tossed with roasted garlic, cracked black pepper and curry leaves. Pepper gives a slower, deeper heat than chilli. Good as a starter, or with garlic rice.",
  'pepper-chicken': "Miriyala kodi — pepper chicken — is dry-fried with freshly cracked black pepper, curry leaves and green chillies. The heat comes from the pepper, which is how South Indian food was spiced long before chillies arrived. A starter, or a side with rice.",
  'prawns-ghee-roast': "Prawns cooked in the Mangalorean ghee roast style: roasted in ghee with a red chilli spice paste until rich and deeply flavoured. Sweet prawn against a hot, tangy masala. Good with jeera garlic rice.",
  'tandoori-chicken-1pcs': "Tandoori chicken is the North Indian classic: chicken marinated in yoghurt, Kashmiri chilli and spices, then roasted at high heat so the edges char. Smoky rather than saucy — a change of pace from our Andhra curries.",
  'whole-grilled-chicken': "A whole chicken marinated in spices and slow-grilled until the skin chars and the meat comes away from the bone. A dish for the table to share — add biryani or garlic rice and a couple of starters.",

  // ── Pickles (coming soon) ─────────────────────────────────────────────────
  'allam-pachadi': "Allam pachadi is Andhra ginger pickle: fresh ginger with tamarind, jaggery, chilli and mustard, so it is sweet, sour and hot at once. In Andhra it is the classic partner for pesarattu, and it is just as good with dosa, idli or upma.",
  'gongura-pickle': "Gongura pachadi is the pickle Andhra is proudest of: sour sorrel leaves with red chillies, garlic, mustard and sesame oil. Mix a spoonful into hot rice with a little ghee and you have a meal.",
  'lemon-pickle': "Nimmakaya pickle: lemons cut and left to cure with salt, turmeric, fenugreek and chilli until the rind softens. Sharp and salty — a small spoonful lifts curd rice, or pappu and rice.",
  'mango-avakaya': "Avakaya is the mango pickle of Telugu homes, made each summer with raw mango, mustard powder, red chilli and sesame oil. Hot, sour and pungent. The classic way to eat it is mixed into rice with pappu and ghee.",
  'tomato-pickle': "Tomato pachadi: ripe tomatoes cooked down with red chillies, tamarind and mustard into a thick, glossy pickle. Milder than avakaya, and good with dosa, idli or plain rice.",
  'velluli-pachadi': "Velluli means garlic in Telugu. This pickle cooks whole garlic cloves slowly with dried red chillies, tamarind and mustard oil until they turn soft and deeply aromatic. Strong, savoury and very good with rice and ghee.",

  // ── Podis (coming soon) ───────────────────────────────────────────────────
  'kandi-podi': "Kandi podi is the Andhra “gunpowder”: roasted toor dal ground with dried chillies, cumin and asafoetida. Mix it into hot rice with ghee — that is the whole recipe, and one of the most comforting meals in Telugu cooking.",
  'karivepaku-podi': "Karivepaku is the Telugu word for curry leaves. Here they are slow-roasted with urad dal and dried chillies and ground into a fragrant, earthy powder — eaten with rice and ghee, or sprinkled over idli and dosa.",
  'kobbari-podi': "Kobbari podi is a coconut spice powder: dry-roasted coconut ground with urad dal, red chillies and curry leaves. Mild and slightly sweet, it suits idli, dosa and plain rice.",
  'nalla-karam': "Nalla karam is a dark, fiery Andhra spice powder of sesame, dried red chillies and garlic. Stir it into hot rice with a little oil or ghee, or serve it beside idli and dosa.",
  'nuvvula-podi': "Nuvvulu are sesame seeds. They are roasted with dried chillies, garlic and coconut and ground into a nutty powder, eaten with rice and ghee or alongside idli.",
  'palli-podi': "Palli podi is peanut powder: roasted peanuts ground coarsely with red chillies, garlic and salt. Crunchy and savoury — sprinkle it over idli or dosa, or mix it with ghee and rice.",

  // ── Ragi specials ─────────────────────────────────────────────────────────
  'ragi-butter-milk': "A relative of ragi ambali, the traditional summer drink of rural Andhra: buttermilk blended with ragi (finger millet) flour and spices. Cool and tangy. Have it beside ragi sangati or a spicy chicken curry.",
  'ragi-jaava-malt': "Ragi jaava, or ragi malt, is a warm drink of finger millet flour cooked smooth with milk and jaggery, finished with ghee and roasted cashews. A traditional Andhra morning drink — closer to a thin porridge than to tea.",
  'ragi-sangati-with-chicken-curry': "Ragi sangati is finger millet cooked into a soft, dense ball — known as ragi mudde in Karnataka — and it is the staple of rural Rayalaseema. You pinch off a piece, dip it into the curry and swallow it almost without chewing. Here it comes with spicy Andhra chicken curry.",
  'ragi-sangati-with-pappu-and-pachi-pulusu': "The vegetarian way to eat ragi sangati, the finger millet ball of rural Andhra: with pappu, a creamy dal, and pachi pulusu, a raw tamarind rasam that is never cooked. Earthy millet, mild dal and a sharp, cool broth.",

  // ── Street food ───────────────────────────────────────────────────────────
  'chicken-burger': "A crispy fried chicken fillet in a toasted brioche bun with coleslaw and house sauce. Not South Indian, and not trying to be — it is on the menu for the evenings when someone at the table wants a burger.",
  'chicken-cheese-burger': "Fried chicken, melted cheese, coleslaw and house sauce in a toasted brioche bun. A straightforward crowd-pleaser from our evening street-food menu.",
  'chicken-momos-6-pcs': "Momos are steamed dumplings that came to India from Tibet and Nepal and became a street-food favourite in every city. Ours are filled with minced chicken and aromatics — six to a portion.",
  'chicken-wrap': "Tandoori-spiced chicken strips with salad, raita and mint chutney in a warm tortilla. An easy hand-held lunch or evening bite.",
  'pani-puri-8-pcs': "Pani puri — golgappa or puchka elsewhere in India — is the country's favourite street snack: crisp hollow puris filled with spiced potato and chickpeas, then with cold tamarind-mint water, and eaten in one bite. Eight to a portion.",
  'veg-burger': "A crispy spiced vegetable patty in a toasted bun with lettuce, tomato, onion and house sauce. The vegetarian burger on our evening street-food menu.",
  'veg-cheese-burger': "Our crispy vegetable patty with melted cheese, salad and house sauce in a toasted bun. A vegetarian option for burger nights, from the evening street-food menu.",
  'veg-momos-6-pcs': "Steamed dumplings in the Himalayan style, filled with spiced vegetables and herbs and served with a tangy red chutney. Six to a portion — light enough to start a meal.",
  'veg-wrap': "Spiced roasted vegetables and paneer with mint chutney and crunchy salad in a soft flour tortilla. A vegetarian hand-held meal from the street-food menu.",

  // ── Prasada: rice ─────────────────────────────────────────────────────────
  'coconut-rice': "Kobbari annam: rice tossed with fresh grated coconut and a tempering of mustard seeds, cashews and dried chillies. Mild and fragrant, it is a festival dish in Telugu homes. Good with a spoon of pickle.",
  'coriander-rice': "Kothimeera rice: rice tossed with a paste of fresh coriander, lemon and spices. Green, bright and herb-forward — a lighter rice to have with a curry or on its own.",
  'curd-rice': "Perugannam, curd rice, is how a South Indian meal ends: rice mixed with yoghurt and tempered with mustard seeds and curry leaves, here finished with pomegranate. Cool and mild — the thing to eat after something spicy.",
  'garlic-rice': "Basmati stir-fried with crisp golden garlic, curry leaves and mild spices. A simple rice that goes with almost any curry on the menu — try it with gutti vankaya masala or gongura pappu.",
  'ghee-pappu-avakaya-rice': "Plain dal, fiery mango pickle and ghee mixed into hot rice is the first mouthful of a traditional Andhra meal. This dish is that combination, ready mixed. Simple, and deeply loved in Telugu homes.",
  'gongura-rice': "Rice tossed with a paste of gongura, the sour sorrel leaf of Andhra, and tempered with mustard seeds and dried chillies. Tangy and bold — a one-dish way to taste Andhra's signature ingredient.",
  'jeera-garlic-rice': "Basmati tempered with cumin and crisp golden garlic, with a touch of ghee. A little more flavour than plain jeera rice, and a good base for any of our curries.",
  'jeera-rice': "Long-grain basmati tempered with cumin seeds and ghee. Plain by design — it is there to carry a curry, a dal or a spoon of pickle.",
  'kashmiri-curd-rice': "A festive version of curd rice: yoghurt rice topped with pomegranate, grapes and nuts, with a hint of saffron. Sweet, fruity and cool.",
  'pudina-rice': "Pudina means mint. Basmati is cooked with fresh mint leaves, whole spices and green chillies into a fragrant green rice. Good with aloo kurma.",
  'rasam-rice': "Rice mixed with rasam — the thin, peppery tamarind broth of South India — and a little ghee. It is the food Telugu families turn to when they want something light and warming.",
  'sambar-rice': "Hot rice mixed with sambar, the lentil and vegetable stew at the centre of South Indian cooking, and finished with ghee. A full meal in a bowl.",
  'tomato-rice': "Rice cooked with ripe tomatoes, onion and South Indian spices. Tangy and gently spiced — a lunchbox favourite in South India that needs nothing more than a spoon of pickle or some yoghurt.",
  'veg-pulao': "Basmati cooked with seasonal vegetables, whole spices and mint. Milder than a biryani, and the closest thing to one on our vegetarian menu. Try it with aloo kurma or a mango lassi.",

  // ── Prasada: curries ──────────────────────────────────────────────────────
  'aloo-kurma': "Potatoes simmered in a mild coconut and cashew kurma with whole spices. Kurma is the gentle, creamy curry of South India, and the traditional partner for poori. Also good with jeera garlic rice.",
  'bhindi-pulusu': "Bendakaya pulusu: okra simmered in a tamarind gravy with onion and spices. Pulusu is the Andhra family of tangy stews, eaten mixed into rice. Sour, savoury and comforting.",
  'gongura-pappu': "Pappu is dal, the heart of an Andhra meal, and gongura pappu cooks toor dal with sour sorrel leaves before tempering it with garlic and dried chillies. Tangy and earthy. Mix it into hot rice with ghee.",
  'gutti-vankaya-masala': "Gutti vankaya is one of the great dishes of Telugu cooking: small brinjals slit and stuffed with a paste of roasted peanut, sesame and coconut, then braised in a tamarind gravy. Rich, nutty and tangy — eat it with rice.",
  'mulakkada-tomato-curry': "Mulakkada is the Telugu name for drumstick, the long green pod of the moringa tree. The pieces are simmered in a tangy tomato curry with mustard seeds and curry leaves; you chew the soft pulp from inside the pod. Good with rice.",
  'perugu-pulusu': "A yoghurt-based curry, also called majjiga pulusu, tempered with mustard seeds, dried chillies and curry leaves. Light and tangy. Pour it over hot rice.",
  'rasam': "Rasam, or chaaru in Telugu, is a thin, peppery broth of tamarind and tomato with spices. It is sipped like a soup or poured over rice, and no South Indian meal feels complete without it.",
  'sambar': "Sambar is the lentil and vegetable stew at the centre of South Indian cooking: toor dal with tamarind and vegetables, finished with a tempering of mustard seeds and curry leaves. Eat it with idli, dosa, vada or rice.",
  'tomato-pappu': "Tomato pappu is the everyday dal of Andhra homes: toor dal cooked with ripe tomatoes and tempered with mustard seeds, cumin and curry leaves, with ghee on top. Mild and comforting — mix it into rice and add a spoon of pickle.",
  'vankaya-tomato-curry': "Vankaya is brinjal. Here it is simmered in a tangy tomato curry with mustard seeds and curry leaves — a rustic, home-style Andhra dish to eat with rice or pappu.",

  // ── Prasada: Indo-Chinese ─────────────────────────────────────────────────
  'veg-fried-rice': "Indo-Chinese fried rice with mixed vegetables: basmati tossed in a hot wok with soy sauce and a hint of sesame. Light and colourful — good with crispy corn or crispy bhindi.",

  // ── Prasada: naivedyam ────────────────────────────────────────────────────
  'lemon-rice': "Nimmakaya pulihora: rice tossed with lemon juice, turmeric, mustard seeds, peanuts and curry leaves. Bright yellow, tangy and light — offered in temples and packed for journeys across South India.",
  'prasadam-pulihora': "Pulihora is tamarind rice, and this is the version offered as prasadam in temples: rice dressed with tamarind, hand-pounded spices, roasted groundnuts and sesame oil. Tangy, nutty and fragrant.",
  'pulihora': "Pulihora is the tamarind rice of Andhra festivals and temple offerings: rice mixed with a tangy tamarind paste, spices, roasted peanuts and curry leaves. Sour, nutty and gently spiced — traditionally eaten at room temperature.",

  // ── Prasada: starters and evening snacks ──────────────────────────────────
  'channa-chat': "A chaat of boiled chickpeas tossed with tamarind chutney, onion, tomato and green chilli and topped with crunchy sev. Sweet, sour and spicy in each spoonful.",
  'crispy-bhindi': "Sliced okra coated in spiced chickpea-flour batter and fried until crisp, which takes away the stickiness okra is known for. A snack on its own, or a crunchy side with sambar rice.",
  'crispy-corn': "Sweet corn kernels fried crisp and tossed with spices, herbs and lime. Light and crunchy — an easy starter to share.",
  'crispy-potato': "Thin slices of potato fried golden and seasoned with chaat masala and chilli. Simple and hard to stop eating.",
  'mirchi-bhajji-3pcs': "Mirchi bhajji is the chilli fritter of Andhra street corners, dipped in spiced gram-flour batter and fried until golden. Crunchy and hot — the classic snack with evening tea, and the traditional partner for uggani.",
  'onion-mirchi-bhajji-2pcs': "Thick slices of onion and green chilli dipped in spiced gram-flour batter and fried until golden. Crunchy and fiery — a rainy-day snack in Andhra, and very good with tea.",
  'peanut-chat': "Roasted peanuts tossed with onion, tomato, coriander, lemon and chaat masala. A quick, crunchy snack from Indian street stalls.",
  'potato-fry': "Aloo vepudu: cubes of potato pan-fried with mustard seeds, curry leaves and turmeric. A simple side dish from Andhra home cooking — good with sambar rice or rasam rice.",
  'punugulu': "Punugulu are a street snack from coastal Andhra: small spoonfuls of idli batter fried until puffed and golden, then tossed with curry leaves and chilli powder. Crisp outside and soft inside. Good with sambar or a masala buttermilk.",
  'zucchini-fritters': "Grated zucchini bound with gram flour and Andhra spices and fried into crisp fritters — a lighter take on the pakora.",

  // ── Prasada: thalis ───────────────────────────────────────────────────────
  'pappu-pappadam-roti-pachadi-rice-yogurt': "A simple Andhra home meal on one plate: hot rice, creamy dal (pappu), a crisp pappadam, a tomato-onion pachadi and yoghurt. Roti pachadi is the name for a chutney traditionally ground in a stone mortar. Plain, complete and comforting.",
  'veg-thali': "A thali is a whole meal on one plate. Ours brings rice and lemon rice with pappu, sambar and majjiga pulusu, vegetable fries, pachadi, podi, pickles, pappadam, a mirchi bajji and a little sweet. It is the full spread of a home-cooked Andhra vegetarian lunch.",
};

// Menu sections whose dishes sit one level down but have no sub-page of their own
const SECTION_LINKS = {
  'street-food': ['/street-food', 'Indian street food in Milton Keynes'],
  'ragi-specials': ['/ragi-specials', 'Ragi specials in Milton Keynes'],
  drinks: ['/drinks', 'Indian drinks & lassi in Milton Keynes'],
  snacks: ['/snacks', 'Andhra pickles & podis'],
};
// Sub-pages whose address differs from the section name stored on the dish
export const SUBPAGE_ALIAS = { 'starters-and-evening-delights': 'bites-starters' };

const stripSize = (name) => name.replace(/\s*\(\s*\d[^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

/** The extra text a dish page shows: its own paragraph, how to order it, and a link up to its section. */
export function dishContent(item) {
  const name = stripSize(item.name || '');
  const [, menu, sub] = buildItemUrl(item).split('/');
  const subSlug = SUBPAGE_ALIAS[sub] || sub;
  const subSeo = CATEGORY_SEO[menu]?.[subSlug];
  const parent = subSeo
    ? { href: `/${menu}/${subSlug}`, label: subSeo.h1.split(' — ')[0] }
    : SECTION_LINKS[menu] ? { href: SECTION_LINKS[menu][0], label: SECTION_LINKS[menu][1] } : null;
  const comingSoon = item.category === 'pickles' || item.category === 'podis';
  const order = comingSoon
    ? `${name} is part of our Andhra pickles and podis range — coming soon, with UK-wide delivery. Tap Notify Me and we will tell you when it launches.`
    : `Order ${name} online — collect from our Greenleys kitchen in Milton Keynes (MK12) and save 10%, or have it delivered.`;
  return { name, about: DISH_COPY[item.slug] || null, order, parent };
}
