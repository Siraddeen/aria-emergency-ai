/**
 * semanticEngine.js — ARIA Offline Semantic Intelligence
 *
 * PURPOSE:
 * This is the missing "AI brain" for offline mode.
 * Instead of matching exact phrases, ARIA now understands CONCEPTS.
 *
 * "water coming from tap is kind of smells what to do"
 *   → concepts extracted: [WATER, SMELL, TAP, PROBLEM]
 *   → scenario profile match: water_purification_advanced (concepts: WATER, CONTAMINATION, SMELL)
 *   → confident match ✓
 *
 * HOW IT WORKS — 3 layers:
 *
 * LAYER 1 — CONCEPT EXTRACTION
 *   Maps raw user words → abstract concepts via SURFACE_FORMS.
 *   "smells", "odor", "stink", "reeks", "funny smell" → all → concept SMELL
 *   "tap", "faucet", "pipe", "drinking water", "well" → all → concept WATER_SOURCE
 *   This is the semantic expansion the document asked for — done right.
 *   Not keyword arrays. Concept nodes with surface forms.
 *
 * LAYER 2 — SCENARIO CONCEPT PROFILES
 *   Each scenario is described as a set of {concept, weight} pairs.
 *   water_purification_advanced requires: WATER(3) + CONTAMINATION(4) + SMELL(2) + ...
 *   The scorer computes overlap between extracted concepts and scenario profiles.
 *   No phrase list needed. Works for any natural language expression.
 *
 * LAYER 3 — INTENT SIGNALS
 *   Short inputs with high-danger concepts get an emergency boost.
 *   "fire hot" → 2 tokens, FIRE concept present → boost to critical tier.
 *
 * RESULT:
 *   The offline engine now understands the MEANING of what the user typed,
 *   not just whether they happened to use the exact right words.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT DEFINITIONS
// Each concept is a named idea. Surface forms are all the ways a human
// might express that idea in natural language (including broken English,
// informal phrasing, and common misspellings).
// ─────────────────────────────────────────────────────────────────────────────

export const CONCEPTS = {

  // ── SUBSTANCE CONCEPTS ────────────────────────────────────────────────────

  WATER: [
    "water","waters","h2o","liquid","fluid","drink","drinking",
    "tap","faucet","pipe","well","stream","river","lake","puddle",
    "rain","rainwater","groundwater","borehole","spring",
  ],
  WATER_SOURCE: [
    "tap","faucet","pipe","pipes","well","stream","river","lake",
    "puddle","rain","spring","borehole","reservoir","canal",
    "from tap","from pipe","from well","drinking source",
  ],
  FOOD: [
    "food","eat","eating","meal","meals","cook","cooking","hungry","hunger",
    "starving","starvation","provisions","rations","supplies","edible",
    "nutrition","nourishment","groceries","bread","rice","meat","vegetables",
    "fruit","can","canned","stored food","storage","preserve","preservation",
    "spoiled","rotten","expired","gone bad","bad food","leftovers",
  ],
  FIRE: [
    "fire","fires","flame","flames","burning","burn","blaze","inferno",
    "smoke","smoky","ember","embers","spark","sparks","lit","ignite","ignition",
    "wildfire","house fire","building fire","room fire","caught fire",
    "on fire","ablaze","combustion","arson",
  ],
  SMOKE: [
    "smoke","smoky","fumes","toxic fumes","black smoke","thick smoke",
    "filled with smoke","can't see","visibility low","haze","fume",
  ],
  GAS: [
    "gas","lpg","propane","natural gas","methane","carbon monoxide","co",
    "fume","fumes","vapor","vapour","leak","leaking","hiss","hissing",
    "smell gas","gas smell","gas leak","gas pipe",
  ],
  CHEMICAL: [
    "chemical","chemicals","acid","base","bleach","chlorine","ammonia",
    "sarin","nerve agent","vx","toxic","toxin","poison gas","hazmat",
    "substance","unknown substance","white powder","spray","aerosol",
  ],
  RADIATION: [
    "radiation","radioactive","nuclear","fallout","blast","mushroom cloud",
    "geiger","contamination","dirty bomb","reactor","meltdown","exposure",
    "gamma","alpha","beta","rad","rem","sievert",
  ],

  // ── SENSATION / SYMPTOM CONCEPTS ─────────────────────────────────────────

  SMELL: [
    "smell","smells","smelling","smelled","odor","odour","stink","stinks",
    "stinking","reek","reeking","reeks","stench","stenchy","malodor",
    "funny smell","weird smell","bad smell","strange smell","odd smell",
    "foul","foul smell","rotten smell","putrid","musty","sulfur",
    "rotten egg","metallic smell","chemical smell","unusual smell",
    "kind of smells","sort of smells","smells a bit","smells like",
    "has a smell","has smell","giving off smell","giving off odor",
  ],
  PAIN: [
    "pain","painful","hurts","hurt","hurting","ache","aching","aches",
    "sore","soreness","tender","tenderness","throbbing","sharp pain",
    "dull pain","burning pain","stabbing pain","pressure","agony",
    "excruciating","unbearable","discomfort","sensation","feel pain",
  ],
  BLEEDING: [
    "bleed","bleeding","bleeds","blood","bloody","hemorrhage","hemorrhaging",
    "spurting","gushing","losing blood","blood loss","red","clot",
    "wound bleeding","cut bleeding","wont stop bleeding","cant stop",
    "soaking through","soaked","bandage soaked","blood everywhere",
  ],
  BREATHING: [
    "breath","breathe","breathing","breaths","inhale","exhale","respiration",
    "airway","lungs","chest","wheeze","wheezing","gasp","gasping",
    "cant breathe","can't breathe","no breath","short of breath",
    "shortness of breath","difficulty breathing","hard to breathe",
    "trouble breathing","choking","suffocating","suffocation","stridor",
  ],
  UNCONSCIOUS: [
    "unconscious","unresponsive","not responding","wont wake","wont wake up",
    "won't wake","passed out","blacked out","fainted","fainting","collapse",
    "collapsed","collapsing","no response","eyes rolled","limp",
    "not moving","not conscious","lost consciousness","loss of consciousness",
  ],
  FEVER: [
    "fever","hot","temperature","temp","high temp","burning up","sweating",
    "chills","shiver","shivering","flushed","flushing","overheating",
    "body heat","feels warm","too warm","very warm","burning skin",
    "38","39","40","41","38 degrees","39 degrees","40 degrees",
    "high temperature","running fever","running hot","hyperthermia",
  ],
  NAUSEA: [
    "nausea","nauseous","sick","vomit","vomiting","throw up","throwing up",
    "puking","puke","queasy","stomach","upset stomach","feel sick",
    "feeling sick","dizzy","dizziness","lightheaded","faint","faintness",
  ],
  SWELLING: [
    "swelling","swollen","swell","puffed up","puffy","inflamed","inflammation",
    "red","redness","bump","lump","bruise","bruising","hive","hives",
    "rash","blister","blisters","anaphylaxis","allergic",
  ],
  NUMBNESS: [
    "numb","numbness","tingling","pins and needles","cant feel","can't feel",
    "no feeling","sensation lost","paralyzed","paralysis","limp",
    "weakness","weak limb","leg numb","arm numb","wont move",
  ],

  // ── BODY PART CONCEPTS ────────────────────────────────────────────────────

  HEAD_NECK: [
    "head","neck","skull","brain","face","jaw","scalp","forehead","temple",
    "cervical","spine top","nape","throat","larynx","trachea",
    "head injury","neck injury","neck broken","head wound","concussion",
  ],
  CHEST: [
    "chest","heart","cardiac","sternum","rib","ribs","lung","lungs",
    "thorax","breast","breastbone","pectoral","coronary","heartbeat",
    "chest pain","chest pressure","chest wound","heart stopped",
    "no pulse","pulse","heartbeat",
  ],
  LIMB: [
    "arm","leg","hand","foot","feet","finger","toe","knee","elbow",
    "wrist","ankle","shoulder","hip","thigh","shin","calf",
    "broken arm","broken leg","arm broken","leg broken","twisted",
    "sprained","dislocated","bone sticking out",
  ],
  BACK_SPINE: [
    "back","spine","spinal","vertebra","vertebrae","lumbar","thoracic",
    "back injury","spine injury","back pain","cant move back",
    "back broken","paralyzed from","waist down","fell on back",
  ],
  EYES: [
    "eye","eyes","vision","sight","blind","blurry","blur","pupil","pupils",
    "eye injury","eye pain","chemical in eye","burn in eye","foreign body",
    "cant see","losing vision","vision loss","eye wound",
  ],
  SKIN: [
    "skin","flesh","dermis","surface","epidermis","tissue","burn","burned",
    "blistered","peeling","raw","exposed","third degree","second degree",
    "charred","scar","wound","laceration","abrasion","scrape",
  ],

  // ── ACTION / SITUATION CONCEPTS ───────────────────────────────────────────

  FALL: [
    "fall","fell","fallen","falling","drop","dropped","tumble","tumbled",
    "trip","tripped","slipped","slip","from height","from building",
    "down stairs","off roof","off ledge","down","impact",
  ],
  DROWNING: [
    "drown","drowning","drowned","water","submerge","submerged","underwater",
    "under water","cant swim","can't swim","going under","pull under",
    "swept away","swept","flood","flash flood","current",
  ],
  BITE: [
    "bite","bitten","bit","sting","stung","attack","attacked","scratch",
    "scratched","venom","venomous","snake","spider","dog","animal",
    "insect","bee","wasp","jellyfish","scorpion","fangs","fang",
  ],
  TRAPPED: [
    "trapped","stuck","cant get out","can't get out","cant escape","locked",
    "pinned","crushed","debris","rubble","buried","collapsed on","cave in",
    "no exit","exit blocked","door blocked","surrounded",
  ],
  CONTAMINATION: [
    "contaminated","contamination","dirty","unclean","unsafe","unsafe to drink",
    "polluted","pollution","toxic","infected water","bad","bad water",
    "strange","weird","unusual","odd","not right","something wrong",
    "off","looks off","tastes off","smells off","murky","cloudy",
    "brown water","yellow water","green water",
  ],
  SHOCK_ELECTRIC: [
    "electric","electrical","electrocuted","electrocution","shock","zapped",
    "wire","wires","live wire","exposed wire","power line","lightning",
    "socket","outlet","touched wire","grabbed wire",
  ],
  EXPLOSION: [
    "explosion","explode","exploded","bomb","blast","detonation","mine",
    "landmine","ied","tripwire","debris","shrapnel","shockwave",
  ],

  // ── SURVIVAL SITUATION CONCEPTS ───────────────────────────────────────────

  LOST: [
    "lost","lose","losing","no gps","no signal","no map","disoriented",
    "dont know where","don't know where","cant find way","which direction",
    "no compass","find north","find south","find way","navigate",
    "direction","location unknown",
  ],
  COLD: [
    "cold","freezing","freeze","frozen","hypothermia","frostbite","chilly",
    "temperature drop","very cold","too cold","icy","ice","snow","blizzard",
    "shivering","shiver","cant get warm","no heat","shelter cold",
  ],
  HEAT: [
    "heat","hot","heatstroke","heat stroke","heat exhaustion","overheating",
    "sun","sunburn","dehydrated","dehydration","sweating heavily",
    "no shade","direct sun","high temperature outside",
  ],
  NO_SHELTER: [
    "no shelter","no roof","exposed","outside","stranded","stuck outside",
    "need shelter","build shelter","emergency shelter","protection",
    "weather","rain","storm","unsafe building","collapsed building",
  ],
  NO_WATER: [
    "no water","out of water","running out of water","water source",
    "find water","need water","dehydrated","thirsty","no drinking water",
    "water supply","water gone","water finished",
  ],
  NO_FOOD: [
    "no food","out of food","food gone","nothing to eat","starving",
    "food finished","no provisions","no rations","food ran out",
    "running out of food","hunger","starvation","need food","find food",
  ],
  SIGNAL: [
    "signal","rescue","help signal","sos","flare","mirror","whistle",
    "rescue team","found","locate me","find me","search and rescue",
    "seen","visible","visible from air","helicopter","plane sees",
  ],
  BUILDING_FIRE_ESCAPE: [
    "escape","exit","way out","get out","evacuate","evacuation","flee",
    "run from","leave building","leave house","trapped inside",
    "cant get out","door hot","staircase","emergency exit","fire exit",
  ],

  // ── MEDICAL PROCEDURE CONCEPTS ────────────────────────────────────────────

  CPR: [
    "cpr","chest compression","compressions","resuscitate","resuscitation",
    "rescue breath","rescue breathing","aed","defibrillator","revive",
    "bring back","not breathing","heart stopped","cardiac","died",
  ],
  WOUND_CARE: [
    "wound","wounds","cut","cuts","laceration","gash","stab","stabbed",
    "slice","sliced","puncture","punctured","torn","torn skin","open wound",
    "close wound","stitch","stitches","suture","bandage","dress",
    "clean wound","infection","infected","getting infected",
  ],
  FRACTURE: [
    "fracture","fractured","broken","broke","break","bone","bones",
    "crack","cracked","snap","snapped","dislocated","dislocation",
    "splint","cast","arm broken","leg broken","bone sticking",
  ],
  BIRTH: [
    "birth","born","giving birth","childbirth","labor","labour","delivery",
    "contractions","crowning","baby coming","water broke","waters broke",
    "due","pregnant","pregnancy","deliver","newborn","premature",
  ],
  ALLERGY: [
    "allergy","allergic","anaphylaxis","anaphylactic","epipen","epinephrine",
    "throat closing","throat swelling","swollen throat","hives",
    "reaction","bad reaction","swelling up","face swelling","lip swelling",
  ],
  POISON: [
    "poison","poisoned","ingested","swallowed","drank","ate","toxic",
    "substance","chemical ingestion","overdose","pills","medication",
    "accidental","child swallowed","ate plant","mushroom","berries",
  ],

  // ── INFRASTRUCTURE CONCEPTS ───────────────────────────────────────────────

  POWER: [
    "power","electricity","electric","electrical","generator","battery",
    "solar","panel","panels","inverter","charge","charging","charge controller",
    "no power","power outage","blackout","power cut","off grid",
    "make power","generate power","generate electricity",
  ],
  COMMUNICATION: [
    "communication","communicate","contact","radio","walkie talkie","ham radio",
    "signal","no phone","no signal","message","send message","reach out",
    "satellite","frequency","broadcast","shortwave","antenna",
  ],
  SECURITY: [
    "security","safe","defense","defend","protect","protection","threat",
    "danger","dangerous","enemy","attack","intrusion","guard","fortify",
    "sandbag","barricade","perimeter","checkpoint","patrol",
  ],
  DOCUMENT: [
    "document","documents","passport","id","identification","papers",
    "certificate","record","preserve","waterproof","backup","copy",
    "important papers","keep safe","store safely",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO CONCEPT PROFILES
// Each scenario is described as concept → weight pairs.
// The scorer computes how many of the required concepts appear in the input.
// Weights represent how central that concept is to the scenario.
//
// Design principle:
//   - Primary concept (what it IS about): weight 4–5
//   - Supporting concept (context that confirms it): weight 2–3
//   - Distinguishing concept (separates from similar scenarios): weight 3–4
// ─────────────────────────────────────────────────────────────────────────────

export const SCENARIO_PROFILES = {

  // ── CRITICAL EMERGENCIES ──────────────────────────────────────────────────

  cpr: [
    { concept: "CPR",          weight: 5 },
    { concept: "UNCONSCIOUS",  weight: 5 },
    { concept: "BREATHING",    weight: 5 },
    { concept: "CHEST",        weight: 4 },
    { concept: "PAIN",         weight: 2 },
    { concept: "NAUSEA",       weight: 1 },
  ],
  bleeding: [
    { concept: "BLEEDING",     weight: 5 },
    { concept: "WOUND_CARE",   weight: 4 },
    { concept: "PAIN",         weight: 2 },
    { concept: "SKIN",         weight: 2 },
    { concept: "LIMB",         weight: 1 },
  ],
  gunshot_wound: [
    { concept: "BLEEDING",     weight: 5 },
    { concept: "EXPLOSION",    weight: 3 },
    { concept: "CHEST",        weight: 3 },
    { concept: "WOUND_CARE",   weight: 4 },
    { concept: "PAIN",         weight: 2 },
  ],
  burns: [
    { concept: "FIRE",         weight: 4 },
    { concept: "SKIN",         weight: 5 },
    { concept: "PAIN",         weight: 3 },
    { concept: "SMELL",        weight: 1 },
  ],
  fire: [
    { concept: "FIRE",         weight: 5 },
    { concept: "SMOKE",        weight: 4 },
    { concept: "TRAPPED",      weight: 4 },
    { concept: "BUILDING_FIRE_ESCAPE", weight: 5 },
    { concept: "WATER_SOURCE", weight: 1 },
  ],
  drowning: [
    { concept: "DROWNING",     weight: 5 },
    { concept: "WATER",        weight: 4 },
    { concept: "BREATHING",    weight: 4 },
    { concept: "UNCONSCIOUS",  weight: 3 },
  ],
  allergic_reaction: [
    { concept: "ALLERGY",      weight: 5 },
    { concept: "SWELLING",     weight: 4 },
    { concept: "BREATHING",    weight: 4 },
    { concept: "SKIN",         weight: 2 },
  ],
  snakebite: [
    { concept: "BITE",         weight: 5 },
    { concept: "SWELLING",     weight: 3 },
    { concept: "PAIN",         weight: 3 },
    { concept: "NUMBNESS",     weight: 3 },
    { concept: "NAUSEA",       weight: 2 },
  ],
  choking: [
    { concept: "BREATHING",    weight: 5 },
    { concept: "HEAD_NECK",    weight: 4 },
    { concept: "FOOD",         weight: 2 },
    { concept: "UNCONSCIOUS",  weight: 3 },
  ],
  spinal_injury: [
    { concept: "BACK_SPINE",   weight: 5 },
    { concept: "NUMBNESS",     weight: 5 },
    { concept: "FALL",         weight: 3 },
    { concept: "PAIN",         weight: 3 },
    { concept: "LIMB",         weight: 2 },
  ],
  childbirth_emergency: [
    { concept: "BIRTH",        weight: 5 },
    { concept: "PAIN",         weight: 3 },
    { concept: "BLEEDING",     weight: 3 },
  ],
  electric_shock: [
    { concept: "SHOCK_ELECTRIC", weight: 5 },
    { concept: "UNCONSCIOUS",  weight: 3 },
    { concept: "BREATHING",    weight: 3 },
    { concept: "BURN",         weight: 2 },
  ],
  electricity: [
    { concept: "SHOCK_ELECTRIC", weight: 5 },
    { concept: "POWER",        weight: 3 },
    { concept: "UNCONSCIOUS",  weight: 2 },
  ],
  gas_leak: [
    { concept: "GAS",          weight: 5 },
    { concept: "SMELL",        weight: 4 },
    { concept: "FIRE",         weight: 3 },
    { concept: "BREATHING",    weight: 3 },
    { concept: "TRAPPED",      weight: 2 },
  ],
  chemical_attack: [
    { concept: "CHEMICAL",     weight: 5 },
    { concept: "BREATHING",    weight: 4 },
    { concept: "EYES",         weight: 3 },
    { concept: "SKIN",         weight: 3 },
    { concept: "NAUSEA",       weight: 2 },
  ],
  nuclear_radiation: [
    { concept: "RADIATION",    weight: 5 },
    { concept: "EXPLOSION",    weight: 3 },
    { concept: "CONTAMINATION",weight: 3 },
    { concept: "NO_SHELTER",   weight: 2 },
  ],
  explosive_landmine: [
    { concept: "EXPLOSION",    weight: 5 },
    { concept: "BLEEDING",     weight: 3 },
    { concept: "LIMB",         weight: 3 },
    { concept: "PAIN",         weight: 2 },
  ],
  triage: [
    { concept: "PAIN",         weight: 3 },
    { concept: "BLEEDING",     weight: 3 },
    { concept: "UNCONSCIOUS",  weight: 3 },
    { concept: "CPR",          weight: 3 },
  ],
  infection_sepsis: [
    { concept: "WOUND_CARE",   weight: 4 },
    { concept: "FEVER",        weight: 4 },
    { concept: "SMELL",        weight: 2 },
    { concept: "SWELLING",     weight: 3 },
    { concept: "PAIN",         weight: 2 },
  ],

  // ── MEDICAL ───────────────────────────────────────────────────────────────

  fever: [
    { concept: "FEVER",        weight: 5 },
    { concept: "PAIN",         weight: 2 },
    { concept: "NAUSEA",       weight: 2 },
    { concept: "COLD",         weight: 1 },
  ],
  bone_fracture: [
    { concept: "FRACTURE",     weight: 5 },
    { concept: "LIMB",         weight: 4 },
    { concept: "PAIN",         weight: 3 },
    { concept: "FALL",         weight: 2 },
  ],
  fall_injury: [
    { concept: "FALL",         weight: 5 },
    { concept: "PAIN",         weight: 4 },
    { concept: "LIMB",         weight: 3 },
    { concept: "HEAD_NECK",    weight: 2 },
    { concept: "BLEEDING",     weight: 2 },
  ],
  wound_closure: [
    { concept: "WOUND_CARE",   weight: 5 },
    { concept: "BLEEDING",     weight: 3 },
    { concept: "SKIN",         weight: 3 },
    { concept: "PAIN",         weight: 2 },
  ],
  heat_exhaustion: [
    { concept: "HEAT",         weight: 5 },
    { concept: "NAUSEA",       weight: 3 },
    { concept: "FEVER",        weight: 3 },
    { concept: "UNCONSCIOUS",  weight: 3 },
    { concept: "NO_WATER",     weight: 2 },
  ],
  dehydration_treatment: [
    { concept: "NO_WATER",     weight: 4 },
    { concept: "HEAT",         weight: 3 },
    { concept: "NAUSEA",       weight: 3 },
    { concept: "PAIN",         weight: 2 },
  ],
  hypothermia: [
    { concept: "COLD",         weight: 5 },
    { concept: "UNCONSCIOUS",  weight: 3 },
    { concept: "BREATHING",    weight: 3 },
    { concept: "NAUSEA",       weight: 2 },
  ],
  pregnancy_complications: [
    { concept: "BIRTH",        weight: 4 },
    { concept: "PAIN",         weight: 3 },
    { concept: "BLEEDING",     weight: 3 },
    { concept: "NAUSEA",       weight: 2 },
  ],
  psychological_first_aid: [
    { concept: "PAIN",         weight: 1 },
    { concept: "NAUSEA",       weight: 1 },
  ],
  medicine_improvised: [
    { concept: "PAIN",         weight: 3 },
    { concept: "FEVER",        weight: 3 },
    { concept: "WOUND_CARE",   weight: 3 },
    { concept: "NO_FOOD",      weight: 1 },
  ],
  poison_ingestion: [
    { concept: "POISON",       weight: 5 },
    { concept: "NAUSEA",       weight: 4 },
    { concept: "PAIN",         weight: 3 },
    { concept: "FOOD",         weight: 2 },
  ],
  eye_injury: [
    { concept: "EYES",         weight: 5 },
    { concept: "PAIN",         weight: 3 },
    { concept: "CHEMICAL",     weight: 2 },
    { concept: "FIRE",         weight: 1 },
  ],
  insect_stings: [
    { concept: "BITE",         weight: 5 },
    { concept: "SWELLING",     weight: 4 },
    { concept: "PAIN",         weight: 3 },
    { concept: "ALLERGY",      weight: 3 },
  ],
  animal_bite: [
    { concept: "BITE",         weight: 5 },
    { concept: "BLEEDING",     weight: 3 },
    { concept: "WOUND_CARE",   weight: 3 },
    { concept: "PAIN",         weight: 2 },
  ],
  childrens_emergency: [
    { concept: "FEVER",        weight: 3 },
    { concept: "BREATHING",    weight: 3 },
    { concept: "NAUSEA",       weight: 3 },
    { concept: "UNCONSCIOUS",  weight: 4 },
  ],

  // ── SURVIVAL ──────────────────────────────────────────────────────────────

  water: [
    { concept: "NO_WATER",     weight: 5 },
    { concept: "WATER",        weight: 4 },
    { concept: "HEAT",         weight: 2 },
  ],
  water_purification_advanced: [
    { concept: "WATER",        weight: 4 },
    { concept: "CONTAMINATION",weight: 5 },
    { concept: "SMELL",        weight: 4 },
    { concept: "WATER_SOURCE", weight: 3 },
  ],
  water_collection: [
    { concept: "WATER",        weight: 4 },
    { concept: "NO_WATER",     weight: 4 },
    { concept: "WATER_SOURCE", weight: 3 },
  ],
  food: [
    { concept: "FOOD",         weight: 5 },
    { concept: "NO_FOOD",      weight: 4 },
  ],
  food_preservation: [
    { concept: "FOOD",         weight: 5 },
    { concept: "CONTAMINATION",weight: 3 },
    { concept: "NO_FOOD",      weight: 3 },
  ],
  shelter: [
    { concept: "NO_SHELTER",   weight: 5 },
    { concept: "COLD",         weight: 3 },
    { concept: "HEAT",         weight: 2 },
    { concept: "TRAPPED",      weight: 2 },
  ],
  fire_making: [
    { concept: "FIRE",         weight: 4 },
    { concept: "COLD",         weight: 3 },
    { concept: "NO_SHELTER",   weight: 2 },
  ],
  navigation: [
    { concept: "LOST",         weight: 5 },
    { concept: "COMMUNICATION",weight: 2 },
  ],
  signal_rescue: [
    { concept: "SIGNAL",       weight: 5 },
    { concept: "LOST",         weight: 4 },
    { concept: "COMMUNICATION",weight: 3 },
  ],
  plant_identification: [
    { concept: "FOOD",         weight: 4 },
    { concept: "POISON",       weight: 3 },
    { concept: "NO_FOOD",      weight: 3 },
  ],
  long_term_survival: [
    { concept: "NO_FOOD",      weight: 3 },
    { concept: "NO_WATER",     weight: 3 },
    { concept: "NO_SHELTER",   weight: 3 },
    { concept: "LOST",         weight: 2 },
    { concept: "SIGNAL",       weight: 2 },
  ],
  animal_threats: [
    { concept: "BITE",         weight: 4 },
    { concept: "SECURITY",     weight: 3 },
    { concept: "LOST",         weight: 2 },
  ],
  bridge_crossing: [
    { concept: "WATER",        weight: 3 },
    { concept: "LOST",         weight: 3 },
    { concept: "FALL",         weight: 2 },
  ],
  mental: [
    { concept: "PAIN",         weight: 1 },
    { concept: "NAUSEA",       weight: 1 },
  ],
  sanitation: [
    { concept: "CONTAMINATION",weight: 4 },
    { concept: "FOOD",         weight: 2 },
    { concept: "WATER",        weight: 2 },
    { concept: "SMELL",        weight: 3 },
  ],

  // ── TECHNICAL ─────────────────────────────────────────────────────────────

  solar_power: [
    { concept: "POWER",        weight: 5 },
    { concept: "COMMUNICATION",weight: 2 },
    { concept: "NO_SHELTER",   weight: 1 },
  ],
  battery_diy: [
    { concept: "POWER",        weight: 5 },
    { concept: "COMMUNICATION",weight: 2 },
  ],
  electricity_generation: [
    { concept: "POWER",        weight: 5 },
    { concept: "COMMUNICATION",weight: 2 },
    { concept: "SECURITY",     weight: 1 },
  ],
  electricity_wiring: [
    { concept: "SHOCK_ELECTRIC",weight: 4 },
    { concept: "POWER",        weight: 4 },
  ],
  communication_security: [
    { concept: "COMMUNICATION",weight: 5 },
    { concept: "SECURITY",     weight: 4 },
  ],
  radio_communication: [
    { concept: "COMMUNICATION",weight: 5 },
    { concept: "SIGNAL",       weight: 3 },
    { concept: "LOST",         weight: 2 },
  ],
  communications_no_phone: [
    { concept: "COMMUNICATION",weight: 5 },
    { concept: "SIGNAL",       weight: 4 },
    { concept: "LOST",         weight: 2 },
  ],
  building_defenses: [
    { concept: "SECURITY",     weight: 5 },
    { concept: "NO_SHELTER",   weight: 3 },
    { concept: "EXPLOSION",    weight: 2 },
  ],
  document_preservation: [
    { concept: "DOCUMENT",     weight: 5 },
    { concept: "SECURITY",     weight: 2 },
  ],
  knots_rigging: [
    { concept: "FALL",         weight: 2 },
    { concept: "SIGNAL",       weight: 1 },
    { concept: "NO_SHELTER",   weight: 1 },
  ],
  improvised_weapons: [
    { concept: "SECURITY",     weight: 5 },
    { concept: "BITE",         weight: 2 },
    { concept: "EXPLOSION",    weight: 2 },
  ],
  vehicle_survival: [
    { concept: "TRAPPED",      weight: 4 },
    { concept: "COLD",         weight: 3 },
    { concept: "HEAT",         weight: 3 },
    { concept: "LOST",         weight: 3 },
  ],
  penicillin_antibiotics: [
    { concept: "WOUND_CARE",   weight: 4 },
    { concept: "FEVER",        weight: 3 },
    { concept: "INFECTION_SEPSIS", weight: 3 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT EXTRACTOR
// The core of the semantic engine.
// Scans the input text and returns a map of { conceptName: matchStrength }
// matchStrength > 1 when multiple surface forms of the same concept appear.
// ─────────────────────────────────────────────────────────────────────────────

export function extractConcepts(inputText) {
  const text = (inputText || "").toLowerCase().trim();
  const found = {}; // conceptName → strength (how many surface forms matched)

  for (const [conceptName, surfaceForms] of Object.entries(CONCEPTS)) {
    let strength = 0;
    for (const form of surfaceForms) {
      // Multi-word form: substring match
      if (form.includes(" ")) {
        if (text.includes(form)) {
          strength += 1.5; // multi-word is a stronger signal
        }
      } else {
        // Single word: whole-word boundary match to avoid "arm" matching "alarm"
        const re = new RegExp(`\\b${escapeRegex(form)}\\b`, "i");
        if (re.test(text)) {
          strength += 1;
        }
      }
    }
    if (strength > 0) {
      found[conceptName] = strength;
    }
  }

  return found;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC SCORER
// Computes how well an input's extracted concepts match each scenario's profile.
// Returns a score map { scenarioKey: score }.
//
// Score formula per scenario:
//   For each (concept, profileWeight) in scenario profile:
//     if concept found in input:
//       score += profileWeight * min(foundStrength, 2.0) * 0.5
//
// The * 0.5 keeps semantic scores in the same ballpark as phrase scores (weight 3-5)
// so the combined scoring in offlineEngine stays balanced.
// ─────────────────────────────────────────────────────────────────────────────

export function scoreSemantics(extractedConcepts, multiplier = 1.0) {
  const scores = {};

  for (const [scenarioKey, profile] of Object.entries(SCENARIO_PROFILES)) {
    let score = 0;
    let profileWeightTotal = 0;

    for (const { concept, weight } of profile) {
      profileWeightTotal += weight;
      const foundStrength = extractedConcepts[concept] ?? 0;
      if (foundStrength > 0) {
        // Cap strength at 2 to prevent single-concept domination
        score += weight * Math.min(foundStrength, 2.0) * 0.5;
      }
    }

    // Coverage ratio bonus: if we matched most of the profile concepts → boost
    const profileConcepts = profile.length;
    const matchedConcepts = profile.filter(({ concept }) =>
      (extractedConcepts[concept] ?? 0) > 0
    ).length;
    const coverage = matchedConcepts / profileConcepts;

    if (coverage >= 0.6) {
      score *= (1 + (coverage - 0.5) * 0.5); // up to 25% bonus at full coverage
    }

    scores[scenarioKey] = score * multiplier;
  }

  return scores;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY CONCEPT CHECK
// Used for short-input boosting (Fix #4 from the document).
// Returns true if ANY high-danger concept is present.
// ─────────────────────────────────────────────────────────────────────────────

const EMERGENCY_CONCEPTS = new Set([
  "CPR","BLEEDING","BREATHING","UNCONSCIOUS","FIRE","SMOKE","GAS",
  "CHEMICAL","RADIATION","SHOCK_ELECTRIC","EXPLOSION","DROWNING",
  "ALLERGY","BITE","BURN",
]);

export function hasEmergencyConcept(extractedConcepts) {
  return Object.keys(extractedConcepts).some((c) => EMERGENCY_CONCEPTS.has(c));
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT DEBUG HELPER  (dev only — remove in prod)
// ─────────────────────────────────────────────────────────────────────────────

export function debugConcepts(inputText) {
  const concepts = extractConcepts(inputText);
  console.log(`[ARIA Semantics] Input: "${inputText}"`);
  console.log("[ARIA Semantics] Extracted concepts:", concepts);
  const semanticScores = scoreSemantics(concepts);
  const top5 = Object.entries(semanticScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  console.log("[ARIA Semantics] Top 5 semantic scores:", top5);
  return { concepts, top5 };
}
