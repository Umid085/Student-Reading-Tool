import { useState, useRef, useEffect } from "react";
import { track, identify, resetIdentity } from "./observability";
import { pickFriendNudge, pickResultNudge } from "./friendNudge";
import { STORY_LIBRARY } from "./storyLibrary";
import { STRINGS, loadLocale } from "./locales";

var API        = "/api/generate";
var AUTH       = "/api/auth";
var REGISTER   = "/api/register";
var REFRESH    = "/api/refresh";
var REVOKE     = "/api/revoke";
var USERS_API  = "/api/users";
var _sessionToken = null;
var USERS_KEY    = "rq-users-v6";
var BOARDS_KEY   = "rq-boards-v6";
var SOCIAL_KEY   = "rq-social-v6";
var CREDS_KEY    = "rq-credentials";
var VOCAB_KEY    = "rq-vocab-v1";
var DAILY_KEY    = "rq-daily-v1";
var DAILY_LB_KEY = "rq-daily-lb-v1";
var FAVS_KEY     = "rq-favs-v1";
var WEEKLY_KEY   = "rq-weekly-v1";
var DISCUSS_KEY  = "rq-discuss-v1";
var QUOTES_KEY   = "rq-quotes-v1";
var CLASSES_KEY      = "rq-classes-v1";
var ASSIGNMENTS_KEY  = "rq-assignments-v1";


var LEVELS = [
  {key:"A1",color:"#22c55e",glow:"rgba(34,197,94,0.25)",  mult:1,  timeLimit:150,timeBonus:200,desc:"Elementary"},
  {key:"A2",color:"#16a34a",glow:"rgba(22,163,74,0.25)",  mult:1.5,timeLimit:150,timeBonus:200,desc:"Elementary+"},
  {key:"B1",color:"#f59e0b",glow:"rgba(245,158,11,0.25)", mult:2,  timeLimit:180,timeBonus:300,desc:"Intermediate"},
  {key:"B2",color:"#d97706",glow:"rgba(217,119,6,0.25)",  mult:2.5,timeLimit:180,timeBonus:300,desc:"Upper-Intermediate"},
  {key:"C1",color:"#6366f1",glow:"rgba(99,102,241,0.25)", mult:3,  timeLimit:210,timeBonus:400,desc:"Advanced"},
  {key:"C2",color:"#ec4899",glow:"rgba(236,72,153,0.25)", mult:4,  timeLimit:210,timeBonus:400,desc:"Mastery"}
];

// Demo passage + 5 MCQs for no-signup landing demo. B1 level, ~260 words.
var DEMO_QUIZ = {
  title:"Why Do Cats Purr?",
  level:"B1",
  passage:"Most people think cats purr only when they are happy, but the truth is more interesting. A cat may purr while it is being stroked on a warm sofa — but it can also purr when it is hurt, frightened or even close to death.\n\nScientists believe purring helps cats heal themselves. The sound has a frequency of about 25 to 150 hertz, and research suggests that these vibrations can speed up the growth of bones and the healing of soft tissue. In other words, when a cat purrs, it may be giving itself a kind of medicine.\n\nKittens start to purr when they are just a few days old. At that age they cannot yet see properly, so the purring helps them stay connected to their mother. The mother cat purrs back, and the gentle vibration tells the kittens where she is and that they are safe. This early conversation might be one of the first sounds a kitten ever learns to make.\n\nAdult cats often purr around the humans they trust. Some scientists have even noticed that certain purrs sound more like a baby's cry — a special kind of purr that cats use when they want food. People find it hard to ignore, which is probably why it works so well.\n\nSo a purr is not just a sign of joy. It is a complicated tool. It comforts kittens, calms anxious cats, helps healing, and even helps cats ask for what they want. The next time your cat purrs, remember: it is saying much more than 'I'm happy.'",
  questions:[
    {q:"According to the passage, when do cats purr?", options:["Only when they are happy","Only when they are kittens","In many different situations, including pain","Only when their owner is at home"], answer:2, explain:"Paragraph 1 says cats can purr when happy but also when 'hurt, frightened or even close to death.'"},
    {q:"What do scientists think the purring vibrations can do?", options:["Make cats sleep longer","Help bones grow and tissue heal","Improve a cat's eyesight","Help cats run faster"], answer:1, explain:"Paragraph 2: vibrations 'can speed up the growth of bones and the healing of soft tissue.'"},
    {q:"Why is purring important for kittens?", options:["It helps them learn to walk","It keeps them warm in winter","It connects them to their mother before they can see well","It scares away other cats"], answer:2, explain:"Paragraph 3: kittens cannot yet see properly, so purring helps them stay connected to their mother."},
    {q:"What is special about the 'food-asking' purr?", options:["It is silent","It sounds a bit like a baby's cry","Only adult male cats do it","It lasts for hours"], answer:1, explain:"Paragraph 4: 'certain purrs sound more like a baby's cry — a special kind of purr that cats use when they want food.'"},
    {q:"What is the main idea of the passage?", options:["Cats purr only because they are happy","Purring is just a random noise","Purring serves many different purposes for cats","People should pet cats more often"], answer:2, explain:"The last paragraph summarises: purring 'comforts kittens, calms anxious cats, helps healing, and even helps cats ask for what they want.'"}
  ]
};

var PRESET_THEMES = [
  {id:"indigo", name:"Indigo", emoji:"💜", accent:"#6366f1", secondary:"#34d399"},
  {id:"ocean", name:"Ocean", emoji:"🌊", accent:"#06b6d4", secondary:"#818cf8"},
  {id:"forest", name:"Forest", emoji:"🌿", accent:"#22c55e", secondary:"#f59e0b"},
  {id:"magenta", name:"Magenta", emoji:"🌸", accent:"#ec4899", secondary:"#a78bfa"},
  {id:"sunset", name:"Sunset Fire", emoji:"🌅", accent:"#ff6b35", secondary:"#ff3300"},
  {id:"neon", name:"Neon Green", emoji:"⚡", accent:"#00ff88", secondary:"#00cc66"},
  {id:"synthwave", name:"Synthwave", emoji:"🎸", accent:"#ff00ff", secondary:"#cc00cc"},
  {id:"gold", name:"Golden Hour", emoji:"✨", accent:"#ffd700", secondary:"#ff8c00"},
  {id:"cosmic", name:"Cosmic Purple", emoji:"🔮", accent:"#7c4dff", secondary:"#651fff"},
  {id:"ice", name:"Ice Crystal", emoji:"❄️", accent:"#00e5ff", secondary:"#00b0ff"}
];

var Q_LABELS = {mcq:"Multiple Choice",gap_word:"Gap Fill - Words",gap_sentence:"Gap Fill - Sentences",matching:"Matching",heading:"Match Headings",qa:"Open Answer",tfnm:"True/False/Not Mentioned",ynng:"Yes/No/Not Given"};
var Q_XP = {mcq:1,gap_word:1,gap_sentence:1,matching:3,heading:3,qa:2,tfnm:1,ynng:1};

var Q_HINTS = {
  mcq:"Read all options before choosing. Eliminate clearly wrong answers first. Watch for absolute words like 'always' or 'never' — they're often traps.",
  gap_word:"Think about grammar (noun/verb/adjective?) and meaning. Re-read the sentence with your choice to hear if it sounds natural.",
  gap_sentence:"Look at the sentences before AND after the gap for clues. The inserted sentence must connect logically with both neighbours.",
  matching:"Match the easiest pairs first to reduce your options. Look for synonyms and paraphrases — the wording will rarely be identical.",
  heading:"Read the full paragraph, then choose a heading that covers the MAIN idea, not just a detail mentioned in one sentence.",
  qa:"Answer in your own words using evidence from the passage. Aim for 1–2 complete sentences; avoid copying large chunks verbatim.",
  tfnm:"TRUE = passage clearly states it. FALSE = passage directly contradicts it. NOT MENTIONED = the passage says nothing about it — don't guess.",
  ynng:"YES = passage agrees with the statement. NO = passage disagrees. NOT GIVEN = the passage neither confirms nor denies it."
};

var WORD_OF_DAY=[
  {word:"Ephemeral",phonetic:"/ɪˈfem(ə)rəl/",type:"adj",def:"Lasting for only a short time; transitory.",ex:"The ephemeral beauty of cherry blossoms is what makes them so precious."},
  {word:"Eloquent",phonetic:"/ˈeləkwənt/",type:"adj",def:"Fluent and persuasive in speaking or writing.",ex:"Her eloquent speech moved the entire audience to tears."},
  {word:"Pragmatic",phonetic:"/præɡˈmætɪk/",type:"adj",def:"Dealing with things sensibly and practically rather than theoretically.",ex:"A pragmatic approach to the problem saved the team weeks of effort."},
  {word:"Tenacious",phonetic:"/tɪˈneɪʃəs/",type:"adj",def:"Not giving up easily; very determined.",ex:"His tenacious refusal to quit eventually led to his breakthrough."},
  {word:"Ambiguous",phonetic:"/æmˈbɪɡjuəs/",type:"adj",def:"Open to more than one interpretation; not clear.",ex:"The contract's ambiguous wording caused disputes later on."},
  {word:"Resilient",phonetic:"/rɪˈzɪlɪənt/",type:"adj",def:"Able to recover quickly from difficulties.",ex:"Communities that are resilient bounce back faster after natural disasters."},
  {word:"Scrutinise",phonetic:"/ˈskruːtɪnaɪz/",type:"verb",def:"To examine or inspect closely and thoroughly.",ex:"The auditors scrutinised every line of the financial report."},
  {word:"Candid",phonetic:"/ˈkændɪd/",type:"adj",def:"Truthful and straightforward; frank.",ex:"I appreciated her candid feedback, even though it stung a little."},
  {word:"Innate",phonetic:"/ɪˈneɪt/",type:"adj",def:"Inborn; existing from birth; natural.",ex:"Some researchers argue that language ability is innate in humans."},
  {word:"Proliferate",phonetic:"/prəˈlɪfəreɪt/",type:"verb",def:"To grow or multiply rapidly.",ex:"Social media platforms have proliferated over the past decade."},
  {word:"Obsolete",phonetic:"/ˈɒbsəliːt/",type:"adj",def:"No longer produced or used; out of date.",ex:"Fax machines became obsolete with the rise of email."},
  {word:"Disparity",phonetic:"/dɪˈspærɪti/",type:"noun",def:"A great difference between things.",ex:"The income disparity between urban and rural areas remains a challenge."},
  {word:"Meticulous",phonetic:"/mɪˈtɪkjʊləs/",type:"adj",def:"Showing great attention to detail; very careful.",ex:"Her meticulous notes helped the whole class prepare for the exam."},
  {word:"Altruistic",phonetic:"/ˌæltruˈɪstɪk/",type:"adj",def:"Showing selfless concern for the well-being of others.",ex:"Volunteering abroad is often driven by altruistic motives."},
  {word:"Nuance",phonetic:"/ˈnjuːɑːns/",type:"noun",def:"A subtle difference in meaning, expression, or tone.",ex:"Learning a language means grasping its nuances, not just its rules."},
  {word:"Elusive",phonetic:"/ɪˈluːsɪv/",type:"adj",def:"Difficult to find, catch, or achieve.",ex:"True happiness can feel elusive if we constantly chase material goals."},
  {word:"Vindicate",phonetic:"/ˈvɪndɪkeɪt/",type:"verb",def:"To clear someone of blame or suspicion.",ex:"New evidence vindicated the suspect and he was released."},
  {word:"Ambivalent",phonetic:"/æmˈbɪvələnt/",type:"adj",def:"Having mixed or contradictory feelings about something.",ex:"She was ambivalent about moving abroad — excited but also anxious."},
  {word:"Catalyst",phonetic:"/ˈkætəlɪst/",type:"noun",def:"A person or event that causes important change.",ex:"The invention of the printing press was a catalyst for the Renaissance."},
  {word:"Frugal",phonetic:"/ˈfruːɡəl/",type:"adj",def:"Sparing or economical with money or food.",ex:"By being frugal throughout his twenties, he retired at fifty."},
  {word:"Inevitable",phonetic:"/ɪnˈevɪtəbəl/",type:"adj",def:"Certain to happen; unavoidable.",ex:"With rapid urbanisation, traffic congestion seems inevitable."},
  {word:"Juxtapose",phonetic:"/ˌdʒʌkstəˈpəʊz/",type:"verb",def:"To place two things side by side to highlight a contrast.",ex:"The film juxtaposes wealth and poverty to make a powerful point."},
  {word:"Lucid",phonetic:"/ˈluːsɪd/",type:"adj",def:"Expressed clearly; easy to understand.",ex:"Her lucid explanation helped even the beginners follow the concept."},
  {word:"Paradox",phonetic:"/ˈpærədɒks/",type:"noun",def:"A statement that seems contradictory yet contains truth.",ex:"It is a paradox that the more choices we have, the less satisfied we feel."},
  {word:"Rhetoric",phonetic:"/ˈretərɪk/",type:"noun",def:"Persuasive language used in speech or writing.",ex:"Politicians often rely on rhetoric rather than concrete policy details."},
  {word:"Sceptical",phonetic:"/ˈskeptɪkəl/",type:"adj",def:"Not easily convinced; having doubts.",ex:"Scientists are naturally sceptical and demand strong evidence."},
  {word:"Ubiquitous",phonetic:"/juːˈbɪkwɪtəs/",type:"adj",def:"Present, appearing, or found everywhere.",ex:"Smartphones have become ubiquitous in modern life."},
  {word:"Verbose",phonetic:"/vɜːˈbəʊs/",type:"adj",def:"Using more words than necessary; long-winded.",ex:"The report was so verbose that key findings were buried on page forty."},
  {word:"Wistful",phonetic:"/ˈwɪstfəl/",type:"adj",def:"Having a feeling of vague longing or regret.",ex:"She gave a wistful smile when she found her old childhood photos."},
  {word:"Zealous",phonetic:"/ˈzeləs/",type:"adj",def:"Having or showing great energy in pursuit of a cause.",ex:"The zealous volunteers arrived two hours early to set up the event."}
];

var PLACEMENT_QUESTIONS=[
  {q:"My name ___ Tom.",options:["am","is","are","be"],answer:1,level:"A1"},
  {q:"She ___ to school every day.",options:["go","goes","going","gone"],answer:1,level:"A1"},
  {q:"There are many ___ in the park.",options:["child","childs","children","childrens"],answer:2,level:"A2"},
  {q:"By the time she arrived, the train ___.",options:["already left","has already left","had already left","will leave"],answer:2,level:"B1"},
  {q:"The report must be ___ before Friday.",options:["finish","finishing","finished","to finish"],answer:2,level:"B1"},
  {q:"Despite ___ tired, she continued working.",options:["being","to be","been","be"],answer:0,level:"B2"},
  {q:"The policy is intended to ___ unemployment.",options:["tackle","tackling","tackled","be tackled"],answer:0,level:"B2"},
  {q:"___ he had been warned about the risks, he proceeded with the investment.",options:["Although","Despite","Even","However"],answer:0,level:"C1"},
  {q:"The committee's findings were ___; they neither confirmed nor refuted the hypothesis.",options:["conclusive","inconclusive","exclusive","illusory"],answer:1,level:"C1"},
  {q:"The author's irony serves to ___ the contradiction between characters' stated beliefs and their actions.",options:["exacerbate","illuminate","corroborate","obfuscate"],answer:1,level:"C1"},
];

var COMMON_WORDS=new Set(("a about above across add after again age ago agree air all allow almost alone along already also although always am among an and another any are area around as ask at away back bad be became because been before behind being below best better between big black body both break bring but buy by call came can care carry cause change cheap check child clear close come common complete could course cut dark day deep did different do does done down draw drive during each early eat end enough even ever every example face fact far feel few fill find first follow for found four from gave get give go good got great grow had hand hard has have he help her here high him his home hot how however hundred if important in increase into is it its just keep kind know large last later learn left less let life light like little live long look made make man many may me mean meet might money more most move much must my myself need never new next night no not now number of off often old on once only open or other our out own part people per place plan play point possible power put read real right room run said same say school see she show since small so some something soon stay stop such system take tell than that the their them then there these they think this those three through time to today together too took toward try turn under up us use very walk want was way we went were what when where which while who why will with work world would write year yes yet you young your able accept according account achieve act action actually address almost already also among area back based become begin behind best better black blue body build call car carry center chance change check clear close color come consider continue control country course create cut deal decide design develop different door down draw drive early earth east effect either element end enough enter establish even example experience eye face fact fall family far feel figure find fire five floor follow found four free full function game give given good group grow hand happen hard head high history hold home hour house however human hundred idea increase indeed information interest kind know language law lead learn leave left let level light line list look mean message mind mode money month most move much must national near night notice number object off offer old once open order organization other outside page paper past pay period person pick place plan point poor position press process product program public put question range rate reach read ready record require result right role round run school second seem seen series set side simple since sit six situation small social some sort sound state still stop study subject sure surface system table talk ten term thing thought time today together town try turn type unit until use usually various view visit voice walk want watch way week well whether white wide within without word world write yet").split(" "));

function countSyllables(word){
  word=word.toLowerCase().replace(/[^a-z]/g,"");
  if(!word)return 1;
  var count=(word.match(/[aeiouy]+/g)||[]).length;
  if(word.endsWith("e")&&count>1)count--;
  return Math.max(1,count);
}
function getWpmLabel(wpm){
  if(wpm<80)return"Beginner";if(wpm<150)return"Elementary";if(wpm<250)return"Intermediate";if(wpm<400)return"Advanced";return"Expert";
}
function analyzePassage(text){
  var words=text.split(/\s+/).filter(Boolean);
  var wordCount=words.length;
  var sentences=text.split(/[.!?]+/).filter(function(s){return s.trim().length>2;});
  var sentCount=Math.max(1,sentences.length);
  var totalSyl=words.reduce(function(s,w){return s+countSyllables(w);},0);
  var fk=0.39*(wordCount/sentCount)+11.8*(totalSyl/Math.max(1,wordCount))-15.59;
  fk=Math.max(1,Math.min(16,fk));
  var stars=fk<4?1:fk<6?2:fk<8?3:fk<11?4:5;
  var newWords=words.filter(function(w){return!COMMON_WORDS.has(w.toLowerCase().replace(/[^a-z]/g,""));}).length;
  return{wordCount,sentCount,stars,newWords,estReadMins:Math.max(1,Math.round(wordCount/200))};
}
// ISO 8601 week number — Monday-anchored, year derived from the week's Thursday
// so users on a year boundary see the same week id regardless of timezone.
function getWeekId(){
  var d=new Date();d.setHours(0,0,0,0);
  d.setDate(d.getDate()+4-(d.getDay()||7));
  var yearStart=new Date(d.getFullYear(),0,1);
  var weekNo=Math.ceil(((d-yearStart)/86400000+1)/7);
  return d.getFullYear()+"-W"+(weekNo<10?"0"+weekNo:weekNo);
}
// secs>5 floor: a 200-word passage with readingTimerSecs=1 would otherwise
// record a nonsense 12000 WPM in game history.
function getWpmFromSecs(wordCount,secs){return secs>5?Math.round(wordCount/(secs/60)):0;}
// Locale-stable "today" key. Persisted dates use this so a user crossing
// timezones or switching OS language doesn't reset (or double-collect) a daily.
function todayKey(){return new Date().toISOString().slice(0,10);}

var SRS_INTERVALS=[1,3,7,14]; // days between reviews
// Returns ISO yyyy-mm-dd so cross-locale Date parsing is reliable.
function srsNextDate(days){var d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function srsDueToday(word){
  if(word.status==="known")return false;
  if(!word.nextReview)return true; // legacy words without SRS — treat as due
  var today=new Date();today.setHours(0,0,0,0);
  var due=new Date(word.nextReview);due.setHours(0,0,0,0);
  return due<=today;
}

// ── injectErrors: pure-JS error-correction exercise generator ──
function injectErrors(passage,level){
  var r=passage,errs=[],used=new Set();
  function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
  function sub(orig,bad,type,expl){
    if(used.has(orig.toLowerCase()))return false;
    var m=new RegExp("(?<![a-zA-Z])"+esc(orig)+"(?![a-zA-Z])").exec(r);
    if(!m)return false;
    r=r.slice(0,m.index)+bad+r.slice(m.index+orig.length);
    errs.push({corrupted:bad,original:orig,type:type,explanation:expl});
    used.add(orig.toLowerCase());used.add(bad.toLowerCase());
    return true;
  }
  // SPELLING (need 2)
  var SP=[
    ["receive","recieve","'receive': remember 'i before e except after c'"],
    ["believe","beleive","'believe': 'i before e' rule — not '-ei-'"],
    ["achieve","acheive","'achieve': 'i before e' in '-ieve' words"],
    ["necessary","neccessary","'necessary': one 'c', double 's' — ne-cess-ary"],
    ["separate","seperate","'separate': 'a' in the middle — sep-a-rate"],
    ["definitely","definately","'definitely': from 'definite', not 'definate'"],
    ["occurred","occured","'occurred': double 'r' in past tense"],
    ["beginning","begining","'beginning': double 'n' before '-ing'"],
    ["different","diferent","'different': double 'f' — dif-fer-ent"],
    ["important","importent","'important': ends in '-ant', not '-ent'"],
    ["beautiful","beautifull","'beautiful': one 'l' at the end"],
    ["because","becuase","'because': 'au' not 'ua' — be-cause"],
    ["people","pepole","'people': 'eo' pair in order — peo-ple"],
    ["which","wich","'which': wh- words keep the 'h'"],
    ["their","thier","'their': 'ei' not 'ie' — the-ir"],
    ["friend","freind","'friend': 'ie' not 'ei' — fr-ie-nd"],
    ["written","writen","'written': double 't' from 'write'"],
    ["environment","enviroment","'environment': en-vi-ron-ment"],
    ["government","goverment","'government': gov-ern-ment has 'n'"],
    ["language","langauge","'language': 'ua' in order — lang-uage"],
    ["experience","experiance","'experience': '-ence' not '-ance'"],
    ["interesting","intresting","'interesting': four syllables — in-ter-est-ing"],
    ["knowledge","knowlege","'knowledge': know + ledge"],
    ["accommodation","accomodation","'accommodation': double 'c' and double 'm'"],
    ["immediately","imediately","'immediately': double 'm' — im-me-di-ate-ly"],
    ["professional","profesional","'professional': double 's' — pro-fes-sion-al"],
    ["especially","especialy","'especially': double 'l' — es-pe-cial-ly"],
    ["generally","generaly","'generally': double 'l' — gen-er-al-ly"],
    ["actually","actualy","'actually': double 'l' — ac-tu-al-ly"],
    ["probably","probaly","'probably': prob-ab-ly"],
    ["possible","posible","'possible': double 's' — pos-si-ble"],
    ["available","availible","'available': '-able' not '-ible'"],
    ["responsible","responsable","'responsible': '-ible' not '-able'"],
    ["development","developement","'development': develop + ment, no extra 'e'"],
    ["opportunity","oportunity","'opportunity': double 'p' — op-por-tu-ni-ty"],
    ["community","comunity","'community': double 'm' — com-mu-ni-ty"],
    ["technology","tecnology","'technology': tech from Greek — tech-nol-o-gy"],
    ["communication","comunication","'communication': double 'm'"],
    ["traditional","tradional","'traditional': tradition + al"],
    ["happened","happend","'happened': '-ened' ending, not '-end'"],
    ["followed","folowed","'followed': double 'l'"],
    ["increased","increaced","'increased': '-sed' ending from 'increase'"],
    ["through","throgh","'through': silent 'ugh' — thr-ough"],
    ["although","althogh","'although': contains 'though'"],
    ["information","infomation","'information': in-for-ma-tion"],
    ["understanding","understaning","'understanding': 'stand' inside"],
    ["management","managment","'management': manage + ment"],
  ];
  for(var i=0;i<SP.length&&errs.filter(function(e){return e.type==="spelling";}).length<2;i++){
    var s=SP[i];
    if(!sub(s[0],s[1],"spelling",s[2])){
      sub(s[0][0].toUpperCase()+s[0].slice(1),s[1][0].toUpperCase()+s[1].slice(1),"spelling",s[2]);
    }
  }
  // GRAMMAR (need 1)
  var GR=[
    ["interested in","interested on","'interested in': the correct preposition is 'in'"],
    ["depend on","depend in","'depend on': 'depend' collocates with 'on'"],
    ["consists of","consists from","'consists of': use 'of' after 'consists'"],
    ["responsible for","responsible of","'responsible for': use 'for' after 'responsible'"],
    ["in the","on the","'in the': use 'in' for enclosed locations"],
    ["on the","in the","'on the': use 'on' for surfaces"],
    ["in","at","'in': use 'in' for enclosed spaces, not 'at'"],
    ["at","in","'at': use 'at' for specific points, not 'in'"],
    ["on","in","'on': use 'on' for surfaces, not 'in'"],
    ["for","to","'for': use 'for' here, not 'to'"],
    ["of","from","'of': use 'of' here, not 'from'"],
    ["the","a","'the': definite article needed — this item is already known"],
    ["a","the","'a': indefinite article needed for first mention"],
    ["an","a","'an': use 'an' before vowel sounds"],
  ];
  for(var j=0;j<GR.length&&errs.filter(function(e){return e.type==="grammar";}).length<1;j++){
    sub(GR[j][0],GR[j][1],"grammar",GR[j][2]);
  }
  // VOCABULARY (need 1)
  var VO=[
    ["large","heavy","'large': describes size/extent, not weight"],
    ["quickly","hardly","'quickly': means rapidly; 'hardly' means barely"],
    ["difficult","impossible","'difficult': means hard; 'impossible' means cannot be done"],
    ["common","normal","'common': means widespread/frequent, not merely typical"],
    ["said","told","'said': use 'said' without an indirect object"],
    ["make","do","'make': for creating; 'do' for general activities"],
    ["increase","raise","'increase': intransitive — use 'increase', not 'raise'"],
    ["cause","create","'cause': for bringing about effects, not for creation"],
    ["allow","enable","'allow': to permit; 'enable': to make possible"],
    ["need","want","'need': necessity; 'want': desire"],
    ["important","necessary","'important': significant, not required"],
    ["show","prove","'show': to demonstrate; 'prove': requires formal evidence"],
    ["problem","challenge","'problem': more negative connotation here"],
    ["understand","know","'understand': deep comprehension; 'know': to have a fact"],
    ["describe","explain","'describe': give characteristics; 'explain': give reasons"],
    ["small","thin","'small': overall size; 'thin': only one dimension"],
    ["fast","tall","'fast': speed, not height"],
    ["new","young","'new': recently created; 'young': recent in age"],
    ["big","old","'big': size, not age"],
  ];
  for(var k=0;k<VO.length&&errs.filter(function(e){return e.type==="vocabulary";}).length<1;k++){
    sub(VO[k][0],VO[k][1],"vocabulary",VO[k][2]);
  }
  // TENSE (need 1)
  var TE=[
    ["was","is","'was': past tense required here; 'is' is present"],
    ["were","are","'were': past tense required; 'are' is present"],
    ["had","has","'had': past form required; 'has' is present"],
    ["went","goes","'went': past tense of 'go'; 'goes' is present"],
    ["said","says","'said': past tense required; 'says' is present"],
    ["came","comes","'came': past of 'come'; 'comes' is present"],
    ["took","takes","'took': past of 'take'; 'takes' is present"],
    ["made","makes","'made': past of 'make'; 'makes' is present"],
    ["found","finds","'found': past of 'find'; 'finds' is present"],
    ["gave","gives","'gave': past of 'give'; 'gives' is present"],
    ["began","begins","'began': past of 'begin'; 'begins' is present"],
    ["became","becomes","'became': past of 'become'; 'becomes' is present"],
    ["helped","helps","'helped': past tense required; 'helps' is present"],
    ["showed","shows","'showed': past tense required; 'shows' is present"],
    ["started","starts","'started': past tense required; 'starts' is present"],
    ["continued","continues","'continued': past tense required; 'continues' is present"],
    ["developed","develops","'developed': past tense required; 'develops' is present"],
    ["created","creates","'created': past tense required; 'creates' is present"],
    ["allowed","allows","'allowed': past tense required; 'allows' is present"],
    ["caused","causes","'caused': past tense required; 'causes' is present"],
    ["changed","changes","'changed': past tense required; 'changes' is present"],
    ["is","was","'is': present tense required; 'was' is past"],
    ["are","were","'are': present tense required; 'were' is past"],
    ["has","had","'has': present tense required; 'had' is past"],
  ];
  for(var t=0;t<TE.length&&errs.filter(function(e){return e.type==="tense";}).length<1;t++){
    if(!sub(TE[t][0],TE[t][1],"tense",TE[t][2])){
      sub(TE[t][0][0].toUpperCase()+TE[t][0].slice(1),TE[t][1][0].toUpperCase()+TE[t][1].slice(1),"tense",TE[t][2]);
    }
  }
  // FALLBACK: letter-transpose any long lowercase word
  if(errs.filter(function(e){return e.type==="spelling";}).length<2){
    var ww=(passage.match(/\b[a-z]{7,}\b/g)||[]);
    for(var fi=0;fi<ww.length&&errs.filter(function(e){return e.type==="spelling";}).length<2;fi++){
      var fw=ww[fi];
      if(used.has(fw))continue;
      var mid=Math.floor(fw.length/2);
      var fb=fw.slice(0,mid-1)+fw[mid]+fw[mid-1]+fw.slice(mid+1);
      if(fb!==fw)sub(fw,fb,"spelling","Spelling: letters transposed — look carefully at the correct order");
    }
  }
  return{passage:r,errors:errs};
}

// ── pure helpers ─────────────────────────────────────────────
function escapeHtml(text){if(!text)return"";return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");}
function getLv(k){for(var i=0;i<LEVELS.length;i++){if(LEVELS[i].key===k)return LEVELS[i];}return LEVELS[0];}
function formatTime(s){if(s<=0)return"0:00";var m=Math.floor(s/60),sec=s%60;return m+":"+(sec<10?"0":"")+sec;}
function pctColor(p){return p>=80?"#22c55e":p>=60?"#f59e0b":"#ef4444";}
async function enc(p){
  var buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(p));
  return Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,"0");}).join("");
}

function calcStreak(games) {
  if (!games||games.length===0) return 0;
  var dateSet=new Set();
  for(var i=0;i<games.length;i++){dateSet.add(games[i].date);}
  var dates=Array.from(dateSet).sort(function(a,b){return new Date(b)-new Date(a);});
  var today=new Date();today.setHours(0,0,0,0);
  var first=new Date(dates[0]);first.setHours(0,0,0,0);
  if(Math.round((today-first)/(864e5))>1)return 0;
  var streak=1;
  for(var j=1;j<dates.length;j++){
    var prev=new Date(dates[j-1]);prev.setHours(0,0,0,0);
    var curr=new Date(dates[j]);curr.setHours(0,0,0,0);
    if(Math.round((prev-curr)/(864e5))===1)streak++;
    else break;
  }
  return streak;
}

function calcStreakWithShields(games,shieldDates){
  var dateSet=new Set();
  for(var i=0;i<(games||[]).length;i++){dateSet.add(games[i].date);}
  for(var j=0;j<(shieldDates||[]).length;j++){dateSet.add(shieldDates[j]);}
  if(!dateSet.size)return 0;
  var dates=Array.from(dateSet).sort(function(a,b){return new Date(b)-new Date(a);});
  var today=new Date();today.setHours(0,0,0,0);
  var first=new Date(dates[0]);first.setHours(0,0,0,0);
  if(Math.round((today-first)/(864e5))>1)return 0;
  var streak=1;
  for(var k=1;k<dates.length;k++){
    var prev=new Date(dates[k-1]);prev.setHours(0,0,0,0);
    var curr=new Date(dates[k]);curr.setHours(0,0,0,0);
    if(Math.round((prev-curr)/(864e5))===1)streak++;
    else break;
  }
  return streak;
}

function getAdaptiveSuggestion(games,currentLevel){
  var lvOrder=["A1","A2","B1","B2","C1","C2"];
  var idx=lvOrder.indexOf(currentLevel);
  if(idx===-1)return null;
  var recent=(games||[]).filter(function(g){return g.level===currentLevel;}).slice(-5);
  if(recent.length<3)return null;
  var avg=Math.round(recent.reduce(function(s,g){return s+g.pct;},0)/recent.length);
  if(avg>=80&&idx<lvOrder.length-1)return{direction:"up",level:lvOrder[idx+1],avg:avg};
  if(avg<=40&&idx>0)return{direction:"down",level:lvOrder[idx-1],avg:avg};
  return null;
}

function getBestLevel(games){
  if(!games||!games.length)return"none";
  var lvOrder=["A1","A2","B1","B2","C1","C2"];
  return games.reduce(function(best,g){return lvOrder.indexOf(g.level)>lvOrder.indexOf(best)?g.level:best;},games[0].level);
}

function scoreQuestion(q,ans){
  if(!q)return 0;
  if(q.type==="mcq"||q.type==="gap_word"||q.type==="gap_sentence"||q.type==="tfnm"||q.type==="ynng")return Number(ans)===Number(q.answer)?Q_XP[q.type]:0;
  if(q.type==="matching"){var cp=q.correctPairs||[];var s=0;for(var i=0;i<cp.length;i++){if(ans&&Number(ans[i])===Number(cp[i]))s++;}return s;}
  if(q.type==="heading"){var cm=q.correctMap;if(!cm||!cm.length)return 0;var h=0;for(var j=0;j<cm.length;j++){if(ans&&Number(ans[j])===Number(cm[j]))h++;}return h;}
  if(q.type==="qa"){var kws=q.keywords||[];if(!ans||ans.trim().length<3||!kws.length)return 0;var lo=ans.toLowerCase(),hits=0;for(var k=0;k<kws.length;k++){if(lo.includes(String(kws[k]).toLowerCase()))hits++;} var threshold=Math.ceil(kws.length/2);return hits>=threshold?Q_XP.qa:0;}
  return 0;
}
function maxPoints(q){if(q.type==="matching")return q.lefts?q.lefts.length:3;if(q.type==="heading")return q.correctMap?q.correctMap.length:2;return Q_XP[q.type]||1;}

// Placement test — 12 multiple-choice items, 2 per CEFR level, ordered from
// easiest to hardest. correctIdx is the zero-based index of the right answer.
// Scoring at the end maps total correct to a recommended starting level.
var PLACEMENT_QUESTIONS=[
  // A1 — basic vocab, present simple
  {level:"A1",q:'I ___ a student.',options:["am","is","are","be"],correctIdx:0},
  {level:"A1",q:'Which word means "quick"?',options:["slow","fast","big","small"],correctIdx:1},
  // A2 — past simple, common synonyms
  {level:"A2",q:'Yesterday I ___ to school.',options:["go","going","went","gone"],correctIdx:2},
  {level:"A2",q:'Which word is closest to "happy"?',options:["sad","angry","glad","tired"],correctIdx:2},
  // B1 — present perfect, modal verbs
  {level:"B1",q:'I ___ here since 2019.',options:["live","lived","have lived","will live"],correctIdx:2},
  {level:"B1",q:'You ___ be tired after your long trip.',options:["must","will","can","would"],correctIdx:0},
  // B2 — conditionals, passive
  {level:"B2",q:"If I ___ more time, I'd travel the world.",options:["have","had","would have","having"],correctIdx:1},
  {level:"B2",q:'The bridge ___ in 1890.',options:["built","was built","has built","building"],correctIdx:1},
  // C1 — inversion, register-aware vocab
  {level:"C1",q:'Not only ___ the project, but they exceeded the budget.',options:["they completed","did they complete","they did complete","completed they"],correctIdx:1},
  {level:"C1",q:'The word "ubiquitous" most nearly means:',options:["rare","found everywhere","underground","temporary"],correctIdx:1},
  // C2 — subjunctive, idiom
  {level:"C2",q:'It is essential that he ___ on time.',options:["arrives","arrived","arrive","arriving"],correctIdx:2},
  {level:"C2",q:'"A flash in the pan" describes:',options:["a sudden success that doesn't last","a great cooking achievement","a slow-burning idea","a failed experiment"],correctIdx:0},
];

// Total-correct → recommended level. Picked to give roughly 1/2 weight to
// floor and 1/2 to ceiling: scoring 0 starts at A1, 12 lands at C2, and
// the middle bands give A2 / B1 / B2 / C1 in order.
function placementLevel(correctCount){
  if(correctCount>=11)return"C2";
  if(correctCount>=9)return"C1";
  if(correctCount>=7)return"B2";
  if(correctCount>=5)return"B1";
  if(correctCount>=3)return"A2";
  return"A1";
}


var SUBJECT_MAP={
  "Family":"life","Shopping":"life","Food":"life","Daily Life":"life","School":"life",
  "Education":"life","Home":"life","Health":"life","Recreation":"life","Sport":"life",
  "Animals":"life","Celebrations":"life","Interests":"life","Community":"life",
  "Science":"science","Environment":"science","Nature":"science","Biology":"science",
  "Climate":"science","Medicine":"science","Geography":"science",
  "Technology":"tech","Economics":"tech","Society":"tech","Ethics":"tech",
  "Psychology":"mind","Philosophy":"mind","Cognitive Science":"mind","Linguistics":"mind",
  "Culture":"humanities","History":"humanities","Literature":"humanities"
};
var SUBJECT_LABELS={life:"🏠 Life",science:"🔬 Science",tech:"💻 Tech",mind:"🧠 Mind",humanities:"🌍 Humanities"};
var SUBJECT_COLORS={life:"#34d399",science:"#38bdf8",tech:"#a78bfa",mind:"#fb923c",humanities:"#f472b6"};
var SKILL_LEVEL={A1:"Literal",A2:"Literal",B1:"Inferential",B2:"Inferential",C1:"Analytical",C2:"Analytical"};
function getSubjectKey(story){return SUBJECT_MAP[story.topic]||"life";}

function getUnlockedStories(games){
  var played={};
  games.forEach(function(g){played[g.level]=(played[g.level]||0)+1;});
  var levelOrder=["A1","A2","B1","B2","C1","C2"];
  var unlocked={};
  STORY_LIBRARY.forEach(function(s,i){
    var sameLevelStories=STORY_LIBRARY.filter(function(x){return x.level===s.level;});
    var idx=sameLevelStories.indexOf(s);
    var prevLevelIdx=levelOrder.indexOf(s.level)-1;
    var prevLevelPlayed=prevLevelIdx<0?true:(played[levelOrder[prevLevelIdx]]||0)>=1;
    unlocked[s.id]=prevLevelPlayed&&(idx===0||(played[s.level]||0)>=idx);
  });
  return unlocked;
}

function getRecommendations(games,n){
  if(!games)games=[];
  var lvOrder=["A1","A2","B1","B2","C1","C2"];
  var recentLevels=games.slice(-5).map(function(g){return g.level;});
  var dominantLevel=recentLevels.length?recentLevels[recentLevels.length-1]:"A1";
  var lvIdx=lvOrder.indexOf(dominantLevel);
  var playedIds=new Set(games.filter(function(g){return g.storyId;}).map(function(g){return g.storyId;}));
  var recentTopics=games.slice(-3).map(function(g){return g.topic;});
  var unlockedMap=getUnlockedStories(games);
  var scored=STORY_LIBRARY.filter(function(s){return unlockedMap[s.id]&&!playedIds.has(s.id);}).map(function(s){
    var sIdx=lvOrder.indexOf(s.level);
    var lvScore=3-Math.abs(sIdx-lvIdx);
    var topicScore=recentTopics.indexOf(s.topic)!==-1?-1:1;
    return{story:s,score:lvScore+topicScore};
  }).sort(function(a,b){return b.score-a.score;});
  return scored.slice(0,n||3).map(function(x){return x.story;});
}

var BADGES=[
  {id:"first_steps",   name:"First Steps",      icon:"👣", desc:"Complete your first quiz"},
  {id:"story_starter", name:"Story Starter",     icon:"📖", desc:"Complete 5 quizzes"},
  {id:"reader",        name:"Reader",            icon:"📚", desc:"Complete 10 quizzes"},
  {id:"explorer",      name:"Explorer",          icon:"🗺️", desc:"Complete 25 quizzes"},
  {id:"bookworm",      name:"Bookworm",          icon:"🐛", desc:"Complete 50 quizzes"},
  {id:"quiz_master",   name:"Quiz Master",       icon:"🏆", desc:"Score 100% on a quiz"},
  {id:"speed_reader",  name:"Speed Reader",      icon:"⚡", desc:"Finish under half the time limit"},
  {id:"vocab_builder", name:"Vocab Builder",     icon:"✏️", desc:"Save 10 words to your notebook"},
  {id:"word_collector",name:"Word Collector",    icon:"📝", desc:"Save 50 words"},
  {id:"on_fire",       name:"On Fire",           icon:"🔥", desc:"Maintain a 3-day reading streak"},
  {id:"week_warrior",  name:"Week Warrior",      icon:"🌟", desc:"Maintain a 7-day reading streak"},
  {id:"daily_champ",   name:"Daily Champ",       icon:"📅", desc:"Complete a daily challenge"},
  {id:"high_scorer",   name:"High Scorer",       icon:"🎯", desc:"Earn 500+ XP in a single quiz"},
  {id:"all_types",     name:"Complete Player",   icon:"🎮", desc:"Use all 6 question types in one session"},
  {id:"level_5",       name:"Level Up",          icon:"⭐", desc:"Reach player level 5"},
];

function checkBadges(user,vocab,streak){
  var games=user&&user.games?user.games:[];
  var vocabCount=vocab?vocab.length:0;
  var e={};
  if(games.length>=1)e.first_steps=true;
  if(games.length>=5)e.story_starter=true;
  if(games.length>=10)e.reader=true;
  if(games.length>=25)e.explorer=true;
  if(games.length>=50)e.bookworm=true;
  if(games.some(function(g){return g.pct===100;}))e.quiz_master=true;
  if(games.some(function(g){return g.timeSecs<getLv(g.level).timeLimit/2;}))e.speed_reader=true;
  if(vocabCount>=10)e.vocab_builder=true;
  if(vocabCount>=50)e.word_collector=true;
  if(streak>=3)e.on_fire=true;
  if(streak>=7)e.week_warrior=true;
  if(games.some(function(g){return g.isDaily;}))e.daily_champ=true;
  if(games.some(function(g){return g.xp>=500;}))e.high_scorer=true;
  if(games.some(function(g){return g.typeStats&&Object.keys(g.typeStats).length>=6;}))e.all_types=true;
  var totalXp=games.reduce(function(s,g){return s+g.xp;},0);
  if(getUserLevel(totalXp)>=5)e.level_5=true;
  return e;
}

var QUEST_POOL=[
  {id:"play_story",     title:"Read a Story",     desc:"Complete any quiz today",         xp:20},
  {id:"score_80",       title:"High Score",        desc:"Score 80%+ on a quiz",            xp:15},
  {id:"save_words",     title:"Word Saver",        desc:"Save 3+ words to your notebook",  xp:10},
  {id:"daily_challenge",title:"Daily Player",      desc:"Complete the daily challenge",     xp:25},
  {id:"score_perfect",  title:"Perfectionist",     desc:"Score 100% on any quiz",          xp:30},
  {id:"play_b1plus",    title:"Challenge Seeker",  desc:"Play B1 level or higher",         xp:15},
  {id:"fast_finish",    title:"Speed Runner",      desc:"Finish a quiz under 2 minutes",   xp:20},
  {id:"streak_day",     title:"Streak Keeper",     desc:"Keep your reading streak alive",  xp:10},
];
function getDayQuests(date){
  var seed=0;for(var i=0;i<date.length;i++)seed=seed*31+date.charCodeAt(i);
  seed=Math.abs(seed);var n=QUEST_POOL.length,pickedSet=new Set(),picked=[];
  while(picked.length<3){var idx=seed%n;if(!pickedSet.has(idx)){pickedSet.add(idx);picked.push(idx);}seed=Math.abs(Math.floor(seed/n+seed*7+13))%99991;}
  return picked.map(function(i){return QUEST_POOL[i];});
}
function checkQuest(id,todayGames,vocabCount,extras){
  if(id==="play_story")return todayGames.length>=1;
  if(id==="score_80")return todayGames.some(function(g){return g.pct>=80;});
  if(id==="save_words")return vocabCount>=3;
  if(id==="daily_challenge")return!!extras.dailyDone;
  if(id==="score_perfect")return todayGames.some(function(g){return g.pct===100;});
  if(id==="play_b1plus"){var hi=["B1","B2","C1","C2"];return todayGames.some(function(g){return hi.indexOf(g.level)!==-1;});}
  if(id==="fast_finish")return todayGames.some(function(g){return g.timeSecs<120;});
  if(id==="streak_day")return extras.streak>=1;
  return false;
}

var LEVEL_THRESHOLDS=[0,1000,2500,4500,7000,10500,15000,21000,28000,36000,45000,55000,66000,78000,91000,105000,120000,136000,153000,171000,190000];
function getUserLevel(totalXp){
  for(var i=LEVEL_THRESHOLDS.length-1;i>=0;i--){
    if(totalXp>=LEVEL_THRESHOLDS[i])return i+1;
  }
  return 1;
}
function getLevelProgress(totalXp){
  var level=getUserLevel(totalXp);
  var current=LEVEL_THRESHOLDS[level-1]||0;
  var isMaxLevel=level>=LEVEL_THRESHOLDS.length;
  var next=isMaxLevel?current:LEVEL_THRESHOLDS[level];
  var progress=isMaxLevel?100:((totalXp-current)/(next-current))*100;
  return{level:level,current:current,next:next,xpNeeded:isMaxLevel?0:next-totalXp,progress:Math.min(100,Math.max(0,progress))};
}

// ── storage ──────────────────────────────────────────────────
async function apiGet(key){
  try{
    var r=await fetch("/api/storage?key="+encodeURIComponent(key));
    if(!r.ok)throw new Error("not ok");
    var d=await r.json();
    if(d.value){
      var parsed=null;
      try{parsed=JSON.parse(d.value);}catch(parseErr){console.warn("Invalid JSON from Firebase for key "+key,parseErr);throw parseErr;}
      if(parsed){try{localStorage.setItem(key,d.value);}catch(e){}}
      return parsed;
    }
    return null;
  }catch(e){
    try{var v=localStorage.getItem(key);return v?JSON.parse(v):null;}catch(e2){return null;}
  }
}
// Refresh the access token. Prefers the long-lived refreshToken (rotated on
// every call) and falls back to the legacy password-hash flow for users
// whose localStorage was written before the token swap. On a successful
// hash-fallback we upgrade their stored credentials to the new shape.
// Fire-and-forget refresh-token revocation. We don't block logout on the
// network round-trip — even if the call fails, the local credential cache
// is wiped, so the user is logged out on this device. The blacklist write
// is purely defensive (other-device revocation).
async function revokeStoredRefreshToken(){
  var creds=null;try{creds=JSON.parse(localStorage.getItem(CREDS_KEY));}catch(e){}
  if(!creds||!creds.name||!creds.refreshToken)return;
  try{
    await fetch(REVOKE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:creds.name,refreshToken:creds.refreshToken}),keepalive:true});
  }catch(e){}
}

async function getSessionToken(name,creds){
  if(!creds)return;
  try{
    if(creds.refreshToken){
      var rr=await fetch(REFRESH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name,refreshToken:creds.refreshToken})});
      if(rr.ok){
        var dd=await rr.json();
        if(dd.token){_sessionToken=dd.token;}
        if(dd.refreshToken){
          try{localStorage.setItem(CREDS_KEY,JSON.stringify({name:name,refreshToken:dd.refreshToken}));}catch(e){}
        }
        return;
      }
      // 401 means token expired or invalid — drop it so the user is forced
      // back through the password screen on next interaction.
      if(rr.status===401){try{localStorage.removeItem(CREDS_KEY);}catch(e){}}
      return;
    }
    if(creds.hash){
      var r=await fetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name,hash:creds.hash})});
      if(r.ok){
        var d=await r.json();
        if(d.token){_sessionToken=d.token;}
        if(d.refreshToken){
          // Migration: replace the stored password hash with the new refresh token.
          try{localStorage.setItem(CREDS_KEY,JSON.stringify({name:name,refreshToken:d.refreshToken}));}catch(e){}
        }
      }
    }
  }catch(e){}
}
async function apiSet(key,val){
  var str=JSON.stringify(val);
  try{localStorage.setItem(key,str);}catch(e){}  // always write locally first
  try{
    var hdrs={"Content-Type":"application/json"};
    if(_sessionToken)hdrs["Authorization"]="Bearer "+_sessionToken;
    var r=await fetch("/api/storage",{method:"POST",headers:hdrs,body:JSON.stringify({key:key,value:str})});
    if(!r.ok&&r.status!==401){console.warn("Firebase write failed for key "+key+": status "+r.status);}
    if(r.status===401&&_sessionToken){
      var creds=null;try{creds=JSON.parse(localStorage.getItem(CREDS_KEY));}catch(e2){}
      if(creds&&creds.name&&(creds.refreshToken||creds.hash)){
        await getSessionToken(creds.name,creds);
        if(_sessionToken){
          hdrs["Authorization"]="Bearer "+_sessionToken;
          var r2=await fetch("/api/storage",{method:"POST",headers:hdrs,body:JSON.stringify({key:key,value:str})});
          if(!r2.ok){console.warn("Firebase write retry failed for key "+key+": status "+r2.status);}
        }else{console.warn("Token refresh failed for key "+key);}
      }
    }
  }catch(e){console.warn("Firebase write error for key "+key+": "+e.message);}
}
async function loadUsers(){
  try{
    var r=await fetch(USERS_API);
    if(r.ok){var d=await r.json();if(Array.isArray(d.users)){try{localStorage.setItem(USERS_KEY,JSON.stringify(d.users));}catch(e){}return d.users;}}
  }catch(e){}
  try{var v=localStorage.getItem(USERS_KEY);return v?JSON.parse(v):[];}catch(e2){return [];}
}
function trimOldGames(users,maxGamesPerUser){
  return users.map(function(usr){
    if(!usr.games||usr.games.length<=maxGamesPerUser)return usr;
    return Object.assign({},usr,{games:usr.games.slice(-maxGamesPerUser)});
  });
}
async function saveUsers(u){
  var trimmed=trimOldGames(u,150);
  var profiles=trimmed.map(function(usr){
    var gamesXp=(usr.games||[]).reduce(function(s,g){return s+(g.xp||0);},0);
    var totalXp=Math.max(Number(usr.totalXp)||0,gamesXp);
    return {name:usr.name,games:usr.games,joined:usr.joined,totalXp:totalXp};
  });
  try{
    localStorage.setItem(USERS_KEY,JSON.stringify(profiles));
  }catch(e){}
  try{
    await apiSet(USERS_KEY,profiles);
  }catch(e){
    console.warn("Failed to save users to Firebase, local save only",e);
  }
}
async function loadBoards(){try{var v=await apiGet(BOARDS_KEY);if(v)return v;}catch(e){}try{var lv=localStorage.getItem(BOARDS_KEY);return lv?JSON.parse(lv):{};}catch(e2){return {};}}
async function saveBoards(b){try{localStorage.setItem(BOARDS_KEY,JSON.stringify(b));}catch(e){}try{await apiSet(BOARDS_KEY,b);}catch(e){console.warn("saveBoards failed:",e);}}
async function loadSocial(){
  var v=await apiGet(SOCIAL_KEY)||{};
  if(v._likes&&!v["!likes"]){v["!likes"]=v._likes;delete v._likes;}
  // Coerce Firebase-object-form arrays back to real arrays so direct
  // mutations (doAcceptRequest, doDeclineRequest, etc.) don't crash.
  for(var name in v){
    var e=v[name];
    if(e&&typeof e==="object"&&name!=="!likes"&&name!=="_likes"){
      e.friends=asArray(e.friends);
      e.requests=asArray(e.requests);
      e.challenges=asArray(e.challenges);
      e.sent=asArray(e.sent);
    }
  }
  return v;
}
async function saveSocial(s){try{localStorage.setItem(SOCIAL_KEY,JSON.stringify(s));}catch(e){}try{await apiSet(SOCIAL_KEY,s);}catch(e){console.warn("saveSocial failed:",e);}}
async function loadVocab(){var v=await apiGet(VOCAB_KEY);return v||{};}
async function saveVocab(v){await apiSet(VOCAB_KEY,v);}
async function loadDaily(){var v=await apiGet(DAILY_KEY);return v||null;}
async function saveDaily(d){try{localStorage.setItem(DAILY_KEY,JSON.stringify(d));}catch(e){}try{await apiSet(DAILY_KEY,d);}catch(e){console.warn("saveDaily failed:",e);}}
async function loadDailyLb(){try{var v=await apiGet(DAILY_LB_KEY);if(v)return v;}catch(e){}try{var lv=localStorage.getItem(DAILY_LB_KEY);return lv?JSON.parse(lv):{};}catch(e2){return {};}}
async function saveDailyLb(d){try{localStorage.setItem(DAILY_LB_KEY,JSON.stringify(d));}catch(e){}try{await apiSet(DAILY_LB_KEY,d);}catch(e){console.warn("saveDailyLb failed:",e);}}
async function loadFavs(){var v=await apiGet(FAVS_KEY);return v||{};}
async function saveFavs(v){await apiSet(FAVS_KEY,v);}
async function loadWeeklyLb(){try{var v=await apiGet(WEEKLY_KEY);if(v)return v;}catch(e){}try{var lv=localStorage.getItem(WEEKLY_KEY);return lv?JSON.parse(lv):{};}catch(e2){return {};}}
async function saveWeeklyLb(v){try{localStorage.setItem(WEEKLY_KEY,JSON.stringify(v));}catch(e){}try{await apiSet(WEEKLY_KEY,v);}catch(e){console.warn("saveWeeklyLb failed:",e);}}
async function loadDiscuss(){var v=await apiGet(DISCUSS_KEY);return v||{};}
async function saveDiscuss(v){await apiSet(DISCUSS_KEY,v);}
// Per-user daily quota. Server-managed counters in Firebase; the chip on
// the home screen reads `used` and `maxLow`/`maxHigh` for the "ai" bucket
// and renders a colour by % of cap. Returns null when unauthenticated or
// the endpoint fails (chip then hides).
async function loadUserQuota(){
  if(!_sessionToken)return null;
  try{
    var r=await fetch("/api/quota",{headers:{"Authorization":"Bearer "+_sessionToken}});
    if(!r.ok)return null;
    var d=await r.json();
    return d&&d.quotas?d.quotas:null;
  }catch(e){return null;}
}
function loadQuotes(){try{var v=localStorage.getItem(QUOTES_KEY);return v?JSON.parse(v):[];}catch(e){return[];}}
function saveQuotesLocal(v){try{localStorage.setItem(QUOTES_KEY,JSON.stringify(v));}catch(e){}}
function generateClassCode(){var c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",r="";for(var i=0;i<6;i++)r+=c[Math.floor(Math.random()*c.length)];return r;}
// Firebase returns arrays-with-gaps as objects with numeric string keys. Coerce
// to an array so downstream `.filter`/`.map` doesn't crash the whole app.
function asArray(v){if(Array.isArray(v))return v;if(v&&typeof v==="object")return Object.keys(v).filter(function(k){return /^\d+$/.test(k);}).sort(function(a,b){return Number(a)-Number(b);}).map(function(k){return v[k];}).filter(function(x){return x!=null;});return[];}
async function loadClasses(){try{var v=await apiGet(CLASSES_KEY);var arr=asArray(v);if(arr.length||Array.isArray(v))return arr;}catch(e){}try{var lv=localStorage.getItem(CLASSES_KEY);return asArray(lv?JSON.parse(lv):[]);}catch(e){return[];}}
async function saveClassesRemote(v){try{localStorage.setItem(CLASSES_KEY,JSON.stringify(v));}catch(e){}try{await apiSet(CLASSES_KEY,v);}catch(e){}}
async function loadAssignments(){try{var v=await apiGet(ASSIGNMENTS_KEY);var arr=asArray(v);if(arr.length||Array.isArray(v))return arr;}catch(e){}try{var lv=localStorage.getItem(ASSIGNMENTS_KEY);return asArray(lv?JSON.parse(lv):[]);}catch(e){return[];}}
async function saveAssignmentsRemote(v){try{localStorage.setItem(ASSIGNMENTS_KEY,JSON.stringify(v));}catch(e){}try{await apiSet(ASSIGNMENTS_KEY,v);}catch(e){}}

// ── social helpers ────────────────────────────────────────────
function getSocial(social,name){
  var s=social[name];
  if(!s||typeof s!=="object")return{friends:[],requests:[],likes:0,challenges:[],sent:[]};
  // Firebase round-trips can swap nested arrays for numeric-keyed objects.
  return{friends:asArray(s.friends),requests:asArray(s.requests),likes:Number(s.likes)||0,challenges:asArray(s.challenges),sent:asArray(s.sent)};
}

function doSendRequest(social,from,to){
  var toData=getSocial(social,to);
  if(toData.friends.indexOf(from)!==-1)return{ok:false,err:"Already friends"};
  if(toData.requests.indexOf(from)!==-1)return{ok:false,err:"Request already sent"};
  var n=JSON.parse(JSON.stringify(social));
  if(!n[to])n[to]={friends:[],requests:[],likes:0,challenges:[]};
  n[to].requests.push(from);
  return{ok:true,social:n};
}

function doAcceptRequest(social,username,from){
  var n=JSON.parse(JSON.stringify(social));
  if(!n[username])n[username]={friends:[],requests:[],likes:0,challenges:[]};
  if(!n[from])n[from]={friends:[],requests:[],likes:0,challenges:[]};
  n[username].requests=n[username].requests.filter(function(r){return r!==from;});
  if(n[username].friends.indexOf(from)===-1)n[username].friends.push(from);
  if(n[from].friends.indexOf(username)===-1)n[from].friends.push(username);
  return n;
}

function doDeclineRequest(social,username,from){
  var n=JSON.parse(JSON.stringify(social));
  if(!n[username])return n;
  n[username].requests=n[username].requests.filter(function(r){return r!==from;});
  return n;
}

function doRemoveFriend(social,username,friend){
  var n=JSON.parse(JSON.stringify(social));
  if(n[username])n[username].friends=n[username].friends.filter(function(f){return f!==friend;});
  if(n[friend])n[friend].friends=n[friend].friends.filter(function(f){return f!==username;});
  return n;
}

var SOCIAL_LIKES_KEY="!likes";
function doLikeProfile(social,liker,target){
  var n=JSON.parse(JSON.stringify(social));
  if(!n[SOCIAL_LIKES_KEY])n[SOCIAL_LIKES_KEY]={};
  var key=liker+"->"+target;
  if(n[SOCIAL_LIKES_KEY][key])return{ok:false,social:n,err:"Already liked"};
  n[SOCIAL_LIKES_KEY][key]=true;
  if(!n[target])n[target]={friends:[],requests:[],likes:0,challenges:[]};
  n[target].likes=(n[target].likes||0)+1;
  return{ok:true,social:n};
}

function hasLiked(social,liker,target){return!!(social[SOCIAL_LIKES_KEY]&&social[SOCIAL_LIKES_KEY][liker+"->"+target]);}

function doSendChallenge(social,from,to,level,types,storyId,storyTitle,senderPct){
  var n=JSON.parse(JSON.stringify(social));
  var id=Date.now().toString(36);
  var expiresAt=Date.now()+24*60*60*1000;
  var ch={id:id,from:from,level:level,types:types,date:new Date().toISOString().split('T')[0],status:"pending",expiresAt:expiresAt};
  if(storyId){ch.storyId=storyId;ch.storyTitle=storyTitle||"";}
  if(senderPct!=null)ch.senderPct=senderPct;
  if(!n[to])n[to]={friends:[],requests:[],likes:0,challenges:[]};
  if(!n[to].challenges)n[to].challenges=[];
  n[to].challenges.push(ch);
  if(!n[from])n[from]={friends:[],requests:[],likes:0,challenges:[],sent:[]};
  if(!n[from].sent)n[from].sent=[];
  n[from].sent.push({id:id,to:to,level:level,storyId:storyId||null,storyTitle:storyTitle||"",senderPct:senderPct!=null?senderPct:null,date:new Date().toISOString().split('T')[0],status:"pending",expiresAt:expiresAt});
  return n;
}

function doRespondChallenge(social,username,idx,status){
  var n=JSON.parse(JSON.stringify(social));
  if(n[username]&&n[username].challenges&&n[username].challenges[idx]){
    n[username].challenges[idx].status=status;
  }
  return n;
}

function doCompleteChallenge(social,recipient,challengeIdx,result){
  var n=JSON.parse(JSON.stringify(social));
  var ch=n[recipient]&&n[recipient].challenges&&n[recipient].challenges[challengeIdx];
  if(!ch)return n;
  ch.status="completed";ch.result=result;
  var sender=ch.from;
  if(n[sender]&&n[sender].sent){
    var si=n[sender].sent.findIndex(function(s){return s.id===ch.id;});
    if(si!==-1){n[sender].sent[si].status="completed";n[sender].sent[si].result={pct:result.pct,xp:result.xp,by:recipient,senderPct:ch.senderPct!=null?ch.senderPct:null};}
  }
  return n;
}

function challengeTimeLeft(expiresAt){
  if(!expiresAt)return null;
  var ms=expiresAt-Date.now();
  if(ms<=0)return"expired";
  var h=Math.floor(ms/3600000);
  var m=Math.floor((ms%3600000)/60000);
  return h>0?h+"h "+m+"m left":m+"m left";
}

// ── pronunciation helpers ────────────────────────────────────
function splitSentences(text){
  // Include \n in the negated set so a paragraph that ends without .!? (or
  // with a colon/dash) doesn't glue into the next paragraph's first sentence.
  var raw=text.match(/[^.!?\n]+[.!?]*/g)||[text];
  return raw.map(function(s){return s.trim();}).filter(function(s){return s.length>10;});
}
function editDistance(a,b){
  var m=a.length,n=b.length,dp=[];
  for(var i=0;i<=m;i++){dp[i]=[i];}
  for(var j=0;j<=n;j++){dp[0][j]=j;}
  for(var i=1;i<=m;i++){for(var j=1;j<=n;j++){dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);}}
  return dp[m][n];
}
function comparePronunciation(expected,transcript){
  function clean(s){return s.toLowerCase().replace(/[^a-z\s']/g,"").trim();}
  var expWords=clean(expected).split(/\s+/).filter(Boolean);
  var gotWords=clean(transcript).split(/\s+/).filter(Boolean);
  var words=expWords.map(function(w,i){
    var got=gotWords[i]||"";
    if(got===w)return{word:w,status:"correct"};
    if(got&&editDistance(got,w)<=1)return{word:w,status:"close",heard:got};
    return{word:w,status:"wrong",heard:got||"—"};
  });
  var ok=words.filter(function(w){return w.status==="correct"||w.status==="close";}).length;
  return{words:words,accuracy:expWords.length?Math.round(ok/expWords.length*100):0,transcript:transcript};
}

// ── reading goals ────────────────────────────────────────────
var GOAL_DEFS=[
  {id:"weekly_games", label:"Games this week",            icon:"🎮", unit:"games", opts:[3,5,7,10]},
  {id:"weekly_xp",    label:"XP this week",               icon:"⚡", unit:"XP",   opts:[500,1000,2000,5000]},
  {id:"avg_score",    label:"Avg score (next 5 games)",   icon:"🎯", unit:"%",    opts:[60,70,80,90]},
  {id:"streak",       label:"Streak target",              icon:"🔥", unit:"days", opts:[3,7,14,30]},
];
function weekStart(){
  var d=new Date();var day=d.getDay();
  var diff=d.getDate()-day+(day===0?-6:1);
  var m=new Date(d);m.setDate(diff);m.setHours(0,0,0,0);return m;
}
function getGoalProgress(goalId,goalData,games,streak){
  var ws=weekStart();
  var wkGames=games.filter(function(g){return new Date(g.date)>=ws;});
  if(goalId==="weekly_games"){
    var c=wkGames.length;return{current:c,target:goalData.target,pct:Math.min(100,Math.round(c/goalData.target*100)),done:c>=goalData.target};
  }
  if(goalId==="weekly_xp"){
    var c=wkGames.reduce(function(s,g){return s+g.xp;},0);return{current:c,target:goalData.target,pct:Math.min(100,Math.round(c/goalData.target*100)),done:c>=goalData.target};
  }
  if(goalId==="avg_score"){
    var tr=goalData.trackGames||[];var avg=tr.length?Math.round(tr.reduce(function(s,p){return s+p;},0)/tr.length):0;
    return{current:avg,target:goalData.target,pct:Math.min(100,Math.round(tr.length/5*100)),done:tr.length>=5&&avg>=goalData.target,gamesPlayed:tr.length};
  }
  if(goalId==="streak"){
    var c=streak;return{current:c,target:goalData.target,pct:Math.min(100,Math.round(c/goalData.target*100)),done:c>=goalData.target};
  }
  return{current:0,target:1,pct:0,done:false};
}

// ── chart component ──────────────────────────────────────────
function GameChart(props){
  var games=props.games||[];
  if(!games.length)return<div style={{textAlign:"center",padding:20,color:"#6b7280"}}>No games to chart yet</div>;

  var w=320,h=200,pad=40;
  var maxXp=Math.max.apply(null,[1].concat(games.map(function(g){return g.xp;})));
  var scale=function(val,max,size){return(val/max)*(size-pad*2)+pad;};

  var points=games.map(function(g,i){
    var x=pad+(i/(games.length-1||1))*(w-pad*2);
    var y=h-scale(g.xp,maxXp,h);
    return{x:x,y:y,xp:g.xp,date:g.date};
  });

  var pathData="M "+points.map(function(p){return p.x+","+p.y;}).join(" L ");
  var minDate=games[0].date,maxDate=games[games.length-1].date;

  return(
    <div style={{background:"rgba(255,255,255,0.03)",borderRadius:14,padding:12,overflow:"auto"}}>
      <svg width="100%" height="250" viewBox={"0 0 "+w+" "+h} style={{minHeight:250}}>
        {/* grid lines */}
        {[0,1,2,3,4].map(function(i){
          var y=pad+(i/4)*(h-pad*2);
          return<line key={"grid-"+i} x1={pad} y1={y} x2={w-20} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>;
        })}

        {/* axes */}
        <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
        <line x1={pad} y1={h-pad} x2={w-20} y2={h-pad} stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>

        {/* chart line */}
        <path d={pathData} stroke="#a78bfa" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

        {/* data points */}
        {points.map(function(p,i){
          return(
            <g key={"point-"+i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#a78bfa" opacity="0.6"/>
              <circle cx={p.x} cy={p.y} r="5.5" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.3"/>
              <text x={p.x} y={p.y-12} textAnchor="middle" fontSize="11" fill="#a78bfa" fontWeight="700">{p.xp}</text>
            </g>
          );
        })}

        {/* Y axis label */}
        <text x="12" y="20" fontSize="11" fill="#9ca3af" fontWeight="600">XP</text>

        {/* X axis labels */}
        <text x={pad} y={h-20} fontSize="10" fill="#6b7280" textAnchor="middle">{minDate}</text>
        <text x={w-25} y={h-20} fontSize="10" fill="#6b7280" textAnchor="end">{maxDate}</text>
      </svg>
    </div>
  );
}

// ── question components ───────────────────────────────────────
function McqQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {q.options.map(function(opt,i){
      var isOk=i===q.answer,isSel=i===sel;
      var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
      if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #a78bfa";col="#a78bfa";}
      return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:10,padding:"10px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
        <span className={conf&&isOk?"rq-bounce":""} style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:(isSel||(conf&&isOk))?col:"rgba(255,255,255,0.1)",color:(isSel||(conf&&isOk))?"#0d0d1a":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>
          {conf&&isOk?"✓":conf&&isSel&&!isOk?"✕":["A","B","C","D"][i]}
        </span>{opt}
      </button>);
    })}
  </div>);
}

function GapWordQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var parts=q.sentence?q.sentence.split("___"):["",""];
  return(<div>
    <div style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:14,color:"#e5e7eb",lineHeight:1.7}}>
      {parts[0]}<span style={{display:"inline-block",minWidth:70,borderBottom:"2px solid #a78bfa",textAlign:"center",padding:"0 4px",color:conf?(sel===q.answer?"#34d399":"#ef4444"):"#a78bfa",fontWeight:700}}>{sel!==null?q.options[sel]:"_____"}</span>{parts[1]}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {q.options.map(function(opt,i){
        var isOk=i===q.answer,isSel=i===sel;
        var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
        if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
        else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #a78bfa";col="#a78bfa";}
        return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:8,padding:"7px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit"}}>{opt}</button>);
      })}
    </div>
  </div>);
}

function GapSentQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var parts=q.paragraph?q.paragraph.split("___"):["",""];
  return(<div>
    <div style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:13,color:"#e5e7eb",lineHeight:1.8}}>
      {parts[0]}<span style={{display:"inline-block",background:conf?(sel===q.answer?"rgba(52,211,153,0.2)":"rgba(239,68,68,0.2)"):"rgba(99,102,241,0.15)",border:"1px dashed "+(conf?(sel===q.answer?"#34d399":"#ef4444"):"#a78bfa"),borderRadius:6,padding:"1px 6px",color:conf?(sel===q.answer?"#34d399":"#ef4444"):"#a78bfa",fontWeight:700,margin:"0 4px"}}>{sel!==null?q.options[sel]:"[ select ]"}</span>{parts[1]}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {q.options.map(function(opt,i){
        var isOk=i===q.answer,isSel=i===sel;
        var bg="rgba(255,255,255,0.04)",bd="1px solid rgba(255,255,255,0.1)",col="#9ca3af";
        if(conf){if(isOk){bg="rgba(52,211,153,0.1)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";bd="1px solid #ef4444";col="#ef4444";}}
        else if(isSel){bg="rgba(99,102,241,0.15)";bd="1px solid #a78bfa";col="#c7d2fe";}
        return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:8,padding:"9px 10px",color:col,fontSize:12,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left"}}>
          <span style={{color:"#6366f1",fontWeight:700,marginRight:6}}>{["A","B","C","D"][i]}.</span>{opt}
        </button>);
      })}
    </div>
  </div>);
}

function MatchingQ(props){
  var q=props.q,matches=props.matches,conf=props.conf,onMatch=props.onMatch,shuffled=props.shuffled;
  var lefts=q.lefts||[],rights=q.rights||[],correctPairs=q.correctPairs||[];
  // shuffled is now an array of {idx, val} pairs so duplicate right-side
  // strings still resolve back to their unique source index.
  var [activeLeft,setActiveLeft]=useState(null);
  function clickLeft(i){if(conf)return;setActiveLeft(i===activeLeft?null:i);}
  function clickRight(origIdx){if(conf||activeLeft===null)return;onMatch(activeLeft,origIdx);setActiveLeft(null);}
  return(<div>
    <p style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>Tap a left item then tap its match on the right.</p>
    <div style={{display:"flex",gap:8}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        {lefts.map(function(l,i){
          var matched=matches&&matches[i]!==undefined;
          var ok=conf&&matched&&matches[i]===correctPairs[i];
          var bad=conf&&matched&&matches[i]!==correctPairs[i];
          return(<button key={i} onClick={function(){clickLeft(i);}} style={{background:activeLeft===i?"rgba(99,102,241,0.3)":matched?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)",border:"1px solid "+(activeLeft===i?"#a78bfa":ok?"#34d399":bad?"#ef4444":"rgba(255,255,255,0.1)"),borderRadius:8,padding:"9px 10px",color:ok?"#34d399":bad?"#ef4444":activeLeft===i?"#c7d2fe":"#e5e7eb",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            {l}{matched&&<span style={{float:"right",opacity:0.5,fontSize:9}}>{rights[matches[i]]}</span>}
          </button>);
        })}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        {shuffled.map(function(entry,ri){
          var isPair=entry&&typeof entry==="object"&&"idx" in entry;
          var origIdx=isPair?entry.idx:(rights.indexOf(entry));
          var val=isPair?entry.val:entry;
          var used=matches&&Object.values(matches).indexOf(origIdx)!==-1;
          return(<button key={ri} onClick={function(){clickRight(origIdx);}} style={{background:used?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)",border:"1px solid "+(activeLeft!==null&&!conf?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.1)"),borderRadius:8,padding:"9px 10px",color:used?"#6b7280":"#e5e7eb",fontSize:12,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left"}}>
            {val}
          </button>);
        })}
      </div>
    </div>
    {conf&&(<div style={{marginTop:8,fontSize:11,color:"#d1fae5"}}>
      {lefts.map(function(l,i){var ok=matches&&matches[i]===correctPairs[i];return<div key={i}>{ok?"✓":"✕"} {l} = {rights[correctPairs[i]]}</div>;})}
    </div>)}
  </div>);
}

function HeadingQ(props){
  var q=props.q,userMap=props.userMap,conf=props.conf,onMatch=props.onMatch;
  return(<div>
    <p style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>Match each paragraph to the correct heading.</p>
    {q.paragraphs.map(function(para,pi){
      var selHead=userMap&&userMap[pi]!==undefined?userMap[pi]:null;
      return(<div key={pi} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:10,marginBottom:8}}>
        <p style={{fontSize:12,color:"#d1d5db",lineHeight:1.7,marginBottom:6}}>{para}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {q.headings.map(function(h,hi){
            var isSel=selHead===hi;
            var ok=conf&&hi===q.correctMap[pi];
            var bad=conf&&isSel&&hi!==q.correctMap[pi];
            var bg="rgba(255,255,255,0.04)",bd="1px solid rgba(255,255,255,0.1)",col="#9ca3af";
            if(ok){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}
            else if(bad){bg="rgba(239,68,68,0.1)";bd="1px solid #ef4444";col="#ef4444";}
            else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #a78bfa";col="#a78bfa";}
            return(<button key={hi} onClick={function(){if(!conf)onMatch(pi,hi);}} style={{background:bg,border:bd,borderRadius:6,padding:"4px 9px",color:col,fontSize:11,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit"}}>{h}</button>);
          })}
        </div>
      </div>);
    })}
  </div>);
}

function QAQ(props){
  var q=props.q,val=props.val,conf=props.conf,onChange=props.onChange;
  var scored=conf?scoreQuestion(q,val):null;
  return(<div>
    <textarea disabled={conf} value={val||""} onChange={function(e){if(!conf)onChange(e.target.value);}} placeholder="Write your answer here..." style={{width:"100%",minHeight:80,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f3f4f6",fontSize:13,padding:"9px 11px",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
    {conf&&(<div style={{marginTop:6,padding:"8px 10px",borderRadius:8,background:scored?"rgba(52,211,153,0.1)":"rgba(239,68,68,0.1)",border:"1px solid "+(scored?"#34d399":"#ef4444"),fontSize:12,color:"#d1fae5"}}>
      {scored?"Good! ":"Improve: "}{q.explanation}<div style={{marginTop:3,color:"#9ca3af",fontSize:11}}>Key: {q.keywords.join(", ")}</div>
    </div>)}
  </div>);
}

function TfnmQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var opts=["True","False","Not Mentioned"];
  return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {opts.map(function(opt,i){
      var isOk=i===q.answer,isSel=i===sel;
      var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
      if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #a78bfa";col="#a78bfa";}
      return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:10,padding:"10px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
        <span className={conf&&isOk?"rq-bounce":""} style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:(isSel||(conf&&isOk))?col:"rgba(255,255,255,0.1)",color:(isSel||(conf&&isOk))?"#0d0d1a":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>
          {conf&&isOk?"✓":conf&&isSel&&!isOk?"✕":"●"}
        </span>{opt}
      </button>);
    })}
  </div>);
}

function YnngQ(props){
  var q=props.q,sel=props.sel,conf=props.conf,onSel=props.onSel;
  var opts=["Yes","No","Not Given"];
  return(<div style={{display:"flex",flexDirection:"column",gap:8}}>
    {opts.map(function(opt,i){
      var isOk=i===q.answer,isSel=i===sel;
      var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
      if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #a78bfa";col="#a78bfa";}
      return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:10,padding:"10px 12px",color:col,fontSize:13,fontWeight:600,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:10}}>
        <span className={conf&&isOk?"rq-bounce":""} style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:(isSel||(conf&&isOk))?col:"rgba(255,255,255,0.1)",color:(isSel||(conf&&isOk))?"#0d0d1a":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>
          {conf&&isOk?"✓":conf&&isSel&&!isOk?"✕":"●"}
        </span>{opt}
      </button>);
    })}
  </div>);
}

// ── Timer ────────────────────────────────────────────────────
function Timer(props){
  var [secs,setSecs]=useState(props.limit);
  var iv=useRef(null);
  useEffect(function(){setSecs(props.limit);},[props.limit]);
  useEffect(function(){
    if(!props.running){clearInterval(iv.current);return;}
    iv.current=setInterval(function(){setSecs(function(s){if(s<=1){clearInterval(iv.current);setTimeout(function(){props.onExpire();},0);return 0;}return s-1;});},1000);
    return function(){clearInterval(iv.current);};
  },[props.running]);
  var p=props.limit>0?secs/props.limit:0;
  var col=p>0.5?"#22c55e":p>0.25?"#f59e0b":"#ef4444";
  return(<div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{width:44,height:44,borderRadius:"50%",border:"3px solid "+col,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col,flexShrink:0}}>{formatTime(secs)}</div>
    <div style={{flex:1}}>
      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:999,height:7,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:999,width:(p*100)+"%",background:col,transition:"width 1s linear"}}/>
      </div>
    </div>
  </div>);
}

// ── Main App ─────────────────────────────────────────────────
export default function App(){
  // auth
  var [nameInput,setNameInput]=useState("");
  var [passInput,setPassInput]=useState("");
  var [authMode,setAuthMode]=useState("register");
  var [showPass,setShowPass]=useState(false);
  // Sean Ellis PMF survey — shown once after 5+ completed quizzes per user
  var [seModal,setSeModal]=useState(false);
  // quiz hints
  var [dismissedHints,setDismissedHints]=useState(new Set());
  // keyword highlight
  var [hlMode,setHlMode]=useState(false);
  var [hlWords,setHlWords]=useState(new Set());
  // sound & music
  var [sfxOn,setSfxOn]=useState(function(){try{return localStorage.getItem("rq-sfx")!=="off";}catch(e){return true;}});
  var [musicOn,setMusicOn]=useState(false);
  var [musicGenre,setMusicGenre]=useState(function(){try{return localStorage.getItem("rq-music-genre")||"classical";}catch(e){return"classical";}});
  var audioCtxRef=useRef(null);
  var musicStopRef=useRef(null);
  var [authErr,setAuthErr]=useState("");
  var [currentUser,setCurrentUser]=useState(null);
  var [allUsers,setAllUsers]=useState([]);
  var [boards,setBoards]=useState({});
  var [social,setSocial]=useState({});
  var [appReady,setAppReady]=useState(false);
  // game
  var [level,setLevel]=useState("");
  var [selectedTypes,setSelectedTypes]=useState(["mcq","gap_word","gap_sentence","matching","heading","qa","tfnm","ynng"]);
  var [appTheme,setAppTheme]=useState(function(){try{return JSON.parse(localStorage.getItem("rq-theme")||"null")||null;}catch{return null;}});
  var [passage,setPassage]=useState("");
  var [topic,setTopic]=useState("");
  var [customTopic,setCustomTopic]=useState("");
  var [passageLang,setPassageLang]=useState(function(){
    try{
      var ui=localStorage.getItem("rq-uilang")||"en";
      var map={en:"English",uz:"Uzbek",ru:"Russian",tr:"Turkish",ar:"Arabic",de:"German",es:"Spanish",fr:"French"};
      return map[ui]||"English";
    }catch(e){return"English";}
  });
  var [useWeakVocab,setUseWeakVocab]=useState(false);
  var [personalizedWords,setPersonalizedWords]=useState([]);
  var [questions,setQuestions]=useState([]);
  var [shuffledRights,setShuffledRights]=useState([]);
  var [current,setCurrent]=useState(0);
  var [userAnswers,setUserAnswers]=useState({});
  var [matchState,setMatchState]=useState({});
  var [headingState,setHeadingState]=useState({});
  var [confirmed,setConfirmed]=useState(false);
  var [streak,setStreak]=useState(0);
  // Highest streak reached in the current run. Used for the +50 XP bonus so
  // a student who hits a 5-streak but misses the last question still earns it.
  var [maxStreak,setMaxStreak]=useState(0);
  var [totalXpSoFar,setTotalXpSoFar]=useState(0);
  var [showPassage,setShowPassage]=useState(false);
  var [timerRunning,setTimerRunning]=useState(false);
  var startTimeRef=useRef(null);
  // Tracks the library story whose quiz we're trying to upgrade with AI
  // questions in the background. Cleared once the user starts the quiz so a
  // late-arriving response can't swap questions out from under them mid-run.
  var libraryUpgradeRef=useRef(null);
  var [timeExpired,setTimeExpired]=useState(false);
  var [challengeMode,setChallengeMode]=useState(false);
  var [genLoading,setGenLoading]=useState(false);
  var [result,setResult]=useState(null);
  var [reviewQueue,setReviewQueue]=useState([]);
  var [reviewIdx,setReviewIdx]=useState(0);
  var [reviewAns,setReviewAns]=useState(null);
  var [reviewConfirmed,setReviewConfirmed]=useState(false);
  // ui
  var [stage,setStage]=useState("welcome");
  var [loadMsg,setLoadMsg]=useState("");
  var [lbLevel,setLbLevel]=useState("A1");
  var [error,setError]=useState("");
  // social ui
  var [searchQuery,setSearchQuery]=useState("");
  var [friendStage,setFriendStage]=useState("search"); // search|requests|list
  var [viewingUser,setViewingUser]=useState(null); // username string for friend profile
  var [challengeTarget,setChallengeTarget]=useState(null);
  var [challengeLevel,setChallengeLevel]=useState("B1");
  var [challengeTypes,setChallengeTypes]=useState(["mcq","qa"]);
  var [activeChallengeIdx,setActiveChallengeIdx]=useState(null);
  var [activeChallengeFrom,setActiveChallengeFrom]=useState("");
  var [storyChallengeOpen,setStoryChallengeOpen]=useState(false);
  var [storyChallengeMsg,setStoryChallengeMsg]=useState("");
  var [socialMsg,setSocialMsg]=useState("");
  // history
  var [historyLevel,setHistoryLevel]=useState("");
  // vocab notebook
  var [vocab,setVocab]=useState([]);
  var [allVocab,setAllVocab]=useState({});
  var [savedWords,setSavedWords]=useState(new Set());
  var [vocabCard,setVocabCard]=useState(0);
  var [vocabFlipped,setVocabFlipped]=useState(false);
  var [vocabFilter,setVocabFilter]=useState("all");
  // daily challenge
  var [dailyChallenge,setDailyChallenge]=useState(null);
  var [dailyDone,setDailyDone]=useState(null);
  var [dailyLb,setDailyLb]=useState([]);
  var [isDailyGame,setIsDailyGame]=useState(false);
  var [dailyLoading,setDailyLoading]=useState(false);
  // daily quests
  var [dailyQuests,setDailyQuests]=useState([]);
  var [questsDone,setQuestsDone]=useState({});
  // reading screen enhancements
  var [focusMode,setFocusMode]=useState(false);
  var [readingTimerSecs,setReadingTimerSecs]=useState(0);
  var readingTimerRef=useRef(null);
  var [isSpeaking,setIsSpeaking]=useState(false);
  var [selectedWord,setSelectedWord]=useState(null);
  var [wordDef,setWordDef]=useState(null);
  var [wordDefLoading,setWordDefLoading]=useState(false);
  var [speechRate,setSpeechRate]=useState(1);
  var [activeSentence,setActiveSentence]=useState(null);
  var [heatmapOn,setHeatmapOn]=useState(false);
  var [savedWordDefs,setSavedWordDefs]=useState({});
  // favorites
  var [favs,setFavs]=useState([]);
  var [allFavs,setAllFavs]=useState({});
  var [currentStoryId,setCurrentStoryId]=useState(null);
  // vocab game
  var [vocabGameMode,setVocabGameMode]=useState(null);
  var [vocabGameIdx,setVocabGameIdx]=useState(0);
  var [vocabGameScore,setVocabGameScore]=useState(0);
  var [vocabGameAnswered,setVocabGameAnswered]=useState(null);
  // translation
  var [translateLang,setTranslateLang]=useState(function(){try{return localStorage.getItem("rq-translate-lang")||"uz";}catch(e){return"uz";}});
  var [translation,setTranslation]=useState(null);
  var [translating,setTranslating]=useState(false);
  // weekly board
  var [weeklyLb,setWeeklyLb]=useState([]);
  // F5 — friend nudge home-screen banner (positive framing only).
  // Dismissal persists to localStorage for one day so it doesn't bounce back
  // on every home re-enter.
  var [nudgeDismissedToday,setNudgeDismissedToday]=useState(false);
  // discuss
  var [discussStoryId,setDiscussStoryId]=useState(null);
  var [allDiscuss,setAllDiscuss]=useState({});
  var [discussInput,setDiscussInput]=useState("");
  // pronunciation check
  var [pronMode,setPronMode]=useState(false);
  var [pronSentence,setPronSentence]=useState("");
  var [pronRecording,setPronRecording]=useState(false);
  var [pronResult,setPronResult]=useState(null);
  var pronRecRef=useRef(null);
  // Vocab-game options caches: keyed by question index so options don't
  // re-shuffle every time React re-renders (e.g. after the user clicks one).
  var vocabGameCacheRef=useRef({key:"",shuffled:[],options:{},bOptions:{}});
  // reading goals
  var [goals,setGoals]=useState({});
  // ai tutor
  var [tutorChat,setTutorChat]=useState([]);
  var [tutorInput,setTutorInput]=useState("");
  // writing feedback
  var [writeSummary,setWriteSummary]=useState("");
  var [writeFeedback,setWriteFeedback]=useState(null);
  // error correction challenge
  var [ecData,setEcData]=useState(null);
  var [ecLoading,setEcLoading]=useState(false);
  var [ecError,setEcError]=useState("");
  var [ecSelected,setEcSelected]=useState(new Set());
  var [ecRevealed,setEcRevealed]=useState(false);
  var [passagePeekOpen,setPassagePeekOpen]=useState(false);
  // rsvp speed reader
  var [rsvpActive,setRsvpActive]=useState(false);
  var [rsvpWpm,setRsvpWpm]=useState(250);
  var [rsvpIdx,setRsvpIdx]=useState(0);
  var [rsvpPaused,setRsvpPaused]=useState(false);
  var [rsvpDone,setRsvpDone]=useState(false);
  var rsvpRef=useRef(null);
  var rsvpWordsRef=useRef([]);
  // streak shields
  var [shields,setShields]=useState(0);
  var [shieldDates,setShieldDates]=useState([]);
  var [longestStreak,setLongestStreak]=useState(0);
  // Daily quota state — { ai:{used,maxLow,maxHigh}, vocab:{used,max}, ... }
  // Refreshed on login + after every result. Used by the home-screen
  // "X / Y quests today" chip. Null until first /api/quota response.
  var [userQuota,setUserQuota]=useState(null);
  // Reading-slider stage state. Cards are pre-fetched a few ahead of the
  // current index; sliderAnswers maps cardIdx → pickedOptionIdx so the
  // post-answer state survives swipes. sliderCapHit flips true when the
  // server returns 429 — UI then shows a graceful "come back tomorrow" card.
  var [sliderCards,setSliderCards]=useState([]);
  var [sliderIdx,setSliderIdx]=useState(0);
  var [sliderAnswers,setSliderAnswers]=useState({});
  var [sliderLoading,setSliderLoading]=useState(false);
  var [sliderCapHit,setSliderCapHit]=useState(false);
  var [sliderError,setSliderError]=useState("");
  // F3 polish — when the user finishes the day's deck (or chooses to stop
  // mid-session), flip this to render a summary instead of bouncing to home.
  var [sliderEnded,setSliderEnded]=useState(false);
  var sliderStartRef=useRef({});
  // F6 — Teacher public profile state. `teacherBio` is the form-bound
  // editor on the teacher dashboard; `viewedTeacher` holds the
  // currently-rendered public profile (loaded on ?teacher=X URL or
  // from a search-result click).
  var [teacherBio,setTeacherBio]=useState({bio:"",displayName:"",languages:[],subjects:[],public:false});
  var [teacherBioSaving,setTeacherBioSaving]=useState(false);
  var [teacherBioMsg,setTeacherBioMsg]=useState("");
  var [viewedTeacher,setViewedTeacher]=useState(null);
  var [viewedTeacherErr,setViewedTeacherErr]=useState("");
  var [subscribeMsg,setSubscribeMsg]=useState("");
  // F6c — Teacher directory search state
  var [teacherSearchQuery,setTeacherSearchQuery]=useState("");
  var [teacherSearchResults,setTeacherSearchResults]=useState([]);
  var [teacherSearchLoading,setTeacherSearchLoading]=useState(false);
  var [teacherSearchTotal,setTeacherSearchTotal]=useState(0);
  // F7 — Group Reading Rooms
  // roomCode: active room id; roomState: latest server snapshot;
  // roomMyName: the display name we joined under (could be the
  // authenticated username OR an anonymous nickname for link-share guests).
  // roomEntryCode: typed code on the entry/join screen.
  var [roomCode,setRoomCode]=useState("");
  var [roomState,setRoomState]=useState(null);
  var [roomMyName,setRoomMyName]=useState("");
  var [roomLoading,setRoomLoading]=useState(false);
  var [roomMsg,setRoomMsg]=useState("");
  var [roomEntryCode,setRoomEntryCode]=useState("");
  var [roomEntryName,setRoomEntryName]=useState("");
  var [roomCreateTopic,setRoomCreateTopic]=useState("");
  var roomPollRef=useRef(null);
  var roomStartRef=useRef(0);
  // Feature 2 - Placement Test
  var [showPlacement,setShowPlacement]=useState(false);
  var [placementAnswers,setPlacementAnswers]=useState({});
  var [placementResult,setPlacementResult]=useState(null);
  // Feature 3 - Sentence Saver / Quote Book
  var [quotes,setQuotes]=useState(function(){return loadQuotes();});
  var [quotesSaved,setQuotesSaved]=useState(false);
  // Feature 4 - Notifications
  var [notifPermission,setNotifPermission]=useState(typeof Notification!=="undefined"?Notification.permission:"denied");
  // F4 — push reminders. pushSubscribed mirrors the server-side record;
  // pushExamDate is the optional ISO date used by the cron to ramp messages.
  var [pushSubscribed,setPushSubscribed]=useState(false);
  var [pushExamDate,setPushExamDate]=useState("");
  var [pushBusy,setPushBusy]=useState(false);
  var [pushMsg,setPushMsg]=useState("");
  // Feature 1 - Auto Vocab
  var [autoVocabWords,setAutoVocabWords]=useState([]);
  var [autoVocabDismissed,setAutoVocabDismissed]=useState(false);
  // Feature 7 - Custom Text Quiz
  var [customText,setCustomText]=useState("");
  var [customTextOpen,setCustomTextOpen]=useState(false);
  var [customTextLoading,setCustomTextLoading]=useState(false);
  var [customTextError,setCustomTextError]=useState("");
  // Feature 8 - PWA
  var [isOnline,setIsOnline]=useState(navigator.onLine!==false);
  var [installPrompt,setInstallPrompt]=useState(null);
  // Teacher dashboard
  var [classes,setClasses]=useState([]);
  var [currentClass,setCurrentClass]=useState(null);
  var [isTeacherReg,setIsTeacherReg]=useState(false);
  var [newClassName,setNewClassName]=useState("");
  var [joinClassCode,setJoinClassCode]=useState("");
  var [joinClassMsg,setJoinClassMsg]=useState("");
  // Assignments (Phase 2)
  var [assignments,setAssignments]=useState([]);
  var [assignStoryId,setAssignStoryId]=useState("");
  var [assignTopic,setAssignTopic]=useState("");
  var [assignType,setAssignType]=useState("library");
  var [assignDue,setAssignDue]=useState("");
  var [assignLevel,setAssignLevel]=useState("B1");
  var [assignLoading,setAssignLoading]=useState(false);
  var [assignMsg,setAssignMsg]=useState("");
  var [assignCustomText,setAssignCustomText]=useState("");
  var [announcementText,setAnnouncementText]=useState("");
  var [announcementMsg,setAnnouncementMsg]=useState("");
  var [printStudent,setPrintStudent]=useState(null);
  var [copyMsg,setCopyMsg]=useState("");
  var [activeAssignmentId,setActiveAssignmentId]=useState(null);
  var [onboardStep,setOnboardStep]=useState(null);
  // Placement test state. pmtIdx = current question index; pmtAnswers maps
  // question index → selected option index. pmtResult is the recommended
  // CEFR level once the user finishes all 12 questions.
  var [pmtIdx,setPmtIdx]=useState(0);
  var [pmtAnswers,setPmtAnswers]=useState({});
  var [pmtResult,setPmtResult]=useState(null);
  var [onboardClassCode,setOnboardClassCode]=useState("");
  var [libSubjectFilter,setLibSubjectFilter]=useState("");
  var [librarySearch,setLibrarySearch]=useState("");
  var [reportData,setReportData]=useState(null);
  var [pendingReportData,setPendingReportData]=useState(null);
  var [shareLink,setShareLink]=useState("");
  var [shareLinkCopied,setShareLinkCopied]=useState(false);
  var [milestoneSeen,setMilestoneSeen]=useState(false);
  var [portfolioShareData,setPortfolioShareData]=useState(null);
  var [portfolioLink,setPortfolioLink]=useState("");
  var [portfolioLinkCopied,setPortfolioLinkCopied]=useState(false);
  // ui language
  var [uiLang,setUiLang]=useState(function(){try{return localStorage.getItem("rq-uilang")||"en";}catch(e){return"en";}});
  // Bumps when the active locale finishes loading so render-cached t() calls
  // re-read STRINGS. English is bundled inline; other locales are chunked
  // and dynamic-imported by loadLocale().
  var [localesVersion,setLocalesVersion]=useState(0);
  useEffect(function(){
    if(uiLang==="en")return;
    var cancelled=false;
    loadLocale(uiLang).then(function(){
      if(!cancelled)setLocalesVersion(function(v){return v+1;});
    });
    return function(){cancelled=true;};
  },[uiLang]);

  function t(key){void localesVersion;return(STRINGS[uiLang]&&STRINGS[uiLang][key])||STRINGS.en[key]||key;}
  // Looks up a localized question-type label (e.g. "Multiple Choice" → "Choix
  // multiple"). Falls back to the English table Q_LABELS when the language
  // doesn't define the lookup, then to the raw type key as a last resort.
  function qLabel(type){var tbl=STRINGS[uiLang]&&STRINGS[uiLang].qLabels;if(tbl&&tbl[type])return tbl[type];return Q_LABELS[type]||type;}
  // Localized badge name + description with fallback to the English BADGES table.
  function badgeName(id){var tbl=STRINGS[uiLang]&&STRINGS[uiLang].badgeNames;if(tbl&&tbl[id]&&tbl[id].name)return tbl[id].name;var b=BADGES.find(function(x){return x.id===id;});return b?b.name:id;}
  function badgeDesc(id){var tbl=STRINGS[uiLang]&&STRINGS[uiLang].badgeNames;if(tbl&&tbl[id]&&tbl[id].desc)return tbl[id].desc;var b=BADGES.find(function(x){return x.id===id;});return b?b.desc:"";}
  // Localized goal label/unit (e.g. "Games this week" / "games") with fallback
  // to the English GOAL_DEFS table.
  function goalLabel(id){var tbl=STRINGS[uiLang]&&STRINGS[uiLang].goalDefs;if(tbl&&tbl[id]&&tbl[id].label)return tbl[id].label;var d=GOAL_DEFS.find(function(x){return x.id===id;});return d?d.label:id;}
  function goalUnit(id){var tbl=STRINGS[uiLang]&&STRINGS[uiLang].goalDefs;if(tbl&&tbl[id]&&tbl[id].unit)return tbl[id].unit;var d=GOAL_DEFS.find(function(x){return x.id===id;});return d?d.unit:"";}
  // Localized quiz-strategy hint per question type. Falls back to English
  // Q_HINTS module-level table.
  function qHint(type){var tbl=STRINGS[uiLang]&&STRINGS[uiLang].qHints;if(tbl&&tbl[type])return tbl[type];return Q_HINTS[type]||"";}
  // Pick a motivational quote for the given milestone category. Reads from
  // the active locale's `motivational` table with English fallback; rotates
  // by today's date so users see variation across days but stable text
  // within a single result view.
  function pickMotivation(category){
    void localesVersion;
    var tbl=(STRINGS[uiLang]&&STRINGS[uiLang].motivational)||STRINGS.en.motivational;
    var pool=(tbl&&tbl[category])||(STRINGS.en.motivational&&STRINGS.en.motivational[category])||[];
    if(!pool.length)return"";
    var seed=todayKey().split("-").reduce(function(s,p){return s+Number(p);},0);
    return pool[seed%pool.length];
  }

  // Keep passageLang in sync with uiLang: switching UI to Russian also makes
  // AI-generated passages Russian by default. User can still override per
  // generation via the PASSAGE LANGUAGE chips when a custom topic is entered.
  useEffect(function(){
    var map={en:"English",uz:"Uzbek",ru:"Russian",tr:"Turkish",ar:"Arabic",de:"German",es:"Spanish",fr:"French"};
    var matched=map[uiLang];
    if(matched)setPassageLang(matched);
  },[uiLang]);

  // Gate ?report= links: only the named student or their teacher can open one.
  // The data is still embedded in the URL, but the viewer must be signed in
  // under one of those two names; otherwise we silently drop the payload.
  useEffect(function(){
    if(!pendingReportData||!currentUser)return;
    if(currentUser.name===pendingReportData.n||currentUser.name===pendingReportData.t){
      setReportData(pendingReportData);
      setStage("report");
    } else {
      setError(t("stu_errReportNotYours"));
    }
    setPendingReportData(null);
  },[currentUser,pendingReportData]);

  useEffect(function(){
    try{var params=new URLSearchParams(window.location.search);var b64dec=function(b){return new TextDecoder().decode(Uint8Array.from(atob(b),function(c){return c.charCodeAt(0);}));};var rep=params.get("report");if(rep){try{var rd=JSON.parse(b64dec(rep));setPendingReportData(rd);}catch(e){}/* don't short-circuit auth — gate the report behind a logged-in name match below */}var pf=params.get("portfolio");if(pf){var pd=JSON.parse(b64dec(pf));setPortfolioShareData(pd);setStage("portfolioShare");setAppReady(true);return;}var tch=params.get("teacher");if(tch){loadPublicTeacherProfile(tch);setStage("teacherProfile");setAppReady(true);return;}var rm=params.get("room");if(rm){setRoomEntryCode(rm);setStage("roomEntry");setAppReady(true);/* don't auto-join — let the user pick their display name first */return;}}catch(e){}
    var saved=localStorage.getItem("rq-session");
    var savedCreds=null;
    try{savedCreds=JSON.parse(localStorage.getItem(CREDS_KEY));}catch(e){}
    Promise.all([loadUsers(),loadBoards(),loadSocial(),loadClasses(),loadAssignments()]).then(function(v){
      setAllUsers(Array.isArray(v[0])?v[0]:[]);setBoards(v[1]||{});setSocial(v[2]||{});setClasses(asArray(v[3]));setAssignments(asArray(v[4]));
      var sessionName=saved||(savedCreds&&savedCreds.name);
      if(sessionName){var found=null;for(var i=0;i<v[0].length;i++){if(v[0][i].name===sessionName){found=v[0][i];break;}}if(found){if(savedCreds&&(savedCreds.refreshToken||savedCreds.hash)){getSessionToken(sessionName,savedCreds);if(savedCreds.hash)found=Object.assign({},found,{hash:savedCreds.hash});}if(!Array.isArray(found.games))found=Object.assign({},found,{games:[]});setCurrentUser(found);var role=localStorage.getItem("rq-role-"+found.name);if(role==="teacher"&&!localStorage.getItem("rq-onboarded-"+found.name))setOnboardStep(1);setStage(role==="teacher"?"teacherDashboard":"home");identify(found.name);track("user_session_resumed",{isTeacher:role==="teacher",gameCount:(found.games||[]).length});}}
      setAppReady(true);
    });
  },[]);

  // first-time-user coach: show 3-step modal on home if 0 games and not dismissed
  useEffect(function(){
    if(stage!=="home"||!currentUser)return;
    if((currentUser.games||[]).length>0)return;
    try{if(localStorage.getItem("rq-coach-done-"+currentUser.name)==="1")return;}catch(e){}
    if(coachStep===0){setCoachStep(1);try{track("onboarding_shown");}catch(e){}}
  },[stage,currentUser]);
  function dismissCoach(){
    setCoachStep(0);
    if(currentUser){try{localStorage.setItem("rq-coach-done-"+currentUser.name,"1");}catch(e){}}
    try{track("onboarding_dismissed",{atStep:coachStep});}catch(e){}
  }

  // reading screen timer + TTS cleanup
  useEffect(function(){
    if(stage==="reading"){
      setReadingTimerSecs(0);setSelectedWord(null);setWordDef(null);
      readingTimerRef.current=setInterval(function(){setReadingTimerSecs(function(s){return s+1;});},1000);
    } else {
      if(readingTimerRef.current){clearInterval(readingTimerRef.current);readingTimerRef.current=null;}
      if(window.speechSynthesis){window.speechSynthesis.cancel();}
      setIsSpeaking(false);
      if(rsvpRef.current){clearInterval(rsvpRef.current);rsvpRef.current=null;}
      setRsvpActive(false);setRsvpIdx(0);setRsvpPaused(false);setRsvpDone(false);
    }
    return function(){
      if(readingTimerRef.current){clearInterval(readingTimerRef.current);readingTimerRef.current=null;}
      if(rsvpRef.current){clearInterval(rsvpRef.current);rsvpRef.current=null;}
    };
  },[stage]);

  // rsvp ticker
  useEffect(function(){
    if(!rsvpActive||rsvpPaused||rsvpDone){
      if(rsvpRef.current){clearInterval(rsvpRef.current);rsvpRef.current=null;}
      return;
    }
    var ms=Math.round(60000/rsvpWpm);
    rsvpRef.current=setInterval(function(){
      setRsvpIdx(function(i){
        var next=i+1;
        if(next>=rsvpWordsRef.current.length){
          clearInterval(rsvpRef.current);rsvpRef.current=null;
          setRsvpDone(true);setRsvpPaused(true);
          return i;
        }
        return next;
      });
    },ms);
    return function(){if(rsvpRef.current){clearInterval(rsvpRef.current);rsvpRef.current=null;}};
  },[rsvpActive,rsvpPaused,rsvpDone,rsvpWpm]);

  // load vocab + daily challenge when user logs in
  useEffect(function(){
    if(!currentUser)return;
    var today=todayKey();
    loadUserQuota().then(function(q){setUserQuota(q);});
    // F6: pre-load the user's own teacher bio if they're a teacher.
    // Lets the dashboard editor populate on first render. Safe to fire
    // for students too — the GET returns 404 for non-public bios.
    if(localStorage.getItem("rq-role-"+currentUser.name)==="teacher"){
      setTimeout(loadOwnTeacherBio,0);
    }
    loadVocab().then(function(v){setAllVocab(v||{});setVocab(asArray(v&&v[currentUser.name]));});
    loadDaily().then(function(d){if(d&&d.date===today)setDailyChallenge(d);});
    var doneRaw=null;try{doneRaw=JSON.parse(localStorage.getItem("rq-daily-done-"+currentUser.name));}catch(e){}
    setDailyDone(doneRaw&&doneRaw.date===today?doneRaw:null);
    loadDailyLb().then(function(lb){setDailyLb(asArray(lb&&lb[today]));});
    var todayQuests=getDayQuests(today);setDailyQuests(todayQuests);
    var qDoneRaw=null;try{qDoneRaw=JSON.parse(localStorage.getItem("rq-quests-"+currentUser.name+"-"+today));}catch(e){}
    setQuestsDone(qDoneRaw||{});
    loadFavs().then(function(f){setAllFavs(f||{});setFavs(asArray(f&&f[currentUser.name]));});
    loadWeeklyLb().then(function(w){var wk=getWeekId();setWeeklyLb(asArray(w&&w[wk]));});
    loadDiscuss().then(function(d){setAllDiscuss(d||{});});
    var sKey="rq-streak-data-v1-"+currentUser.name;
    var sd=null;try{sd=JSON.parse(localStorage.getItem(sKey));}catch(e){}
    setShields(sd&&sd.shields!=null?sd.shields:0);
    setShieldDates(sd&&sd.shieldDates?sd.shieldDates:[]);
    setLongestStreak(sd&&sd.longestStreak?sd.longestStreak:0);
    var gk="rq-goals-v1-"+currentUser.name;
    var gd=null;try{gd=JSON.parse(localStorage.getItem(gk));}catch(e){}
    setGoals(gd||{});
    var rqk="rq-review-"+currentUser.name;
    var rqd=null;try{rqd=JSON.parse(localStorage.getItem(rqk));}catch(e){}
    setReviewQueue(asArray(rqd));
  },[currentUser]);

  // pull fresh users when entering friends page or typing a search
  useEffect(function(){
    if(stage==="friends"&&currentUser){
      loadUsers().then(function(u){setAllUsers(u);});
    }
  },[stage,searchQuery,currentUser]);

  useEffect(function(){
    if(stage==="reading"&&musicOn){startMusic(musicGenre);}
    else{stopMusic();}
    return function(){stopMusic();};
  },[stage,musicOn,musicGenre]);

  // PWA: online/offline + install prompt
  useEffect(function(){
    function handleOnline(){setIsOnline(true);}
    function handleOffline(){setIsOnline(false);}
    function handleInstall(e){e.preventDefault();setInstallPrompt(e);}
    window.addEventListener("online",handleOnline);
    window.addEventListener("offline",handleOffline);
    window.addEventListener("beforeinstallprompt",handleInstall);
    return function(){
      window.removeEventListener("online",handleOnline);
      window.removeEventListener("offline",handleOffline);
      window.removeEventListener("beforeinstallprompt",handleInstall);
    };
  },[]);

  // Placement test: show once for new users with no games
  useEffect(function(){
    if(!currentUser)return;
    var done=false;try{done=!!localStorage.getItem("rq-placement-done-"+currentUser.name);}catch(e){}
    if(!done&&(!currentUser.games||currentUser.games.length===0)){
      setShowPlacement(true);
    }
  },[currentUser]);

  // F4 — load existing push subscription state when the settings stage opens.
  useEffect(function(){
    if(stage==="settings"&&currentUser)loadPushSubscription();
  },[stage,currentUser]);

  // F5 — hydrate friend-nudge dismissal flag on login / day change.
  useEffect(function(){
    if(!currentUser){setNudgeDismissedToday(false);return;}
    try{
      var d=localStorage.getItem("rq-nudge-dismiss-"+currentUser.name);
      setNudgeDismissedToday(d===todayKey());
    }catch(e){setNudgeDismissedToday(false);}
  },[currentUser]);
  var nudgeShownRef=useRef("");

  var lv=getLv(level);
  var q=questions&&questions.length>current?questions[current]:null;

  // ── auth ──────────────────────────────────────────────────
  async function doRegister(){
    setAuthErr("");
    if(!nameInput.trim()||!passInput.trim()){setAuthErr(t("stu_authNamePassRequired"));return;}
    if(!/^[a-zA-Z0-9_]{2,30}$/.test(nameInput.trim())){setAuthErr(t("stu_authNameRules"));return;}
    if(passInput.length<4){setAuthErr(t("stu_authPasswordTooShort"));return;}
    var hash=await enc(passInput);
    var r=await fetch(REGISTER,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nameInput.trim(),hash:hash})});
    var d=await r.json();
    if(!d){setAuthErr(t("stu_authServerError"));return;}
    if(r.status===429){setAuthErr(t("stu_authTooManyAttempts"));return;}
    if(!r.ok){setAuthErr(d.error==="Username taken"?"Username taken.":(d.error||"Registration failed. Try again."));return;}
    _sessionToken=d.token;
    var user={name:nameInput.trim(),hash:hash,games:[],joined:todayKey()};
    var fresh=await loadUsers();setAllUsers(fresh);
    localStorage.setItem("rq-session",user.name);
    // Store the refresh token, NOT the password-equivalent SHA-256. A leaked
    // refresh token grants sessions until expiry / secret rotation; a leaked
    // password hash grants permanent access until the user changes it.
    localStorage.setItem(CREDS_KEY,JSON.stringify({name:user.name,refreshToken:d.refreshToken||""}));
    if(isTeacherReg)localStorage.setItem("rq-role-"+user.name,"teacher");
    setCurrentUser(user);setStage(isTeacherReg?"teacherDashboard":"home");
    if(isTeacherReg)setOnboardStep(1);
    identify(user.name);
    track("user_registered",{isTeacher:!!isTeacherReg});
  }

  async function doLogin(){
    setAuthErr("");
    if(!nameInput.trim()||!passInput.trim()){setAuthErr(t("stu_authEnterNameAndPass"));return;}
    var sha256=await enc(passInput);
    var r=await fetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nameInput.trim(),hash:sha256})});
    var d=await r.json();
    if(!d){setAuthErr(t("stu_authServerError"));return;}
    if(r.status===429){setAuthErr(t("stu_authTooManyLogins"));return;}
    if(!r.ok){setAuthErr(t("stu_authWrongPassword"));return;}
    _sessionToken=d.token;
    var fresh=await loadUsers();setAllUsers(fresh);
    var found=null;for(var i=0;i<fresh.length;i++){if(fresh[i].name.toLowerCase()===nameInput.trim().toLowerCase()){found=fresh[i];break;}}
    if(!found){setAuthErr(t("stu_authAccountError"));return;}
    found=Object.assign({},found,{hash:sha256,games:Array.isArray(found.games)?found.games:[]});
    localStorage.setItem("rq-session",found.name);
    // Store the refresh token; auto-login uses /api/refresh instead of
    // re-sending the password hash.
    localStorage.setItem(CREDS_KEY,JSON.stringify({name:found.name,refreshToken:d.refreshToken||""}));
    var role=localStorage.getItem("rq-role-"+found.name);
    setCurrentUser(found);setStage(role==="teacher"?"teacherDashboard":"home");
    identify(found.name);
    track("user_login",{isTeacher:role==="teacher",gameCount:(found.games||[]).length,totalXp:Number(found.totalXp)||0});
  }

  // ── teacher class actions ───────────────────────────────────
  function isTeacherOf(cls){return !!(cls&&currentUser&&cls.teacherName===currentUser.name);}
  function uniqueClassCode(){
    for(var i=0;i<50;i++){var code=generateClassCode();if(!classes.some(function(c){return c.id===code;}))return code;}
    return generateClassCode()+Date.now().toString(36).slice(-2).toUpperCase();
  }

  async function doCreateClass(){
    if(!currentUser||!newClassName.trim())return;
    var code=uniqueClassCode();
    var cls={id:code,name:newClassName.trim(),teacherName:currentUser.name,students:[],created:todayKey(),targetLevel:"B1"};
    var updated=classes.concat([cls]);
    setClasses(updated);
    setNewClassName("");
    await saveClassesRemote(updated);
  }

  async function doJoinClass(){
    if(!currentUser||!joinClassCode.trim())return;
    var code=joinClassCode.trim().toUpperCase();
    var cls=classes.find(function(c){return c.id===code;});
    if(!cls){setJoinClassMsg("Class not found. Check the code and try again.");return;}
    if((cls.students||[]).indexOf(currentUser.name)!==-1){setJoinClassMsg("You are already in "+cls.name+"!");return;}
    var updated=classes.map(function(c){
      if(c.id!==code)return c;
      return Object.assign({},c,{students:(c.students||[]).concat([currentUser.name])});
    });
    setClasses(updated);
    setJoinClassCode("");
    setJoinClassMsg("✓ Joined "+cls.name+"!");
    await saveClassesRemote(updated);
  }

  // ── assignment actions ──────────────────────────────────────
  async function doCreateAssignment(){
    if(!currentUser||!currentClass)return;
    if(!isTeacherOf(currentClass)){setAssignMsg("Only the class teacher can create assignments.");return;}
    setAssignMsg("");
    if(assignType==="library"&&!assignStoryId){setAssignMsg("Select a story first.");return;}
    if(assignType==="ai_topic"&&!assignTopic.trim()){setAssignMsg("Enter a topic first.");return;}
    if(assignType==="custom_text"&&assignCustomText.trim().length<150){setAssignMsg("Paste at least 150 characters of text so the AI can generate a full quiz.");return;}
    setAssignLoading(true);
    var id="asgn-"+Date.now();
    var base={id:id,classId:currentClass.id,teacherName:currentUser.name,type:assignType,dueDate:assignDue||null,createdAt:new Date().toISOString(),completions:{}};
    var asgn;
    if(assignType==="library"){
      var story=STORY_LIBRARY.find(function(s){return s.id===assignStoryId;});
      asgn=Object.assign({},base,{storyId:assignStoryId,topic:story?story.title:"Library Story",level:story?story.level:assignLevel,passage:null,questions:null});
    } else if(assignType==="custom_text"){
      try{
        var rc=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"quiz_from_text",passage:assignCustomText.trim(),level:assignLevel,types:["mcq","gap_word","qa","tfnm"]})});
        var dc=await rc.json();
        if(!rc.ok||dc.error)throw new Error(dc.error||"Generation failed");
        asgn=Object.assign({},base,{storyId:null,topic:dc.topic||"Custom Passage",level:assignLevel,passage:assignCustomText.trim(),questions:dc.questions});
      }catch(e){setAssignMsg("Quiz generation failed: "+e.message);setAssignLoading(false);return;}
    } else {
      try{
        var r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:assignLevel,topic:assignTopic.trim(),types:["mcq","gap_word","qa","tfnm"]})});
        var d=await r.json();
        if(!r.ok||d.error)throw new Error(d.error||"Generation failed");
        asgn=Object.assign({},base,{storyId:null,topic:assignTopic.trim(),level:assignLevel,passage:d.passage,questions:d.questions});
      }catch(e){setAssignMsg("AI generation failed: "+e.message);setAssignLoading(false);return;}
    }
    var updated=assignments.concat([asgn]);
    setAssignments(updated);
    setAssignStoryId("");setAssignTopic("");setAssignDue("");setAssignCustomText("");
    setAssignMsg("✓ Assignment created!");
    setAssignLoading(false);
    await saveAssignmentsRemote(updated);
  }

  function doCompleteAssignment(asgnId,pct,xp,timeSecs){
    if(!currentUser)return;
    // Compute outside setter so React strict-mode doesn't double-trigger the
    // remote save, and so the save uses the same snapshot we render with.
    var updated=assignments.map(function(a){
      if(a.id!==asgnId)return a;
      var comps=Object.assign({},a.completions);
      comps[currentUser.name]={pct:pct,xp:xp,timeSecs:timeSecs,completedAt:new Date().toISOString()};
      return Object.assign({},a,{completions:comps});
    });
    setAssignments(updated);
    saveAssignmentsRemote(updated).catch(function(e){console.error("doCompleteAssignment save failed:",e);});
  }

  function doExportClassCSV(){
    if(!currentClass||!allUsers)return;
    if(!isTeacherOf(currentClass))return;
    var Q_TYPES=["mcq","gap_word","gap_sentence","matching","heading","qa","tfnm","ynng"];
    var headers=["Student","Best Level","Games","Avg Score %","Avg WPM"].concat(Q_TYPES.map(function(t){return qLabel(t)+" %";})).concat(["Vocab Words","Last Active"]);
    var rows=(currentClass.students||[]).map(function(sName){
      var u=allUsers.find(function(u){return u.name===sName;});
      if(!u){
        // Student was removed from the user list. Emit a labelled placeholder row
        // instead of a ghost row with zeros so the export reflects reality.
        var blanks=Q_TYPES.map(function(){return"";});
        return[sName+" (removed)","–",0,"","",].concat(blanks).concat([0,"Never"]);
      }
      var games=u.games||[];
      var avgPct=games.length?Math.round(games.reduce(function(s,g){return s+g.pct;},0)/games.length):0;
      var wpmGames=games.filter(function(g){return g.wpm>0;});
      var avgWpm=wpmGames.length?Math.round(wpmGames.reduce(function(s,g){return s+g.wpm;},0)/wpmGames.length):0;
      var bestLv=getBestLevel(games);
      var lastDate=games.length?games[games.length-1].date:"Never";
      var typeScores=Q_TYPES.map(function(t){
        var relevant=games.filter(function(g){return g.typeStats&&g.typeStats[t]!==undefined;});
        if(!relevant.length)return"";
        var avg=Math.round(relevant.reduce(function(s,g){return s+(g.typeStats[t]||0);},0)/relevant.length);
        return avg;
      });
      var vocabCount=(allVocab&&Array.isArray(allVocab[sName]))?allVocab[sName].length:0;
      return[sName,bestLv,games.length,avgPct,avgWpm].concat(typeScores).concat([vocabCount,lastDate]);
    });
    // Normalise newlines inside cells so RFC-4180 parsers don't split rows.
    function csvCell(c){return'"'+String(c).replace(/\r?\n/g," ").replace(/"/g,'""')+'"';}
    var csv=[headers].concat(rows).map(function(r){return r.map(csvCell).join(",");}).join("\n");
    var blob=new Blob([csv],{type:"text/csv"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");a.href=url;a.download=currentClass.name.replace(/\s+/g,"_")+"_analytics.csv";a.click();
    URL.revokeObjectURL(url);
  }

  async function doPostAnnouncement(){
    if(!currentClass||!currentUser||!announcementText.trim())return;
    if(!isTeacherOf(currentClass))return;
    var updated=classes.map(function(c){
      if(c.id!==currentClass.id)return c;
      return Object.assign({},c,{announcement:{text:announcementText.trim(),date:todayKey(),teacherName:currentUser.name}});
    });
    setClasses(updated);
    var next=updated.find(function(c){return c.id===currentClass.id;});
    if(next)setCurrentClass(next); // class was deleted in another tab — leave currentClass alone rather than nuking it
    setAnnouncementText("");
    setAnnouncementMsg(t("tch_postedToast"));
    setTimeout(function(){setAnnouncementMsg("");},3000);
    await saveClassesRemote(updated);
  }

  async function doClearAnnouncement(){
    if(!currentClass||!isTeacherOf(currentClass))return;
    var updated=classes.map(function(c){
      if(c.id!==currentClass.id)return c;
      var n=Object.assign({},c);delete n.announcement;return n;
    });
    setClasses(updated);
    var next=updated.find(function(c){return c.id===currentClass.id;});
    if(next)setCurrentClass(next);
    await saveClassesRemote(updated);
  }

  function doFinishOnboarding(){
    if(currentUser)localStorage.setItem("rq-onboarded-"+currentUser.name,"true");
    setOnboardStep(null);setOnboardClassCode("");
    // The onboarding class is auto-selected at step 2 — clear it so the teacher
    // lands on the dashboard list rather than a stale class view.
    setCurrentClass(null);
  }

  function doOnboardCreateClass(){
    if(!currentUser||!newClassName.trim())return;
    var code=uniqueClassCode();
    var cls={id:code,name:newClassName.trim(),teacherName:currentUser.name,students:[],created:todayKey(),announcement:null};
    var updated=classes.concat([cls]);
    setClasses(updated);setCurrentClass(cls);setNewClassName("");setOnboardClassCode(code);setOnboardStep(2);
    saveClassesRemote(updated);
  }

  function generateReportLink(sName){
    var pu=allUsers.find(function(u){return u.name===sName;});
    var pg=pu&&pu.games?pu.games:[];
    var avgPct=pg.length?Math.round(pg.reduce(function(s,g){return s+g.pct;},0)/pg.length):0;
    var wpmGames=pg.filter(function(g){return g.wpm>0;});
    var avgWpm=wpmGames.length?Math.round(wpmGames.reduce(function(s,g){return s+g.wpm;},0)/wpmGames.length):0;
    var validGames=pg.filter(function(g){return typeof g.pct==="number";});
    var recent3=validGames.slice(-3);var prev3=validGames.slice(-6,-3);
    var rAvg=recent3.length?recent3.reduce(function(s,g){return s+g.pct;},0)/recent3.length:null;
    var pAvg=prev3.length?prev3.reduce(function(s,g){return s+g.pct;},0)/prev3.length:null;
    var trend=rAvg===null?"new":pAvg===null?"new":rAvg-pAvg>5?"improving":rAvg-pAvg<-5?"declining":"stable";
    var Q_TYPES_R=["mcq","gap_word","gap_sentence","matching","heading","qa","tfnm","ynng"];
    var qBreakdown={};
    Q_TYPES_R.forEach(function(t){var relevant=pg.filter(function(g){return g.typeStats&&g.typeStats[t]!==undefined;});if(relevant.length)qBreakdown[t]=Math.round(relevant.reduce(function(s,g){return s+(g.typeStats[t]||0);},0)/relevant.length*100);});
    var report={n:sName,t:currentClass?currentClass.teacherName:"",c:currentClass?currentClass.name:"",d:todayKey(),l:getBestLevel(pg),g:pg.length,s:avgPct,w:avgWpm,tr:trend,q:qBreakdown,r:pg.slice(-5).map(function(g){return{d:g.date,p:g.pct,l:g.level};})};
    var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(report))));
    return window.location.origin+window.location.pathname+"?report="+encoded;
  }

  function generatePortfolioLink(){
    if(!currentUser)return "";
    var pg=currentUser.games||[];
    var bestPct=pg.length?Math.max.apply(null,pg.map(function(g){return g.pct;})):0;
    var wpmGames=pg.filter(function(g){return g.wpm>0;});
    var bestWpm=wpmGames.length?Math.max.apply(null,wpmGames.map(function(g){return g.wpm;})):0;
    var topicCounts={};pg.forEach(function(g){if(g.topic)topicCounts[g.topic]=(topicCounts[g.topic]||0)+1;});
    var favTopic=Object.keys(topicCounts).sort(function(a,b){return topicCounts[b]-topicCounts[a];})[0]||null;
    var favSubj=favTopic?(SUBJECT_LABELS[SUBJECT_MAP[favTopic]]||"🏠 Life"):null;
    var lvBreak=["A1","A2","B1","B2","C1","C2"].map(function(lv){var lvg=pg.filter(function(g){return g.level===lv;});return{l:lv,c:lvg.length,a:lvg.length?Math.round(lvg.reduce(function(s,g){return s+g.pct;},0)/lvg.length):0};}).filter(function(x){return x.c>0;});
    var data={n:currentUser.name,g:pg.length,xp:currentUser.totalXp||0,bs:bestPct,bw:bestWpm,ls:longestStreak,lv:getBestLevel(pg),fs:favSubj,lb:lvBreak,d:todayKey()};
    var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    return window.location.origin+window.location.pathname+"?portfolio="+encoded;
  }

  // ── social actions ─────────────────────────────────────────
  async function sendRequest(to){
    if(!currentUser||to===currentUser.name)return;
    var r=doSendRequest(social,currentUser.name,to);
    if(!r.ok){setSocialMsg(r.err);return;}
    await saveSocial(r.social);setSocial(r.social);setSocialMsg(t("stu_socialRequestSent").replace("{name}",to));
  }

  async function acceptRequest(from){
    var n=doAcceptRequest(social,currentUser.name,from);
    await saveSocial(n);setSocial(n);setSocialMsg(t("stu_socialFriendsNow").replace("{name}",from));
  }

  async function declineRequest(from){
    var n=doDeclineRequest(social,currentUser.name,from);
    await saveSocial(n);setSocial(n);setSocialMsg(t("stu_socialDeclined"));
  }

  async function removeFriend(friend){
    var n=doRemoveFriend(social,currentUser.name,friend);
    await saveSocial(n);setSocial(n);setSocialMsg(t("stu_socialRemoved").replace("{name}",friend));
  }

  async function likeProfile(target){
    if(!currentUser||target===currentUser.name)return;
    var r=doLikeProfile(social,currentUser.name,target);
    if(!r.ok){setSocialMsg(r.err);return;}
    await saveSocial(r.social);setSocial(r.social);setSocialMsg(t("stu_socialLiked").replace("{name}",target));
  }

  async function sendChallenge(){
    if(!challengeTarget||!currentUser)return;
    var n=doSendChallenge(social,currentUser.name,challengeTarget,challengeLevel,challengeTypes);
    await saveSocial(n);setSocial(n);
    setSocialMsg(t("stu_socialChallengeSent").replace("{name}",challengeTarget));
    setChallengeTarget(null);
  }

  async function sendStoryChallenge(friendName){
    if(!friendName||!currentUser||!result||!result.storyId)return;
    var n=doSendChallenge(social,currentUser.name,friendName,result.level||level,selectedTypes||["mcq","qa"],result.storyId,topic,result.pct);
    await saveSocial(n);setSocial(n);
    setStoryChallengeMsg("⚔️ Challenge sent to "+friendName+"!");
    setStoryChallengeOpen(false);
  }

  async function respondChallenge(idx,status,challenge){
    var n=doRespondChallenge(social,currentUser.name,idx,status);
    await saveSocial(n);setSocial(n);
    if(status==="accepted"&&challenge){
      setActiveChallengeIdx(idx);
      setActiveChallengeFrom(challenge.from||"");
      setLevel(challenge.level);
      setSelectedTypes(challenge.types||["mcq","qa"]);
      setSocialMsg("");
      if(challenge.storyId){
        var libStory=STORY_LIBRARY.find(function(s){return s.id===challenge.storyId;});
        if(libStory){startStoryFromLibrary(libStory);return;}
      }
      setStage("home");
    }
  }

  // ── search ─────────────────────────────────────────────────
  function getSearchResults(){
    if(!searchQuery||searchQuery.trim().length<2)return[];
    if(!allUsers||!Array.isArray(allUsers))return[];
    var q2=searchQuery.trim().toLowerCase();
    return allUsers.filter(function(u){return u.name!==currentUser.name&&u.name.toLowerCase().indexOf(q2)!==-1;});
  }

  // ── vocab ─────────────────────────────────────────────────
  function toggleWord(word){
    var adding=!savedWords.has(word);
    setSavedWords(function(s){var n=new Set(s);if(n.has(word))n.delete(word);else n.add(word);return n;});
    if(adding&&selectedWord===word&&wordDef&&wordDef.def){
      setSavedWordDefs(function(d){var n={};for(var k in d)n[k]=d[k];n[word]={def:wordDef.def,example:wordDef.example||""};return n;});
    }else if(!adding){
      setSavedWordDefs(function(d){var n={};for(var k in d)if(k!==word)n[k]=d[k];return n;});
    }
  }

  function speakPassage(){
    if(!window.speechSynthesis)return;
    if(isSpeaking){window.speechSynthesis.cancel();setIsSpeaking(false);setActiveSentence(null);return;}
    var utt=new SpeechSynthesisUtterance(passage);
    utt.rate=speechRate;
    utt.onend=function(){setIsSpeaking(false);setActiveSentence(null);};
    utt.onerror=function(){setIsSpeaking(false);setActiveSentence(null);};
    window.speechSynthesis.speak(utt);
    setIsSpeaking(true);
  }

  function speakSentence(text){
    if(!window.speechSynthesis)return;
    window.speechSynthesis.cancel();
    setActiveSentence(text);setTranslation(null);
    var utt=new SpeechSynthesisUtterance(text);
    utt.rate=speechRate;
    utt.onend=function(){setIsSpeaking(false);};
    utt.onerror=function(){setIsSpeaking(false);};
    window.speechSynthesis.speak(utt);
    setIsSpeaking(true);
  }

  async function translateSentence(text){
    if(!text)return;
    setTranslating(true);setTranslation(null);
    try{
      var lang=translateLang||"uz";
      var url="https://api.mymemory.translated.net/get?q="+encodeURIComponent(text)+"&langpair=en|"+lang;
      // Abort after 8s so a hung MyMemory request doesn't leave the UI
      // stuck in the "Translating…" state forever.
      var ctl=new AbortController();var tid=setTimeout(function(){ctl.abort();},8000);
      var r=await fetch(url,{signal:ctl.signal});clearTimeout(tid);
      var d=await r.json();
      setTranslation(d.responseData&&d.responseData.translatedText?d.responseData.translatedText:t("stu_translationUnavailable"));
    }catch(e){setTranslation(t("stu_translationUnavailable"));}
    setTranslating(false);
  }

  async function toggleFav(storyId,storyTitle,storyLevel){
    if(!currentUser||!storyId)return;
    var existed=favs.some(function(f){return f.id===storyId;});
    var nFavs=existed?favs.filter(function(f){return f.id!==storyId;}):favs.concat([{id:storyId,title:storyTitle,level:storyLevel,date:todayKey()}]);
    var nAll={};for(var k in allFavs)nAll[k]=allFavs[k];nAll[currentUser.name]=nFavs;
    setFavs(nFavs);setAllFavs(nAll);saveFavs(nAll);
  }

  async function lookupWord(word){
    if(selectedWord===word){setSelectedWord(null);setWordDef(null);return;}
    setSelectedWord(word);setWordDef(null);setWordDefLoading(true);
    try{
      // Server endpoint dispatches by level (A1/A2 → translate, B1+ →
      // dict+situational-example) and shares a global cache, so the same
      // word never round-trips through Claude twice across users.
      var lookupLevel=level||"B1";
      var lookupLang=uiLang||"en";
      var ctl=new AbortController();var tid=setTimeout(function(){ctl.abort();},10000);
      var r=await fetch("/api/vocab-lookup",{method:"POST",headers:{"Content-Type":"application/json"},signal:ctl.signal,body:JSON.stringify({word:word,lang:lookupLang,level:lookupLevel})});
      clearTimeout(tid);
      if(!r.ok)throw new Error("not found");
      var data=await r.json();
      if(data.mode==="translate"){
        setWordDef({mode:"translate",translation:data.translation||"",lang:data.lang||lookupLang,phonetic:"",audio:"",def:"",example:""});
      }else{
        setWordDef({mode:"enriched",phonetic:data.phonetic||"",audio:data.audio||"",def:data.def||"",example:data.example||""});
      }
    }catch(e){
      setWordDef({mode:"error",phonetic:"",audio:"",def:t("stu_noDefinition"),example:""});
    }
    setWordDefLoading(false);
  }

  // ── game ──────────────────────────────────────────────────
  function shuffleArr(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

  async function generate(){
    if(!level){setError(t("stu_errPickLevel"));return;}
    setError("");

    if(customTopic.trim()){
      // AI path: call Claude to generate a passage on the custom topic
      setGenLoading(true);
      try{
        // matching/heading require complex formats Claude can't reliably produce — exclude from AI generation
        var AI_TYPES=["mcq","gap_word","gap_sentence","qa","tfnm","ynng"];
        var types=selectedTypes.filter(function(t){return AI_TYPES.indexOf(t)!==-1;});
        if(!types.length)types=["mcq","gap_word","qa","tfnm"];
        var safeTopic=customTopic.trim().replace(/[\r\n"]+/g," ").replace(/\s+/g," ").slice(0,120);
        if(!safeTopic){setError(t("stu_errTopicEmpty"));setGenLoading(false);return;}
        // Independent topic translation (via MyMemory) so the backend can verify
        // Claude wrote about the right thing instead of trusting Claude's own
        // self-reported topic_echo. Skipped for English and on translation
        // failure — backend falls back to topic_echo / English-topic checks.
        var PASS_LANG_CODES={English:"en",Spanish:"es",French:"fr",German:"de",Italian:"it",Portuguese:"pt",Russian:"ru",Turkish:"tr",Arabic:"ar",Uzbek:"uz"};
        var topicInLang=null;
        var langCode=PASS_LANG_CODES[passageLang];
        if(langCode&&langCode!=="en"){
          try{
            var tu="https://api.mymemory.translated.net/get?q="+encodeURIComponent(safeTopic)+"&langpair=en|"+langCode;
            var tr=await fetch(tu);
            var td=await tr.json();
            var tt=td&&td.responseData&&td.responseData.translatedText;
            if(tt&&typeof tt==="string"){topicInLang=tt.trim().slice(0,120);}
          }catch(_){/* swallow — backend will fall back */}
        }
        // Vocab personalization: when "Personalise with my vocab" is on, ship
        // the same weakest-5 active-vocab list that the toggle previews. Backend
        // asks Claude to naturally weave them into the passage; the reading
        // screen surfaces them via personalizedWords for the green banner.
        var vocabWords=[];
        if(useWeakVocab){
          var activeV=vocab.filter(function(w){return w.status!=="known";});
          activeV.sort(function(a,b){return (a.srInterval||0)-(b.srInterval||0);});
          vocabWords=activeV.slice(0,5).map(function(w){return w.word;});
        }
        var reqBody={level:level,topic:safeTopic,types:types,language:passageLang};
        if(topicInLang)reqBody.topic_in_language=topicInLang;
        if(vocabWords.length>0)reqBody.vocab_words=vocabWords;
        var r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(reqBody)});
        var d=await r.json();
        if(!r.ok||d.error)throw new Error(d.error||"Generation failed");
        if(!d.passage||!d.questions)throw new Error("Invalid response from AI");
        setPassage(d.passage);setTopic(safeTopic);setQuestions(d.questions);setCurrentStoryId(null);
        setPersonalizedWords(vocabWords);
        var mq=null;for(var i=0;i<d.questions.length;i++){if(d.questions[i].type==="matching"){mq=d.questions[i];break;}}
        setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights.map(function(v,i){return{idx:i,val:v};})):[]);
        setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
        setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
        setActiveSentence(null);setTranslation(null);setHeatmapOn(false);setIsDailyGame(false);
        setGenLoading(false);
        setStage("reading");
      }catch(e){
        setError("Could not generate passage: "+e.message);
        setGenLoading(false);
      }
      return;
    }

    // Library path: pick a random pre-written story (no API call)
    var levelStories=STORY_LIBRARY.filter(function(s){return s.level===level;});
    var gameList=(currentUser&&currentUser.games)||[];
    var played=new Set(gameList.map(function(g){return g.storyId;}));
    var unplayed=levelStories.filter(function(s){return !played.has(s.id);});
    var pool;
    if(unplayed.length>0){pool=unplayed;}
    else {
      // Every story at this level has been played at least once — fall back to
      // the full pool but exclude the most recently played story so we don't
      // immediately repeat it.
      var lastStoryId=null;
      for(var gi=gameList.length-1;gi>=0;gi--){if(gameList[gi].storyId){lastStoryId=gameList[gi].storyId;break;}}
      pool=lastStoryId?levelStories.filter(function(s){return s.id!==lastStoryId;}):levelStories;
      if(!pool.length)pool=levelStories;
    }
    var randomIdx=Math.floor(Math.random()*pool.length);
    var story=pool[randomIdx];
    setPassage(story.passage);setTopic(story.title);setQuestions(story.questions);setCurrentStoryId(story.id);
    var mq=null;for(var i=0;i<story.questions.length;i++){if(story.questions[i].type==="matching"){mq=story.questions[i];break;}}
    setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights.map(function(v,i){return{idx:i,val:v};})):[]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
    setActiveSentence(null);setTranslation(null);setHeatmapOn(false);setIsDailyGame(false);
    setStage("reading");
  }

  // Library stories ship with level-appropriate question counts after the
  // one-time content sweep (A1: 5, A2: 6, B1: 8, B2: 10, C1: 12, C2: 15).
  // This helper stays as a safety net: if a story is shorter than its
  // target count (e.g. a newly-added story or an in-flight edit), upgrade
  // it via /api/quiz-from-text and cache the result. Otherwise the static
  // questions are already fine — return null to signal "no swap needed".
  async function getLibraryQuiz(story){
    if(!story||!story.id||!story.passage||!story.level)return null;
    var targetByLevel={A1:5,A2:6,B1:8,B2:10,C1:12,C2:15};
    var target=targetByLevel[story.level]||6;
    if(Array.isArray(story.questions)&&story.questions.length>=target)return null;
    var cacheKey="rq-libqs-"+story.id;
    try{
      var cached=JSON.parse(localStorage.getItem(cacheKey)||"null");
      if(cached&&Array.isArray(cached)&&cached.length>=target)return cached;
    }catch(e){}
    try{
      var r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"quiz_from_text",passage:story.passage,level:story.level,types:["mcq","gap_word","qa","tfnm"]})});
      if(!r.ok)return null;
      var d=await r.json();
      if(d&&Array.isArray(d.questions)&&d.questions.length>=3){
        try{localStorage.setItem(cacheKey,JSON.stringify(d.questions));}catch(e){}
        return d.questions;
      }
    }catch(e){}
    return null;
  }

  function startStoryFromLibrary(story){
    setLevel(story.level);
    setPassage(story.passage);setTopic(story.title);setQuestions(story.questions);
    var mq=null;for(var i=0;i<story.questions.length;i++){if(story.questions[i].type==="matching"){mq=story.questions[i];break;}}
    setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights.map(function(v,i){return{idx:i,val:v};})):[]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
    setIsDailyGame(false);setCurrentStoryId(story.id);
    setActiveSentence(null);setTranslation(null);setHeatmapOn(false);
    // Clear run-scoped UI state so a fresh start doesn't inherit stale
    // banners, popups, or assignment credit from the previous quiz.
    setPersonalizedWords([]);setAutoVocabWords([]);setAutoVocabDismissed(false);
    setSavedWords(new Set());setHlMode(false);setHlWords(new Set());
    setSelectedWord(null);setWordDef(null);
    setPronMode(false);setPronSentence("");setPronResult(null);setPronRecording(false);
    setActiveAssignmentId(null);setResult(null);setError("");setChallengeMode(false);
    setFocusMode(false);setReadingTimerSecs(0);
    setStage("reading");
    // Kick off the AI quiz upgrade. Only swap if the user is still on this
    // story when the response arrives — the ref is cleared in startQuiz so
    // a late-arriving fetch can't replace questions mid-run.
    libraryUpgradeRef.current=story.id;
    getLibraryQuiz(story).then(function(aiQs){
      if(!aiQs||libraryUpgradeRef.current!==story.id)return;
      setQuestions(aiQs);
      var mq2=null;for(var j=0;j<aiQs.length;j++){if(aiQs[j].type==="matching"){mq2=aiQs[j];break;}}
      setShuffledRights(mq2&&mq2.rights?shuffleArr(mq2.rights.map(function(v,i){return{idx:i,val:v};})):[]);
    });
  }

  function startQuiz(){
    if(window.speechSynthesis){window.speechSynthesis.cancel();setIsSpeaking(false);}
    setFocusMode(false);setSelectedWord(null);setWordDef(null);
    // Quiz has started — any still-pending library AI-quiz response should
    // be dropped to avoid swapping questions mid-run.
    libraryUpgradeRef.current=null;
    if(currentUser&&savedWords.size>0){
      var today=todayKey();
      var newEntries=[];
      savedWords.forEach(function(w){if(!vocab.some(function(v){return v.word===w;})){var wd=savedWordDefs&&savedWordDefs[w];newEntries.push({word:w,level:level,topic:topic,date:today,status:"new",def:wd?wd.def:"",example:wd?wd.example:"",srInterval:0,nextReview:srsNextDate(SRS_INTERVALS[0])});}});
      if(newEntries.length>0){
        var nv=vocab.concat(newEntries);
        var nAll={};for(var k in allVocab)nAll[k]=allVocab[k];nAll[currentUser.name]=nv;
        setVocab(nv);setAllVocab(nAll);saveVocab(nAll);
      }
    }
    // Feature 1: extract auto-vocab from passage
    var extracted=extractAutoVocab(passage);
    if(extracted.length>0){setAutoVocabWords(extracted);setAutoVocabDismissed(false);}
    startTimeRef.current=Date.now();setTimerRunning(true);setStage("quiz");
  }
  function handleExpire(){setTimerRunning(false);setTimeExpired(true);doFinish();}

  function getCurrentAnswer(){if(!q)return null;if(q.type==="matching")return matchState;if(q.type==="heading")return headingState;return userAnswers[current]!==undefined?userAnswers[current]:null;}

  function canConfirm(){
    if(!q||timeExpired)return false;
    if(q.type==="mcq"||q.type==="gap_word"||q.type==="gap_sentence"||q.type==="tfnm"||q.type==="ynng")return userAnswers[current]!==undefined;
    if(q.type==="matching")return Object.keys(matchState).length===(q.lefts||[]).length;
    if(q.type==="heading")return Object.keys(headingState).length===(q.paragraphs||[]).length;
    if(q.type==="qa")return userAnswers[current]&&userAnswers[current].trim().length>=3;
    return false;
  }

  function doConfirm(){
    if(!canConfirm())return;
    var ans=getCurrentAnswer(),pts=scoreQuestion(q,ans),mxp=maxPoints(q);
    var isGood=pts>=Math.ceil(mxp/2),ns=isGood?streak+1:0;
    setStreak(ns);
    if(ns>maxStreak)setMaxStreak(ns);
    setTotalXpSoFar(function(x){return x+Math.round(pts*(lv?lv.mult:1)*100)+(ns>=3?50:0);});
    playSfx(isGood?"correct":"wrong");
    setConfirmed(true);
  }

  function doNext(){
    if(current+1>=questions.length){setTimerRunning(false);doFinish();}
    else{setCurrent(function(c){return c+1;});setConfirmed(false);}
  }

  async function doFinish(){
    if(!currentUser){setStage("home");return;}
    try{
      var currentMatchState=Object.assign({},matchState);
      var currentHeadingState=Object.assign({},headingState);
      var timeSecs=startTimeRef.current?Math.round((Date.now()-startTimeRef.current)/1000):(lv?lv.timeLimit:180);
      var totalEarned=0,totalMax=0,ansArr=[],typeStats={};
      for(var i=0;i<questions.length;i++){
        var qs=questions[i],ans=null;
        if(qs.type==="matching")ans=currentMatchState;
        else if(qs.type==="heading")ans=currentHeadingState;
        else ans=userAnswers[i]!==undefined?userAnswers[i]:null;
        var pts=scoreQuestion(qs,ans),mx=maxPoints(qs);
        ansArr.push(pts>=Math.ceil(mx/2));
        totalEarned+=pts;totalMax+=mx;
        if(!typeStats[qs.type])typeStats[qs.type]={earned:0,max:0};
        typeStats[qs.type].earned+=pts;typeStats[qs.type].max+=mx;
      }
      var pct=totalMax>0?Math.round((totalEarned/totalMax)*100):0;
      var stars=pct>=90?5:pct>=75?4:pct>=60?3:pct>=40?2:1;
      var lvObj=lv||LEVELS[0];
      var tb=Math.round(lvObj.timeBonus*Math.max(0,(lvObj.timeLimit-timeSecs)/lvObj.timeLimit));
      // Streak bonus uses maxStreak so it's awarded once-per-run when the
      // streak ever reached 3, not only when the last answer was correct.
      var finalXp=Math.round(totalEarned*lvObj.mult*100)+tb+(Math.max(streak,maxStreak)>=3?50:0);
      var wasChallenge=challengeMode&&!timeExpired;
      if(wasChallenge)finalXp=Math.round(finalXp*1.5);
      var today=todayKey();
      var userGames=currentUser.games||[];

      var badgesBefore=checkBadges(currentUser,vocab,calcStreakWithShields(userGames,shieldDates));
      var tempTodayGames=userGames.filter(function(g){return g.date===today;}).concat([{level:lvObj.key,pct:pct,timeSecs:timeSecs,xp:finalXp,isDaily:isDailyGame}]);
      var newQuestItems=[];
      for(var qi=0;qi<dailyQuests.length;qi++){
        var qt=dailyQuests[qi];
        if(questsDone[qt.id])continue;
        if(checkQuest(qt.id,tempTodayGames,vocab.length,{dailyDone:isDailyGame,streak:calcStreakWithShields(userGames.concat([{date:today}]),shieldDates)})){
          newQuestItems.push(qt);finalXp+=qt.xp;
        }
      }
      // Only record a WPM if the student spent enough time on the reading
      // screen to make the measurement meaningful (otherwise we'd save
      // garbage like 12000 WPM from a 1-second skim).
      var wpm=readingTimerSecs>5?getWpmFromSecs(passage.split(/\s+/).length,readingTimerSecs):0;
      var gameEntry={level:lvObj.key,score:totalEarned,total:totalMax,xp:finalXp,pct:pct,timeSecs:timeSecs,timeBonus:tb,topic:topic,date:today,typeStats:typeStats,isDaily:isDailyGame||false,storyId:currentStoryId||null,wpm:wpm};
      var priorXp=Math.max(Number(currentUser.totalXp)||0,userGames.reduce(function(s,g){return s+(g.xp||0);},0));
      var newTotalXp=priorXp+finalXp;
      var prevAppLevel=getUserLevel(priorXp);
      var newAppLevel=getUserLevel(newTotalXp);
      var leveledUp=newAppLevel>prevAppLevel;
      var updatedUser={name:currentUser.name,hash:currentUser.hash,games:userGames.concat([gameEntry]),joined:currentUser.joined,totalXp:newTotalXp};
      var newUsers=[];for(var j=0;j<allUsers.length;j++){newUsers.push(allUsers[j].name===currentUser.name?updatedUser:allUsers[j]);}
      try{await saveUsers(newUsers);}catch(e){console.warn("saveUsers failed:",e);}
      setAllUsers(newUsers);setCurrentUser(updatedUser);
      var prevStreakVal=calcStreakWithShields(userGames,shieldDates);
      var newStreakVal=calcStreakWithShields(updatedUser.games,shieldDates);
      var badgesAfter=checkBadges(updatedUser,vocab,newStreakVal);
      var newBadgeIds=BADGES.filter(function(b){return badgesAfter[b.id]&&!badgesBefore[b.id];}).map(function(b){return b.id;});
      var newLongest=Math.max(longestStreak,newStreakVal);
      var newShields=shields;
      if(newStreakVal>0&&newStreakVal%7===0&&prevStreakVal%7!==0&&newShields<3){newShields=Math.min(3,newShields+1);}
      setLongestStreak(newLongest);setShields(newShields);
      var sKey2="rq-streak-data-v1-"+updatedUser.name;
      localStorage.setItem(sKey2,JSON.stringify({shields:newShields,shieldDates:shieldDates,longestStreak:newLongest}));

      var lbEntry={name:currentUser.name,xp:finalXp,score:totalEarned,total:totalMax,pct:pct,timeSecs:timeSecs,topic:topic,date:today};
      var nb=Object.assign({},boards);
      var cur=nb[lvObj.key]||[];var filtered=cur.filter(function(e){return e.name!==currentUser.name;});var merged=filtered.concat([lbEntry]);merged.sort(function(a,b){return b.xp-a.xp;});nb[lvObj.key]=merged.slice(0,100);
      try{await saveBoards(nb);}catch(e){console.warn("saveBoards failed:",e);}
      setBoards(nb);

      if(activeChallengeIdx!==null&&activeChallengeFrom&&currentUser){
        try{var nc=doCompleteChallenge(social,currentUser.name,activeChallengeIdx,{pct:pct,xp:finalXp,timeSecs:timeSecs});await saveSocial(nc);setSocial(nc);}catch(e){console.warn("saveSocial failed:",e);}
        setActiveChallengeIdx(null);setActiveChallengeFrom("");
      }

      var wasDaily=isDailyGame;
      if(isDailyGame&&currentUser){
        var done={date:today,xp:finalXp,pct:pct,timeSecs:timeSecs};
        localStorage.setItem("rq-daily-done-"+currentUser.name,JSON.stringify(done));
        setDailyDone(done);
        try{var dlb=await loadDailyLb();var todayDlb=(dlb&&dlb[today])||[];var dfiltered=todayDlb.filter(function(e){return e.name!==currentUser.name;});var dEntry={name:currentUser.name,xp:finalXp,pct:pct,timeSecs:timeSecs};var dmerged=dfiltered.concat([dEntry]);dmerged.sort(function(a,b){return b.xp-a.xp;});var ndlb={};for(var dk in dlb)ndlb[dk]=dlb[dk];ndlb[today]=dmerged;saveDailyLb(ndlb);setDailyLb(dmerged);}catch(e){console.warn("dailyLb failed:",e);}
        setIsDailyGame(false);
      }

      var wk=getWeekId();
      try{var wlb=await loadWeeklyLb();var wToday=(wlb&&wlb[wk])||[];var wExisting=wToday.find(function(e){return e.name===currentUser.name;});var wEntry=wExisting?{name:wExisting.name,xp:wExisting.xp+finalXp,games:(wExisting.games||0)+1}:{name:currentUser.name,xp:finalXp,games:1};var wFiltered=wToday.filter(function(e){return e.name!==currentUser.name;});var wMerged=wFiltered.concat([wEntry]);wMerged.sort(function(a,b){return b.xp-a.xp;});var nwlb={};for(var wk2 in wlb)nwlb[wk2]=wlb[wk2];nwlb[wk]=wMerged.slice(0,30);saveWeeklyLb(nwlb);setWeeklyLb(wMerged.slice(0,30));}catch(e){console.warn("weeklyLb failed:",e);}

      var rank=0;for(var r=0;r<nb[lvObj.key].length;r++){if(nb[lvObj.key][r].name===currentUser.name&&nb[lvObj.key][r].xp===finalXp&&nb[lvObj.key][r].date===today){rank=r;break;}}
      if(newQuestItems.length>0){
        var nqd={};for(var qk in questsDone)nqd[qk]=questsDone[qk];
        newQuestItems.forEach(function(q){nqd[q.id]=true;});
        localStorage.setItem("rq-quests-"+currentUser.name+"-"+today,JSON.stringify(nqd));
        setQuestsDone(nqd);
      }
      var questBonus=newQuestItems.reduce(function(s,q){return s+q.xp;},0);
      var updatedGoals=Object.assign({},goals);
      var completedGoalIds=[];
      var wkId=getWeekId();
      GOAL_DEFS.forEach(function(def){
        var g=updatedGoals[def.id];if(!g)return;
        var wasReset=false;
        if((def.id==="weekly_games"||def.id==="weekly_xp")&&g.weekId!==wkId){g=Object.assign({},g,{weekId:wkId});wasReset=true;}
        var prevProg=getGoalProgress(def.id,g,currentUser.games,newStreakVal);
        if(def.id==="avg_score"){var tr=(g.trackGames||[]).concat([pct]);g=Object.assign({},g,{trackGames:tr.slice(-5)});}
        updatedGoals[def.id]=g;
        var newProg=getGoalProgress(def.id,g,updatedUser.games,newStreakVal);
        if(newProg.done&&!prevProg.done)completedGoalIds.push(def.id);
      });
      saveGoalsLocal(updatedGoals);
      // Search assignments across ALL classes the student is in — they may belong to more than one.
      var myAsgClassIds=classes.filter(function(c){return (c.students||[]).indexOf(currentUser.name)!==-1;}).map(function(c){return c.id;});
      if(myAsgClassIds.length){
        var matchingAsgn=assignments.find(function(a){
          if(myAsgClassIds.indexOf(a.classId)===-1||!a.completions||a.completions[currentUser.name])return false;
          if(activeAssignmentId)return a.id===activeAssignmentId;
          return a.storyId&&a.storyId===currentStoryId;
        });
        if(matchingAsgn){doCompleteAssignment(matchingAsgn.id,pct,finalXp,timeSecs);setActiveAssignmentId(null);}
      }
      // save missed questions to SRS review queue
      var REVIEW_TYPES=["mcq","gap_word","gap_sentence","tfnm","ynng","qa"];
      var missed=[];var todayLoc=todayKey();
      for(var ri=0;ri<questions.length;ri++){if(!ansArr[ri]&&REVIEW_TYPES.indexOf(questions[ri].type)!==-1){missed.push({id:todayLoc+"-"+ri+"-"+Math.random().toString(36).slice(2),q:questions[ri],topic:topic,level:lvObj.key,date:todayLoc,nextReview:todayLoc,srInterval:0});}}
      if(missed.length>0&&currentUser){
        var rqExist=[];try{rqExist=JSON.parse(localStorage.getItem("rq-review-"+currentUser.name)||"[]");}catch(e){}
        var rqTexts=new Set(rqExist.map(function(r){return r.q.q||r.q.sentence||r.q.instruction||"";}));
        var rqNew=missed.filter(function(r){return !rqTexts.has(r.q.q||r.q.sentence||r.q.instruction||"");});
        var rqUpdated=rqExist.concat(rqNew).slice(-60);
        localStorage.setItem("rq-review-"+currentUser.name,JSON.stringify(rqUpdated));
        setReviewQueue(rqUpdated);
      }
      setResult({level:lvObj.key,xp:finalXp,score:totalEarned,maxScore:totalMax,pct:pct,stars:stars,timeBonus:tb,timeSecs:timeSecs,rank:rank,answers:ansArr,typeStats:typeStats,wasDaily:wasDaily,newBadges:newBadgeIds,newQuests:newQuestItems,questBonus:questBonus,wpm:wpm,storyId:currentStoryId||null,earnedShield:newShields>shields,newStreakVal:newStreakVal,completedGoals:completedGoalIds,wasChallenge:wasChallenge,leveledUp:leveledUp,newAppLevel:newAppLevel});
      stopMusic();playSfx("complete");
      setStage("result");
      track("quiz_completed",{level:lvObj.key,pct:pct,xp:finalXp,timeSecs:timeSecs,wpm:wpm,stars:stars,isDaily:!!wasDaily,isChallenge:!!wasChallenge,gameCount:updatedUser.games.length});
      // Refresh the quota chip so users see their daily counter tick up
      // immediately on return-to-home, without waiting for a full reload.
      loadUserQuota().then(function(q){setUserQuota(q);});
    }catch(e){console.error("doFinish error:",e);setResult({xp:0,score:0,maxScore:0,pct:0,stars:0,timeBonus:0,timeSecs:0,rank:0,answers:[],typeStats:{},wasDaily:false,newBadges:[],newQuests:[],questBonus:0,wpm:0,storyId:null,earnedShield:false,newStreakVal:0,completedGoals:[]});setStage("result");track("quiz_failed",{error:String(e&&e.message||e)});}
  }

  // No-signup demo quiz. Standalone flow that doesn't touch user state.
  var [demoStep,setDemoStep]=useState(0); // 0=passage, 1..5=questions, 6=result
  var [demoAnswers,setDemoAnswers]=useState([]);
  // First-time-user onboarding modal. coachStep: 0=hidden, 1/2/3=visible
  var [coachStep,setCoachStep]=useState(0);
  // Toast feedback after share-to-clipboard
  var [shareToast,setShareToast]=useState("");
  function startDemoQuiz(){
    try{track("welcome_demo_start");}catch(e){}
    setDemoStep(0);setDemoAnswers([]);
    setStage("demo");
  }

  function doRestart(){
    setLevel("");setPassage("");setTopic("");setQuestions([]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);
    setResult(null);setTimerRunning(false);setTimeExpired(false);setError("");setChallengeMode(false);
    setIsDailyGame(false);setSavedWords(new Set());setHlMode(false);setHlWords(new Set());
    setFocusMode(false);setSelectedWord(null);setWordDef(null);setReadingTimerSecs(0);
    setActiveSentence(null);setTranslation(null);setHeatmapOn(false);setCurrentStoryId(null);setSavedWordDefs({});setActiveAssignmentId(null);
    setTutorChat([]);setTutorInput("");setTutorLoading(false);
    setActiveChallengeIdx(null);setActiveChallengeFrom("");
    setPronMode(false);setPronSentence("");setPronRecording(false);setPronResult(null);
    setPersonalizedWords([]);setWriteFeedback(null);setWriteSummary("");setWriteLoading(false);setWriteError("");
    setEcData(null);setEcSelected(new Set());setEcRevealed(false);setEcLoading(false);setEcError("");setPassagePeekOpen(false);
    setAutoVocabWords([]);setAutoVocabDismissed(false);
    setStage("home");
    // Land on the level picker, not buried below the streak/daily-challenge sections,
    // so "Play Again"/"Start Reading" actually feel like start-reading buttons.
    setTimeout(function(){
      var el=document.getElementById("rq-level-picker");
      if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"});
      else window.scrollTo(0,0);
    },50);
  }

  function useShield(){
    if(shields<=0||!currentUser)return;
    var yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    var yDate=yesterday.toISOString().slice(0,10);
    if(shieldDates.indexOf(yDate)!==-1)return;
    var newSDs=shieldDates.concat([yDate]);
    var newSh=shields-1;
    setShields(newSh);setShieldDates(newSDs);
    var sKey="rq-streak-data-v1-"+currentUser.name;
    localStorage.setItem(sKey,JSON.stringify({shields:newSh,shieldDates:newSDs,longestStreak:longestStreak}));
  }

  function saveGoalsLocal(g){
    if(!currentUser)return;
    localStorage.setItem("rq-goals-v1-"+currentUser.name,JSON.stringify(g));
    setGoals(g);
  }
  function setGoal(id,target){
    var ng=Object.assign({},goals);
    if(id==="avg_score")ng[id]={target:target,trackGames:[]};
    else if(id==="weekly_games"||id==="weekly_xp")ng[id]={target:target,weekId:getWeekId()};
    else ng[id]={target:target};
    saveGoalsLocal(ng);
  }
  function removeGoal(id){
    var ng=Object.assign({},goals);delete ng[id];saveGoalsLocal(ng);
  }

  function sendTutorMessage(text){
    if(!text||!text.trim())return;
    var userMsg={role:"user",content:text.trim()};
    var newChat=tutorChat.concat([userMsg]);
    setTutorChat(newChat);setTutorInput("");
    var lo=text.toLowerCase();
    var reply;
    if(lo.includes("mean")||lo.includes("definition")||lo.includes("word")||lo.includes("vocabulary")){
      reply="Look at the surrounding sentences to understand what this word means in context. Read before and after it carefully.";
    }else if(lo.includes("answer")||lo.includes("correct")||lo.includes("solution")||lo.includes("wrong")){
      reply="I can't give you the answer! But I can help you think through it. Re-read the passage carefully and find the evidence.";
    }else if(lo.includes("grammar")||lo.includes("tense")||lo.includes("verb")||lo.includes("conjugat")){
      reply="Think about WHEN the action happens — past, present, or future? Look at the verb endings and helping words.";
    }else if(lo.includes("match")||lo.includes("heading")||lo.includes("summarise")||lo.includes("heading")){
      reply="Read each section's main idea first. Ask yourself: 'What is the most important point here?' Then match it to the option.";
    }else if(lo.includes("gap")||lo.includes("fill")||lo.includes("blank")||lo.includes("complete")){
      reply="Read the WHOLE sentence first. What type of word fits — noun, verb, adjective? That helps eliminate wrong choices.";
    }else if(lo.includes("true")||lo.includes("false")||lo.includes("mention")||lo.includes("said")){
      reply="Find where this idea appears in the passage. If it's NOT there at all, the answer is 'Not Mentioned' or 'No'.";
    }else if(lo.includes("main")||lo.includes("idea")||lo.includes("topic")||lo.includes("what is")){
      reply="Read the first and last paragraphs carefully. They usually contain the main idea or key message.";
    }else{
      reply="Good question! Re-read the relevant part of the passage. The answer is always based on what the text says.";
    }
    setTutorChat(newChat.concat([{role:"assistant",content:reply}]));
  }

  function scoreWrittenSummary(text,summary,lvl){
    var minWordsMap={A1:20,A2:25,B1:35,B2:45,C1:55,C2:70};
    var minWordsFallback=minWordsMap[lvl]||30;
    if(!summary||!summary.trim()){
      return{
        scores:{content:0,vocabulary:0,grammar:0,structure:0},
        feedback:{content:"Write a summary first.",vocabulary:"Write a summary first.",grammar:"Write a summary first.",structure:"Try to write at least "+minWordsFallback+" words."},
        strengths:"",
        improvements:"Write a summary of the passage to receive feedback.",
        overall:0
      };
    }
    var passageWords=text.toLowerCase().split(/\W+/).filter(Boolean);
    var summaryWords=summary.toLowerCase().split(/\W+/).filter(Boolean);
    var passageSet=new Set(passageWords);

    var hits=summaryWords.filter(function(w){return passageSet.has(w)&&w.length>3;}).length;
    var contentScore=Math.min(100,Math.round((hits/Math.max(summaryWords.length,1))*200));

    var uniqueRatio=new Set(summaryWords).size/Math.max(summaryWords.length,1);
    var vocabScore=Math.min(100,Math.round(uniqueRatio*150));

    var minWords=minWordsFallback;
    var structureScore=summaryWords.length>=minWords?80:Math.round((summaryWords.length/minWords)*80);

    var grammarScore=(/^[A-Z]/.test(summary)&&/[.!?]$/.test(summary.trim()))?75:55;

    var overall=Math.round((contentScore+vocabScore+structureScore+grammarScore)/4);
    return{
      scores:{content:contentScore,vocabulary:vocabScore,grammar:grammarScore,structure:structureScore},
      feedback:{
        content:contentScore>60?"You covered the main ideas well.":"Try to include more key points from the passage.",
        vocabulary:vocabScore>60?"Good use of varied vocabulary.":"Try to use more words from the text.",
        grammar:grammarScore>60?"Your grammar is clear.":"Check your capitalisation and punctuation.",
        structure:structureScore>60?"Your summary is well-structured.":"Try to write at least "+minWords+" words."
      },
      strengths:overall>65?"Clear and relevant summary with good vocabulary.":"You engaged with the text.",
      improvements:overall>65?"Add more specific details from the passage.":"Re-read the passage and summarise each paragraph.",
      overall:overall
    };
  }

  function startPronCheck(sentence){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setPronResult({error:"Speech recognition is not supported in this browser. Please use Chrome or Edge."});return;}
    if(pronRecording&&pronRecRef.current){pronRecRef.current.stop();return;}
    setPronResult(null);setPronRecording(true);
    var rec=new SR();
    rec.continuous=false;rec.interimResults=false;rec.lang="en-US";
    rec.onresult=function(e){
      var transcript=e.results[0][0].transcript;
      setPronResult(comparePronunciation(sentence,transcript));
      setPronRecording(false);
    };
    rec.onerror=function(e){
      setPronResult({error:"Could not hear you — check mic permissions and try again. ("+e.error+")"});
      setPronRecording(false);
    };
    rec.onend=function(){setPronRecording(false);};
    pronRecRef.current=rec;
    rec.start();
  }

  // ── Reading Slider ──────────────────────────────────────────────────
  // Fetches a single slider micro-card from /api/generate Mode 3.
  // Returns the card or throws; 429 cap-hit sets sliderCapHit and the
  // session ends gracefully. Used both for the initial pre-fetch on
  // entry and for the on-demand top-up as the user swipes through.
  async function fetchSliderCard(sliderLevel){
    // Pass any pool ids we've already seen this session so the server's
    // shared pool (F3c) doesn't serve us a repeat. We read sliderCards
    // via a ref-style snapshot to avoid stale closures inside the
    // parallel Promise.allSettled at session start.
    var seen=[];
    try{seen=(sliderCards||[]).map(function(c){return c&&c.id;}).filter(Boolean);}catch(e){}
    var r=await fetch("/api/generate",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":_sessionToken?("Bearer "+_sessionToken):""},
      body:JSON.stringify({mode:"micro",level:sliderLevel||level||"B1",seen_ids:seen}),
    });
    if(r.status===429){setSliderCapHit(true);throw new Error("CAP_HIT");}
    if(!r.ok){throw new Error("Failed to load card");}
    var d=await r.json();
    if(!d||!d.passage||!d.question)throw new Error("Bad response");
    return d;
  }
  async function startSliderSession(){
    if(sliderLoading)return;
    setSliderLoading(true);setSliderCapHit(false);setSliderError("");setSliderEnded(false);
    setSliderCards([]);setSliderIdx(0);setSliderAnswers({});
    sliderStartRef.current={};
    try{track("slider_session_start",{level:level||"B1"});}catch(e){}
    setStage("slider");
    try{
      // Pre-fetch 3 cards in parallel so the user gets the first card
      // immediately and the next two are ready by the time they swipe.
      var batch=await Promise.allSettled([fetchSliderCard(level),fetchSliderCard(level),fetchSliderCard(level)]);
      var good=batch.filter(function(p){return p.status==="fulfilled";}).map(function(p){return p.value;});
      if(!good.length){
        if(!sliderCapHit)setSliderError("Couldn't load slider cards. Try again later.");
      }
      setSliderCards(good);
      sliderStartRef.current[0]=Date.now();
    }catch(e){
      // Already captured above
    }finally{setSliderLoading(false);}
  }
  // Top up the deck when the user approaches the end. Called from the
  // answer handler so we never block on the network during a swipe.
  async function ensureSliderAhead(idx){
    if(sliderCapHit)return;
    if(sliderCards.length-idx>2)return; // already have ≥3 ahead
    try{
      var card=await fetchSliderCard(level);
      setSliderCards(function(cs){return cs.concat([card]);});
    }catch(e){/* cap-hit or transient — UI already reflects state */}
  }
  function pickSliderAnswer(cardIdx,optionIdx){
    if(sliderAnswers[cardIdx]!==undefined)return; // already answered
    var card=sliderCards[cardIdx];if(!card)return;
    var correct=optionIdx===card.question.answer;
    var elapsed=sliderStartRef.current[cardIdx]?Math.round((Date.now()-sliderStartRef.current[cardIdx])/1000):null;
    setSliderAnswers(function(a){var n=Object.assign({},a);n[cardIdx]=optionIdx;return n;});
    try{track("slider_answer",{idx:cardIdx,correct:correct,elapsed:elapsed,topic:card.topic||"",level:level||"B1"});}catch(e){}
    // Top up the deck in the background and pre-time the next card.
    ensureSliderAhead(cardIdx);
    sliderStartRef.current[cardIdx+1]=Date.now();
  }

  // ── F6 Teacher Portfolio ──────────────────────────────────────────
  // Load the authenticated teacher's existing bio so the editor can
  // pre-populate. Falls back to defaults silently — the API returns 404
  // when private, which we treat as "no bio yet".
  async function loadOwnTeacherBio(){
    if(!currentUser||!_sessionToken)return;
    try{
      var r=await fetch("/api/teacher?action=bio&name="+encodeURIComponent(currentUser.name));
      if(r.ok){
        var d=await r.json();
        setTeacherBio({
          bio:d.bio||"",
          displayName:d.displayName||currentUser.name,
          languages:Array.isArray(d.languages)?d.languages:[],
          subjects:Array.isArray(d.subjects)?d.subjects:[],
          public:true, // GET only succeeds when public
        });
      }
    }catch(e){}
  }
  async function saveTeacherBio(){
    if(!currentUser||!_sessionToken)return;
    setTeacherBioSaving(true);setTeacherBioMsg("");
    try{
      var r=await fetch("/api/teacher?action=bio",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+_sessionToken},
        body:JSON.stringify({
          bio:teacherBio.bio,
          displayName:teacherBio.displayName,
          languages:teacherBio.languages,
          subjects:teacherBio.subjects,
          public:!!teacherBio.public,
        }),
      });
      var d=await r.json();
      if(!r.ok)throw new Error(d.error||"Save failed");
      setTeacherBioMsg(teacherBio.public?t("tch_bio_savedPublic"):t("tch_bio_savedPrivate"));
      try{track("teacher_bio_saved",{public:!!teacherBio.public,languages:teacherBio.languages.length,subjects:teacherBio.subjects.length});}catch(e){}
    }catch(e){
      setTeacherBioMsg("✗ "+(e.message||"Save failed"));
    }finally{setTeacherBioSaving(false);}
  }
  // Public profile loader — runs on entry to teacherProfile stage or
  // when the URL has ?teacher=X on app boot.
  async function loadPublicTeacherProfile(name){
    setViewedTeacher(null);setViewedTeacherErr("");
    try{
      var r=await fetch("/api/teacher?action=bio&name="+encodeURIComponent(name));
      if(r.status===404){setViewedTeacherErr("This teacher's profile is private or doesn't exist.");return;}
      if(!r.ok)throw new Error("Couldn't load profile");
      var d=await r.json();
      setViewedTeacher(d);
    }catch(e){setViewedTeacherErr(e.message||"Couldn't load profile");}
  }
  async function subscribeToTeacher(teacherName){
    if(!currentUser){setSubscribeMsg("Log in to subscribe");return;}
    if(teacherName===currentUser.name){setSubscribeMsg("You can't subscribe to yourself");return;}
    setSubscribeMsg("");
    try{
      var nSocial=Object.assign({},social);
      var entry=Object.assign({},nSocial[currentUser.name]||{friends:[],requests:[],likes:[],challenges:[]});
      entry.subscribed=Array.from(new Set((entry.subscribed||[]).concat([teacherName])));
      nSocial[currentUser.name]=entry;
      // Also reverse-index the subscriber under the teacher
      var tEntry=Object.assign({},nSocial[teacherName]||{});
      tEntry.subscribers=Array.from(new Set((tEntry.subscribers||[]).concat([currentUser.name])));
      nSocial[teacherName]=tEntry;
      setSocial(nSocial);await saveSocial(nSocial);
      setSubscribeMsg("✓ Subscribed");
      try{track("teacher_subscribed",{teacher:teacherName});}catch(e){}
    }catch(e){setSubscribeMsg("✗ "+(e.message||"Couldn't subscribe"));}
  }
  // ── F7 Group Reading Rooms ──────────────────────────────────────
  // History helpers: keep up to 5 most-recent rooms per user, in localStorage.
  // Rooms server-side expire after 24h — we mirror that locally on read so
  // stale entries don't clutter the UI.
  function roomHistoryKey(){
    var who=currentUser?currentUser.name:"anon";
    return "rq-room-history-"+who;
  }
  function loadRoomHistory(){
    try{
      var raw=localStorage.getItem(roomHistoryKey());
      if(!raw)return[];
      var arr=JSON.parse(raw);
      if(!Array.isArray(arr))return[];
      var cutoff=Date.now()-24*60*60*1000;
      return arr.filter(function(e){return e&&e.code&&typeof e.lastSeen==="number"&&e.lastSeen>cutoff;});
    }catch(e){return[];}
  }
  function saveRoomEntry(entry){
    if(!entry||!entry.code)return;
    try{
      var hist=loadRoomHistory().filter(function(e){return e.code!==entry.code;});
      hist.unshift(Object.assign({lastSeen:Date.now()},entry));
      localStorage.setItem(roomHistoryKey(),JSON.stringify(hist.slice(0,5)));
    }catch(e){}
  }
  function removeRoomEntry(code){
    if(!code)return;
    try{
      var hist=loadRoomHistory().filter(function(e){return e.code!==code;});
      localStorage.setItem(roomHistoryKey(),JSON.stringify(hist));
    }catch(e){}
  }
  async function roomCall(body){
    var r=await fetch("/api/room",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":_sessionToken?("Bearer "+_sessionToken):""},
      body:JSON.stringify(body),
    });
    var d=null;try{d=await r.json();}catch(e){}
    return{ok:r.ok,status:r.status,data:d||{}};
  }
  async function createRoom(){
    setRoomLoading(true);setRoomMsg("");
    var displayName=currentUser?currentUser.name:(roomEntryName||"anonymous");
    var isTeacher=currentUser&&localStorage.getItem("rq-role-"+currentUser.name)==="teacher";
    var payload={action:"create",level:level||"B1",topic:roomCreateTopic.trim()||null,ownerName:displayName,ownerType:isTeacher?"teacher":"student"};
    try{
      var res=await roomCall(payload);
      if(!res.ok)throw new Error(res.data.error||"Couldn't create room");
      setRoomState(res.data.room);
      setRoomCode(res.data.room.code);
      setRoomMyName(displayName);
      roomStartRef.current=Date.now();
      saveRoomEntry({code:res.data.room.code,role:"owner",level:res.data.room.level||payload.level,topic:res.data.room.topic||null});
      setStage("room");
      try{track("room_created",{ownerType:payload.ownerType,level:payload.level});}catch(e){}
    }catch(e){setRoomMsg(e.message||"Couldn't create room");}
    finally{setRoomLoading(false);}
  }
  async function joinRoom(code,name){
    setRoomLoading(true);setRoomMsg("");
    var safe=(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
    var displayName=currentUser?currentUser.name:((name||"").trim()||"guest"+Math.floor(Math.random()*1000));
    try{
      var res=await roomCall({action:"join",code:safe,name:displayName});
      if(!res.ok){
        if(res.status===410)removeRoomEntry(safe);
        throw new Error(res.data.error||"Couldn't join room");
      }
      setRoomState(res.data.room);
      setRoomCode(res.data.room.code);
      setRoomMyName(displayName);
      roomStartRef.current=Date.now();
      saveRoomEntry({code:res.data.room.code,role:"participant",level:res.data.room.level||"B1",topic:res.data.room.topic||null});
      setStage("room");
      try{track("room_joined",{code:safe});}catch(e){}
    }catch(e){setRoomMsg(e.message||"Couldn't join room");}
    finally{setRoomLoading(false);}
  }
  async function submitRoomAnswer(optionIdx){
    if(!roomCode||!roomMyName||!roomState)return;
    var elapsed=Date.now()-(roomStartRef.current||Date.now());
    try{
      var res=await roomCall({action:"answer",code:roomCode,name:roomMyName,optionIdx:optionIdx,elapsedMs:elapsed});
      if(res.ok||res.status===409){
        // 409 just means we already answered — server still returns the room state
        if(res.data.room)setRoomState(res.data.room);
        try{track("room_answered",{code:roomCode,correct:res.data.room&&res.data.room.participants&&res.data.room.participants[roomMyName]&&res.data.room.participants[roomMyName].correct});}catch(e){}
      }
    }catch(e){}
  }
  async function pollRoom(){
    if(!roomCode)return;
    try{
      var r=await fetch("/api/room?code="+encodeURIComponent(roomCode));
      if(r.status===410){
        // Room expired — drop it from history so it doesn't show as
        // "rejoinable" on the entry screen, then bounce back.
        removeRoomEntry(roomCode);
        setRoomState(null);setRoomCode("");setRoomMsg("This room has expired.");setStage("roomEntry");return;
      }
      if(!r.ok)return;
      var d=await r.json();
      if(d.room)setRoomState(d.room);
    }catch(e){}
  }
  // Poll the room every 2s while we're in the room stage. Stops on
  // exit or when the room expires.
  useEffect(function(){
    if(stage!=="room"||!roomCode){
      if(roomPollRef.current){clearInterval(roomPollRef.current);roomPollRef.current=null;}
      return;
    }
    if(roomPollRef.current)clearInterval(roomPollRef.current);
    roomPollRef.current=setInterval(pollRoom,2000);
    return function(){if(roomPollRef.current){clearInterval(roomPollRef.current);roomPollRef.current=null;}};
  },[stage,roomCode]);

  // Debounced search. Runs on every keystroke after a 250ms pause so we
  // don't hammer the endpoint character-by-character.
  var teacherSearchTimerRef=useRef(null);
  async function runTeacherSearch(q){
    setTeacherSearchLoading(true);
    try{
      var r=await fetch("/api/teacher?action=search&q="+encodeURIComponent(q||""));
      if(!r.ok)throw new Error("Search failed");
      var d=await r.json();
      setTeacherSearchResults(Array.isArray(d.results)?d.results:[]);
      setTeacherSearchTotal(d.total||0);
    }catch(e){setTeacherSearchResults([]);setTeacherSearchTotal(0);}
    finally{setTeacherSearchLoading(false);}
  }
  function onTeacherSearchInput(q){
    setTeacherSearchQuery(q);
    if(teacherSearchTimerRef.current)clearTimeout(teacherSearchTimerRef.current);
    teacherSearchTimerRef.current=setTimeout(function(){runTeacherSearch(q);},250);
  }

  function unsubscribeFromTeacher(teacherName){
    if(!currentUser)return;
    var nSocial=Object.assign({},social);
    var entry=Object.assign({},nSocial[currentUser.name]||{});
    entry.subscribed=(entry.subscribed||[]).filter(function(n){return n!==teacherName;});
    nSocial[currentUser.name]=entry;
    var tEntry=Object.assign({},nSocial[teacherName]||{});
    tEntry.subscribers=(tEntry.subscribers||[]).filter(function(n){return n!==currentUser.name;});
    nSocial[teacherName]=tEntry;
    setSocial(nSocial);saveSocial(nSocial);
    setSubscribeMsg("Unsubscribed");
  }

  function startDailyChallenge(){
    var today=todayKey();
    var dc=dailyChallenge;
    if(dc&&dc.date===today){
      var mq2=null;for(var j2=0;j2<dc.questions.length;j2++){if(dc.questions[j2].type==="matching"){mq2=dc.questions[j2];break;}}
      setLevel(dc.level||"B1");setPassage(dc.passage);setTopic(dc.topic);setQuestions(dc.questions);
      setShuffledRights(mq2&&mq2.rights?shuffleArr(mq2.rights.map(function(v,i){return{idx:i,val:v};})):[]);
      setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
      setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;setSavedWords(new Set());setHlMode(false);setHlWords(new Set());
      setIsDailyGame(true);setStage("reading");return;
    }
    setError("");
    var seed=0;for(var dci=0;dci<today.length;dci++){seed=seed*31+today.charCodeAt(dci);}
    seed=Math.abs(seed);
    var dStory=STORY_LIBRARY[seed%STORY_LIBRARY.length];
    var newDc={date:today,level:dStory.level,passage:dStory.passage,topic:dStory.title,questions:dStory.questions,storyId:dStory.id};
    saveDaily(newDc);setDailyChallenge(newDc);
    var mq3=null;for(var j3=0;j3<dStory.questions.length;j3++){if(dStory.questions[j3].type==="matching"){mq3=dStory.questions[j3];break;}}
    setLevel(dStory.level);setPassage(dStory.passage);setTopic(dStory.title);setQuestions(dStory.questions);
    setShuffledRights(mq3&&mq3.rights?shuffleArr(mq3.rights.map(function(v,i){return{idx:i,val:v};})):[]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;setSavedWords(new Set());setHlMode(false);setHlWords(new Set());
    setCurrentStoryId(dStory.id);setIsDailyGame(true);setStage("reading");
  }

  // ── style helpers ─────────────────────────────────────────
  var _accent=appTheme?appTheme.accent:"#5af0b3";
  var _secondary=appTheme?appTheme.secondary:"#a78bfa";
  var BG="linear-gradient(160deg,#0d0d1a 0%,#12121f 55%,#0d0d1a 100%)";
  var CARD={background:"rgba(30,30,44,0.45)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:20,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",boxShadow:"0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05)"};
  var GHOST={background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.10)",color:"rgba(227,224,244,0.75)",borderRadius:12,padding:"8px 16px",fontFamily:"inherit",fontSize:13,cursor:"pointer",fontWeight:700,transition:"all 0.15s ease"};
  var INP={width:"100%",background:"rgba(13,13,26,0.7)",border:"1px solid rgba(255,255,255,0.10)",borderRadius:12,color:"#e3e0f4",fontSize:14,padding:"12px 16px",outline:"none",fontFamily:"inherit",boxSizing:"border-box",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.3)",transition:"border-color 0.2s,box-shadow 0.2s"};
  function mkBtn(bg,fg,size){var pad=size==="sm"?"7px 14px":size==="lg"?"15px 28px":"13px 22px";var fs=size==="sm"?12:size==="lg"?17:15;var glow=bg&&bg.startsWith("#")?bg+"40":"var(--rq-accent-glow)";return{background:bg,color:fg||"#003825",border:"none",borderRadius:12,padding:pad,fontWeight:700,fontSize:fs,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 0 0 rgba(0,0,0,0.4),0 6px 18px "+glow,transition:"all 0.15s ease,box-shadow 0.15s ease,filter 0.15s ease"};}
  function pill(bg,col){return{background:bg,color:col||"#fff",borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700};}
  function ErrorBanner(props){var msg=props.message||props.children;if(!msg)return null;return(<div style={{...CARD,background:"rgba(239,68,68,0.08)",borderColor:"rgba(239,68,68,0.3)",padding:14,display:"flex",alignItems:"flex-start",gap:10,marginBottom:props.marginBottom||12}}>
    <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
    <p style={{fontSize:13,color:"#fecaca",margin:0,lineHeight:1.5}}>{msg}</p>
  </div>);}
  function Skeleton(props){return(<div className="rq-skeleton" style={{height:props.h||14,width:props.w||"100%",borderRadius:props.r||8,marginBottom:props.mb||0}}/>);}
  function ThemeTile(props){var t=props.t,active=props.active,onClick=props.onClick;return(<button onClick={onClick} style={{background:"rgba(255,255,255,0.04)",border:"2px solid "+(active?t.accent:"rgba(255,255,255,0.1)"),borderRadius:12,padding:"10px 8px",cursor:"pointer",textAlign:"center",boxShadow:active?"0 0 16px "+t.accent+"55":"none",transition:"all 0.15s ease",flex:1}}><div style={{width:36,height:36,borderRadius:"50%",margin:"0 auto 6px",background:"linear-gradient(135deg,"+t.accent+" 50%,"+t.secondary+" 50%)"}}></div><div style={{fontSize:11,fontWeight:700,color:active?t.accent:"#9ca3af"}}>{t.emoji} {t.name}</div></button>);}
  function hex2rgb(h){var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return r+","+g+","+b;}
  function applyTheme(t){setAppTheme(t);localStorage.setItem("rq-theme",JSON.stringify(t));}
  function resetTheme(){setAppTheme(null);localStorage.removeItem("rq-theme");}

  // ── sound & music helpers ─────────────────────────────────
  function getACtx(){
    if(!audioCtxRef.current){audioCtxRef.current=new(window.AudioContext||window.webkitAudioContext)();}
    if(audioCtxRef.current.state==="suspended"){audioCtxRef.current.resume();}
    return audioCtxRef.current;
  }
  function playSfx(type){
    if(!sfxOn)return;
    try{
      var ctx=getACtx(),now=ctx.currentTime;
      if(type==="correct"){
        [[523.25,0],[659.25,0.08],[783.99,0.16]].forEach(function(p){
          var o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
          o.type="sine";o.frequency.value=p[0];
          var t=now+p[1];g.gain.setValueAtTime(0.28,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
          o.start(t);o.stop(t+0.35);
        });
      } else if(type==="wrong"){
        var o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
        o.type="sawtooth";o.frequency.setValueAtTime(280,now);o.frequency.exponentialRampToValueAtTime(140,now+0.28);
        g.gain.setValueAtTime(0.18,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.28);
        o.start(now);o.stop(now+0.28);
      } else if(type==="xp"){
        var o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
        o.type="sine";o.frequency.setValueAtTime(880,now);o.frequency.exponentialRampToValueAtTime(1760,now+0.14);
        g.gain.setValueAtTime(0.22,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.22);
        o.start(now);o.stop(now+0.22);
      } else if(type==="complete"){
        [[523.25,0],[659.25,0.13],[783.99,0.26],[1046.5,0.4]].forEach(function(p){
          var o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
          o.type="triangle";o.frequency.value=p[0];
          var t=now+p[1];g.gain.setValueAtTime(0.28,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.45);
          o.start(t);o.stop(t+0.45);
        });
      }
    }catch(e){}
  }
  // Curated royalty-free / public-domain tracks hosted by Internet Archive
  // (CORS-enabled, stable URLs). Player picks one at random per session,
  // auto-advances when finished, falls back to synthesised audio if every
  // URL in a genre fails to load.
  var MUSIC_TRACKS={
    classical:[
      "https://archive.org/download/100ClassicalMusicMasterpieces/1685%20Purcell%20%2C%20Trumpet%20Tune%20and%20Air.mp3",
      "https://archive.org/download/100ClassicalMusicMasterpieces/1698%20Pachelbel%20%2C%20Canon%20in%20D.mp3",
      "https://archive.org/download/100ClassicalMusicMasterpieces/1709%20Bach%20%2C%20Toccata%20in%20D%20minor.mp3"
    ],
    lofi:[
      "https://archive.org/download/loffaiii/Atlas%20-%20e%5Bu%5D.logy%20%28prod.%20Purpan%29.mp3",
      "https://archive.org/download/loffaiii/jinsang%20-%20affection..mp3",
      "https://archive.org/download/loffaiii/jinsang%20-%20egyptian%20pools.mp3"
    ],
    jazz:[
      "https://archive.org/download/Free_20s_Jazz_Collection/Bennie_Moten_Kater_St._Rag.mp3",
      "https://archive.org/download/Free_20s_Jazz_Collection/Raderman_Jazz_Orch-Dardanella.mp3"
    ],
    nature:[
      "https://archive.org/download/relaxingrainsounds/Rain%20Sounds.mp3",
      "https://archive.org/download/relaxingrainsounds/Tropical%20Rain.mp3"
    ]
  };

  function startMusic(genre){
    if(musicStopRef.current){musicStopRef.current();musicStopRef.current=null;}
    var tracks=MUSIC_TRACKS[genre];
    if(tracks&&tracks.length>0){
      var stopped=false;
      var idx=Math.floor(Math.random()*tracks.length);
      var failCount=0;
      var audio=null;
      var playNext=function(){
        if(stopped)return;
        if(failCount>=tracks.length){
          // Every URL failed (offline / archive.org down) — fall back to synth.
          startMusicSynth(genre);
          return;
        }
        audio=new Audio(tracks[idx]);
        audio.volume=0.22;
        audio.crossOrigin="anonymous";
        audio.preload="auto";
        audio.onended=function(){failCount=0;idx=(idx+1)%tracks.length;playNext();};
        audio.onerror=function(){failCount++;idx=(idx+1)%tracks.length;playNext();};
        var p=audio.play();
        if(p&&p.catch)p.catch(function(){/* autoplay blocked — wait for user gesture */});
      };
      musicStopRef.current=function(){
        stopped=true;
        if(audio){try{audio.pause();audio.src="";}catch(e){}}
      };
      playNext();
      return;
    }
    startMusicSynth(genre);
  }

  // Fallback synth (original implementation). Used only when no playlist exists
  // for the genre or every remote URL fails to load.
  function startMusicSynth(genre){
    try{
      var ctx=getACtx();
      var SCALES={
        classical:[[261.63,329.63,392,523.25],[0.5,1,1.5,2,2.5,3]],
        lofi:[[220,277.18,329.63,440],[0.75,1.5,2.25,3,3.75]],
        jazz:[[293.66,369.99,440,587.33],[0.4,0.8,1.4,2.0,0.6]],
        nature:null
      };
      var stopped=false;
      if(genre==="nature"){
        var bufSize=ctx.sampleRate*2;
        var buf=ctx.createBuffer(1,bufSize,ctx.sampleRate);
        var data=buf.getChannelData(0);
        for(var i=0;i<bufSize;i++)data[i]=(Math.random()*2-1)*0.06;
        var src=ctx.createBufferSource();src.buffer=buf;src.loop=true;
        var flt=ctx.createBiquadFilter();flt.type="lowpass";flt.frequency.value=600;
        var g=ctx.createGain();g.gain.value=0.25;
        src.connect(flt);flt.connect(g);g.connect(ctx.destination);
        src.start();
        musicStopRef.current=function(){stopped=true;try{src.stop();}catch(e){}};
      } else {
        var sc=SCALES[genre]||SCALES.classical;
        var notes=sc[0],beats=sc[1];
        var noteIdx=0,beatIdx=0;
        var masterGain=ctx.createGain();masterGain.gain.value=0.18;masterGain.connect(ctx.destination);
        var playNext=function(){
          if(stopped)return;
          var o=ctx.createOscillator(),ng=ctx.createGain();
          o.connect(ng);ng.connect(masterGain);
          o.type=genre==="jazz"?"triangle":"sine";
          o.frequency.value=notes[noteIdx%notes.length];
          ng.gain.setValueAtTime(0.001,ctx.currentTime);
          ng.gain.linearRampToValueAtTime(0.7,ctx.currentTime+0.05);
          ng.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.6);
          o.start(ctx.currentTime);o.stop(ctx.currentTime+0.65);
          noteIdx++;beatIdx++;
          var delay=Math.max(200,beats[beatIdx%beats.length]*1000);
          if(!stopped)setTimeout(playNext,delay);
        };
        playNext();
        musicStopRef.current=function(){stopped=true;try{masterGain.disconnect();}catch(e){}};
      }
    }catch(e){}
  }
  function stopMusic(){if(musicStopRef.current){musicStopRef.current();musicStopRef.current=null;}}

  // ── social share ──────────────────────────────────────────
  function doShare(){
    var lvKey=result.level||level;
    var inviteUrl="https://student-reading-tool.vercel.app/welcome";
    var shareText=(t("shareResultText")||"I just scored {pct}% on a {level} Reading Quest quiz! Try it free:").replace("{pct}",result.pct).replace("{level}",lvKey);
    var shareBody=shareText+" "+inviteUrl;
    try{track("share_attempt",{pct:result.pct,level:lvKey,hasNativeShare:!!navigator.share});}catch(e){}
    try{
      var canvas=document.createElement("canvas");
      canvas.width=800;canvas.height=420;
      var c=canvas.getContext("2d");
      // bg gradient
      var grd=c.createLinearGradient(0,0,800,420);grd.addColorStop(0,"#0d0d1a");grd.addColorStop(1,"#111827");
      c.fillStyle=grd;c.fillRect(0,0,800,420);
      // accent stripe
      var lv=getLv(lvKey);
      c.fillStyle=lv?lv.color:"#5af0b3";c.fillRect(0,0,6,420);
      // app name
      c.font="700 15px 'Trebuchet MS',sans-serif";c.fillStyle="rgba(255,255,255,0.4)";
      c.fillText("READING QUEST",30,40);
      // level badge
      c.font="900 13px 'Trebuchet MS',sans-serif";c.fillStyle=lv?lv.color:"#5af0b3";
      c.fillText(lvKey+" QUEST",30,68);
      // big score
      c.font="900 110px 'Trebuchet MS',sans-serif";
      c.fillStyle=result.pct>=80?"#5af0b3":result.pct>=60?"#fbbf24":"#f87171";
      c.fillText(result.pct+"%",30,190);
      // sub stats
      c.font="700 20px 'Trebuchet MS',sans-serif";c.fillStyle="rgba(255,255,255,0.7)";
      var correctCount=result.answers?result.answers.filter(Boolean).length:result.score;
      var totalCount=result.answers?result.answers.length:result.maxScore;
      c.fillText(result.xp+" XP earned",30,230);
      c.fillText(correctCount+" / "+totalCount+" correct",30,258);
      // title
      if(topic){
        c.font="400 16px 'Trebuchet MS',sans-serif";c.fillStyle="rgba(255,255,255,0.4)";
        c.fillText(topic.substring(0,60),30,295);
      }
      // user
      if(currentUser){
        c.font="700 18px 'Trebuchet MS',sans-serif";c.fillStyle="rgba(255,255,255,0.55)";
        c.fillText("@"+currentUser.name,30,360);
      }
      // invite link
      c.font="700 15px 'Trebuchet MS',sans-serif";c.fillStyle="#5af0b3";
      c.fillText("Try it: student-reading-tool.vercel.app",30,395);
      // verdict
      var verdict=result.pct>=80?"Excellent!":result.pct>=60?"Good job!":"Keep going!";
      c.font="900 52px 'Trebuchet MS',sans-serif";c.fillStyle="rgba(255,255,255,0.08)";
      c.textAlign="right";c.fillText(verdict,780,190);c.textAlign="left";
      function fallbackCopy(){
        try{
          navigator.clipboard.writeText(shareBody).then(function(){
            setShareToast(t("shareCopied")||"Copied to clipboard!");
            try{track("share_copied",{pct:result.pct,level:lvKey});}catch(e){}
            setTimeout(function(){setShareToast("");},2200);
          }).catch(function(){
            // very old browsers: trigger PNG download
            canvas.toBlob(function(b){var u=URL.createObjectURL(b);var a=document.createElement("a");a.href=u;a.download="reading-quest-result.png";a.click();setTimeout(function(){URL.revokeObjectURL(u);},2000);});
          });
        }catch(e){}
      }
      // share with image if supported, else text-only share, else clipboard
      canvas.toBlob(function(blob){
        var file=null;try{file=new File([blob],"reading-quest-result.png",{type:"image/png"});}catch(e){}
        var canShareFile=file&&navigator.canShare&&navigator.canShare({files:[file]});
        if(navigator.share&&canShareFile){
          navigator.share({title:"Reading Quest",text:shareBody,url:inviteUrl,files:[file]}).then(function(){try{track("share_native_image",{pct:result.pct});}catch(e){}}).catch(function(){fallbackCopy();});
        } else if(navigator.share){
          navigator.share({title:"Reading Quest",text:shareBody,url:inviteUrl}).then(function(){try{track("share_native_text",{pct:result.pct});}catch(e){}}).catch(function(){fallbackCopy();});
        } else {
          fallbackCopy();
        }
      },"image/png");
    }catch(e){console.error("share failed",e);}
  }

  function selectRandomTheme(){
    var randomIndex=Math.floor(Math.random()*PRESET_THEMES.length);
    applyTheme(PRESET_THEMES[randomIndex]);
  }

  // ── Feature 5: Vocab Export ───────────────────────────────────
  function doExportVocab(format){
    if(!vocab||!vocab.length)return;
    var rows,filename,mime;
    if(format==="anki"){
      rows=vocab.map(function(w){
        var front=w.word+(w.level?" ["+w.level+"]":"");
        var back=(w.def||"")+(w.example?"\n"+w.example:"");
        return front+"\t"+back;
      });
      filename="vocab-anki.txt";mime="text/plain";
    } else {
      rows=["word,definition,example,level,date,status"];
      vocab.forEach(function(w){
        rows.push(['"'+(w.word||"")+'"','"'+(w.def||"").replace(/"/g,"'")+'"','"'+(w.example||"").replace(/"/g,"'")+'"',w.level||"",w.date||"",w.status||"learning"].join(","));
      });
      filename="vocab-export.csv";mime="text/csv";
    }
    var blob=new Blob([rows.join("\n")],{type:mime});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");a.href=url;a.download=filename;a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},2000);
  }

  // ── Feature 2: Placement Test ─────────────────────────────────
  function calcPlacementLevel(answers){
    var score=0;
    PLACEMENT_QUESTIONS.forEach(function(q,i){
      if(Number(answers[i])===q.answer)score++;
    });
    if(score<=2)return"A1";
    if(score<=4)return"A2";
    if(score<=6)return"B1";
    if(score<=8)return"B2";
    return"C1";
  }
  function finishPlacement(){
    if(Object.keys(placementAnswers).length<PLACEMENT_QUESTIONS.length){
      alert("Please answer all "+PLACEMENT_QUESTIONS.length+" questions");
      return;
    }
    var recommended=calcPlacementLevel(placementAnswers);
    setPlacementResult(recommended);
    try{localStorage.setItem("rq-placement-done-"+(currentUser?currentUser.name:""),Date.now().toString());}catch(e){}
  }
  function dismissPlacement(){
    setShowPlacement(false);setPlacementAnswers({});setPlacementResult(null);
    try{localStorage.setItem("rq-placement-done-"+(currentUser?currentUser.name:""),Date.now().toString());}catch(e){}
  }

  // ── Feature 3: Sentence Saver ─────────────────────────────────
  function saveSentenceQuote(sentence){
    var entry={text:sentence.trim(),topic:topic||"",level:level||"",date:todayKey(),storyId:currentStoryId||null};
    var updated=[entry].concat(quotes).slice(0,100);
    setQuotes(updated);saveQuotesLocal(updated);setQuotesSaved(true);
    setTimeout(function(){setQuotesSaved(false);},1500);
  }
  function deleteQuote(idx){
    var updated=quotes.filter(function(_,i){return i!==idx;});
    setQuotes(updated);saveQuotesLocal(updated);
  }

  // ── Feature 4: Notifications ──────────────────────────────────
  async function requestNotifPermission(){
    if(typeof Notification==="undefined")return;
    var perm=await Notification.requestPermission();
    setNotifPermission(perm);
  }
  function sendTestNotification(){
    if(typeof Notification==="undefined"||Notification.permission!=="granted")return;
    new Notification("Reading Quest 📖",{body:"Keep your streak alive — read something today!",icon:"/favicon.svg"});
  }
  // F4 — Web Push subscription helpers.
  // urlBase64ToUint8Array converts the VAPID public key (URL-safe base64)
  // into the Uint8Array the browser's PushManager expects.
  function urlBase64ToUint8Array(b64){
    var padding="=".repeat((4-b64.length%4)%4);
    var s=(b64+padding).replace(/-/g,"+").replace(/_/g,"/");
    var raw=atob(s);
    var out=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    return out;
  }
  async function loadPushSubscription(){
    if(!currentUser||!_sessionToken)return;
    try{
      var r=await fetch("/api/push?action=subscribe",{headers:{Authorization:"Bearer "+_sessionToken}});
      if(r.ok){var d=await r.json();setPushSubscribed(true);setPushExamDate(d.examDate||"");}
      else{setPushSubscribed(false);}
    }catch(e){setPushSubscribed(false);}
  }
  async function enablePushReminders(){
    if(pushBusy)return;
    setPushBusy(true);setPushMsg("");
    try{
      if(!("serviceWorker" in navigator)||!("PushManager" in window))throw new Error("Push not supported on this device.");
      var perm=await Notification.requestPermission();
      setNotifPermission(perm);
      if(perm!=="granted")throw new Error("Notifications blocked in your browser.");
      var cfg=await fetch("/api/push?action=config").then(function(r){return r.ok?r.json():Promise.reject(new Error("Config unavailable"));});
      if(!cfg.publicKey)throw new Error("Server missing VAPID key.");
      var reg=await navigator.serviceWorker.ready;
      var sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(cfg.publicKey)});
      var subJson=sub.toJSON();
      var r=await fetch("/api/push?action=subscribe",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+_sessionToken},
        body:JSON.stringify({subscription:subJson,examDate:pushExamDate||null,locale:uiLang||"en"}),
      });
      if(!r.ok){var ed=await r.json().catch(function(){return{};});throw new Error(ed.error||"Couldn't save subscription.");}
      setPushSubscribed(true);
      setPushMsg("✓ "+t("push_msg_enabled"));
      try{track("push_enabled",{examDate:pushExamDate||""});}catch(e){}
    }catch(e){setPushMsg("✗ "+(e.message||"Couldn't enable push."));}
    finally{setPushBusy(false);}
  }
  async function disablePushReminders(){
    if(pushBusy)return;
    setPushBusy(true);setPushMsg("");
    try{
      if("serviceWorker" in navigator){
        try{var reg=await navigator.serviceWorker.ready;var sub=await reg.pushManager.getSubscription();if(sub)await sub.unsubscribe();}catch(e){}
      }
      await fetch("/api/push?action=subscribe",{method:"DELETE",headers:{Authorization:"Bearer "+_sessionToken}});
      setPushSubscribed(false);
      setPushMsg("✓ "+t("push_msg_disabled"));
      try{track("push_disabled");}catch(e){}
    }catch(e){setPushMsg("✗ "+(e.message||"Couldn't disable push."));}
    finally{setPushBusy(false);}
  }
  async function saveExamDate(){
    if(!pushSubscribed||pushBusy)return;
    setPushBusy(true);setPushMsg("");
    try{
      if("serviceWorker" in navigator){
        var reg=await navigator.serviceWorker.ready;
        var sub=await reg.pushManager.getSubscription();
        if(!sub)throw new Error("Subscription missing — re-enable push.");
        var r=await fetch("/api/push?action=subscribe",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+_sessionToken},
          body:JSON.stringify({subscription:sub.toJSON(),examDate:pushExamDate||null,locale:uiLang||"en"}),
        });
        if(!r.ok){var ed=await r.json().catch(function(){return{};});throw new Error(ed.error||"Couldn't update exam date.");}
        setPushMsg("✓ "+t("push_msg_saved"));
        try{track("push_exam_date_saved",{examDate:pushExamDate||""});}catch(e){}
      }
    }catch(e){setPushMsg("✗ "+(e.message||"Couldn't save."));}
    finally{setPushBusy(false);}
  }

  // ── Feature 1: Auto Vocab ─────────────────────────────────────
  function extractAutoVocab(text){
    if(!text)return[];
    var words=text.split(/\s+/);
    var seen=new Set();
    var result=[];
    for(var i=0;i<words.length;i++){
      var clean=words[i].replace(/[^a-zA-Z'-]/g,"").toLowerCase();
      if(!clean||clean.length<4)continue;
      if(COMMON_WORDS.has(clean))continue;
      if(seen.has(clean))continue;
      if(vocab.some(function(v){return v.word.toLowerCase()===clean;}))continue;
      seen.add(clean);
      result.push(clean);
      if(result.length>=8)break;
    }
    return result;
  }

  // ── Feature 7: Custom Text Quiz ───────────────────────────────
  async function doCustomTextQuiz(){
    if(!customText.trim()||customText.trim().length<150){setCustomTextError(t("stu_errCustomTextTooShort"));return;}
    if(!level){setCustomTextError(t("stu_errCustomTextLevel"));return;}
    setCustomTextError("");setCustomTextLoading(true);
    try{
      var r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"quiz_from_text",passage:customText.trim(),level:level,types:selectedTypes.slice(0,3)})});
      var d=await r.json();
      if(!r.ok||d.error)throw new Error(d.error||"Failed to generate quiz");
      // Reset every run-scoped piece of state so we don't inherit anything
      // from a previous quiz, then route through the reading screen so the
      // student gets to read before the quiz timer starts.
      setPassage(customText.trim());setTopic(d.topic||"Custom Passage");
      setQuestions(d.questions||[]);setCurrentStoryId(null);
      var mq=null;var qs=d.questions||[];for(var i=0;i<qs.length;i++){if(qs[i].type==="matching"){mq=qs[i];break;}}
      setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights.map(function(v,i){return{idx:i,val:v};})):[]);
      setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
      setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);
      setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;setResult(null);
      setIsDailyGame(false);setActiveSentence(null);setTranslation(null);setHeatmapOn(false);
      setPersonalizedWords([]);setAutoVocabWords([]);setAutoVocabDismissed(false);
      setSavedWords(new Set());setHlMode(false);setHlWords(new Set());
      setSelectedWord(null);setWordDef(null);
      setPronMode(false);setPronSentence("");setPronResult(null);setPronRecording(false);
      setActiveAssignmentId(null);setChallengeMode(false);setFocusMode(false);
      setCustomTextOpen(false);setCustomText("");setCustomTextLoading(false);
      setStage("reading");
    }catch(e){
      setCustomTextError(e.message||"Failed — try again.");setCustomTextLoading(false);
    }
  }

  // Show Sean Ellis PMF prompt after 5th completed quiz, once per user.
  // MUST be declared before any early return — Rules of Hooks.
  useEffect(function(){
    if(!currentUser||stage!=="result")return;
    var gc=(currentUser.games||[]).length;
    if(gc<5)return;
    try{if(localStorage.getItem("rq-se-"+currentUser.name))return;}catch(e){return;}
    setSeModal(true);
  },[stage,currentUser]);

  if(!appReady)return<div style={{minHeight:"100vh",background:"#0d0d1a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",padding:20}}><div style={{width:"100%",maxWidth:300}}><div className="rq-skeleton" style={{width:48,height:48,borderRadius:"50%",margin:"0 auto 20px"}}/><Skeleton h={16} mb={8}/><Skeleton h={14} mb={6}/><Skeleton h={14} w="70%"/></div></div>;

  // ── current user's social data ─────────────────────────────
  var myData=currentUser?getSocial(social,currentUser.name):{friends:[],requests:[],likes:0,challenges:[]};
  myData=myData||{friends:[],requests:[],likes:0,challenges:[]};
  myData.friends=myData.friends||[];
  myData.requests=myData.requests||[];
  var myStreak=currentUser?calcStreakWithShields(currentUser.games,shieldDates):0;
  var myBestLevel=currentUser?getBestLevel(currentUser.games):"none";
  var pendingChallenges=(myData.challenges||[]).filter(function(c){return c.status==="pending"&&(!c.expiresAt||c.expiresAt>Date.now());});
  // at-risk: pure streak is 0 but last activity was exactly 2 days ago → shield can cover yesterday
  var streakAtRisk=(function(){
    if(!currentUser||shields<=0)return false;
    var pureS=calcStreak(currentUser.games);
    if(pureS>0)return false; // still active without shield
    var allDts=(currentUser.games||[]).map(function(g){return g.date;}).concat(shieldDates);
    allDts=allDts.filter(function(d,i,a){return a.indexOf(d)===i;});
    if(!allDts.length)return false;
    allDts.sort(function(a,b){return new Date(b)-new Date(a);});
    var last=new Date(allDts[0]);last.setHours(0,0,0,0);
    var tod=new Date();tod.setHours(0,0,0,0);
    return Math.round((tod-last)/(864e5))===2;
  })();
  var todayStr=todayKey();
  var playedToday=currentUser?(currentUser.games||[]).some(function(g){return g.date===todayStr;}):false;
  // F5 — derive the friend-nudge for today. Banner appears only when this
  // is non-null AND nudgeDismissedToday is false.
  var friendNudge=(function(){
    if(!currentUser||nudgeDismissedToday)return null;
    var weeklyMap={};
    (weeklyLb||[]).forEach(function(e){if(e&&e.name)weeklyMap[e.name]=Number(e.xp)||0;});
    var rows=(myData.friends||[]).map(function(fn){
      var u=(allUsers||[]).find(function(x){return x&&x.name===fn;})||{};
      return{name:fn,weeklyXp:weeklyMap[fn]||0,streak:calcStreak(u.games||[])};
    });
    return pickFriendNudge({
      currentUserName:currentUser.name,
      friends:rows,
      myWeeklyXp:weeklyMap[currentUser.name]||0,
      playedToday:playedToday,
    });
  })();
  var weekDots=(function(){var dots=[];for(var di=6;di>=0;di--){var d=new Date();d.setDate(d.getDate()-di);d.setHours(0,0,0,0);var ds=d.toISOString().slice(0,10);var dn=["S","M","T","W","T","F","S"][d.getDay()];dots.push({played:currentUser?(currentUser.games||[]).some(function(g){return g.date===ds;}):false,day:dn,today:di===0});}return dots;})();
  var STREAK_MILESTONES={3:"Three days in a row! Keep going 💪",7:"One whole week! You're building a real habit 🔥",14:"Two weeks strong! Incredible consistency 🏆",30:"30-day legend! You're unstoppable 🌟"};
  var milestoneToShow=currentUser&&[3,7,14,30].indexOf(myStreak)!==-1&&!milestoneSeen&&!localStorage.getItem("rq-ms-"+currentUser.name+"-"+myStreak)?STREAK_MILESTONES[myStreak]:null;

  function answerSeanEllis(answer){
    if(!currentUser)return;
    try{localStorage.setItem("rq-se-"+currentUser.name,answer);}catch(e){}
    track("sean_ellis_response",{answer:answer,gameCount:(currentUser.games||[]).length});
    setSeModal(false);
  }

  return(
    <>
    {seModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20,backdropFilter:"blur(4px)"}}>
        <div style={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,padding:24,maxWidth:440,width:"100%",color:"#fff",fontFamily:"system-ui,-apple-system,sans-serif",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
          <div style={{fontSize:24,marginBottom:8}}>💬 Quick question</div>
          <div style={{fontSize:16,lineHeight:1.5,marginBottom:20,opacity:0.9}}>How would you feel if you could no longer use <b>Student Reading Quest</b>?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={function(){answerSeanEllis("very_disappointed");}} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",color:"#fca5a5",padding:"12px 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>Very disappointed</button>
            <button onClick={function(){answerSeanEllis("somewhat_disappointed");}} style={{background:"rgba(234,179,8,0.15)",border:"1px solid rgba(234,179,8,0.4)",color:"#fde68a",padding:"12px 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>Somewhat disappointed</button>
            <button onClick={function(){answerSeanEllis("not_disappointed");}} style={{background:"rgba(148,163,184,0.15)",border:"1px solid rgba(148,163,184,0.4)",color:"#cbd5e1",padding:"12px 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>Not disappointed</button>
            <button onClick={function(){answerSeanEllis("dismissed");}} style={{background:"transparent",border:"none",color:"#9ca3af",padding:"8px 14px",fontSize:12,cursor:"pointer",marginTop:6,fontFamily:"inherit"}}>Skip</button>
          </div>
          <div style={{fontSize:11,opacity:0.5,marginTop:14,textAlign:"center"}}>Helps me make this better for you. Takes 1 second.</div>
        </div>
      </div>
    )}
    <style>{`
      :root{
        --rq-accent:${_accent};
        --rq-secondary:${_secondary};
        --rq-accent-rgb:${hex2rgb(_accent)};
        --rq-secondary-rgb:${hex2rgb(_secondary)};
        --rq-accent-border:rgba(${hex2rgb(_accent)},0.30);
        --rq-accent-glow:rgba(${hex2rgb(_accent)},0.35);
        --rq-transition:all 0.15s ease;
        --rq-card-radius:18px;
      }
      @keyframes rqOrbDrift{
        0%,100%{transform:translate(0,0) scale(1)}
        20%{transform:translate(45px,-70px) scale(1.06)}
        45%{transform:translate(-35px,-28px) scale(0.94)}
        70%{transform:translate(28px,55px) scale(1.03)}
      }
      @keyframes rqPulseGlow{
        0%,100%{opacity:1}
        50%{opacity:0.72}
      }
      @keyframes rqShimmer{
        0%{background-position:200% center}
        100%{background-position:-200% center}
      }
      @keyframes rqFadeIn{
        from{opacity:0}
        to{opacity:1}
      }
      @keyframes rqSkeleton{
        0%{background-position:-400px 0}
        100%{background-position:400px 0}
      }
      @keyframes rqSpinner{
        to{transform:rotate(360deg)}
      }
      @keyframes rqPop{
        0%{transform:scale(0.7);opacity:0}
        70%{transform:scale(1.15)}
        100%{transform:scale(1);opacity:1}
      }
      @keyframes rqBounce{
        0%,100%{transform:translateY(0)}
        40%{transform:translateY(-8px)}
        60%{transform:translateY(-4px)}
      }
      @keyframes rqFloatUp{
        0%{transform:translateY(0);opacity:1}
        100%{transform:translateY(-48px);opacity:0}
      }
      *{box-sizing:border-box;margin:0;padding:0}
      html,body{margin:0;padding:0;overflow-x:hidden}
      .rq-orb{position:fixed;border-radius:50%;filter:blur(110px);pointer-events:none;animation:rqOrbDrift var(--dur,25s) ease-in-out infinite;z-index:0;will-change:transform}
      .rq-card-3d{transition:transform 0.25s ease,box-shadow 0.25s ease}
      .rq-card-3d:hover{transform:translateY(-4px) scale(1.012);box-shadow:0 20px 56px rgba(0,0,0,0.55),0 0 30px var(--rq-accent-glow)}
      .rq-lb-row{cursor:pointer;transition:background 0.18s,transform 0.18s,box-shadow 0.18s}
      .rq-lb-row:hover{background:rgba(255,255,255,0.07)!important;transform:translateX(4px);box-shadow:inset 3px 0 0 var(--rq-accent)}
      .rq-wrap{width:100%;padding:16px 16px 64px;animation:rqFadeIn 0.4s ease both}
      .rq-home-hdr{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;padding-top:8px;margin-bottom:14px}
      .rq-home-nav{display:flex;gap:6px;flex-shrink:1;min-width:0;max-width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch}
      .rq-home-nav::-webkit-scrollbar{display:none}
      .rq-home-nav button{flex-shrink:0;white-space:nowrap}
      .rq-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:3px}
      .rq-wrap button{transition:transform 0.15s ease,box-shadow 0.15s ease,filter 0.15s ease,opacity 0.15s ease}
      .rq-wrap button:hover:not(:disabled){filter:brightness(1.14)}
      .rq-wrap button:active:not(:disabled){transform:scale(0.95)!important}
      .rq-wrap input:focus,.rq-wrap textarea:focus{border-color:var(--rq-accent)!important;box-shadow:0 0 0 3px var(--rq-accent-glow)!important;outline:none!important}
      .rq-glow-green{text-shadow:0 0 12px rgba(52,211,153,0.7)}
      .rq-glow-amber{text-shadow:0 0 12px rgba(251,191,36,0.7)}
      .rq-glow-red{text-shadow:0 0 12px rgba(248,113,113,0.7)}
      .rq-shimmer{background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);background-size:200% auto;animation:rqShimmer 2.5s linear infinite}
      .rq-skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.04) 75%);background-size:400px 100%;animation:rqSkeleton 1.4s ease infinite;border-radius:8px}
      .rq-spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,0.12);border-top-color:var(--rq-accent);border-radius:50%;animation:rqSpinner 0.7s linear infinite;display:inline-block;vertical-align:middle;flex-shrink:0}
      .rq-pop{animation:rqPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both}
      .rq-bounce{animation:rqBounce 0.5s ease}
      .rq-float-up{animation:rqFloatUp 1s ease-out forwards;pointer-events:none;position:absolute}
      .rq-card-3d:hover img{animation:rqBounce 0.5s ease}
      .rq-raised{box-shadow:0 4px 16px rgba(0,0,0,0.3),0 1px 4px rgba(0,0,0,0.2);transition:box-shadow 0.2s ease,transform 0.2s ease}
      .rq-raised:hover{box-shadow:0 8px 28px rgba(0,0,0,0.45),0 0 20px var(--rq-accent-glow);transform:translateY(-2px)}
      .rq-floating{box-shadow:0 12px 40px rgba(0,0,0,0.5),0 0 30px var(--rq-accent-glow)}
      @media(max-width:640px){.rq-home-hdr{flex-wrap:nowrap;flex-direction:column;align-items:stretch}.rq-home-nav{width:100%}}
      @media(max-width:400px){.rq-home-nav button{padding:7px 10px!important;font-size:12px!important}}
      @media(min-width:480px){.rq-wrap{max-width:480px;margin:0 auto;padding:18px 20px 64px}}
      @media(min-width:640px){.rq-wrap{max-width:660px;padding:22px 28px 72px}.rq-lvgrid{grid-template-columns:repeat(3,1fr)!important}}
      @media(min-width:1024px){.rq-wrap{max-width:860px;padding:30px 52px 90px}}
      @media(min-width:1440px){.rq-wrap{max-width:1040px;padding:36px 80px 100px}}
      /* ── scrollbar ── */
      ::-webkit-scrollbar{width:6px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.10);border-radius:10px}
      ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.20)}
      @media print{
        body{background:#fff!important;color:#111!important;}
        .rq-orb,.rq-wrap>div:not([class]){display:none!important;}
        button:not([data-print-keep]){display:none!important;}
        @page{margin:1.5cm;}
      }
      /* ── selection ── */
      ::selection{background:rgba(52,211,153,0.25);color:#34d399}
      /* ── neon pulse keyframes ── */
      @keyframes neonPulseGreen{
        0%,100%{border-color:rgba(52,211,153,0.2);box-shadow:0 0 5px rgba(52,211,153,0.08)}
        50%{border-color:rgba(52,211,153,0.65);box-shadow:0 0 16px rgba(52,211,153,0.28)}
      }
      @keyframes neonPulseIndigo{
        0%,100%{border-color:rgba(99,102,241,0.2);box-shadow:0 0 5px rgba(99,102,241,0.08)}
        50%{border-color:rgba(99,102,241,0.65);box-shadow:0 0 16px rgba(99,102,241,0.28)}
      }
      @keyframes neonPulseAmber{
        0%,100%{border-color:rgba(251,191,36,0.2);box-shadow:0 0 5px rgba(251,191,36,0.08)}
        50%{border-color:rgba(251,191,36,0.65);box-shadow:0 0 16px rgba(251,191,36,0.28)}
      }
      /* ── neon border classes ── */
      .neon-border-green{animation:neonPulseGreen 4s ease-in-out infinite}
      .neon-border-indigo{animation:neonPulseIndigo 4s ease-in-out infinite}
      .neon-border-amber{animation:neonPulseAmber 4s ease-in-out infinite}
      /* ── reusable component classes ── */
      .rq-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:18px;padding:20px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.07);transition:all 0.3s ease}
      .rq-ghost-btn{background:transparent;border:1px solid rgba(255,255,255,0.10);color:#9ca3af;border-radius:12px;padding:8px 16px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s ease}
      .rq-ghost-btn:hover{background:rgba(255,255,255,0.06);color:#fff}
      .rq-ghost-btn:active{transform:scale(0.95)}
      .rq-btn-primary{background:#22c55e;color:#0d0d1a;padding:12px 32px;border-radius:12px;font-weight:900;font-size:14px;cursor:pointer;border:none;font-family:inherit;box-shadow:0 0 20px rgba(34,197,94,0.3);transition:all 0.15s ease}
      .rq-btn-primary:hover{filter:brightness(1.1);box-shadow:0 0 30px rgba(34,197,94,0.5)}
      .rq-btn-primary:active{transform:scale(0.95)}
      .rq-btn-primary:disabled{opacity:0.5;cursor:not-allowed}
      .rq-input{width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.10);border-radius:12px;color:#f3f4f6;font-size:14px;padding:12px 16px;outline:none;font-family:inherit;box-shadow:inset 0 2px 4px rgba(0,0,0,0.2);transition:all 0.2s ease}
      .rq-input:focus{border-color:var(--rq-accent);box-shadow:inset 0 2px 4px rgba(0,0,0,0.2),0 0 0 3px var(--rq-accent-glow)}
      .text-label{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase}
      /* ── eye toggle button inside input wrapper ── */
      .rq-pass-wrap{position:relative}
      .rq-pass-wrap input{padding-right:46px}
      .rq-eye-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#6b7280;padding:0;line-height:1;display:flex;align-items:center;transition:color 0.15s}
      .rq-eye-btn:hover{color:#f3f4f6}
    `}</style>
    <div style={{minHeight:"100vh",background:BG,fontFamily:"'Trebuchet MS','Inter',ui-sans-serif,system-ui,sans-serif",color:"#f3f4f6",overflow:"hidden"}}>
      <div className="rq-orb" style={{width:680,height:680,background:"rgba("+hex2rgb(_accent)+",0.14)",top:"-22%",left:"-16%","--dur":"28s"}}/>
      <div className="rq-orb" style={{width:500,height:500,background:"rgba("+hex2rgb(_secondary)+",0.10)",top:"35%",right:"-14%","--dur":"34s",animationDelay:"6s"}}/>
      <div className="rq-orb" style={{width:420,height:420,background:"rgba(236,72,153,0.09)",bottom:"2%",left:"5%","--dur":"38s",animationDelay:"14s"}}/>
      {/* scanlines */}
      <div style={{position:"fixed",inset:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)",pointerEvents:"none",zIndex:2}}/>
      {/* vignette */}
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.45) 100%)",pointerEvents:"none",zIndex:2}}/>
      <div className="rq-wrap" style={{position:"relative",zIndex:1}}>

        {/* ── SHARE TOAST ────────────────────────────────────── */}
        {shareToast&&(
          <div style={{position:"fixed",left:"50%",bottom:90,transform:"translateX(-50%)",background:"rgba(30,30,44,0.96)",border:"1px solid rgba(90,240,179,0.4)",borderRadius:14,padding:"12px 18px",zIndex:9999,fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,color:"#5af0b3",boxShadow:"0 10px 30px rgba(0,0,0,0.5),0 0 24px rgba(90,240,179,0.18)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",maxWidth:"calc(100% - 32px)"}}>
            ✓ {shareToast}
          </div>
        )}

        {/* ── STUDENT ONBOARDING TOUR (first-time users, 0 games) ── */}
        {coachStep>0&&currentUser&&(function(){
          var steps=[
            {title:t("coachStep1Title"),body:t("coachStep1Body")},
            {title:t("coachStep2Title"),body:t("coachStep2Body")},
            {title:t("coachStep3Title"),body:t("coachStep3Body")}
          ];
          var cur=steps[coachStep-1];
          var isLast=coachStep>=steps.length;
          return(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:9998,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16,backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}} onClick={dismissCoach}>
              <div onClick={function(e){e.stopPropagation();}} style={{background:"rgba(30,30,44,0.95)",border:"1px solid rgba(90,240,179,0.30)",borderRadius:24,padding:"24px 22px 20px",maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.6),0 0 40px rgba(90,240,179,0.15)",marginBottom:24,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
                {coachStep===1&&(
                  <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"#5af0b3",letterSpacing:"0.18em",textTransform:"uppercase",margin:"0 0 4px"}}>{t("coachWelcomeTitle")}</p>
                )}
                <h3 style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:800,color:"#e3e0f4",margin:"0 0 10px",lineHeight:1.2}}>{cur.title}</h3>
                <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,lineHeight:1.55,color:"rgba(227,224,244,0.72)",margin:"0 0 20px"}}>{cur.body}</p>
                <div style={{display:"flex",gap:6,marginBottom:16}}>
                  {[1,2,3].map(function(n){return<div key={n} style={{flex:1,height:3,borderRadius:999,background:n<=coachStep?"#5af0b3":"rgba(255,255,255,0.10)",transition:"background 0.2s"}}/>;})}
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <button type="button" onClick={dismissCoach} style={{background:"none",border:"none",color:"rgba(227,224,244,0.5)",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",padding:"10px 0"}}>{t("coachSkip")}</button>
                  <div style={{flex:1}}/>
                  <button type="button" onClick={function(){if(isLast){dismissCoach();try{track("onboarding_completed");}catch(e){}}else{setCoachStep(coachStep+1);try{track("onboarding_step",{step:coachStep+1});}catch(e){}}}} style={{background:"linear-gradient(135deg,#5af0b3,#34d399)",color:"#003825",border:"none",borderRadius:14,padding:"12px 22px",fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:14,cursor:"pointer",boxShadow:"0 6px 16px rgba(52,211,153,0.36),0 3px 0 0 rgba(0,0,0,0.3)"}}>{isLast?t("coachLetsGo"):t("coachNext")+" →"}</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TEACHER ONBOARDING WIZARD ────────────────────── */}
        {onboardStep!==null&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:"#13131f",border:"1px solid rgba(167,139,250,0.35)",borderRadius:20,padding:28,maxWidth:440,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.7)"}}>
              {/* progress dots */}
              <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
                {[1,2,3].map(function(n){return(
                  <div key={n} style={{width:n===onboardStep?28:8,height:8,borderRadius:99,background:n===onboardStep?"#a78bfa":n<onboardStep?"#34d399":"rgba(255,255,255,0.12)",transition:"all 0.3s"}}/>
                );})}
              </div>

              {onboardStep===1&&(
                <div>
                  <div style={{fontSize:36,textAlign:"center",marginBottom:8}}>🏫</div>
                  <h2 style={{textAlign:"center",fontSize:20,fontWeight:900,color:"#f3f4f6",margin:"0 0 6px"}}>Create your first class</h2>
                  <p style={{textAlign:"center",fontSize:13,color:"#6b7280",margin:"0 0 20px",lineHeight:1.5}}>Give it a name your students will recognise — e.g. "B1 Morning Group"</p>
                  <input value={newClassName} onChange={function(e){setNewClassName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")doOnboardCreateClass();}} placeholder="Class name…" style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:12,fontSize:15}}/>
                  <button onClick={doOnboardCreateClass} disabled={!newClassName.trim()} style={{...mkBtn(newClassName.trim()?"#6366f1":"#374151"),width:"100%",padding:"12px",fontSize:15,fontWeight:800,marginBottom:10}}>Create Class →</button>
                  <button onClick={doFinishOnboarding} style={{...GHOST,width:"100%",fontSize:12,color:"#4b5563"}}>Skip setup for now</button>
                </div>
              )}

              {onboardStep===2&&(
                <div>
                  <div style={{fontSize:36,textAlign:"center",marginBottom:8}}>📢</div>
                  <h2 style={{textAlign:"center",fontSize:20,fontWeight:900,color:"#f3f4f6",margin:"0 0 6px"}}>Share this code with students</h2>
                  <p style={{textAlign:"center",fontSize:13,color:"#6b7280",margin:"0 0 20px",lineHeight:1.5}}>Students enter this code on their home screen to join your class instantly.</p>
                  <div style={{background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:14,padding:"20px 16px",textAlign:"center",marginBottom:12}}>
                    <div style={{fontSize:40,fontWeight:900,letterSpacing:10,color:"#34d399",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>{onboardClassCode}</div>
                    <button onClick={function(){try{navigator.clipboard.writeText(onboardClassCode);setCopyMsg(t("tch_copied"));}catch(e){setCopyMsg(onboardClassCode);}setTimeout(function(){setCopyMsg("");},2000);}} style={{...GHOST,fontSize:12,padding:"5px 14px"}}>{copyMsg||t("tch_copyCode")}</button>
                  </div>
                  <button onClick={function(){setOnboardStep(3);}} style={{...mkBtn("#6366f1"),width:"100%",padding:"12px",fontSize:15,fontWeight:800,marginBottom:10}}>Next: Create an Assignment →</button>
                  <button onClick={doFinishOnboarding} style={{...GHOST,width:"100%",fontSize:12,color:"#4b5563"}}>Skip for now — I'll do this later</button>
                </div>
              )}

              {onboardStep===3&&(
                <div>
                  <div style={{fontSize:36,textAlign:"center",marginBottom:8}}>📋</div>
                  <h2 style={{textAlign:"center",fontSize:20,fontWeight:900,color:"#f3f4f6",margin:"0 0 6px"}}>Create your first assignment</h2>
                  <p style={{textAlign:"center",fontSize:13,color:"#6b7280",margin:"0 0 16px",lineHeight:1.5}}>Pick a story from the library or let AI generate one on any topic.</p>
                  <div style={{display:"flex",gap:6,marginBottom:12}}>
                    {[["library",t("tch_typeLibrary")],["ai_topic",t("tch_typeAi")],["custom_text",t("tch_typeCustom")]].map(function(opt){return(
                      <button key={opt[0]} onClick={function(){setAssignType(opt[0]);}} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"2px solid "+(assignType===opt[0]?"#6366f1":"rgba(255,255,255,0.1)"),background:assignType===opt[0]?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.04)",color:assignType===opt[0]?"#a78bfa":"#9ca3af",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>{opt[1]}</button>
                    );})}
                  </div>
                  {assignType==="library"?(
                    <select value={assignStoryId} onChange={function(e){setAssignStoryId(e.target.value);}} style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:10}}>
                      <option value="">{t("tch_selectStory")}</option>
                      {["A1","A2","B1","B2","C1","C2"].map(function(lv){return(
                        <optgroup key={lv} label={lv}>{STORY_LIBRARY.filter(function(s){return s.level===lv;}).map(function(s){return(<option key={s.id} value={s.id}>{s.title} · {SUBJECT_LABELS[getSubjectKey(s)]}</option>);})}</optgroup>
                      );})}
                    </select>
                  ):assignType==="custom_text"?(
                    <div>
                      <textarea value={assignCustomText} onChange={function(e){setAssignCustomText(e.target.value.slice(0,3000));}} placeholder="Paste your passage here… (150–3000 characters)" style={{...INP,width:"100%",boxSizing:"border-box",minHeight:90,resize:"vertical",marginBottom:4,fontFamily:"inherit",fontSize:12}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:10,color:"#6b7280"}}>{assignCustomText.length}/3000</span>
                        <select value={assignLevel} onChange={function(e){setAssignLevel(e.target.value);}} style={{...INP,margin:0,width:72}}>
                          {["A1","A2","B1","B2","C1","C2"].map(function(lv){return(<option key={lv} value={lv}>{lv}</option>);})}
                        </select>
                      </div>
                    </div>
                  ):(
                    <div>
                      <input value={assignTopic} onChange={function(e){setAssignTopic(e.target.value);}} placeholder={t("tch_topicPlaceholder")} style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:8}}/>
                      <select value={assignLevel} onChange={function(e){setAssignLevel(e.target.value);}} style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:8}}>
                        {["A1","A2","B1","B2","C1","C2"].map(function(lv){return(<option key={lv} value={lv}>{lv}</option>);})}
                      </select>
                    </div>
                  )}
                  <input type="date" value={assignDue} onChange={function(e){setAssignDue(e.target.value);}} style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:12,color:assignDue?"#f3f4f6":"#6b7280"}} placeholder="Due date (optional)"/>
                  {assignMsg&&<p style={{fontSize:12,color:assignMsg.startsWith("✓")?"#34d399":"#f87171",margin:"0 0 10px",textAlign:"center"}}>{assignMsg}</p>}
                  <button onClick={doCreateAssignment} disabled={assignLoading} style={{...mkBtn("#6366f1"),width:"100%",padding:"12px",fontSize:14,fontWeight:800,marginBottom:8}}>{assignLoading?t("tch_generating"):t("tch_assignBtn")}</button>
                  {assignMsg.startsWith("✓")&&<button onClick={doFinishOnboarding} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",padding:"12px",fontSize:14,fontWeight:800,marginBottom:8}}>✓ Finish Setup →</button>}
                  <button onClick={doFinishOnboarding} style={{...GHOST,width:"100%",fontSize:12,color:"#4b5563"}}>Skip — I'll add assignments later</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── OFFLINE BANNER ───────────────────────────────── */}
        {!isOnline&&<div style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:10,padding:"9px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#f87171",fontWeight:600}}>📡 You're offline — reading the library still works!</div>}

        {/* ── PWA INSTALL BANNER ───────────────────────────── */}
        {installPrompt&&<div style={{background:"rgba(99,102,241,0.12)",border:"1px solid rgba(99,102,241,0.35)",borderRadius:10,padding:"9px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8,justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:"#a78bfa",fontWeight:600}}>📲 Install Reading Quest as an app</span>
          <div style={{display:"flex",gap:6,flexShrink:0}}>
            <button onClick={async function(){var r=await installPrompt.prompt();if(r&&r.outcome==="accepted")setInstallPrompt(null);}} style={{...mkBtn("#6366f1"),padding:"5px 12px",fontSize:11}}>Install</button>
            <button onClick={function(){setInstallPrompt(null);}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:14,cursor:"pointer"}}>✕</button>
          </div>
        </div>}

        {/* ── PLACEMENT TEST MODAL ─────────────────────────── */}
        {showPlacement&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(6px)"}}>
            <div style={{...CARD,maxWidth:500,width:"100%",maxHeight:"85vh",overflow:"auto"}}>
              {!placementResult?(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>🎯 Quick Placement Test</h2>
                    <button onClick={dismissPlacement} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer",lineHeight:1}}>×</button>
                  </div>
                  <p style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>10 grammar questions — we'll suggest your starting level. Takes about 3 minutes.</p>
                  {PLACEMENT_QUESTIONS.map(function(pq,pi){
                    return(
                      <div key={pi} style={{...CARD,marginBottom:8,padding:12}}>
                        <p style={{fontSize:13,color:"#e5e7eb",fontWeight:600,marginBottom:8}}>{pi+1}. {pq.q}</p>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {pq.options.map(function(op,oi){
                            var sel=placementAnswers[pi]===oi;
                            return<button key={oi} onClick={function(){setPlacementAnswers(function(a){var n=Object.assign({},a);n[pi]=oi;return n;});}} style={{background:sel?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(sel?"#a78bfa":"rgba(255,255,255,0.1)"),color:sel?"#e9d5ff":"#d1d5db",borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.12s"}}>{op}</button>;
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={finishPlacement} style={{...mkBtn(Object.keys(placementAnswers).length>=PLACEMENT_QUESTIONS.length?"#a78bfa":"#374151","#0d0d1a"),width:"100%",marginTop:8,opacity:Object.keys(placementAnswers).length>=PLACEMENT_QUESTIONS.length?1:0.6}}>See My Level →</button>
                </div>
              ):(
                <div style={{textAlign:"center",padding:24}}>
                  <div style={{fontSize:48,marginBottom:8}}>🎓</div>
                  <h3 style={{fontSize:20,fontWeight:900,color:"#a78bfa",marginBottom:4}}>Your suggested level:</h3>
                  <div style={{fontSize:52,fontWeight:900,color:getLv(placementResult).color,marginBottom:8}}>{placementResult}</div>
                  <p style={{fontSize:14,color:"#9ca3af",marginBottom:20}}>{getLv(placementResult).desc} — a good starting point! You can always change it.</p>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={function(){setLevel(placementResult);dismissPlacement();}} style={{...mkBtn(getLv(placementResult).color,"#0d0d1a"),flex:1}}>Start at {placementResult}</button>
                    <button onClick={dismissPlacement} style={{...GHOST,flex:1}}>Choose Manually</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUTH ──────────────────────────────────────────── */}
        {stage==="auth"&&(
          <>
            <style>{`
              .lq-auth-wrap{min-height:calc(100vh - 80px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 0}
              .lq-brand{font-family:'Outfit',sans-serif;font-weight:700;font-size:34px;letter-spacing:-0.02em;color:var(--rq-accent);line-height:1.05;margin:0;text-shadow:0 0 15px rgba(var(--rq-accent-rgb),0.7),0 0 30px rgba(var(--rq-accent-rgb),0.45),0 0 60px rgba(var(--rq-accent-rgb),0.25)}
              @media(min-width:480px){.lq-brand{font-size:42px}}
              .lq-tagline{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:rgba(227,224,244,0.55);letter-spacing:0.22em;text-transform:uppercase;margin:14px 0 0;text-align:center}
              .lq-langrow{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:28px 0 24px;max-width:340px}
              .lq-lang-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:999px;padding:6px 12px;font-size:11px;font-weight:500;color:rgba(227,224,244,0.65);cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:0.04em;transition:all 0.2s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
              .lq-lang-btn:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.18);color:#e3e0f4}
              .lq-lang-btn:active{transform:scale(0.95)}
              .lq-lang-btn.is-active{background:rgba(var(--rq-accent-rgb),0.14);border-color:rgba(var(--rq-accent-rgb),0.45);color:var(--rq-accent)}
              .lq-glass{position:relative;width:100%;max-width:440px;background:rgba(18,18,31,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:32px;padding:28px 24px 24px;backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%);box-shadow:0 20px 50px rgba(0,0,0,0.5),inset 0 1px 1px rgba(255,255,255,0.05);overflow:hidden}
              .lq-glass::before,.lq-glass::after{content:"";position:absolute;width:240px;height:240px;border-radius:50%;filter:blur(100px);pointer-events:none;z-index:0}
              .lq-glass::before{top:-40px;right:-40px;background:rgba(99,102,241,0.18)}
              .lq-glass::after{bottom:-40px;left:-40px;background:rgba(52,211,153,0.12)}
              .lq-glass>*{position:relative;z-index:1}
              .lq-toggle{position:relative;display:flex;background:rgba(13,13,26,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:6px;margin-bottom:24px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
              .lq-toggle-pill{position:absolute;top:6px;bottom:6px;left:6px;width:calc(50% - 6px);background:var(--rq-accent);border-radius:12px;box-shadow:0 0 18px rgba(var(--rq-accent-rgb),0.45);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);z-index:0}
              .lq-toggle-pill.is-login{transform:translateX(100%)}
              .lq-toggle-btn{position:relative;flex:1;padding:11px 12px;border:none;background:transparent;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.02em;color:rgba(227,224,244,0.55);cursor:pointer;border-radius:12px;transition:color 0.3s;z-index:1}
              .lq-toggle-btn.is-active{color:#003825}
              .lq-roles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px}
              .lq-role{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 12px;border-radius:20px;background:rgba(255,255,255,0.04);border:2px solid rgba(255,255,255,0.10);cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.4s cubic-bezier(0.23,1,0.32,1)}
              .lq-role:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.18)}
              .lq-role.is-student-active{background:rgba(99,102,241,0.14);border-color:#6366F1;transform:translateY(-3px);box-shadow:0 12px 28px -10px rgba(99,102,241,0.45)}
              .lq-role.is-teacher-active{background:rgba(14,165,233,0.14);border-color:#0EA5E9;transform:translateY(-3px);box-shadow:0 12px 28px -10px rgba(14,165,233,0.45)}
              .lq-role-ico{display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:16px;background:rgba(255,255,255,0.06);font-size:24px;margin-bottom:10px;transition:all 0.3s}
              .lq-role.is-student-active .lq-role-ico{background:rgba(99,102,241,0.22)}
              .lq-role.is-teacher-active .lq-role-ico{background:rgba(14,165,233,0.22)}
              .lq-role-label{font-size:13px;font-weight:600;letter-spacing:0.04em;color:rgba(227,224,244,0.6);text-transform:none}
              .lq-role.is-student-active .lq-role-label,.lq-role.is-teacher-active .lq-role-label{color:#e3e0f4}
              .lq-role-check{position:absolute;top:8px;right:8px;font-size:14px;opacity:0;transition:opacity 0.2s}
              .lq-role.is-student-active .lq-role-check,.lq-role.is-teacher-active .lq-role-check{opacity:1}
              .lq-field{margin-bottom:16px}
              .lq-field-label{display:block;font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:rgba(227,224,244,0.6);margin:0 0 8px 4px;letter-spacing:0.02em}
              .lq-input-wrap{position:relative}
              .lq-input-wrap>svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(227,224,244,0.4);pointer-events:none}
              .lq-input{width:100%;background:rgba(13,13,26,0.8);border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:14px 16px 14px 44px;color:#e3e0f4;font-family:'Inter',sans-serif;font-size:15px;outline:none;box-sizing:border-box;transition:all 0.3s ease}
              .lq-input::placeholder{color:rgba(227,224,244,0.25)}
              .lq-input:focus{border-color:#34D399;box-shadow:0 0 0 3px rgba(52,211,153,0.12),inset 0 2px 4px rgba(0,0,0,0.4);background:rgba(13,13,26,0.95)}
              .lq-input.has-eye{padding-right:48px}
              .lq-eye{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(227,224,244,0.5);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:8px;transition:color 0.15s,background 0.15s}
              .lq-eye:hover{color:#e3e0f4;background:rgba(255,255,255,0.06)}
              .lq-submit{width:100%;padding:16px 20px;margin-top:8px;border:none;border-radius:18px;background:var(--rq-accent);color:#0d0d1a;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 10px 24px rgba(var(--rq-accent-rgb),0.28),0 0 30px rgba(var(--rq-accent-rgb),0.18);transition:all 0.2s cubic-bezier(0.4,0,0.2,1)}
              .lq-submit:hover{filter:brightness(1.08);box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 14px 32px rgba(52,211,153,0.4),0 0 40px rgba(52,211,153,0.3)}
              .lq-submit:active{transform:translateY(3px);box-shadow:0 1px 0 0 rgba(0,0,0,0.4),0 4px 12px rgba(52,211,153,0.3)}
              .lq-submit:disabled{opacity:0.5;cursor:not-allowed;transform:none}
              .lq-fineprint{text-align:center;margin:22px 0 0;font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.45)}
              .lq-fineprint a{color:#5af0b3;text-decoration:underline}
              .lq-footer{display:flex;align-items:center;justify-content:center;gap:18px;margin:32px 0 8px;opacity:0.25}
              .lq-footer-line{height:1px;width:56px;background:linear-gradient(90deg,transparent,rgba(227,224,244,0.5),transparent)}
              .lq-footer-icons{display:flex;gap:18px;font-size:16px}
            `}</style>
            <div className="lq-auth-wrap">
              <button type="button" onClick={function(){setStage("welcome");setAuthErr("");}} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.10)",borderRadius:999,padding:"6px 12px",fontFamily:"'Inter',sans-serif",fontSize:11,color:"rgba(227,224,244,0.65)",cursor:"pointer",letterSpacing:"0.04em"}}>← {t("back")}</button>
              <h1 className="lq-brand">Reading Quest</h1>
              <p className="lq-tagline">6 Question Types · Friends · Compete</p>
              <div className="lq-langrow">
                {[{c:"en",f:"🇬🇧"},{c:"uz",f:"🇺🇿"},{c:"ru",f:"🇷🇺"},{c:"tr",f:"🇹🇷"},{c:"ar",f:"🇦🇪"},{c:"de",f:"🇩🇪"},{c:"es",f:"🇪🇸"},{c:"fr",f:"🇫🇷"}].map(function(opt){
                  var active=uiLang===opt.c;
                  return<button key={opt.c} type="button" onClick={function(){setUiLang(opt.c);try{localStorage.setItem("rq-uilang",opt.c);}catch(e){}}} className={"lq-lang-btn"+(active?" is-active":"")}><span>{opt.f}</span><span>{opt.c.toUpperCase()}</span></button>;
                })}
              </div>
              <section className="lq-glass">
                <div className="lq-toggle">
                  <div className={"lq-toggle-pill"+(authMode==="login"?" is-login":"")}/>
                  {["register","login"].map(function(m){return<button key={m} type="button" onClick={function(){setAuthMode(m);setAuthErr("");}} className={"lq-toggle-btn"+(authMode===m?" is-active":"")}>{m==="login"?t("login"):t("register")}</button>;})}
                </div>

                {authMode==="register"&&(
                  <div className="lq-roles">
                    <button type="button" onClick={function(){setIsTeacherReg(false);}} className={"lq-role"+(!isTeacherReg?" is-student-active":"")}>
                      <span className="lq-role-check" style={{color:"#a5b4fc"}}>✓</span>
                      <div className="lq-role-ico">🎓</div>
                      <span className="lq-role-label">Student</span>
                    </button>
                    <button type="button" onClick={function(){setIsTeacherReg(true);}} className={"lq-role"+(isTeacherReg?" is-teacher-active":"")}>
                      <span className="lq-role-check" style={{color:"#7dd3fc"}}>✓</span>
                      <div className="lq-role-ico">📡</div>
                      <span className="lq-role-label">Teacher</span>
                    </button>
                  </div>
                )}

                <div className="lq-field">
                  <label className="lq-field-label">{t("username")}</label>
                  <div className="lq-input-wrap">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input className="lq-input" type="text" placeholder="QuestMaster42" value={nameInput} onChange={function(e){setNameInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
                  </div>
                </div>

                <div className="lq-field">
                  <label className="lq-field-label">{t("password")}</label>
                  <div className="lq-input-wrap">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input className="lq-input has-eye" type={showPass?"text":"password"} placeholder="••••••••" value={passInput} onChange={function(e){setPassInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
                    <button type="button" className="lq-eye" onClick={function(){setShowPass(function(p){return!p;});}} title={showPass?"Hide password":"Show password"} aria-label={showPass?"Hide password":"Show password"}>
                      {showPass
                        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {authErr&&<ErrorBanner message={authErr} marginBottom={12}/>}

                <button type="button" onClick={authMode==="login"?doLogin:doRegister} className="lq-submit">{authMode==="login"?t("login"):t("register")}</button>

                <p className="lq-fineprint">By joining, you agree to the <a href="#" onClick={function(e){e.preventDefault();}}>Quest Rules</a></p>
              </section>

              <div className="lq-footer">
                <div className="lq-footer-line"/>
                <div className="lq-footer-icons"><span>⭐</span><span>📖</span><span>🏆</span></div>
                <div className="lq-footer-line"/>
              </div>
            </div>
          </>
        )}

        {/* ── WELCOME ──────────────────────────────────────── */}
        {stage==="welcome"&&(
          <>
            <style>{`
              .wc-wrap{min-height:calc(100vh - 80px);display:flex;flex-direction:column;align-items:center;padding:24px 0 40px}
              .wc-brand{font-family:'Outfit',sans-serif;font-weight:700;font-size:38px;letter-spacing:-0.02em;color:var(--rq-accent);line-height:1.05;margin:0;text-align:center;text-shadow:0 0 15px rgba(var(--rq-accent-rgb),0.7),0 0 30px rgba(var(--rq-accent-rgb),0.45),0 0 60px rgba(var(--rq-accent-rgb),0.25)}
              @media(min-width:480px){.wc-brand{font-size:48px}}
              .wc-tagline{font-family:'Outfit',sans-serif;font-size:14px;font-weight:600;color:#e3e0f4;letter-spacing:0.04em;margin:18px 0 8px;text-align:center}
              .wc-subhead{font-family:'Inter',sans-serif;font-size:13px;line-height:1.55;color:rgba(227,224,244,0.62);text-align:center;max-width:340px;margin:0 0 28px;padding:0 8px}
              .wc-langrow{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:0 0 24px;max-width:340px}
              .wc-lang-btn{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:999px;padding:6px 12px;font-size:11px;font-weight:500;color:rgba(227,224,244,0.65);cursor:pointer;font-family:'Inter',sans-serif;letter-spacing:0.04em;transition:all 0.2s}
              .wc-lang-btn:hover{background:rgba(255,255,255,0.09);border-color:rgba(255,255,255,0.18);color:#e3e0f4}
              .wc-lang-btn.is-active{background:rgba(52,211,153,0.14);border-color:rgba(52,211,153,0.45);color:#5af0b3}
              .wc-ctas{width:100%;max-width:340px;display:flex;flex-direction:column;gap:12px;margin-bottom:14px}
              .wc-cta-primary{width:100%;padding:16px 20px;border:none;border-radius:18px;background:var(--rq-accent);color:#0d0d1a;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 10px 24px rgba(var(--rq-accent-rgb),0.28),0 0 30px rgba(var(--rq-accent-rgb),0.18);transition:all 0.2s cubic-bezier(0.4,0,0.2,1)}
              .wc-cta-primary:hover{filter:brightness(1.08);box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 14px 32px rgba(52,211,153,0.4),0 0 40px rgba(52,211,153,0.3)}
              .wc-cta-primary:active{transform:translateY(3px);box-shadow:0 1px 0 0 rgba(0,0,0,0.4),0 4px 12px rgba(52,211,153,0.3)}
              .wc-cta-demo{width:100%;padding:15px 20px;border:1px solid rgba(167,139,250,0.45);border-radius:18px;background:rgba(167,139,250,0.08);color:#c4b5fd;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(8px);transition:all 0.2s}
              .wc-cta-demo:hover{background:rgba(167,139,250,0.14);border-color:#a78bfa;color:#e3e0f4}
              .wc-nosignup{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.4);text-align:center;letter-spacing:0.06em;margin:0 0 36px}
              .wc-benefits{width:100%;max-width:380px;display:flex;flex-direction:column;gap:12px;margin-bottom:32px}
              .wc-benefit{display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:18px;background:rgba(18,18,31,0.55);border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(10px)}
              .wc-benefit-ico{flex-shrink:0;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.25)}
              .wc-benefit-text h3{margin:0 0 4px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;color:#e3e0f4;letter-spacing:0.02em}
              .wc-benefit-text p{margin:0;font-family:'Inter',sans-serif;font-size:12px;line-height:1.5;color:rgba(227,224,244,0.55)}
              .wc-footer{text-align:center;margin-top:8px}
              .wc-footer-about{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.35);margin:0 0 14px;letter-spacing:0.04em}
              .wc-login-link{background:none;border:none;color:#5af0b3;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;padding:8px 14px;text-decoration:underline}
              .wc-login-link:hover{color:#7df5c7}
            `}</style>
            <div className="wc-wrap">
              <h1 className="wc-brand">Reading Quest</h1>
              <p className="wc-tagline">{t("welcomeTagline")}</p>
              <p className="wc-subhead">{t("welcomeSubhead")}</p>
              <div className="wc-langrow">
                {[{c:"en",f:"🇬🇧"},{c:"uz",f:"🇺🇿"},{c:"ru",f:"🇷🇺"},{c:"tr",f:"🇹🇷"},{c:"ar",f:"🇦🇪"},{c:"de",f:"🇩🇪"},{c:"es",f:"🇪🇸"},{c:"fr",f:"🇫🇷"}].map(function(opt){
                  var active=uiLang===opt.c;
                  return<button key={opt.c} type="button" onClick={function(){setUiLang(opt.c);try{localStorage.setItem("rq-uilang",opt.c);}catch(e){}}} className={"wc-lang-btn"+(active?" is-active":"")}><span>{opt.f}</span><span>{opt.c.toUpperCase()}</span></button>;
                })}
              </div>
              <div className="wc-ctas">
                <button type="button" className="wc-cta-primary" onClick={function(){try{track("welcome_cta_signup");}catch(e){}setAuthMode("register");setStage("auth");}}>{t("welcomeCtaPrimary")}</button>
                <button type="button" className="wc-cta-demo" onClick={startDemoQuiz}>▶ {t("welcomeCtaDemo")}</button>
              </div>
              <p className="wc-nosignup">{t("welcomeNoSignup")}</p>
              <div className="wc-benefits">
                {[
                  {ico:"🤖",t:t("welcomeBenefit1Title"),b:t("welcomeBenefit1Body")},
                  {ico:"⚡",t:t("welcomeBenefit2Title"),b:t("welcomeBenefit2Body")},
                  {ico:"🌍",t:t("welcomeBenefit3Title"),b:t("welcomeBenefit3Body")},
                ].map(function(it,i){return(
                  <div key={i} className="wc-benefit">
                    <div className="wc-benefit-ico">{it.ico}</div>
                    <div className="wc-benefit-text"><h3>{it.t}</h3><p>{it.b}</p></div>
                  </div>
                );})}
              </div>
              <div className="wc-footer">
                <p className="wc-footer-about">{t("welcomeFooterAbout")}</p>
                <button type="button" className="wc-login-link" onClick={function(){try{track("welcome_cta_login");}catch(e){}setAuthMode("login");setStage("auth");}}>{t("welcomeAlreadyAccount")}</button>
              </div>
            </div>
          </>
        )}

        {/* ── DEMO QUIZ (no-signup) ────────────────────────── */}
        {stage==="demo"&&(function(){
          var totalSteps=DEMO_QUIZ.questions.length;
          var atIntro=demoStep===0;
          var atResult=demoStep>totalSteps;
          var atQuestion=!atIntro&&!atResult;
          var qIdx=demoStep-1;
          var curQ=atQuestion?DEMO_QUIZ.questions[qIdx]:null;
          var curAns=atQuestion?(demoAnswers[qIdx]!=null?demoAnswers[qIdx]:null):null;
          var correct=atResult?demoAnswers.filter(function(a,i){return a===DEMO_QUIZ.questions[i].answer;}).length:0;
          function pickAns(idx){if(curAns!=null)return;var next=demoAnswers.slice();next[qIdx]=idx;setDemoAnswers(next);}
          function nextStep(){setDemoStep(demoStep+1);}
          function tryAgain(){setDemoStep(0);setDemoAnswers([]);}
          return(
            <>
              <style>{`
                .dm-wrap{min-height:calc(100vh - 80px);display:flex;flex-direction:column;padding:16px 0}
                .dm-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:18px}
                .dm-back{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);border-radius:999px;padding:8px 14px;font-family:'Inter',sans-serif;font-size:12px;color:#e3e0f4;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
                .dm-back:hover{background:rgba(255,255,255,0.10)}
                .dm-prog{display:flex;gap:4px;flex:1;max-width:180px}
                .dm-prog-tick{flex:1;height:3px;border-radius:999px;background:rgba(255,255,255,0.10);transition:background 0.2s}
                .dm-prog-tick.is-done{background:#5af0b3}
                .dm-card{background:rgba(18,18,31,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:22px;backdrop-filter:blur(20px)}
                .dm-title{font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;color:#e3e0f4;margin:0 0 6px;letter-spacing:-0.01em}
                .dm-meta{font-family:'Inter',sans-serif;font-size:11px;color:#5af0b3;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;margin:0 0 16px}
                .dm-passage{font-family:'Inter',sans-serif;font-size:14px;line-height:1.7;color:rgba(227,224,244,0.85);max-height:48vh;overflow-y:auto;padding-right:6px;margin-bottom:18px}
                .dm-passage p{margin:0 0 0.85em}
                .dm-passage::-webkit-scrollbar{width:6px}
                .dm-passage::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.3);border-radius:999px}
                .dm-q{font-family:'Outfit',sans-serif;font-size:17px;font-weight:600;color:#e3e0f4;margin:0 0 16px;line-height:1.4}
                .dm-opts{display:flex;flex-direction:column;gap:10px;margin-bottom:18px}
                .dm-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:#e3e0f4;font-family:'Inter',sans-serif;font-size:14px;cursor:pointer;transition:all 0.18s}
                .dm-opt:hover:not(:disabled){background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.18)}
                .dm-opt:disabled{cursor:default}
                .dm-opt.is-correct{background:rgba(52,211,153,0.14);border-color:#5af0b3;color:#5af0b3}
                .dm-opt.is-wrong{background:rgba(239,68,68,0.12);border-color:#ef4444;color:#fca5a5}
                .dm-opt-bullet{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.10);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:rgba(227,224,244,0.55);flex-shrink:0}
                .dm-opt.is-correct .dm-opt-bullet{background:#5af0b3;color:#003825}
                .dm-opt.is-wrong .dm-opt-bullet{background:#ef4444;color:#0d0d1a}
                .dm-explain{margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.25);font-family:'Inter',sans-serif;font-size:12px;line-height:1.55;color:rgba(227,224,244,0.75)}
                .dm-explain strong{color:#a78bfa;font-weight:700}
                .dm-cta{width:100%;padding:15px 20px;border:none;border-radius:18px;background:#5af0b3;color:#003825;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 10px 24px rgba(52,211,153,0.28);margin-top:8px;transition:all 0.2s}
                .dm-cta:hover{filter:brightness(1.08)}
                .dm-cta:active{transform:translateY(3px);box-shadow:0 1px 0 0 rgba(0,0,0,0.4)}
                .dm-cta:disabled{opacity:0.4;cursor:not-allowed;transform:none}
                .dm-result-num{font-family:'Outfit',sans-serif;font-size:64px;font-weight:900;color:#5af0b3;line-height:1;text-align:center;margin:8px 0 4px;text-shadow:0 0 20px rgba(52,211,153,0.45)}
                .dm-result-label{font-family:'Inter',sans-serif;font-size:13px;color:rgba(227,224,244,0.55);text-align:center;letter-spacing:0.08em;margin:0 0 20px}
                .dm-result-cta{display:flex;flex-direction:column;gap:10px;margin-top:14px}
                .dm-result-ghost{padding:13px 18px;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);color:#e3e0f4;font-family:'Inter',sans-serif;font-size:13px;cursor:pointer;transition:all 0.18s}
                .dm-result-ghost:hover{background:rgba(255,255,255,0.08)}
              `}</style>
              <div className="dm-wrap">
                <div className="dm-top">
                  <button type="button" className="dm-back" onClick={function(){setStage("welcome");}}>← {t("back")}</button>
                  {atQuestion&&(
                    <div className="dm-prog">{DEMO_QUIZ.questions.map(function(_,i){return<div key={i} className={"dm-prog-tick"+(i<=qIdx&&demoAnswers[i]!=null?" is-done":"")}/>;})}</div>
                  )}
                  {atQuestion&&<span style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:"rgba(227,224,244,0.5)",fontWeight:600}}>{demoStep}/{totalSteps}</span>}
                </div>
                <div className="dm-card">
                  {atIntro&&(<>
                    <p className="dm-meta">📖 {DEMO_QUIZ.level} · Demo passage</p>
                    <h2 className="dm-title">{DEMO_QUIZ.title}</h2>
                    <div className="dm-passage">{DEMO_QUIZ.passage.split(/\n{2,}/).map(function(p,i){return<p key={i}>{p}</p>;})}</div>
                    <button type="button" className="dm-cta" onClick={function(){try{track("welcome_demo_quiz_start");}catch(e){}nextStep();}}>{t("welcomeCtaPrimary")?"Begin Quiz →":"Begin Quiz →"}</button>
                  </>)}
                  {atQuestion&&(<>
                    <p className="dm-meta">Question {demoStep} of {totalSteps}</p>
                    <h2 className="dm-q">{curQ.q}</h2>
                    <div className="dm-opts">
                      {curQ.options.map(function(opt,i){
                        var done=curAns!=null;
                        var isCorrect=done&&i===curQ.answer;
                        var isWrong=done&&i===curAns&&curAns!==curQ.answer;
                        return<button key={i} type="button" disabled={done} onClick={function(){pickAns(i);}} className={"dm-opt"+(isCorrect?" is-correct":isWrong?" is-wrong":"")}>
                          <span className="dm-opt-bullet">{["A","B","C","D"][i]}</span><span>{opt}</span>
                        </button>;
                      })}
                    </div>
                    {curAns!=null&&(
                      <div className="dm-explain"><strong>{curAns===curQ.answer?"✓ Correct.":"✕ Not quite."}</strong> {curQ.explain}</div>
                    )}
                    {curAns!=null&&(
                      <button type="button" className="dm-cta" onClick={nextStep}>{demoStep===totalSteps?"See result →":"Next →"}</button>
                    )}
                  </>)}
                  {atResult&&(<>
                    <p className="dm-meta">🎉 You finished the demo</p>
                    <div className="dm-result-num">{correct}/{totalSteps}</div>
                    <p className="dm-result-label">{correct===totalSteps?"PERFECT SCORE":correct>=totalSteps*0.6?"NICE WORK":"GOOD TRY"}</p>
                    <div className="dm-result-cta">
                      <button type="button" className="dm-cta" onClick={function(){try{track("welcome_demo_completed",{score:correct});}catch(e){}setAuthMode("register");setStage("auth");}}>{t("welcomeCtaPrimary")}</button>
                      <button type="button" className="dm-result-ghost" onClick={tryAgain}>🔁 Try again</button>
                      <button type="button" className="dm-result-ghost" onClick={function(){setStage("welcome");}}>← {t("back")}</button>
                    </div>
                  </>)}
                </div>
              </div>
            </>
          );
        })()}

        {/* ── TEACHER DASHBOARD ────────────────────────────── */}
        {stage==="teacherDashboard"&&currentUser&&(function(){
          var myClasses=classes.filter(function(c){return c.teacherName===currentUser.name;});
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:900,color:"#a78bfa"}}>{t("teacherDashboard")}</h2>
                  <p style={{margin:0,fontSize:13,color:"#6b7280"}}>{t("welcomeBack")}, {currentUser.name}</p>
                </div>
                <button onClick={function(){track("user_logout");revokeStoredRefreshToken();resetIdentity();_sessionToken=null;localStorage.removeItem("rq-session");localStorage.removeItem(CREDS_KEY);setCurrentUser(null);setNameInput("");setPassInput("");setStage("auth");}} style={{...GHOST,fontSize:12,padding:"6px 12px"}}>{t("logOut")}</button>
              </div>

              <div style={{...CARD,marginBottom:14}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:10}}>{t("createNewClass")}</p>
                <div style={{display:"flex",gap:8}}>
                  <input value={newClassName} onChange={function(e){setNewClassName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")doCreateClass();}} placeholder={t("classNamePlaceholder")} style={{...INP,flex:1,margin:0}}/>
                  <button onClick={doCreateClass} disabled={!newClassName.trim()} style={{...mkBtn("#6366f1"),padding:"10px 16px",fontSize:13,whiteSpace:"nowrap"}}>{t("createButton")}</button>
                </div>
              </div>

              {/* ── Public Profile (F6b) ───────────────────────────── */}
              {myClasses.length>0&&(
                <div style={{...CARD,marginBottom:14,borderColor:teacherBio.public?"rgba(244,114,182,0.4)":"rgba(255,255,255,0.08)",background:teacherBio.public?"linear-gradient(135deg,rgba(244,114,182,0.06),rgba(167,139,250,0.04))":"rgba(30,30,44,0.5)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:teacherBio.public?"#f472b6":"#9ca3af",letterSpacing:0.6,margin:0}}>👤 {t("tch_bio_label")} {teacherBio.public?"· "+t("tch_bio_live"):""}</p>
                    {teacherBio.public&&(
                      <button onClick={function(){window.open(window.location.origin+window.location.pathname+"?teacher="+encodeURIComponent(currentUser.name),"_blank");}} style={{...GHOST,fontSize:11,padding:"4px 10px"}}>{t("tch_bio_view")}</button>
                    )}
                  </div>
                  <input
                    placeholder={t("tch_bio_displayName_ph")}
                    value={teacherBio.displayName}
                    maxLength={60}
                    onChange={function(e){setTeacherBio(function(b){return Object.assign({},b,{displayName:e.target.value});});}}
                    style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 8px"}}
                  />
                  <textarea
                    placeholder={t("tch_bio_bio_ph")}
                    value={teacherBio.bio}
                    maxLength={500}
                    onChange={function(e){setTeacherBio(function(b){return Object.assign({},b,{bio:e.target.value});});}}
                    rows={3}
                    style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 8px",resize:"vertical",fontFamily:"inherit"}}
                  />
                  <input
                    placeholder={t("tch_bio_langs_ph")}
                    value={teacherBio.languages.join(", ")}
                    onChange={function(e){var arr=e.target.value.split(",").map(function(s){return s.trim();}).filter(Boolean).slice(0,5);setTeacherBio(function(b){return Object.assign({},b,{languages:arr});});}}
                    style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 8px"}}
                  />
                  <input
                    placeholder={t("tch_bio_subjects_ph")}
                    value={teacherBio.subjects.join(", ")}
                    onChange={function(e){var arr=e.target.value.split(",").map(function(s){return s.trim();}).filter(Boolean).slice(0,5);setTeacherBio(function(b){return Object.assign({},b,{subjects:arr});});}}
                    style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 10px"}}
                  />
                  <label style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#d1d5db",cursor:"pointer",marginBottom:10}}>
                    <input type="checkbox" checked={!!teacherBio.public} onChange={function(e){setTeacherBio(function(b){return Object.assign({},b,{public:e.target.checked});});}}/>
                    {t("tch_bio_publicLabel")}
                  </label>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <button onClick={saveTeacherBio} disabled={teacherBioSaving} style={{...mkBtn("#f472b6"),padding:"9px 16px",fontSize:13,fontWeight:800}}>{teacherBioSaving?t("tch_bio_saving"):t("tch_bio_save")}</button>
                    {teacherBioMsg&&<span style={{fontSize:11,color:teacherBioMsg.indexOf("✓")===0?"#5af0b3":"#f87171"}}>{teacherBioMsg}</span>}
                  </div>
                </div>
              )}

              {myClasses.length===0?(
                <div style={{textAlign:"center",padding:"40px 0",color:"#4b5563"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🏫</div>
                  <p style={{fontSize:14}}>{t("noClassesYet")}</p>
                </div>
              ):myClasses.map(function(cls){
                var students=cls.students||[];
                var stuData=students.map(function(n){var u=allUsers.find(function(u){return u.name===n;});return u&&u.games?u.games:[];});
                var allGames=stuData.reduce(function(a,g){return a.concat(g);},[]);
                var avgPct=allGames.length?Math.round(allGames.reduce(function(s,g){return s+g.pct;},0)/allGames.length):0;
                return(
                  <button key={cls.id} onClick={function(){setCurrentClass(cls);setStage("classView");}} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.04)",border:"2px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 16px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:10,transition:"border-color 0.15s"}}
                    onMouseEnter={function(e){e.currentTarget.style.borderColor="rgba(99,102,241,0.5)";}}
                    onMouseLeave={function(e){e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,color:"#f3f4f6",marginBottom:3}}>{cls.name}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{students.length} student{students.length!==1?"s":""} · created {cls.created}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:18,fontWeight:900,color:"#a78bfa",marginBottom:2}}>{avgPct>0?avgPct+"%":"–"}</div>
                      <div style={{fontSize:10,color:"#4b5563",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}}>{cls.id}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* ── CLASS VIEW ───────────────────────────────────── */}
        {stage==="classView"&&currentClass&&currentUser&&(function(){
          var cls=currentClass;
          var students=cls.students||[];
          var stuData=students.map(function(sName){
            var u=allUsers.find(function(u){return u.name===sName;});
            var games=u&&u.games?u.games:[];
            var validGames=games.filter(function(g){return g.pct>=0;});
            var avgPct=validGames.length?Math.round(validGames.reduce(function(s,g){return s+g.pct;},0)/validGames.length):0;
            var wpmGames=games.filter(function(g){return g.wpm>0;});
            var avgWpm=wpmGames.length?Math.round(wpmGames.reduce(function(s,g){return s+g.wpm;},0)/wpmGames.length):0;
            var lvOrder=["A1","A2","B1","B2","C1","C2"];
            var bestLv=getBestLevel(games);
            var lastGame=games.length?games[games.length-1]:null;
            // trend: compare last 3 games avg vs previous 3
            var recent3=validGames.slice(-3);var prev3=validGames.slice(-6,-3);
            var recentAvg=recent3.length?recent3.reduce(function(s,g){return s+g.pct;},0)/recent3.length:null;
            var prevAvg=prev3.length?prev3.reduce(function(s,g){return s+g.pct;},0)/prev3.length:null;
            var trend=recentAvg===null?"new":prevAvg===null?"new":recentAvg-prevAvg>5?"up":recentAvg-prevAvg<-5?"down":"stable";
            // Need ≥2 recent sub-50% games before flagging — a single bad day
            // shouldn't tag a student with "Needs help" on the teacher's view.
            var isStruggling=recent3.length>=2&&recentAvg!==null&&recentAvg<50;
            return{name:sName,gameCount:games.length,avgPct:avgPct,avgWpm:avgWpm,bestLv:bestLv,lastDate:lastGame?lastGame.date:"Never",trend:trend,isStruggling:isStruggling};
          });
          var activeStudents=stuData.filter(function(d){return d.gameCount>0;});
          var classAvg=activeStudents.length?Math.round(activeStudents.reduce(function(s,d){return s+d.avgPct;},0)/activeStudents.length):0;
          var classWpm=activeStudents.filter(function(d){return d.avgWpm>0;}).length?Math.round(activeStudents.filter(function(d){return d.avgWpm>0;}).reduce(function(s,d){return s+d.avgWpm;},0)/activeStudents.filter(function(d){return d.avgWpm>0;}).length):0;
          return(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <button onClick={function(){setStage("teacherDashboard");}} style={GHOST}>← Back</button>
                <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#f3f4f6",flex:1}}>{cls.name}</h2>
                {students.length>0&&<button onClick={function(){setStage("classAnalytics");}} style={{...GHOST,fontSize:12,padding:"6px 10px",whiteSpace:"nowrap"}}>{t("tch_analytics")}</button>}
                {students.length>0&&<button onClick={doExportClassCSV} style={{...GHOST,fontSize:12,padding:"6px 10px",whiteSpace:"nowrap"}}>{t("tch_csvExport")}</button>}
              </div>

              <div style={{...CARD,textAlign:"center",marginBottom:12}}>
                <p style={{fontSize:11,color:"#6b7280",margin:"0 0 6px",letterSpacing:0.6}}>{t("tch_shareCode")}</p>
                <div style={{fontSize:36,fontWeight:900,letterSpacing:10,color:"#34d399",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>{cls.id}</div>
                <button onClick={function(){try{navigator.clipboard.writeText(cls.id);setCopyMsg(t("tch_copied"));}catch(e){setCopyMsg(cls.id);}setTimeout(function(){setCopyMsg("");},2000);}} style={{...GHOST,fontSize:12,padding:"5px 14px"}}>{copyMsg||t("tch_copyCode")}</button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                {[{label:t("tch_statStudents"),val:students.length,color:"#a78bfa"},{label:t("tch_statClassAvg"),val:classAvg>0?classAvg+"%":"–",color:"#34d399"},{label:t("tch_statAvgWpm"),val:classWpm>0?classWpm:"–",color:"#f59e0b"}].map(function(s){return(
                  <div key={s.label} style={{...CARD,textAlign:"center",padding:"12px 8px"}}>
                    <div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.label}</div>
                  </div>
                );})}
              </div>

              {/* Announcement board */}
              <div style={{...CARD,marginBottom:14}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:10}}>{t("tch_announcement")}</p>
                {cls.announcement?(
                  <div>
                    <div style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                      <p style={{margin:"0 0 4px",fontSize:13,color:"#e9d5ff",lineHeight:1.5}}>{cls.announcement.text}</p>
                      <p style={{margin:0,fontSize:10,color:"#6b7280"}}>{t("tch_postedLabel")} {cls.announcement.date}</p>
                    </div>
                    <button onClick={doClearAnnouncement} style={{...GHOST,fontSize:11,padding:"4px 10px"}}>{t("tch_removeAnn")}</button>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8}}>
                    <input value={announcementText} onChange={function(e){setAnnouncementText(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")doPostAnnouncement();}} placeholder={t("tch_postPlaceholder")} style={{...INP,flex:1,margin:0}}/>
                    <button onClick={doPostAnnouncement} disabled={!announcementText.trim()} style={{...mkBtn(announcementText.trim()?"#a78bfa":"#374151","#0d0d1a"),padding:"10px 14px",fontSize:12,whiteSpace:"nowrap"}}>{t("tch_post")}</button>
                  </div>
                )}
                {announcementMsg&&<p style={{fontSize:12,color:"#34d399",margin:"6px 0 0"}}>{announcementMsg}</p>}
              </div>

              {/* Question-type heatmap */}
              {activeStudents.length>0&&(function(){
                var Q_TYPES_HM=["mcq","gap_word","gap_sentence","matching","heading","qa","tfnm","ynng"];
                var typeAvgs=Q_TYPES_HM.map(function(t){
                  var relevant=stuData.filter(function(d){
                    var u=allUsers.find(function(u){return u.name===d.name;});
                    var games=u&&u.games?u.games:[];
                    return games.some(function(g){return g.typeStats&&g.typeStats[t]!==undefined;});
                  });
                  if(!relevant.length)return null;
                  var avg=Math.round(relevant.reduce(function(s,d){
                    var u=allUsers.find(function(u){return u.name===d.name;});
                    var games=u&&u.games?u.games:[];
                    var tGames=games.filter(function(g){return g.typeStats&&g.typeStats[t]!==undefined;});
                    var tAvg=tGames.length?tGames.reduce(function(s2,g){return s2+(g.typeStats[t]||0);},0)/tGames.length:0;
                    return s+tAvg;
                  },0)/relevant.length);
                  return{type:t,avg:avg,label:qLabel(t)};
                }).filter(function(x){return x!==null;});
                if(!typeAvgs.length)return null;
                typeAvgs.sort(function(a,b){return a.avg-b.avg;});
                return(
                  <div style={{...CARD,marginBottom:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:10}}>{t("tch_classWeakAreas")}</p>
                    {typeAvgs.map(function(t){
                      var pct=Math.min(100,Math.max(0,t.avg*100));
                      var col=pct<50?"#f87171":pct<70?"#f59e0b":"#34d399";
                      return(
                        <div key={t.type} style={{marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                            <span style={{color:"#d1d5db"}}>{t.label}</span>
                            <span style={{color:col,fontWeight:700}}>{Math.round(pct)}%</span>
                          </div>
                          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:4,height:6,overflow:"hidden"}}>
                            <div style={{height:"100%",width:pct+"%",background:col,borderRadius:4,transition:"width 0.4s"}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Students */}
              <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:8}}>{t("tch_studentsSection")}</p>
              {students.length===0?(
                <div style={{textAlign:"center",padding:"24px 0",color:"#4b5563",marginBottom:16}}>
                  <p style={{margin:0}}>{t("tch_noStudentsYet")}</p>
                </div>
              ):stuData.map(function(d){
                var lvMeta=LEVELS.find(function(l){return l.key===d.bestLv;});
                var trendIcon=d.trend==="up"?"📈":d.trend==="down"?"📉":d.trend==="stable"?"➡️":"🆕";
                var trendColor=d.trend==="up"?"#34d399":d.trend==="down"?"#f87171":"#9ca3af";
                var cardBorder=d.isStruggling?"rgba(248,113,113,0.4)":"rgba(255,255,255,0.07)";
                return(
                  <div key={d.name} style={{...CARD,marginBottom:8,border:"1px solid "+cardBorder}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span style={{fontSize:14,fontWeight:800,color:"#f3f4f6"}}>{d.name}</span>
                          {d.isStruggling&&<span style={{fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:6,padding:"1px 6px"}}>{t("tch_needsHelp")}</span>}
                        </div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{d.gameCount} {t("tch_games")} · {t("tch_lastActive")} {d.lastDate==="Never"?t("tch_never"):d.lastDate}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0,paddingLeft:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",marginBottom:2}}>
                          {d.gameCount>=3&&<span style={{fontSize:14}} title={d.trend==="up"?t("tch_improving"):d.trend==="down"?t("tch_declining"):t("tch_stable")}>{trendIcon}</span>}
                          <span style={{fontSize:15,fontWeight:900,color:lvMeta?lvMeta.color:"#4b5563"}}>{d.bestLv!=="none"?d.bestLv:"–"}</span>
                        </div>
                        <div style={{fontSize:12,color:"#9ca3af"}}>{d.gameCount>0?d.avgPct+"%":t("tch_noGames")}</div>
                      </div>
                    </div>
                    {d.gameCount>0&&(
                      <div style={{display:"flex",gap:16,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.05)",alignItems:"center"}}>
                        <span style={{fontSize:11,color:"#6b7280"}}>Avg: <b style={{color:d.isStruggling?"#f87171":"#f3f4f6"}}>{d.avgPct}%</b></span>
                        {d.avgWpm>0&&<span style={{fontSize:11,color:"#6b7280"}}>WPM: <b style={{color:"#f3f4f6"}}>{d.avgWpm}</b></span>}
                        {d.gameCount>=3&&<span style={{fontSize:11,color:trendColor,fontWeight:700}}>{trendIcon} {d.trend==="up"?t("tch_improving"):d.trend==="down"?t("tch_declining"):t("tch_stable")}</span>}
                        <button onClick={function(){setPrintStudent(d.name);}} style={{...GHOST,fontSize:10,padding:"3px 8px",marginLeft:"auto"}}>{t("tch_report")}</button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Assignments */}
              <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"20px 0 10px"}}>{t("tch_assignments")}</p>
              <div style={{...CARD,marginBottom:14}}>
                <div style={{display:"flex",gap:6,marginBottom:12}}>
                  {[{v:"library",label:t("tch_typeLibrary")},{v:"ai_topic",label:t("tch_typeAi")},{v:"custom_text",label:t("tch_typeCustom")}].map(function(t){return(
                    <button key={t.v} onClick={function(){setAssignType(t.v);setAssignMsg("");}} style={{flex:1,padding:"7px 0",borderRadius:10,border:"2px solid "+(assignType===t.v?"#f59e0b":"rgba(255,255,255,0.1)"),background:assignType===t.v?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.03)",color:assignType===t.v?"#fcd34d":"#6b7280",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t.label}</button>
                  );})}
                </div>

                {assignType==="library"?(
                  <select value={assignStoryId} onChange={function(e){setAssignStoryId(e.target.value);}} style={{...INP,margin:"0 0 8px",width:"100%",boxSizing:"border-box"}}>
                    <option value="">{t("tch_selectStory")}</option>
                    {["A1","A2","B1","B2","C1","C2"].map(function(lv){return(
                      <optgroup key={lv} label={lv+" — "+LEVELS.find(function(l){return l.key===lv;}).desc}>
                        {STORY_LIBRARY.filter(function(s){return s.level===lv;}).map(function(s){return(
                          <option key={s.id} value={s.id}>{s.title} · {SUBJECT_LABELS[getSubjectKey(s)]} · {SKILL_LEVEL[s.level]}</option>
                        );})}
                      </optgroup>
                    );})}
                  </select>
                ):assignType==="custom_text"?(
                  <div style={{marginBottom:8}}>
                    <textarea value={assignCustomText} onChange={function(e){setAssignCustomText(e.target.value.slice(0,3000));}} placeholder="Paste your passage here… (30–3000 characters). An AI quiz will be generated from your text." style={{...INP,width:"100%",boxSizing:"border-box",minHeight:90,resize:"vertical",marginBottom:4,fontFamily:"inherit",fontSize:12}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,color:"#6b7280"}}>{assignCustomText.length}/3000</span>
                      <select value={assignLevel} onChange={function(e){setAssignLevel(e.target.value);}} style={{...INP,margin:0,width:72}}>
                        {LEVELS.map(function(l){return<option key={l.key} value={l.key}>{l.key}</option>;})}
                      </select>
                    </div>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <input value={assignTopic} onChange={function(e){setAssignTopic(e.target.value);}} placeholder={t("tch_topicPlaceholder")} style={{...INP,flex:1,margin:0}}/>
                    <select value={assignLevel} onChange={function(e){setAssignLevel(e.target.value);}} style={{...INP,margin:0,width:72}}>
                      {LEVELS.map(function(l){return<option key={l.key} value={l.key}>{l.key}</option>;})}
                    </select>
                  </div>
                )}

                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="date" value={assignDue} onChange={function(e){setAssignDue(e.target.value);}} style={{...INP,margin:0,flex:1,colorScheme:"dark"}} title="Due date (optional)"/>
                  <button onClick={doCreateAssignment} disabled={assignLoading||(assignType==="library"&&!assignStoryId)||(assignType==="ai_topic"&&!assignTopic.trim())||(assignType==="custom_text"&&assignCustomText.trim().length<150)} style={{...mkBtn(assignLoading?"#374151":"#f59e0b","#0d0d1a"),padding:"10px 14px",fontSize:12,whiteSpace:"nowrap"}}>{assignLoading?t("tch_generating"):t("tch_assignBtn")}</button>
                </div>
                {assignMsg&&<p style={{fontSize:12,color:assignMsg.startsWith("✓")?"#34d399":"#f87171",margin:"8px 0 0"}}>{assignMsg}</p>}
              </div>

              {/* Existing assignments for this class */}
              {assignments.filter(function(a){return a.classId===cls.id;}).map(function(asgn){
                var total=students.length;
                var done=Object.keys(asgn.completions||{}).length;
                var pct=total>0?Math.round((done/total)*100):0;
                var avgScore=done>0?Math.round(Object.values(asgn.completions).reduce(function(s,c){return s+c.pct;},0)/done):0;
                return(
                  <div key={asgn.id} style={{...CARD,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{flex:1,paddingRight:8}}>
                        <div style={{fontSize:13,fontWeight:800,color:"#f3f4f6"}}>{asgn.topic}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{asgn.level} · {asgn.type==="ai_topic"?t("tch_typeAi"):asgn.type==="custom_text"?t("tch_typeCustom"):t("tch_typeLibrary")}{asgn.dueDate?" · "+t("tch_due")+" "+asgn.dueDate:""}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:900,color:pct===100?"#34d399":"#f59e0b"}}>{done}/{total}</div>
                        <div style={{fontSize:10,color:"#6b7280"}}>{t("tch_completed")}</div>
                      </div>
                    </div>
                    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:4,height:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:pct===100?"#34d399":"#f59e0b",transition:"width 0.3s"}}/>
                    </div>
                    {done>0&&<div style={{fontSize:11,color:"#6b7280",marginTop:6}}>{t("tch_classAvg")} <b style={{color:"#f3f4f6"}}>{avgScore}%</b></div>}
                  </div>
                );
              })}
              {assignments.filter(function(a){return a.classId===cls.id;}).length===0&&(
                <p style={{fontSize:12,color:"#4b5563",textAlign:"center",padding:"16px 0"}}>{t("tch_noAssignments")}</p>
              )}

              {/* Print report modal */}
              {printStudent&&(function(){
                var pu=allUsers.find(function(u){return u.name===printStudent;});
                var pg=pu&&pu.games?pu.games:[];
                var pavg=pg.length?Math.round(pg.reduce(function(s,g){return s+g.pct;},0)/pg.length):0;
                var pwpm=pg.filter(function(g){return g.wpm>0;}).length?Math.round(pg.filter(function(g){return g.wpm>0;}).reduce(function(s,g){return s+g.wpm;},0)/pg.filter(function(g){return g.wpm>0;}).length):0;
                var plv=getBestLevel(pg);
                var Q_TYPES_PR=["mcq","gap_word","gap_sentence","matching","heading","qa","tfnm","ynng"];
                return(
                  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={function(){setPrintStudent(null);setShareLink("");setShareLinkCopied(false);}}>
                    <div style={{background:"#1e1e2e",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:24,maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={function(e){e.stopPropagation();}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                        <div>
                          <div style={{fontSize:18,fontWeight:900,color:"#f3f4f6"}}>{printStudent}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{currentClass.name} · report by {currentUser.name}</div>
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={function(){var link=generateReportLink(printStudent);setShareLink(link);setShareLinkCopied(false);}} style={{...mkBtn("#34d399","#0d0d1a"),fontSize:12,padding:"8px 12px"}}>📤 Share</button>
                          <button onClick={function(){window.print();}} style={{...mkBtn("#6366f1"),fontSize:12,padding:"8px 12px"}}>🖨 Print</button>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                        {[{label:"Best Level",val:plv!=="none"?plv:"–",color:"#a78bfa"},{label:"Games",val:pg.length,color:"#34d399"},{label:"Avg Score",val:pg.length?pavg+"%":"–",color:"#f59e0b"}].map(function(s){return(
                          <div key={s.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                            <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
                            <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.label}</div>
                          </div>
                        );})}
                      </div>
                      {pwpm>0&&<div style={{fontSize:12,color:"#9ca3af",marginBottom:12}}>Reading speed: <b style={{color:"#f3f4f6"}}>{pwpm} WPM</b></div>}
                      <div style={{marginBottom:16}}>
                        <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:8}}>QUESTION TYPE BREAKDOWN</p>
                        {Q_TYPES_PR.map(function(t){
                          var tg=pg.filter(function(g){return g.typeStats&&g.typeStats[t]!==undefined;});
                          if(!tg.length)return null;
                          var ta=Math.round(tg.reduce(function(s,g){return s+(g.typeStats[t]||0);},0)/tg.length*100);
                          var col=ta<50?"#f87171":ta<70?"#f59e0b":"#34d399";
                          return(
                            <div key={t} style={{marginBottom:6}}>
                              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                                <span style={{color:"#d1d5db"}}>{qLabel(t)}</span>
                                <span style={{color:col,fontWeight:700}}>{ta}%</span>
                              </div>
                              <div style={{background:"rgba(0,0,0,0.3)",borderRadius:3,height:5}}>
                                <div style={{height:"100%",width:ta+"%",background:col,borderRadius:3}}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {shareLink&&(
                        <div style={{background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                          <p style={{fontSize:10,fontWeight:700,color:"#34d399",margin:"0 0 6px",letterSpacing:0.5}}>📤 SHAREABLE LINK (send to parents)</p>
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <input readOnly value={shareLink} style={{...INP,flex:1,margin:0,fontSize:10,padding:"6px 8px"}} onClick={function(e){e.target.select();}}/>
                            <button onClick={function(){try{navigator.clipboard.writeText(shareLink);}catch(e){}setShareLinkCopied(true);setTimeout(function(){setShareLinkCopied(false);},2500);}} style={{...mkBtn("#34d399","#0d0d1a"),fontSize:11,padding:"6px 10px",whiteSpace:"nowrap",flexShrink:0}}>{shareLinkCopied?"✓ Copied!":"Copy"}</button>
                          </div>
                        </div>
                      )}
                      <p style={{fontSize:11,color:"#4b5563",textAlign:"center",margin:0}}>Generated {todayKey()}</p>
                      <button onClick={function(){setPrintStudent(null);setShareLink("");}} style={{...GHOST,width:"100%",marginTop:14,fontSize:12}}>Close</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ── CLASS ANALYTICS ───────────────────────────────── */}
        {stage==="classAnalytics"&&currentClass&&currentUser&&(function(){
          var cls=currentClass;
          var students=cls.students||[];
          var clsAssignments=assignments.filter(function(a){return a.classId===cls.id;});
          var today=new Date();today.setHours(0,0,0,0);
          var stuData=students.map(function(sName){
            var u=allUsers.find(function(u){return u.name===sName;});
            var games=u&&u.games?u.games:[];
            var validGames=games.filter(function(g){return typeof g.pct==="number";});
            var avgPct=validGames.length?Math.round(validGames.reduce(function(s,g){return s+g.pct;},0)/validGames.length):null;
            var wpmGames=games.filter(function(g){return g.wpm>0;});
            var avgWpm=wpmGames.length?Math.round(wpmGames.reduce(function(s,g){return s+g.wpm;},0)/wpmGames.length):0;
            var bestLv=getBestLevel(games);
            var lastGame=games.length?games[games.length-1]:null;
            var daysSince=lastGame?(Math.round((today-new Date(lastGame.date))/(864e5))):null;
            var recent3=validGames.slice(-3);var prev3=validGames.slice(-6,-3);
            var rAvg=recent3.length?recent3.reduce(function(s,g){return s+g.pct;},0)/recent3.length:null;
            var pAvg=prev3.length?prev3.reduce(function(s,g){return s+g.pct;},0)/prev3.length:null;
            var trend=rAvg===null?"new":pAvg===null?"new":rAvg-pAvg>5?"up":rAvg-pAvg<-5?"down":"stable";
            var completedCount=clsAssignments.filter(function(a){return a.completions&&a.completions[sName];}).length;
            var typeAgg={};
            games.forEach(function(g){if(g.typeStats)Object.keys(g.typeStats).forEach(function(t){if(!typeAgg[t])typeAgg[t]={e:0,m:0};typeAgg[t].e+=g.typeStats[t].earned||0;typeAgg[t].m+=g.typeStats[t].max||0;});});
            var weakType=null;var weakPct=Infinity;
            Object.keys(typeAgg).forEach(function(t){var p=typeAgg[t].m>0?typeAgg[t].e/typeAgg[t].m:1;if(p<weakPct){weakPct=p;weakType=t;}});
            return{name:sName,games:games.length,avgPct:avgPct,avgWpm:avgWpm,bestLv:bestLv,daysSince:daysSince,trend:trend,completedCount:completedCount,weakType:weakType,weakPct:weakPct<Infinity?Math.round(weakPct*100):null};
          });
          var activeStudents=stuData.filter(function(d){return d.games>0;});
          var atRisk=stuData.filter(function(d){return d.daysSince===null||d.daysSince>=7;});
          var classAvgPct=activeStudents.length?Math.round(activeStudents.filter(function(d){return d.avgPct!==null;}).reduce(function(s,d){return s+d.avgPct;},0)/activeStudents.filter(function(d){return d.avgPct!==null;}).length):null;
          var lvDist={};stuData.forEach(function(d){if(d.bestLv!=="none"){lvDist[d.bestLv]=(lvDist[d.bestLv]||0)+1;}});
          var classTypeAgg={};
          activeStudents.forEach(function(d){
            var u=allUsers.find(function(u){return u.name===d.name;});
            var games=u&&u.games?u.games:[];
            games.forEach(function(g){if(g.typeStats)Object.keys(g.typeStats).forEach(function(t){if(!classTypeAgg[t])classTypeAgg[t]={e:0,m:0};classTypeAgg[t].e+=g.typeStats[t].earned||0;classTypeAgg[t].m+=g.typeStats[t].max||0;});});
          });
          var typeList=Object.keys(classTypeAgg).map(function(t){return{t:t,pct:classTypeAgg[t].m>0?Math.round(classTypeAgg[t].e/classTypeAgg[t].m*100):0,label:qLabel(t)};}).sort(function(a,b){return a.pct-b.pct;});
          return(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingTop:8}}>
                <button onClick={function(){setStage("classView");}} style={GHOST}>← Back</button>
                <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#06b6d4",flex:1}}>📊 {cls.name} Analytics</h2>
              </div>

              {/* top stats row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                {[
                  {label:"Students",val:students.length,col:"#a78bfa"},
                  {label:"Active",val:activeStudents.length,col:"#34d399"},
                  {label:"Class Avg",val:classAvgPct!==null?classAvgPct+"%":"–",col:classAvgPct>=70?"#34d399":classAvgPct>=50?"#f59e0b":"#f87171"},
                  {label:"At Risk",val:atRisk.length,col:atRisk.length>0?"#f87171":"#4b5563"},
                ].map(function(s){return(
                  <div key={s.label} style={{...CARD,textAlign:"center",padding:"12px 6px"}}>
                    <div style={{fontSize:20,fontWeight:900,color:s.col}}>{s.val}</div>
                    <div style={{fontSize:9,color:"#6b7280",marginTop:2,letterSpacing:0.5}}>{s.label.toUpperCase()}</div>
                  </div>
                );})}
              </div>

              {/* assignment completion matrix */}
              {clsAssignments.length>0&&(
                <div style={{...CARD,marginBottom:14,overflowX:"auto"}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"0 0 10px"}}>ASSIGNMENT COMPLETION</p>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:320}}>
                    <thead>
                      <tr>
                        <th style={{textAlign:"left",color:"#6b7280",fontWeight:600,padding:"4px 6px 8px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>Student</th>
                        {clsAssignments.map(function(a){return(
                          <th key={a.id} style={{textAlign:"center",color:"#6b7280",fontWeight:600,padding:"4px 4px 8px",borderBottom:"1px solid rgba(255,255,255,0.06)",maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={a.topic}>{a.topic.slice(0,8)}{a.topic.length>8?"…":""}</th>
                        );})}
                        <th style={{textAlign:"center",color:"#6b7280",fontWeight:600,padding:"4px 4px 8px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(function(sName){
                        var done=clsAssignments.filter(function(a){return a.completions&&a.completions[sName];}).length;
                        return(
                          <tr key={sName} style={{borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                            <td style={{padding:"6px 6px 6px 0",color:"#f3f4f6",fontWeight:600,whiteSpace:"nowrap"}}>{sName}</td>
                            {clsAssignments.map(function(a){
                              var c=a.completions&&a.completions[sName];
                              return(
                                <td key={a.id} style={{textAlign:"center",padding:"6px 4px"}}>
                                  {c?(
                                    <span title={c.pct+"%"} style={{display:"inline-block",width:22,height:22,borderRadius:"50%",background:"rgba(52,211,153,0.2)",border:"2px solid #34d399",fontSize:10,lineHeight:"20px",color:"#34d399",fontWeight:700}}>{c.pct}%</span>
                                  ):(
                                    <span style={{display:"inline-block",width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"2px solid rgba(255,255,255,0.08)"}}/>
                                  )}
                                </td>
                              );
                            })}
                            <td style={{textAlign:"center",padding:"6px 4px",fontWeight:700,color:done===clsAssignments.length?"#34d399":done>0?"#f59e0b":"#6b7280"}}>{done}/{clsAssignments.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* class weak areas */}
              {typeList.length>0&&(
                <div style={{...CARD,marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"0 0 10px"}}>CLASS WEAK AREAS (lowest first)</p>
                  {typeList.map(function(t){var col=t.pct<50?"#f87171":t.pct<70?"#f59e0b":"#34d399";return(
                    <div key={t.t} style={{marginBottom:7}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                        <span style={{color:"#d1d5db"}}>{t.label}</span>
                        <span style={{color:col,fontWeight:700}}>{t.pct}%</span>
                      </div>
                      <div style={{background:"rgba(0,0,0,0.3)",borderRadius:4,height:5}}>
                        <div style={{height:"100%",width:t.pct+"%",background:col,borderRadius:4,transition:"width 0.4s"}}/>
                      </div>
                    </div>
                  );})}
                </div>
              )}

              {/* level distribution */}
              {Object.keys(lvDist).length>0&&(
                <div style={{...CARD,marginBottom:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"0 0 10px"}}>LEVEL DISTRIBUTION</p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["A1","A2","B1","B2","C1","C2"].filter(function(lv){return lvDist[lv];}).map(function(lv){
                      var lvMeta=LEVELS.find(function(l){return l.key===lv;});
                      return(
                        <div key={lv} style={{flex:"1 1 auto",textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 8px",border:"1px solid "+(lvMeta?lvMeta.color+"44":"rgba(255,255,255,0.1)")}}>
                          <div style={{fontSize:18,fontWeight:900,color:lvMeta?lvMeta.color:"#f3f4f6"}}>{lvDist[lv]}</div>
                          <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{lv}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* per-student table */}
              <div style={{...CARD,marginBottom:14}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"0 0 10px"}}>PER-STUDENT BREAKDOWN</p>
                {stuData.map(function(d){
                  var trendIcon=d.trend==="up"?"📈":d.trend==="down"?"📉":d.trend==="stable"?"➡️":"🆕";
                  var lvMeta=LEVELS.find(function(l){return l.key===d.bestLv;});
                  var atRiskFlag=d.daysSince===null||d.daysSince>=7;
                  return(
                    <div key={d.name} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:13,fontWeight:700,color:"#f3f4f6"}}>{d.name}</span>
                          {atRiskFlag&&<span style={{fontSize:9,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,0.12)",borderRadius:4,padding:"1px 5px"}}>INACTIVE</span>}
                        </div>
                        <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>
                          {d.games} game{d.games!==1?"s":""}
                          {d.daysSince!==null?" · "+d.daysSince+"d ago":" · never played"}
                          {d.weakType&&d.weakPct<70?" · weak: "+qLabel(d.weakType)+" ("+d.weakPct+"%)":""}
                        </div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:900,color:lvMeta?lvMeta.color:"#4b5563"}}>{d.bestLv!=="none"?d.bestLv:"–"}</div>
                        <div style={{fontSize:11,color:d.avgPct!==null?(d.avgPct>=70?"#34d399":d.avgPct>=50?"#f59e0b":"#f87171"):"#4b5563"}}>{d.avgPct!==null?d.avgPct+"%":"–"} {d.games>=3?trendIcon:""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={function(){setStage("classView");}} style={{...GHOST,width:"100%"}}>← Back to Class</button>
            </div>
          );
        })()}

        {/* ── SHAREABLE REPORT ──────────────────────────────── */}
        {stage==="report"&&reportData&&(function(){
          var rd=reportData;
          var QLABELS_R={"mcq":"Multiple Choice","gap_word":"Vocabulary Fill","gap_sentence":"Sentence Fill","matching":"Matching","heading":"Headings","qa":"Open Response","tfnm":"True/False/Not Mentioned","ynng":"Yes/No/Not Given"};
          var trendColor=rd.tr==="improving"?"#16a34a":rd.tr==="declining"?"#dc2626":"#6b7280";
          var trendLabel=rd.tr==="improving"?"📈 Improving":rd.tr==="declining"?"📉 Needs Attention":"➡️ Steady";
          var levelDesc={A1:"Beginner",A2:"Elementary",B1:"Lower Intermediate",B2:"Upper Intermediate",C1:"Advanced",C2:"Mastery"};
          return(
            <div style={{background:"#fff",minHeight:"100vh",color:"#111827",padding:"24px 16px",fontFamily:"'Trebuchet MS','Inter',sans-serif"}}>
              <div style={{maxWidth:560,margin:"0 auto"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,paddingBottom:16,borderBottom:"2px solid #e5e7eb"}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:1,marginBottom:4}}>STUDENT PROGRESS REPORT</div>
                    <div style={{fontSize:24,fontWeight:900,color:"#111827",marginBottom:2}}>{rd.n}</div>
                    <div style={{fontSize:13,color:"#6b7280"}}>{rd.c&&rd.c+" · "}{rd.t&&"Teacher: "+rd.t}{rd.d&&" · "+rd.d}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:28,marginBottom:4}}>📖</div>
                    <div style={{fontSize:11,fontWeight:800,color:"#6366f1"}}>Reading Quest</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                  {[
                    {label:"CEFR Level",val:rd.l!=="none"?rd.l+" — "+(levelDesc[rd.l]||""):"Not yet assessed",color:"#6366f1"},
                    {label:"Stories Completed",val:rd.g+" session"+(rd.g!==1?"s":""),color:"#0891b2"},
                    {label:"Average Score",val:rd.g?rd.s+"%":"–",color:rd.s>=70?"#16a34a":rd.s>=50?"#d97706":"#dc2626"},
                    {label:"Reading Speed",val:rd.w>0?rd.w+" words/min":"Not tracked",color:"#7c3aed"},
                  ].map(function(s){return(
                    <div key={s.label} style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 16px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:0.8,marginBottom:4}}>{s.label}</div>
                      <div style={{fontSize:16,fontWeight:900,color:s.color,lineHeight:1.2}}>{s.val}</div>
                    </div>
                  );})}
                </div>
                <div style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:0.8,marginBottom:6}}>RECENT TREND</div>
                  <div style={{fontSize:18,fontWeight:900,color:trendColor}}>{trendLabel}</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>{rd.tr==="improving"?"Performance is improving over recent sessions — great progress!":rd.tr==="declining"?"Scores have dipped recently — some extra practice would help.":"Performance is consistent across recent sessions."}</div>
                </div>
                {Object.keys(rd.q).length>0&&(
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#374151",letterSpacing:0.8,marginBottom:10}}>SKILL BREAKDOWN</div>
                    {Object.keys(rd.q).map(function(t){
                      var pct=rd.q[t];
                      var col=pct>=70?"#16a34a":pct>=50?"#d97706":"#dc2626";
                      return(
                        <div key={t} style={{marginBottom:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                            <span style={{color:"#374151"}}>{QLABELS_R[t]||t}</span>
                            <span style={{color:col,fontWeight:700}}>{pct}%</span>
                          </div>
                          <div style={{background:"#e5e7eb",borderRadius:3,height:6}}>
                            <div style={{height:"100%",width:pct+"%",background:col,borderRadius:3}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {rd.r&&rd.r.length>0&&(
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#374151",letterSpacing:0.8,marginBottom:8}}>RECENT SESSIONS</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead><tr style={{background:"#f3f4f6"}}>{["Date","Level","Score"].map(function(h){return(<th key={h} style={{padding:"7px 10px",textAlign:"left",fontWeight:700,color:"#6b7280",borderBottom:"1px solid #e5e7eb"}}>{h}</th>);})}</tr></thead>
                      <tbody>{rd.r.slice().reverse().map(function(g,i){return(<tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}><td style={{padding:"7px 10px",color:"#374151"}}>{g.d}</td><td style={{padding:"7px 10px",color:"#6366f1",fontWeight:700}}>{g.l}</td><td style={{padding:"7px 10px",color:g.p>=70?"#16a34a":g.p>=50?"#d97706":"#dc2626",fontWeight:700}}>{g.p}%</td></tr>);})}</tbody>
                    </table>
                  </div>
                )}
                <div style={{borderTop:"1px solid #e5e7eb",paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:11,color:"#9ca3af"}}>Generated by Reading Quest · {rd.d}</div>
                  <button onClick={function(){window.print();}} style={{background:"#6366f1",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontFamily:"inherit",fontSize:12,fontWeight:700,cursor:"pointer"}}>🖨 Print Report</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── PORTFOLIO (logged-in) ──────────────────────────── */}
        {stage==="portfolio"&&currentUser&&(function(){
          var pg=currentUser.games||[];
          var bestPct=pg.length?Math.max.apply(null,pg.map(function(g){return g.pct;})):0;
          var wpmGames=pg.filter(function(g){return g.wpm>0;});
          var bestWpm=wpmGames.length?Math.max.apply(null,wpmGames.map(function(g){return g.wpm;})):0;
          var topicCounts={};pg.forEach(function(g){if(g.topic)topicCounts[g.topic]=(topicCounts[g.topic]||0)+1;});
          var favTopic=Object.keys(topicCounts).sort(function(a,b){return topicCounts[b]-topicCounts[a];})[0]||null;
          var favSubj=favTopic?(SUBJECT_LABELS[SUBJECT_MAP[favTopic]]||"🏠 Life"):"—";
          var lvBreak=["A1","A2","B1","B2","C1","C2"].map(function(lv){var lvg=pg.filter(function(g){return g.level===lv;});return{l:lv,c:lvg.length,a:lvg.length?Math.round(lvg.reduce(function(s,g){return s+g.pct;},0)/lvg.length):0};}).filter(function(x){return x.c>0;});
          var totalXpP=currentUser.totalXp||0;
          var bestLvl=getBestLevel(pg);
          var lvObj2=getLv(bestLvl);
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:16}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#a78bfa"}}>{t("myPortfolio")}</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>{t("back")}</button>
              </div>
              {/* identity card */}
              <div style={{...CARD,marginBottom:12,padding:16,background:"linear-gradient(135deg,rgba(99,102,241,0.12),rgba(167,139,250,0.06))",borderColor:"rgba(99,102,241,0.35)"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,"+lvObj2.color+",rgba(255,255,255,0.1))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                    {currentUser.name.slice(0,1).toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:18,fontWeight:900,color:"#f3f4f6"}}>{currentUser.name}</div>
                    <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                      <span style={{...pill(lvObj2.color+"26",lvObj2.color),fontSize:11,fontWeight:700}}>{bestLvl!=="none"?bestLvl+" · "+lvObj2.desc:t("noGamesYet")}</span>
                      <span style={{...pill("rgba(251,191,36,0.15)","#fbbf24"),fontSize:11}}>🔥 {longestStreak}-day best streak</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* personal records grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {icon:"🎯",label:"Best Score",val:pg.length?bestPct+"%":"—",col:"#34d399"},
                  {icon:"⚡",label:"Best WPM",val:bestWpm>0?bestWpm+" wpm":"—",col:"#06b6d4"},
                  {icon:"🔥",label:"Longest Streak",val:longestStreak+" days",col:"#fbbf24"},
                  {icon:"📚",label:"Top Subject",val:favSubj,col:"#a78bfa"},
                  {icon:"⭐",label:"Total XP",val:totalXpP.toLocaleString(),col:"#f472b6"},
                  {icon:"📖",label:"Sessions",val:pg.length+"",col:"#a78bfa"},
                ].map(function(s){return(
                  <div key={s.label} style={{...CARD,padding:"12px 14px"}}>
                    <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
                    <div style={{fontSize:9,fontWeight:700,color:"#6b7280",letterSpacing:0.8,marginBottom:2}}>{s.label.toUpperCase()}</div>
                    <div style={{fontSize:15,fontWeight:900,color:s.col,lineHeight:1.2}}>{s.val}</div>
                  </div>
                );})}
              </div>
              {/* level breakdown bars */}
              {lvBreak.length>0&&(
                <div style={{...CARD,marginBottom:12,padding:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"0 0 10px"}}>LEVEL BREAKDOWN</p>
                  {lvBreak.map(function(x){var lc=getLv(x.l).color;return(
                    <div key={x.l} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                        <span style={{color:lc,fontWeight:700}}>{x.l} <span style={{color:"#6b7280",fontWeight:400}}>· {x.c} session{x.c!==1?"s":""}</span></span>
                        <span style={{color:pctColor(x.a),fontWeight:700}}>{x.a}%</span>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:6}}>
                        <div style={{height:"100%",width:x.a+"%",background:lc,borderRadius:999,transition:"width 0.5s ease"}}/>
                      </div>
                    </div>
                  );})}
                </div>
              )}
              {/* share */}
              <div style={{...CARD,marginBottom:12,padding:14}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"0 0 10px"}}>SHARE YOUR PORTFOLIO</p>
                <button onClick={function(){var lnk=generatePortfolioLink();setPortfolioLink(lnk);setPortfolioLinkCopied(false);}} style={{...mkBtn("#6366f1"),width:"100%",fontSize:13,padding:"10px"}}>🔗 Generate Share Link</button>
                {portfolioLink&&(
                  <div style={{marginTop:10}}>
                    <div style={{display:"flex",gap:6}}>
                      <input readOnly value={portfolioLink} style={{flex:1,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#9ca3af",fontSize:11,padding:"7px 10px",outline:"none",fontFamily:"monospace"}}/>
                      <button onClick={function(){try{navigator.clipboard.writeText(portfolioLink);}catch(e){}setPortfolioLinkCopied(true);setTimeout(function(){setPortfolioLinkCopied(false);},2000);}} style={{...mkBtn(portfolioLinkCopied?"#34d399":"#6366f1"),padding:"7px 12px",fontSize:12,flexShrink:0}}>{portfolioLinkCopied?"✓":"Copy"}</button>
                    </div>
                    <p style={{fontSize:10,color:"#6b7280",marginTop:6}}>Anyone with this link can view your portfolio — no login needed.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── ROOM ENTRY (F7b — create or join) ───────────────── */}
        {stage==="roomEntry"&&(function(){
          var roomHist=loadRoomHistory();
          function fmtAgo(ms){
            var diff=Date.now()-ms;
            if(diff<60000)return t("room_time_now");
            if(diff<3600000)return t("room_time_min").replace("{n}",Math.floor(diff/60000));
            return t("room_time_hour").replace("{n}",Math.floor(diff/3600000));
          }
          return(
            <div style={{minHeight:"100vh",background:"#0d0d1a",padding:"20px 16px 80px"}}>
              <div style={{maxWidth:520,margin:"0 auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <button onClick={function(){setStage(currentUser?"home":"auth");}} style={{...GHOST,fontSize:12,padding:"6px 12px"}}>← Back</button>
                  <h1 style={{flex:1,margin:0,fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800,color:"#34d399",textAlign:"center"}}>🏫 Group Room</h1>
                  <div style={{width:60}}/>
                </div>

                {/* Join card */}
                <div style={{...CARD,marginBottom:14,borderColor:"rgba(52,211,153,0.35)"}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#5af0b3",letterSpacing:0.6,margin:"0 0 10px"}}>JOIN AN EXISTING ROOM</p>
                  <input
                    placeholder="6-CHAR CODE (e.g. KQ7AT2)"
                    value={roomEntryCode}
                    maxLength={8}
                    onChange={function(e){setRoomEntryCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));}}
                    style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:18,letterSpacing:"0.18em",textAlign:"center",fontWeight:800}}
                  />
                  {!currentUser&&(
                    <input
                      placeholder="Your display name (link guests only)"
                      value={roomEntryName}
                      maxLength={40}
                      onChange={function(e){setRoomEntryName(e.target.value);}}
                      style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 10px"}}
                    />
                  )}
                  <button disabled={!roomEntryCode||roomLoading} onClick={function(){joinRoom(roomEntryCode,roomEntryName);}} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",padding:"11px",fontSize:13,fontWeight:800,letterSpacing:"0.06em"}}>{roomLoading?"Joining…":"Join Room →"}</button>
                </div>

                {/* Recent rooms — rejoin in one tap, prunes anything older
                    than 24h or that the server has already expired. */}
                {roomHist.length>0&&(
                  <div style={{...CARD,marginBottom:14,borderColor:"rgba(96,165,250,0.3)"}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#60a5fa",letterSpacing:0.6,margin:"0 0 8px"}}>🕒 {t("room_recent_title")}</p>
                    {roomHist.map(function(h){
                      var roleLbl=h.role==="owner"?t("room_role_owner"):t("room_role_participant");
                      var roleClr=h.role==="owner"?"#c4b5fd":"#5af0b3";
                      return(
                        <button key={h.code} disabled={roomLoading} onClick={function(){joinRoom(h.code,roomEntryName);}} style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"10px 12px",margin:"0 0 8px",borderRadius:12,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#e3e0f4",cursor:roomLoading?"wait":"pointer",fontFamily:"inherit",textAlign:"left",transition:"border-color 0.15s"}}
                          onMouseEnter={function(e){e.currentTarget.style.borderColor="rgba(96,165,250,0.4)";}}
                          onMouseLeave={function(e){e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
                          <div style={{flexShrink:0,fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:800,letterSpacing:"0.1em",color:"#60a5fa",background:"rgba(96,165,250,0.08)",padding:"6px 10px",borderRadius:8}}>{h.code}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,color:"#e3e0f4",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.topic||(h.level+" room")}</div>
                            <div style={{fontSize:10,color:"rgba(227,224,244,0.5)",marginTop:2}}>
                              <span style={{color:roleClr,fontWeight:700}}>{roleLbl}</span>
                              {" · "}<span>{h.level}</span>
                              {" · "}<span>{fmtAgo(h.lastSeen)}</span>
                            </div>
                          </div>
                          <div style={{flexShrink:0,fontSize:16,color:"#60a5fa"}}>›</div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Create card — auth required (so we know who the owner is) */}
                {currentUser&&(
                  <div style={{...CARD,borderColor:"rgba(167,139,250,0.35)"}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#c4b5fd",letterSpacing:0.6,margin:"0 0 10px"}}>OR CREATE A NEW ROOM</p>
                    <p style={{fontSize:12,color:"#9ca3af",margin:"0 0 10px",lineHeight:1.5}}>Generates a fresh passage + question at your current level ({level||"B1"}). Share the 6-char code or the room URL with classmates.</p>
                    <input
                      placeholder="Optional topic (e.g. 'space exploration')"
                      value={roomCreateTopic}
                      maxLength={80}
                      onChange={function(e){setRoomCreateTopic(e.target.value);}}
                      style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 10px"}}
                    />
                    <button disabled={roomLoading} onClick={createRoom} style={{...mkBtn("#a78bfa","#0d0d1a"),width:"100%",padding:"11px",fontSize:13,fontWeight:800,letterSpacing:"0.06em"}}>{roomLoading?"Creating room…":"Create Room →"}</button>
                  </div>
                )}
                {roomMsg&&<p style={{fontSize:12,color:"#f87171",margin:"12px 0 0",textAlign:"center"}}>{roomMsg}</p>}
              </div>
            </div>
          );
        })()}

        {/* ── ROOM (F7b — read + answer + live participants) ───── */}
        {stage==="room"&&roomState&&(function(){
          var r=roomState;
          var me=r.participants&&r.participants[roomMyName];
          var hasAnswered=me&&typeof me.answerIdx==="number";
          var isCorrect=hasAnswered&&me.correct;
          var pList=Object.keys(r.participants||{}).map(function(n){return Object.assign({name:n},r.participants[n]);});
          var answeredCount=pList.filter(function(p){return typeof p.answerIdx==="number";}).length;
          var pUrl=window.location.origin+window.location.pathname+"?room="+r.code;
          return(
            <div style={{minHeight:"100vh",background:"#0d0d1a",padding:"16px 16px 80px"}}>
              <div style={{maxWidth:560,margin:"0 auto"}}>
                {/* Top bar with code + share + exit */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                  <button onClick={function(){if(window.confirm("Leave this room? Your answer will stay recorded.")){setRoomState(null);setRoomCode("");setRoomMyName("");setStage(currentUser?"home":"auth");}}} style={{...GHOST,fontSize:12,padding:"6px 10px"}}>← Leave</button>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:800,color:"#5af0b3",letterSpacing:"0.18em"}}>{r.code}</div>
                    <div style={{fontSize:10,color:"#6b7280",letterSpacing:"0.08em"}}>{r.ownerType==="teacher"?"TEACHER ROOM":"STUDY GROUP"} · {r.level}</div>
                  </div>
                  <button onClick={function(){try{navigator.clipboard.writeText(pUrl);setRoomMsg("Link copied");setTimeout(function(){setRoomMsg("");},1500);}catch(e){setRoomMsg(pUrl);}}} style={{...GHOST,fontSize:11,padding:"6px 10px"}}>🔗 Share</button>
                </div>
                {roomMsg&&<p style={{fontSize:11,color:"#a78bfa",textAlign:"center",margin:"0 0 10px"}}>{roomMsg}</p>}

                {/* Participants chip row */}
                <div style={{...CARD,padding:"10px 12px",marginBottom:12,background:"rgba(99,102,241,0.06)",borderColor:"rgba(99,102,241,0.3)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:11,color:"#a78bfa",marginBottom:6,letterSpacing:"0.06em",fontWeight:700}}>
                    <span>👥 {pList.length} {pList.length===1?"PARTICIPANT":"PARTICIPANTS"}</span>
                    <span>{answeredCount}/{pList.length} ANSWERED</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {pList.map(function(p){
                      var color=typeof p.answerIdx==="number"?(p.correct?"#34d399":"#f87171"):"rgba(227,224,244,0.5)";
                      var bg=typeof p.answerIdx==="number"?(p.correct?"rgba(52,211,153,0.14)":"rgba(239,68,68,0.12)"):"rgba(255,255,255,0.04)";
                      return<span key={p.name} style={{padding:"3px 10px",borderRadius:999,background:bg,color:color,fontSize:11,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>{p.name===roomMyName?"⭐ "+p.name+" (you)":p.name}{typeof p.answerIdx==="number"?(p.correct?" ✓":" ✕"):" …"}</span>;
                    })}
                  </div>
                </div>

                {/* Passage */}
                <div style={{...CARD,padding:"18px",marginBottom:14}}>
                  {r.topic&&<div style={{fontSize:10,color:"#5af0b3",fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>{r.topic}</div>}
                  <p style={{fontFamily:"'Newsreader','Inter',serif",fontSize:17,lineHeight:1.65,color:"rgba(227,224,244,0.93)",margin:0}}>{r.passage}</p>
                </div>

                {/* Question + options */}
                <div style={{...CARD,padding:"18px",marginBottom:14}}>
                  <p style={{fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:700,color:"#e3e0f4",margin:"0 0 14px"}}>{r.question.q}</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {r.question.options.map(function(opt,i){
                      var disabled=hasAnswered;
                      var isPicked=hasAnswered&&me.answerIdx===i;
                      var isRight=hasAnswered&&i===r.question.answer;
                      var bg="rgba(255,255,255,0.04)";var bd="rgba(255,255,255,0.10)";var fg="rgba(227,224,244,0.85)";
                      if(hasAnswered){
                        if(isRight){bg="rgba(52,211,153,0.14)";bd="rgba(52,211,153,0.55)";fg="#5af0b3";}
                        else if(isPicked){bg="rgba(239,68,68,0.12)";bd="rgba(239,68,68,0.5)";fg="#fca5a5";}
                      }
                      return<button key={i} disabled={disabled} onClick={function(){submitRoomAnswer(i);}} style={{display:"flex",alignItems:"flex-start",gap:10,background:bg,border:"1px solid "+bd,borderRadius:14,padding:"12px 14px",textAlign:"left",color:fg,cursor:disabled?"default":"pointer",fontFamily:"'Inter',sans-serif",fontSize:14,lineHeight:1.4,transition:"all 0.15s"}}>
                        <span style={{flexShrink:0,width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:800,color:fg==="rgba(227,224,244,0.85)"?"rgba(227,224,244,0.6)":fg}}>{String.fromCharCode(65+i)}</span>
                        <span style={{flex:1}}>{opt}</span>
                      </button>;
                    })}
                  </div>
                  {hasAnswered&&r.question.explanation&&(
                    <div style={{marginTop:14,padding:"11px 14px",borderRadius:12,background:isCorrect?"rgba(52,211,153,0.08)":"rgba(99,102,241,0.08)",border:"1px solid "+(isCorrect?"rgba(52,211,153,0.3)":"rgba(99,102,241,0.3)")}}>
                      <span style={{fontSize:10,color:isCorrect?"#5af0b3":"#a78bfa",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginRight:8}}>{isCorrect?"Correct":"Heads-up"}</span>
                      <span style={{fontSize:12,color:"rgba(227,224,244,0.85)",lineHeight:1.5}}>{r.question.explanation}</span>
                    </div>
                  )}
                </div>

                {/* ── F7c — Live leaderboard ──────────────────────────
                    Shows once anyone has answered. Ranks by correct
                    first, then fastest. Highlights the current user. */}
                {(function(){
                  var finished=pList.filter(function(p){return typeof p.answerIdx==="number";});
                  if(!finished.length)return null;
                  var sorted=finished.slice().sort(function(a,b){
                    if(!!b.correct-!!a.correct!==0)return(!!b.correct)-(!!a.correct);
                    return(a.elapsedMs||0)-(b.elapsedMs||0);
                  });
                  var allDone=finished.length===pList.length&&pList.length>1;
                  return(
                    <div style={{...CARD,padding:"16px",marginBottom:14,borderColor:allDone?"rgba(251,191,36,0.45)":"rgba(255,255,255,0.08)",background:allDone?"linear-gradient(135deg,rgba(251,191,36,0.08),rgba(52,211,153,0.04))":"rgba(30,30,44,0.55)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span style={{fontSize:18}}>{allDone?"🏆":"📊"}</span>
                        <span style={{fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:800,color:allDone?"#fbbf24":"#e3e0f4",letterSpacing:"0.06em"}}>{allDone?"FINAL LEADERBOARD":"LIVE LEADERBOARD"}</span>
                        <span style={{marginLeft:"auto",fontSize:10,color:"#6b7280",letterSpacing:"0.08em"}}>{finished.length}/{pList.length}</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {sorted.map(function(p,i){
                          var medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)+".";
                          var isMe=p.name===roomMyName;
                          var fg=p.correct?"#5af0b3":"#f87171";
                          var bg=isMe?"rgba(251,191,36,0.10)":"rgba(255,255,255,0.03)";
                          var bd=isMe?"rgba(251,191,36,0.4)":"rgba(255,255,255,0.06)";
                          var sec=p.elapsedMs?Math.max(0,Math.round(p.elapsedMs/100)/10).toFixed(1)+"s":"–";
                          return(
                            <div key={p.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:bg,border:"1px solid "+bd}}>
                              <span style={{width:24,fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:13,color:i<3?"#fbbf24":"#6b7280",textAlign:"center"}}>{medal}</span>
                              <span style={{flex:1,fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:isMe?800:600,color:isMe?"#fbbf24":"#e3e0f4"}}>{p.name}{isMe?" (you)":""}</span>
                              <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:fg,fontWeight:700}}>{p.correct?"✓":"✕"} {sec}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {/* ── TEACHER DIRECTORY SEARCH (F6c) ──────────────────── */}
        {stage==="teacherSearch"&&(function(){
          return(
            <div style={{minHeight:"100vh",background:"#0d0d1a",padding:"20px 16px 80px"}}>
              <div style={{maxWidth:560,margin:"0 auto"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                  <button onClick={function(){setStage("home");}} style={{...GHOST,fontSize:12,padding:"6px 12px"}}>← {t("back")}</button>
                  <h1 style={{flex:1,margin:0,fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800,color:"#f472b6",textAlign:"center"}}>{t("tch_findTeachers")}</h1>
                  <div style={{width:60}}/>
                </div>
                <input
                  autoFocus
                  placeholder={t("tch_search_ph")}
                  value={teacherSearchQuery}
                  onChange={function(e){onTeacherSearchInput(e.target.value);}}
                  style={{...INP,width:"100%",boxSizing:"border-box",margin:"0 0 14px",padding:"12px 14px",fontSize:14}}
                />
                {teacherSearchLoading&&(
                  <div style={{textAlign:"center",padding:"24px 0",fontSize:12,color:"#6b7280"}}>{t("tch_search_loading")}</div>
                )}
                {!teacherSearchLoading&&teacherSearchResults.length===0&&(
                  <div style={{...CARD,textAlign:"center",padding:36,color:"#6b7280"}}>
                    {teacherSearchQuery?t("tch_search_noResults"):t("tch_search_typeHint")}
                  </div>
                )}
                {!teacherSearchLoading&&teacherSearchResults.length>0&&(
                  <>
                    <p style={{fontSize:11,color:"#6b7280",margin:"0 0 10px",letterSpacing:"0.08em"}}>{teacherSearchTotal} {teacherSearchTotal===1?t("tch_search_teacher"):t("tch_search_teachers")}{teacherSearchTotal>teacherSearchResults.length?" · "+t("tch_search_showingTop").replace("{n}",teacherSearchResults.length):""}</p>
                    {teacherSearchResults.map(function(t){
                      var initial=(t.displayName||t.name||"?")[0].toUpperCase();
                      return(
                        <button key={t.name} onClick={function(){loadPublicTeacherProfile(t.name);setStage("teacherProfile");}} style={{display:"flex",alignItems:"flex-start",gap:12,width:"100%",padding:"14px 16px",margin:"0 0 10px",background:"rgba(30,30,44,0.55)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s"}}
                          onMouseEnter={function(e){e.currentTarget.style.borderColor="rgba(244,114,182,0.4)";e.currentTarget.style.background="rgba(244,114,182,0.06)";}}
                          onMouseLeave={function(e){e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.background="rgba(30,30,44,0.55)";}}>
                          <div style={{flexShrink:0,width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#f472b6,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#0d0d1a"}}>{initial}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:800,color:"#e3e0f4",marginBottom:2}}>{t.displayName||t.name}</div>
                            <div style={{fontSize:11,color:"rgba(227,224,244,0.5)",marginBottom:4}}>@{t.name}</div>
                            {t.bio&&<div style={{fontSize:12,color:"rgba(227,224,244,0.7)",lineHeight:1.45,marginBottom:6,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{t.bio}</div>}
                            {(t.subjects.length>0||t.languages.length>0)&&(
                              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                {t.subjects.slice(0,3).map(function(s){return<span key={"s-"+s} style={{background:"rgba(244,114,182,0.12)",color:"#f472b6",borderRadius:999,padding:"2px 8px",fontSize:10,fontWeight:600}}>{s}</span>;})}
                                {t.languages.slice(0,3).map(function(l){return<span key={"l-"+l} style={{background:"rgba(167,139,250,0.12)",color:"#a78bfa",borderRadius:999,padding:"2px 8px",fontSize:10,fontWeight:600}}>🌐 {l}</span>;})}
                              </div>
                            )}
                          </div>
                          <div style={{flexShrink:0,fontSize:18,color:"#f472b6"}}>›</div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── PUBLIC TEACHER PROFILE (F6b) ────────────────────── */}
        {stage==="teacherProfile"&&(function(){
          var p=viewedTeacher;
          var isSubscribed=p&&currentUser&&social[currentUser.name]&&(social[currentUser.name].subscribed||[]).indexOf(p.name)!==-1;
          var isOwnProfile=p&&currentUser&&p.name===currentUser.name;
          return(
            <div style={{minHeight:"100vh",background:"#0d0d1a",padding:"24px 18px 64px",fontFamily:"'Inter',sans-serif"}}>
              <div style={{maxWidth:540,margin:"0 auto"}}>
                <button onClick={function(){setViewedTeacher(null);setViewedTeacherErr("");setStage(currentUser?"home":"auth");}} style={{...GHOST,fontSize:12,marginBottom:14}}>← {t("back")}</button>
                {viewedTeacherErr&&(
                  <div style={{...CARD,textAlign:"center",padding:32}}>
                    <div style={{fontSize:48,marginBottom:10}}>🔒</div>
                    <p style={{color:"#9ca3af",fontSize:13,margin:0}}>{viewedTeacherErr}</p>
                  </div>
                )}
                {!viewedTeacherErr&&!p&&(
                  <div style={{...CARD,textAlign:"center",padding:32,color:"#6b7280"}}>{t("tch_profile_loading")}</div>
                )}
                {p&&(
                  <div>
                    <div style={{...CARD,padding:24,borderColor:"rgba(244,114,182,0.35)",background:"linear-gradient(135deg,rgba(244,114,182,0.08),rgba(167,139,250,0.05))",marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                        <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#f472b6,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#0d0d1a",boxShadow:"0 6px 20px rgba(244,114,182,0.35)"}}>{(p.displayName||p.name||"?")[0].toUpperCase()}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <h1 style={{margin:0,fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:800,color:"#e3e0f4"}}>{p.displayName||p.name}</h1>
                          <p style={{margin:"3px 0 0",fontSize:12,color:"rgba(227,224,244,0.55)"}}>@{p.name}</p>
                        </div>
                      </div>
                      {p.bio&&<p style={{fontSize:14,lineHeight:1.55,color:"rgba(227,224,244,0.85)",margin:"0 0 14px"}}>{p.bio}</p>}
                      <div style={{display:"flex",gap:16,flexWrap:"wrap",margin:"0 0 14px"}}>
                        <div><div style={{fontSize:20,fontWeight:800,color:"#f472b6",fontFamily:"'Outfit',sans-serif"}}>{p.classCount||0}</div><div style={{fontSize:10,color:"rgba(227,224,244,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{t("tch_profile_classes")}</div></div>
                        <div><div style={{fontSize:20,fontWeight:800,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>{p.studentCount||0}</div><div style={{fontSize:10,color:"rgba(227,224,244,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{t("tch_profile_students")}</div></div>
                        {social[p.name]&&social[p.name].subscribers&&<div><div style={{fontSize:20,fontWeight:800,color:"#5af0b3",fontFamily:"'Outfit',sans-serif"}}>{(social[p.name].subscribers||[]).length}</div><div style={{fontSize:10,color:"rgba(227,224,244,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700}}>{t("tch_profile_subscribers")}</div></div>}
                      </div>
                      {(p.languages.length>0||p.subjects.length>0)&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                          {p.subjects.map(function(s){return<span key={"sub-"+s} style={{background:"rgba(244,114,182,0.15)",color:"#f472b6",border:"1px solid rgba(244,114,182,0.3)",borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:600}}>{s}</span>;})}
                          {p.languages.map(function(l){return<span key={"lang-"+l} style={{background:"rgba(167,139,250,0.15)",color:"#a78bfa",border:"1px solid rgba(167,139,250,0.3)",borderRadius:999,padding:"3px 10px",fontSize:11,fontWeight:600}}>🌐 {l}</span>;})}
                        </div>
                      )}
                      {!isOwnProfile&&currentUser&&(
                        <>
                          <button onClick={function(){isSubscribed?unsubscribeFromTeacher(p.name):subscribeToTeacher(p.name);}} style={{...mkBtn(isSubscribed?"#6b7280":"#f472b6"),width:"100%",padding:"11px 16px",fontSize:13,fontWeight:800,letterSpacing:"0.04em"}}>{isSubscribed?t("tch_profile_subscribed"):t("tch_profile_subscribe")}</button>
                          {isSubscribed&&<p style={{fontSize:10,color:"rgba(227,224,244,0.45)",margin:"5px 0 0",textAlign:"center"}}>{t("tch_profile_unfollowHint")}</p>}
                        </>
                      )}
                      {!currentUser&&(
                        <button onClick={function(){setStage("auth");}} style={{...mkBtn("#f472b6"),width:"100%",padding:"11px 16px",fontSize:13,fontWeight:800}}>{t("tch_profile_loginToSubscribe")}</button>
                      )}
                      {isOwnProfile&&(
                        <p style={{fontSize:11,color:"rgba(227,224,244,0.5)",margin:"6px 0 0",textAlign:"center"}}>{t("tch_profile_ownProfile")}</p>
                      )}
                      {subscribeMsg&&<p style={{fontSize:11,color:subscribeMsg.indexOf("✓")===0?"#5af0b3":"#f87171",margin:"6px 0 0",textAlign:"center"}}>{subscribeMsg}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── PORTFOLIO SHARE (URL standalone) ──────────────── */}
        {stage==="portfolioShare"&&portfolioShareData&&(function(){
          var pd=portfolioShareData;
          var lvObj3=getLv(pd.lv||"none");
          return(
            <div style={{minHeight:"100vh",background:"#f9fafb",padding:"24px 16px",fontFamily:"'Outfit',sans-serif",color:"#111"}}>
              <div style={{maxWidth:480,margin:"0 auto"}}>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:32,marginBottom:4}}>🏆</div>
                  <h1 style={{margin:0,fontSize:22,fontWeight:900,color:"#111"}}>{pd.n}'s Portfolio</h1>
                  <p style={{fontSize:13,color:"#6b7280",margin:"4px 0 0"}}>Reading Quest · {pd.d}</p>
                </div>
                <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"16px 20px",marginBottom:16}}>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    {pd.lv!=="none"&&<span style={{background:lvObj3.color+"20",color:lvObj3.color,fontWeight:800,fontSize:12,padding:"3px 10px",borderRadius:99}}>{pd.lv}</span>}
                    {pd.fs&&<span style={{background:"#f3f4f6",color:"#374151",fontSize:12,padding:"3px 10px",borderRadius:99}}>{pd.fs}</span>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
                    {[
                      {label:"Best Score",val:pd.bs+"%",col:pd.bs>=70?"#16a34a":pd.bs>=50?"#d97706":"#dc2626"},
                      {label:"Best WPM",val:pd.bw>0?pd.bw+" wpm":"—",col:"#0891b2"},
                      {label:"Longest Streak",val:pd.ls+" days",col:"#d97706"},
                      {label:"Sessions",val:pd.g+"",col:"#7c3aed"},
                      {label:"Total XP",val:(pd.xp||0).toLocaleString(),col:"#db2777"},
                    ].map(function(s){return(
                      <div key={s.label} style={{background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:9,fontWeight:700,color:"#9ca3af",letterSpacing:0.8}}>{s.label.toUpperCase()}</div>
                        <div style={{fontSize:15,fontWeight:900,color:s.col,marginTop:2}}>{s.val}</div>
                      </div>
                    );})}
                  </div>
                </div>
                {pd.lb&&pd.lb.length>0&&(
                  <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,padding:"16px 20px",marginBottom:16}}>
                    <p style={{fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:0.8,margin:"0 0 10px"}}>CEFR LEVEL BREAKDOWN</p>
                    {pd.lb.map(function(x){var col=x.a>=70?"#16a34a":x.a>=50?"#d97706":"#dc2626";return(
                      <div key={x.l} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                          <span style={{color:"#374151",fontWeight:700}}>{x.l} <span style={{color:"#9ca3af",fontWeight:400}}>· {x.c} session{x.c!==1?"s":""}</span></span>
                          <span style={{color:col,fontWeight:700}}>{x.a}%</span>
                        </div>
                        <div style={{background:"#e5e7eb",borderRadius:3,height:6}}>
                          <div style={{height:"100%",width:x.a+"%",background:col,borderRadius:3}}/>
                        </div>
                      </div>
                    );})}
                  </div>
                )}
                <div style={{textAlign:"center",padding:"16px 0",borderTop:"1px solid #e5e7eb"}}>
                  <p style={{fontSize:13,color:"#6b7280",margin:"0 0 10px"}}>Want to build your own reading portfolio?</p>
                  <a href={window.location.origin+window.location.pathname} style={{display:"inline-block",background:"#6366f1",color:"#fff",fontWeight:700,fontSize:14,padding:"10px 24px",borderRadius:10,textDecoration:"none"}}>Play Reading Quest →</a>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── PLACEMENT TEST ──────────────────────────────────── */}
        {stage==="placementTest"&&(function(){
          var total=PLACEMENT_QUESTIONS.length;
          // Result screen
          if(pmtResult){
            var rec=pmtResult.level;
            var corr=pmtResult.correct;
            var lvObj=LEVELS.find(function(l){return l.key===rec;});
            return(
              <div style={{maxWidth:480,margin:"0 auto",paddingTop:20}}>
                <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:900,color:"#f3f4f6",textAlign:"center"}}>Your recommended level</h2>
                <p style={{margin:"0 0 18px",fontSize:13,color:"#9ca3af",textAlign:"center"}}>You answered {corr}/{total} correctly.</p>
                <div style={{...CARD,padding:24,textAlign:"center",marginBottom:14,borderColor:lvObj?lvObj.color:"#34d399",background:"rgba(255,255,255,0.03)"}}>
                  <div style={{fontSize:46,fontWeight:900,color:lvObj?lvObj.color:"#34d399",marginBottom:6,letterSpacing:2}}>{rec}</div>
                  <div style={{fontSize:14,color:"#d1d5db"}}>{lvObj?lvObj.desc:""}</div>
                </div>
                <button onClick={function(){if(currentUser){try{localStorage.setItem("rq-pmt-"+currentUser.name,rec);}catch(e){}}setLevel(rec);setPmtResult(null);setPmtIdx(0);setPmtAnswers({});setStage("home");}} style={{...mkBtn(lvObj?lvObj.color:"#34d399","#0d0d1a"),width:"100%",padding:12,fontSize:14,marginBottom:8}}>Use {rec} →</button>
                <button onClick={function(){setPmtResult(null);setPmtIdx(0);setPmtAnswers({});}} style={{...GHOST,width:"100%",fontSize:12}}>Retake test</button>
                <button onClick={function(){setPmtResult(null);setPmtIdx(0);setPmtAnswers({});setStage("home");}} style={{...GHOST,width:"100%",fontSize:12,marginTop:6}}>Skip — I'll pick my own level</button>
              </div>
            );
          }
          // Question screen
          var qIdx=Math.min(pmtIdx,total-1);
          var pq=PLACEMENT_QUESTIONS[qIdx];
          var picked=pmtAnswers[qIdx];
          var hasPicked=picked!==undefined;
          function pickOption(i){
            var next=Object.assign({},pmtAnswers);next[qIdx]=i;
            setPmtAnswers(next);
            // Auto-advance or finalise once an answer is selected.
            setTimeout(function(){
              if(qIdx+1>=total){
                var corr=0;
                for(var ki=0;ki<total;ki++){
                  if(next[ki]===PLACEMENT_QUESTIONS[ki].correctIdx)corr++;
                }
                setPmtResult({correct:corr,level:placementLevel(corr)});
              } else {
                setPmtIdx(qIdx+1);
              }
            },350);
          }
          var pct=Math.round(((qIdx)/total)*100);
          return(
            <div style={{maxWidth:480,margin:"0 auto",paddingTop:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,color:"#9ca3af",fontWeight:700}}>Question {qIdx+1} of {total}</span>
                <button onClick={function(){setPmtResult(null);setPmtIdx(0);setPmtAnswers({});setStage("home");}} style={{...GHOST,fontSize:11,padding:"4px 10px"}}>Skip</button>
              </div>
              <div style={{background:"rgba(0,0,0,0.3)",borderRadius:4,height:5,overflow:"hidden",marginBottom:18}}>
                <div style={{height:"100%",width:pct+"%",background:"#a78bfa",transition:"width 0.3s"}}/>
              </div>
              <div style={{...CARD,padding:18,marginBottom:14}}>
                <p style={{margin:0,fontSize:16,color:"#f3f4f6",lineHeight:1.55,fontWeight:600}}>{pq.q}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {pq.options.map(function(opt,oi){
                  var isPicked=picked===oi;
                  var bg=isPicked?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.04)";
                  var bd="1px solid "+(isPicked?"#a78bfa":"rgba(255,255,255,0.1)");
                  return<button key={oi} onClick={function(){if(!hasPicked)pickOption(oi);}} disabled={hasPicked} style={{background:bg,border:bd,borderRadius:10,padding:"12px 14px",color:isPicked?"#e9d5ff":"#e5e7eb",fontSize:14,cursor:hasPicked?"default":"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s"}}>{opt}</button>;
                })}
              </div>
            </div>
          );
        })()}

        {/* ── HOME ──────────────────────────────────────────── */}
        {stage==="home"&&currentUser&&(function(){
          var today=todayKey();
          var dailyDoneTodayHome=dailyDone&&dailyDone.date===today;
          var pendingReviews=reviewQueue.filter(function(r){return r.nextReview<=today;});
          var dueVocab=vocab.filter(srsDueToday);
          var myClasses4=classes.filter(function(c){return (c.students||[]).indexOf(currentUser.name)!==-1;});
          var myClassIdsHome=myClasses4.map(function(c){return c.id;});
          var pendingAsgnHome=myClassIdsHome.length?assignments.filter(function(a){return myClassIdsHome.indexOf(a.classId)!==-1&&(!a.completions||!a.completions[currentUser.name])&&(!a.dueDate||a.dueDate>=new Date().toISOString().slice(0,10));}):[];
          var annClasses=myClasses4.filter(function(c){return c.announcement;});
          var liveChallenges=pendingChallenges.filter(function(c){return!c.expiresAt||c.expiresAt>Date.now();});
          var completedSentChallenges=(myData.sent||[]).filter(function(s){return s.status==="completed";});
          var doy=Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/(864e5));
          var wotd=WORD_OF_DAY[doy%WORD_OF_DAY.length];
          var recs=getRecommendations(currentUser.games||[],3);
          var todayGamesHome=(currentUser.games||[]).filter(function(g){return g.date===today;});
          var doneCountHome=dailyQuests.filter(function(q){return questsDone[q.id];}).length;
          var allDoneHome=dailyQuests.length>0&&dailyQuests.every(function(q){return questsDone[q.id]||checkQuest(q.id,todayGamesHome,vocab.length,{dailyDone:dailyDoneTodayHome,streak:myStreak});});
          var showPmtPrompt=(currentUser.games||[]).length===0&&!localStorage.getItem("rq-pmt-"+currentUser.name);
          var myClassBanner=myClasses4[0]||null;
          // Pick top 2 quick actions from highest-priority items
          var quickActions=[];
          if(streakAtRisk&&shields>0){quickActions.push({key:"shield",icon:"🛡️",label:t("saveStreak"),sub:t("useShield"),color:"#f87171",bg:"rgba(239,68,68,0.12)",border:"rgba(239,68,68,0.4)",onClick:useShield});}
          if(!dailyDoneTodayHome){quickActions.push({key:"daily",icon:"🎯",label:t("todaysDailyChallenge"),sub:dailyChallenge&&dailyChallenge.date===today?dailyChallenge.topic+" · B1":"B1 · All types",color:"#06b6d4",bg:"rgba(6,182,212,0.10)",border:"rgba(6,182,212,0.4)",onClick:startDailyChallenge,disabled:dailyLoading});}
          if(pendingReviews.length>0){quickActions.push({key:"review",icon:"🔁",label:t("reviewLabel"),sub:pendingReviews.length+" "+(pendingReviews.length!==1?t("missedQuestions"):t("missedQuestion")),color:"#c084fc",bg:"rgba(168,85,247,0.10)",border:"rgba(168,85,247,0.4)",onClick:function(){setReviewIdx(0);setReviewAns(null);setReviewConfirmed(false);setStage("review");}});}
          if(dueVocab.length>0){quickActions.push({key:"vocab",icon:"📚",label:t("vocabReview"),sub:dueVocab.length+" "+(dueVocab.length!==1?t("wordsLabel"):t("wordLabel")),color:"#22d3ee",bg:"rgba(6,182,212,0.10)",border:"rgba(6,182,212,0.4)",onClick:function(){setVocabFilter("due");setVocabCard(0);setVocabFlipped(false);setStage("vocab");}});}
          if(!playedToday&&quickActions.length<2){quickActions.push({key:"play",icon:"📖",label:t("playToday"),sub:myStreak>0?t("keepStreak").replace("{n}",myStreak):t("startYourStreak"),color:"#a78bfa",bg:"rgba(99,102,241,0.10)",border:"rgba(99,102,241,0.4)",onClick:function(){setStage("library");}});}
          quickActions=quickActions.slice(0,2);
          // Slider mode is rendered as its own dedicated banner below
          // (not in quickActions) so it never gets squeezed out by
          // higher-priority actions like daily/review/vocab.
          var sliderCapToday=userQuota&&userQuota.slider?(userQuota.slider.used||0)>=(userQuota.slider.max||30):false;
          var sliderUsedToday=userQuota&&userQuota.slider?(userQuota.slider.used||0):0;
          var sliderMaxToday=userQuota&&userQuota.slider?(userQuota.slider.max||30):30;
          var initial=(currentUser.name||"?")[0].toUpperCase();
          return(
          <>
            <style>{`
              .lq-home{padding:0 0 96px;margin:-18px -20px -64px}
              @media(min-width:480px){.lq-home{margin:-22px -28px -72px}}
              .lq-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
              .lq-avatar{width:40px;height:40px;border-radius:14px;background:linear-gradient(135deg,#5af0b3,#6366F1);display:flex;align-items:center;justify-content:center;color:#003825;font-family:'Outfit',sans-serif;font-weight:800;font-size:18px;cursor:pointer;flex-shrink:0;border:none;box-shadow:0 0 14px rgba(52,211,153,0.35),inset 0 1px 0 rgba(255,255,255,0.2)}
              .lq-greet{flex:1;min-width:0}
              .lq-greet-h{margin:0;font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#5af0b3;line-height:1.15;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
              .lq-greet-sub{margin:1px 0 0;font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.5);letter-spacing:0.04em}
              .lq-icon-btn{background:none;border:none;color:rgba(227,224,244,0.6);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:10px;transition:all 0.15s;position:relative}
              .lq-icon-btn:hover{background:rgba(255,255,255,0.06);color:#5af0b3}
              .lq-icon-btn:active{transform:scale(0.92)}
              .lq-icon-dot{position:absolute;top:5px;right:5px;min-width:14px;height:14px;padding:0 4px;border-radius:999px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1}
              .lq-h-content{padding:18px 16px 0}
              .lq-pills{display:flex;gap:6px;overflow-x:auto;margin-bottom:18px;scrollbar-width:none}
              .lq-pills::-webkit-scrollbar{display:none}
              .lq-pill{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:999px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;white-space:nowrap;flex-shrink:0}
              .lq-streak-hero{position:relative;padding:20px;background:linear-gradient(135deg,rgba(251,191,36,0.10),rgba(251,191,36,0.04));border:1px solid rgba(251,191,36,0.3);border-radius:24px;margin-bottom:14px;overflow:hidden}
              .lq-streak-hero.at-risk{background:linear-gradient(135deg,rgba(239,68,68,0.10),rgba(239,68,68,0.04));border-color:rgba(239,68,68,0.35)}
              .lq-streak-hero::before{content:"";position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(251,191,36,0.10);filter:blur(60px);pointer-events:none}
              .lq-streak-hero.at-risk::before{background:rgba(239,68,68,0.10)}
              .lq-streak-row{position:relative;z-index:1;display:flex;align-items:center;gap:14px;margin-bottom:16px}
              .lq-streak-emoji{font-size:48px;line-height:1;flex-shrink:0;filter:drop-shadow(0 0 16px rgba(251,191,36,0.6))}
              .lq-streak-hero.at-risk .lq-streak-emoji{filter:drop-shadow(0 0 16px rgba(239,68,68,0.6))}
              .lq-streak-num{font-family:'Outfit',sans-serif;font-size:42px;font-weight:800;color:#fbbf24;line-height:1;letter-spacing:-0.02em;text-shadow:0 0 12px rgba(251,191,36,0.5)}
              .lq-streak-hero.at-risk .lq-streak-num{color:#f87171;text-shadow:0 0 12px rgba(239,68,68,0.5)}
              .lq-streak-lbl{font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:rgba(227,224,244,0.7);margin-top:2px;letter-spacing:0.02em}
              .lq-streak-best{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.5);margin-top:3px}
              .lq-streak-warn{font-family:'Inter',sans-serif;font-size:12px;color:#f87171;font-weight:600;margin-top:6px}
              .lq-streak-shield{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
              .lq-shield-icons{font-size:14px;color:#a78bfa;font-weight:700}
              .lq-shield-btn{background:#6366F1;color:#fff;border:none;border-radius:12px;padding:8px 14px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(99,102,241,0.4)}
              .lq-week-dots{position:relative;z-index:1;display:flex;justify-content:space-between;gap:4px}
              .lq-dot{display:flex;flex-direction:column;align-items:center;gap:4px}
              .lq-dot-circle{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.06);border:2px solid transparent;transition:all 0.2s}
              .lq-dot-circle.played{background:#fbbf24;box-shadow:0 0 10px rgba(251,191,36,0.5)}
              .lq-dot-circle.today{background:rgba(251,191,36,0.2);border-color:#fbbf24}
              .lq-dot-lbl{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:rgba(227,224,244,0.4);letter-spacing:0.04em}
              .lq-dot-lbl.today{color:#fbbf24}
              .lq-banner{display:flex;align-items:flex-start;gap:12px;padding:14px;border-radius:18px;margin-bottom:12px;border:1px solid;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
              .lq-banner .ico{font-size:24px;line-height:1;flex-shrink:0}
              .lq-banner .meta{flex:1;min-width:0}
              .lq-banner-t{font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;margin:0 0 3px}
              .lq-banner-d{font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.65);margin:0;line-height:1.5}
              .lq-banner-action{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
              .lq-actions-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
              .lq-action-card{background:rgba(30,30,44,0.5);border:1px solid;border-radius:18px;padding:14px;cursor:pointer;text-align:left;font-family:inherit;color:inherit;transition:transform 0.15s,background 0.15s;display:flex;flex-direction:column;gap:8px;min-height:96px}
              .lq-action-card:hover{background:rgba(30,30,44,0.7)}
              .lq-action-card:active{transform:scale(0.97)}
              .lq-action-card:disabled{opacity:0.6;cursor:not-allowed}
              .lq-action-top{display:flex;align-items:center;gap:8px}
              .lq-action-ico{font-size:22px;line-height:1}
              .lq-action-lbl{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;line-height:1.2}
              .lq-action-sub{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#e3e0f4;line-height:1.25;margin-top:auto}
              .lq-section-h{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:18px 0 14px;font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;color:#e3e0f4}
              .lq-section-h .h-lbl{display:flex;align-items:center;gap:8px}
              .lq-section-h .h-ico{color:#5af0b3;font-size:18px;line-height:1}
              .lq-section-h .h-link{background:none;border:none;color:#5af0b3;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;cursor:pointer;padding:4px 8px;border-radius:8px}
              .lq-section-h .h-link:hover{background:rgba(52,211,153,0.08)}
              .lq-levels{display:flex;flex-direction:column;gap:10px;margin-bottom:18px}
              .lq-level{position:relative;display:flex;align-items:center;gap:14px;padding:14px;background:rgba(30,30,44,0.5);border:2px solid rgba(255,255,255,0.08);border-radius:18px;cursor:pointer;text-align:left;font-family:inherit;transition:all 0.2s;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
              .lq-level:hover{background:rgba(30,30,44,0.7);border-color:rgba(255,255,255,0.15)}
              .lq-level.is-active{background:rgba(255,255,255,0.07);transform:translateY(-1px)}
              .lq-level-badge{width:52px;height:52px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border-radius:14px}
              .lq-level-meta{flex:1;min-width:0}
              .lq-level-top{display:flex;align-items:center;gap:8px;margin-bottom:3px}
              .lq-level-key{font-family:'Outfit',sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.01em}
              .lq-level-mult{padding:2px 8px;border-radius:999px;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;background:rgba(255,255,255,0.10);color:#d1d5db}
              .lq-level-desc{font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.55);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
              .lq-level-time{font-family:'Inter',sans-serif;font-size:10px;color:rgba(227,224,244,0.4);letter-spacing:0.04em}
              .lq-level-arrow{font-size:18px;color:rgba(227,224,244,0.4);flex-shrink:0;transition:transform 0.2s,color 0.2s}
              .lq-level.is-active .lq-level-arrow{color:#5af0b3;transform:translateX(2px)}
              .lq-cta{width:100%;padding:16px 20px;margin-bottom:14px;border:none;border-radius:18px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 10px 24px rgba(52,211,153,0.28)}
              .lq-cta:active{transform:translateY(3px);box-shadow:0 1px 0 0 rgba(0,0,0,0.4),0 4px 12px rgba(52,211,153,0.3)}
              .lq-cta:disabled{opacity:0.5;cursor:not-allowed;transform:none;box-shadow:0 4px 0 0 rgba(0,0,0,0.3)}
              .lq-card-glass{background:rgba(30,30,44,0.45);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;margin-bottom:14px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
              .lq-card-glass.tinted{border-color:rgba(167,139,250,0.3);background:rgba(167,139,250,0.04)}
              .lq-card-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
              .lq-card-lbl{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0}
              .lq-rec-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);cursor:pointer;margin-bottom:6px;transition:background 0.15s}
              .lq-rec-row:hover{background:rgba(255,255,255,0.06)}
              .lq-rec-emoji{font-size:20px;line-height:1}
              .lq-rec-meta{flex:1;min-width:0}
              .lq-rec-t{font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#e3e0f4;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
              .lq-rec-s{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.5);margin:0}
              .lq-rec-lvl{font-family:'Outfit',sans-serif;font-size:12px;font-weight:800;flex-shrink:0}
              .lq-quest-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
              .lq-quest-check{width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s}
              .lq-quest-check.done{background:#5af0b3;border-color:#5af0b3;color:#003825;font-weight:900;font-size:12px}
              .lq-quest-text{flex:1;font-family:'Inter',sans-serif;font-size:13px;color:#e3e0f4;line-height:1.3}
              .lq-quest-text.done{color:rgba(227,224,244,0.4);text-decoration:line-through}
              .lq-quest-text small{display:block;color:rgba(227,224,244,0.45);font-size:11px;margin-top:1px}
              .lq-quest-xp{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:#5af0b3;flex-shrink:0}
              .lq-quest-xp.done{color:rgba(227,224,244,0.35)}
              .lq-wotd{background:linear-gradient(135deg,rgba(167,139,250,0.10),rgba(167,139,250,0.03));border-color:rgba(167,139,250,0.3)}
              .lq-wotd-word{font-family:'Outfit',sans-serif;font-size:24px;font-weight:800;color:#c4b5fd;letter-spacing:-0.01em;line-height:1.1}
              .lq-wotd-phon{font-family:'JetBrains Mono',monospace;font-size:12px;color:#a78bfa;margin-left:10px}
              .lq-wotd-def{font-family:'Inter',sans-serif;font-size:13px;color:rgba(227,224,244,0.85);margin:6px 0 4px;line-height:1.5}
              .lq-wotd-ex{font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.5);font-style:italic;margin:0}
              .lq-wotd-type{padding:3px 9px;border-radius:999px;background:rgba(167,139,250,0.18);color:#c4b5fd;font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase}
              .lq-details{margin-bottom:14px;border:1px solid rgba(255,255,255,0.08);border-radius:18px;background:rgba(30,30,44,0.4);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);overflow:hidden}
              .lq-details summary{padding:14px 16px;cursor:pointer;list-style:none;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;color:#e3e0f4;display:flex;justify-content:space-between;align-items:center;user-select:none}
              .lq-details summary::-webkit-details-marker{display:none}
              .lq-details summary::after{content:"⌄";color:rgba(227,224,244,0.5);font-size:14px;transition:transform 0.2s}
              .lq-details[open] summary::after{transform:rotate(180deg)}
              .lq-details-body{padding:0 16px 16px;display:flex;flex-direction:column;gap:14px}
              .lq-details-sub{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:rgba(227,224,244,0.55);letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px}
              .lq-chips{display:flex;flex-wrap:wrap;gap:6px}
              .lq-mini-chip{padding:5px 11px;border-radius:999px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.55)}
              .lq-mini-chip.active{background:rgba(52,211,153,0.18);border-color:#5af0b3;color:#5af0b3}
              .lq-text-input{width:100%;background:rgba(13,13,26,0.7);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:11px 13px;color:#e3e0f4;font-family:'Inter',sans-serif;font-size:13px;outline:none;box-sizing:border-box;transition:all 0.2s}
              .lq-text-input:focus{border-color:#5af0b3;box-shadow:0 0 0 3px rgba(52,211,153,0.12)}
              .lq-textarea{width:100%;min-height:96px;background:rgba(13,13,26,0.7);border:1px solid rgba(255,255,255,0.10);border-radius:12px;padding:11px 13px;color:#e3e0f4;font-family:'Inter',sans-serif;font-size:13px;outline:none;box-sizing:border-box;resize:vertical;transition:all 0.2s}
              .lq-textarea:focus{border-color:#5af0b3;box-shadow:0 0 0 3px rgba(52,211,153,0.12)}
              .lq-ghost-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.8);border-radius:12px;padding:9px 14px;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:0.02em;transition:all 0.15s}
              .lq-ghost-btn:hover{background:rgba(255,255,255,0.08);border-color:rgba(52,211,153,0.5);color:#e3e0f4}
              .lq-ghost-btn:active{transform:scale(0.97)}
              .lq-nav-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
              .lq-nav-grid button{padding:10px 8px;font-size:12px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
              .lq-asgn-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px solid rgba(245,158,11,0.15)}
              .lq-chal-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.08)}
              .lq-chal-mini-btn{padding:5px 10px;border-radius:8px;border:none;cursor:pointer;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:#0d0d1a}
              .lq-bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;z-index:50;display:flex;justify-content:space-around;align-items:center;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:rgba(30,30,44,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,0.08);border-radius:24px 24px 0 0;box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
              .lq-nav-btn{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;cursor:pointer;padding:8px 16px;color:rgba(227,224,244,0.65);font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;position:relative;transition:color 0.15s;min-width:64px}
              .lq-nav-btn:hover{color:#e3e0f4}
              .lq-nav-btn .ico{font-size:26px;line-height:1}
              .lq-nav-btn.is-active{color:var(--rq-accent)}
              .lq-nav-btn.is-active::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:6px;height:6px;border-radius:999px;background:var(--rq-accent);box-shadow:0 0 8px rgba(var(--rq-accent-rgb),0.9)}
            `}</style>
            <div className="lq-home">
              <header className="lq-topbar">
                <button type="button" className="lq-avatar" onClick={function(){setStage("profile");}} aria-label="Profile">{initial}</button>
                <div className="lq-greet">
                  <h1 className="lq-greet-h">{t("hey")}, {currentUser.name}!</h1>
                  <p className="lq-greet-sub">{playedToday?"You're on fire today 🔥":"Ready for today's quest?"}</p>
                </div>
                {liveChallenges.length>0&&(
                  <button type="button" className="lq-icon-btn" onClick={function(){setStage("friends");}} aria-label="Challenges">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span className="lq-icon-dot">{liveChallenges.length}</span>
                  </button>
                )}
                <button type="button" className="lq-icon-btn" onClick={function(){var langs=["en","uz","ru","tr","ar","de","es","fr"];var i=langs.indexOf(uiLang);var nx=langs[(i+1)%langs.length];setUiLang(nx);try{localStorage.setItem("rq-uilang",nx);}catch(e){}}} aria-label="Language">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
                </button>
              </header>

              <div className="lq-h-content">
                <div className="lq-pills">
                  <span className="lq-pill" style={{background:streakAtRisk?"rgba(239,68,68,0.18)":"rgba(251,191,36,0.15)",color:streakAtRisk?"#f87171":"#fbbf24",border:"1px solid "+(streakAtRisk?"rgba(239,68,68,0.4)":"rgba(251,191,36,0.3)")}}>{streakAtRisk?"⚠️":"🔥"} {myStreak} day{shields>0?" · "+"🛡️".repeat(shields):""}</span>
                  <span className="lq-pill" style={{background:"rgba(167,139,250,0.15)",color:"#c4b5fd",border:"1px solid rgba(167,139,250,0.3)"}}>👥 {myData.friends.length}</span>
                  {myData.likes>0&&<span className="lq-pill" style={{background:"rgba(236,72,153,0.15)",color:"#f472b6",border:"1px solid rgba(236,72,153,0.3)"}}>❤️ {myData.likes}</span>}
                  <span className="lq-pill" style={{background:"rgba(52,211,153,0.15)",color:"#5af0b3",border:"1px solid rgba(52,211,153,0.3)"}}>⚡ {currentUser.totalXp||0} XP</span>
                  {userQuota&&userQuota.ai&&(function(){
                    // Level-aware cap for the "ai" bucket: A1-B1 → 10/day, B2-C2 → 6/day.
                    var lowLv=["A1","A2","B1"].indexOf(level||"")!==-1;
                    var aiMax=lowLv?(userQuota.ai.maxLow||10):(userQuota.ai.maxHigh||6);
                    var aiUsed=userQuota.ai.used||0;
                    var pct=aiMax>0?aiUsed/aiMax:0;
                    var capped=pct>=1;
                    var nearCap=pct>=0.75&&!capped;
                    var tone=capped?{bg:"rgba(239,68,68,0.18)",fg:"#f87171",bd:"rgba(239,68,68,0.4)"}
                      :nearCap?{bg:"rgba(245,158,11,0.18)",fg:"#fbbf24",bd:"rgba(245,158,11,0.4)"}
                      :{bg:"rgba(99,102,241,0.15)",fg:"#a78bfa",bd:"rgba(99,102,241,0.3)"};
                    // When capped, the chip becomes a clickable jump to the
                    // free Library so students aren't dead-ended for the day.
                    var sliderInfo=userQuota.slider?" · 🪄 "+(userQuota.slider.used||0)+"/"+(userQuota.slider.max||30):"";
                    var vocabInfo=userQuota.vocab?" · 🔤 "+(userQuota.vocab.used||0)+"/"+(userQuota.vocab.max||80):"";
                    var tip=t("home_quota_tip")+"\n"+aiUsed+"/"+aiMax+" AI"+sliderInfo+vocabInfo;
                    var trailing=capped?" · "+t("home_quota_full"):nearCap?" · "+t("home_quota_low"):" "+t("home_quota_today");
                    var common={background:tone.bg,color:tone.fg,border:"1px solid "+tone.bd};
                    return capped
                      ? <button type="button" onClick={function(){setStage("library");}} className="lq-pill" title={tip} style={Object.assign({},common,{cursor:"pointer",fontFamily:"inherit"})}>🪙 {aiUsed} / {aiMax}{trailing}</button>
                      : <span className="lq-pill" title={tip} style={common}>🪙 {aiUsed} / {aiMax}{trailing}</span>;
                  })()}
                </div>

                {milestoneToShow&&(
                  <div className="lq-banner" style={{borderColor:"rgba(251,191,36,0.5)",background:"linear-gradient(135deg,rgba(251,191,36,0.12),rgba(251,191,36,0.04))"}}>
                    <div className="ico">🎉</div>
                    <div className="meta">
                      <p className="lq-banner-t" style={{color:"#fbbf24"}}>{myStreak}-Day Streak!</p>
                      <p className="lq-banner-d">{milestoneToShow}</p>
                    </div>
                    <button type="button" onClick={function(){localStorage.setItem("rq-ms-"+currentUser.name+"-"+myStreak,"1");setMilestoneSeen(true);}} className="lq-icon-btn" aria-label="Dismiss">×</button>
                  </div>
                )}

                {annClasses.map(function(c){return(
                  <div key={"ann-"+c.id} className="lq-banner" style={{borderColor:"rgba(167,139,250,0.4)",background:"rgba(99,102,241,0.07)"}}>
                    <div className="ico">📢</div>
                    <div className="meta">
                      <p className="lq-banner-t" style={{color:"#c4b5fd",fontSize:11,letterSpacing:0.04}}>{c.name} · {c.announcement.teacherName}</p>
                      <p className="lq-banner-d" style={{color:"#e9d5ff",marginTop:3}}>{c.announcement.text}</p>
                    </div>
                  </div>
                );})}

                {pendingAsgnHome.length>0&&(
                  <div className="lq-card-glass" style={{borderColor:"rgba(245,158,11,0.5)",background:"rgba(245,158,11,0.07)"}}>
                    <p className="lq-card-lbl" style={{color:"#fcd34d",marginBottom:8}}>{t("tch_studentAssignments")}</p>
                    {pendingAsgnHome.map(function(asgn){
                      var story=asgn.storyId?STORY_LIBRARY.find(function(s){return s.id===asgn.storyId;}):null;
                      var fromClass=myClasses4.find(function(c){return c.id===asgn.classId;});
                      return(
                        <div key={asgn.id} className="lq-asgn-row">
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:"#e3e0f4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{asgn.topic}</div>
                            <div style={{fontSize:11,color:"rgba(227,224,244,0.5)"}}>{fromClass?fromClass.name+" · ":""}{asgn.level}{asgn.dueDate?" · due "+asgn.dueDate:""}</div>
                          </div>
                          <button type="button" onClick={function(){
                            setActiveAssignmentId(asgn.id);
                            if(story){startStoryFromLibrary(story);}
                            else if(asgn.passage&&asgn.questions){
                              setLevel(asgn.level);setPassage(asgn.passage);setTopic(asgn.topic);setQuestions(asgn.questions);
                              var mq2=null;for(var qi2=0;qi2<asgn.questions.length;qi2++){if(asgn.questions[qi2].type==="matching"){mq2=asgn.questions[qi2];break;}}
                              setShuffledRights(mq2&&mq2.rights?shuffleArr(mq2.rights.map(function(v,i){return{idx:i,val:v};})):[]);
                              setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
                              setConfirmed(false);setStreak(0);setMaxStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
                              setIsDailyGame(false);setCurrentStoryId(null);setActiveSentence(null);setTranslation(null);setHeatmapOn(false);
                              setStage("reading");
                            }
                          }} className="lq-ghost-btn" style={{background:"#f59e0b",color:"#0d0d1a",border:"none",fontSize:12,whiteSpace:"nowrap"}}>{t("tch_start")}</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {showPmtPrompt&&(
                  <div className="lq-banner" style={{borderColor:"rgba(167,139,250,0.4)",background:"rgba(167,139,250,0.06)"}}>
                    <div className="ico">🎯</div>
                    <div className="meta">
                      <p className="lq-banner-t" style={{color:"#e9d5ff",fontSize:14}}>Not sure where to start?</p>
                      <p className="lq-banner-d">Take a 12-question placement test and we'll recommend a CEFR level.</p>
                      <div className="lq-banner-action">
                        <button type="button" onClick={function(){setPmtIdx(0);setPmtAnswers({});setPmtResult(null);setStage("placementTest");}} className="lq-ghost-btn" style={{background:"#a78bfa",color:"#0d0d1a",border:"none"}}>Start placement test</button>
                        <button type="button" onClick={function(){try{localStorage.setItem("rq-pmt-"+currentUser.name,"skipped");}catch(e){}setCurrentUser(Object.assign({},currentUser));}} className="lq-ghost-btn">No thanks</button>
                      </div>
                    </div>
                  </div>
                )}

                {(myStreak>=1||streakAtRisk)&&(
                  <div className={"lq-streak-hero"+(streakAtRisk?" at-risk":"")}>
                    <div className="lq-streak-row">
                      <div className="lq-streak-emoji">{streakAtRisk?"🛡️":"🔥"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                          <span className="lq-streak-num">{myStreak}</span>
                          <span className="lq-streak-lbl">day streak</span>
                        </div>
                        {longestStreak>0&&<div className="lq-streak-best">Best: {longestStreak} days</div>}
                        {streakAtRisk&&<div className="lq-streak-warn">Missed yesterday — use a shield!</div>}
                        {!streakAtRisk&&shields<3&&myStreak>0&&myStreak%7!==0&&<div className="lq-streak-best">🛡️ Earn shield at {Math.ceil(myStreak/7)*7}-day milestone</div>}
                      </div>
                      <div className="lq-streak-shield">
                        {shields>0&&<div className="lq-shield-icons">{"🛡️".repeat(shields)}</div>}
                        {streakAtRisk&&shields>0&&<button type="button" onClick={useShield} className="lq-shield-btn">Use Shield</button>}
                      </div>
                    </div>
                    <div className="lq-week-dots">
                      {weekDots.map(function(dot,i){return(
                        <div key={i} className="lq-dot">
                          <div className={"lq-dot-circle"+(dot.played?" played":"")+(dot.today?" today":"")}/>
                          <div className={"lq-dot-lbl"+(dot.today?" today":"")}>{dot.day}</div>
                        </div>
                      );})}
                    </div>
                  </div>
                )}

                {(liveChallenges.length>0||completedSentChallenges.length>0)&&(
                  <div className="lq-card-glass" style={{borderColor:"rgba(245,158,11,0.35)",background:"rgba(245,158,11,0.04)"}}>
                    {liveChallenges.length>0&&(
                      <>
                        <p className="lq-card-lbl" style={{color:"#f59e0b"}}>⚔️ Challenges received</p>
                        {liveChallenges.map(function(c,idx){
                          var realIdx=myData.challenges.indexOf(c);
                          var tl=challengeTimeLeft(c.expiresAt);
                          var lvC=getLv(c.level);
                          return(<div key={idx} className="lq-chal-row" style={{borderColor:c.storyId?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.08)"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,color:"#e3e0f4",fontWeight:600}}><strong>{c.from}</strong> → <span style={{color:lvC.color}}>{c.level}</span>{c.storyId&&<span style={{color:"#f87171",marginLeft:5}}>⚔️</span>}</div>
                              {c.storyTitle&&<div style={{fontSize:11,color:"#e9d5ff",marginTop:1}}>"{c.storyTitle}"</div>}
                              {c.senderPct!=null&&<div style={{fontSize:10,color:"#fbbf24",marginTop:1}}>Their score: {c.senderPct}%</div>}
                              {tl&&<div style={{fontSize:10,color:tl==="expired"?"#f87171":"rgba(227,224,244,0.5)",marginTop:1}}>⏱ {tl}</div>}
                            </div>
                            <button type="button" onClick={function(){respondChallenge(realIdx,"accepted",c);}} className="lq-chal-mini-btn" style={{background:"#5af0b3"}}>Accept</button>
                            <button type="button" onClick={function(){respondChallenge(realIdx,"declined",null);}} className="lq-chal-mini-btn" style={{background:"#374151",color:"#9ca3af"}}>✕</button>
                          </div>);
                        })}
                      </>
                    )}
                    {completedSentChallenges.length>0&&(
                      <>
                        <p className="lq-card-lbl" style={{color:"#5af0b3",marginTop:liveChallenges.length?10:0}}>✅ Challenge results</p>
                        {completedSentChallenges.map(function(s,i){
                          var theirPct=s.result.pct;
                          var myPct=s.result.senderPct!=null?s.result.senderPct:(s.senderPct!=null?s.senderPct:null);
                          var won=myPct!=null&&theirPct<myPct;
                          var tied=myPct!=null&&theirPct===myPct;
                          return(<div key={i} style={{marginBottom:8,padding:"10px 12px",background:"rgba(255,255,255,0.02)",borderRadius:12,border:"1px solid "+(won?"rgba(34,197,94,0.25)":tied?"rgba(251,191,36,0.2)":"rgba(239,68,68,0.2)")}}>
                            <div style={{fontSize:12,color:"#e3e0f4"}}><strong>{s.to}</strong> scored <strong style={{color:pctColor(theirPct)}}>{theirPct}%</strong> · <span style={{color:"#fbbf24",fontWeight:700}}>{s.result.xp} XP</span></div>
                            {myPct!=null&&<div style={{fontSize:11,marginTop:4,fontWeight:700,color:won?"#5af0b3":tied?"#fbbf24":"#f87171"}}>{won?"🏆 You won!":tied?"🤝 Tie!":"😤 They beat you ("+myPct+"% vs "+theirPct+"%)"}</div>}
                          </div>);
                        })}
                      </>
                    )}
                  </div>
                )}

                {quickActions.length>0&&(
                  <div className="lq-actions-row">
                    {quickActions.map(function(a){return(
                      <button key={a.key} type="button" disabled={a.disabled} onClick={a.onClick} className="lq-action-card" style={{borderColor:a.border,background:a.bg}}>
                        <div className="lq-action-top">
                          <span className="lq-action-ico">{a.icon}</span>
                          <span className="lq-action-lbl" style={{color:a.color}}>{a.label}</span>
                        </div>
                        <div className="lq-action-sub">{a.disabled?"Loading…":a.sub}</div>
                      </button>
                    );})}
                  </div>
                )}

                {/* F5 — friend comparison nudge. Positive framing only; one
                    nudge picked per day, dismissible until tomorrow. */}
                {friendNudge&&(function(){
                  var k=friendNudge.category;
                  var p=friendNudge.params||{};
                  var msg=t("stu_nudge_"+k)||"";
                  Object.keys(p).forEach(function(key){msg=msg.replace("{"+key+"}",p[key]);});
                  var ico=k==="streakMatch"?"🔥":k==="behind"?"🎯":k==="tied"?"🤝":k==="ahead"?"⭐":k==="topPack"?"👑":"👥";
                  var ctaLabel=friendNudge.ctaTo==="friends"?t("stu_nudge_cta_friends"):t("stu_nudge_cta_play");
                  var dayStamp=currentUser?currentUser.name+":"+todayStr+":"+k:"";
                  if(dayStamp&&nudgeShownRef.current!==dayStamp){
                    nudgeShownRef.current=dayStamp;
                    try{track("friend_nudge_shown",{category:k});}catch(e){}
                  }
                  return(
                    <div style={{display:"flex",alignItems:"center",gap:12,width:"100%",padding:"12px 14px",margin:"10px 0",borderRadius:16,border:"1px solid rgba(96,165,250,0.35)",background:"linear-gradient(135deg,rgba(96,165,250,0.12),rgba(52,211,153,0.06))",color:"#e3e0f4",fontFamily:"'Inter',sans-serif"}}>
                      <div style={{flexShrink:0,width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#60a5fa,#5af0b3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 14px rgba(96,165,250,0.3)"}}>{ico}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.05em",color:"#60a5fa",textTransform:"uppercase"}}>{t("stu_nudge_title")}</div>
                        <div style={{fontSize:13,color:"#e3e0f4",marginTop:2,lineHeight:1.4}}>{msg}</div>
                        <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                          <button type="button" onClick={function(){
                            try{track("friend_nudge_cta",{category:k,to:friendNudge.ctaTo});}catch(e){}
                            if(friendNudge.ctaTo==="friends"){setStage("friends");}
                            else{var el=document.getElementById("rq-level-picker");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});}
                          }} style={{padding:"6px 12px",borderRadius:10,border:"none",background:"#60a5fa",color:"#0d0d1a",fontSize:12,fontWeight:700,cursor:"pointer"}}>{ctaLabel}</button>
                          <button type="button" onClick={function(){
                            try{track("friend_nudge_dismissed",{category:k});}catch(e){}
                            try{if(currentUser)localStorage.setItem("rq-nudge-dismiss-"+currentUser.name,todayStr);}catch(e){}
                            setNudgeDismissedToday(true);
                          }} style={{padding:"6px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"transparent",color:"rgba(227,224,244,0.7)",fontSize:12,fontWeight:600,cursor:"pointer"}}>{t("stu_nudge_dismiss")}</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Slider Mode banner — dedicated surface so the new mode is
                    discoverable regardless of streak/daily/review slot pressure. */}
                {!sliderCapToday&&(
                  <button type="button" onClick={startSliderSession} disabled={sliderLoading} style={{display:"flex",alignItems:"center",gap:14,width:"100%",padding:"14px 16px",margin:"10px 0",borderRadius:18,border:"1px solid rgba(236,72,153,0.4)",background:"linear-gradient(135deg,rgba(236,72,153,0.12),rgba(167,139,250,0.08))",color:"#e3e0f4",cursor:sliderLoading?"wait":"pointer",fontFamily:"'Inter',sans-serif",textAlign:"left",transition:"all 0.15s"}}>
                    <div style={{flexShrink:0,width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#f472b6,#a78bfa)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:"0 4px 14px rgba(244,114,182,0.35)"}}>🪄</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:800,color:"#f472b6",letterSpacing:"0.02em"}}>Slider Mode {sliderUsedToday>0?<span style={{fontSize:11,color:"rgba(244,114,182,0.7)",fontWeight:600,marginLeft:6}}>· {sliderUsedToday}/{sliderMaxToday} today</span>:null}</div>
                      <div style={{fontSize:12,color:"rgba(227,224,244,0.6)",marginTop:2}}>Bite-sized reads · swipe through · focus-friendly</div>
                    </div>
                    <div style={{flexShrink:0,color:"#f472b6",fontSize:20}}>›</div>
                  </button>
                )}

                <div className="lq-section-h" id="rq-level-picker">
                  <div className="h-lbl"><span className="h-ico">✦</span>{t("chooseLevel")}</div>
                </div>
                <div className="lq-levels">
                  {LEVELS.map(function(l){
                    var active=level===l.key;
                    var badgeId=l.key.toLowerCase();
                    return(<button key={l.key} type="button" onClick={function(){setLevel(l.key);setError("");}} className={"lq-level"+(active?" is-active":"")} style={active?{borderColor:l.color,boxShadow:"0 0 24px "+l.glow+",inset 0 1px 0 rgba(255,255,255,0.05)"}:{}}>
                      <div className="lq-level-badge">
                        <img src={"/assets/badges/badge-"+badgeId+".svg"} alt={l.key} style={{width:48,height:48}} onError={function(e){e.target.style.display="none";}}/>
                      </div>
                      <div className="lq-level-meta">
                        <div className="lq-level-top">
                          <span className="lq-level-key" style={{color:active?l.color:"#e3e0f4"}}>{l.key}</span>
                          <span className="lq-level-mult" style={active?{background:l.color,color:"#0d0d1a"}:{}}>x{l.mult}</span>
                        </div>
                        <div className="lq-level-desc">{l.desc}</div>
                        <div className="lq-level-time">⏱ {formatTime(l.timeLimit)} limit</div>
                      </div>
                      <span className="lq-level-arrow">→</span>
                    </button>);
                  })}
                </div>
                {error&&<ErrorBanner message={error}/>}
                {error&&error.includes("Daily AI quota")&&<button type="button" onClick={function(){setStage("library");}} className="lq-ghost-btn" style={{width:"100%",marginBottom:10}}>📚 Browse Library Stories</button>}
                <button type="button" onClick={generate} disabled={!level||genLoading} className="lq-cta" style={{background:level&&!genLoading?(lv&&lv.color)||"#5af0b3":"rgba(255,255,255,0.08)",color:level&&!genLoading?"#0d0d1a":"rgba(227,224,244,0.4)",boxShadow:level&&!genLoading?"0 4px 0 0 rgba(0,0,0,0.4),0 10px 24px "+((lv&&lv.glow)||"rgba(52,211,153,0.3)"):"0 4px 0 0 rgba(0,0,0,0.3)"}}>
                  {genLoading?t("writingPassage"):level?t("startQuest")+" "+level:t("selectLevel")}
                </button>

                {dailyQuests.length>0&&(
                  <div className="lq-card-glass" style={{borderColor:allDoneHome?"rgba(52,211,153,0.3)":"rgba(255,255,255,0.10)",background:allDoneHome?"rgba(52,211,153,0.04)":"rgba(255,255,255,0.02)"}}>
                    <div className="lq-card-h">
                      <p className="lq-card-lbl" style={{color:allDoneHome?"#5af0b3":"rgba(227,224,244,0.6)"}}>🎯 {t("todaysQuests")}</p>
                      <span style={{fontSize:11,color:"rgba(227,224,244,0.5)"}}>{doneCountHome}/{dailyQuests.length} done</span>
                    </div>
                    {dailyQuests.map(function(q){
                      var done=!!questsDone[q.id];
                      return(<div key={q.id} className="lq-quest-row">
                        <div className={"lq-quest-check"+(done?" done":"")}>{done?"✓":""}</div>
                        <div className={"lq-quest-text"+(done?" done":"")}>{q.title}<small>{q.desc}</small></div>
                        <div className={"lq-quest-xp"+(done?" done":"")}>+{q.xp} XP</div>
                      </div>);
                    })}
                  </div>
                )}

                {recs.length>0&&(
                  <div className="lq-card-glass">
                    <p className="lq-card-lbl" style={{color:"#c4b5fd",marginBottom:10}}>📚 {t("recommendedForYou")}</p>
                    {recs.map(function(s){
                      var lo=getLv(s.level);
                      return(
                        <div key={s.id} className="lq-rec-row" onClick={function(){startStoryFromLibrary(s);}}>
                          <span className="lq-rec-emoji">{({A1:"📗",A2:"📘",B1:"📙",B2:"📒",C1:"📕",C2:"📓"})[s.level]||"📖"}</span>
                          <div className="lq-rec-meta">
                            <p className="lq-rec-t">{s.title}</p>
                            <p className="lq-rec-s">{s.topic}</p>
                          </div>
                          <span className="lq-rec-lvl" style={{color:lo.color}}>{s.level}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="lq-card-glass lq-wotd">
                  <div className="lq-card-h">
                    <p className="lq-card-lbl" style={{color:"#c4b5fd"}}>📖 Word of the Day</p>
                    <span className="lq-wotd-type">{wotd.type}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"baseline"}}>
                    <span className="lq-wotd-word">{wotd.word}</span>
                    <span className="lq-wotd-phon">{wotd.phonetic}</span>
                  </div>
                  <p className="lq-wotd-def">{wotd.def}</p>
                  <p className="lq-wotd-ex">"{wotd.ex}"</p>
                </div>

                <div className="lq-details" style={{padding:"16px"}}>
                  <div className="lq-details-body" style={{padding:0}}>
                    <div>
                      <p className="lq-details-sub">{t("questionTypes")} ({selectedTypes.length} selected)</p>
                      <div className="lq-chips">
                        {Object.keys(Q_LABELS).map(function(qt){
                          var active=selectedTypes.indexOf(qt)!==-1;
                          function toggle(){setSelectedTypes(function(prev){var isAct=prev.indexOf(qt)!==-1;if(isAct&&prev.length===1)return prev;if(isAct)return prev.filter(function(x){return x!==qt;});return prev.concat([qt]);});}
                          return(<button key={qt} type="button" onClick={toggle} className={"lq-mini-chip"+(active?" active":"")}>{active?"✓ ":""}{qLabel(qt)}</button>);
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="lq-details-sub">{t("topic")} <span style={{textTransform:"none",letterSpacing:0,fontWeight:400,opacity:0.7}}>(optional)</span></p>
                      <div style={{display:"flex",gap:8}}>
                        <input className="lq-text-input" style={{flex:1,borderColor:customTopic.trim()?"#5af0b3":undefined}} placeholder={t("topicPlaceholder")} value={customTopic} onChange={function(e){setCustomTopic(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&level)generate();}} maxLength={80}/>
                        {customTopic.trim()&&<button type="button" onClick={function(){setCustomTopic("");}} className="lq-ghost-btn" style={{padding:"9px 12px"}}>✕</button>}
                      </div>
                      {customTopic.trim()&&<p style={{fontSize:11,color:"#5af0b3",margin:"6px 0 0"}}>{t("topicHint")} <strong>{customTopic.trim()}</strong></p>}
                      {(function(){
                        var activeVocab=vocab.filter(function(w){return w.status!=="known";});
                        activeVocab.sort(function(a,b){return (a.srInterval||0)-(b.srInterval||0);});
                        var previewWords=activeVocab.slice(0,5).map(function(w){return w.word;});
                        return(<div style={{marginTop:10}}>
                          <button type="button" onClick={function(){setUseWeakVocab(function(v){return !v;});}} className={"lq-mini-chip"+(useWeakVocab?" active":"")} style={{fontSize:12,padding:"6px 14px"}}>
                            {useWeakVocab?"✓ Vocab-Personalised":"📚 Personalise with my vocab"}
                          </button>
                          {activeVocab.length===0&&<span style={{fontSize:10,color:"rgba(227,224,244,0.4)",marginLeft:8}}>(add vocab first)</span>}
                          {useWeakVocab&&previewWords.length>0&&<p style={{fontSize:11,color:"#5af0b3",margin:"6px 0 0",lineHeight:1.5}}>Will include: {previewWords.map(function(w){return<span key={w} style={{background:"rgba(52,211,153,0.15)",borderRadius:6,padding:"1px 6px",marginRight:4,display:"inline-block"}}>{w}</span>;})}</p>}
                        </div>);
                      })()}
                    </div>
                    {(function(){
                      var PASS_LANGS=[{flag:"🇬🇧",name:"English"},{flag:"🇪🇸",name:"Spanish"},{flag:"🇫🇷",name:"French"},{flag:"🇩🇪",name:"German"},{flag:"🇮🇹",name:"Italian"},{flag:"🇵🇹",name:"Portuguese"},{flag:"🇷🇺",name:"Russian"},{flag:"🇹🇷",name:"Turkish"},{flag:"🇦🇪",name:"Arabic"},{flag:"🇺🇿",name:"Uzbek"}];
                      return(<div>
                        <p className="lq-details-sub">{t("passageLanguage")}</p>
                        <div style={{display:"flex",overflowX:"auto",gap:6,paddingBottom:4}}>
                          {PASS_LANGS.map(function(l){
                            var active=passageLang===l.name;
                            return(<button key={l.name} type="button" onClick={function(){setPassageLang(l.name);}} className={"lq-mini-chip"+(active?" active":"")} style={{whiteSpace:"nowrap",flexShrink:0}}>{l.flag} {l.name}</button>);
                          })}
                        </div>
                      </div>);
                    })()}
                  </div>
                </div>

                <details className="lq-details">
                  <summary>✍️ Custom text quiz</summary>
                  <div className="lq-details-body">
                    <p style={{fontSize:12,color:"rgba(227,224,244,0.55)",margin:0}}>Paste any English text (30–3000 chars) and we'll generate questions about it.</p>
                    <textarea className="lq-textarea" value={customText} onChange={function(e){setCustomText(e.target.value.slice(0,3000));}} placeholder="Paste your text here..."/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:10,color:"rgba(227,224,244,0.4)"}}>{customText.length}/3000</span>
                      <button type="button" onClick={doCustomTextQuiz} disabled={customTextLoading||customText.trim().length<30} className="lq-ghost-btn" style={{background:customText.trim().length>=30?"#f59e0b":undefined,color:customText.trim().length>=30?"#0d0d1a":undefined,border:customText.trim().length>=30?"none":undefined}}>{customTextLoading?"Generating…":"Generate Quiz"}</button>
                    </div>
                    {customTextError&&<p style={{color:"#f87171",fontSize:12,margin:0}}>{customTextError}</p>}
                  </div>
                </details>

                <button type="button" onClick={function(){setStage("settings");}} className="lq-details" style={{display:"flex",width:"100%",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,background:"rgba(30,30,44,0.4)",color:"#e3e0f4",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:14,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"}}>
                  <span>⚙️ Settings</span>
                  <span style={{color:"rgba(227,224,244,0.4)",fontSize:18,fontWeight:600}}>›</span>
                </button>

                {myClassBanner?(
                  <div className="lq-card-glass" style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:28}}>🏫</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#e3e0f4"}}>{myClassBanner.name}</div>
                      <div style={{fontSize:11,color:"rgba(227,224,244,0.5)"}}>Class by {myClassBanner.teacherName}</div>
                    </div>
                  </div>
                ):(
                  <div className="lq-card-glass">
                    <p className="lq-card-lbl" style={{color:"rgba(227,224,244,0.55)",marginBottom:10}}>🏫 Join a Class</p>
                    <div style={{display:"flex",gap:8}}>
                      <input value={joinClassCode} onChange={function(e){setJoinClassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));}} onKeyDown={function(e){if(e.key==="Enter")doJoinClass();}} placeholder="Class code" maxLength={6} className="lq-text-input" style={{flex:1,letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",fontSize:15,textTransform:"uppercase"}}/>
                      <button type="button" onClick={doJoinClass} disabled={joinClassCode.length!==6} className="lq-ghost-btn" style={{background:joinClassCode.length===6?"#6366F1":undefined,color:joinClassCode.length===6?"#fff":undefined,border:joinClassCode.length===6?"none":undefined}}>Join</button>
                    </div>
                    {joinClassMsg&&<p style={{fontSize:12,color:joinClassMsg.startsWith("✓")?"#5af0b3":"#f87171",margin:"8px 0 0"}}>{joinClassMsg}</p>}
                  </div>
                )}

                <div className="lq-section-h">
                  <div className="h-lbl"><span className="h-ico">⊞</span>More</div>
                </div>
                <div className="lq-nav-grid">
                  <button type="button" onClick={function(){setStage("friends");}} className="lq-ghost-btn">{t("friends")}</button>
                  <button type="button" onClick={function(){setTeacherSearchQuery("");setTeacherSearchResults([]);setTeacherSearchTotal(0);runTeacherSearch("");setStage("teacherSearch");}} className="lq-ghost-btn">{t("tch_findTeachers")}</button>
                  <button type="button" onClick={function(){setRoomEntryCode("");setRoomCreateTopic("");setRoomMsg("");setStage("roomEntry");}} className="lq-ghost-btn">🏫 Group Room</button>
                  <button type="button" onClick={function(){setVocabCard(0);setVocabFlipped(false);setVocabFilter("all");setStage("vocab");}} className="lq-ghost-btn">{t("vocab")}</button>
                  <button type="button" onClick={function(){setHistoryLevel("");setStage("history");}} className="lq-ghost-btn">{t("history")}</button>
                  <button type="button" onClick={function(){setStage("goals");}} className="lq-ghost-btn">{t("goals")}</button>
                  <button type="button" onClick={function(){setStage("weekly");}} className="lq-ghost-btn">{t("weekly")}</button>
                  <button type="button" onClick={function(){setLbLevel("A1");setStage("leaderboard");}} className="lq-ghost-btn">{t("leaderboard")}</button>
                  <button type="button" onClick={function(){setPortfolioLink("");setPortfolioLinkCopied(false);setStage("portfolio");}} className="lq-ghost-btn">{t("portfolio")}</button>
                  {quotes.length>0&&<button type="button" onClick={function(){setStage("quotes");}} className="lq-ghost-btn">{t("quotes")}</button>}
                </div>
              </div>

              <nav className="lq-bottom-nav">
                <button type="button" className="lq-nav-btn is-active">
                  <span className="ico">🏠</span><span>{t("home").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("library");}} className="lq-nav-btn">
                  <span className="ico">📚</span><span>{t("library").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("analytics");}} className="lq-nav-btn">
                  <span className="ico">📊</span><span>{t("stats").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("profile");}} className="lq-nav-btn">
                  <span className="ico">👤</span><span>{t("profile").toUpperCase()}</span>
                </button>
              </nav>
            </div>
          </>
          );
        })()}

        {/* ── LOADING ───────────────────────────────────────── */}
        {stage==="loading"&&(
          <div style={{textAlign:"center",paddingTop:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:280,height:200,marginBottom:20}}>
              <img src="/assets/loading.svg" alt="Loading" style={{width:"100%",height:"100%",objectFit:"contain"}} onError={function(e){e.target.style.display="none";}}/>
            </div>
            <h3 className="rq-shimmer" style={{color:lv?lv.color:"#34d399",fontWeight:800,fontSize:17,marginBottom:8,borderRadius:8,padding:"2px 0"}}>{loadMsg}</h3>
            <p style={{color:"#6b7280",fontSize:13,marginBottom:20}}>Creating {selectedTypes.length} question type(s) for {level}…</p>
            <div style={{width:"100%",maxWidth:400,marginTop:20}}>
              <Skeleton h={13} mb={8}/>
              <Skeleton h={13} mb={8} w="95%"/>
              <Skeleton h={13} mb={8} w="90%"/>
              <Skeleton h={13} w="75%"/>
            </div>
          </div>
        )}

        {/* ── READING ───────────────────────────────────────── */}
        {stage==="reading"&&(function(){
          var wordCount=passage.split(/\s+/).length;
          var estSecs=Math.max(30,Math.round(wordCount/3));
          var readPct=Math.min(100,Math.round((readingTimerSecs/estSecs)*100));
          var liveWpm=readingTimerSecs>5?getWpmFromSecs(wordCount,readingTimerSecs):0;
          var difficulty=analyzePassage(passage);

          // Paragraph-aware split: passages now arrive with "\n\n" between paragraphs.
          // Library stories without paragraph breaks still render as a single paragraph.
          var paragraphs=passage.split(/\n{2,}/).map(function(s){return s.trim();}).filter(Boolean);
          if(!paragraphs.length)paragraphs=[passage];
          var paraSentences=paragraphs.map(function(p){return p.match(/[^.!?]+[.!?]+/g)||[p];});
          // Flat sentence list still used elsewhere (TTS, pronunciation panel).
          var sentences=[].concat.apply([],paraSentences);

          function WordTokens(){
            var globalIdx=0;
            return paragraphs.map(function(para,pi){
              var tokens=para.split(/(\s+)/).map(function(token){
                var i=globalIdx++;
                if(/^\s+$/.test(token))return<span key={i}>{token}</span>;
                var word=token.replace(/[^a-zA-Z'-]/g,"").toLowerCase();
                if(!word)return<span key={i}>{token}</span>;
                var saved=savedWords.has(word),isSelected=selectedWord===word;
                var isHard=heatmapOn&&word.length>2&&!COMMON_WORDS.has(word.replace(/[^a-z]/g,""));
                var isHl=hlWords.has(i);
                var bg=isSelected?"rgba(251,191,36,0.3)":isHl?"rgba(251,191,36,0.35)":saved?"rgba(6,182,212,0.2)":isHard?"rgba(245,158,11,0.22)":"transparent";
                var col=isSelected?"#fbbf24":isHl?"#fde68a":saved?"#06b6d4":isHard?"#fbbf24":"inherit";
                function handleClick(){
                  if(hlMode){setHlWords(function(s){var n=new Set(s);if(n.has(i))n.delete(i);else n.add(i);return n;});}
                  else{lookupWord(word);}
                }
                return<span key={i} onClick={handleClick} title={hlMode?"Click to highlight":(isHard?"Uncommon word":undefined)} style={{cursor:hlMode?"crosshair":"pointer",borderRadius:3,background:bg,color:col,padding:"0 2px",transition:"background 0.12s",textDecoration:isSelected?"underline":isHl?"underline":isHard?"underline dotted":"none",textDecorationColor:isSelected?"#fbbf24":isHl?"rgba(251,191,36,0.6)":"rgba(245,158,11,0.5)"}}>{token}</span>;
              });
              return<p key={pi} style={{margin:pi>0?"0.95em 0 0":0}}>{tokens}</p>;
            });
          }

          function SentencePassage(){
            return paragraphs.map(function(para,pi){
              var sents=paraSentences[pi];
              return<p key={pi} style={{margin:pi>0?"0.95em 0 0":0}}>{sents.map(function(sent,si){
                var isActive=activeSentence===sent.trim();
                return<span key={si} onClick={function(){speakSentence(sent.trim());}} style={{cursor:"pointer",borderRadius:4,padding:"1px 2px",background:isActive?"rgba(99,102,241,0.2)":"transparent",borderBottom:isActive?"2px solid #a78bfa":"none",transition:"background 0.15s"}}>{sent}</span>;
              })}</p>;
            });
          }

          var isFav=favs.some(function(f){return f.id===currentStoryId;});
          var lvColor=lv?lv.color:"#5af0b3";
          var segCount=8;
          var segFilled=Math.min(segCount,Math.round((readPct/100)*segCount));

          if(!rsvpActive)return(
            <>
              <style>{`
                .lq-read-wrap{margin:-18px -20px -64px;padding:0;background:#0d0d1a;min-height:calc(100vh - 0px)}
                @media(min-width:480px){.lq-read-wrap{margin:-22px -28px -72px}}
                .lq-read-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
                .lq-r-btn{background:none;border:none;color:rgba(227,224,244,0.55);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:10px;transition:all 0.15s}
                .lq-r-btn:hover{background:rgba(255,255,255,0.06);color:#5af0b3}
                .lq-r-btn:active{transform:scale(0.92)}
                .lq-r-btn.is-active{background:rgba(52,211,153,0.15);color:#5af0b3}
                .lq-r-btn.is-fav{color:#f472b6;background:rgba(236,72,153,0.15)}
                .lq-r-btn.lq-r-exit{padding:6px 12px 6px 8px;gap:4px;color:rgba(227,224,244,0.75)}
                .lq-r-btn.lq-r-exit:hover{color:#fca5a5;background:rgba(239,68,68,0.12)}
                .lq-r-exit-lbl{font-family:'Inter',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.01em}
                .lq-exit-link{display:block;margin:0 auto 10px;background:transparent;border:none;color:rgba(227,224,244,0.5);cursor:pointer;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:8px 14px;border-radius:10px;transition:all 0.15s}
                .lq-exit-link:hover{color:#fca5a5;background:rgba(239,68,68,0.08)}
                .lq-r-title{flex:1;text-align:center;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#5af0b3;letter-spacing:0.01em;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .lq-read-prog{position:sticky;top:48px;z-index:29;background:rgba(13,13,26,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:6px}
                .lq-seg{flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden}
                .lq-seg.on{background:linear-gradient(90deg,#34D399,#5af0b3);box-shadow:0 0 10px rgba(52,211,153,0.4)}
                .lq-seg-pct{font-family:'Inter',sans-serif;font-size:10px;font-weight:800;color:#5af0b3;letter-spacing:0.1em;text-transform:uppercase;margin-left:6px;white-space:nowrap;flex-shrink:0}
                .lq-read-main{padding:24px 18px 240px;max-width:680px;margin:0 auto}
                .lq-read-header{text-align:center;margin-bottom:24px}
                .lq-read-tag{display:inline-block;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;padding:5px 14px;border-radius:999px;margin-bottom:14px}
                .lq-read-title{font-family:'Outfit',sans-serif;font-size:26px;font-weight:700;color:#e3e0f4;line-height:1.2;margin:0 0 14px;letter-spacing:-0.01em}
                @media(min-width:480px){.lq-read-title{font-size:30px}}
                .lq-read-divider{width:48px;height:1px;background:linear-gradient(90deg,transparent,rgba(52,211,153,0.6),transparent);margin:0 auto}
                .lq-read-diff{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:14px;font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.5)}
                .lq-read-diff .stars{color:#fbbf24}
                .lq-read-diff .wpm{color:#5af0b3}
                .lq-read-diff .newwords{color:#c4b5fd}
                .lq-personal-banner{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);margin-bottom:18px;font-family:'Inter',sans-serif;flex-wrap:wrap}
                .lq-personal-banner .lbl{font-size:11px;font-weight:700;color:#34d399;letter-spacing:0.04em}
                .lq-personal-banner .desc{font-size:11px;color:rgba(227,224,244,0.5)}
                .lq-personal-banner .word-chip{background:rgba(16,185,129,0.18);color:#34d399;border-radius:6px;padding:1px 7px;font-size:11px;font-weight:600}
                .lq-read-article{font-family:'Newsreader','Inter',serif;font-size:18px;line-height:1.85;color:rgba(227,224,244,0.92);letter-spacing:0.005em}
                .lq-read-article p{margin:0 0 1.4em}
                .lq-read-article p:last-child{margin-bottom:0}
                .lq-read-article p:first-child::first-letter{font-family:'Outfit',sans-serif;font-size:64px;font-weight:800;color:#5af0b3;float:left;line-height:1;padding:8px 12px 0 0;margin-top:4px;text-shadow:0 0 18px rgba(52,211,153,0.4)}
                .lq-read-foot-hint{text-align:center;font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.35);margin:20px 0 0;letter-spacing:0.04em}
                .lq-panel{background:rgba(30,30,44,0.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:14px;margin-top:16px;position:relative;overflow:hidden}
                .lq-panel-h{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px}
                .lq-panel-close{background:transparent;border:none;color:rgba(227,224,244,0.5);cursor:pointer;font-size:20px;padding:0 4px;line-height:1}
                .lq-vocab-word{font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;color:#fbbf24;line-height:1.1}
                .lq-vocab-phon{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(227,224,244,0.5);margin-left:10px}
                .lq-vocab-def{font-family:'Inter',sans-serif;font-size:14px;color:rgba(227,224,244,0.85);line-height:1.6;margin:6px 0 0}
                .lq-vocab-ex{font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.5);font-style:italic;margin:6px 0 0}
                .lq-trans-text{font-family:'Inter',sans-serif;font-size:14px;color:rgba(227,224,244,0.85);line-height:1.5;flex:1}
                .lq-trans-out{font-family:'Inter',sans-serif;font-size:13px;color:#a78bfa;font-style:italic;margin:8px 0 0;line-height:1.6}
                .lq-mini-btn{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.7);border-radius:10px;padding:6px 10px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all 0.15s;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
                .lq-mini-btn:hover{background:rgba(255,255,255,0.10);color:#e3e0f4}
                .lq-mini-btn.is-on{background:rgba(52,211,153,0.18);border-color:#5af0b3;color:#5af0b3}
                .lq-mini-btn.is-fav{background:rgba(236,72,153,0.18);border-color:#f472b6;color:#f472b6}
                .lq-mini-btn.is-amber{background:rgba(251,191,36,0.18);border-color:#fbbf24;color:#fbbf24}
                .lq-trans-select{background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.12);color:rgba(227,224,244,0.7);border-radius:8px;padding:5px 8px;font-size:11px;font-family:'Inter',sans-serif}
                .lq-read-actions{position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(13,13,26,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,0.08);border-radius:24px 24px 0 0;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
                .lq-read-meta-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
                .lq-read-time{font-family:'JetBrains Mono',monospace;font-size:13px;color:#5af0b3;font-weight:700}
                .lq-read-time-sub{font-family:'Inter',sans-serif;font-size:10px;color:rgba(227,224,244,0.4);letter-spacing:0.04em}
                .lq-read-tools{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:10px;padding-bottom:2px}
                .lq-read-tools::-webkit-scrollbar{display:none}
                .lq-read-tools .lq-mini-btn{flex-shrink:0}
                .lq-read-rate{display:flex;gap:3px}
                .lq-rate-pill{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(227,224,244,0.5);border-radius:6px;padding:3px 7px;font-family:'Inter',sans-serif;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s}
                .lq-rate-pill.on{background:rgba(167,139,250,0.2);border-color:#a78bfa;color:#c4b5fd}
                .lq-challenge-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;margin-bottom:10px}
                .lq-challenge-row.on{background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.4)}
                .lq-challenge-lbl{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:rgba(227,224,244,0.7)}
                .lq-challenge-row.on .lq-challenge-lbl{color:#fbbf24}
                .lq-challenge-sub{font-family:'Inter',sans-serif;font-size:10px;color:rgba(227,224,244,0.45);margin-top:1px}
                .lq-toggle{position:relative;width:40px;height:22px;background:rgba(255,255,255,0.08);border:none;border-radius:999px;cursor:pointer;transition:background 0.2s;padding:0;flex-shrink:0}
                .lq-toggle.on{background:#f59e0b}
                .lq-toggle::after{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform 0.2s}
                .lq-toggle.on::after{transform:translateX(18px)}
                .lq-start-quiz{width:100%;padding:14px 20px;border:none;border-radius:16px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;color:#003825;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 8px 24px rgba(52,211,153,0.28)}
                .lq-start-quiz:active{transform:translateY(3px);box-shadow:0 1px 0 0 rgba(0,0,0,0.4),0 4px 12px rgba(52,211,153,0.3)}
                .lq-start-quiz:disabled{opacity:0.5;cursor:not-allowed}
                .lq-pron-card{background:rgba(30,30,44,0.5);border:1px solid rgba(236,72,153,0.3);border-radius:18px;padding:14px;margin-top:16px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
                .lq-pron-h{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:#f472b6;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 10px}
                .lq-pron-sent{background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px 14px;font-family:'Newsreader','Inter',serif;font-size:15px;color:rgba(227,224,244,0.9);line-height:1.6;font-style:italic;margin-bottom:10px;cursor:pointer;transition:all 0.15s;width:100%;text-align:left;font-family:inherit}
                .lq-pron-sent:hover{border-color:rgba(236,72,153,0.3);background:rgba(236,72,153,0.05)}
              `}</style>
              <div className="lq-read-wrap">
                <header className="lq-read-topbar">
                  <button type="button" className="lq-r-btn lq-r-exit" onClick={function(){setStage("home");}} aria-label="Exit reading">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    <span className="lq-r-exit-lbl">Exit</span>
                  </button>
                  <h1 className="lq-r-title">Reading Quest</h1>
                  {currentStoryId&&<button type="button" className={"lq-r-btn"+(isFav?" is-fav":"")} onClick={function(){toggleFav(currentStoryId,topic,level);}} aria-label="Favorite">
                    <svg width="20" height="20" fill={isFav?"currentColor":"none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>}
                  <button type="button" className={"lq-r-btn"+(activeSentence!==null?" is-active":"")} onClick={function(){setActiveSentence(activeSentence!==null?null:"");setTranslation(null);}} aria-label="Translate">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
                  </button>
                </header>

                <div className="lq-read-prog">
                  {Array.from({length:segCount}).map(function(_,i){return<div key={i} className={"lq-seg"+(i<segFilled?" on":"")}/>;})}
                  <span className="lq-seg-pct">{readPct}%</span>
                </div>

                <main className="lq-read-main">
                  <div className="lq-read-header">
                    <span className="lq-read-tag" style={{background:"rgba("+hex2rgb(lvColor)+",0.15)",color:lvColor,border:"1px solid rgba("+hex2rgb(lvColor)+",0.3)"}}>{level} · {selectedTypes.length} questions</span>
                    <h2 className="lq-read-title">{topic}</h2>
                    <div className="lq-read-divider"/>
                    <div className="lq-read-diff">
                      <span className="stars">{"⭐".repeat(difficulty.stars)+"☆".repeat(5-difficulty.stars)}</span>
                      <span>📖 {difficulty.wordCount} words · ~{difficulty.estReadMins} min</span>
                      <span className="newwords">🆕 ~{difficulty.newWords} new</span>
                      {liveWpm>0&&<span className="wpm">⚡ {liveWpm} WPM</span>}
                    </div>
                  </div>

                  {personalizedWords.length>0&&(
                    <div className="lq-personal-banner">
                      <span className="lbl">📚 Personalised</span>
                      <span className="desc">includes:</span>
                      {personalizedWords.map(function(w){return<span key={w} className="word-chip">{w}</span>;})}
                    </div>
                  )}

                  <article className="lq-read-article">
                    {activeSentence!==null?<SentencePassage/>:<WordTokens/>}
                  </article>

                  <p className="lq-read-foot-hint">{activeSentence!==null?"Tap a sentence to listen":hlMode?"Highlight mode: tap to mark words":"Tap any word to look it up"}</p>

                  {activeSentence&&(
                    <div className="lq-panel" style={{borderColor:"rgba(99,102,241,0.35)",background:"rgba(99,102,241,0.07)"}}>
                      <div className="lq-panel-h">
                        <div className="lq-trans-text">{activeSentence}</div>
                        <button type="button" className="lq-panel-close" onClick={function(){setActiveSentence(null);setTranslation(null);}}>×</button>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                        <button type="button" className="lq-mini-btn is-on" onClick={function(){translateSentence(activeSentence);}}>{translating?"…":"🌐 Translate"}</button>
                        <button type="button" className={"lq-mini-btn"+(quotesSaved?" is-amber":"")} onClick={function(){saveSentenceQuote(activeSentence);}} title="Save to Quote Book">{quotesSaved?"✓ Saved":"🔖 Save"}</button>
                        <select className="lq-trans-select" value={translateLang} onChange={function(e){setTranslateLang(e.target.value);try{localStorage.setItem("rq-translate-lang",e.target.value);}catch(ex){}}}>
                          <option value="uz">Uzbek</option><option value="ru">Russian</option><option value="tr">Turkish</option><option value="ar">Arabic</option><option value="de">German</option>
                        </select>
                      </div>
                      {translation&&<p className="lq-trans-out">{translation}</p>}
                    </div>
                  )}

                  {selectedWord&&!activeSentence&&(
                    <div className="lq-panel" style={{borderColor:"rgba(251,191,36,0.3)",background:"rgba(251,191,36,0.06)"}}>
                      <div className="lq-panel-h">
                        <div>
                          <span className="lq-vocab-word">{selectedWord}</span>
                          {wordDef&&wordDef.phonetic&&<span className="lq-vocab-phon">{wordDef.phonetic}</span>}
                        </div>
                        <button type="button" className="lq-panel-close" onClick={function(){setSelectedWord(null);setWordDef(null);}}>×</button>
                      </div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {wordDef&&wordDef.audio&&<button type="button" className="lq-mini-btn is-amber" onClick={function(){new Audio(wordDef.audio).play().catch(function(){});}}>🔊 Listen</button>}
                        <button type="button" className={"lq-mini-btn"+(savedWords.has(selectedWord)?" is-on":"")} onClick={function(){toggleWord(selectedWord);}}>{savedWords.has(selectedWord)?"⭐ Saved":"⭐ Save to vocab"}</button>
                      </div>
                      {wordDefLoading&&<div style={{marginTop:10}}><Skeleton h={12} mb={6}/><Skeleton h={12} w="70%"/></div>}
                      {wordDef&&!wordDefLoading&&wordDef.mode==="translate"&&(function(){
                        var LANG_LABELS={uz:"Uzbek",ru:"Russian",tr:"Turkish",ar:"Arabic",de:"German",es:"Spanish",fr:"French"};
                        return(
                          <>
                            <p className="lq-vocab-def" style={{fontFamily:"'Newsreader','Inter',serif",fontSize:18,fontWeight:700,color:"#fbbf24",direction:wordDef.lang==="ar"?"rtl":"ltr"}}>{wordDef.translation||t("stu_noDefinition")}</p>
                            <p style={{fontSize:10,color:"rgba(227,224,244,0.4)",margin:"4px 0 0",letterSpacing:"0.04em",textTransform:"uppercase"}}>{LANG_LABELS[wordDef.lang]||wordDef.lang||""}</p>
                          </>
                        );
                      })()}
                      {wordDef&&!wordDefLoading&&wordDef.mode!=="translate"&&(
                        <>
                          <p className="lq-vocab-def">{wordDef.def||t("stu_noDefinition")}</p>
                          {wordDef.example&&<p className="lq-vocab-ex">"{wordDef.example}"</p>}
                        </>
                      )}
                    </div>
                  )}

                  {pronMode&&(function(){
                    var sentences=splitSentences(passage);
                    return(
                      <div className="lq-pron-card">
                        <p className="lq-pron-h">🎤 Pronunciation Check</p>
                        {!pronSentence?(
                          <>
                            <p style={{fontSize:12,color:"rgba(227,224,244,0.55)",margin:"0 0 10px"}}>Tap a sentence to practise:</p>
                            <div style={{display:"flex",flexDirection:"column",gap:6}}>
                              {sentences.map(function(s,i){return<button key={i} type="button" className="lq-pron-sent" onClick={function(){setPronSentence(s);setPronResult(null);}}>{s}</button>;})}
                            </div>
                          </>
                        ):(
                          <>
                            <div className="lq-pron-sent" style={{cursor:"default"}}>"{pronSentence}"</div>
                            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                              <button type="button" onClick={function(){startPronCheck(pronSentence);}} disabled={pronRecording} className="lq-mini-btn" style={{flex:1,minWidth:120,justifyContent:"center",background:pronRecording?"#ef4444":"#ec4899",color:"#fff",borderColor:"transparent",padding:"9px 14px",fontSize:13}}>
                                {pronRecording?"● Recording…":"🎤 Record"}
                              </button>
                              {pronRecording&&<button type="button" onClick={function(){if(pronRecRef.current)pronRecRef.current.stop();}} className="lq-mini-btn">⏹ Stop</button>}
                              <button type="button" onClick={function(){setPronSentence("");setPronResult(null);}} className="lq-mini-btn">← Back</button>
                            </div>
                            {pronResult&&pronResult.error&&<ErrorBanner message={pronResult.error} marginBottom={8}/>}
                            {pronResult&&!pronResult.error&&(
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                                  <div style={{fontSize:28,fontWeight:800,fontFamily:"'Outfit',sans-serif",color:pronResult.accuracy>=80?"#5af0b3":pronResult.accuracy>=60?"#fbbf24":"#f87171"}}>{pronResult.accuracy}%</div>
                                  <div>
                                    <div style={{fontSize:12,fontWeight:700,color:"#e3e0f4"}}>{pronResult.accuracy>=80?"Excellent!":pronResult.accuracy>=60?"Good effort!":"Keep practising!"}</div>
                                    <div style={{fontSize:11,color:"rgba(227,224,244,0.5)"}}>Heard: "{pronResult.transcript}"</div>
                                  </div>
                                </div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                                  {pronResult.words.map(function(w,i){
                                    var bg=w.status==="correct"?"rgba(52,211,153,0.18)":w.status==="close"?"rgba(251,191,36,0.18)":"rgba(239,68,68,0.18)";
                                    var col=w.status==="correct"?"#5af0b3":w.status==="close"?"#fbbf24":"#f87171";
                                    return<span key={i} title={w.heard?("heard: "+w.heard):""} style={{background:bg,color:col,borderRadius:7,padding:"3px 9px",fontSize:13,fontWeight:600,cursor:w.heard?"help":"default"}}>{w.word}</span>;
                                  })}
                                </div>
                                <button type="button" onClick={function(){setPronResult(null);}} className="lq-mini-btn" style={{width:"100%",justifyContent:"center"}}>Try again</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </main>

                <footer className="lq-read-actions">
                  <div className="lq-read-meta-row">
                    <span className="lq-read-time">⏱ {formatTime(readingTimerSecs)}</span>
                    {liveWpm>0&&<span className="lq-read-time-sub">{liveWpm} WPM · {getWpmLabel(liveWpm)}</span>}
                    {savedWords.size>0&&<span className="lq-read-time-sub" style={{color:"#06b6d4",fontWeight:700}}>⭐ {savedWords.size}</span>}
                    <div className="lq-read-rate" style={{marginLeft:"auto"}}>{[0.75,1,1.25,1.5].map(function(r){return<button key={r} type="button" onClick={function(){setSpeechRate(r);}} className={"lq-rate-pill"+(speechRate===r?" on":"")}>{r}×</button>;})}</div>
                  </div>

                  <div className="lq-read-tools">
                    <button type="button" className={"lq-mini-btn"+(isSpeaking&&!activeSentence?" is-on":"")} onClick={speakPassage}>{isSpeaking?"⏹ Stop":"🔊 Listen"}</button>
                    <button type="button" className={"lq-mini-btn"+(heatmapOn?" is-amber":"")} onClick={function(){setHeatmapOn(function(h){return!h;});}}>🌡️ Heatmap</button>
                    <button type="button" className={"lq-mini-btn"+(hlMode?" is-amber":"")} onClick={function(){setHlMode(function(m){return!m;});}}>✏️ Highlight{hlWords.size>0?" ("+hlWords.size+")":""}</button>
                    <button type="button" className="lq-mini-btn" onClick={function(){
                      if(rsvpActive){setRsvpActive(false);setRsvpPaused(false);setRsvpIdx(0);setRsvpDone(false);}
                      else{rsvpWordsRef.current=passage.split(/\s+/).filter(Boolean);setRsvpIdx(0);setRsvpPaused(false);setRsvpDone(false);setRsvpActive(true);}
                    }}>⚡ RSVP</button>
                    {(function(){
                      var srSupported=typeof window!=="undefined"&&!!(window.SpeechRecognition||window.webkitSpeechRecognition);
                      return<button type="button" disabled={!srSupported} title={srSupported?undefined:"Speech recognition isn't supported here"} className={"lq-mini-btn"+(pronMode?" is-on":"")} onClick={function(){if(!srSupported)return;setPronMode(function(p){return!p;});setPronSentence("");setPronResult(null);setPronRecording(false);}} style={!srSupported?{opacity:0.5,cursor:"not-allowed"}:{}}>🎤 {pronMode?"Exit":"Pronounce"}</button>;
                    })()}
                  </div>

                  <div className={"lq-challenge-row"+(challengeMode?" on":"")}>
                    <div>
                      <div className="lq-challenge-lbl">⚡ Challenge Mode</div>
                      <div className="lq-challenge-sub">Half the time · 1.5× XP if you finish</div>
                    </div>
                    <button type="button" className={"lq-toggle"+(challengeMode?" on":"")} onClick={function(){setChallengeMode(function(v){return !v;});}} aria-label="Toggle challenge mode"/>
                  </div>

                  <button type="button" onClick={function(){setStage("home");}} className="lq-exit-link">✕ Exit reading</button>

                  <button type="button" onClick={startQuiz} className="lq-start-quiz" style={{background:lvColor,boxShadow:"0 4px 0 0 rgba(0,0,0,0.4),0 8px 24px "+(lv&&lv.glow||"rgba(52,211,153,0.3)")}}>
                    {t("startQuiz")}
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </footer>
              </div>
            </>
          );

          // RSVP speed-reader fullscreen mode
          var rsvpWords=rsvpWordsRef.current||[];
          var rsvpPct=rsvpWords.length>0?Math.round((rsvpIdx/(rsvpWords.length-1))*100):0;
          var rsvpCur=rsvpWords[rsvpIdx]||"";
          var rsvpPrev=rsvpIdx>0?rsvpWords[rsvpIdx-1]:"";
          var rsvpNxt=rsvpIdx<rsvpWords.length-1?rsvpWords[rsvpIdx+1]:"";
          var rsvpMidIdx=Math.max(0,Math.round(rsvpCur.replace(/[^a-zA-Z]/g,"").length*0.3)-1);
          var rsvpPre=rsvpCur.slice(0,rsvpMidIdx),rsvpHi=rsvpCur.slice(rsvpMidIdx,rsvpMidIdx+1),rsvpPost=rsvpCur.slice(rsvpMidIdx+1);
          return(
            <>
              <style>{`
                .lq-rsvp-wrap{margin:-18px -20px -64px;padding:0;min-height:100vh;background:#0d0d1a;display:flex;flex-direction:column}
                @media(min-width:480px){.lq-rsvp-wrap{margin:-22px -28px -72px}}
                .lq-rsvp-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.05)}
                .lq-rsvp-title{font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#a78bfa;letter-spacing:0.08em;text-transform:uppercase;margin:0}
                .lq-rsvp-exit{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.7);border-radius:10px;padding:6px 14px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer}
                .lq-rsvp-exit:hover{background:rgba(255,255,255,0.10);color:#e3e0f4}
                .lq-rsvp-wpm{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;padding:18px;border-bottom:1px solid rgba(255,255,255,0.05)}
                .lq-rsvp-wpm-lbl{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:rgba(227,224,244,0.45);align-self:center;letter-spacing:0.08em;text-transform:uppercase}
                .lq-rsvp-wpm-pill{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.55);border-radius:8px;padding:5px 12px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s}
                .lq-rsvp-wpm-pill.on{background:rgba(167,139,250,0.18);border-color:#a78bfa;color:#c4b5fd;box-shadow:0 0 12px rgba(167,139,250,0.3)}
                .lq-rsvp-prog{padding:10px 18px}
                .lq-rsvp-track{height:4px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden}
                .lq-rsvp-fill{height:100%;background:linear-gradient(90deg,#a78bfa,#c4b5fd);border-radius:999px;box-shadow:0 0 10px rgba(167,139,250,0.5);transition:width 0.1s linear}
                .lq-rsvp-stage{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 18px}
                .lq-rsvp-ghost{font-family:'JetBrains Mono',monospace;font-size:14px;color:rgba(227,224,244,0.25);min-height:22px;letter-spacing:0.02em}
                .lq-rsvp-word{font-family:'Outfit',sans-serif;font-size:54px;font-weight:800;letter-spacing:0.02em;line-height:1;user-select:none;margin:20px 0;text-shadow:0 0 28px rgba(167,139,250,0.3)}
                @media(min-width:480px){.lq-rsvp-word{font-size:64px}}
                .lq-rsvp-word .pre,.lq-rsvp-word .post{color:#e3e0f4}
                .lq-rsvp-word .hi{color:#f472b6}
                .lq-rsvp-counter{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(227,224,244,0.4);margin-top:14px;letter-spacing:0.08em}
                .lq-rsvp-controls{display:flex;justify-content:center;gap:10px;padding:18px;border-top:1px solid rgba(255,255,255,0.05)}
                .lq-rsvp-step{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.65);border-radius:12px;padding:10px 16px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;cursor:pointer}
                .lq-rsvp-play{background:#a78bfa;color:#0d0d1a;border:none;border-radius:14px;padding:11px 32px;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.04em;cursor:pointer;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 0 24px rgba(167,139,250,0.4)}
                .lq-rsvp-play:active{transform:translateY(2px);box-shadow:0 2px 0 0 rgba(0,0,0,0.4),0 0 16px rgba(167,139,250,0.4)}
                .lq-rsvp-done{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 18px;text-align:center}
                .lq-rsvp-done-emoji{font-size:64px;margin-bottom:14px}
                .lq-rsvp-done-h{font-family:'Outfit',sans-serif;font-size:24px;font-weight:700;color:#c4b5fd;margin:0 0 6px}
                .lq-rsvp-done-sub{font-family:'Inter',sans-serif;font-size:13px;color:rgba(227,224,244,0.5);margin:0 0 24px}
              `}</style>
              <div className="lq-rsvp-wrap">
                <div className="lq-rsvp-top">
                  <h1 className="lq-rsvp-title">⚡ Speed Reader</h1>
                  <button type="button" className="lq-rsvp-exit" onClick={function(){setRsvpActive(false);setRsvpPaused(false);setRsvpIdx(0);setRsvpDone(false);}}>✕ Exit</button>
                </div>
                <div className="lq-rsvp-wpm">
                  <span className="lq-rsvp-wpm-lbl">WPM</span>
                  {[150,200,250,300,400,500].map(function(w){return<button key={w} type="button" onClick={function(){setRsvpWpm(w);}} className={"lq-rsvp-wpm-pill"+(rsvpWpm===w?" on":"")}>{w}</button>;})}
                </div>
                <div className="lq-rsvp-prog">
                  <div className="lq-rsvp-track"><div className="lq-rsvp-fill" style={{width:rsvpPct+"%"}}/></div>
                </div>
                {!rsvpDone?(
                  <>
                    <div className="lq-rsvp-stage">
                      <div className="lq-rsvp-ghost">{rsvpPrev}</div>
                      <div className="lq-rsvp-word">
                        <span className="pre">{rsvpPre}</span>
                        <span className="hi">{rsvpHi}</span>
                        <span className="post">{rsvpPost}</span>
                      </div>
                      <div className="lq-rsvp-ghost">{rsvpNxt}</div>
                      <div className="lq-rsvp-counter">{rsvpIdx+1} / {rsvpWords.length}</div>
                    </div>
                    <div className="lq-rsvp-controls">
                      <button type="button" className="lq-rsvp-step" onClick={function(){setRsvpIdx(function(i){return Math.max(0,i-10);});}}>−10</button>
                      <button type="button" className="lq-rsvp-play" onClick={function(){setRsvpPaused(function(p){return !p;});}}>{rsvpPaused?"▶ Play":"⏸ Pause"}</button>
                      <button type="button" className="lq-rsvp-step" onClick={function(){setRsvpIdx(function(i){return Math.min(Math.max(0,rsvpWords.length-1),i+10);});}}>+10</button>
                    </div>
                  </>
                ):(
                  <div className="lq-rsvp-done">
                    <div className="lq-rsvp-done-emoji">✓</div>
                    <h2 className="lq-rsvp-done-h">Speed read complete!</h2>
                    <p className="lq-rsvp-done-sub">{rsvpWords.length} words at {rsvpWpm} WPM</p>
                    <button type="button" onClick={startQuiz} className="lq-start-quiz" style={{background:"#a78bfa",color:"#0d0d1a",boxShadow:"0 4px 0 0 rgba(0,0,0,0.4),0 8px 24px rgba(167,139,250,0.4)",maxWidth:280}}>{t("startQuiz")}</button>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ── QUIZ ──────────────────────────────────────────── */}
        {stage==="quiz"&&q&&(function(){
          var qLvColor=lv?lv.color:"#5af0b3";
          var qSegFilled=current;
          return(
            <>
              <style>{`
                .lq-quiz-wrap{margin:-18px -20px -64px;padding:0;background:#0d0d1a;min-height:100vh}
                @media(min-width:480px){.lq-quiz-wrap{margin:-22px -28px -72px}}
                .lq-quiz-top{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
                .lq-quiz-top .ico-btn{background:none;border:none;color:rgba(227,224,244,0.55);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:10px}
                .lq-quiz-top .ico-btn:hover{background:rgba(255,255,255,0.06);color:#5af0b3}
                .lq-quiz-counter{flex:1;text-align:center;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#e3e0f4;letter-spacing:0.02em}
                .lq-quiz-counter .total{color:rgba(227,224,244,0.4);font-weight:600}
                .lq-quiz-xp{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:999px;background:rgba(52,211,153,0.15);color:#5af0b3;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;border:1px solid rgba(52,211,153,0.3)}
                .lq-quiz-prog{position:sticky;top:48px;z-index:29;background:rgba(13,13,26,0.6);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:4px}
                .lq-quiz-seg{flex:1;height:6px;background:rgba(255,255,255,0.06);border-radius:4px}
                .lq-quiz-seg.on{background:linear-gradient(90deg,#34D399,#5af0b3);box-shadow:0 0 8px rgba(52,211,153,0.4)}
                .lq-quiz-seg.cur{background:rgba(52,211,153,0.4);animation:rqPulseSeg 1.4s ease-in-out infinite}
                @keyframes rqPulseSeg{0%,100%{opacity:0.5}50%{opacity:1}}
                .lq-quiz-main{padding:18px 16px 160px;max-width:680px;margin:0 auto}
                .lq-quiz-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:8px;flex-wrap:wrap}
                .lq-quiz-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.04em;white-space:nowrap}
                .lq-quiz-type{background:rgba(167,139,250,0.15);color:#c4b5fd;border:1px solid rgba(167,139,250,0.3)}
                .lq-quiz-streak{background:rgba(245,158,11,0.18);color:#fbbf24;border:1px solid rgba(245,158,11,0.35)}
                .lq-quiz-timer-card{position:relative;padding:12px 16px;background:rgba(30,30,44,0.45);border:1px solid rgba(255,255,255,0.08);border-radius:14px;margin-bottom:14px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
                .lq-quiz-timer-card.challenge{background:rgba(245,158,11,0.06);border-color:rgba(245,158,11,0.35)}
                .lq-quiz-timer-h{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fbbf24;margin:0 0 6px}
                .lq-quiz-hint{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-radius:14px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);margin-bottom:14px;animation:rqFadeIn 0.3s ease both}
                .lq-quiz-hint .ico{font-size:18px;line-height:1;flex-shrink:0}
                .lq-quiz-hint p{margin:0;font-family:'Inter',sans-serif;font-size:12px;color:#c4b5fd;line-height:1.5;flex:1}
                .lq-quiz-hint .close-btn{background:none;border:none;color:rgba(227,224,244,0.4);cursor:pointer;font-size:16px;padding:0 4px;line-height:1;flex-shrink:0}
                .lq-quiz-passage-toggle{width:100%;background:rgba(30,30,44,0.5);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 14px;color:rgba(227,224,244,0.7);font-family:'Inter',sans-serif;font-weight:600;font-size:12px;cursor:pointer;text-align:left;transition:all 0.15s;display:flex;align-items:center;justify-content:space-between}
                .lq-quiz-passage-toggle:hover{background:rgba(30,30,44,0.7);color:#e3e0f4}
                .lq-quiz-passage-body{background:rgba(13,13,26,0.6);border:1px solid rgba(255,255,255,0.08);border-top:none;border-radius:0 0 12px 12px;padding:14px 16px;line-height:1.85;font-family:'Newsreader','Inter',serif;font-size:15px;color:rgba(227,224,244,0.85);margin-bottom:14px;margin-top:-14px}
                .lq-quiz-card{background:rgba(30,30,44,0.5);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:18px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
                .lq-quiz-q{font-family:'Outfit',sans-serif;font-size:17px;font-weight:700;line-height:1.45;color:#e3e0f4;margin:0 0 16px;letter-spacing:-0.005em}
                .lq-quiz-explain{margin-top:12px;padding:10px 14px;border-radius:12px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.3);font-family:'Inter',sans-serif;font-size:12px;color:rgba(52,211,153,0.9);line-height:1.5}
                .lq-quiz-cta-bar{position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(13,13,26,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,0.08);border-radius:24px 24px 0 0;padding:14px 18px calc(14px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
                .lq-quiz-cta{width:100%;padding:15px 20px;border:none;border-radius:16px;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;color:#003825;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 8px 24px rgba(52,211,153,0.28)}
                .lq-quiz-cta:active{transform:translateY(3px);box-shadow:0 1px 0 0 rgba(0,0,0,0.4),0 4px 12px rgba(52,211,153,0.3)}
                .lq-quiz-cta:disabled{opacity:0.4;cursor:not-allowed;background:rgba(255,255,255,0.06)!important;color:rgba(227,224,244,0.4)!important;box-shadow:0 4px 0 0 rgba(0,0,0,0.3)}
              `}</style>
              <div className="lq-quiz-wrap">
                <header className="lq-quiz-top">
                  <button type="button" className="ico-btn" onClick={function(){if(confirm("Exit quiz? Progress will be lost."))doRestart();}} aria-label="Exit">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div className="lq-quiz-counter">Question {current+1} <span className="total">/ {questions.length}</span></div>
                  <span className="lq-quiz-xp">⚡ {totalXpSoFar}</span>
                </header>

                <div className="lq-quiz-prog">
                  {questions.map(function(_,i){return<div key={i} className={"lq-quiz-seg"+(i<qSegFilled?" on":i===qSegFilled?" cur":"")}/>;})}
                </div>

                <main className="lq-quiz-main">
                  <div className="lq-quiz-meta">
                    <span className="lq-quiz-pill lq-quiz-type">{qLabel(q.type)}</span>
                    {streak>=3&&<span className="lq-quiz-pill lq-quiz-streak">🔥 Streak {streak}</span>}
                  </div>

                  <div className={"lq-quiz-timer-card"+(challengeMode?" challenge":"")}>
                    {challengeMode&&<p className="lq-quiz-timer-h">⚡ {t("challengeModeLabel")}</p>}
                    <Timer limit={challengeMode?Math.floor((lv?lv.timeLimit:180)/2):(lv?lv.timeLimit:180)} running={timerRunning} onExpire={handleExpire}/>
                  </div>

                  {qHint(q.type)&&!dismissedHints.has(q.type)&&(
                    <div className="lq-quiz-hint">
                      <span className="ico">💡</span>
                      <p>{qHint(q.type)}</p>
                      <button type="button" className="close-btn" onClick={function(){setDismissedHints(function(s){var n=new Set(s);n.add(q.type);return n;});}} title="Got it">✕</button>
                    </div>
                  )}

                  <button type="button" onClick={function(){setShowPassage(function(p){return!p;});}} className="lq-quiz-passage-toggle" style={showPassage?{borderRadius:"12px 12px 0 0"}:{}}>
                    <span>{showPassage?"📖 "+t("hidePassage"):"📖 "+t("showPassage")}</span>
                    <span style={{color:"rgba(227,224,244,0.4)",transform:showPassage?"rotate(180deg)":"none",transition:"transform 0.2s"}}>⌄</span>
                  </button>
                  {showPassage&&(
                    <div className="lq-quiz-passage-body">{passage.split(/\n{2,}/).map(function(p,i){return<p key={i} style={{margin:i>0?"0.7em 0 0":0}}>{p}</p>;})}</div>
                  )}

                  <div className="lq-quiz-card" style={{marginTop:showPassage?0:14}}>
                    {(q.q)&&<p className="lq-quiz-q">{q.q}</p>}
                    {(q.instruction)&&<p className="lq-quiz-q">{q.instruction}</p>}
                    {q.type==="gap_word"&&!q.q&&<p className="lq-quiz-q">{t("fillInTheBlank")}</p>}
                    {q.type==="mcq"&&<McqQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
                    {q.type==="gap_word"&&<GapWordQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
                    {q.type==="gap_sentence"&&<GapSentQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
                    {q.type==="matching"&&<MatchingQ q={q} matches={matchState} conf={confirmed} shuffled={shuffledRights} onMatch={function(li,origIdx){setMatchState(function(m){var n={};for(var k in m)n[k]=m[k];n[li]=origIdx;return n;});}}/>}
                    {q.type==="heading"&&<HeadingQ q={q} userMap={headingState} conf={confirmed} onMatch={function(pi,hi){setHeadingState(function(m){var n={};for(var k in m)n[k]=m[k];n[pi]=hi;return n;});}}/>}
                    {q.type==="qa"&&<QAQ q={q} val={userAnswers[current]||""} conf={confirmed} onChange={function(v){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=v;return n;});}}/>}
                    {q.type==="tfnm"&&<TfnmQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
                    {q.type==="ynng"&&<YnngQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
                    {confirmed&&q.explanation&&q.type!=="qa"&&<div className="lq-quiz-explain">{q.explanation}</div>}
                  </div>
                </main>

                <footer className="lq-quiz-cta-bar">
                  {!confirmed?(
                    <button type="button" onClick={doConfirm} disabled={!canConfirm()} className="lq-quiz-cta" style={canConfirm()?{background:qLvColor,boxShadow:"0 4px 0 0 rgba(0,0,0,0.4),0 8px 24px "+(lv&&lv.glow||"rgba(52,211,153,0.3)")}:{}}>
                      {t("submitAnswer")}
                    </button>
                  ):(
                    <button type="button" onClick={doNext} className="lq-quiz-cta" style={{background:qLvColor,boxShadow:"0 4px 0 0 rgba(0,0,0,0.4),0 8px 24px "+(lv&&lv.glow||"rgba(52,211,153,0.3)")}}>
                      {current+1>=questions.length?t("seeResults"):t("nextQuestion")}
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  )}
                </footer>
              </div>
            </>
          );
        })()}

        {/* ── RESULT ────────────────────────────────────────── */}
        {stage==="result"&&result&&(function(){
          var rsLvColor=lv?lv.color:"#5af0b3";
          var rsPctColor=pctColor(result.pct);
          var grade=result.pct>=80?"excellent":result.pct>=60?"good":"keep";
          // Pick the motivational category by precedence: level-up >
          // streak milestone (3/7/14/30) > grade. Falls back to "generic"
          // if the chosen category has no quotes.
          var motivCategory=result.leveledUp?"levelUp"
            :(result.earnedShield||[3,7,14,30].indexOf(result.newStreakVal)!==-1)?"streak"
            :grade;
          var motivQuote=pickMotivation(motivCategory)||pickMotivation("generic");
          var motivAccent=motivCategory==="levelUp"?"#5af0b3"
            :motivCategory==="streak"?"#a78bfa"
            :motivCategory==="excellent"?"#5af0b3"
            :motivCategory==="good"?"#fbbf24"
            :"#c4b5fd";
          // F5 result-screen nudge — frame what THIS quiz did to my weekly
          // standing against friends. Reuses pickResultNudge for testability.
          var resultNudge=(function(){
            if(!currentUser)return null;
            var weeklyMap={};
            (weeklyLb||[]).forEach(function(e){if(e&&e.name)weeklyMap[e.name]=Number(e.xp)||0;});
            var rows=(myData.friends||[]).map(function(fn){return{name:fn,weeklyXp:weeklyMap[fn]||0};});
            return pickResultNudge({
              currentUserName:currentUser.name,
              friends:rows,
              myNewWeeklyXp:weeklyMap[currentUser.name]||0,
              xpEarned:Number(result.xp)||0,
            });
          })();
          return(
          <>
            <style>{`
              .lq-res-wrap{margin:-18px -20px -64px;padding:0 0 24px}
              @media(min-width:480px){.lq-res-wrap{margin:-22px -28px -72px}}
              .lq-res-hero{position:relative;text-align:center;padding:36px 18px 24px;overflow:hidden}
              .lq-res-hero::before{content:"";position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,${grade==="excellent"?"rgba(52,211,153,0.18)":grade==="good"?"rgba(251,191,36,0.15)":"rgba(167,139,250,0.15)"} 0%,transparent 70%);pointer-events:none}
              .lq-res-trophy{position:relative;font-size:84px;line-height:1;margin-bottom:8px;filter:drop-shadow(0 0 32px ${grade==="excellent"?"rgba(52,211,153,0.6)":grade==="good"?"rgba(251,191,36,0.5)":"rgba(167,139,250,0.4)"});animation:rqPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both}
              .lq-res-h{position:relative;font-family:'Outfit',sans-serif;font-size:30px;font-weight:800;margin:6px 0 4px;color:${grade==="excellent"?"#5af0b3":grade==="good"?"#fbbf24":"#c4b5fd"};letter-spacing:-0.02em;line-height:1.1;text-shadow:0 0 18px ${grade==="excellent"?"rgba(52,211,153,0.3)":grade==="good"?"rgba(251,191,36,0.3)":"rgba(167,139,250,0.3)"}}
              .lq-res-sub{position:relative;font-family:'Inter',sans-serif;font-size:13px;color:rgba(227,224,244,0.55);margin:0;letter-spacing:0.02em}
              .lq-res-content{padding:0 16px}
              .lq-res-score-card{position:relative;background:rgba(30,30,44,0.5);border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:22px 18px;margin-bottom:14px;text-align:center;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);overflow:hidden}
              .lq-res-score{font-family:'Outfit',sans-serif;font-size:48px;font-weight:800;color:#e3e0f4;line-height:1;letter-spacing:-0.02em;margin-bottom:4px}
              .lq-res-score-sub{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.5);letter-spacing:0.12em;text-transform:uppercase}
              .lq-res-stars{font-size:22px;margin:10px 0 16px;letter-spacing:4px}
              .lq-res-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:8px}
              .lq-res-stat{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px 6px;text-align:center}
              .lq-res-stat-v{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:800;line-height:1.1}
              .lq-res-stat-l{font-family:'Inter',sans-serif;font-size:9px;color:rgba(227,224,244,0.45);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase}
              .lq-res-bonus{margin-top:12px;padding:8px 14px;border-radius:12px;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.3);font-family:'Inter',sans-serif;font-size:12px;color:#fbbf24;font-weight:600;display:inline-block}
            `}</style>
            <div className="lq-res-wrap">
              <div className="lq-res-hero">
                <div className="lq-res-trophy">{result.pct>=80?"🏆":result.pct>=60?"⭐":"📖"}</div>
                <h2 className="lq-res-h">{grade==="excellent"?t("excellent"):grade==="good"?t("goodJob"):t("keepGoing")}</h2>
                <p className="lq-res-sub">{level} · {topic}</p>
              </div>

              <div className="lq-res-content">
                {resultNudge&&(function(){
                  var rn=resultNudge;
                  var msg=t("stu_resnudge_"+rn.category)||"";
                  Object.keys(rn.params||{}).forEach(function(k){msg=msg.replace("{"+k+"}",rn.params[k]);});
                  var accent=rn.category==="passedFriend"?"#5af0b3":rn.category==="closingGap"?"#fbbf24":"#c4b5fd";
                  var ctaLabel=rn.ctaTo==="weekly"?t("stu_resnudge_cta_view"):t("stu_nudge_cta_play");
                  return(
                    <div style={{margin:"0 0 12px",padding:"12px 14px",borderRadius:14,background:"rgba("+hex2rgb(accent)+",0.08)",border:"1px solid rgba("+hex2rgb(accent)+",0.4)"}}>
                      <div style={{fontSize:13,color:"#e3e0f4",lineHeight:1.4,marginBottom:8}}>{msg}</div>
                      <button type="button" onClick={function(){
                        try{track("result_nudge_cta",{category:rn.category,to:rn.ctaTo});}catch(e){}
                        if(rn.ctaTo==="weekly")setStage("weekly");
                        else{setStage("home");setTimeout(function(){var el=document.getElementById("rq-level-picker");if(el)el.scrollIntoView({behavior:"smooth",block:"start"});},80);}
                      }} style={{padding:"6px 14px",borderRadius:10,border:"none",background:accent,color:"#0d0d1a",fontSize:12,fontWeight:800,cursor:"pointer"}}>{ctaLabel} →</button>
                    </div>
                  );
                })()}
                {motivQuote&&(
                  <div style={{margin:"0 0 12px",padding:"12px 16px",borderRadius:14,background:"rgba("+hex2rgb(motivAccent)+",0.06)",border:"1px solid rgba("+hex2rgb(motivAccent)+",0.28)",textAlign:"center"}}>
                    <p style={{margin:0,fontFamily:"'Newsreader','Inter',serif",fontSize:14,fontStyle:"italic",color:"rgba(227,224,244,0.85)",lineHeight:1.5}}>
                      <span style={{color:motivAccent,fontWeight:700,fontStyle:"normal",marginRight:6}}>“</span>{motivQuote}<span style={{color:motivAccent,fontWeight:700,fontStyle:"normal",marginLeft:6}}>”</span>
                    </p>
                  </div>
                )}
                {result.leveledUp&&(
                  <div className="rq-pop" style={{margin:"0 0 12px",padding:"14px 16px",borderRadius:14,background:"linear-gradient(135deg,rgba(52,211,153,0.14),rgba(167,139,250,0.08))",border:"1px solid rgba(52,211,153,0.5)",textAlign:"center"}}>
                    <div style={{fontSize:28,lineHeight:1,marginBottom:4}}>🎖️</div>
                    <div style={{fontSize:14,fontWeight:800,color:"#5af0b3",letterSpacing:"0.03em",textTransform:"uppercase"}}>LEVEL {result.newAppLevel} UNLOCKED</div>
                  </div>
                )}
                <div className="lq-res-score-card">
                  <div className="lq-res-score" style={{color:rsLvColor}}>{result.score}<span style={{color:"rgba(227,224,244,0.4)",fontSize:32,fontWeight:600}}>/{result.maxScore}</span></div>
                  <div className="lq-res-score-sub">{result.pct}% Correct</div>
                  <div className="lq-res-stars">{"⭐".repeat(result.stars)+"☆".repeat(5-result.stars)}</div>
                  <div className="lq-res-stat-grid">
                    {[
                      {v:"+"+result.xp,l:"XP earned",c:rsLvColor},
                      {v:result.pct+"%",l:"Accuracy",c:rsPctColor},
                      {v:formatTime(result.timeSecs),l:"Time",c:"#a78bfa"},
                      {v:"#"+(result.rank+1),l:"Rank",c:"#fbbf24"},
                      (result.wpm>0?{v:result.wpm,l:"WPM",c:"#5af0b3"}:null)
                    ].filter(Boolean).map(function(s){return<div key={s.l} className="lq-res-stat"><div className="lq-res-stat-v" style={{color:s.c}}>{s.v}</div><div className="lq-res-stat-l">{s.l}</div></div>;})}
                  </div>
                  {result.timeBonus>0&&<div className="lq-res-bonus">⚡ {t("speedBonus")}: +{result.timeBonus} XP</div>}
                </div>
            {result.wasChallenge&&(
              <div style={{...CARD,marginBottom:10,padding:14,background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))",borderColor:"rgba(245,158,11,0.5)",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:4}}>⚡</div>
                <div style={{fontSize:15,fontWeight:900,color:"#fbbf24",marginBottom:2}}>{t("challengeComplete")}</div>
                <div style={{fontSize:12,color:"#9ca3af"}}>{t("youBeatTheClock")}</div>
              </div>
            )}
            {result.newBadges&&result.newBadges.length>0&&(
              <div style={{...CARD,marginBottom:10,background:"rgba(251,191,36,0.08)",borderColor:"rgba(251,191,36,0.4)"}}>
                <p style={{fontWeight:700,fontSize:12,color:"#fbbf24",marginBottom:10,textAlign:"left"}}>🏅 {t("newBadgeUnlocked")}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {result.newBadges.map(function(id,i){
                    var b=BADGES.find(function(x){return x.id===id;});
                    if(!b)return null;
                    return(<div key={id} className="rq-pop" style={{display:"flex",alignItems:"center",gap:8,background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:10,padding:"8px 12px",flex:"1 1 auto",animationDelay:i*0.12+"s"}}>
                      <span style={{fontSize:22}}>{b.icon}</span>
                      <div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>{badgeName(b.id)}</div><div style={{fontSize:11,color:"#9ca3af"}}>{badgeDesc(b.id)}</div></div>
                    </div>);
                  })}
                </div>
              </div>
            )}
            {result.earnedShield&&(
              <div style={{...CARD,marginBottom:10,background:"rgba(99,102,241,0.08)",borderColor:"rgba(99,102,241,0.4)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:28}}>🛡️</span>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>STREAK SHIELD EARNED!</div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>{result.newStreakVal}-day milestone — you now have {shields} shield{shields!==1?"s":""}. It will save your streak if you miss a day.</div>
                    {(function(){var q=pickMotivation("streak");return q?<div style={{marginTop:6,fontSize:11,color:"#c4b5fd",fontStyle:"italic"}}>“{q}”</div>:null;})()}
                  </div>
                </div>
              </div>
            )}
            {result.completedGoals&&result.completedGoals.length>0&&(
              <div style={{...CARD,marginBottom:10,background:"rgba(99,102,241,0.08)",borderColor:"rgba(99,102,241,0.4)"}}>
                <p style={{fontWeight:700,fontSize:12,color:"#a78bfa",marginBottom:8,textAlign:"left"}}>🎯 GOAL{result.completedGoals.length>1?"S":""} ACHIEVED!</p>
                {result.completedGoals.map(function(id){
                  var def=GOAL_DEFS.find(function(d){return d.id===id;});
                  return def?(
                    <div key={id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:16}}>{def.icon}</span>
                      <span style={{fontSize:13,color:"#c7d2fe",fontWeight:600}}>{goalLabel(def.id)}</span>
                      <span style={{marginLeft:"auto",fontSize:12,color:"#34d399",fontWeight:700}}>✓</span>
                    </div>
                  ):null;
                })}
              </div>
            )}
            {result.newQuests&&result.newQuests.length>0&&(
              <div style={{...CARD,marginBottom:10,background:"rgba(52,211,153,0.07)",borderColor:"rgba(52,211,153,0.35)"}}>
                <p style={{fontWeight:700,fontSize:12,color:"#34d399",marginBottom:8,textAlign:"left"}}>QUEST{result.newQuests.length>1?"S":""} COMPLETE! +{result.questBonus} XP</p>
                {result.newQuests.map(function(q){return(
                  <div key={q.id} style={{display:"flex",alignItems:"center",gap:8,textAlign:"left",marginBottom:4}}>
                    <span style={{fontSize:14,color:"#34d399"}}>✓</span>
                    <span style={{fontSize:13,color:"#d1fae5",fontWeight:600}}>{q.title}</span>
                    <span style={{fontSize:12,color:"#34d399",marginLeft:"auto",fontWeight:700}}>+{q.xp} XP</span>
                  </div>
                );})}
              </div>
            )}
            <div style={{...CARD,marginBottom:10,textAlign:"left"}}>
              <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>{t("breakdown")}</p>
              {result.answers&&result.answers.map?result.answers.map(function(ok,i){return<div key={i} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:6}}><span style={{fontSize:13,color:ok?"#34d399":"#ef4444"}}>{ok?"✓":"✕"}</span><span style={{fontSize:12,color:"#d1d5db",flex:1}}>{questions[i]?questions[i].q||questions[i].instruction||questions[i].sentence||qLabel(questions[i].type)||("Q "+(i+1)):""}</span></div>;}):null}
            </div>
            {result.typeStats&&Object.keys(result.typeStats).length>1&&(
              <div style={{...CARD,marginBottom:10,textAlign:"left"}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:10}}>BY QUESTION TYPE</p>
                {Object.keys(result.typeStats).map(function(t){
                  var ts=result.typeStats[t];var tp=ts.max>0?Math.round(ts.earned/ts.max*100):0;
                  return(<div key={t} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                      <span style={{color:"#9ca3af"}}>{qLabel(t)}</span>
                      <span style={{color:pctColor(tp),fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{tp}%</span>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:tp+"%",background:pctColor(tp),borderRadius:999,transition:"width 0.5s ease"}}/>
                    </div>
                  </div>);
                })}
              </div>
            )}
            {result.wasDaily&&dailyLb.length>0&&(
              <div style={{...CARD,marginBottom:10,textAlign:"left",borderColor:"rgba(251,191,36,0.3)"}}>
                <p style={{fontWeight:700,fontSize:11,color:"#fbbf24",marginBottom:8}}>TODAY'S DAILY BOARD</p>
                {dailyLb.slice(0,5).map(function(e,i){
                  var isMe=currentUser&&e.name===currentUser.name;
                  return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<Math.min(dailyLb.length,5)-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                    <span style={{width:22,fontSize:11,color:"#fbbf24",fontWeight:700}}>{i+1}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"#fbbf24":"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</span>
                    <span style={{fontSize:12,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:"#fbbf24"}}>{e.xp} XP</span>
                    <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:pctColor(e.pct)}}>{e.pct}%</span>
                  </div>);
                })}
              </div>
            )}
            {(function(){
              var sug=currentUser?getAdaptiveSuggestion(currentUser.games,level):null;
              if(!sug)return null;
              var sugLv=getLv(sug.level);
              var isUp=sug.direction==="up";
              return(
                <div style={{...CARD,marginBottom:10,padding:14,borderColor:isUp?"rgba(52,211,153,0.4)":"rgba(251,191,36,0.4)",background:isUp?"rgba(52,211,153,0.06)":"rgba(251,191,36,0.06)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:28}}>{isUp?"🚀":"💡"}</div>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontSize:13,fontWeight:700,color:isUp?"#34d399":"#fbbf24",marginBottom:2}}>
                        {isUp?"Level up?":"Slow down a bit?"}
                      </div>
                      <div style={{fontSize:11,color:"#9ca3af"}}>
                        {isUp
                          ?"You're averaging "+sug.avg+"% on "+level+" — ready for "+sug.level+"?"
                          :"Averaging "+sug.avg+"% on "+level+" — try "+sug.level+" to build confidence."}
                      </div>
                    </div>
                    <button onClick={function(){doRestart();setLevel(sug.level);}} style={{...mkBtn(sugLv.color,"#0d0d1a"),padding:"8px 14px",fontSize:12,flexShrink:0}}>Try {sug.level}</button>
                  </div>
                </div>
              );
            })()}
            <div style={{...CARD,marginBottom:10,padding:14,background:"rgba(245,158,11,0.06)",borderColor:"rgba(245,158,11,0.3)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",marginBottom:2}}>{t("writingChallenge")}</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>Write a short summary of the passage and get AI feedback on your writing.</div>
                </div>
                <button onClick={function(){setWriteSummary("");setWriteFeedback(null);setWriteError("");setStage("writefeedback");}} style={{...mkBtn("#f59e0b","#0d0d1a"),padding:"8px 16px",fontSize:12,flexShrink:0}}>Start →</button>
              </div>
            </div>
            <div style={{...CARD,marginBottom:10,padding:14,background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.3)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#f87171",marginBottom:2}}>{t("errorHunt")}</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>Find 5 deliberate errors hidden in the passage. Can you spot them all?</div>
                </div>
                <button onClick={function(){
                  setEcData(null);setEcSelected(new Set());setEcRevealed(false);setEcError("");setEcLoading(true);setStage("errorcorrect");
                  setTimeout(function(){
                    try{
                      var d=injectErrors(passage,level);
                      if(!d.errors||d.errors.length<3)throw new Error("Not enough errors could be injected. Try another passage.");
                      setEcData(d);
                    }catch(e){setEcError(e.message||"Failed — try again.");setStage("result");}
                    setEcLoading(false);
                  },0);
                }} style={{...mkBtn("#ef4444","#fff0f0"),padding:"8px 16px",fontSize:12,flexShrink:0}}>Start →</button>
              </div>
            </div>
            {/* Feature 1: Auto Vocab Prompt */}
            {autoVocabWords.length>0&&!autoVocabDismissed&&currentUser&&(
              <div style={{...CARD,marginBottom:10,padding:14,borderColor:"rgba(6,182,212,0.4)",background:"rgba(6,182,212,0.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#06b6d4"}}>📚 New words found</div>
                  <button onClick={function(){setAutoVocabDismissed(true);}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                  {autoVocabWords.map(function(w){
                    var already=vocab.some(function(v){return v.word===w;});
                    return<span key={w} style={{background:already?"rgba(34,197,94,0.15)":"rgba(6,182,212,0.15)",color:already?"#22c55e":"#06b6d4",borderRadius:999,padding:"3px 10px",fontSize:12,fontWeight:600}}>{w}{already?" ✓":""}</span>;
                  })}
                </div>
                <button onClick={function(){
                  var today=todayKey();
                  var toAdd=autoVocabWords.filter(function(w){return!vocab.some(function(v){return v.word===w;});});
                  if(!toAdd.length){setAutoVocabDismissed(true);return;}
                  var newEntries=toAdd.map(function(w){return{word:w,level:level,topic:topic,date:today,status:"new",def:"",example:"",srInterval:0,nextReview:srsNextDate(SRS_INTERVALS[0])};});
                  var nv=vocab.concat(newEntries);var nAll={};for(var k in allVocab)nAll[k]=allVocab[k];nAll[currentUser.name]=nv;
                  setVocab(nv);setAllVocab(nAll);saveVocab(nAll);setAutoVocabDismissed(true);
                }} style={{...mkBtn("#06b6d4","#0d0d1a"),fontSize:12,padding:"7px 14px"}}>+ Add {autoVocabWords.filter(function(w){return!vocab.some(function(v){return v.word===w;});}).length} to Vocab</button>
              </div>
            )}
            {/* ── Story Challenge Panel ── */}
            {result.storyId&&currentUser&&(function(){
              var friends=myData.friends||[];
              if(!friends.length)return null;
              return(
                <div style={{...CARD,marginBottom:10,padding:14,borderColor:"rgba(239,68,68,0.4)",background:"rgba(239,68,68,0.05)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#f87171",marginBottom:2}}>⚔️ Challenge a Friend</div>
                      <div style={{fontSize:11,color:"#9ca3af"}}>Dare a friend to beat your {result.pct}% on this story — 24h to respond.</div>
                    </div>
                    <button onClick={function(){setStoryChallengeOpen(function(v){return !v;});setStoryChallengeMsg("");}} style={{...mkBtn("#ef4444","#fff"),padding:"8px 16px",fontSize:12,flexShrink:0}}>{storyChallengeOpen?"Cancel":"Challenge →"}</button>
                  </div>
                  {storyChallengeOpen&&(
                    <div style={{marginTop:12,borderTop:"1px solid rgba(239,68,68,0.2)",paddingTop:10}}>
                      <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>Pick a friend to challenge:</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {friends.map(function(fn){
                          var alreadySent=(myData.sent||[]).some(function(s){return s.status==="pending"&&s.to===fn&&s.storyId===result.storyId&&s.expiresAt>Date.now();});
                          return(
                            <button key={fn} disabled={alreadySent} onClick={function(){sendStoryChallenge(fn);}} style={{...mkBtn(alreadySent?"#374151":"#ef4444",alreadySent?"#6b7280":"#fff"),padding:"6px 14px",fontSize:12,opacity:alreadySent?0.6:1}}>
                              {fn}{alreadySent?" ✓":""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {storyChallengeMsg&&<div style={{fontSize:12,color:"#f87171",marginTop:8,fontWeight:600}}>{storyChallengeMsg}</div>}
                </div>
              );
            })()}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
                  <button type="button" onClick={function(){setLbLevel(level);setStage("leaderboard");}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.10)",color:"rgba(227,224,244,0.85)",borderRadius:14,padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:0.04,transition:"all 0.15s"}}>🏆 {t("leaderboard")}</button>
                  {result.storyId&&<button type="button" onClick={function(){setDiscussStoryId(result.storyId);setStage("discuss");}} style={{background:"rgba(236,72,153,0.12)",border:"1px solid rgba(236,72,153,0.3)",color:"#f472b6",borderRadius:14,padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:0.04,transition:"all 0.15s"}}>💬 Discuss</button>}
                  <button type="button" onClick={function(){setTutorChat([]);setStage("tutor");}} style={{background:"rgba(14,165,233,0.12)",border:"1px solid rgba(14,165,233,0.3)",color:"#7dd3fc",borderRadius:14,padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:0.04,transition:"all 0.15s"}}>🤖 Tutor</button>
                  <button type="button" onClick={doShare} style={{background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.3)",color:"#c4b5fd",borderRadius:14,padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:0.04,transition:"all 0.15s"}} title="Share your result">📤 Share</button>
                  {quotes.length>0&&<button type="button" onClick={function(){setStage("quotes");}} style={{background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",borderRadius:14,padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:0.04,transition:"all 0.15s"}}>🔖 Quotes</button>}
                  <button type="button" onClick={function(){setStage("profile");}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.10)",color:"rgba(227,224,244,0.85)",borderRadius:14,padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer",letterSpacing:0.04,transition:"all 0.15s"}}>👤 {t("profile")}</button>
                </div>
                <button type="button" onClick={doRestart} style={{width:"100%",marginTop:14,padding:"15px 20px",border:"none",borderRadius:16,background:rsLvColor,color:"#003825",fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:14,letterSpacing:0.18,textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 4px 0 0 rgba(0,0,0,0.4),0 8px 24px "+(lv&&lv.glow||"rgba(52,211,153,0.3)")}}>
                  ▶ {t("playAgain")}
                </button>
              </div>
            </div>
          </>
          );
        })()}

        {/* ── MISSED-QUESTION REVIEW ────────────────────────── */}
        {stage==="review"&&currentUser&&(function(){
          var todayL=todayKey();
          var due=reviewQueue.filter(function(r){return r.nextReview<=todayL;});
          if(!due.length)return(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{fontSize:40,marginBottom:12}}>✅</div>
              <div style={{fontSize:16,fontWeight:700,color:"#34d399",marginBottom:8}}>{t("allCaughtUp")}</div>
              <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>No reviews due today.</div>
              <button onClick={function(){setStage("home");}} style={{...mkBtn("#6366f1"),padding:"10px 24px"}}>{t("backHome")}</button>
            </div>
          );
          if(reviewIdx>=due.length){
            return(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:40,marginBottom:12}}>🎉</div>
                <div style={{fontSize:16,fontWeight:700,color:"#34d399",marginBottom:8}}>{t("reviewComplete")}</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>You reviewed {due.length} question{due.length!==1?"s":""}.</div>
                <button onClick={function(){setStage("home");}} style={{...mkBtn("#6366f1"),padding:"10px 24px"}}>{t("backHome")}</button>
              </div>
            );
          }
          var item=due[reviewIdx];
          var rq2=item.q;
          var isCorrect=false;
          if(reviewConfirmed&&reviewAns!==null){
            if(rq2.type==="mcq"||rq2.type==="gap_word"||rq2.type==="gap_sentence"||rq2.type==="tfnm"||rq2.type==="ynng"){
              isCorrect=Number(reviewAns)===Number(rq2.answer);
            } else if(rq2.type==="qa"){
              var lo=(reviewAns||"").toLowerCase();var hits=0;
              (rq2.keywords||[]).forEach(function(k){if(lo.includes(k.toLowerCase()))hits++;});
              isCorrect=hits>=Math.ceil((rq2.keywords||[]).length/2);
            }
          }
          function advanceReview(correct){
            var updated=reviewQueue.map(function(r){
              if(r.id!==item.id)return r;
              var nextIdx=correct?Math.min((r.srInterval||0)+1,SRS_INTERVALS.length-1):0;
              var done=correct&&nextIdx>=SRS_INTERVALS.length;
              return Object.assign({},r,{srInterval:nextIdx,nextReview:done?null:srsNextDate(SRS_INTERVALS[nextIdx])});
            }).filter(function(r){return r.nextReview!==null;});
            localStorage.setItem("rq-review-"+currentUser.name,JSON.stringify(updated));
            setReviewQueue(updated);setReviewIdx(reviewIdx+1);setReviewAns(null);setReviewConfirmed(false);
          }
          return(
            <div>
              <header className="lq-sub-topbar">
                <button type="button" className="lq-sub-back" onClick={function(){setStage("home");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#c084fc"}}>🔁</span> Review</h1>
                <span style={{fontSize:12,color:"rgba(227,224,244,0.5)",fontFamily:"'JetBrains Mono',monospace",minWidth:38,textAlign:"right"}}>{reviewIdx+1}/{due.length}</span>
              </header>
              {/* progress bar */}
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,marginBottom:16,overflow:"hidden"}}>
                <div style={{height:"100%",width:(reviewIdx/due.length*100)+"%",background:"#a855f7",borderRadius:999,transition:"width 0.3s"}}/>
              </div>
              <div style={{...CARD,marginBottom:12,padding:14}}>
                <div style={{fontSize:10,color:"#6b7280",letterSpacing:0.6,marginBottom:6}}>{item.topic} · {item.level} · {qLabel(rq2.type)}</div>
                {rq2.instruction&&<p style={{fontSize:13,color:"#9ca3af",margin:"0 0 6px",fontStyle:"italic"}}>{rq2.instruction}</p>}
                <p style={{fontSize:14,fontWeight:600,color:"#f3f4f6",margin:"0 0 12px",lineHeight:1.5}}>{rq2.q||rq2.sentence}</p>
                {(rq2.type==="mcq"||rq2.type==="gap_word"||rq2.type==="gap_sentence"||rq2.type==="tfnm"||rq2.type==="ynng")&&(
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {(rq2.options||[]).map(function(opt,oi){
                      var chosen=reviewAns!==null&&Number(reviewAns)===oi;
                      var isRight=reviewConfirmed&&oi===Number(rq2.answer);
                      var isWrong=reviewConfirmed&&chosen&&!isRight;
                      var bg=isRight?"rgba(52,211,153,0.15)":isWrong?"rgba(239,68,68,0.12)":chosen?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.04)";
                      var border=isRight?"rgba(52,211,153,0.6)":isWrong?"rgba(239,68,68,0.5)":chosen?"rgba(99,102,241,0.5)":"rgba(255,255,255,0.08)";
                      var col=isRight?"#34d399":isWrong?"#f87171":chosen?"#a78bfa":"#d1d5db";
                      return(
                        <button key={oi} disabled={reviewConfirmed} onClick={function(){setReviewAns(oi);}} style={{textAlign:"left",background:bg,border:"1px solid "+border,borderRadius:10,padding:"10px 12px",color:col,fontWeight:chosen||isRight?700:400,fontSize:13,cursor:reviewConfirmed?"default":"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                          {isRight&&"✓ "}{isWrong&&"✗ "}{opt}
                        </button>
                      );
                    })}
                  </div>
                )}
                {rq2.type==="qa"&&(
                  <textarea value={reviewAns||""} onChange={function(e){if(!reviewConfirmed)setReviewAns(e.target.value);}} disabled={reviewConfirmed} placeholder="Type your answer…" style={{width:"100%",minHeight:70,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f3f4f6",fontSize:13,padding:"9px 12px",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
                )}
                {reviewConfirmed&&rq2.explanation&&(
                  <div style={{marginTop:10,padding:"9px 12px",borderRadius:10,background:isCorrect?"rgba(52,211,153,0.08)":"rgba(239,68,68,0.08)",border:"1px solid "+(isCorrect?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)")}}>
                    <div style={{fontSize:12,fontWeight:700,color:isCorrect?"#34d399":"#f87171",marginBottom:3}}>{isCorrect?"✓ Correct!":"✗ Incorrect"}</div>
                    <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.5}}>{rq2.explanation}</div>
                  </div>
                )}
              </div>
              {!reviewConfirmed?(
                <button onClick={function(){setReviewConfirmed(true);}} disabled={reviewAns===null} style={{...mkBtn(reviewAns!==null?"#a855f7":"#374151","#0d0d1a"),width:"100%",padding:"12px",fontSize:14,fontWeight:800}}>Check Answer</button>
              ):(
                <button onClick={function(){advanceReview(isCorrect);}} style={{...mkBtn(isCorrect?"#34d399":"#6366f1","#0d0d1a"),width:"100%",padding:"12px",fontSize:14,fontWeight:800}}>{isCorrect?"Next →":"Got it — Next →"}</button>
              )}
              <div style={{marginTop:8,textAlign:"center",fontSize:11,color:"#4b5563"}}>
                {(item.srInterval||0)===0?"Next review: tomorrow":("Next review in "+(SRS_INTERVALS[Math.min((item.srInterval||0)+1,SRS_INTERVALS.length-1)])+"d if correct")}
              </div>
            </div>
          );
        })()}

        {/* ── VOCAB NOTEBOOK ────────────────────────────────── */}
        {stage==="vocab"&&currentUser&&(function(){
          var words=vocab.slice().reverse();
          var dueWords=words.filter(srsDueToday);
          var reviewWords=words.filter(function(w){return w.status!=="known";});
          var display=vocabFilter==="due"?dueWords:vocabFilter==="review"?reviewWords:words;
          var safeIdx=display.length>0?vocabCard%display.length:0;
          var curWord=display.length>0?display[safeIdx]:null;
          function saveVocabUpdate(nv){setVocab(nv);var nAll={};for(var k in allVocab)nAll[k]=allVocab[k];nAll[currentUser.name]=nv;setAllVocab(nAll);saveVocab(nAll);}
          function advanceSRS(word,hard){
            var cur=word.srInterval||0;
            var next=hard?0:Math.min(cur+1,SRS_INTERVALS.length);
            var done=!hard&&next>=SRS_INTERVALS.length;
            var nv=vocab.map(function(v){
              if(v.word!==word.word)return v;
              return Object.assign({},v,{status:done?"known":v.status,srInterval:next,nextReview:done?null:srsNextDate(SRS_INTERVALS[next]||14)});
            });
            saveVocabUpdate(nv);
            setVocabFlipped(false);
            setVocabCard(function(c){return display.length<=1?0:(c>=display.length-1?0:c+1);});
          }
          function next(){setVocabFlipped(false);setVocabCard(function(c){return display.length<=1?0:(c+1)%display.length;});}
          function prev(){setVocabFlipped(false);setVocabCard(function(c){return display.length<=1?0:(c>0?c-1:display.length-1);});}
          var tabs=[["due","Due ("+dueWords.length+")"],["review","All active ("+reviewWords.length+")"],["all","All ("+words.length+")"]];
          return(
            <>
              <style>{`
                .lq-sub-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;padding:12px 16px;margin:-18px -20px 18px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
                @media(min-width:480px){.lq-sub-topbar{margin:-22px -28px 18px}}
                .lq-sub-back{background:none;border:none;color:rgba(227,224,244,0.55);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:10px}
                .lq-sub-back:hover{background:rgba(255,255,255,0.06);color:#5af0b3}
                .lq-sub-title{flex:1;font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#e3e0f4;margin:0;letter-spacing:-0.01em}
                .lq-sub-title .accent{color:#06b6d4}
                .lq-sub-actions{display:flex;gap:6px;flex-wrap:wrap}
                .lq-sub-action-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.7);border-radius:10px;padding:6px 12px;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap}
                .lq-sub-action-btn:hover{background:rgba(255,255,255,0.08);color:#e3e0f4}
                .lq-sub-action-btn.primary{background:rgba(167,139,250,0.18);border-color:#a78bfa;color:#c4b5fd}
              `}</style>
              <div>
                <header className="lq-sub-topbar">
                  <button type="button" className="lq-sub-back" onClick={function(){setStage("home");}} aria-label="Back">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h1 className="lq-sub-title"><span className="accent">📚</span> Vocab</h1>
                  <div className="lq-sub-actions">
                    {vocab.length>=2&&<button type="button" onClick={function(){setVocabGameMode(null);setVocabGameIdx(0);setVocabGameScore(0);setVocabGameAnswered(null);setStage("vocabgame");}} className="lq-sub-action-btn primary">🎮 Practice</button>}
                    {vocab.length>0&&<button type="button" onClick={function(){doExportVocab("csv");}} className="lq-sub-action-btn" title="Export CSV">⬇</button>}
                  </div>
                </header>
              <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
                {tabs.map(function(t){
                  return<button key={t[0]} onClick={function(){setVocabFilter(t[0]);setVocabCard(0);setVocabFlipped(false);}} style={{background:vocabFilter===t[0]?"#06b6d4":"rgba(255,255,255,0.05)",color:vocabFilter===t[0]?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t[1]}</button>;
                })}
              </div>
              {curWord?(
                <div>
                  <div onClick={function(){setVocabFlipped(function(f){return!f;});}} style={{...CARD,cursor:"pointer",textAlign:"center",minHeight:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:10,background:"rgba(6,182,212,0.06)",borderColor:"rgba(6,182,212,0.25)"}}>
                    {!vocabFlipped?(
                      <div>
                        <div style={{fontSize:28,fontWeight:900,color:"#06b6d4",marginBottom:6}}>{curWord.word}</div>
                        {curWord.def&&<div style={{fontSize:13,color:"#9ca3af",marginBottom:4,maxWidth:280}}>{curWord.def}</div>}
                        <div style={{fontSize:12,color:"#4b5563"}}>Tap to see details</div>
                      </div>
                    ):(
                      <div>
                        <div style={{fontSize:22,fontWeight:900,color:"#06b6d4",marginBottom:8}}>{curWord.word}</div>
                        {curWord.def&&<div style={{fontSize:13,color:"#d1d5db",marginBottom:6,maxWidth:280}}>{curWord.def}</div>}
                        {curWord.example&&<div style={{fontSize:12,color:"#9ca3af",fontStyle:"italic",marginBottom:6,maxWidth:280}}>{curWord.example}</div>}
                        <div style={{fontSize:13,color:"#9ca3af",marginBottom:4}}>From: <span style={{color:"#f3f4f6",fontWeight:600}}>{curWord.topic}</span></div>
                        <div style={{fontSize:12,color:"#6b7280"}}>{curWord.level} · {curWord.date}</div>
                        {curWord.nextReview&&<div style={{fontSize:11,color:"#4b5563",marginTop:4}}>Next review: {curWord.nextReview}</div>}
                      </div>
                    )}
                  </div>
                  {vocabFlipped&&(
                    <div style={{display:"flex",gap:7,marginBottom:10}}>
                      <button onClick={function(){advanceSRS(curWord,true);}} style={{...mkBtn("#ef4444"),flex:1,fontSize:13}}>✗ Hard — repeat soon</button>
                      <button onClick={function(){advanceSRS(curWord,false);}} style={{...mkBtn("#22c55e","#0d0d1a"),flex:1,fontSize:13}}>{(curWord.srInterval||0)>=SRS_INTERVALS.length-1?"✓ Mastered!":"✓ Easy — "+SRS_INTERVALS[Math.min((curWord.srInterval||0)+1,SRS_INTERVALS.length-1)]+"d"}</button>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <button onClick={prev} style={{...GHOST,padding:"7px 14px",fontSize:13}}>Prev</button>
                    <span style={{fontSize:12,color:"#6b7280"}}>{safeIdx+1} / {display.length}</span>
                    <button onClick={next} style={{...GHOST,padding:"7px 14px",fontSize:13}}>Next</button>
                  </div>
                  {words.length>0&&(
                    <div style={{...CARD,marginTop:14}}>
                      <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>ALL WORDS ({words.length})</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {words.map(function(w,i){return<span key={i} onClick={function(){var idx=display.findIndex(function(d){return d.word===w.word;});if(idx!==-1){setVocabCard(idx);setVocabFlipped(false);}}} style={{background:w.status==="known"?"rgba(34,197,94,0.15)":srsDueToday(w)?"rgba(251,191,36,0.15)":"rgba(6,182,212,0.1)",color:w.status==="known"?"#22c55e":srsDueToday(w)?"#fbbf24":"#06b6d4",borderRadius:999,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{w.word}</span>;})}
                      </div>
                    </div>
                  )}
                </div>
              ):(
                <div style={{...CARD,textAlign:"center",padding:40}}>
                  <div style={{fontSize:36,marginBottom:10}}>📚</div>
                  <p style={{color:"#6b7280",fontSize:14}}>
                    {vocabFilter==="due"?"All caught up! No words due today — check back tomorrow.":vocabFilter==="review"?"No active words. Keep saving as you read!":"No saved words yet — tap words in the reading passage to save them."}
                  </p>
                  <button onClick={doRestart} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:14}}>{t("startReading")}</button>
                </div>
              )}
              </div>
            </>
          );
        })()}

        {/* ── DAILY LEADERBOARD ─────────────────────────────── */}
        {stage==="dailyleaderboard"&&(
          <div>
            <header className="lq-sub-topbar">
              <button type="button" className="lq-sub-back" onClick={function(){setStage("home");}} aria-label="Back">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#fbbf24"}}>🌟</span> {t("dailyBoard")}</h1>
              <div style={{width:38}}/>
            </header>
            <p style={{color:"#6b7280",fontSize:12,marginBottom:12}}>Today · {todayKey()} · B1</p>
            {dailyLb.length===0?(
              <div style={{...CARD,textAlign:"center",padding:36}}><p style={{color:"#6b7280"}}>No one has played today's challenge yet.</p><button onClick={startDailyChallenge} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:14}}>Be First!</button></div>
            ):(
              <div style={CARD}>
                <div style={{display:"flex",padding:"0 0 7px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:5}}>
                  {["#","PLAYER","XP","%","TIME"].map(function(h,i){return<span key={h} style={{fontSize:10,color:"#4b5563",width:i===0?28:i===1?"1fr":i===2?55:i===3?36:46,flex:i===1?1:0,textAlign:i>1?"right":"left"}}>{h}</span>;})}
                </div>
                {dailyLb.map(function(e,i){
                  var isMe=currentUser&&e.name===currentUser.name;
                  return(<div key={i} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:i<dailyLb.length-1?"1px solid rgba(255,255,255,0.05)":"none",background:isMe?"rgba(251,191,36,0.06)":"transparent",borderRadius:7,marginBottom:2}}>
                    <span style={{width:28,fontSize:i<3?13:11,color:"#fbbf24",fontWeight:700}}>{i===0?"1st":i===1?"2nd":i===2?"3rd":(i+1)}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"#fbbf24":"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</span>
                    <span style={{width:55,textAlign:"right",fontWeight:800,color:"#fbbf24",fontSize:12}}>{e.xp}</span>
                    <span style={{width:36,textAlign:"right",fontSize:12,color:pctColor(e.pct)}}>{e.pct}%</span>
                    <span style={{width:46,textAlign:"right",fontSize:11,color:"#6b7280"}}>{formatTime(e.timeSecs)}</span>
                  </div>);
                })}
              </div>
            )}
            {!(dailyDone&&dailyDone.date===todayKey())&&<button onClick={startDailyChallenge} style={{...mkBtn("#06b6d4","#0d0d1a"),width:"100%",marginTop:12}}>Play Today's Challenge</button>}
          </div>
        )}

        {/* ── HISTORY ───────────────────────────────────────── */}
        {stage==="history"&&currentUser&&(function(){
          var allGames=(currentUser.games||[]).slice();
          var games=allGames.slice().reverse();
          var filtered=historyLevel?games.filter(function(g){return g.level===historyLevel;}):games;
          var totalXp=filtered.reduce(function(s,g){return s+g.xp;},0);
          var avgPct=filtered.length?Math.round(filtered.reduce(function(s,g){return s+g.pct;},0)/filtered.length):0;

          // Group by week for bar chart
          function getWeekKey(dateStr){
            var d=new Date(dateStr);if(isNaN(d))return"?";
            var dayOfYear=Math.floor((d-new Date(d.getFullYear(),0,0))/(864e5));
            return d.getFullYear()+"-W"+Math.ceil(dayOfYear/7);
          }
          var weeklyMap={};
          filtered.forEach(function(g){var wk=getWeekKey(g.date);if(!weeklyMap[wk])weeklyMap[wk]={xp:0,count:0,avgPct:[]};weeklyMap[wk].xp+=g.xp;weeklyMap[wk].count++;weeklyMap[wk].avgPct.push(g.pct);});
          var weekKeys=Object.keys(weeklyMap).sort().slice(-8); // last 8 weeks
          var maxXp=weekKeys.reduce(function(m,k){return Math.max(m,weeklyMap[k].xp);},1);
          var chartH=90,chartW=280;
          var barW=Math.floor((chartW-weekKeys.length*4)/Math.max(weekKeys.length,1));

          return(
            <div>
              <header className="lq-sub-topbar">
                <button type="button" className="lq-sub-back" onClick={function(){setStage("home");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#5af0b3"}}>📜</span> {t("readingHistory")}</h1>
                <div style={{width:38}}/>
              </header>

              {/* level filter pills */}
              <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
                <button onClick={function(){setHistoryLevel("");}} style={{background:historyLevel===""?"#34d399":"rgba(255,255,255,0.05)",color:historyLevel===""?"#0d0d1a":"#9ca3af",border:"1px solid "+(historyLevel===""?"#34d399":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>All</button>
                {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setHistoryLevel(l.key);}} style={{background:historyLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:historyLevel===l.key?"#0d0d1a":"#9ca3af",border:"1px solid "+(historyLevel===l.key?l.color:"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
              </div>

              {/* summary bar */}
              {filtered.length>0&&(
                <div style={{display:"flex",gap:7,marginBottom:12}}>
                  {[{v:filtered.length,l:t("sessions"),c:"#34d399"},{v:totalXp,l:t("totalXp"),c:"#fbbf24"},{v:avgPct+"%",l:t("avgScore"),c:pctColor(avgPct)}].map(function(s){
                    return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:15,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;
                  })}
                </div>
              )}

              {/* SVG weekly XP bar chart */}
              {weekKeys.length>=2&&(
                <div style={{...CARD,marginBottom:12,padding:14}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10}}>WEEKLY XP (last {weekKeys.length} weeks)</p>
                  <svg viewBox={"0 0 "+chartW+" "+(chartH+22)} style={{width:"100%",overflow:"visible"}}>
                    {weekKeys.map(function(wk,i){
                      var xp=weeklyMap[wk].xp;
                      var h=Math.max(4,Math.round((xp/maxXp)*chartH));
                      var x=i*(barW+4);
                      var avgP=Math.round(weeklyMap[wk].avgPct.reduce(function(s,v){return s+v;},0)/weeklyMap[wk].avgPct.length);
                      var col=avgP>=80?"#22c55e":avgP>=60?"#f59e0b":"#6366f1";
                      return(
                        <g key={wk}>
                          <rect x={x} y={chartH-h} width={barW} height={h} rx={3} fill={col} opacity={0.8}/>
                          <text x={x+barW/2} y={chartH+14} textAnchor="middle" fontSize={8} fill="#6b7280">{wk.slice(-2)}</text>
                          <text x={x+barW/2} y={chartH-h-4} textAnchor="middle" fontSize={8} fill={col}>{xp>=1000?(xp/1000).toFixed(1)+"k":xp}</text>
                        </g>
                      );
                    })}
                  </svg>
                  <p style={{fontSize:10,color:"#4b5563",marginTop:4,textAlign:"center"}}>Bar colour: green≥80% · amber≥60% · indigo below</p>
                </div>
              )}

              {/* entries */}
              {filtered.length===0&&(
                <div style={{...CARD,textAlign:"center",padding:40}}>
                  <div style={{fontSize:36,marginBottom:10}}>📖</div>
                  <p style={{color:"#6b7280",fontSize:14}}>{historyLevel?"No "+historyLevel+" sessions yet.":"No sessions yet — play your first game!"}</p>
                  <button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),marginTop:14}}>{t("startReading")}</button>
                </div>
              )}
              {filtered.length>0&&(
                <div style={CARD}>
                  {filtered.map(function(g,i){
                    var glv=getLv(g.level);
                    return(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<filtered.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                        <div style={{width:32,height:32,borderRadius:8,background:glv.glow,border:"2px solid "+glv.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:glv.color,flexShrink:0}}>{g.level}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#f3f4f6",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.topic}</div>
                          <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>{g.date} · {formatTime(g.timeSecs)}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:13,fontWeight:900,color:"#fbbf24"}}>{g.xp} XP</div>
                            <div style={{fontSize:11,color:pctColor(g.pct),marginTop:1}}>{g.pct}%</div>
                          </div>
                          {g.topic&&g.level&&<button onClick={function(){doRestart();setLevel(g.level);setCustomTopic(g.topic);}} title="Retry this topic" style={{background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399",borderRadius:7,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>↩ Retry</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {currentUser&&<button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:12}}>Play Again</button>}
            </div>
          );
        })()}

        {/* ── LEADERBOARD ───────────────────────────────────── */}
        {stage==="leaderboard"&&(function(){
          var bd=asArray(boards[lbLevel]);
          var lvd=getLv(lbLevel);
          var lbColor=lvd?lvd.color:"#5af0b3";
          var top3=bd.slice(0,3);
          var rest=bd.slice(3);
          var rank1=top3[0]||null,rank2=top3[1]||null,rank3=top3[2]||null;
          return(
          <>
            <style>{`
              .lq-lb-wrap{margin:-18px -20px -64px;padding:0 0 96px;background:#0d0d1a;min-height:100vh}
              @media(min-width:480px){.lq-lb-wrap{margin:-22px -28px -72px}}
              .lq-lb-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
              .lq-lb-ico-btn{background:none;border:none;color:rgba(227,224,244,0.55);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:10px}
              .lq-lb-ico-btn:hover{background:rgba(255,255,255,0.06);color:#5af0b3}
              .lq-lb-tb-title{flex:1;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#e3e0f4;text-align:center;margin:0}
              .lq-lb-tb-title .accent{color:#5af0b3}
              .lq-lb-content{padding:24px 16px 0}
              .lq-lb-hero{text-align:center;margin-bottom:24px}
              .lq-lb-hero-h{font-family:'Outfit',sans-serif;font-size:34px;font-weight:800;background:linear-gradient(180deg,#e3e0f4 0%,rgba(227,224,244,0.5) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.02em;line-height:1.1;margin:0;text-shadow:0 0 32px rgba(251,191,36,0.2)}
              .lq-lb-tabs{display:inline-flex;padding:5px;background:rgba(30,30,44,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:16px;margin-top:16px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);max-width:100%;overflow-x:auto;scrollbar-width:none}
              .lq-lb-tabs::-webkit-scrollbar{display:none}
              .lq-lb-tab{padding:8px 14px;border-radius:11px;border:none;background:transparent;font-family:'Outfit',sans-serif;font-size:12px;font-weight:700;color:rgba(227,224,244,0.55);cursor:pointer;transition:all 0.2s;letter-spacing:0.02em;white-space:nowrap;flex-shrink:0}
              .lq-lb-tab:hover{color:#e3e0f4}
              .lq-lb-tab.on{background:#5af0b3;color:#003825;box-shadow:0 0 14px rgba(52,211,153,0.35)}
              .lq-lb-podium{display:flex;align-items:flex-end;justify-content:center;gap:6px;margin-bottom:28px;padding:0 4px}
              .lq-lb-podium-col{flex:1;display:flex;flex-direction:column;align-items:center;max-width:130px;position:relative;padding-top:12px}
              .lq-lb-podium-card{position:relative;width:100%;padding:14px 8px 14px;border-radius:18px 18px 0 0;border:1px solid;border-bottom:none;display:flex;flex-direction:column;align-items:center;text-align:center;overflow:hidden}
              .lq-lb-podium-card::after{content:"";position:absolute;top:0;left:0;right:0;height:3px;border-top-left-radius:18px;border-top-right-radius:18px}
              .lq-lb-podium-col.r1{order:2;transform:translateY(-12px);z-index:2}
              .lq-lb-podium-col.r2{order:1;transform:translateY(8px)}
              .lq-lb-podium-col.r3{order:3;transform:translateY(20px)}
              .lq-lb-podium-card.gold{background:linear-gradient(180deg,rgba(251,191,36,0.18) 0%,#0d0d1a 100%);border-color:rgba(251,191,36,0.5);box-shadow:0 -10px 40px rgba(251,191,36,0.18)}
              .lq-lb-podium-card.gold::after{background:#fbbf24}
              .lq-lb-podium-card.silver{background:linear-gradient(180deg,rgba(203,213,225,0.12) 0%,#0d0d1a 100%);border-color:rgba(203,213,225,0.4);box-shadow:0 -8px 32px rgba(203,213,225,0.12)}
              .lq-lb-podium-card.silver::after{background:#cbd5e1}
              .lq-lb-podium-card.bronze{background:linear-gradient(180deg,rgba(194,120,3,0.12) 0%,#0d0d1a 100%);border-color:rgba(194,120,3,0.5);box-shadow:0 -8px 32px rgba(194,120,3,0.18)}
              .lq-lb-podium-card.bronze::after{background:#c27803}
              .lq-lb-podium-card.me{box-shadow:0 -10px 40px rgba(52,211,153,0.28)}
              .lq-lb-podium-card.me .lq-lb-podium-name{color:#5af0b3}
              .lq-lb-podium-current-tag{position:absolute;top:-8px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;background:rgba(52,211,153,0.95);color:#003825;font-family:'Inter',sans-serif;font-size:8px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 14px rgba(52,211,153,0.4)}
              .lq-lb-podium-current-tag .dot{width:5px;height:5px;border-radius:50%;background:#003825;animation:rqPulse 1.2s ease-in-out infinite}
              @keyframes rqPulse{0%,100%{opacity:1}50%{opacity:0.4}}
              .lq-lb-podium-avatar-wrap{position:relative;margin-bottom:10px}
              .lq-lb-podium-avatar{display:flex;align-items:center;justify-content:center;border-radius:50%;background:#0d0d1a;font-family:'Outfit',sans-serif;font-weight:800;color:#5af0b3}
              .lq-lb-podium-col.r1 .lq-lb-podium-avatar{width:84px;height:84px;border:5px solid #fbbf24;font-size:30px;box-shadow:0 0 28px rgba(251,191,36,0.4),inset 0 0 16px rgba(0,0,0,0.3)}
              .lq-lb-podium-col.r2 .lq-lb-podium-avatar{width:64px;height:64px;border:4px solid #cbd5e1;font-size:24px;box-shadow:0 0 20px rgba(203,213,225,0.25)}
              .lq-lb-podium-col.r3 .lq-lb-podium-avatar{width:64px;height:64px;border:4px solid #c27803;font-size:24px;box-shadow:0 0 20px rgba(194,120,3,0.25)}
              .lq-lb-podium-badge{position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;color:#0d0d1a;border:2px solid #0d0d1a}
              .lq-lb-podium-col.r1 .lq-lb-podium-badge{background:#fbbf24;width:34px;height:34px;font-size:16px}
              .lq-lb-podium-col.r2 .lq-lb-podium-badge{background:#cbd5e1}
              .lq-lb-podium-col.r3 .lq-lb-podium-badge{background:#c27803;color:#fff}
              .lq-lb-podium-crown{position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:24px;filter:drop-shadow(0 0 12px rgba(251,191,36,0.6))}
              .lq-lb-podium-name{font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;color:#e3e0f4;margin:0 0 3px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;max-width:100%;white-space:nowrap}
              .lq-lb-podium-col.r1 .lq-lb-podium-name{font-size:15px;color:#fbbf24}
              .lq-lb-podium-col.r2 .lq-lb-podium-name{color:#cbd5e1}
              .lq-lb-podium-col.r3 .lq-lb-podium-name{color:#fdba74}
              .lq-lb-podium-sub{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:rgba(227,224,244,0.45);letter-spacing:0.12em;text-transform:uppercase;margin:0 0 8px}
              .lq-lb-podium-xp{padding:5px 12px;border-radius:999px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:800;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)}
              .lq-lb-podium-col.r1 .lq-lb-podium-xp{background:rgba(52,211,153,0.12);color:#5af0b3;border-color:rgba(52,211,153,0.35)}
              .lq-lb-podium-col.r2 .lq-lb-podium-xp{color:#cbd5e1;border-color:rgba(203,213,225,0.25)}
              .lq-lb-podium-col.r3 .lq-lb-podium-xp{color:#fdba74;background:rgba(194,120,3,0.12);border-color:rgba(194,120,3,0.3)}
              .lq-lb-list-card{background:rgba(30,30,44,0.5);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);margin-bottom:14px;box-shadow:0 12px 40px rgba(0,0,0,0.4)}
              .lq-lb-list-h{display:flex;padding:14px 16px;background:rgba(13,13,26,0.4);border-bottom:1px solid rgba(255,255,255,0.06);font-family:'Inter',sans-serif;font-size:9px;font-weight:800;color:rgba(227,224,244,0.4);letter-spacing:0.14em;text-transform:uppercase}
              .lq-lb-row{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;transition:background 0.15s,transform 0.15s}
              .lq-lb-row:last-child{border-bottom:none}
              .lq-lb-row:hover{background:rgba(255,255,255,0.03);transform:translateX(2px)}
              .lq-lb-row.me{background:rgba(52,211,153,0.08);border-left:3px solid #5af0b3;padding-left:13px}
              .lq-lb-row-rank{font-family:'Outfit',sans-serif;font-size:18px;font-weight:800;color:rgba(227,224,244,0.4);width:32px;letter-spacing:-0.02em}
              .lq-lb-row.me .lq-lb-row-rank{color:#5af0b3}
              .lq-lb-row-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#5af0b3,#a78bfa);display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;color:#003825;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);position:relative}
              .lq-lb-row-avatar.me::after{content:"";position:absolute;top:-2px;right:-2px;width:10px;height:10px;background:#5af0b3;border-radius:50%;border:2px solid #0d0d1a;box-shadow:0 0 6px rgba(52,211,153,0.8)}
              .lq-lb-row-info{flex:1;min-width:0}
              .lq-lb-row-name{font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:#e3e0f4;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
              .lq-lb-row-sub{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.45);margin:1px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
              .lq-lb-row-xp{font-family:'Outfit',sans-serif;font-size:15px;font-weight:800;text-align:right}
              .lq-lb-row.me .lq-lb-row-xp{color:#5af0b3;filter:drop-shadow(0 0 8px rgba(52,211,153,0.3))}
              .lq-lb-empty{background:rgba(30,30,44,0.5);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:48px 24px;text-align:center;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
              .lq-lb-empty-emoji{font-size:56px;margin-bottom:14px;line-height:1;filter:drop-shadow(0 0 20px rgba(251,191,36,0.5))}
              .lq-lb-empty-t{font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;color:#e3e0f4;margin:0 0 6px}
              .lq-lb-empty-d{font-family:'Inter',sans-serif;font-size:13px;color:rgba(227,224,244,0.5);margin:0 0 20px}
              .lq-lb-boost{width:100%;background:linear-gradient(135deg,#34D399,#5af0b3);color:#003825;border:none;border-radius:18px;padding:16px 20px;font-family:'Outfit',sans-serif;font-weight:800;font-size:14px;letter-spacing:0.16em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 24px rgba(52,211,153,0.32),0 4px 0 0 rgba(0,0,0,0.3);transition:all 0.2s}
              .lq-lb-boost:active{transform:translateY(2px);box-shadow:0 6px 16px rgba(52,211,153,0.3),0 2px 0 0 rgba(0,0,0,0.3)}
              .lq-lb-bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;z-index:50;display:flex;justify-content:space-around;align-items:center;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:rgba(30,30,44,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,0.08);border-radius:24px 24px 0 0;box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
              .lq-lb-nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:6px 14px;color:rgba(227,224,244,0.5);font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;position:relative;transition:color 0.15s}
              .lq-lb-nav-btn .ico{font-size:22px;line-height:1}
            `}</style>
            <div className="lq-lb-wrap">
              <header className="lq-lb-topbar">
                <button type="button" className="lq-lb-ico-btn" onClick={function(){setStage(currentUser?"home":"auth");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-lb-tb-title">Reading <span className="accent">Quest</span></h1>
                <div style={{width:38}}/>
              </header>

              <div className="lq-lb-content">
                <header className="lq-lb-hero">
                  <h2 className="lq-lb-hero-h">Hall of Fame</h2>
                  <div className="lq-lb-tabs">
                    {LEVELS.map(function(l){return(
                      <button key={l.key} type="button" onClick={function(){setLbLevel(l.key);}} className={"lq-lb-tab"+(lbLevel===l.key?" on":"")} style={lbLevel===l.key?{background:l.color,color:"#0d0d1a",boxShadow:"0 0 14px "+(l.glow||"rgba(52,211,153,0.3)")}:{}}>{l.key}</button>
                    );})}
                  </div>
                </header>

                {bd.length>0&&(
                  <section className="lq-lb-podium">
                    {[rank2,rank1,rank3].map(function(e,podIdx){
                      var actualRank=podIdx===0?2:podIdx===1?1:3;
                      if(!e)return<div key={"pod-"+actualRank} className={"lq-lb-podium-col r"+actualRank}/>;
                      var isMe=currentUser&&e.name===currentUser.name;
                      var tier=actualRank===1?"gold":actualRank===2?"silver":"bronze";
                      var initial=(e.name||"?")[0].toUpperCase();
                      return(
                        <div key={"pod-"+actualRank} className={"lq-lb-podium-col r"+actualRank}>
                          <div className={"lq-lb-podium-card "+tier+(isMe?" me":"")}>
                            {isMe&&<span className="lq-lb-podium-current-tag"><span className="dot"/>Current Rank</span>}
                            {actualRank===1&&<span className="lq-lb-podium-crown">👑</span>}
                            <div className="lq-lb-podium-avatar-wrap">
                              <div className="lq-lb-podium-avatar">{initial}</div>
                              <div className="lq-lb-podium-badge">{actualRank}</div>
                            </div>
                            <h3 className="lq-lb-podium-name">{e.name}</h3>
                            <p className="lq-lb-podium-sub">{lbLevel} Scholar</p>
                            <div className="lq-lb-podium-xp">{(e.xp||0).toLocaleString()} XP</div>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}

                {bd.length===0?(
                  <div className="lq-lb-empty">
                    <div className="lq-lb-empty-emoji">🏆</div>
                    <h3 className="lq-lb-empty-t">No scores yet</h3>
                    <p className="lq-lb-empty-d">Be the first to complete a {lbLevel} quiz!</p>
                    {currentUser&&<button type="button" className="lq-lb-boost" onClick={function(){setLevel(lbLevel);doRestart();}} style={{background:"linear-gradient(135deg,"+lbColor+",#5af0b3)"}}>⚡ Play {lbLevel} Quiz</button>}
                  </div>
                ):rest.length>0?(
                  <div className="lq-lb-list-card">
                    <div className="lq-lb-list-h">
                      <span style={{width:32}}>Rank</span>
                      <span style={{width:52,marginLeft:12}}>Scholar</span>
                      <span style={{flex:1}}></span>
                      <span>Total XP</span>
                    </div>
                    {rest.map(function(e,i){
                      var rank=i+4;
                      var isMe=currentUser&&e.name===currentUser.name;
                      var initial=(e.name||"?")[0].toUpperCase();
                      return(
                        <div key={rank} className={"lq-lb-row"+(isMe?" me":"")} onClick={function(){if(isMe){setStage("profile");}else{setViewingUser(e.name);setStage("friendProfile");}}}>
                          <span className="lq-lb-row-rank">{String(rank).padStart(2,"0")}</span>
                          <div className={"lq-lb-row-avatar"+(isMe?" me":"")}>{initial}</div>
                          <div className="lq-lb-row-info">
                            <p className="lq-lb-row-name">{e.name}{isMe?" • You":""}</p>
                            <p className="lq-lb-row-sub">{e.topic||"Speed Reader"} · {e.pct}% · {formatTime(e.timeSecs||0)}</p>
                          </div>
                          <span className="lq-lb-row-xp" style={{color:isMe?"#5af0b3":pctColor(e.pct||0)}}>{(e.xp||0).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                ):null}

                {currentUser&&bd.length>0&&(
                  <button type="button" onClick={function(){setLevel(lbLevel);doRestart();}} className="lq-lb-boost">⚡ Boost Your Rank</button>
                )}
              </div>

              <nav className="lq-lb-bottom-nav">
                <button type="button" onClick={function(){setStage("home");}} className="lq-lb-nav-btn">
                  <span className="ico">🏠</span><span>{t("home").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("library");}} className="lq-lb-nav-btn">
                  <span className="ico">📚</span><span>{t("library").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("analytics");}} className="lq-lb-nav-btn">
                  <span className="ico">📊</span><span>{t("stats").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("profile");}} className="lq-lb-nav-btn">
                  <span className="ico">👤</span><span>{t("profile").toUpperCase()}</span>
                </button>
              </nav>
            </div>
          </>
          );
        })()}

        {/* ── FRIENDS ───────────────────────────────────────── */}
        {stage==="friends"&&currentUser&&(
          <div>
            <header className="lq-sub-topbar">
              <button type="button" className="lq-sub-back" onClick={function(){setStage("home");setSocialMsg("");}} aria-label="Back">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#a78bfa"}}>👥</span> {t("friends")}</h1>
              <div style={{width:38}}/>
            </header>
            <div style={{display:"none"}}><button onClick={function(){}} style={GHOST}>{t("back")}</button>
            </div>
            {socialMsg&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid #34d399",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#34d399",marginBottom:10}}>{socialMsg}</div>}

            {/* tabs */}
            <div style={{display:"flex",gap:5,marginBottom:14}}>
              {[["search",t("search")],["requests",t("requests")+" ("+(myData.requests.length)+")"],["list",t("myFriends")+" ("+myData.friends.length+")"]].map(function(tab){
                return<button key={tab[0]} onClick={function(){setFriendStage(tab[0]);setSocialMsg("");}} style={{background:friendStage===tab[0]?"#a78bfa":"rgba(255,255,255,0.05)",color:friendStage===tab[0]?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{tab[1]}</button>;
              })}
            </div>

            {/* SEARCH */}
            {friendStage==="search"&&(
              <div>
                <div style={{position:"relative",marginBottom:8}}>
                  <input style={{...INP,paddingLeft:36}} placeholder="Search by username (min 2 chars)..." value={searchQuery} onChange={function(e){setSearchQuery(e.target.value);}}/>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:0.5}}>🔍</span>
                </div>
                <button onClick={function(){loadUsers().then(function(u){setAllUsers(u);setSocialMsg(t("stu_socialUserListRefreshed"));});}} style={{...mkBtn("#374151"),width:"100%",marginBottom:12,fontSize:13,padding:"9px 0"}}>{t("stu_socialRefreshBtn")}</button>
                {getSearchResults().map(function(u){
                  var isFriend=myData.friends.indexOf(u.name)!==-1;
                  var requested=(getSocial(social,u.name).requests||[]).indexOf(currentUser.name)!==-1;
                  var uData=getSocial(social,u.name);
                  var uGamesXp=u.games?u.games.reduce(function(s,g){return s+g.xp;},0):0;
                  var uTotalXp=Math.max(Number(u&&u.totalXp)||0,uGamesXp);
                  var uLevel=getUserLevel(uTotalXp);
                  return(<div key={u.name} className="rq-raised" style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{u.name}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>Lvl {uLevel} | Games: {u.games?u.games.length:0} | {uTotalXp} XP | Likes: {uData.likes||0}</div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={function(){setViewingUser(u.name);setStage("friendProfile");}} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>{t("viewLabel")}</button>
                      {!isFriend&&!requested&&<button onClick={function(){sendRequest(u.name);}} style={{...mkBtn("#6366f1"),padding:"5px 9px",fontSize:11}}>{t("addFriend")}</button>}
                      {requested&&<span style={{background:"rgba(99,102,241,0.2)",border:"1px solid rgba(99,102,241,0.5)",color:"#a78bfa",borderRadius:999,padding:"4px 9px",fontSize:11,fontWeight:700}}>📨 {t("requestSent")}</span>}
                      {isFriend&&<span style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.4)",color:"#34d399",borderRadius:999,padding:"4px 9px",fontSize:11,fontWeight:700}}>✓ {t("friendBadge")}</span>}
                    </div>
                  </div>);
                })}
                {searchQuery.length>=2&&getSearchResults().length===0&&<p style={{color:"#6b7280",textAlign:"center",padding:20}}>No users found for "{searchQuery}"</p>}
              </div>
            )}

            {/* REQUESTS */}
            {friendStage==="requests"&&(
              <div>
                {myData.requests.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>📬</div><div style={{fontSize:16,fontWeight:800,color:"#f3f4f6",marginBottom:4}}>{t("noPendingRequests")}</div></div>}
                {myData.requests.map(function(from){
                  return(<div key={from} style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{from[0].toUpperCase()}</div>
                    <span style={{flex:1,fontSize:14,fontWeight:600,color:"#f3f4f6"}}>{from} wants to be friends</span>
                    <button onClick={function(){acceptRequest(from);}} style={{...mkBtn("#22c55e","#0d0d1a"),padding:"6px 11px",fontSize:12}}>{t("accept")}</button>
                    <button onClick={function(){declineRequest(from);}} style={{...mkBtn("#374151"),padding:"6px 11px",fontSize:12}}>{t("decline")}</button>
                  </div>);
                })}
              </div>
            )}

            {/* FRIENDS LIST */}
            {friendStage==="list"&&(
              <div>
                {myData.friends.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>👋</div><div style={{fontSize:16,fontWeight:800,color:"#f3f4f6",marginBottom:4}}>No friends yet</div><div style={{fontSize:13,color:"#6b7280"}}>Search to connect with other learners</div></div>}
                {myData.friends.map(function(fname){
                  var fu=null;for(var i=0;i<allUsers.length;i++){if(allUsers[i].name===fname){fu=allUsers[i];break;}}
                  var fuGames=fu&&fu.games?fu.games:[];
                  var fStreak=calcStreak(fuGames);
                  var fData=getSocial(social,fname);
                  fData=fData||{friends:[],requests:[],likes:0,challenges:[]};
                  var fGamesXp=fuGames.reduce(function(s,g){return s+g.xp;},0);
                  var fTotalXp=Math.max(Number(fu&&fu.totalXp)||0,fGamesXp);
                  var fLevel=getUserLevel(fTotalXp);
                  return(<div key={fname} style={{...CARD,marginBottom:8,padding:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{fname[0].toUpperCase()}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{fname}</div>
                        <div style={{display:"flex",gap:7,marginTop:2}}>
                          <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥{fStreak}d</span>
                          <span style={pill("rgba(99,102,241,0.15)","#6366f1")}>Lvl {fLevel}</span>
                          <span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes:{fData.likes||0}</span>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={function(){setViewingUser(fname);setStage("friendProfile");}} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>Profile</button>
                        <button onClick={function(){setChallengeTarget(fname);}} style={{...mkBtn("#f59e0b","#0d0d1a"),padding:"5px 9px",fontSize:11}}>Challenge</button>
                      </div>
                    </div>
                    {challengeTarget===fname&&(
                      <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:10,padding:10,marginTop:4}}>
                        <p style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:7}}>Challenge Settings</p>
                        <div style={{display:"flex",gap:5,marginBottom:7,flexWrap:"wrap"}}>
                          {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setChallengeLevel(l.key);}} style={{background:challengeLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:challengeLevel===l.key?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
                        </div>
                        <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
                          {Object.keys(Q_LABELS).map(function(t){var on=challengeTypes.indexOf(t)!==-1;return<button key={t} onClick={function(){setChallengeTypes(function(prev){var on2=prev.indexOf(t)!==-1;if(on2&&prev.length===1)return prev;if(on2)return prev.filter(function(x){return x!==t;});return prev.concat([t]);});}} style={{background:on?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(on?"#a78bfa":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"3px 9px",fontSize:10,color:on?"#c7d2fe":"#6b7280",cursor:"pointer",fontFamily:"inherit"}}>{qLabel(t)}</button>;})}
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={sendChallenge} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12}}>Send Challenge</button>
                          <button onClick={function(){setChallengeTarget(null);}} style={{...mkBtn("#374151"),flex:1,fontSize:12}}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>);
                })}
              </div>
            )}

            {/* sent challenges tracker */}
            {(myData.sent||[]).length>0&&(
              <div style={{...CARD,marginTop:12,padding:14}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10}}>⚔️ SENT CHALLENGES</p>
                {(myData.sent||[]).slice().reverse().map(function(s,i){
                  var tl=challengeTimeLeft(s.expiresAt);
                  var expired=tl==="expired";
                  var done=s.status==="completed";
                  return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid rgba(255,255,255,0.07)",opacity:expired&&!done?0.5:1}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,color:"#f3f4f6",fontWeight:600}}>→ <strong>{s.to}</strong> · <span style={{color:getLv(s.level).color}}>{s.level}</span></div>
                      <div style={{fontSize:10,color:"#6b7280",marginTop:1}}>{s.date}{!done&&tl?" · ⏱ "+tl:""}</div>
                    </div>
                    {done?(
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:12,fontWeight:700,color:pctColor(s.result.pct)}}>{s.result.pct}%</div>
                        <div style={{fontSize:10,color:"#fbbf24"}}>{s.result.xp} XP</div>
                      </div>
                    ):(
                      <span style={{fontSize:10,color:expired?"#f87171":"#6b7280",fontWeight:600}}>{expired?"expired":"pending"}</span>
                    )}
                  </div>);
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FRIEND PROFILE ────────────────────────────────── */}
        {stage==="friendProfile"&&viewingUser&&currentUser&&(function(){
          var fu=null;for(var i=0;i<allUsers.length;i++){if(allUsers[i].name===viewingUser){fu=allUsers[i];break;}}
          if(!fu)return<div style={{textAlign:"center",padding:40}}><p style={{color:"#6b7280"}}>User not found.</p><button onClick={function(){setStage("friends");}} style={GHOST}>{t("back")}</button></div>;
          var fData=getSocial(social,viewingUser);
          fData=fData||{friends:[],requests:[],likes:0,challenges:[]};
          var isFriend=myData.friends.indexOf(viewingUser)!==-1;
          var requested=(fData.requests||[]).indexOf(currentUser.name)!==-1;
          var alreadyLiked=hasLiked(social,currentUser.name,viewingUser);
          var fuGames=fu&&fu.games?fu.games:[];
          var fStreak=calcStreak(fuGames);
          var fBest=getBestLevel(fuGames);
          var fGamesXp=fuGames.reduce(function(s,g){return s+g.xp;},0);
          var totalXp=Math.max(Number(fu&&fu.totalXp)||0,fGamesXp);
          var avgPct=fuGames.length?Math.round(fuGames.reduce(function(s,g){return s+(g.pct||0);},0)/fuGames.length):0;
          var fLvlInfo=getLevelProgress(totalXp);
          // comparison with current user
          var curGames=currentUser&&currentUser.games?currentUser.games:[];
          var myGamesXp=curGames.reduce(function(s,g){return s+g.xp;},0);
          var myTotalXp=Math.max(Number(currentUser&&currentUser.totalXp)||0,myGamesXp);
          var myAvgPct=curGames.length?Math.round(curGames.reduce(function(s,g){return s+g.pct;},0)/curGames.length):0;
          return(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>{viewingUser}'s Profile</h2>
              <button onClick={function(){setStage("friends");setSocialMsg("");}} style={GHOST}>{t("back")}</button>
            </div>
            {socialMsg&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid #34d399",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#34d399",marginBottom:10}}>{socialMsg}</div>}

            {/* identity */}
            <div style={{...CARD,marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:50,height:50,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",flexShrink:0}}>{viewingUser[0].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#f9fafb"}}>{viewingUser}</div>
                  <div style={{background:"linear-gradient(135deg,#fbbf24,#f59e0b)",padding:"2px 8px",borderRadius:999,fontSize:12,fontWeight:900,color:"#0d0d1a"}}>⭐ Lvl {fLvlInfo.level}</div>
                </div>
                <div style={{fontSize:11,color:"#6b7280"}}>Joined {fu.joined}</div>
                <div style={{display:"flex",gap:7,marginTop:4}}>
                  <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥 {fStreak} day streak</span>
                  <span style={pill("rgba(99,102,241,0.15)","#a78bfa")}>Best: {fBest}</span>
                  <span style={{...pill("rgba(236,72,153,0.15)","#ec4899"),fontWeight:fData.likes>0?700:400}}>❤️ {fData.likes||0} {fData.likes===1?"Like":"Likes"}</span>
                </div>
              </div>
            </div>
            <div style={{...CARD,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:"#9ca3af"}}>LEVEL {fLvlInfo.level} PROGRESS</span>
                <span style={{fontSize:10,color:"#6b7280"}}>{fLvlInfo.xpNeeded} XP to next</span>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:fLvlInfo.progress+"%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",transition:"width 0.3s ease"}}/>
              </div>
            </div>

            {/* actions */}
            <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
              {!isFriend&&!requested&&<button onClick={function(){sendRequest(viewingUser);}} style={{...mkBtn("#6366f1"),flex:1,fontSize:12,minWidth:100}}>+ Add Friend</button>}
              {requested&&<div style={{flex:1,minWidth:100,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.5)",borderRadius:12,padding:"10px 12px",textAlign:"center",fontSize:12,fontWeight:700,color:"#a78bfa"}}>📨 Request Sent</div>}
              {isFriend&&<button onClick={function(){removeFriend(viewingUser);setStage("friends");}} style={{...mkBtn("#374151"),flex:1,fontSize:12,minWidth:100}}>Remove Friend</button>}
              <button onClick={function(){likeProfile(viewingUser);}} disabled={alreadyLiked||viewingUser===currentUser.name} style={{...mkBtn(alreadyLiked?"#374151":"#ec4899"),flex:1,fontSize:12,minWidth:90,transition:"all 0.2s ease",transform:alreadyLiked?"scale(0.98)":"scale(1)"}}>{alreadyLiked?"❤️ Liked":"❤️ Like"}</button>
              {isFriend&&<button onClick={function(){setChallengeTarget(viewingUser);setStage("friends");setFriendStage("list");}} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12,minWidth:100}}>Challenge</button>}
            </div>

            {/* stats */}
            <div style={{display:"flex",gap:7,marginBottom:12}}>
              {[{v:fu&&fu.games?fu.games.length:0,l:"Games",c:"#34d399"},{v:totalXp,l:"Total XP",c:"#fbbf24"},{v:avgPct+"%",l:"Avg Score",c:pctColor(avgPct)},{v:fData.friends?fData.friends.length:0,l:"Friends",c:"#a78bfa"}].map(function(s){
                return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:15,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;
              })}
            </div>

            {/* comparison */}
            {currentUser&&currentUser.games&&currentUser.games.length>0&&fu&&fu.games&&fu.games.length>0&&(
              <div style={{...CARD,marginBottom:12,padding:14}}>
                <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,marginBottom:10}}>HEAD TO HEAD</p>
                {[{label:"Total XP",my:myTotalXp,their:totalXp},{label:"Avg Score",my:myAvgPct,their:avgPct},{label:"Games Played",my:curGames.length,their:fuGames.length}].map(function(row){
                  var myWin=row.my>row.their;
                  var myPct=row.my+row.their>0?(row.my/(row.my+row.their)*100):50;
                  return(<div key={row.label} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9ca3af",marginBottom:3}}><span style={{color:myWin?"#34d399":"#f3f4f6",fontWeight:myWin?700:400}}>{currentUser.name}: {row.my}</span><span style={{fontSize:10,color:"#4b5563"}}>{row.label}</span><span style={{color:!myWin?"#f472b6":"#f3f4f6",fontWeight:!myWin?700:400}}>{viewingUser}: {row.their}</span></div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:6,overflow:"hidden",display:"flex"}}>
                      <div style={{height:"100%",width:myPct+"%",background:"#34d399",borderRadius:myPct>50?"999px 0 0 999px":"999px"}}/>
                      <div style={{height:"100%",width:(100-myPct)+"%",background:"#f472b6",borderRadius:myPct<50?"999px 0 0 999px":"999px"}}/>
                    </div>
                  </div>);
                })}
              </div>
            )}

            {/* game history chart */}
            {fuGames.length>0&&(
              <div style={{marginBottom:12}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>{t("xpHistory")}</p>
                <GameChart games={fuGames}/>
              </div>
            )}

            {/* recent games */}
            {fuGames.length>0&&(
              <div style={{...CARD,marginBottom:12}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>{t("recentGames")}</p>
                {fuGames.slice().reverse().slice(0,6).map(function(g,i){
                  var glv=getLv(g.level);
                  return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.05)":"none"}}>
                    <span style={{fontSize:11,fontWeight:900,color:glv.color,width:20}}>{g.level}</span>
                    <div style={{flex:1}}><div style={{fontSize:12,color:"#f3f4f6"}}>{g.topic}</div><div style={{fontSize:10,color:"#6b7280"}}>{g.date}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:800,color:"#fbbf24"}}>{g.xp} XP</div><div style={{fontSize:10,color:pctColor(g.pct)}}>{g.pct}%</div></div>
                  </div>);
                })}
              </div>
            )}
            {fuGames.length===0&&<div style={{...CARD,textAlign:"center",padding:28}}><p style={{color:"#6b7280"}}>No games played yet.</p></div>}
          </div>);
        })()}

        {/* ── SETTINGS ──────────────────────────────────────── */}
        {stage==="settings"&&currentUser&&(function(){
          var initial=(currentUser.name||"?")[0].toUpperCase();
          return(
          <>
            <style>{`
              .lq-set-wrap{margin:-18px -20px -64px;padding:0 0 96px;background:#0d0d1a;min-height:100vh}
              @media(min-width:480px){.lq-set-wrap{margin:-22px -28px -72px}}
              .lq-set-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
              .lq-set-ico-btn{background:none;border:none;color:rgba(227,224,244,0.55);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:10px}
              .lq-set-ico-btn:hover{background:rgba(255,255,255,0.06);color:#5af0b3}
              .lq-set-tb-title{flex:1;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#e3e0f4;text-align:center;margin:0}
              .lq-set-tb-title .accent{color:#5af0b3}
              .lq-set-content{padding:24px 18px 0}
              .lq-set-hero{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
              .lq-set-hero-l{display:flex;align-items:center;gap:12px}
              .lq-set-hero-ico{width:40px;height:40px;border-radius:12px;background:rgba(52,211,153,0.10);border:1px solid rgba(52,211,153,0.25);display:flex;align-items:center;justify-content:center;color:#5af0b3;font-size:22px}
              .lq-set-hero h1{font-family:'Outfit',sans-serif;font-size:30px;font-weight:700;color:#e3e0f4;margin:0;letter-spacing:-0.02em;line-height:1.1}
              .lq-set-badge{display:flex;align-items:center;gap:6px;background:rgba(167,139,250,0.10);border:1px solid rgba(167,139,250,0.25);color:#c4b5fd;font-family:'Inter',sans-serif;font-size:11px;font-weight:700;padding:5px 12px;border-radius:999px;letter-spacing:0.04em}
              .lq-set-section{margin-bottom:28px}
              .lq-set-section-h{display:flex;align-items:center;margin-bottom:14px;padding:0 4px}
              .lq-set-section-t{font-family:'Outfit',sans-serif;font-size:12px;font-weight:800;color:#e3e0f4;letter-spacing:0.16em;text-transform:uppercase;margin:0}
              .lq-set-section-line{flex:1;height:1px;background:rgba(255,255,255,0.06);margin-left:14px}
              .lq-set-card{background:rgba(30,30,44,0.45);border:1px solid rgba(255,255,255,0.10);border-radius:18px;overflow:hidden;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
              .lq-set-row{display:flex;align-items:center;gap:14px;padding:18px 16px;border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.15s;cursor:pointer;width:100%;background:none;border-left:none;border-right:none;border-top:none;color:inherit;font-family:inherit;text-align:left}
              .lq-set-row:last-child{border-bottom:none}
              .lq-set-row:hover{background:rgba(255,255,255,0.03)}
              .lq-set-row.no-click{cursor:default}
              .lq-set-row.no-click:hover{background:transparent}
              .lq-set-row-ico{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:center;color:rgba(227,224,244,0.7);font-size:20px;flex-shrink:0;transition:color 0.15s}
              .lq-set-row:hover .lq-set-row-ico{color:#5af0b3}
              .lq-set-row-text{flex:1;min-width:0}
              .lq-set-row-h{font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;color:#e3e0f4;margin:0;line-height:1.3}
              .lq-set-row-d{font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.55);margin:2px 0 0;line-height:1.4}
              .lq-set-row-chev{color:rgba(227,224,244,0.4);font-size:20px;transition:transform 0.15s;flex-shrink:0}
              .lq-set-row:hover .lq-set-row-chev{transform:translateX(3px);color:#e3e0f4}
              .lq-set-toggle{position:relative;width:44px;height:24px;background:rgba(255,255,255,0.10);border:none;border-radius:999px;cursor:pointer;transition:background 0.2s;flex-shrink:0;padding:0}
              .lq-set-toggle.on{background:#5af0b3}
              .lq-set-toggle::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform 0.2s;box-shadow:0 2px 6px rgba(0,0,0,0.4)}
              .lq-set-toggle.on::after{transform:translateX(20px);background:#003825}
              .lq-set-card-pad{padding:18px 16px}
              .lq-set-card-pad-row{display:flex;align-items:center;gap:14px;margin-bottom:14px}
              .lq-set-card-pad-row:last-child{margin-bottom:0}
              .lq-set-genre-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06)}
              .lq-set-genre{padding:10px;border-radius:12px;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);color:rgba(227,224,244,0.65);font-family:'Inter',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:left;display:flex;align-items:center;gap:8px}
              .lq-set-genre:hover{background:rgba(255,255,255,0.07);color:#e3e0f4}
              .lq-set-genre.on{background:rgba(167,139,250,0.18);border-color:#a78bfa;color:#c4b5fd}
              .lq-set-theme-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
              .lq-set-theme{aspect-ratio:1;border-radius:14px;border:2px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.04);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transition:all 0.15s;padding:6px}
              .lq-set-theme:hover{background:rgba(255,255,255,0.07)}
              .lq-set-theme.on{background:rgba(255,255,255,0.08)}
              .lq-set-theme .swatch{width:24px;height:24px;border-radius:50%}
              .lq-set-theme .name{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:rgba(227,224,244,0.5);letter-spacing:0.04em}
              .lq-set-theme.on .name{color:#e3e0f4}
              .lq-set-random{width:100%;margin-top:10px;padding:11px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.75);font-family:'Outfit',sans-serif;font-weight:700;font-size:12px;cursor:pointer;transition:all 0.15s;letter-spacing:0.06em}
              .lq-set-random:hover{background:rgba(255,255,255,0.08);color:#e3e0f4;border-color:rgba(52,211,153,0.4)}
              .lq-set-logout{display:flex;align-items:center;gap:14px;padding:18px 16px;width:100%;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.25);border-radius:18px;cursor:pointer;color:#f87171;font-family:inherit;text-align:left;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background 0.15s}
              .lq-set-logout:hover{background:rgba(239,68,68,0.10)}
              .lq-set-logout-ico{width:40px;height:40px;border-radius:12px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
              .lq-set-logout-h{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#f87171;margin:0}
              .lq-set-logout-d{font-family:'Inter',sans-serif;font-size:12px;color:rgba(248,113,113,0.65);margin:2px 0 0}
            `}</style>
            <div className="lq-set-wrap">
              <header className="lq-set-topbar">
                <button type="button" className="lq-set-ico-btn" onClick={function(){setStage("profile");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-set-tb-title">Reading <span className="accent">Quest</span></h1>
                <div style={{width:38}}/>
              </header>

              <div className="lq-set-content">
                <div className="lq-set-hero">
                  <div className="lq-set-hero-l">
                    <div className="lq-set-hero-ico">⚙️</div>
                    <h1>Settings</h1>
                  </div>
                  <span className="lq-set-badge">🛡️ Scholar</span>
                </div>

                <section className="lq-set-section">
                  <div className="lq-set-section-h">
                    <p className="lq-set-section-t">Profile</p>
                    <span className="lq-set-section-line"/>
                  </div>
                  <div className="lq-set-card">
                    <button type="button" className="lq-set-row no-click" style={{cursor:"default"}}>
                      <div className="lq-set-row-ico">👤</div>
                      <div className="lq-set-row-text">
                        <p className="lq-set-row-h">Username</p>
                        <p className="lq-set-row-d">{currentUser.name} · {initial}</p>
                      </div>
                    </button>
                    <button type="button" className="lq-set-row no-click" style={{cursor:"default"}}>
                      <div className="lq-set-row-ico">📅</div>
                      <div className="lq-set-row-text">
                        <p className="lq-set-row-h">Joined</p>
                        <p className="lq-set-row-d">{currentUser.joined||"–"}</p>
                      </div>
                    </button>
                    <button type="button" className="lq-set-row" onClick={function(){var langs=["en","uz","ru","tr","ar","de","es","fr"];var nx=prompt("Interface language ("+langs.join("/")+"):",uiLang);if(nx&&langs.indexOf(nx.toLowerCase())!==-1){setUiLang(nx.toLowerCase());try{localStorage.setItem("rq-uilang",nx.toLowerCase());}catch(e){}}}}>
                      <div className="lq-set-row-ico">🌐</div>
                      <div className="lq-set-row-text">
                        <p className="lq-set-row-h">Language</p>
                        <p className="lq-set-row-d">{({en:"English",uz:"O'zbek",ru:"Русский",tr:"Türkçe",ar:"العربية",de:"Deutsch",es:"Español",fr:"Français"})[uiLang]||uiLang.toUpperCase()}</p>
                      </div>
                      <span className="lq-set-row-chev">›</span>
                    </button>
                  </div>
                </section>

                <section className="lq-set-section">
                  <div className="lq-set-section-h">
                    <p className="lq-set-section-t">Immersion</p>
                    <span className="lq-set-section-line"/>
                  </div>
                  <div className="lq-set-card">
                    <div className="lq-set-row no-click">
                      <div className="lq-set-row-ico">🔊</div>
                      <div className="lq-set-row-text">
                        <p className="lq-set-row-h">Sound Effects</p>
                        <p className="lq-set-row-d">Quest cues and rewards</p>
                      </div>
                      <button type="button" className={"lq-set-toggle"+(sfxOn?" on":"")} onClick={function(){setSfxOn(function(v){var n=!v;try{localStorage.setItem("rq-sfx",n?"on":"off");}catch(e){}return n;});}} aria-label="Toggle sound effects"/>
                    </div>
                    <div className="lq-set-row no-click">
                      <div className="lq-set-row-ico">🎵</div>
                      <div className="lq-set-row-text">
                        <p className="lq-set-row-h">Background Music</p>
                        <p className="lq-set-row-d">Ambient soundtrack during reading</p>
                      </div>
                      <button type="button" className={"lq-set-toggle"+(musicOn?" on":"")} onClick={function(){setMusicOn(function(v){return!v;});}} aria-label="Toggle music"/>
                    </div>
                    {musicOn&&(
                      <div className="lq-set-card-pad" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,color:"rgba(227,224,244,0.45)",letterSpacing:0.14,textTransform:"uppercase",margin:"0 0 10px"}}>Music Genre</p>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                          {[["classical","🎻","Classical"],["lofi","☕","Lo-fi"],["jazz","🎷","Jazz"],["nature","🌿","Nature"]].map(function(opt){
                            var active=musicGenre===opt[0];
                            return<button key={opt[0]} type="button" onClick={function(){setMusicGenre(opt[0]);try{localStorage.setItem("rq-music-genre",opt[0]);}catch(e){}}} className={"lq-set-genre"+(active?" on":"")}><span>{opt[1]}</span><span>{opt[2]}</span></button>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="lq-set-section">
                  <div className="lq-set-section-h">
                    <p className="lq-set-section-t">Alerts</p>
                    <span className="lq-set-section-line"/>
                  </div>
                  <div className="lq-set-card">
                    <div className="lq-set-row no-click">
                      <div className="lq-set-row-ico">🔔</div>
                      <div className="lq-set-row-text">
                        <p className="lq-set-row-h">{t("push_title")}</p>
                        <p className="lq-set-row-d">{pushSubscribed?t("push_desc_on"):t("push_desc_off")}</p>
                      </div>
                      <button type="button" className={"lq-set-toggle"+(pushSubscribed?" on":"")} disabled={pushBusy} onClick={pushSubscribed?disablePushReminders:enablePushReminders} aria-label={t("push_title")}/>
                    </div>
                    {pushSubscribed&&(
                      <div className="lq-set-card-pad" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,color:"rgba(227,224,244,0.5)",letterSpacing:0.12,textTransform:"uppercase",margin:"0 0 8px"}}>{t("push_exam_label")}</p>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <input
                            type="date"
                            value={pushExamDate}
                            min={new Date().toISOString().slice(0,10)}
                            onChange={function(e){setPushExamDate(e.target.value);}}
                            style={{flex:1,padding:"10px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,0.10)",background:"rgba(255,255,255,0.04)",color:"#e3e0f4",fontFamily:"inherit",fontSize:13,colorScheme:"dark"}}
                          />
                          <button type="button" onClick={saveExamDate} disabled={pushBusy} style={{padding:"10px 14px",borderRadius:12,border:"none",background:"#5af0b3",color:"#003825",fontFamily:"inherit",fontSize:12,fontWeight:800,cursor:pushBusy?"wait":"pointer"}}>{pushBusy?t("push_saving"):t("push_save")}</button>
                        </div>
                        <p style={{fontSize:11,color:"rgba(227,224,244,0.45)",margin:"8px 0 0",lineHeight:1.5}}>{t("push_exam_hint")}</p>
                      </div>
                    )}
                    {pushMsg&&<p style={{margin:"8px 16px 14px",fontSize:11,color:pushMsg.indexOf("✓")===0?"#5af0b3":"#f87171"}}>{pushMsg}</p>}
                    {notifPermission==="granted"&&(
                      <button type="button" className="lq-set-row" onClick={sendTestNotification}>
                        <div className="lq-set-row-ico">🧪</div>
                        <div className="lq-set-row-text">
                          <p className="lq-set-row-h">{t("push_test_title")}</p>
                          <p className="lq-set-row-d">{t("push_test_desc")}</p>
                        </div>
                        <span className="lq-set-row-chev">›</span>
                      </button>
                    )}
                    {quotes.length>0&&(
                      <button type="button" className="lq-set-row" onClick={function(){setStage("quotes");}}>
                        <div className="lq-set-row-ico">🔖</div>
                        <div className="lq-set-row-text">
                          <p className="lq-set-row-h">Quote Book</p>
                          <p className="lq-set-row-d">{quotes.length} saved sentence{quotes.length!==1?"s":""}</p>
                        </div>
                        <span className="lq-set-row-chev">›</span>
                      </button>
                    )}
                  </div>
                </section>

                <section className="lq-set-section">
                  <div className="lq-set-section-h">
                    <p className="lq-set-section-t">Visual Style</p>
                    <span className="lq-set-section-line"/>
                  </div>
                  <div className="lq-set-card">
                    <div className="lq-set-card-pad">
                      <div className="lq-set-card-pad-row">
                        <div className="lq-set-row-ico">🎨</div>
                        <div className="lq-set-row-text">
                          <p className="lq-set-row-h">Active Theme</p>
                          <p className="lq-set-row-d">{appTheme?appTheme.emoji+" "+appTheme.name:"🌌 Lumina Quest (Default)"}</p>
                        </div>
                      </div>
                      <div className="lq-set-theme-grid">
                        {PRESET_THEMES.map(function(th){
                          var isActive=appTheme&&appTheme.id===th.id;
                          return(<button key={th.id} title={th.name} type="button" onClick={function(){applyTheme(th);}} className={"lq-set-theme"+(isActive?" on":"")} style={isActive?{borderColor:th.accent,boxShadow:"0 0 14px "+th.accent+"55"}:{}}>
                            <div className="swatch" style={{background:"linear-gradient(135deg,"+th.accent+" 50%,"+th.secondary+" 50%)"}}/>
                            <span className="name" style={isActive?{color:th.accent}:{}}>{th.emoji}</span>
                          </button>);
                        })}
                      </div>
                      <button type="button" onClick={selectRandomTheme} className="lq-set-random">🎲 Random Theme</button>
                    </div>
                  </div>
                </section>

                <button type="button" className="lq-set-logout" onClick={function(){track("user_logout");revokeStoredRefreshToken();resetIdentity();_sessionToken=null;localStorage.removeItem("rq-session");localStorage.removeItem(CREDS_KEY);setCurrentUser(null);setNameInput("");setPassInput("");setStage("auth");}}>
                  <div className="lq-set-logout-ico">🚪</div>
                  <div className="lq-set-row-text">
                    <p className="lq-set-logout-h">Logout</p>
                    <p className="lq-set-logout-d">End your current session</p>
                  </div>
                  <span className="lq-set-row-chev" style={{color:"#f87171"}}>›</span>
                </button>
              </div>
            </div>
          </>
          );
        })()}

        {/* ── MY PROFILE ────────────────────────────────────── */}
        {stage==="profile"&&currentUser&&(function(){
          var games=(currentUser&&currentUser.games)?currentUser.games:[];
          var gamesXp=games.reduce(function(s,g){return s+g.xp;},0);
          var totalXp=Math.max(Number(currentUser&&currentUser.totalXp)||0,gamesXp);
          var avgPct=games.length?Math.round(games.reduce(function(s,g){return s+g.pct;},0)/games.length):0;
          var avgTotalSecs=games.reduce(function(s,g){return s+(g.timeSecs||0);},0);
          var totalReadHours=Math.round(avgTotalSecs/3600*10)/10;
          var lvlInfo=getLevelProgress(totalXp);
          var initial=(currentUser.name||"?")[0].toUpperCase();
          var myBadges=checkBadges(currentUser,vocab,myStreak);
          var earnedBadges=BADGES.filter(function(b){return myBadges[b.id];});
          var topBadges=earnedBadges.slice(0,5);
          var lockedSlots=Math.max(0,5-topBadges.length);
          // World ranking preview — top of best level board
          var bestBoard=asArray(boards&&boards[myBestLevel]).slice().sort(function(a,b){return (b.xp||0)-(a.xp||0);}).slice(0,5);
          var myRankIdx=bestBoard.findIndex(function(e){return e.name===currentUser.name;});
          // Pick most recent unfinished story or last played for "Active Quest"
          var lastPlayed=null;
          for(var gi=games.length-1;gi>=0;gi--){if(games[gi].storyId){lastPlayed=games[gi];break;}}
          var lastStory=lastPlayed?STORY_LIBRARY.find(function(s){return s.id===lastPlayed.storyId;}):null;
          var lastStoryLv=lastStory?getLv(lastStory.level):null;
          return(
          <>
            <style>{`
              .lq-hero-wrap{margin:-18px -20px -64px;padding:0 0 96px;background:#0d0d1a;min-height:calc(100vh - 0px)}
              @media(min-width:480px){.lq-hero-wrap{margin:-22px -28px -72px}}
              .lq-hero-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
              .lq-hero-topbar-l{display:flex;align-items:center;gap:12px}
              .lq-hero-title{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#e3e0f4;margin:0;letter-spacing:-0.01em}
              .lq-hero-title .accent{color:#5af0b3}
              .lq-hero-ico-btn{background:none;border:none;color:rgba(227,224,244,0.55);cursor:pointer;padding:8px;display:flex;align-items:center;border-radius:10px}
              .lq-hero-ico-btn:hover{background:rgba(255,255,255,0.06);color:#5af0b3}
              .lq-hero-content{padding:24px 18px 0}
              .lq-hero-section{position:relative;text-align:center;padding:28px 16px 24px;background:radial-gradient(circle at 50% 0%,rgba(52,211,153,0.10) 0%,transparent 65%),radial-gradient(circle at 50% 100%,rgba(167,139,250,0.08) 0%,transparent 70%);border:1px solid rgba(255,255,255,0.08);border-radius:24px;margin-bottom:14px;overflow:hidden}
              .lq-hero-avatar{position:relative;width:120px;height:120px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center}
              .lq-hero-avatar::before{content:"";position:absolute;inset:-6px;border-radius:50%;background:conic-gradient(from 0deg,#5af0b3,#a78bfa,#5af0b3);animation:rqRotate 6s linear infinite;opacity:0.7;filter:blur(2px)}
              @keyframes rqRotate{to{transform:rotate(360deg)}}
              .lq-hero-avatar-inner{position:relative;width:108px;height:108px;border-radius:50%;background:radial-gradient(circle,#1a1a28,#0d0d1a);border:2px solid #0d0d1a;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-weight:800;font-size:46px;color:#5af0b3;text-shadow:0 0 24px rgba(52,211,153,0.6)}
              .lq-hero-level-tag{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#a78bfa,#6366F1);color:#fff;font-family:'Outfit',sans-serif;font-size:11px;font-weight:800;padding:4px 14px;border-radius:999px;border:2px solid #0d0d1a;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 4px 12px rgba(167,139,250,0.4)}
              .lq-hero-name{font-family:'Outfit',sans-serif;font-size:28px;font-weight:800;color:#e3e0f4;margin:0;letter-spacing:-0.02em;line-height:1.1}
              .lq-hero-subtitle{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.45);letter-spacing:0.18em;text-transform:uppercase;margin:4px 0 0;font-weight:600}
              .lq-hero-xp-section{margin-top:20px;text-align:left}
              .lq-hero-xp-row{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:6px}
              .lq-hero-xp-lbl{font-family:'Inter',sans-serif;font-size:9px;font-weight:800;color:rgba(227,224,244,0.4);letter-spacing:0.14em;text-transform:uppercase}
              .lq-hero-xp-curr{font-family:'Outfit',sans-serif;font-size:20px;font-weight:700;color:#e3e0f4;line-height:1}
              .lq-hero-xp-curr .total{color:rgba(227,224,244,0.4);font-size:14px;font-weight:500}
              .lq-hero-xp-rem{font-family:'Inter',sans-serif;font-size:10px;font-weight:800;color:#5af0b3;letter-spacing:0.1em;text-transform:uppercase;text-align:right}
              .lq-hero-xp-bar{height:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;padding:2px;position:relative}
              .lq-hero-xp-fill{height:100%;background:linear-gradient(90deg,#a78bfa,#5af0b3,#0EA5E9);border-radius:999px;box-shadow:0 0 20px rgba(52,211,153,0.4);transition:width 1s ease}
              .lq-hero-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
              .lq-hero-stat-card{background:rgba(30,30,44,0.45);border:1px solid rgba(255,255,255,0.08);border-top-width:3px;border-radius:18px;padding:16px 12px;text-align:center;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
              .lq-hero-stat-ico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:22px}
              .lq-hero-stat-v{font-family:'Outfit',sans-serif;font-size:26px;font-weight:800;color:#e3e0f4;line-height:1}
              .lq-hero-stat-l{font-family:'Inter',sans-serif;font-size:9px;font-weight:800;color:rgba(227,224,244,0.45);letter-spacing:0.14em;text-transform:uppercase;margin-top:6px}
              .lq-hero-bento-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
              .lq-hero-bento-h-l{display:flex;align-items:center;gap:10px}
              .lq-hero-bento-h-l .ico{width:32px;height:32px;border-radius:10px;background:rgba(52,211,153,0.15);display:flex;align-items:center;justify-content:center;color:#5af0b3;font-size:16px}
              .lq-hero-bento-h h3{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#e3e0f4;margin:0;letter-spacing:-0.01em}
              .lq-hero-bento-h-l h3{flex-shrink:0}
              .lq-hero-bento-h .link-btn{background:rgba(52,211,153,0.08);border:none;color:#5af0b3;font-family:'Inter',sans-serif;font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;padding:6px 14px;border-radius:999px;cursor:pointer;transition:background 0.15s}
              .lq-hero-bento-h .link-btn:hover{background:rgba(52,211,153,0.15)}
              .lq-hero-bento-card{background:rgba(30,30,44,0.45);border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:22px 18px;margin-bottom:14px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:relative;overflow:hidden}
              .lq-hero-bento-card::before{content:"";position:absolute;top:0;right:0;width:140px;height:140px;background:rgba(52,211,153,0.05);filter:blur(60px);border-radius:50%;pointer-events:none}
              .lq-hero-badges-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;position:relative}
              .lq-hero-badge{display:flex;flex-direction:column;align-items:center;gap:6px}
              .lq-hero-badge-tile{position:relative;width:100%;aspect-ratio:1;border-radius:16px;background:linear-gradient(135deg,#383847,#292937);border:1px solid rgba(255,255,255,0.10);display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 8px 24px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08);transition:transform 0.2s,box-shadow 0.2s;cursor:pointer}
              .lq-hero-badge-tile.locked{background:rgba(13,13,26,0.5);border-color:rgba(255,255,255,0.04);opacity:0.4;cursor:not-allowed}
              .lq-hero-badge-tile.locked::after{content:"🔒";font-size:18px;color:rgba(227,224,244,0.4)}
              .lq-hero-badge-tile.locked>span{display:none}
              .lq-hero-badge-tile:not(.locked):hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,0.55),0 0 18px rgba(52,211,153,0.12)}
              .lq-hero-badge-tile .glow-ring{position:absolute;inset:6px;border:1px solid rgba(52,211,153,0.3);border-radius:12px;pointer-events:none}
              .lq-hero-badge-lbl{font-family:'Inter',sans-serif;font-size:8px;font-weight:800;text-align:center;letter-spacing:0.12em;text-transform:uppercase;color:rgba(227,224,244,0.4);line-height:1.2;min-height:18px}
              .lq-hero-rank-list{display:flex;flex-direction:column;gap:8px}
              .lq-hero-rank-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid transparent;transition:all 0.15s}
              .lq-hero-rank-row:hover{background:rgba(255,255,255,0.06)}
              .lq-hero-rank-row.me{background:rgba(52,211,153,0.10);border-color:rgba(52,211,153,0.5);box-shadow:0 8px 24px rgba(52,211,153,0.18)}
              .lq-hero-rank-pos{font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;color:rgba(227,224,244,0.4);width:24px;text-align:center}
              .lq-hero-rank-row.me .lq-hero-rank-pos{color:#5af0b3}
              .lq-hero-rank-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#5af0b3,#a78bfa);display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;color:#003825;flex-shrink:0;border:1px solid rgba(255,255,255,0.10)}
              .lq-hero-rank-row.me .lq-hero-rank-avatar{border:2px solid #5af0b3;box-shadow:0 0 12px rgba(52,211,153,0.5)}
              .lq-hero-rank-name{flex:1;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:rgba(227,224,244,0.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
              .lq-hero-rank-row.me .lq-hero-rank-name{color:#e3e0f4}
              .lq-hero-rank-name small{display:block;font-size:9px;font-weight:800;color:rgba(227,224,244,0.4);letter-spacing:0.12em;text-transform:uppercase;margin-top:2px}
              .lq-hero-rank-row.me .lq-hero-rank-name small{color:#5af0b3}
              .lq-hero-rank-xp{font-family:'Outfit',sans-serif;font-size:13px;font-weight:800;color:rgba(227,224,244,0.7)}
              .lq-hero-rank-row.me .lq-hero-rank-xp{color:#5af0b3}
              .lq-hero-rank-empty{padding:20px;text-align:center;font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.4)}
              .lq-hero-quest-card{background:rgba(30,30,44,0.5);border:1px solid rgba(255,255,255,0.08);border-left:4px solid #0EA5E9;border-radius:22px;padding:18px;margin-bottom:14px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);position:relative;overflow:hidden}
              .lq-hero-quest-card::before{content:"";position:absolute;bottom:-40px;right:-40px;width:200px;height:200px;background:rgba(14,165,233,0.06);filter:blur(80px);border-radius:50%;pointer-events:none}
              .lq-hero-quest-row{display:flex;gap:14px;align-items:center;position:relative}
              .lq-hero-quest-cover{width:80px;height:108px;border-radius:12px;background:rgba(0,0,0,0.4);overflow:hidden;flex-shrink:0;box-shadow:0 8px 20px rgba(0,0,0,0.6);position:relative}
              .lq-hero-quest-cover img{width:100%;height:100%;object-fit:cover}
              .lq-hero-quest-cover .active-tag{position:absolute;bottom:6px;left:6px;right:6px;text-align:center;background:rgba(14,165,233,0.85);color:#fff;font-family:'Inter',sans-serif;font-size:8px;font-weight:800;padding:2px 6px;border-radius:6px;letter-spacing:0.1em;text-transform:uppercase}
              .lq-hero-quest-meta{flex:1;min-width:0}
              .lq-hero-quest-cat{display:flex;align-items:center;gap:4px;color:#0EA5E9;font-family:'Inter',sans-serif;font-size:9px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:4px}
              .lq-hero-quest-title{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#e3e0f4;margin:0 0 4px;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
              .lq-hero-quest-author{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.5);margin:0 0 10px}
              .lq-hero-quest-progress-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}
              .lq-hero-quest-pct{font-family:'Outfit',sans-serif;font-size:14px;font-weight:800;color:#0EA5E9}
              .lq-hero-quest-pct small{font-family:'Inter',sans-serif;font-size:8px;font-weight:800;color:rgba(227,224,244,0.4);letter-spacing:0.12em;text-transform:uppercase;margin-left:4px}
              .lq-hero-quest-bar{height:8px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-bottom:14px}
              .lq-hero-quest-fill{height:100%;background:linear-gradient(90deg,#0EA5E9,#a78bfa);border-radius:999px;box-shadow:0 0 10px rgba(14,165,233,0.4)}
              .lq-hero-quest-cta{display:flex;gap:8px;margin-top:4px}
              .lq-hero-quest-resume{flex:1;background:#0EA5E9;color:#fff;border:none;border-radius:12px;padding:11px;font-family:'Outfit',sans-serif;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 12px rgba(14,165,233,0.4),0 4px 0 0 rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;gap:6px}
              .lq-hero-quest-resume:active{transform:translateY(2px);box-shadow:0 4px 12px rgba(14,165,233,0.4),0 2px 0 0 rgba(0,0,0,0.3)}
              .lq-hero-empty{padding:32px 18px;text-align:center;background:rgba(30,30,44,0.45);border:1px solid rgba(255,255,255,0.08);border-radius:24px;margin-bottom:14px}
              .lq-hero-empty-emoji{font-size:48px;margin-bottom:10px;line-height:1}
              .lq-hero-empty-t{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#e3e0f4;margin:0 0 6px}
              .lq-hero-empty-d{font-family:'Inter',sans-serif;font-size:13px;color:rgba(227,224,244,0.5);margin:0 0 16px}
              .lq-hero-empty-cta{background:#5af0b3;color:#003825;border:none;border-radius:14px;padding:11px 24px;font-family:'Outfit',sans-serif;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;box-shadow:0 4px 0 0 rgba(0,0,0,0.4),0 4px 14px rgba(52,211,153,0.4)}
              .lq-hero-action-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}
              .lq-hero-action-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);color:rgba(227,224,244,0.8);border-radius:14px;padding:12px;font-family:'Outfit',sans-serif;font-weight:700;font-size:12px;letter-spacing:0.04em;cursor:pointer;transition:all 0.15s}
              .lq-hero-action-btn:hover{background:rgba(255,255,255,0.08);color:#e3e0f4}
              .lq-hero-action-btn.danger{color:#f87171;border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.06)}
              .lq-hero-action-btn.danger:hover{background:rgba(239,68,68,0.12)}
              .lq-hero-bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;z-index:50;display:flex;justify-content:space-around;align-items:center;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:rgba(30,30,44,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,0.08);border-radius:24px 24px 0 0;box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
              .lq-hero-nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:6px 14px;color:rgba(227,224,244,0.5);font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;position:relative;transition:color 0.15s}
              .lq-hero-nav-btn:hover{color:#e3e0f4}
              .lq-hero-nav-btn .ico{font-size:22px;line-height:1}
              .lq-hero-nav-btn.is-active{color:#5af0b3}
              .lq-hero-nav-btn.is-active::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:6px;height:6px;border-radius:999px;background:#5af0b3;box-shadow:0 0 8px rgba(52,211,153,0.9)}
            `}</style>
            <div className="lq-hero-wrap">
              <header className="lq-hero-topbar">
                <div className="lq-hero-topbar-l">
                  <button type="button" className="lq-hero-ico-btn" onClick={function(){setStage("home");}} aria-label="Back">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h1 className="lq-hero-title">My <span className="accent">Hero</span></h1>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button type="button" className="lq-hero-ico-btn" onClick={function(){setStage("settings");}} aria-label="Settings">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </button>
                  <button type="button" className="lq-hero-ico-btn" onClick={function(){track("user_logout");revokeStoredRefreshToken();resetIdentity();_sessionToken=null;localStorage.removeItem("rq-session");localStorage.removeItem(CREDS_KEY);setCurrentUser(null);setNameInput("");setPassInput("");setStage("auth");}} aria-label="Logout">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </button>
                </div>
              </header>

              <div className="lq-hero-content">
                <section className="lq-hero-section">
                  <div className="lq-hero-avatar">
                    <div className="lq-hero-avatar-inner">{initial}</div>
                    <div className="lq-hero-level-tag">Level {lvlInfo.level}</div>
                  </div>
                  <h2 className="lq-hero-name">{currentUser.name}</h2>
                  <p className="lq-hero-subtitle">{lvlInfo.level>=20?"Legendary Scholar":lvlInfo.level>=10?"Master Reader":lvlInfo.level>=5?"Apprentice":"Initiate"}</p>

                  <div className="lq-hero-xp-section">
                    <div className="lq-hero-xp-row">
                      <div>
                        <div className="lq-hero-xp-lbl">Current Progression</div>
                        <div className="lq-hero-xp-curr">{totalXp.toLocaleString()} <span className="total">/ {(totalXp+lvlInfo.xpNeeded).toLocaleString()} XP</span></div>
                      </div>
                      <div className="lq-hero-xp-rem">{lvlInfo.xpNeeded} XP to Lvl {lvlInfo.level+1}</div>
                    </div>
                    <div className="lq-hero-xp-bar"><div className="lq-hero-xp-fill" style={{width:lvlInfo.progress+"%"}}/></div>
                  </div>
                </section>

                <section className="lq-hero-stat-grid">
                  <div className="lq-hero-stat-card" style={{borderTopColor:"#0EA5E9"}}>
                    <div className="lq-hero-stat-ico" style={{background:"rgba(14,165,233,0.12)",color:"#7dd3fc"}}>📚</div>
                    <div className="lq-hero-stat-v">{games.length}</div>
                    <div className="lq-hero-stat-l">Books Read</div>
                  </div>
                  <div className="lq-hero-stat-card" style={{borderTopColor:"#5af0b3"}}>
                    <div className="lq-hero-stat-ico" style={{background:"rgba(52,211,153,0.12)",color:"#5af0b3"}}>🔥</div>
                    <div className="lq-hero-stat-v">{myStreak}</div>
                    <div className="lq-hero-stat-l">Day Streak</div>
                  </div>
                  <div className="lq-hero-stat-card" style={{borderTopColor:"#a78bfa"}}>
                    <div className="lq-hero-stat-ico" style={{background:"rgba(167,139,250,0.12)",color:"#c4b5fd"}}>🏅</div>
                    <div className="lq-hero-stat-v">{earnedBadges.length}</div>
                    <div className="lq-hero-stat-l">Quests Won</div>
                  </div>
                  <div className="lq-hero-stat-card" style={{borderTopColor:"#ec4899"}}>
                    <div className="lq-hero-stat-ico" style={{background:"rgba(236,72,153,0.12)",color:"#f472b6"}}>⏱</div>
                    <div className="lq-hero-stat-v">{totalReadHours}h</div>
                    <div className="lq-hero-stat-l">Time Reading</div>
                  </div>
                </section>

                <section className="lq-hero-bento-card">
                  <div className="lq-hero-bento-h">
                    <div className="lq-hero-bento-h-l">
                      <span className="ico">✨</span>
                      <h3>Legendary Artifacts</h3>
                    </div>
                    <button type="button" className="link-btn" onClick={function(){setStage("badges");}}>Open Gallery</button>
                  </div>
                  <div className="lq-hero-badges-grid">
                    {topBadges.map(function(b){return(
                      <div key={b.id} className="lq-hero-badge">
                        <div className="lq-hero-badge-tile">
                          <div className="glow-ring"/>
                          <span>{b.icon}</span>
                        </div>
                        <div className="lq-hero-badge-lbl">{badgeName(b.id)}</div>
                      </div>
                    );})}
                    {Array.from({length:lockedSlots}).map(function(_,i){return(
                      <div key={"lk-"+i} className="lq-hero-badge">
                        <div className="lq-hero-badge-tile locked"/>
                        <div className="lq-hero-badge-lbl">Locked</div>
                      </div>
                    );})}
                  </div>
                </section>

                <section className="lq-hero-bento-card">
                  <div className="lq-hero-bento-h">
                    <div className="lq-hero-bento-h-l">
                      <span className="ico" style={{background:"rgba(167,139,250,0.15)",color:"#c4b5fd"}}>🏆</span>
                      <h3>World Ranking</h3>
                    </div>
                    <button type="button" className="link-btn" onClick={function(){setLbLevel(myBestLevel||"A1");setStage("leaderboard");}}>View All</button>
                  </div>
                  {bestBoard.length>0?(
                    <div className="lq-hero-rank-list">
                      {bestBoard.map(function(e,i){
                        var isMe=e.name===currentUser.name;
                        return(
                          <div key={i} className={"lq-hero-rank-row"+(isMe?" me":"")}>
                            <span className="lq-hero-rank-pos">{String(i+1).padStart(2,"0")}</span>
                            <div className="lq-hero-rank-avatar">{(e.name||"?")[0].toUpperCase()}</div>
                            <div className="lq-hero-rank-name">{e.name}{isMe&&<small>• You</small>}</div>
                            <span className="lq-hero-rank-xp">{e.xp||0}</span>
                          </div>
                        );
                      })}
                    </div>
                  ):(
                    <div className="lq-hero-rank-empty">Play a quest to enter the {myBestLevel||"A1"} leaderboard.</div>
                  )}
                </section>

                {lastStory&&lastStoryLv?(
                  <section className="lq-hero-quest-card" style={{borderLeftColor:lastStoryLv.color}}>
                    <div className="lq-hero-quest-row">
                      <div className="lq-hero-quest-cover">
                        <img src={"/assets/covers/"+lastStory.id+".svg"} alt={lastStory.title} onError={function(e){e.target.style.display="none";}}/>
                        <div className="active-tag" style={{background:"rgba("+hex2rgb(lastStoryLv.color)+",0.85)"}}>Active</div>
                      </div>
                      <div className="lq-hero-quest-meta">
                        <div className="lq-hero-quest-cat" style={{color:lastStoryLv.color}}>✨ {lastStory.level} Main Quest</div>
                        <h3 className="lq-hero-quest-title">{lastStory.title}</h3>
                        <p className="lq-hero-quest-author">{lastStory.topic}</p>
                        <div className="lq-hero-quest-progress-row">
                          <span className="lq-hero-quest-pct" style={{color:lastStoryLv.color}}>{lastPlayed.pct}%<small>Last Score</small></span>
                          <span style={{fontFamily:"'Inter',sans-serif",fontSize:9,fontWeight:800,color:"rgba(227,224,244,0.4)",letterSpacing:0.12,textTransform:"uppercase"}}>{lastPlayed.date}</span>
                        </div>
                        <div className="lq-hero-quest-bar"><div className="lq-hero-quest-fill" style={{width:lastPlayed.pct+"%",background:"linear-gradient(90deg,"+lastStoryLv.color+",#a78bfa)"}}/></div>
                        <div className="lq-hero-quest-cta">
                          <button type="button" className="lq-hero-quest-resume" onClick={function(){startStoryFromLibrary(lastStory);}} style={{background:lastStoryLv.color,boxShadow:"0 4px 12px "+lastStoryLv.glow+",0 4px 0 0 rgba(0,0,0,0.3)"}}>
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            Resume Journey
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                ):games.length===0?(
                  <div className="lq-hero-empty">
                    <div className="lq-hero-empty-emoji">🎮</div>
                    <h3 className="lq-hero-empty-t">No quests yet</h3>
                    <p className="lq-hero-empty-d">Start your learning journey</p>
                    <button type="button" className="lq-hero-empty-cta" onClick={doRestart}>Play Now</button>
                  </div>
                ):null}

                <div className="lq-hero-action-row">
                  <button type="button" className="lq-hero-action-btn" onClick={function(){setStage("analytics");}}>📊 {t("stats")}</button>
                  <button type="button" className="lq-hero-action-btn" onClick={function(){setHistoryLevel("");setStage("history");}}>📜 {t("history")}</button>
                </div>
              </div>

              <nav className="lq-hero-bottom-nav">
                <button type="button" onClick={function(){setStage("home");}} className="lq-hero-nav-btn">
                  <span className="ico">🏠</span><span>{t("home").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("library");}} className="lq-hero-nav-btn">
                  <span className="ico">📚</span><span>{t("library").toUpperCase()}</span>
                </button>
                <button type="button" onClick={function(){setStage("analytics");}} className="lq-hero-nav-btn">
                  <span className="ico">📊</span><span>{t("stats").toUpperCase()}</span>
                </button>
                <button type="button" className="lq-hero-nav-btn is-active">
                  <span className="ico">👤</span><span>{t("profile").toUpperCase()}</span>
                </button>
              </nav>
            </div>
          </>
          );
        })()}

        {/* ── READING GOALS ─────────────────────────────────── */}
        {stage==="goals"&&currentUser&&(function(){
          var games=currentUser.games||[];
          return(
            <div>
              <header className="lq-sub-topbar">
                <button type="button" className="lq-sub-back" onClick={function(){setStage("home");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#5af0b3"}}>🎯</span> {t("readingGoals")}</h1>
                <div style={{width:38}}/>
              </header>

              {/* active goals */}
              {GOAL_DEFS.filter(function(d){return goals[d.id];}).length>0&&(
                <div style={{...CARD,marginBottom:14,padding:16}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:12}}>{t("activeGoals")}</p>
                  {GOAL_DEFS.filter(function(d){return goals[d.id];}).map(function(def){
                    var g=goals[def.id];
                    var prog=getGoalProgress(def.id,g,games,myStreak);
                    var detail="";
                    if(def.id==="avg_score")detail=(g.trackGames||[]).length+"/5 games tracked";
                    else if(def.id==="weekly_games"||def.id==="weekly_xp")detail="resets each week";
                    return(
                      <div key={def.id} style={{marginBottom:14,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:"1px solid "+(prog.done?"rgba(52,211,153,0.3)":"rgba(255,255,255,0.07)")}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div>
                            <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{def.icon} {goalLabel(def.id)}</div>
                            {detail&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{detail}</div>}
                          </div>
                          <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                            <div style={{fontSize:15,fontWeight:900,color:prog.done?"#34d399":"#a78bfa"}}>{prog.done?"✓ "+t("doneLabel"):prog.current+(def.id==="avg_score"?" avg%":"")+"/"+prog.target+" "+goalUnit(def.id)}</div>
                          </div>
                        </div>
                        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:7,overflow:"hidden",marginBottom:8}}>
                          <div style={{height:"100%",width:prog.pct+"%",background:prog.done?"#34d399":"linear-gradient(90deg,#6366f1,#a78bfa)",borderRadius:999,transition:"width 0.4s ease"}}/>
                        </div>
                        <button onClick={function(){removeGoal(def.id);}} style={{background:"none",border:"1px solid rgba(239,68,68,0.25)",color:"#f87171",borderRadius:8,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t("remove")}</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* add new goals */}
              <div style={{...CARD,padding:16}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:12}}>{t("setAGoal")}</p>
                {GOAL_DEFS.filter(function(d){return!goals[d.id];}).map(function(def){
                  return(
                    <div key={def.id} style={{marginBottom:14}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#f3f4f6",marginBottom:7}}>{def.icon} {goalLabel(def.id)}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {def.opts.map(function(opt){
                          return<button key={opt} onClick={function(){setGoal(def.id,opt);}} style={{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",color:"#c7d2fe",borderRadius:999,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{opt} {goalUnit(def.id)}</button>;
                        })}
                      </div>
                    </div>
                  );
                })}
                {GOAL_DEFS.every(function(d){return goals[d.id];})&&(
                  <p style={{color:"#6b7280",fontSize:13,textAlign:"center"}}>{t("allGoalTypesActive")}</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── ANALYTICS ─────────────────────────────────────── */}
        {stage==="analytics"&&currentUser&&(function(){
          var games=currentUser.games||[];
          var today=todayKey();
          var gamesXp=games.reduce(function(s,g){return s+g.xp;},0);
          var totalXp=Math.max(Number(currentUser&&currentUser.totalXp)||0,gamesXp);
          var totalTimeSecs=games.reduce(function(s,g){return s+g.timeSecs;},0);
          var avgPct=games.length?Math.round(games.reduce(function(s,g){return s+g.pct;},0)/games.length):0;
          var lvlInfo=getLevelProgress(totalXp);

          // weekly activity (last 7 days)
          var week=[];
          for(var wd=6;wd>=0;wd--){
            var wdt=new Date();wdt.setDate(wdt.getDate()-wd);var wds=wdt.toISOString().slice(0,10);
            var dayGames=games.filter(function(g){return g.date===wds;});
            week.push({label:wdt.toLocaleDateString("en",{weekday:"short"}),date:wds,count:dayGames.length,xp:dayGames.reduce(function(s,g){return s+g.xp;},0),isToday:wds===today});
          }
          var maxDayXp=Math.max(1,Math.max.apply(null,week.map(function(w){return w.xp;})));

          // per-level breakdown
          var byLevel={};
          games.forEach(function(g){if(!byLevel[g.level])byLevel[g.level]={count:0,xpTotal:0,pctTotal:0};byLevel[g.level].count++;byLevel[g.level].xpTotal+=g.xp;byLevel[g.level].pctTotal+=g.pct;});

          // type accuracy aggregate
          var typeAgg={};
          games.forEach(function(g){if(!g.typeStats)return;Object.keys(g.typeStats).forEach(function(t){if(!typeAgg[t])typeAgg[t]={earned:0,max:0};typeAgg[t].earned+=g.typeStats[t].earned;typeAgg[t].max+=g.typeStats[t].max;});});

          var earnedBadges=checkBadges(currentUser,vocab,myStreak);
          var badgeCount=BADGES.filter(function(b){return earnedBadges[b.id];}).length;

          // score trend — last 20 games
          var scoreTrend=games.slice(-20);
          // wpm trend — last 15 games with wpm
          var wpmTrend=games.filter(function(g){return g.wpm>0;}).slice(-15);
          // cumulative XP over last 30 days
          var xpByDay={};
          games.forEach(function(g){xpByDay[g.date]=(xpByDay[g.date]||0)+g.xp;});
          var xpDays=[];
          for(var xi=29;xi>=0;xi--){var xd=new Date();xd.setDate(xd.getDate()-xi);var xds=xd.toISOString().slice(0,10);xpDays.push({date:xds,xp:xpByDay[xds]||0});}
          var cumXp=0;var cumXpDays=xpDays.map(function(d){cumXp+=d.xp;return{date:d.date,cum:cumXp};});
          var maxCumXp=Math.max(1,cumXpDays[cumXpDays.length-1].cum);

          // weak types — sorted ascending by accuracy
          var typeList=Object.keys(typeAgg).map(function(t){var ts=typeAgg[t];return{t:t,pct:ts.max>0?Math.round(ts.earned/ts.max*100):0};}).sort(function(a,b){return a.pct-b.pct;});
          var weakTypes=typeList.slice(0,2).filter(function(x){return x.pct<70;});

          // 30-day activity calendar
          var cal30=[];
          for(var ci=29;ci>=0;ci--){var cd=new Date();cd.setDate(cd.getDate()-ci);var cds=cd.toISOString().slice(0,10);var cg=games.filter(function(g){return g.date===cds;});cal30.push({date:cds,count:cg.length,avg:cg.length?Math.round(cg.reduce(function(s,g){return s+g.pct;},0)/cg.length):0});}

          // SVG sparkline helper
          function mkSparkline(vals,W,H,col,fill){
            if(vals.length<2)return null;
            var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals);
            var rng=mx-mn||1;
            var pts=vals.map(function(v,i){
              var x=i/(vals.length-1)*(W-4)+2;
              var y=H-4-((v-mn)/rng)*(H-12);
              return x+","+y;
            });
            var pStr=pts.join(" ");
            var areaD="M "+pts[0]+" L "+pts.slice(1).join(" L ")+" L "+(W-2)+","+(H-2)+" L 2,"+  (H-2)+" Z";
            return(
              <svg width={W} height={H} style={{overflow:"visible"}}>
                {fill&&<path d={areaD} fill={fill} opacity={0.15}/>}
                <polyline points={pStr} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
                {vals.map(function(v,i){
                  var x=i/(vals.length-1)*(W-4)+2;
                  var y=H-4-((v-mn)/rng)*(H-12);
                  return<circle key={i} cx={x} cy={y} r={3} fill={col}/>;
                })}
              </svg>
            );
          }

          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#06b6d4"}}>{t("myAnalytics")}</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>{t("back")}</button>
              </div>

              {/* top stats */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {v:games.length,     l:t("sessions"),    c:"#34d399"},
                  {v:totalXp,          l:t("totalXp"),     c:"#fbbf24"},
                  {v:avgPct+"%",       l:t("avgScore"),    c:pctColor(avgPct)},
                  {v:vocab.length,     l:t("wordsSaved"),  c:"#06b6d4"},
                  {v:Math.floor(totalTimeSecs/60)+"m", l:t("timeReading"), c:"#a78bfa"},
                  {v:badgeCount+"/"+BADGES.length, l:t("badges"),   c:"#f472b6"},
                ].map(function(s){
                  return<div key={s.l} style={{textAlign:"center",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 8px"}}>
                    <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:3}}>{s.l}</div>
                  </div>;
                })}
              </div>

              {/* level progress */}
              <div style={{...CARD,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>⭐ {t("playerLevel")} {lvlInfo.level}</span>
                  <span style={{fontSize:11,color:"#6b7280"}}>{lvlInfo.xpNeeded>0?lvlInfo.xpNeeded+" "+t("xpToNext"):t("maxLevel")}</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.05)",borderRadius:999,height:8,overflow:"hidden"}}>
                  <div style={{height:"100%",width:lvlInfo.progress+"%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",borderRadius:999,transition:"width 0.4s ease"}}/>
                </div>
              </div>

              {/* score accuracy trend */}
              {scoreTrend.length>=2&&(
                <div style={{...CARD,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:0}}>{t("scoreTrendLabel")} ({scoreTrend.length})</p>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:700,color:pctColor(avgPct)}}>{avgPct}%</div>
                      <div style={{fontSize:10,color:"#6b7280"}}>avg</div>
                    </div>
                  </div>
                  <div style={{position:"relative"}}>
                    {mkSparkline(scoreTrend.map(function(g){return g.pct;}),320,72,pctColor(avgPct),"#6366f1")}
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:"#4b5563"}}>
                      <span>oldest</span><span>newest</span>
                    </div>
                    <div style={{position:"absolute",top:0,right:0,display:"flex",flexDirection:"column",justifyContent:"space-between",height:72,fontSize:9,color:"#4b5563",textAlign:"right"}}>
                      <span>100%</span><span>50%</span><span>0%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* WPM trend */}
              {wpmTrend.length>=2&&(
                <div style={{...CARD,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:0}}>{t("readingSpeedTrendLabel")}</p>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#a78bfa"}}>{Math.round(wpmTrend.reduce(function(s,g){return s+g.wpm;},0)/wpmTrend.length)} WPM</div>
                      <div style={{fontSize:10,color:"#6b7280"}}>avg</div>
                    </div>
                  </div>
                  {mkSparkline(wpmTrend.map(function(g){return g.wpm;}),320,72,"#a78bfa","#7c3aed")}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:"#4b5563"}}>
                    <span>oldest</span><span style={{color:"#a78bfa"}}>{getWpmLabel(Math.round(wpmTrend.reduce(function(s,g){return s+g.wpm;},0)/wpmTrend.length))}</span><span>newest</span>
                  </div>
                </div>
              )}

              {/* cumulative XP graph */}
              {totalXp>0&&(
                <div style={{...CARD,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:0}}>{t("xpGrowthLabel")}</p>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>{totalXp.toLocaleString()} XP</div>
                      <div style={{fontSize:10,color:"#6b7280"}}>total</div>
                    </div>
                  </div>
                  {mkSparkline(cumXpDays.map(function(d){return d.cum;}),320,72,"#fbbf24","#f59e0b")}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:"#4b5563"}}>
                    <span>30 days ago</span><span>today</span>
                  </div>
                </div>
              )}

              {/* 30-day activity calendar */}
              <div style={{...CARD,marginBottom:12}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10}}>{t("activityLast30")}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                  {cal30.map(function(day,i){
                    var bg=day.count===0?"rgba(255,255,255,0.05)":day.avg>=80?"#22c55e":day.avg>=60?"#f59e0b":"#6366f1";
                    return<div key={i} title={day.date+(day.count?" · "+day.count+" game"+(day.count>1?"s":"")+" · avg "+day.avg+"%":"")} style={{width:14,height:14,borderRadius:3,background:bg,flexShrink:0,cursor:day.count>0?"default":"default"}}/>;
                  })}
                </div>
                <div style={{display:"flex",gap:8,marginTop:8,fontSize:9,color:"#4b5563",flexWrap:"wrap"}}>
                  {[["#22c55e","≥80%"],["#f59e0b","60–79%"],["#6366f1","<60%"],["rgba(255,255,255,0.05)","no activity"]].map(function(p){return<span key={p[1]} style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:10,height:10,borderRadius:2,background:p[0],display:"inline-block"}}/>{p[1]}</span>;})}
                </div>
              </div>

              {/* weak question type highlight */}
              {weakTypes.length>0&&(
                <div style={{...CARD,marginBottom:12,borderColor:"rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.04)"}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#f87171",marginBottom:10}}>{t("focusAreas")}</p>
                  {weakTypes.map(function(w){
                    var tipTbl=STRINGS[uiLang]&&STRINGS[uiLang].weakTypeTips;
                    var enTbl=STRINGS.en.weakTypeTips;
                    var tip=(tipTbl&&tipTbl[w.t])||(enTbl&&enTbl[w.t])||t("practiceMore");
                    return(<div key={w.t} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8,padding:"10px 12px",background:"rgba(239,68,68,0.07)",borderRadius:10}}>
                      <div style={{width:36,height:36,borderRadius:8,background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,fontWeight:900,color:"#f87171"}}>{w.pct}%</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#f3f4f6",marginBottom:2}}>{qLabel(w.t)}</div>
                        <div style={{fontSize:11,color:"#9ca3af"}}>{tip}</div>
                      </div>
                    </div>);
                  })}
                </div>
              )}

              {/* per-level breakdown */}
              {Object.keys(byLevel).length>0&&(
                <div style={{...CARD,marginBottom:12}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10}}>{t("byCefrLevel")}</p>
                  {["A1","A2","B1","B2","C1","C2"].filter(function(l){return byLevel[l];}).map(function(l){
                    var lv=getLv(l),ld=byLevel[l];
                    var ap=Math.round(ld.pctTotal/ld.count);
                    return(<div key={l} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <span style={{fontSize:11,fontWeight:900,color:lv.color,width:24}}>{l}</span>
                      <div style={{flex:1}}>
                        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:999,height:6,overflow:"hidden"}}>
                          <div style={{height:"100%",width:ap+"%",background:lv.color,borderRadius:999}}/>
                        </div>
                      </div>
                      <span style={{fontSize:11,color:pctColor(ap),fontWeight:700,width:32,textAlign:"right"}}>{ap}%</span>
                      <span style={{fontSize:10,color:"#6b7280",width:40,textAlign:"right"}}>{ld.count} {ld.count===1?"game":"games"}</span>
                    </div>);
                  })}
                </div>
              )}

              {/* question type accuracy */}
              {Object.keys(typeAgg).length>0&&(
                <div style={{...CARD,marginBottom:12}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10}}>ACCURACY BY TYPE</p>
                  {typeList.map(function(item){
                    return(<div key={item.t} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                        <span style={{color:"#9ca3af"}}>{qLabel(item.t)}</span>
                        <span style={{color:pctColor(item.pct),fontWeight:700}}>{item.pct}%</span>
                      </div>
                      <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,overflow:"hidden"}}>
                        <div style={{height:"100%",width:item.pct+"%",background:pctColor(item.pct),borderRadius:999}}/>
                      </div>
                    </div>);
                  })}
                </div>
              )}

              {/* weekly activity bar chart */}
              <div style={{...CARD,marginBottom:12}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:12}}>THIS WEEK</p>
                <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80}}>
                  {week.map(function(w){
                    var h=w.xp>0?Math.max(8,Math.round((w.xp/maxDayXp)*68)):4;
                    return(<div key={w.date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{width:"100%",height:h,background:w.isToday?"#06b6d4":w.xp>0?"#6366f1":"rgba(255,255,255,0.07)",borderRadius:"4px 4px 0 0",transition:"height 0.3s ease"}}/>
                      <span style={{fontSize:9,color:w.isToday?"#06b6d4":"#6b7280",fontWeight:w.isToday?700:400}}>{w.label}</span>
                      {w.count>0&&<span style={{fontSize:9,color:"#4b5563"}}>{w.count}</span>}
                    </div>);
                  })}
                </div>
              </div>

              {games.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>📊</div><div style={{fontSize:16,fontWeight:800,color:"#f3f4f6",marginBottom:4}}>No data yet</div><div style={{fontSize:13,color:"#6b7280",marginBottom:14}}>Complete quizzes to see your stats</div><button onClick={doRestart} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:8}}>Start Playing</button></div>}
              <button onClick={doRestart} style={{...mkBtn("#06b6d4","#0d0d1a"),width:"100%",marginTop:4}}>{t("startReading")}</button>
            </div>
          );
        })()}

        {/* ── READING SLIDER (F3b) ───────────────────────────── */}
        {stage==="slider"&&currentUser&&(function(){
          var current=sliderCards[sliderIdx];
          var answered=sliderAnswers[sliderIdx]!==undefined;
          var pickedIdx=answered?sliderAnswers[sliderIdx]:null;
          var correctIdx=current?current.question.answer:null;
          var isCorrect=answered&&pickedIdx===correctIdx;
          var progressLabel=(sliderIdx+1)+" / "+Math.max(sliderCards.length,sliderIdx+1);
          // Session summary stats — only meaningful when ≥1 card was answered.
          var ansCount=Object.keys(sliderAnswers).length;
          var correctCount=Object.keys(sliderAnswers).reduce(function(s,k){
            var card=sliderCards[Number(k)];
            return s+(card&&card.question.answer===sliderAnswers[k]?1:0);
          },0);
          var accuracyPct=ansCount>0?Math.round((correctCount/ansCount)*100):0;
          return(
            <>
              <style>{`
                .sl-wrap{position:fixed;top:0;left:0;right:0;bottom:0;background:#0d0d1a;z-index:60;display:flex;flex-direction:column;overflow:hidden}
                .sl-topbar{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(13,13,26,0.85);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0}
                .sl-back{background:none;border:none;color:rgba(227,224,244,0.7);cursor:pointer;padding:6px 10px;border-radius:10px;display:flex;align-items:center;gap:4px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600}
                .sl-back:hover{background:rgba(255,255,255,0.06)}
                .sl-title{flex:1;text-align:center;font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#f472b6;letter-spacing:0.04em}
                .sl-progress{font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(227,224,244,0.55);font-weight:700}
                .sl-card{flex:1;display:flex;flex-direction:column;padding:24px 22px 16px;overflow-y:auto;animation:slFade 0.25s ease}
                @keyframes slFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                .sl-topic{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:#f472b6;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:14px}
                .sl-passage{font-family:'Newsreader','Inter',serif;font-size:19px;line-height:1.65;color:rgba(227,224,244,0.93);margin:0 0 22px;letter-spacing:0.005em}
                .sl-question{font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:#e3e0f4;line-height:1.4;margin:0 0 14px}
                .sl-opts{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
                .sl-opt{display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:13px 14px;text-align:left;cursor:pointer;color:rgba(227,224,244,0.85);font-family:'Inter',sans-serif;font-size:14px;line-height:1.4;transition:all 0.15s}
                .sl-opt:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.18)}
                .sl-opt.is-right{background:rgba(52,211,153,0.14);border-color:rgba(52,211,153,0.55);color:#5af0b3}
                .sl-opt.is-wrong{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.5);color:#fca5a5}
                .sl-opt:disabled{cursor:default}
                .sl-opt-letter{flex-shrink:0;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:800;color:rgba(227,224,244,0.6)}
                .sl-opt.is-right .sl-opt-letter{background:rgba(52,211,153,0.3);color:#5af0b3}
                .sl-opt.is-wrong .sl-opt-letter{background:rgba(239,68,68,0.3);color:#fca5a5}
                .sl-explain{background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:11px 14px;font-family:'Inter',sans-serif;font-size:12px;color:#c4b5fd;line-height:1.55;margin-bottom:14px}
                .sl-explain b{color:#a78bfa;font-weight:700;text-transform:uppercase;font-size:10px;letterSpacing:0.08em;margin-right:6px}
                .sl-nav{display:flex;gap:8px;flex-shrink:0;padding:8px 22px 18px}
                .sl-nav-btn{flex:1;padding:13px 18px;border:none;border-radius:14px;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.15s}
                .sl-nav-next{background:linear-gradient(135deg,#f472b6,#a78bfa);color:#0d0d1a}
                .sl-nav-next:active{transform:translateY(2px)}
                .sl-nav-next:disabled{opacity:0.4;cursor:not-allowed}
                .sl-skel{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;color:rgba(227,224,244,0.5);font-family:'Inter',sans-serif;font-size:14px;gap:14px}
                .sl-spin{width:32px;height:32px;border-radius:50%;border:2px solid rgba(244,114,182,0.25);border-top-color:#f472b6;animation:slSpin 0.8s linear infinite}
                @keyframes slSpin{to{transform:rotate(360deg)}}
                .sl-end{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:40px 24px;text-align:center;gap:14px}
                .sl-end-icon{font-size:54px;line-height:1}
                .sl-end-h{font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;color:#f472b6;margin:0}
                .sl-end-p{font-family:'Inter',sans-serif;font-size:13px;color:rgba(227,224,244,0.65);line-height:1.55;max-width:320px;margin:0}
                .sl-end-btn{margin-top:10px;background:rgba(244,114,182,0.18);border:1px solid rgba(244,114,182,0.4);color:#f472b6;padding:11px 22px;border-radius:14px;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer}
              `}</style>
              <div className="sl-wrap">
                <header className="sl-topbar">
                  <button type="button" className="sl-back" onClick={function(){
                    // Show summary if the user has answered ≥1 card; otherwise
                    // exit straight to home (no point celebrating zero work).
                    if(ansCount>0&&!sliderEnded){setSliderEnded(true);return;}
                    setStage("home");
                  }} aria-label={t("slider_exit")}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                    {t("slider_exit")}
                  </button>
                  <div className="sl-title">🪄 Slider · {level||"B1"}</div>
                  <span className="sl-progress">{progressLabel}</span>
                </header>

                {sliderEnded&&(
                  <div className="sl-end">
                    <div className="sl-end-icon">{accuracyPct>=80?"🌟":accuracyPct>=60?"🎯":"📖"}</div>
                    <h2 className="sl-end-h">{t("slider_summary_title")}</h2>
                    <p className="sl-end-p">{t("slider_summary_body")}</p>
                    <div style={{display:"flex",gap:14,marginTop:8}}>
                      <div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:"#f472b6",fontFamily:"'Outfit',sans-serif"}}>{ansCount}</div><div style={{fontSize:10,color:"rgba(227,224,244,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,marginTop:2}}>{t("slider_summary_cards")}</div></div>
                      <div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:"#5af0b3",fontFamily:"'Outfit',sans-serif"}}>{correctCount}</div><div style={{fontSize:10,color:"rgba(227,224,244,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,marginTop:2}}>{t("slider_summary_correct")}</div></div>
                      <div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:"#a78bfa",fontFamily:"'Outfit',sans-serif"}}>{accuracyPct}%</div><div style={{fontSize:10,color:"rgba(227,224,244,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:700,marginTop:2}}>{t("slider_summary_accuracy")}</div></div>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:10}}>
                      {!sliderCapHit&&<button className="sl-end-btn" onClick={startSliderSession}>{t("slider_summary_new")}</button>}
                      <button className="sl-end-btn" onClick={function(){setStage("home");}} style={{background:"rgba(255,255,255,0.04)",borderColor:"rgba(255,255,255,0.12)",color:"rgba(227,224,244,0.8)"}}>{t("slider_back_home")}</button>
                    </div>
                  </div>
                )}

                {!sliderEnded&&sliderError&&!current&&(
                  <div className="sl-end">
                    <div className="sl-end-icon">⚠️</div>
                    <h2 className="sl-end-h">{t("slider_err_title")}</h2>
                    <p className="sl-end-p">{sliderError}</p>
                    <button className="sl-end-btn" onClick={startSliderSession}>{t("slider_err_retry")}</button>
                  </div>
                )}

                {!sliderEnded&&sliderCapHit&&!current&&(
                  <div className="sl-end">
                    <div className="sl-end-icon">🌙</div>
                    <h2 className="sl-end-h">{t("slider_cap_title")}</h2>
                    <p className="sl-end-p">{t("slider_cap_body")}</p>
                    <button className="sl-end-btn" onClick={function(){setStage("home");}}>{t("slider_back_home")}</button>
                  </div>
                )}

                {!sliderEnded&&sliderLoading&&!current&&!sliderCapHit&&!sliderError&&(
                  <div className="sl-skel">
                    <div className="sl-spin"/>
                    <div>{t("slider_loading_first")}</div>
                  </div>
                )}

                {!sliderEnded&&current&&(
                  <div className="sl-card" key={sliderIdx}>
                    {current.topic&&<div className="sl-topic">{current.topic}</div>}
                    <p className="sl-passage">{current.passage}</p>
                    <p className="sl-question">{current.question.q}</p>
                    <div className="sl-opts">
                      {current.question.options.map(function(opt,i){
                        var cls="sl-opt";
                        if(answered){
                          if(i===correctIdx)cls+=" is-right";
                          else if(i===pickedIdx)cls+=" is-wrong";
                        }
                        return(
                          <button key={i} type="button" className={cls} disabled={answered} onClick={function(){pickSliderAnswer(sliderIdx,i);}}>
                            <span className="sl-opt-letter">{String.fromCharCode(65+i)}</span>
                            <span style={{flex:1}}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {answered&&current.question.explanation&&(
                      <div className="sl-explain">
                        <b>{isCorrect?t("slider_explain_right"):t("slider_explain_wrong")}</b>{current.question.explanation}
                      </div>
                    )}
                  </div>
                )}

                {!sliderEnded&&current&&answered&&(
                  <div className="sl-nav">
                    <button className="sl-nav-btn sl-nav-next" disabled={sliderIdx>=sliderCards.length-1&&!sliderLoading&&sliderCapHit&&false} onClick={function(){
                      var next=sliderIdx+1;
                      if(next>=sliderCards.length){
                        // Cap hit means no more cards are coming — show the
                        // summary instead of dead-ending the user.
                        if(sliderCapHit){setSliderEnded(true);return;}
                        // No card ready yet — kick off a fetch and stay put
                        ensureSliderAhead(sliderIdx);
                        return;
                      }
                      sliderStartRef.current[next]=Date.now();
                      setSliderIdx(next);
                    }}>
                      {sliderIdx>=sliderCards.length-1&&sliderCapHit?t("slider_finish"):t("slider_next")}
                    </button>
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* ── STORY LIBRARY ─────────────────────────────────── */}
        {stage==="library"&&currentUser&&(function(){
          var unlockedMap=getUnlockedStories(currentUser.games||[]);
          var levelOrder=["A1","A2","B1","B2","C1","C2"];
          var filtered=STORY_LIBRARY.filter(function(s){return libSubjectFilter===""||getSubjectKey(s)===libSubjectFilter;});
          var myClassLib=currentUser?classes.find(function(c){return (c.students||[]).indexOf(currentUser.name)!==-1;})||null:null;
          // Continue Reading: pick the most recent unlocked played story
          var games=currentUser.games||[];
          var lastPlayedStory=null;var lastPlayedPct=0;
          for(var gi=games.length-1;gi>=0;gi--){
            var g=games[gi];
            if(g.storyId){
              var st=STORY_LIBRARY.find(function(s){return s.id===g.storyId;});
              if(st){lastPlayedStory=st;lastPlayedPct=g.pct||0;break;}
            }
          }
          return(
            <>
              <style>{`
                .lq-lib-wrap{padding:0 0 96px;margin:-18px -20px -64px;padding:0 0 96px}
                @media(min-width:480px){.lq-lib-wrap{margin:-18px -20px -64px}}
                .lq-topbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(13,13,26,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05)}
                .lq-topbar-left{display:flex;align-items:center;gap:12px}
                .lq-icon-btn{background:none;border:none;color:#5af0b3;cursor:pointer;padding:6px;display:flex;align-items:center;border-radius:8px;transition:transform 0.15s,background 0.15s}
                .lq-icon-btn:hover{background:rgba(255,255,255,0.06)}
                .lq-icon-btn:active{transform:scale(0.92)}
                .lq-topbar-title{font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#e3e0f4;letter-spacing:-0.01em;margin:0}
                .lq-topbar-title .accent{color:#5af0b3}
                .lq-icon-btn-muted{color:rgba(227,224,244,0.55)}
                .lq-icon-btn-muted:hover{color:#5af0b3}
                .lq-content{padding:18px 16px 0}
                .lq-search-row{margin-bottom:18px}
                .lq-search-wrap{position:relative;background:rgba(30,30,44,0.6);border:1px solid rgba(255,255,255,0.10);border-radius:14px;overflow:hidden;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
                .lq-search-wrap>svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(227,224,244,0.45);pointer-events:none}
                .lq-search-input{width:100%;background:transparent;border:none;outline:none;color:#e3e0f4;font-family:'Inter',sans-serif;font-size:14px;padding:13px 16px 13px 42px;box-sizing:border-box}
                .lq-search-input::placeholder{color:rgba(227,224,244,0.4)}
                .lq-search-wrap:focus-within{border-color:rgba(52,211,153,0.55);box-shadow:0 0 0 3px rgba(52,211,153,0.12)}
                .lq-chips{display:flex;gap:8px;overflow-x:auto;padding:0 0 10px;margin-bottom:18px;scrollbar-width:none}
                .lq-chips::-webkit-scrollbar{display:none}
                .lq-chip{white-space:nowrap;padding:8px 16px;border-radius:999px;border:1px solid rgba(255,255,255,0.10);background:transparent;color:rgba(227,224,244,0.6);font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.02em;cursor:pointer;transition:all 0.2s;flex-shrink:0}
                .lq-chip:hover{background:rgba(255,255,255,0.05);border-color:rgba(52,211,153,0.5)}
                .lq-chip.is-active{background:#5af0b3;color:#003825;border-color:#5af0b3;box-shadow:0 0 18px rgba(52,211,153,0.32)}
                .lq-section-h{display:flex;align-items:center;gap:10px;margin:0 0 14px;font-family:'Outfit',sans-serif;font-size:18px;font-weight:700;color:#e3e0f4}
                .lq-section-h .ico{color:#5af0b3;font-size:22px;line-height:1}
                .lq-hero{position:relative;display:flex;gap:14px;padding:14px;background:rgba(30,30,44,0.45);border:1px solid rgba(255,255,255,0.08);border-radius:24px;margin-bottom:24px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);overflow:hidden;cursor:pointer;transition:transform 0.2s}
                .lq-hero::before,.lq-hero::after{content:"";position:absolute;width:200px;height:200px;border-radius:50%;filter:blur(80px);pointer-events:none}
                .lq-hero::before{top:-60px;left:-60px;background:rgba(52,211,153,0.10)}
                .lq-hero::after{bottom:-60px;right:-60px;background:rgba(99,102,241,0.10)}
                .lq-hero:active{transform:scale(0.99)}
                .lq-hero-cover{position:relative;z-index:1;width:96px;height:128px;border-radius:14px;overflow:hidden;flex-shrink:0;background:rgba(0,0,0,0.4);box-shadow:0 12px 28px -8px rgba(0,0,0,0.7)}
                .lq-hero-cover img{width:100%;height:100%;object-fit:cover}
                .lq-hero-meta{position:relative;z-index:1;flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;padding:2px 0}
                .lq-pill-mission{display:inline-block;padding:3px 10px;background:rgba(52,211,153,0.18);color:#5af0b3;font-family:'Outfit',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;border-radius:999px;border:1px solid rgba(52,211,153,0.3);margin-bottom:8px;align-self:flex-start}
                .lq-hero-title{font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;color:#e3e0f4;margin:0 0 4px;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
                .lq-hero-sub{font-family:'Inter',sans-serif;font-size:12px;color:rgba(227,224,244,0.6);margin:0 0 8px;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
                .lq-hero-prog{margin-top:auto}
                .lq-hero-prog-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
                .lq-hero-prog-label{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:#5af0b3;letter-spacing:0.04em}
                .lq-hero-prog-pct{font-family:'Inter',sans-serif;font-size:10px;color:rgba(227,224,244,0.5)}
                .lq-prog-track{height:6px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden}
                .lq-prog-fill{height:100%;background:linear-gradient(90deg,rgba(52,211,153,0.6),#5af0b3);border-radius:999px;box-shadow:0 0 10px rgba(52,211,153,0.5)}
                .lq-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
                .lq-card{cursor:pointer;transition:transform 0.2s ease}
                .lq-card.is-locked{cursor:default;opacity:0.5}
                .lq-card:not(.is-locked):active{transform:scale(0.98)}
                .lq-cover{position:relative;aspect-ratio:3/4.5;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#1a1a28,#0d0d1a);border:1px solid rgba(255,255,255,0.08);box-shadow:0 12px 24px -8px rgba(0,0,0,0.7);margin-bottom:10px;transition:transform 0.3s,box-shadow 0.3s}
                .lq-card:not(.is-locked):hover .lq-cover{transform:translateY(-2px);box-shadow:0 20px 32px -10px rgba(0,0,0,0.8),0 0 16px rgba(52,211,153,0.08)}
                .lq-cover img{width:100%;height:100%;object-fit:cover}
                .lq-cover .fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:40px;background:linear-gradient(135deg,#1a1a28,#0d0d1a)}
                .lq-cover .cover-grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(13,13,26,0.85) 0%,transparent 50%);pointer-events:none}
                .lq-cover .lvl-tag{position:absolute;top:8px;right:8px;padding:3px 8px;border-radius:8px;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.10);font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase}
                .lq-cover .lock-tag{position:absolute;top:8px;left:8px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:8px;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:rgba(227,224,244,0.7);font-size:11px}
                .lq-cover .assigned-tag{position:absolute;top:8px;left:8px;padding:3px 8px;border-radius:8px;background:rgba(245,158,11,0.85);font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:#0d0d1a;letter-spacing:0.06em}
                .lq-card-title{font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#e3e0f4;margin:0 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color 0.2s}
                .lq-card:not(.is-locked):hover .lq-card-title{color:#5af0b3}
                .lq-card.is-locked .lq-card-title{color:rgba(227,224,244,0.4)}
                .lq-card-sub{font-family:'Inter',sans-serif;font-size:11px;color:rgba(227,224,244,0.5);margin:0 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .lq-card-foot{display:flex;align-items:center;gap:8px}
                .lq-card-foot .track{flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden}
                .lq-card-foot .fill{height:100%;background:#5af0b3;border-radius:999px;box-shadow:0 0 8px rgba(52,211,153,0.5)}
                .lq-card-foot .pct{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:rgba(227,224,244,0.55);letter-spacing:0.04em}
                .lq-card-foot .new{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:#5af0b3;letter-spacing:0.16em;text-transform:uppercase}
                .lq-card-foot .done{color:#5af0b3;font-size:14px}
                .lq-empty{text-align:center;padding:48px 24px;color:rgba(227,224,244,0.4);font-family:'Inter',sans-serif;font-size:13px}
                .lq-fab{position:fixed;bottom:96px;right:18px;width:56px;height:56px;border-radius:999px;background:#5af0b3;color:#003825;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(52,211,153,0.4),0 0 20px rgba(52,211,153,0.25);z-index:40;transition:transform 0.2s}
                .lq-fab:active{transform:scale(0.92)}
                .lq-bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;z-index:50;display:flex;justify-content:space-around;align-items:center;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:rgba(30,30,44,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-top:1px solid rgba(255,255,255,0.08);border-radius:24px 24px 0 0;box-shadow:0 -8px 32px rgba(0,0,0,0.6)}
                .lq-nav-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:6px 14px;color:rgba(227,224,244,0.5);font-family:'Inter',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;position:relative;transition:color 0.15s}
                .lq-nav-btn:hover{color:#e3e0f4}
                .lq-nav-btn .ico{font-size:22px;line-height:1}
                .lq-nav-btn.is-active{color:#5af0b3}
                .lq-nav-btn.is-active::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:6px;height:6px;border-radius:999px;background:#5af0b3;box-shadow:0 0 8px rgba(52,211,153,0.9)}
              `}</style>
              <div className="lq-lib-wrap">
                <header className="lq-topbar">
                  <div className="lq-topbar-left">
                    <button type="button" onClick={function(){setStage("home");}} className="lq-icon-btn" aria-label="Back">
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                    </button>
                    <h1 className="lq-topbar-title">Reading <span className="accent">Quest</span></h1>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button type="button" onClick={function(){var langs=["en","uz","ru","tr","ar","de","es","fr"];var i=langs.indexOf(uiLang);var nx=langs[(i+1)%langs.length];setUiLang(nx);try{localStorage.setItem("rq-uilang",nx);}catch(e){}}} className="lq-icon-btn lq-icon-btn-muted" aria-label="Language">
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>
                    </button>
                  </div>
                </header>

                <div className="lq-content">
                  <div className="lq-search-row">
                    <div className="lq-search-wrap">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input className="lq-search-input" type="text" placeholder="Search for your next adventure..." value={librarySearch||""} onChange={function(e){setLibrarySearch(e.target.value);}}/>
                    </div>
                  </div>

                  <div className="lq-chips">
                    {["","life","science","tech","mind","humanities"].map(function(key){
                      var label=key?SUBJECT_LABELS[key]:t("allTopics");
                      var active=libSubjectFilter===key;
                      return(<button key={key||"all"} type="button" onClick={function(){setLibSubjectFilter(key);}} className={"lq-chip"+(active?" is-active":"")}>{label}</button>);
                    })}
                  </div>

                  {lastPlayedStory&&libSubjectFilter===""&&!librarySearch&&(function(){
                    var lo=getLv(lastPlayedStory.level);
                    return(
                      <section style={{marginBottom:24}}>
                        <h2 className="lq-section-h"><span className="ico">📖</span>Continue Reading</h2>
                        <div className="lq-hero" onClick={function(){startStoryFromLibrary(lastPlayedStory);}}>
                          <div className="lq-hero-cover">
                            <img src={"/assets/covers/"+lastPlayedStory.id+".svg"} alt={lastPlayedStory.title} onError={function(e){e.target.style.display="none";}}/>
                          </div>
                          <div className="lq-hero-meta">
                            <span className="lq-pill-mission" style={{background:"rgba("+hex2rgb(lo.color)+",0.18)",color:lo.color,borderColor:"rgba("+hex2rgb(lo.color)+",0.3)"}}>{lastPlayedStory.level} · Active</span>
                            <h3 className="lq-hero-title">{lastPlayedStory.title}</h3>
                            <p className="lq-hero-sub">{lastPlayedStory.topic} · {lastPlayedStory.questions.length} questions</p>
                            <div className="lq-hero-prog">
                              <div className="lq-hero-prog-row">
                                <span className="lq-hero-prog-label">▲ {lastPlayedPct}% Last Score</span>
                                <span className="lq-hero-prog-pct">Tap to replay</span>
                              </div>
                              <div className="lq-prog-track"><div className="lq-prog-fill" style={{width:lastPlayedPct+"%"}}/></div>
                            </div>
                          </div>
                        </div>
                      </section>
                    );
                  })()}

                  <section>
                    <h2 className="lq-section-h"><span className="ico">✦</span>{t("storyLibrary")}</h2>
                    <div className="lq-grid">
                      {filtered.filter(function(s){if(!librarySearch)return true;var q=librarySearch.toLowerCase();return s.title.toLowerCase().indexOf(q)!==-1||s.topic.toLowerCase().indexOf(q)!==-1;}).map(function(story){
                        var isUnlocked=!!unlockedMap[story.id];
                        var lo=getLv(story.level);
                        var isAssigned=myClassLib?assignments.some(function(a){return a.classId===myClassLib.id&&a.storyId===story.id&&(!a.completions||!a.completions[currentUser.name]);}):false;
                        var subjKey=getSubjectKey(story);
                        var playedGames=games.filter(function(g){return g.storyId===story.id;});
                        var bestPct=playedGames.length?Math.max.apply(null,playedGames.map(function(g){return g.pct||0;})):0;
                        var isNew=isUnlocked&&!playedGames.length;
                        var isDone=isUnlocked&&bestPct>=80;
                        return(
                          <div key={story.id} className={"lq-card"+(isUnlocked?"":" is-locked")} onClick={isUnlocked?function(){startStoryFromLibrary(story);}:undefined}>
                            <div className="lq-cover">
                              <img src={"/assets/covers/"+story.id+".svg"} alt={story.title} onError={function(e){e.target.style.display="none";var fb=e.target.nextElementSibling;if(fb)fb.style.display="flex";}}/>
                              <div className="fallback" style={{display:"none"}}>{isUnlocked?(({A1:"📗",A2:"📘",B1:"📙",B2:"📒",C1:"📕",C2:"📓"})[story.level]||"📖"):"🔒"}</div>
                              <div className="cover-grad"/>
                              {isAssigned?<div className="assigned-tag">📋 ASSIGNED</div>:(!isUnlocked&&<div className="lock-tag">🔒</div>)}
                              <div className="lvl-tag" style={{color:lo.color,borderColor:"rgba("+hex2rgb(lo.color)+",0.4)"}}>{story.level} · {SUBJECT_LABELS[subjKey]}</div>
                            </div>
                            <h3 className="lq-card-title">{story.title}</h3>
                            <p className="lq-card-sub">{story.topic}</p>
                            <div className="lq-card-foot">
                              {!isUnlocked?(
                                <span className="pct" style={{color:"rgba(227,224,244,0.4)"}}>Locked</span>
                              ):isNew?(
                                <><div className="track"><div className="fill" style={{width:"0%"}}/></div><span className="new">New</span></>
                              ):isDone?(
                                <><div className="track"><div className="fill" style={{width:"100%"}}/></div><span className="done">✓</span></>
                              ):(
                                <><div className="track"><div className="fill" style={{width:bestPct+"%"}}/></div><span className="pct">{bestPct}%</span></>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {filtered.filter(function(s){if(!librarySearch)return true;var q=librarySearch.toLowerCase();return s.title.toLowerCase().indexOf(q)!==-1||s.topic.toLowerCase().indexOf(q)!==-1;}).length===0&&(
                      <div className="lq-empty">No stories match your filters.</div>
                    )}
                  </section>
                </div>

                <nav className="lq-bottom-nav">
                  <button type="button" onClick={function(){setStage("home");}} className="lq-nav-btn">
                    <span className="ico">🏠</span><span>{t("home").toUpperCase()}</span>
                  </button>
                  <button type="button" className="lq-nav-btn is-active">
                    <span className="ico">📚</span><span>{t("library").toUpperCase()}</span>
                  </button>
                  <button type="button" onClick={function(){setStage("analytics");}} className="lq-nav-btn">
                    <span className="ico">📊</span><span>{t("stats").toUpperCase()}</span>
                  </button>
                  <button type="button" onClick={function(){setStage("profile");}} className="lq-nav-btn">
                    <span className="ico">👤</span><span>{t("profile").toUpperCase()}</span>
                  </button>
                </nav>
              </div>
            </>
          );
        })()}

        {/* ── BADGES ────────────────────────────────────────── */}
        {stage==="badges"&&currentUser&&(function(){
          var myBadges=checkBadges(currentUser,vocab,myStreak);
          var earnedCount=BADGES.filter(function(b){return myBadges[b.id];}).length;
          return(
            <div>
              <header className="lq-sub-topbar">
                <button type="button" className="lq-sub-back" onClick={function(){setStage("profile");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#fbbf24"}}>🏅</span> Badges</h1>
                <div style={{width:38}}/>
              </header>
              <p style={{color:"rgba(227,224,244,0.5)",fontSize:13,marginBottom:14,textAlign:"center"}}>{earnedCount} of {BADGES.length} earned</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {BADGES.map(function(b){
                  var earned=!!myBadges[b.id];
                  return(
                    <div key={b.id} style={{...CARD,padding:14,display:"flex",gap:10,alignItems:"flex-start",opacity:earned?1:0.45,border:"1px solid "+(earned?"rgba(251,191,36,0.35)":"rgba(255,255,255,0.08)"),background:earned?"rgba(251,191,36,0.06)":"rgba(255,255,255,0.03)"}}>
                      <span style={{fontSize:26,flexShrink:0,filter:earned?"none":"grayscale(1)"}}>{b.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:earned?"#fbbf24":"#6b7280",marginBottom:2}}>{badgeName(b.id)}</div>
                        <div style={{fontSize:11,color:"#4b5563",lineHeight:1.4}}>{badgeDesc(b.id)}</div>
                        {earned&&<div style={{fontSize:10,color:"#22c55e",marginTop:4,fontWeight:700}}>✓ Unlocked</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={doRestart} style={{...mkBtn("#fbbf24","#0d0d1a"),width:"100%",marginTop:14}}>Keep Playing to Unlock More</button>
            </div>
          );
        })()}

        {/* ── VOCAB GAME ────────────────────────────────────── */}
        {stage==="vocabgame"&&currentUser&&(function(){
          var gameWords=vocab.filter(function(w){return w.status!=="known";});
          if(!gameWords.length)gameWords=vocab.slice();
          if(!gameWords.length)return(<div style={{textAlign:"center",paddingTop:60}}><p style={{color:"#6b7280"}}>Save some words to your notebook first!</p><button onClick={function(){setStage("vocab");}} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:16}}>Go to Vocab</button></div>);

          if(!vocabGameMode)return(
            <div>
              <header className="lq-sub-topbar">
                <button type="button" className="lq-sub-back" onClick={function(){setStage("vocab");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#a78bfa"}}>🎮</span> {t("vocabPractice")}</h1>
                <div style={{width:38}}/>
              </header>
              <p style={{color:"rgba(227,224,244,0.5)",fontSize:13,marginBottom:16,textAlign:"center"}}>{gameWords.length} words to practice</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[{m:"flashcard",icon:"🃏",name:"Flashcards",desc:"Flip to reveal the meaning"},{m:"mcq",icon:"🎯",name:"Word Quiz",desc:"Pick the correct definition"},{m:"blank",icon:"✏️",name:"Fill the Blank",desc:"Complete the sentence"}].map(function(item){
                  return(
                    <button key={item.m} onClick={function(){setVocabGameMode(item.m);setVocabGameIdx(0);setVocabGameScore(0);setVocabGameAnswered(null);}} style={{...CARD,border:"1px solid rgba(167,139,250,0.25)",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:14,padding:16}}>
                      <span style={{fontSize:30}}>{item.icon}</span>
                      <div><div style={{fontSize:15,fontWeight:700,color:"#f3f4f6",marginBottom:2}}>{item.name}</div><div style={{fontSize:12,color:"#6b7280"}}>{item.desc}</div></div>
                    </button>
                  );
                })}
              </div>
            </div>
          );

          // Stable shuffles per session: only re-randomize when the pool of
          // game words changes (e.g. on mode-switch with new vocab).
          var vgCache=vocabGameCacheRef.current;
          var vgKey=(vocabGameMode||"")+":"+gameWords.length+":"+gameWords.map(function(w){return w.word;}).join(",");
          if(vgCache.key!==vgKey){vgCache.key=vgKey;vgCache.shuffled=gameWords.slice().sort(function(){return Math.random()-0.5;});vgCache.options={};vgCache.bOptions={};}
          var shuffled=vgCache.shuffled;
          var curW=shuffled[vocabGameIdx%shuffled.length];
          var isDone=vocabGameIdx>=shuffled.length;
          if(isDone)return(
            <div style={{textAlign:"center",paddingTop:40}}>
              <div style={{fontSize:50,marginBottom:10}}>🎉</div>
              <h2 style={{fontSize:22,fontWeight:900,color:"#a78bfa",marginBottom:6}}>{t("practiceComplete")}</h2>
              <p style={{color:"#9ca3af",marginBottom:20}}>Score: {vocabGameScore} / {shuffled.length}</p>
              <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={function(){setVocabGameMode(null);setVocabGameIdx(0);setVocabGameScore(0);setVocabGameAnswered(null);}} style={mkBtn("#a78bfa","#0d0d1a")}>Play Again</button>
                <button onClick={function(){setStage("vocab");}} style={mkBtn("#374151")}>Back to Vocab</button>
              </div>
            </div>
          );

          if(vocabGameMode==="flashcard")return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>Flashcards</h2>
                <span style={{fontSize:12,color:"#6b7280"}}>{vocabGameIdx+1}/{shuffled.length}</span>
              </div>
              <div onClick={function(){setVocabFlipped(function(f){return!f;});}} style={{...CARD,minHeight:180,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:14,background:vocabFlipped?"rgba(167,139,250,0.1)":"rgba(255,255,255,0.04)",borderColor:vocabFlipped?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.1)",transition:"all 0.3s"}}>
                <div style={{textAlign:"center"}}>
                  {!vocabFlipped?<><div style={{fontSize:26,fontWeight:900,color:"#f3f4f6",marginBottom:8}}>{curW.word}</div><div style={{fontSize:12,color:"#6b7280"}}>Tap to reveal</div></>
                  :<><div style={{fontSize:22,fontWeight:700,color:"#a78bfa",marginBottom:4}}>{curW.word}</div><div style={{fontSize:13,color:"#d1d5db",lineHeight:1.6,maxWidth:280}}>{curW.def||"No definition saved."}</div><div style={{fontSize:11,color:"#6b7280",marginTop:8}}>{curW.level} · {curW.topic}</div></>}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){setVocabFlipped(false);setVocabGameIdx(function(i){return i+1;});}} style={{...mkBtn("#374151"),flex:1}}>Next →</button>
              </div>
            </div>
          );

          if(vocabGameMode==="mcq"){
            if(!vgCache.options[vocabGameIdx]){
              var distractors=gameWords.filter(function(w){return w.word!==curW.word;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
              vgCache.options[vocabGameIdx]=[curW].concat(distractors).sort(function(){return Math.random()-0.5;});
            }
            var options=vgCache.options[vocabGameIdx];
            var correctIdx=options.indexOf(curW);
            return(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                  <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>Word Quiz</h2>
                  <span style={{fontSize:12,color:"#6b7280"}}>{vocabGameIdx+1}/{shuffled.length} · {vocabGameScore} pts</span>
                </div>
                <div style={{...CARD,marginBottom:14,textAlign:"center",padding:20}}>
                  <p style={{fontSize:11,color:"#6b7280",marginBottom:6}}>Which word matches this definition?</p>
                  <p style={{fontSize:15,color:"#e5e7eb",lineHeight:1.7,margin:0}}>{curW.def||"A word saved from your reading."}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                  {options.map(function(opt,oi){
                    var isCorrect=oi===correctIdx;
                    var isSelected=vocabGameAnswered===oi;
                    var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
                    if(vocabGameAnswered!==null){if(isCorrect){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSelected){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
                    else if(isSelected){bg="rgba(167,139,250,0.2)";bd="1px solid #a78bfa";col="#a78bfa";}
                    return<button key={oi} disabled={vocabGameAnswered!==null} onClick={function(){setVocabGameAnswered(oi);if(isCorrect)setVocabGameScore(function(s){return s+1;});}} style={{background:bg,border:bd,borderRadius:10,padding:"11px 14px",color:col,fontSize:14,fontWeight:600,cursor:vocabGameAnswered!==null?"default":"pointer",fontFamily:"inherit",textAlign:"left"}}>{opt.word}</button>;
                  })}
                </div>
                {vocabGameAnswered!==null&&<button onClick={function(){setVocabGameAnswered(null);setVocabGameIdx(function(i){return i+1;});}} style={{...mkBtn("#a78bfa","#0d0d1a"),width:"100%"}}>Next →</button>}
              </div>
            );
          }

          if(vocabGameMode==="blank"){
            var sentence=(curW.example||"The word ___ is used in many contexts.").replace(new RegExp("\\b"+curW.word+"\\b","i"),"___");
            if(!vgCache.bOptions[vocabGameIdx]){
              var bDistractors=gameWords.filter(function(w){return w.word!==curW.word;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
              vgCache.bOptions[vocabGameIdx]=[curW].concat(bDistractors).sort(function(){return Math.random()-0.5;});
            }
            var bOptions=vgCache.bOptions[vocabGameIdx];
            var bCorrect=bOptions.indexOf(curW);
            return(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                  <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>Fill the Blank</h2>
                  <span style={{fontSize:12,color:"#6b7280"}}>{vocabGameIdx+1}/{shuffled.length} · {vocabGameScore} pts</span>
                </div>
                <div style={{...CARD,marginBottom:14,padding:16}}>
                  <p style={{fontSize:16,color:"#e5e7eb",lineHeight:1.9,margin:0}}>{sentence.split("___")[0]}<span style={{display:"inline-block",minWidth:80,borderBottom:"2px solid #a78bfa",textAlign:"center",color:"#a78bfa",fontWeight:700}}>{vocabGameAnswered!==null?bOptions[vocabGameAnswered].word:"_____"}</span>{sentence.split("___")[1]||""}</p>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                  {bOptions.map(function(opt,oi){
                    var isCorrect=oi===bCorrect;
                    var isSelected=vocabGameAnswered===oi;
                    var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
                    if(vocabGameAnswered!==null){if(isCorrect){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSelected){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
                    return<button key={oi} disabled={vocabGameAnswered!==null} onClick={function(){setVocabGameAnswered(oi);if(isCorrect)setVocabGameScore(function(s){return s+1;});}} style={{background:bg,border:bd,borderRadius:8,padding:"8px 14px",color:col,fontSize:13,fontWeight:600,cursor:vocabGameAnswered!==null?"default":"pointer",fontFamily:"inherit"}}>{opt.word}</button>;
                  })}
                </div>
                {vocabGameAnswered!==null&&<button onClick={function(){setVocabGameAnswered(null);setVocabGameIdx(function(i){return i+1;});}} style={{...mkBtn("#a78bfa","#0d0d1a"),width:"100%"}}>Next →</button>}
              </div>
            );
          }
          return null;
        })()}

        {/* ── WEEKLY BOARD ──────────────────────────────────── */}
        {stage==="weekly"&&currentUser&&(function(){
          var wk=getWeekId();
          var myEntry=weeklyLb.find(function(e){return e.name===currentUser.name;});
          var myPos=weeklyLb.findIndex(function(e){return e.name===currentUser.name;});
          var weekGames=(currentUser.games||[]).filter(function(g){
            var d=new Date(g.date);var dayOfYear=Math.floor((d-new Date(d.getFullYear(),0,0))/(864e5));
            var gameWk=d.getFullYear()+"-W"+Math.ceil(dayOfYear/7);
            return gameWk===wk;
          });
          var weekXp=weekGames.reduce(function(s,g){return s+g.xp;},0);
          var goalMet=weekGames.length>=3;
          return(
            <div>
              <header className="lq-sub-topbar">
                <button type="button" className="lq-sub-back" onClick={function(){setStage("home");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#a78bfa"}}>📅</span> {t("weeklyBoard")}</h1>
                <div style={{width:38}}/>
              </header>
              <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(167,139,250,0.3)",background:"rgba(167,139,250,0.05)"}}>
                <p style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:0.5,margin:"0 0 8px"}}>{t("thisWeek")}</p>
                <div style={{display:"flex",gap:10}}>
                  <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 6px"}}>
                    <div style={{fontSize:18,fontWeight:900,color:"#a78bfa"}}>{weekXp}</div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>XP earned</div>
                  </div>
                  <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 6px"}}>
                    <div style={{fontSize:18,fontWeight:900,color:"#34d399"}}>{weekGames.length}</div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>stories read</div>
                  </div>
                  <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 6px"}}>
                    <div style={{fontSize:18,fontWeight:900,color:"#fbbf24"}}>#{myPos>=0?myPos+1:"–"}</div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>rank</div>
                  </div>
                </div>
                <div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:goalMet?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.04)",border:"1px solid "+(goalMet?"rgba(52,211,153,0.4)":"rgba(255,255,255,0.1)")}}>
                  <span style={{fontSize:12,color:goalMet?"#34d399":"#9ca3af",fontWeight:600}}>{goalMet?"✓ Weekly goal complete! 3+ stories read":"Weekly goal: read 3 stories · "+weekGames.length+"/3 done"}</span>
                </div>
              </div>
              <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:0.5,marginBottom:8}}>{t("leaderboardLabel")}</p>
              {weeklyLb.length===0&&<p style={{color:"#6b7280",fontSize:13,textAlign:"center",padding:20}}>{t("noDataYet")}</p>}
              {weeklyLb.slice(0,20).map(function(e,i){
                var isMe=e.name===currentUser.name;
                var medals=["🥇","🥈","🥉"];
                return(
                  <div key={i} className="rq-lb-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:5,background:isMe?"rgba(167,139,250,0.1)":"rgba(255,255,255,0.03)",border:isMe?"1px solid rgba(167,139,250,0.3)":"1px solid transparent"}}>
                    <span style={{width:24,fontSize:i<3?16:12,textAlign:"center",color:"#fbbf24",fontWeight:700}}>{i<3?medals[i]:i+1}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"#a78bfa":"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>{e.xp} XP</span>
                    <span style={{fontSize:11,color:"#6b7280"}}>{e.games} {e.games===1?"story":"stories"}</span>
                  </div>
                );
              })}
              <button onClick={doRestart} style={{...mkBtn("#a78bfa","#0d0d1a"),width:"100%",marginTop:10}}>{t("readAStory")}</button>
            </div>
          );
        })()}

        {/* ── AI TUTOR ──────────────────────────────────────── */}
        {stage==="tutor"&&currentUser&&(
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 80px)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:10,flexShrink:0}}>
              <div>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#0891b2"}}>{t("aiTutor")}</h2>
                <p style={{margin:0,fontSize:11,color:"#6b7280"}}>{level} · {topic}</p>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={function(){setStage("result");}} style={GHOST}>{t("back")}</button>
                <button onClick={doRestart} style={{...GHOST,color:"#34d399",borderColor:"rgba(52,211,153,0.3)"}}>{t("homeLabel")}</button>
              </div>
            </div>

            {/* passage peek */}
            {passage&&(
              <div style={{...CARD,padding:"10px 14px",marginBottom:10,flexShrink:0}}>
                <button onClick={function(){setPassagePeekOpen(function(o){return!o;});}} style={{background:"none",border:"none",color:"#9ca3af",fontFamily:"inherit",fontSize:12,cursor:"pointer",fontWeight:600,padding:0,width:"100%",textAlign:"left"}}>
                  {passagePeekOpen?"▲ Hide passage":"▼ Show passage"}
                </button>
                {passagePeekOpen&&<div style={{margin:"8px 0 0",fontSize:13,color:"#d1d5db",lineHeight:1.8}}>{passage.split(/\n{2,}/).map(function(p,i){return<p key={i} style={{margin:i>0?"0.7em 0 0":0}}>{p}</p>;})}</div>}
              </div>
            )}

            {/* starter prompts */}
            {tutorChat.length===0&&(
              <div style={{marginBottom:10,flexShrink:0}}>
                <p style={{fontSize:11,color:"#6b7280",marginBottom:6}}>Try asking:</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {["What is the main idea?","Explain a difficult word","Why did I get a question wrong?","Give me a grammar tip from the passage","Summarise in simple English"].map(function(s){
                    return<button key={s} onClick={function(){sendTutorMessage(s);}} style={{background:"rgba(8,145,178,0.12)",border:"1px solid rgba(8,145,178,0.25)",color:"#67e8f9",borderRadius:999,padding:"5px 12px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{s}</button>;
                  })}
                </div>
              </div>
            )}

            {/* chat messages */}
            <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
              {tutorChat.map(function(m,i){
                var isUser=m.role==="user";
                return(
                  <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",background:isUser?"rgba(8,145,178,0.25)":"rgba(255,255,255,0.06)",border:"1px solid "+(isUser?"rgba(8,145,178,0.4)":"rgba(255,255,255,0.1)"),fontSize:13,color:"#f3f4f6",lineHeight:1.7,whiteSpace:"pre-wrap"}}>
                      {!isUser&&<div style={{fontSize:10,color:"#0891b2",fontWeight:700,marginBottom:4}}>🤖 TUTOR</div>}
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* input */}
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <input
                style={{...INP,flex:1,padding:"11px 14px",fontSize:14}}
                placeholder="Ask about the passage, vocabulary, grammar…"
                value={tutorInput}
                onChange={function(e){setTutorInput(e.target.value);}}
                onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendTutorMessage(tutorInput);}}}
              />
              <button onClick={function(){sendTutorMessage(tutorInput);}} disabled={!tutorInput.trim()} style={{...mkBtn(!tutorInput.trim()?"#374151":"#0891b2"),padding:"11px 18px",fontSize:14,flexShrink:0}}>{t("send")}</button>
            </div>
          </div>
        )}

        {/* ── WRITING FEEDBACK ──────────────────────────────── */}
        {stage==="writefeedback"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingTop:6}}>
              <button onClick={function(){setStage("result");}} style={GHOST}>← Back</button>
              <h2 style={{fontSize:18,fontWeight:900,color:"#fbbf24",margin:0}}>{t("writingChallenge")}</h2>
            </div>

            {!writeFeedback&&(
              <div>
                <div style={{...CARD,marginBottom:12,padding:14,background:"rgba(245,158,11,0.06)",borderColor:"rgba(245,158,11,0.25)"}}>
                  <p style={{fontSize:12,color:"#9ca3af",margin:"0 0 6px",fontWeight:700}}>PASSAGE TOPIC</p>
                  <p style={{fontSize:13,color:"#fbbf24",margin:0,fontWeight:600}}>{topic}</p>
                </div>
                <div style={{...CARD,marginBottom:12,padding:14}}>
                  <p style={{fontSize:12,color:"#9ca3af",margin:"0 0 10px",fontWeight:700}}>YOUR SUMMARY</p>
                  <p style={{fontSize:11,color:"#6b7280",margin:"0 0 10px"}}>Write 3–6 sentences summarising the main ideas of the passage in your own words.</p>
                  <textarea
                    style={{width:"100%",minHeight:130,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,padding:"10px 12px",fontSize:14,color:"#f3f4f6",fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.6}}
                    placeholder="The passage is about…"
                    value={writeSummary}
                    onChange={function(e){setWriteSummary(e.target.value);}}
                  />
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                    {(function(){var wc=writeSummary.trim().split(/\s+/).filter(Boolean).length;return(
                      <span style={{fontSize:11,color:wc>=20?"#34d399":"#6b7280"}}>{wc} words {wc<20?"(aim for 20+)":"✓"}</span>
                    );})()}
                    <button
                      onClick={function(){
                        if(!writeSummary.trim())return;
                        var feedback=scoreWrittenSummary(passage,writeSummary,level);
                        setWriteFeedback(feedback);
                      }}
                      disabled={writeSummary.trim().split(/\s+/).filter(Boolean).length<20}
                      style={{...mkBtn(writeSummary.trim().split(/\s+/).filter(Boolean).length<20?"#374151":"#f59e0b","#0d0d1a"),padding:"9px 20px",fontSize:13}}
                    >{t("getFeedback")}</button>
                  </div>
                </div>
              </div>
            )}

            {writeFeedback&&(function(){
              var scoreColor=function(s){return s>=80?"#34d399":s>=60?"#fbbf24":"#ef4444";};
              var dims=[{k:"content",label:"Content Accuracy",icon:"📖"},{k:"vocabulary",label:"Vocabulary",icon:"📝"},{k:"grammar",label:"Grammar",icon:"✔️"},{k:"structure",label:"Structure",icon:"🔗"}];
              return(
                <div>
                  {/* overall score */}
                  <div style={{...CARD,marginBottom:12,textAlign:"center",padding:20,background:"rgba(245,158,11,0.07)",borderColor:"rgba(245,158,11,0.35)"}}>
                    <div className="rq-glow-green" style={{fontSize:48,fontWeight:900,color:scoreColor(writeFeedback.overall||0),marginBottom:4}}>{writeFeedback.overall||0}%</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fbbf24",marginBottom:8}}>{t("overallWritingScore")}</div>
                    {writeFeedback.strengths&&<p style={{fontSize:13,color:"#34d399",margin:"0 0 4px"}}>💪 {writeFeedback.strengths}</p>}
                    {writeFeedback.improvements&&<p style={{fontSize:13,color:"#9ca3af",margin:0}}>💡 {writeFeedback.improvements}</p>}
                  </div>
                  {/* dimension scores */}
                  <div style={{...CARD,marginBottom:12,padding:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:"0 0 12px",letterSpacing:0.6}}>DETAILED SCORES</p>
                    {dims.map(function(d){
                      var sc=(writeFeedback.scores&&writeFeedback.scores[d.k])||0;
                      var fb=(writeFeedback.feedback&&writeFeedback.feedback[d.k])||"";
                      return(
                        <div key={d.k} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                            <span style={{fontSize:12,color:"#d1d5db",fontWeight:600}}>{d.icon} {d.label}</span>
                            <span style={{fontSize:13,fontWeight:900,color:scoreColor(sc)}}>{sc}%</span>
                          </div>
                          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:6,overflow:"hidden",marginBottom:5}}>
                            <div style={{height:"100%",width:sc+"%",background:scoreColor(sc),borderRadius:999,transition:"width 0.6s ease"}}/>
                          </div>
                          {fb&&<p style={{fontSize:11,color:"#9ca3af",margin:0,lineHeight:1.5}}>{fb}</p>}
                        </div>
                      );
                    })}
                  </div>
                  {/* your summary */}
                  <div style={{...CARD,marginBottom:12,padding:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:"0 0 8px",letterSpacing:0.6}}>YOUR SUMMARY</p>
                    <p style={{fontSize:13,color:"#d1d5db",margin:0,lineHeight:1.7,fontStyle:"italic"}}>"{writeSummary}"</p>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button onClick={function(){setWriteFeedback(null);setWriteSummary("");setWriteError("");}} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12}}>Try Again</button>
                    <button onClick={function(){setStage("result");}} style={{...mkBtn("#6366f1"),flex:1,fontSize:12}}>Back to Results</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── ERROR CORRECTION CHALLENGE ────────────────────── */}
        {stage==="errorcorrect"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingTop:6}}>
              <button onClick={function(){setStage("result");}} style={GHOST}>← Back</button>
              <h2 style={{fontSize:18,fontWeight:900,color:"#f87171",margin:0}}>🔍 Error Hunt</h2>
              {!ecRevealed&&ecData&&<span style={{marginLeft:"auto",fontSize:12,color:"#9ca3af"}}>{ecSelected.size}/5 selected</span>}
            </div>

            {/* loading */}
            {ecLoading&&(
              <div style={{...CARD,padding:40,textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:12}}>🔍</div>
                <div style={{fontSize:14,color:"#9ca3af"}}>Planting errors in the passage…</div>
              </div>
            )}

            {/* error state */}
            {ecError&&!ecLoading&&(
              <div style={{...CARD,padding:20}}>
                <ErrorBanner message={ecError}/>
                <button onClick={function(){setStage("result");}} style={{...mkBtn("#6366f1"),padding:"8px 20px",fontSize:13,width:"100%"}}>Back</button>
              </div>
            )}

            {/* game */}
            {ecData&&!ecLoading&&(function(){
              // tokenise corrupted passage into words keeping punctuation attached
              var tokens=ecData.passage.match(/\S+/g)||[];
              // build a lookup: stripped token → error index
              function strip(t){return t.replace(/[^a-zA-Z']/g,"").toLowerCase();}
              var errorMap={};
              (ecData.errors||[]).forEach(function(err,i){
                errorMap[strip(err.corrupted)]=i;
              });

              function toggleToken(idx){
                if(ecRevealed)return;
                setEcSelected(function(prev){
                  var next=new Set(prev);
                  if(next.has(idx))next.delete(idx);
                  else if(next.size<5)next.add(idx);
                  return next;
                });
              }

              // scoring after reveal
              var correctFinds=0,falsePositives=0;
              var tokenResults={};
              if(ecRevealed){
                ecSelected.forEach(function(idx){
                  var t=strip(tokens[idx]);
                  if(errorMap[t]!==undefined){tokenResults[idx]="correct";correctFinds++;}
                  else{tokenResults[idx]="false";falsePositives++;}
                });
                // find missed errors
                (ecData.errors||[]).forEach(function(err){
                  var found=false;
                  ecSelected.forEach(function(idx){if(strip(tokens[idx])===strip(err.corrupted))found=true;});
                  if(!found){
                    tokens.forEach(function(t,idx){if(strip(t)===strip(err.corrupted))tokenResults[idx]="missed";});
                  }
                });
              }

              var typeColor={spelling:"#f87171",grammar:"#fb923c",vocabulary:"#a78bfa",tense:"#38bdf8"};

              return(
                <div>
                  {/* instructions */}
                  {!ecRevealed&&<div style={{...CARD,marginBottom:12,padding:"10px 14px",background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.2)"}}>
                    <p style={{fontSize:12,color:"#fca5a5",margin:0}}>Tap up to 5 words you think are errors. Then press <strong>Check Answers</strong>.</p>
                  </div>}

                  {/* passage */}
                  <div style={{...CARD,marginBottom:12,padding:"16px 14px",lineHeight:2.2,fontSize:16,color:"#e5e7eb"}}>
                    {tokens.map(function(tok,idx){
                      var sel=ecSelected.has(idx);
                      var res=tokenResults[idx];
                      var bg=res==="correct"?"rgba(52,211,153,0.25)":res==="false"?"rgba(251,191,36,0.25)":res==="missed"?"rgba(239,68,68,0.25)":sel?"rgba(239,68,68,0.2)":"transparent";
                      var border=res==="correct"?"2px solid #34d399":res==="false"?"2px solid #fbbf24":res==="missed"?"2px dashed #ef4444":sel?"2px solid #f87171":"2px solid transparent";
                      var col=res==="correct"?"#34d399":res==="false"?"#fbbf24":res==="missed"?"#f87171":sel?"#fca5a5":"inherit";
                      return(
                        <span key={idx}>
                          <span
                            onClick={function(){toggleToken(idx);}}
                            style={{background:bg,border:border,borderRadius:4,padding:"1px 3px",color:col,cursor:ecRevealed?"default":"pointer",transition:"all 0.12s",display:"inline-block",userSelect:"none"}}
                          >{tok}</span>
                          {" "}
                        </span>
                      );
                    })}
                  </div>

                  {/* legend after reveal */}
                  {ecRevealed&&<div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12,fontSize:11}}>
                    <span><span style={{color:"#34d399"}}>■</span> Correct find</span>
                    <span><span style={{color:"#fbbf24"}}>■</span> False positive</span>
                    <span><span style={{color:"#f87171"}}>■</span> Missed error</span>
                  </div>}

                  {/* score card after reveal */}
                  {ecRevealed&&(
                    <div style={{...CARD,marginBottom:12,padding:16,textAlign:"center",background:"rgba(239,68,68,0.07)",borderColor:"rgba(239,68,68,0.3)"}}>
                      <div className={correctFinds>=4?"rq-glow-green":correctFinds>=2?"rq-glow-amber":"rq-glow-red"} style={{fontSize:40,fontWeight:900,color:correctFinds>=4?"#34d399":correctFinds>=2?"#fbbf24":"#f87171",marginBottom:4}}>{correctFinds}/5</div>
                      <div style={{fontSize:13,color:"#9ca3af",marginBottom:4}}>{correctFinds===5?"Perfect! All errors found!":correctFinds>=3?"Good detective work!":"Keep practising — try again!"}</div>
                      {falsePositives>0&&<div style={{fontSize:12,color:"#fbbf24"}}>{falsePositives} false positive{falsePositives>1?"s":""}</div>}
                    </div>
                  )}

                  {/* error explanations after reveal */}
                  {ecRevealed&&(
                    <div style={{...CARD,marginBottom:12,padding:14}}>
                      <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:"0 0 12px",letterSpacing:0.6}}>ALL 5 ERRORS</p>
                      {(ecData.errors||[]).map(function(err,i){
                        var tc=typeColor[err.type]||"#9ca3af";
                        var wasFound=Array.from(ecSelected).some(function(idx){return strip(tokens[idx])===strip(err.corrupted);});
                        return(
                          <div key={i} style={{marginBottom:12,paddingBottom:12,borderBottom:i<ecData.errors.length-1?"1px solid rgba(255,255,255,0.06)":"none"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                              <span style={{background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"2px 7px",fontSize:10,color:tc,fontWeight:700,textTransform:"uppercase"}}>{err.type}</span>
                              <span style={{fontSize:13,color:"#ef4444",fontFamily:"monospace",fontWeight:700}}>{err.corrupted}</span>
                              <span style={{fontSize:11,color:"#6b7280"}}>→</span>
                              <span style={{fontSize:13,color:"#34d399",fontFamily:"monospace",fontWeight:700}}>{err.original}</span>
                              <span style={{marginLeft:"auto",fontSize:12}}>{wasFound?"✓":"✗"}</span>
                            </div>
                            <p style={{fontSize:12,color:"#9ca3af",margin:0,lineHeight:1.5}}>{err.explanation}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* action buttons */}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {!ecRevealed&&<button
                      onClick={function(){setEcRevealed(true);}}
                      disabled={ecSelected.size===0}
                      style={{...mkBtn(ecSelected.size===0?"#374151":"#ef4444","#fff0f0"),flex:1,fontSize:13,padding:"11px 0"}}
                    >Check Answers ({ecSelected.size}/5)</button>}
                    {ecRevealed&&<button onClick={function(){
                      setEcData(null);setEcSelected(new Set());setEcRevealed(false);setEcError("");setEcLoading(true);
                      setTimeout(function(){
                        try{
                          var d=injectErrors(passage,level);
                          setEcData(d);
                        }catch(e){setEcError(e.message||"Failed — try again.");}
                        setEcLoading(false);
                      },0);
                    }} style={{...mkBtn("#ef4444","#fff0f0"),flex:1,fontSize:13}}>Try Again</button>}
                    <button onClick={function(){setStage("result");}} style={{...mkBtn("#6366f1"),flex:1,fontSize:13}}>Back to Results</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── STORY DISCUSSION ──────────────────────────────── */}
        {stage==="discuss"&&currentUser&&(function(){
          var story=STORY_LIBRARY.find(function(s){return s.id===discussStoryId;});
          var posts=(allDiscuss&&allDiscuss[discussStoryId])||[];
          var today=todayKey();
          var alreadyPosted=posts.some(function(p){return p.user===currentUser.name&&p.date===today;});
          function submitPost(){
            if(!discussInput.trim()||discussInput.trim().length<3||alreadyPosted)return;
            var newPost={user:currentUser.name,text:discussInput.trim().slice(0,200),date:today};
            var newPosts=[newPost].concat(posts).slice(0,50);
            var nAll={};for(var k in allDiscuss)nAll[k]=allDiscuss[k];nAll[discussStoryId]=newPosts;
            setAllDiscuss(nAll);saveDiscuss(nAll);setDiscussInput("");
          }
          return(
            <div>
              <header className="lq-sub-topbar">
                <button type="button" className="lq-sub-back" onClick={function(){setStage("result");}} aria-label="Back">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#f472b6"}}>💬</span> {t("discussion")}</h1>
                <div style={{width:38}}/>
              </header>
              {story&&<div style={{...CARD,marginBottom:12,padding:12,background:"rgba(236,72,153,0.06)",borderColor:"rgba(236,72,153,0.25)"}}>
                <p style={{fontSize:11,color:"#f472b6",fontWeight:700,margin:"0 0 4px"}}>📖 {story.title} · {story.level}</p>
                <p style={{fontSize:13,color:"#9ca3af",margin:0,lineHeight:1.5}}>{story.prompt||"What did you find most interesting about this passage?"}</p>
              </div>}
              {!alreadyPosted?(
                <div style={{...CARD,marginBottom:12,padding:14}}>
                  <textarea value={discussInput} onChange={function(e){setDiscussInput(e.target.value.slice(0,200));}} placeholder="Share your thoughts..." style={{width:"100%",minHeight:70,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f3f4f6",fontSize:13,padding:"9px 11px",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                    <span style={{fontSize:11,color:"#6b7280"}}>{discussInput.length}/200</span>
                    <button onClick={submitPost} disabled={discussInput.trim().length<3} style={{...mkBtn(discussInput.trim().length>=3?"#ec4899":"#374151","#0d0d1a"),padding:"8px 18px",fontSize:13}}>{t("postButton")}</button>
                  </div>
                </div>
              ):(
                <div style={{...CARD,marginBottom:12,padding:12,background:"rgba(52,211,153,0.05)",borderColor:"rgba(52,211,153,0.3)"}}>
                  <p style={{fontSize:12,color:"#34d399",margin:0}}>✓ You've posted today. Come back tomorrow to share more!</p>
                </div>
              )}
              {posts.length===0&&<p style={{color:"#6b7280",fontSize:13,textAlign:"center",padding:20}}>{t("beFirstToShare")}</p>}
              {posts.map(function(p,i){
                var isMe=p.user===currentUser.name;
                return(
                  <div key={i} style={{...CARD,marginBottom:8,padding:12,background:isMe?"rgba(236,72,153,0.06)":"rgba(255,255,255,0.03)",borderColor:isMe?"rgba(236,72,153,0.25)":"rgba(255,255,255,0.08)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:12,fontWeight:700,color:isMe?"#f472b6":"#9ca3af"}}>{p.user}{isMe?" (you)":""}</span>
                      <span style={{fontSize:10,color:"#4b5563"}}>{p.date}</span>
                    </div>
                    <p style={{fontSize:13,color:"#e5e7eb",margin:0,lineHeight:1.6}}>{p.text}</p>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── QUOTE BOOK ────────────────────────────────────── */}
        {stage==="quotes"&&(
          <div>
            <header className="lq-sub-topbar">
              <button type="button" className="lq-sub-back" onClick={function(){setStage(result?"result":"home");}} aria-label="Back">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <h1 className="lq-sub-title" style={{textAlign:"center"}}><span style={{color:"#fbbf24"}}>🔖</span> {t("quoteBook")}</h1>
              <div style={{width:38}}/>
            </header>
            {quotes.length===0?(
              <div style={{...CARD,textAlign:"center",padding:40}}>
                <div style={{fontSize:36,marginBottom:10}}>🔖</div>
                <p style={{color:"#6b7280",fontSize:14}}>No saved sentences yet. In the reading screen, tap a sentence then click "🔖 Save" to add it here.</p>
                <button onClick={doRestart} style={{...mkBtn("#f59e0b","#0d0d1a"),marginTop:14}}>{t("startReading")}</button>
              </div>
            ):(
              <div>
                <p style={{fontSize:12,color:"#6b7280",marginBottom:10}}>{quotes.length} saved sentence{quotes.length!==1?"s":""}</p>
                {quotes.map(function(q,i){
                  var glv=getLv(q.level);
                  return(
                    <div key={i} style={{...CARD,marginBottom:8,padding:14,background:"rgba(245,158,11,0.05)",borderColor:"rgba(245,158,11,0.2)"}}>
                      <p style={{fontSize:14,color:"#f3f4f6",lineHeight:1.7,margin:"0 0 8px",fontStyle:"italic"}}>"{q.text}"</p>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          {q.level&&<span style={{background:glv.glow,color:glv.color,borderRadius:999,padding:"2px 8px",fontSize:10,fontWeight:700}}>{q.level}</span>}
                          {q.topic&&<span style={{fontSize:11,color:"#6b7280"}}>{q.topic}</span>}
                          <span style={{fontSize:10,color:"#4b5563"}}>{q.date}</span>
                        </div>
                        <button onClick={function(){deleteQuote(i);}} style={{background:"transparent",border:"none",color:"#ef4444",fontSize:13,cursor:"pointer",opacity:0.6}} title="Delete">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
    </>
  );
}
