import { useState, useRef, useEffect } from "react";

var API        = "/.netlify/functions/generate";
var AUTH       = "/.netlify/functions/auth";
var REGISTER   = "/.netlify/functions/register";
var USERS_API  = "/.netlify/functions/users";
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
function getWeekId(){
  var d=new Date();
  var dayOfYear=Math.floor((d-new Date(d.getFullYear(),0,0))/(864e5));
  return d.getFullYear()+"-W"+Math.ceil(dayOfYear/7);
}
function getWpmFromSecs(wordCount,secs){return secs>0?Math.round(wordCount/(secs/60)):0;}

var SRS_INTERVALS=[1,3,7,14]; // days between reviews
function srsNextDate(days){var d=new Date();d.setDate(d.getDate()+days);return d.toLocaleDateString();}
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
  if(q.type==="mcq"||q.type==="gap_word"||q.type==="gap_sentence"||q.type==="tfnm"||q.type==="ynng")return Number(ans)===Number(q.answer)?Q_XP[q.type]:0;
  if(q.type==="matching"){var s=0;for(var i=0;i<q.correctPairs.length;i++){if(ans&&Number(ans[i])===Number(q.correctPairs[i]))s++;}return s;}
  if(q.type==="heading"){if(!q.correctMap)return 0;var h=0;for(var j=0;j<q.correctMap.length;j++){if(ans&&Number(ans[j])===Number(q.correctMap[j]))h++;}return h;}
  if(q.type==="qa"){if(!ans||ans.trim().length<3)return 0;var lo=ans.toLowerCase(),hits=0;for(var k=0;k<q.keywords.length;k++){if(lo.includes(q.keywords[k].toLowerCase()))hits++;} var threshold=Math.ceil(q.keywords.length/2);return hits>=threshold?Q_XP.qa:0;}
  return 0;
}
function maxPoints(q){if(q.type==="matching")return q.lefts?q.lefts.length:3;if(q.type==="heading")return q.correctMap?q.correctMap.length:2;return Q_XP[q.type]||1;}

var STORY_LIBRARY=[
  // ── A1 ──
  {id:"a1_1",level:"A1",title:"My Family",topic:"Family",
   passage:"My name is Tom. I am eight years old. I have a mother, a father, and one sister. My sister is five years old. Her name is Lucy. We live in a small house. Our house has three rooms. We have a dog. The dog's name is Max. Max is big and brown. I love my family very much.",
   questions:[
     {type:"mcq",q:"How old is Tom?",options:["Five","Six","Eight","Ten"],answer:2,explanation:"Tom says 'I am eight years old.'"},
     {type:"mcq",q:"What is the dog's name?",options:["Lucy","Max","Tom","Rex"],answer:1,explanation:"Tom says 'The dog's name is Max.'"},
     {type:"gap_word",sentence:"Tom's sister is ___ years old.",options:["three","five","eight","ten"],answer:1,explanation:"Lucy is five years old."},
   ]},
  {id:"a1_2",level:"A1",title:"At the Market",topic:"Shopping",
   passage:"Every Saturday, my mother goes to the market. She buys fruit and vegetables. She buys apples, bananas, and oranges. She also buys carrots and tomatoes. The market is near our house. It is a ten-minute walk. The fruit is fresh and cheap. My mother loves the market.",
   questions:[
     {type:"mcq",q:"When does the mother go to the market?",options:["Sunday","Monday","Saturday","Friday"],answer:2,explanation:"She goes every Saturday."},
     {type:"mcq",q:"How far is the market?",options:["Five minutes","Ten minutes","Twenty minutes","One hour"],answer:1,explanation:"It is a ten-minute walk."},
     {type:"gap_word",sentence:"The fruit at the market is fresh and ___.",options:["expensive","old","cheap","far"],answer:2,explanation:"The passage says 'fresh and cheap'."},
   ]},
  {id:"a1_3",level:"A1",title:"My School",topic:"School",
   passage:"I go to school every day from Monday to Friday. My school is small. There are twenty students in my class. My teacher's name is Mrs. Green. She is very kind. We study reading, writing, and maths. My favourite subject is maths. School starts at eight o'clock and ends at three o'clock.",
   questions:[
     {type:"mcq",q:"What is the teacher's name?",options:["Mrs. Blue","Mrs. Green","Mrs. Brown","Mrs. White"],answer:1,explanation:"The passage says 'My teacher's name is Mrs. Green.'"},
     {type:"mcq",q:"What is the student's favourite subject?",options:["Reading","Writing","Science","Maths"],answer:3,explanation:"The passage says 'My favourite subject is maths.'"},
     {type:"gap_word",sentence:"There are ___ students in the class.",options:["ten","fifteen","twenty","thirty"],answer:2,explanation:"'There are twenty students in my class.'"},
   ]},
  // ── A2 ──
  {id:"a2_1",level:"A2",title:"The Lost Key",topic:"Daily Life",
   passage:"Yesterday morning, Sarah could not find her house key. She looked everywhere. She checked her bag, her coat pockets, and the kitchen table. Then she remembered — she left it at her friend Anna's house the day before. Sarah called Anna. Anna found the key under the sofa. Sarah was very relieved.",
   questions:[
     {type:"mcq",q:"Where did Sarah leave her key?",options:["In her bag","On the kitchen table","At Anna's house","In her coat pocket"],answer:2,explanation:"She left it at her friend Anna's house."},
     {type:"mcq",q:"Where did Anna find the key?",options:["In her bag","Under the sofa","On the table","By the door"],answer:1,explanation:"Anna found the key under the sofa."},
     {type:"gap_word",sentence:"Sarah felt very ___ when the key was found.",options:["angry","sad","relieved","tired"],answer:2,explanation:"'Sarah was very relieved.'"},
   ]},
  {id:"a2_2",level:"A2",title:"Learning to Cook",topic:"Food",
   passage:"Last summer, Pedro decided to learn how to cook. He watched videos online and bought a simple cookbook. First, he learned to make pasta. It was difficult at first, but he practised every day. After two weeks, his pasta was delicious. His family were very proud of him. Now Pedro cooks dinner every Friday.",
   questions:[
     {type:"mcq",q:"How did Pedro learn to cook?",options:["At school","From his family","Online videos and a cookbook","At a restaurant"],answer:2,explanation:"He watched videos online and bought a cookbook."},
     {type:"mcq",q:"How long did it take before his pasta was delicious?",options:["One week","Two weeks","One month","Three days"],answer:1,explanation:"'After two weeks, his pasta was delicious.'"},
     {type:"gap_word",sentence:"Pedro cooks dinner every ___.",options:["Monday","Wednesday","Sunday","Friday"],answer:3,explanation:"'Now Pedro cooks dinner every Friday.'"},
   ]},
  {id:"a2_3",level:"A2",title:"The New Neighbour",topic:"Community",
   passage:"A new family moved into the house next door last month. They have two children — a boy called Marco and a girl called Lily. Marco is the same age as me, so we go to the same school. Lily is younger; she goes to primary school. Their parents are both doctors. The whole family is very friendly. We often invite them for dinner.",
   questions:[
     {type:"mcq",q:"What do the parents do for work?",options:["Teachers","Doctors","Engineers","Chefs"],answer:1,explanation:"'Their parents are both doctors.'"},
     {type:"mcq",q:"Who goes to the same school as the narrator?",options:["Lily","Marco","Both children","Neither"],answer:1,explanation:"'Marco is the same age as me, so we go to the same school.'"},
     {type:"gap_word",sentence:"The family moved in ___ month.",options:["this","next","last","every"],answer:2,explanation:"'A new family moved into the house next door last month.'"},
   ]},
  // ── B1 ──
  {id:"b1_1",level:"B1",title:"The Power of Habit",topic:"Psychology",
   passage:"Scientists say that about 40% of our daily actions are habits, not decisions. A habit is formed when a behaviour is repeated so often that it becomes automatic. The brain creates a loop: a cue triggers the habit, the routine follows, and then there is a reward. Breaking a bad habit is hard because the brain loop remains even when the behaviour stops. The most effective strategy is not to try to stop the habit but to replace it with a different routine triggered by the same cue.",
   questions:[
     {type:"mcq",q:"What percentage of daily actions are habits according to scientists?",options:["20%","30%","40%","60%"],answer:2,explanation:"The passage states 'about 40% of our daily actions are habits.'"},
     {type:"mcq",q:"What is the most effective strategy for breaking a bad habit?",options:["Stopping it immediately","Avoiding the cue","Replacing it with a different routine","Rewarding yourself"],answer:2,explanation:"'The most effective strategy is to replace it with a different routine.'"},
     {type:"gap_word",sentence:"A habit is formed when a behaviour is repeated and becomes ___.",options:["difficult","intentional","automatic","boring"],answer:2,explanation:"'it becomes automatic'"},
   ]},
  {id:"b1_2",level:"B1",title:"Urban Farming",topic:"Environment",
   passage:"As cities grow larger, some people are finding creative ways to grow food in urban areas. Rooftop gardens, vertical farms, and community allotments are becoming more common. Urban farming offers several benefits: it reduces the distance food travels, provides fresh produce to local communities, and helps people reconnect with nature. However, it also faces challenges such as limited space, high costs, and lack of sunlight in dense cities.",
   questions:[
     {type:"mcq",q:"Which is NOT listed as a challenge of urban farming?",options:["Limited space","High costs","Lack of sunlight","Water shortage"],answer:3,explanation:"Water shortage is not mentioned; the challenges listed are space, costs, and sunlight."},
     {type:"mcq",q:"What does urban farming reduce?",options:["Community connections","Food distance","City size","Costs"],answer:1,explanation:"'it reduces the distance food travels'"},
     {type:"gap_word",sentence:"Urban farming helps people reconnect with ___.",options:["technology","each other","nature","the city"],answer:2,explanation:"'helps people reconnect with nature'"},
   ]},
  {id:"b1_3",level:"B1",title:"Sleep and Memory",topic:"Science",
   passage:"Most people know that sleep is important for health, but fewer understand exactly why. During sleep, the brain is remarkably active. It processes and organises information gathered during the day, moving short-term memories into long-term storage. Research shows that students who sleep well after studying retain significantly more information than those who stay up late. Even a short nap of 20 minutes can improve focus and recall. Experts recommend 7 to 9 hours of sleep per night for adults.",
   questions:[
     {type:"mcq",q:"What does the brain do with short-term memories during sleep?",options:["Deletes them","Moves them to long-term storage","Creates new ones","Ignores them"],answer:1,explanation:"'moving short-term memories into long-term storage'"},
     {type:"mcq",q:"How long should a useful nap be according to the passage?",options:["5 minutes","10 minutes","20 minutes","45 minutes"],answer:2,explanation:"'a short nap of 20 minutes can improve focus'"},
     {type:"gap_word",sentence:"Experts recommend ___ to 9 hours of sleep for adults.",options:["5","6","7","8"],answer:2,explanation:"'7 to 9 hours of sleep per night for adults'"},
   ]},
  // ── B2 ──
  {id:"b2_1",level:"B2",title:"The Attention Economy",topic:"Technology",
   passage:"Social media platforms are designed to capture and hold your attention for as long as possible. Every notification, like, and scroll is engineered to trigger dopamine release, keeping users engaged. This business model — selling advertisers access to user attention — is called the attention economy. Critics argue that this design creates addictive behaviour patterns and fragments our ability to concentrate. Some researchers link heavy social media use to rising rates of anxiety and depression, particularly among teenagers. However, others maintain that correlation does not imply causation, and that the evidence remains inconclusive.",
   questions:[
     {type:"mcq",q:"What is the 'attention economy' as described in the passage?",options:["A system for managing time","Selling advertisers access to user attention","A type of social media platform","A psychological theory"],answer:1,explanation:"'selling advertisers access to user attention is called the attention economy'"},
     {type:"mcq",q:"What do critics say social media design creates?",options:["Community bonds","Addictive behaviour patterns","Better concentration","Healthier teenagers"],answer:1,explanation:"'this design creates addictive behaviour patterns and fragments our ability to concentrate'"},
     {type:"qa",q:"Why do some researchers disagree with the link between social media and mental health problems?",keywords:["correlation","causation","inconclusive","evidence"],explanation:"They argue that correlation does not imply causation, and the evidence is inconclusive."},
   ]},
  {id:"b2_2",level:"B2",title:"Rewilding",topic:"Environment",
   passage:"Rewilding is a conservation approach that aims to restore ecosystems to their natural state by reintroducing species that have disappeared. Unlike traditional conservation, which focuses on protecting what remains, rewilding seeks to rebuild natural processes. The reintroduction of wolves to Yellowstone National Park in the USA is often cited as a success story. The wolves reduced deer populations, which allowed vegetation to recover, which in turn stabilised riverbanks and changed waterflow. This cascade of effects is known as a 'trophic cascade.' Critics, however, warn that reintroducing predators near human settlements can create conflict.",
   questions:[
     {type:"mcq",q:"How does rewilding differ from traditional conservation?",options:["It focuses only on plants","It rebuilds natural processes rather than protecting remains","It relies on technology","It is cheaper"],answer:1,explanation:"'rewilding seeks to rebuild natural processes' vs protecting what remains."},
     {type:"mcq",q:"What is a 'trophic cascade'?",options:["A type of waterfall","A series of ecological effects triggered by one change","A reintroduction programme","A hunting technique"],answer:1,explanation:"The cascade of effects from wolf reintroduction is called a trophic cascade."},
     {type:"gap_word",sentence:"The reintroduction of wolves ___ deer populations.",options:["increased","stabilised","reduced","eliminated"],answer:2,explanation:"'The wolves reduced deer populations'"},
   ]},
  {id:"b2_3",level:"B2",title:"The Placebo Effect",topic:"Medicine",
   passage:"The placebo effect is one of medicine's most fascinating and least understood phenomena. When patients receive an inert treatment — a sugar pill or saline injection — and believe it to be real medication, many show genuine physiological improvements. Studies have recorded reduced pain, lower blood pressure, and even shrinking tumours in placebo recipients. The mechanism is not fully understood, but researchers believe it involves the release of endorphins and changes in neural activity. Ethical debates surround its use: if placebos work, should doctors prescribe them even if doing so involves deception?",
   questions:[
     {type:"mcq",q:"What is an 'inert treatment'?",options:["A strong painkiller","A natural remedy","A treatment with no active ingredient","A surgical procedure"],answer:2,explanation:"Inert means having no active ingredient — like a sugar pill."},
     {type:"mcq",q:"Which is NOT listed as a placebo effect observed in studies?",options:["Reduced pain","Lower blood pressure","Improved vision","Shrinking tumours"],answer:2,explanation:"Improved vision is not mentioned in the passage."},
     {type:"qa",q:"What ethical question does the passage raise about placebos?",keywords:["deception","doctors","prescribe","ethical"],explanation:"Should doctors prescribe placebos even if doing so involves deceiving patients?"},
   ]},
  // ── C1 ──
  {id:"c1_1",level:"C1",title:"The Language Instinct",topic:"Linguistics",
   passage:"The linguist Noam Chomsky proposed that humans are born with an innate capacity for language — a 'language acquisition device' hardwired into the brain. This theory sought to explain why children acquire language so rapidly and uniformly across cultures, despite minimal explicit instruction. Critics, however, point to the statistical learning hypothesis, which suggests that children learn language by detecting patterns in the input they receive. Recent neuroimaging studies have identified dedicated language circuits in the brain, lending partial support to Chomsky's view, though the debate between nativist and empiricist accounts of language acquisition remains unresolved.",
   questions:[
     {type:"mcq",q:"What is Chomsky's 'language acquisition device'?",options:["A teaching tool","An innate brain capacity for language","A statistical model","A type of grammar"],answer:1,explanation:"Chomsky proposed an innate brain capacity for language called the language acquisition device."},
     {type:"mcq",q:"What does the statistical learning hypothesis suggest?",options:["Language is innate","Children learn by detecting patterns in input","Brain circuits determine language","Grammar is universal"],answer:1,explanation:"'children learn language by detecting patterns in the input they receive'"},
     {type:"qa",q:"What evidence partially supports Chomsky's view?",keywords:["neuroimaging","circuits","brain","dedicated"],explanation:"Neuroimaging studies identified dedicated language circuits in the brain."},
   ]},
  {id:"c1_2",level:"C1",title:"The Anthropocene",topic:"Climate",
   passage:"Geologists have proposed naming our current epoch the Anthropocene — the age of human influence — to reflect the unprecedented scale of humanity's impact on the Earth's systems. Evidence for this designation includes the global dispersal of microplastics, radionuclides from nuclear testing, and the homogenisation of species assemblages. The proposal is scientifically contested: some argue the changes are insufficient to define a new epoch, while others suggest the Holocene — the epoch beginning after the last ice age — remains the appropriate designation. The debate underscores a deeper question about whether geological time should accommodate human timescales.",
   questions:[
     {type:"mcq",q:"What does 'Anthropocene' refer to?",options:["A prehistoric era","The age of human influence on Earth","A geological period before humans","A climate model"],answer:1,explanation:"'the age of human influence' — reflecting humanity's impact on Earth's systems."},
     {type:"mcq",q:"Which piece of evidence is NOT mentioned?",options:["Microplastics","Radionuclides","Rising sea temperatures","Homogenisation of species"],answer:2,explanation:"Rising sea temperatures are not listed among the evidence cited."},
     {type:"qa",q:"What deeper question does the Anthropocene debate raise?",keywords:["geological","time","human","timescales","accommodate"],explanation:"Whether geological time should accommodate human timescales."},
   ]},
  {id:"c1_3",level:"C1",title:"Confirmation Bias",topic:"Psychology",
   passage:"Confirmation bias is the tendency to search for, interpret, and recall information in a way that confirms one's pre-existing beliefs. It operates unconsciously and affects even highly educated individuals. In political discourse, it reinforces polarisation: people curate information environments that reflect their worldview, making genuine dialogue across ideological lines increasingly difficult. In science, it manifests as selective reporting of results that support a hypothesis while ignoring contradictory evidence — a practice known as p-hacking. Mitigating confirmation bias requires deliberate effort: seeking disconfirming evidence, engaging with opposing viewpoints, and employing structured analytical techniques.",
   questions:[
     {type:"mcq",q:"What is 'p-hacking' as described in the passage?",options:["Hacking computers to get data","Selecting results that support a hypothesis while ignoring contradictions","A statistical test","A type of confirmation bias in politics"],answer:1,explanation:"'selective reporting of results that support a hypothesis while ignoring contradictory evidence'"},
     {type:"mcq",q:"Which strategy is NOT suggested for mitigating confirmation bias?",options:["Seeking disconfirming evidence","Engaging opposing viewpoints","Avoiding all news","Structured analytical techniques"],answer:2,explanation:"Avoiding all news is not mentioned; the strategies are seeking disconfirming evidence, engaging viewpoints, and structured techniques."},
     {type:"qa",q:"How does confirmation bias affect political discourse?",keywords:["polarisation","curate","worldview","dialogue","ideological"],explanation:"It reinforces polarisation by making people curate information environments matching their worldview, hindering genuine dialogue."},
   ]},
  // ── C2 ──
  {id:"c2_1",level:"C2",title:"The Ship of Theseus",topic:"Philosophy",
   passage:"The Ship of Theseus is an ancient paradox that probes the nature of identity and persistence through change. If every plank of a ship is gradually replaced, at what point — if any — does it cease to be the same ship? Thomas Hobbes extended the puzzle: if the original planks are collected and reassembled, which vessel is the 'true' Ship of Theseus? Contemporary philosophers have mapped this paradox onto questions of personal identity — whether the self persists through total cellular replacement, amnesia, or radical personality change. Derek Parfit argued that identity is not what matters; psychological continuity and connectedness are what ground our practical concerns about the future.",
   questions:[
     {type:"mcq",q:"What was Hobbes's contribution to the Ship of Theseus paradox?",options:["He solved it","He asked which ship is the 'true' one if original parts are reassembled","He applied it to biology","He dismissed it as meaningless"],answer:1,explanation:"Hobbes asked: if the original planks are reassembled, which is the true ship?"},
     {type:"mcq",q:"What does Parfit argue matters instead of identity?",options:["Physical continuity","Legal status","Psychological continuity and connectedness","Memory alone"],answer:2,explanation:"'psychological continuity and connectedness are what ground our practical concerns'"},
     {type:"qa",q:"How have contemporary philosophers applied the Ship of Theseus paradox?",keywords:["personal identity","self","cellular","amnesia","personality","persists"],explanation:"They apply it to questions of personal identity — whether the self persists through cellular replacement, amnesia, or radical personality change."},
   ]},
  {id:"c2_2",level:"C2",title:"The Extended Mind",topic:"Cognitive Science",
   passage:"The philosopher Andy Clark and cognitive scientist David Chalmers proposed the 'extended mind' thesis in 1998, arguing that the mind is not confined to the skull. When external objects — notebooks, smartphones, or other people — become so reliably integrated into our cognitive processes that we would be cognitively impaired without them, those objects should be considered part of the mind. Critics object that this conflates the vehicle of thought with thought itself, and that genuine mental states must be intrinsic to the organism. The debate has practical implications for how we conceptualise cognitive enhancement, disability, and the ethics of memory modification.",
   questions:[
     {type:"mcq",q:"What is the 'extended mind' thesis?",options:["The mind expands with intelligence","The mind includes reliably integrated external objects","The brain has extended regions","Thinking occurs only in language"],answer:1,explanation:"External objects reliably integrated into cognition should be considered part of the mind."},
     {type:"mcq",q:"What is the main criticism of the extended mind thesis?",options:["It is too narrow","It conflates the vehicle of thought with thought itself","It ignores technology","It is empirically untestable"],answer:1,explanation:"Critics say it conflates the vehicle of thought with thought itself."},
     {type:"qa",q:"What practical issues does the extended mind debate raise?",keywords:["cognitive enhancement","disability","memory","modification","ethics"],explanation:"It raises issues for conceptualising cognitive enhancement, disability, and the ethics of memory modification."},
   ]},
  {id:"c2_3",level:"C2",title:"Epistemic Injustice",topic:"Philosophy",
   passage:"Miranda Fricker coined the term 'epistemic injustice' to describe wrongs done to individuals specifically in their capacity as knowers. She identifies two primary forms. The first, testimonial injustice, occurs when a speaker receives less credibility than they deserve due to prejudice — a Black witness being disbelieved in court, for instance. The second, hermeneutical injustice, arises when a gap in collective interpretive resources disadvantages a group — as when, before the concept of sexual harassment was named, victims had no framework to articulate their experiences. Both forms of injustice are self-concealing and compound existing social inequalities.",
   questions:[
     {type:"mcq",q:"What is 'testimonial injustice'?",options:["Lying under oath","Giving false testimony","Receiving less credibility due to prejudice","Refusing to testify"],answer:2,explanation:"'a speaker receives less credibility than they deserve due to prejudice'"},
     {type:"mcq",q:"What makes hermeneutical injustice distinct from testimonial injustice?",options:["It involves legal proceedings","It arises from a gap in collective interpretive resources","It affects only minority groups","It requires deliberate intent"],answer:1,explanation:"Hermeneutical injustice arises when a gap in collective interpretive resources disadvantages a group."},
     {type:"qa",q:"Why are both forms of epistemic injustice described as 'self-concealing'?",keywords:["self-concealing","compound","inequalities","framework","articulate","named"],explanation:"They are self-concealing because victims often lack the framework to name or articulate what is happening to them, making the injustice invisible and compounding existing inequalities."},
   ]},
  // ── Extended Stories (A1-C2: 6 per level) ──
  {id:"a1_4",level:"A1",title:"The Park",topic:"Recreation",passage:"I like to go to the park on weekends. The park is near my home. There are trees and flowers. I play with my friends. We run and play games. Sometimes we eat ice cream. The park is fun and quiet. Everyone enjoys the park.",questions:[{type:"mcq",q:"Where is the park?",options:["Far away","Near home","In the city","By the beach"],answer:1,explanation:"The passage says 'The park is near my home.'"},{type:"mcq",q:"What do children do in the park?",options:["Work","Sleep","Play games and run","Study"],answer:2,explanation:"'I play with my friends. We run and play games.'"},{type:"qa",q:"Why do people like the park?",keywords:["fun","quiet","enjoy","trees","flowers"],explanation:"The passage says it is 'fun and quiet' and 'Everyone enjoys the park.'"}]},
  {id:"a2_4",level:"A2",title:"The Hobby",topic:"Interests",passage:"My hobby is painting. I paint pictures on weekends. I use bright colours like blue, red, and yellow. My friends think my paintings are beautiful. I show my paintings to my family. They are very proud of me. Painting helps me relax and express my feelings. I want to paint all the time.",questions:[{type:"mcq",q:"What is the narrator's hobby?",options:["Reading","Painting","Dancing","Singing"],answer:1,explanation:"'My hobby is painting.'"},{type:"mcq",q:"When does the narrator paint?",options:["Every day","At work","On weekends","In the evening"],answer:2,explanation:"'I paint pictures on weekends.'"},{type:"qa",q:"What colors does the narrator use?",keywords:["blue","red","yellow","bright"],explanation:"The narrator uses 'bright colours like blue, red, and yellow.'"}]},
  {id:"b1_4",level:"B1",title:"Learning Languages",topic:"Education",passage:"Learning a second language is an exciting challenge. Many people decide to learn English, Spanish, or Mandarin. Different methods work for different people. Some prefer classroom instruction, while others learn through apps and online resources. Consistency is key to progress. Regular practice helps build vocabulary and grammar skills. Immersion in the language—through movies, music, and conversations—accelerates learning. Motivation and patience are essential for success.",questions:[{type:"mcq",q:"What languages are mentioned as popular choices to learn?",options:["English, Spanish, Mandarin","French, German, Italian","Russian, Polish, Czech","Greek, Turkish, Arabic"],answer:0,explanation:"'Many people decide to learn English, Spanish, or Mandarin.'"},{type:"mcq",q:"Which factor is described as 'key to progress'?",options:["Having a tutor","Consistency","Natural talent","Expensive courses"],answer:1,explanation:"'Consistency is key to progress.'"},{type:"qa",q:"What methods can accelerate language learning?",keywords:["immersion","movies","music","conversations"],explanation:"'Immersion in the language—through movies, music, and conversations—accelerates learning.'"}]},
  {id:"b2_4",level:"B2",title:"Digital Privacy",topic:"Technology",passage:"The digital age has transformed how we communicate, work, and live. However, it has also introduced new challenges regarding privacy. Tech companies collect vast amounts of user data for targeted advertising and algorithmic curation. Many users are unaware of the extent to which their information is tracked across platforms. Privacy policies are often lengthy and written in complex language that discourages reading. Regulations like GDPR attempt to protect personal information, yet enforcement remains inconsistent. Individuals should be proactive: use strong passwords, enable two-factor authentication, and review privacy settings regularly.",questions:[{type:"mcq",q:"Why do tech companies collect user data?",options:["For scientific research","For targeted advertising and curation","For government surveillance","For academic studies"],answer:1,explanation:"'Tech companies collect vast amounts of user data for targeted advertising and algorithmic curation.'"},{type:"mcq",q:"What is one issue with privacy policies?",options:["They are too short","They are complex and lengthy, discouraging reading","They are freely available","They protect all data"],answer:1,explanation:"'Privacy policies are often lengthy and written in complex language that discourages reading.'"},{type:"qa",q:"What are three ways individuals can protect their privacy?",keywords:["strong passwords","two-factor authentication","review","privacy settings"],explanation:"'use strong passwords, enable two-factor authentication, and review privacy settings regularly.'"}]},
  {id:"c1_4",level:"C1",title:"Cognitive Biases",topic:"Psychology",passage:"Cognitive biases are systematic patterns in how humans process information and make decisions. They arise from the brain's need to simplify complex environments through heuristics—mental shortcuts. Common examples include confirmation bias (seeking information that confirms existing beliefs), availability heuristic (overweighting accessible information), and anchoring (relying heavily on initial information). These biases are not character flaws but evolutionary adaptations that generally served humans well in ancestral environments. However, in modern contexts involving large datasets and probabilistic reasoning, they often lead to suboptimal decisions. Understanding one's biases is the first step toward mitigating their effects.",questions:[{type:"mcq",q:"What are cognitive biases primarily caused by?",options:["Lack of intelligence","The brain's need to simplify through heuristics","Emotional instability","Poor education"],answer:1,explanation:"'They arise from the brain's need to simplify complex environments through heuristics.'"},{type:"mcq",q:"Which bias involves relying heavily on initial information?",options:["Confirmation bias","Availability heuristic","Anchoring","Recency bias"],answer:2,explanation:"'anchoring (relying heavily on initial information)'"},{type:"qa",q:"Why were cognitive biases adaptive in ancestral environments?",keywords:["evolutionary","simplified","ancestral","served"],explanation:"The passage states biases 'are evolutionary adaptations that generally served humans well in ancestral environments.'"}]},
  {id:"c2_4",level:"C2",title:"Phenomenology",topic:"Philosophy",passage:"Phenomenology, as developed by Edmund Husserl, is the study of consciousness and subjective experience. It emphasizes the essential structures of experience—how objects appear to consciousness through intentionality. Rather than seeking objective truth independent of observers, phenomenology examines the structures through which meaning is constituted. Maurice Merleau-Ponty extended phenomenology by emphasizing embodiment: experience is always mediated through the body, not disembodied consciousness. Contemporary phenomenology engages with intersubjectivity—how shared meaning emerges through social interaction. Critics argue phenomenology lacks empirical rigor, yet proponents contend it clarifies foundational questions about consciousness that neuroscience alone cannot address.",questions:[{type:"mcq",q:"What is intentionality in phenomenology?",options:["Having a goal or purpose","How objects appear to consciousness","Being intentional in actions","A logical principle"],answer:1,explanation:"'how objects appear to consciousness through intentionality.'"},{type:"mcq",q:"How did Merleau-Ponty extend Husserl's phenomenology?",options:["By adding mathematics","By emphasizing embodiment and the body's role","By rejecting consciousness","By using scientific methods"],answer:1,explanation:"'Maurice Merleau-Ponty extended phenomenology by emphasizing embodiment.'"},{type:"qa",q:"What criticism is leveled against phenomenology, and how do proponents respond?",keywords:["empirical rigor","consciousness","neuroscience","foundational questions"],explanation:"Critics argue it 'lacks empirical rigor,' yet proponents contend 'it clarifies foundational questions about consciousness that neuroscience alone cannot address.'"}]},

  // ── A1 extra ──
  {id:"a1_5",level:"A1",title:"My Bedroom",topic:"Home",passage:"My bedroom is small but nice. I have a bed, a desk, and a chair. My desk is by the window. I do my homework at my desk. My bed is soft and warm. I sleep very well at night. I have some books on a shelf. I also have a toy box. I love my bedroom very much.",questions:[{type:"mcq",q:"Where is the desk?",options:["By the door","By the window","In the kitchen","In the garden"],answer:1,explanation:"'My desk is by the window.'"},{type:"mcq",q:"What does the narrator do at the desk?",options:["Sleep","Cook","Do homework","Watch TV"],answer:2,explanation:"'I do my homework at my desk.'"},{type:"gap_word",sentence:"The narrator keeps books on a ___.",options:["table","shelf","bed","chair"],answer:1,explanation:"'I have some books on a shelf.'"}]},
  {id:"a1_6",level:"A1",title:"The Weather",topic:"Nature",passage:"Today the weather is sunny. The sky is blue and there are no clouds. It is warm but not hot. I put on a T-shirt and shorts. My mother opens the windows. We go for a walk in the garden. The flowers look beautiful in the sunshine. I am very happy today.",questions:[{type:"mcq",q:"What is the weather like today?",options:["Rainy","Cloudy","Sunny","Cold"],answer:2,explanation:"'Today the weather is sunny.'"},{type:"mcq",q:"What does the narrator wear?",options:["A coat and boots","A jacket and trousers","A T-shirt and shorts","A jumper and jeans"],answer:2,explanation:"'I put on a T-shirt and shorts.'"},{type:"gap_word",sentence:"The flowers look beautiful in the ___.",options:["rain","wind","snow","sunshine"],answer:3,explanation:"'The flowers look beautiful in the sunshine.'"}]},
  {id:"a1_7",level:"A1",title:"Breakfast Time",topic:"Food",passage:"Every morning I eat breakfast at seven o'clock. I have bread, butter, and a glass of milk. Sometimes I eat an egg. My mother makes breakfast for the family. We all sit at the table. My father drinks coffee. My sister eats cereal. Breakfast is my favourite meal of the day.",questions:[{type:"mcq",q:"What time does the narrator eat breakfast?",options:["Six o'clock","Seven o'clock","Eight o'clock","Nine o'clock"],answer:1,explanation:"'I eat breakfast at seven o'clock.'"},{type:"mcq",q:"What does the narrator's father drink?",options:["Milk","Tea","Juice","Coffee"],answer:3,explanation:"'My father drinks coffee.'"},{type:"gap_word",sentence:"Breakfast is the narrator's favourite ___ of the day.",options:["drink","sport","meal","book"],answer:2,explanation:"'Breakfast is my favourite meal of the day.'"}]},
  {id:"a1_8",level:"A1",title:"My Pet",topic:"Animals",passage:"I have a cat. Her name is Mimi. Mimi is white and orange. She is very soft. I feed her every morning. She likes fish and milk. Mimi sleeps on the sofa all day. At night she sleeps in my room. I love Mimi. She is my best friend.",questions:[{type:"mcq",q:"What colour is Mimi?",options:["Black and white","Orange and grey","White and orange","Brown and black"],answer:2,explanation:"'Mimi is white and orange.'"},{type:"mcq",q:"What does Mimi like to eat?",options:["Vegetables and bread","Fish and milk","Rice and meat","Fruit and cheese"],answer:1,explanation:"'She likes fish and milk.'"},{type:"gap_word",sentence:"Mimi sleeps on the sofa all ___.",options:["night","morning","day","week"],answer:2,explanation:"'Mimi sleeps on the sofa all day.'"}]},
  {id:"a1_9",level:"A1",title:"A Birthday Party",topic:"Celebrations",passage:"Today is my birthday. I am seven years old. My mother makes a big cake. The cake is chocolate. My friends come to my house. We play games and sing songs. My friend gives me a toy car. I am very happy. We eat cake and drink juice. It is a great day!",questions:[{type:"mcq",q:"How old is the narrator today?",options:["Five","Six","Seven","Eight"],answer:2,explanation:"'I am seven years old.'"},{type:"mcq",q:"What kind of cake does the mother make?",options:["Vanilla","Strawberry","Lemon","Chocolate"],answer:3,explanation:"'The cake is chocolate.'"},{type:"gap_word",sentence:"The narrator's friend gives a toy ___.",options:["boat","car","plane","train"],answer:1,explanation:"'My friend gives me a toy car.'"}]},
  {id:"a1_10",level:"A1",title:"The Seasons",topic:"Nature",passage:"There are four seasons in a year. They are spring, summer, autumn, and winter. In spring the flowers grow. In summer it is hot and sunny. In autumn the leaves fall from the trees. In winter it is cold and sometimes it snows. I like summer because I can swim. What is your favourite season?",questions:[{type:"mcq",q:"How many seasons are there in a year?",options:["Two","Three","Four","Five"],answer:2,explanation:"'There are four seasons in a year.'"},{type:"mcq",q:"What happens in autumn?",options:["Flowers grow","It snows","Leaves fall","It is hot"],answer:2,explanation:"'In autumn the leaves fall from the trees.'"},{type:"gap_word",sentence:"In winter it is cold and sometimes it ___.",options:["rains","snows","shines","floods"],answer:1,explanation:"'In winter it is cold and sometimes it snows.'"}]},

  // ── A2 extra ──
  {id:"a2_5",level:"A2",title:"A Trip to the Zoo",topic:"Animals",passage:"Last Sunday, my family went to the zoo. We saw many animals — lions, elephants, and giraffes. The giraffes were my favourite because they were so tall. We also watched a dolphin show. The dolphins jumped high out of the water. After the show, we ate sandwiches in the park. It was a wonderful day. I want to go back next year.",questions:[{type:"mcq",q:"When did the family visit the zoo?",options:["Saturday","Sunday","Monday","Friday"],answer:1,explanation:"'Last Sunday, my family went to the zoo.'"},{type:"mcq",q:"Why did the narrator like the giraffes?",options:["They were colourful","They were very fast","They were so tall","They were friendly"],answer:2,explanation:"'The giraffes were my favourite because they were so tall.'"},{type:"gap_word",sentence:"After the dolphin show, the family ate ___ in the park.",options:["pizza","cake","sandwiches","ice cream"],answer:2,explanation:"'we ate sandwiches in the park.'"}]},
  {id:"a2_6",level:"A2",title:"Learning to Ride a Bike",topic:"Sport",passage:"When I was six, my father taught me to ride a bike. It was very difficult at first. I fell down many times. But my father always helped me. He held the bike and ran beside me. After one week of practice, I could ride alone. I was so proud of myself. Now I cycle to school every day. It is my favourite way to travel.",questions:[{type:"mcq",q:"Who taught the narrator to ride a bike?",options:["Mother","Brother","Father","Teacher"],answer:2,explanation:"'my father taught me to ride a bike.'"},{type:"mcq",q:"How long did it take to learn to ride alone?",options:["One day","Three days","One week","One month"],answer:2,explanation:"'After one week of practice, I could ride alone.'"},{type:"gap_word",sentence:"Now the narrator cycles to school every ___.",options:["week","month","weekend","day"],answer:3,explanation:"'Now I cycle to school every day.'"}]},
  {id:"a2_7",level:"A2",title:"The Library",topic:"Education",passage:"There is a big library in my town. I go there every Saturday. The library has thousands of books. I love reading adventure stories. I can also borrow DVDs and magazines. The librarian is very kind. She always helps me find the right book. I can stay in the library for hours. Reading makes me feel happy and calm.",questions:[{type:"mcq",q:"When does the narrator visit the library?",options:["Every Sunday","Every Saturday","Every Friday","Every Monday"],answer:1,explanation:"'I go there every Saturday.'"},{type:"mcq",q:"What kind of books does the narrator love?",options:["Science books","History books","Adventure stories","Cookery books"],answer:2,explanation:"'I love reading adventure stories.'"},{type:"gap_word",sentence:"Reading makes the narrator feel happy and ___.",options:["tired","bored","calm","excited"],answer:2,explanation:"'Reading makes me feel happy and calm.'"}]},
  {id:"a2_8",level:"A2",title:"A Rainy Day",topic:"Daily Life",passage:"Yesterday it rained all day. I could not go outside. In the morning I read a book and listened to music. In the afternoon my sister and I played board games. We laughed a lot. My mother made soup for lunch. It was warm and delicious. By evening the rain stopped. I went outside and saw a beautiful rainbow. It was a lovely surprise.",questions:[{type:"mcq",q:"What did the narrator do in the morning?",options:["Watched TV and played games","Read a book and listened to music","Slept and ate breakfast","Cooked and cleaned"],answer:1,explanation:"'In the morning I read a book and listened to music.'"},{type:"mcq",q:"What did the narrator see in the evening?",options:["Clouds","Stars","A rainbow","Lightning"],answer:2,explanation:"'I went outside and saw a beautiful rainbow.'"},{type:"gap_word",sentence:"The narrator's mother made ___ for lunch.",options:["pizza","soup","rice","pasta"],answer:1,explanation:"'My mother made soup for lunch.'"}]},
  {id:"a2_9",level:"A2",title:"My Favourite Food",topic:"Food",passage:"My favourite food is pizza. I eat it every Friday with my family. We order pizza from a restaurant near our house. I like pizza with cheese and vegetables. My brother prefers pizza with meat. We always share a big pizza together. My mother makes a salad. We drink juice or water. Friday dinner is my favourite time of the week.",questions:[{type:"mcq",q:"When does the family eat pizza?",options:["Every Monday","Every Wednesday","Every Friday","Every Sunday"],answer:2,explanation:"'I eat it every Friday with my family.'"},{type:"mcq",q:"What topping does the narrator prefer?",options:["Meat","Fish","Cheese and vegetables","Onions"],answer:2,explanation:"'I like pizza with cheese and vegetables.'"},{type:"gap_word",sentence:"The family orders pizza from a restaurant ___ their house.",options:["far from","inside","near","behind"],answer:2,explanation:"'We order pizza from a restaurant near our house.'"}]},
  {id:"a2_10",level:"A2",title:"A New Friend",topic:"School",passage:"Last month, a new student joined our class. Her name is Sofia. She moved from another city. At first, Sofia was very quiet and shy. I sat next to her and showed her around the school. We had lunch together every day. Soon she started smiling and talking more. Now Sofia is one of my best friends. I am glad I helped her.",questions:[{type:"mcq",q:"How was Sofia when she first arrived?",options:["Loud and confident","Quiet and shy","Rude and unfriendly","Happy and talkative"],answer:1,explanation:"'At first, Sofia was very quiet and shy.'"},{type:"mcq",q:"What did the narrator do to help Sofia?",options:["Bought her lunch","Showed her around and had lunch with her","Introduced her to the teacher","Did homework with her"],answer:1,explanation:"'I sat next to her and showed her around the school. We had lunch together every day.'"},{type:"gap_word",sentence:"Now Sofia is one of the narrator's best ___.",options:["teachers","neighbours","friends","cousins"],answer:2,explanation:"'Now Sofia is one of my best friends.'"}]},

  // ── B1 extra ──
  {id:"b1_5",level:"B1",title:"Social Media and Teenagers",topic:"Technology",passage:"Social media platforms are used by millions of teenagers worldwide. Apps like Instagram, TikTok, and Snapchat allow young people to share photos, videos, and messages instantly. Many teenagers say social media helps them stay connected with friends and discover new interests. However, experts warn that excessive use can reduce focus and sleep quality. Comparing oneself to others online can also lower self-confidence. Parents and educators encourage young people to set time limits and take regular breaks from screens.",questions:[{type:"mcq",q:"What do experts warn about excessive social media use?",options:["It improves focus","It can reduce focus and sleep quality","It increases self-confidence","It helps with studying"],answer:1,explanation:"'experts warn that excessive use can reduce focus and sleep quality.'"},{type:"mcq",q:"What do parents and educators encourage teenagers to do?",options:["Stop using social media","Use only educational apps","Set time limits and take breaks","Post more content"],answer:2,explanation:"'Parents and educators encourage young people to set time limits and take regular breaks.'"},{type:"gap_word",sentence:"Comparing oneself to others online can lower ___.",options:["grades","weight","self-confidence","income"],answer:2,explanation:"'Comparing oneself to others online can also lower self-confidence.'"}]},
  {id:"b1_6",level:"B1",title:"Volunteering",topic:"Community",passage:"Volunteering means giving your time and skills to help others without being paid. Many people volunteer at hospitals, animal shelters, food banks, and community centres. Volunteers do tasks such as serving meals, caring for animals, teaching literacy classes, and supporting elderly people. Studies show that volunteering benefits not only the community but also the volunteers themselves. People who volunteer regularly report higher levels of happiness and a greater sense of purpose. Even a few hours a month can make a real difference.",questions:[{type:"mcq",q:"What is volunteering?",options:["Working for a high salary","Giving time to help others without pay","Starting a business","Teaching at a university"],answer:1,explanation:"'Volunteering means giving your time and skills to help others without being paid.'"},{type:"mcq",q:"According to studies, how do volunteers benefit?",options:["They earn more money","They get promoted faster","They report higher happiness and purpose","They become healthier physically"],answer:2,explanation:"'People who volunteer regularly report higher levels of happiness and a greater sense of purpose.'"},{type:"gap_word",sentence:"Even a few hours a month can make a real ___.",options:["mistake","delay","difference","profit"],answer:2,explanation:"'Even a few hours a month can make a real difference.'"}]},
  {id:"b1_7",level:"B1",title:"Healthy Eating",topic:"Health",passage:"Eating a balanced diet is one of the most important things you can do for your health. A healthy diet includes plenty of fruits and vegetables, whole grains, protein from meat or plant sources, and limited amounts of sugar and saturated fat. Eating well provides energy, improves concentration, and reduces the risk of diseases like diabetes and heart disease. However, healthy eating does not need to be expensive. Cooking meals at home, buying seasonal vegetables, and reducing takeaways are practical steps anyone can take.",questions:[{type:"mcq",q:"What does a balanced diet include?",options:["Mainly meat and dairy","Fruits, vegetables, whole grains, and protein","Only raw foods","Mostly carbohydrates"],answer:1,explanation:"'A healthy diet includes plenty of fruits and vegetables, whole grains, protein... and limited amounts of sugar and saturated fat.'"},{type:"mcq",q:"Which disease is NOT mentioned as reduced by healthy eating?",options:["Diabetes","Heart disease","Obesity","Cancer"],answer:3,explanation:"The passage mentions diabetes and heart disease but not cancer."},{type:"gap_word",sentence:"Cooking meals at home and buying ___ vegetables are practical steps.",options:["organic","seasonal","imported","frozen"],answer:1,explanation:"'buying seasonal vegetables...are practical steps anyone can take.'"}]},
  {id:"b1_8",level:"B1",title:"The History of Music",topic:"Culture",passage:"Music has existed in every human culture throughout history. The earliest instruments, such as flutes made from bone, date back over 40,000 years. In ancient civilisations, music was closely connected to religion, festivals, and storytelling. The invention of music notation in medieval Europe allowed compositions to be written down and shared. The industrial revolution led to mass production of instruments and eventually to recorded music in the twentieth century. Today, digital technology means anyone can record and share music globally within seconds.",questions:[{type:"mcq",q:"How old are the earliest known musical instruments?",options:["10,000 years","20,000 years","Over 40,000 years","100,000 years"],answer:2,explanation:"'The earliest instruments...date back over 40,000 years.'"},{type:"mcq",q:"What did music notation allow?",options:["Faster performance","Mass production of instruments","Compositions to be written down and shared","Digital recording"],answer:2,explanation:"'music notation...allowed compositions to be written down and shared.'"},{type:"gap_word",sentence:"In ancient civilisations, music was connected to religion, festivals, and ___.",options:["commerce","warfare","storytelling","architecture"],answer:2,explanation:"'music was closely connected to religion, festivals, and storytelling.'"}]},
  {id:"b1_9",level:"B1",title:"City Living vs Rural Life",topic:"Society",passage:"People around the world live either in cities or in the countryside, and both lifestyles have advantages and disadvantages. City life offers better job opportunities, access to services, and entertainment. However, cities can be noisy, expensive, and stressful. Rural life provides fresh air, open space, and a sense of community, but can be isolated and have fewer job options. In recent years, remote working has allowed some people to enjoy the best of both worlds — working for city companies while living in quieter areas.",questions:[{type:"mcq",q:"What is one disadvantage of city life mentioned?",options:["Lack of jobs","Limited entertainment","Noise and high costs","No internet access"],answer:2,explanation:"'cities can be noisy, expensive, and stressful.'"},{type:"mcq",q:"How has remote working changed things for some people?",options:["It has made cities less popular","It allows people to enjoy benefits of both city and rural life","It has increased rural poverty","It has eliminated offices"],answer:1,explanation:"'remote working has allowed some people to enjoy the best of both worlds.'"},{type:"gap_word",sentence:"Rural life provides fresh air, open space, and a sense of ___.",options:["fashion","community","ambition","competition"],answer:1,explanation:"'Rural life provides fresh air, open space, and a sense of community.'"}]},
  {id:"b1_10",level:"B1",title:"Water on Earth",topic:"Science",passage:"Water covers about 71 percent of the Earth's surface, yet only about 3 percent of all water is fresh and suitable for drinking. Most of this fresh water is frozen in glaciers and polar ice caps. Less than one percent is easily accessible in rivers, lakes, and groundwater. Access to clean water is a serious global challenge. In many developing countries, people must walk kilometres to collect water, which is often contaminated. Climate change is making water shortages worse by altering rainfall patterns and melting glaciers faster than before.",questions:[{type:"mcq",q:"What percentage of Earth's water is fresh?",options:["71 percent","50 percent","About 3 percent","10 percent"],answer:2,explanation:"'only about 3 percent of all water is fresh and suitable for drinking.'"},{type:"mcq",q:"Where is most of Earth's fresh water?",options:["In rivers and lakes","In clouds","In oceans","Frozen in glaciers and polar ice caps"],answer:3,explanation:"'Most of this fresh water is frozen in glaciers and polar ice caps.'"},{type:"gap_word",sentence:"Climate change is making water shortages worse by altering ___ patterns.",options:["traffic","rainfall","farming","trade"],answer:1,explanation:"'Climate change is making water shortages worse by altering rainfall patterns.'"}]},

  // ── B2 extra ──
  {id:"b2_5",level:"B2",title:"The Gig Economy",topic:"Economics",passage:"The gig economy refers to a labour market characterised by short-term contracts and freelance work rather than permanent employment. Platforms such as Uber, Deliveroo, and Upwork have made it easy for workers to find temporary tasks. Proponents argue that gig work offers flexibility and autonomy, allowing people to set their own hours and take on multiple clients. Critics, however, point out that gig workers typically lack job security, employee benefits such as sick pay and pensions, and stable income. The debate raises fundamental questions about how labour rights should adapt to modern digital economies.",questions:[{type:"mcq",q:"What characterises the gig economy?",options:["Long-term contracts and high salaries","Short-term contracts and freelance work","Government employment programmes","Trade union agreements"],answer:1,explanation:"'The gig economy refers to a labour market characterised by short-term contracts and freelance work.'"},{type:"mcq",q:"What do critics highlight as a weakness of gig work?",options:["Too much flexibility","Lack of security and benefits","High wages","Too many clients"],answer:1,explanation:"'gig workers typically lack job security, employee benefits...and stable income.'"},{type:"qa",q:"What fundamental question does the gig economy raise?",keywords:["labour rights","digital","adapt","modern"],explanation:"It raises 'fundamental questions about how labour rights should adapt to modern digital economies.'"}]},
  {id:"b2_6",level:"B2",title:"Architecture and Society",topic:"Culture",passage:"Architecture is far more than the design of buildings — it shapes how people feel, interact, and live. Throughout history, architectural style has reflected the values and ambitions of each era. Ancient Egyptian pyramids symbolised power and the afterlife. Gothic cathedrals embodied spiritual aspiration. Modernist glass towers celebrate efficiency and rationalism. Contemporary architects increasingly focus on sustainability, designing buildings that consume less energy, incorporate green spaces, and use recycled materials. Urban planners argue that thoughtful design can reduce crime, increase happiness, and foster a sense of community.",questions:[{type:"mcq",q:"What did Gothic cathedrals embody?",options:["Commercial success","Political power","Military strength","Spiritual aspiration"],answer:3,explanation:"'Gothic cathedrals embodied spiritual aspiration.'"},{type:"mcq",q:"What do contemporary architects increasingly focus on?",options:["Greater height","Historical recreation","Sustainability and energy efficiency","Luxury materials"],answer:2,explanation:"'Contemporary architects increasingly focus on sustainability, designing buildings that consume less energy.'"},{type:"qa",q:"According to urban planners, how can thoughtful design benefit society?",keywords:["crime","happiness","community","design"],explanation:"'thoughtful design can reduce crime, increase happiness, and foster a sense of community.'"}]},
  {id:"b2_7",level:"B2",title:"Memory and Learning",topic:"Psychology",passage:"Memory is not a single system but a collection of distinct processes. Working memory holds information temporarily for immediate use, while long-term memory stores knowledge for extended periods. Research shows that the most effective learning strategies involve active retrieval — testing yourself rather than simply re-reading. The spacing effect demonstrates that spreading study sessions over time produces better retention than cramming. Emotional experiences are often remembered more vividly because the amygdala enhances encoding when arousal is high. Understanding these mechanisms helps students adopt evidence-based study techniques.",questions:[{type:"mcq",q:"What is the most effective learning strategy according to research?",options:["Re-reading notes","Listening to lectures","Active retrieval — testing yourself","Using colour-coded notes"],answer:2,explanation:"'the most effective learning strategies involve active retrieval — testing yourself rather than simply re-reading.'"},{type:"mcq",q:"What does the spacing effect show?",options:["Cramming is most effective","Short revision is enough","Spreading sessions over time improves retention","Working memory is unlimited"],answer:2,explanation:"'The spacing effect demonstrates that spreading study sessions over time produces better retention than cramming.'"},{type:"qa",q:"Why are emotional experiences often remembered more vividly?",keywords:["amygdala","arousal","encoding","emotional"],explanation:"'the amygdala enhances encoding when arousal is high.'"}]},
  {id:"b2_8",level:"B2",title:"Globalisation and Culture",topic:"Society",passage:"Globalisation has accelerated the flow of goods, ideas, and people across borders. While it has brought economic growth and raised living standards in many regions, it has also sparked debates about cultural homogenisation. Critics argue that dominant global cultures — particularly American popular culture — are eroding local traditions, languages, and identities. However, many scholars counter that cultures are not passive recipients. Local communities adapt imported ideas, creating hybrid forms that blend global and traditional elements. This process, known as glocalisation, suggests that cultural identity can be both resilient and dynamic.",questions:[{type:"mcq",q:"What do critics fear globalisation is doing to local cultures?",options:["Strengthening them","Eroding traditions and identities","Making them wealthier","Spreading them globally"],answer:1,explanation:"'dominant global cultures...are eroding local traditions, languages, and identities.'"},{type:"mcq",q:"What is 'glocalisation'?",options:["Moving businesses overseas","The decline of local culture","Blending global and traditional cultural elements","A form of economic protectionism"],answer:2,explanation:"'Local communities adapt imported ideas, creating hybrid forms that blend global and traditional elements. This process...is glocalisation.'"},{type:"qa",q:"How do scholars argue that cultures respond to globalisation?",keywords:["adapt","hybrid","resilient","dynamic","glocalisation"],explanation:"'cultures are not passive recipients. Local communities adapt imported ideas, creating hybrid forms' — a process called glocalisation."}]},
  {id:"b2_9",level:"B2",title:"Artificial Intelligence in Everyday Life",topic:"Technology",passage:"Artificial intelligence is no longer confined to research laboratories — it is embedded in the tools billions of people use daily. Recommendation algorithms curate the music, videos, and news we consume. Natural language processing powers virtual assistants and translation apps. Machine learning models detect fraud in banking and diagnose diseases in radiology. While these applications deliver genuine convenience, they raise important concerns. Opaque algorithms can encode and amplify societal biases. Over-reliance on AI decision-making may erode human accountability. The challenge for society is to harness AI's benefits while establishing robust governance frameworks.",questions:[{type:"mcq",q:"What do recommendation algorithms do?",options:["Write code automatically","Translate languages","Curate music, videos, and news","Detect bank fraud"],answer:2,explanation:"'Recommendation algorithms curate the music, videos, and news we consume.'"},{type:"mcq",q:"What concern does the passage raise about AI algorithms?",options:["They are too slow","They can encode and amplify societal biases","They consume too much power","They are not widely available"],answer:1,explanation:"'Opaque algorithms can encode and amplify societal biases.'"},{type:"qa",q:"What does the passage identify as the key challenge for society regarding AI?",keywords:["harness","benefits","governance","accountability"],explanation:"'The challenge for society is to harness AI's benefits while establishing robust governance frameworks.'"}]},
  {id:"b2_10",level:"B2",title:"Ocean Ecosystems",topic:"Science",passage:"The world's oceans cover over 70 percent of Earth's surface and contain the most diverse ecosystems on the planet. Coral reefs, often called the rainforests of the sea, support approximately 25 percent of all marine species despite covering less than one percent of the ocean floor. Deep-sea ecosystems remain largely unexplored; creatures at extreme depths survive without sunlight through chemosynthesis. The oceans play a crucial role in regulating the global climate by absorbing carbon dioxide and distributing heat. However, rising sea temperatures, ocean acidification, and plastic pollution are threatening marine biodiversity at an unprecedented rate.",questions:[{type:"mcq",q:"Why are coral reefs compared to rainforests?",options:["They are found in tropical areas","They are large and green","They support a huge proportion of species despite small size","They produce oxygen"],answer:2,explanation:"'Coral reefs...support approximately 25 percent of all marine species despite covering less than one percent of the ocean floor.'"},{type:"mcq",q:"How do deep-sea creatures survive without sunlight?",options:["Using stored nutrients","Through photosynthesis","Through bioluminescence","Through chemosynthesis"],answer:3,explanation:"'creatures at extreme depths survive without sunlight through chemosynthesis.'"},{type:"qa",q:"What role do oceans play in regulating the global climate?",keywords:["carbon dioxide","absorbing","heat","distributing"],explanation:"'The oceans play a crucial role in regulating the global climate by absorbing carbon dioxide and distributing heat.'"}]},

  // ── C1 extra ──
  {id:"c1_5",level:"C1",title:"The Ethics of Artificial Intelligence",topic:"Ethics",passage:"As artificial intelligence systems become increasingly capable of autonomous decision-making, profound ethical questions emerge. One central concern is moral responsibility: when an AI causes harm — such as a self-driving vehicle fatally striking a pedestrian — who bears accountability? The developer, the manufacturer, or the operator? Philosophers have proposed various frameworks, from strict liability models to distributed responsibility schemes. A second concern involves algorithmic fairness: training data reflecting historical inequalities can produce models that systematically disadvantage marginalised groups. Addressing these challenges requires not only technical solutions but also governance structures that embed ethical principles into the design, deployment, and auditing of AI systems.",questions:[{type:"mcq",q:"What is the central concern about moral responsibility in AI?",options:["AI systems being too slow","Unclear accountability when AI causes harm","High costs of AI development","AI replacing all jobs"],answer:1,explanation:"'when an AI causes harm...who bears accountability? The developer, the manufacturer, or the operator?'"},{type:"mcq",q:"How does algorithmic fairness become a problem?",options:["AI systems are programmed to discriminate","Training data reflecting historical inequalities disadvantages marginalised groups","Algorithms are too complex to audit","AI has no access to historical data"],answer:1,explanation:"'training data reflecting historical inequalities can produce models that systematically disadvantage marginalised groups.'"},{type:"qa",q:"What dual approach does the passage suggest for addressing AI ethics challenges?",keywords:["technical","governance","ethical","design","auditing"],explanation:"It requires 'not only technical solutions but also governance structures that embed ethical principles into the design, deployment, and auditing of AI systems.'"}]},
  {id:"c1_6",level:"C1",title:"Narrative and Identity",topic:"Literature",passage:"Contemporary literary theorists argue that human identity is fundamentally narrative in structure. We understand ourselves by constructing stories — selecting events, imposing causality, and projecting forward to an anticipated future. Paul Ricoeur's concept of 'narrative identity' holds that the self is neither a fixed substance nor a mere illusion, but an ongoing interpretive achievement mediated through storytelling. This perspective has significant implications for psychology and therapy: autobiographical narratives can be revised, enabling people to reconstitute their identities following trauma. However, critics caution that narrative coherence can be deceptive — imposing false unity on inherently fragmented experience.",questions:[{type:"mcq",q:"What does Paul Ricoeur mean by 'narrative identity'?",options:["The self is fixed and unchanging","Identity is constructed through ongoing storytelling","People's identities are determined by others","The self is a complete illusion"],answer:1,explanation:"'the self is...an ongoing interpretive achievement mediated through storytelling.'"},{type:"mcq",q:"What therapeutic implication does narrative identity have?",options:["Trauma is irreversible","People cannot change their self-perception","Autobiographical narratives can be revised to reconstitute identity","All memories must be suppressed"],answer:2,explanation:"'autobiographical narratives can be revised, enabling people to reconstitute their identities following trauma.'"},{type:"qa",q:"What criticism is raised against narrative identity theory?",keywords:["coherence","deceptive","fragmented","false unity"],explanation:"'narrative coherence can be deceptive — imposing false unity on inherently fragmented experience.'"}]},
  {id:"c1_7",level:"C1",title:"Behavioural Economics",topic:"Economics",passage:"Classical economics assumed that human beings are rational actors who consistently maximise utility. Behavioural economics, drawing on insights from psychology, challenges this premise. Research by Kahneman and Tversky demonstrated systematic irrationalities: loss aversion (losses feel roughly twice as painful as equivalent gains), the framing effect (decisions change depending on how options are presented), and the sunk cost fallacy (continuing to invest in a failing project because of past expenditure). These findings have practical applications in public policy — 'nudge' theory uses default options and choice architecture to guide people towards beneficial behaviours without coercion.",questions:[{type:"mcq",q:"What assumption does classical economics make?",options:["People are irrational and emotional","Human beings are rational utility-maximisers","People always choose the cheapest option","Governments control economic decisions"],answer:1,explanation:"'Classical economics assumed that human beings are rational actors who consistently maximise utility.'"},{type:"mcq",q:"What is loss aversion?",options:["Refusing to invest","Losses feeling roughly twice as painful as equivalent gains","Preferring small gains to large ones","The tendency to lose money in gambling"],answer:1,explanation:"'loss aversion (losses feel roughly twice as painful as equivalent gains)'"},{type:"qa",q:"How does nudge theory apply behavioural economics to public policy?",keywords:["default","choice architecture","beneficial","coercion","guide"],explanation:"'nudge theory uses default options and choice architecture to guide people towards beneficial behaviours without coercion.'"}]},
  {id:"c1_8",level:"C1",title:"Climate Tipping Points",topic:"Science",passage:"Climate scientists warn that Earth's systems contain tipping points — thresholds beyond which self-reinforcing feedback loops drive change irreversibly. The melting of Arctic permafrost releases methane, a potent greenhouse gas, which accelerates further warming. The loss of Greenland's ice sheet would raise sea levels by approximately seven metres over centuries. Deforestation in the Amazon could transform that ecosystem from a carbon sink into a carbon source. What makes tipping points particularly dangerous is their non-linear nature: gradual change can suddenly trigger rapid, cascading consequences. Some researchers argue that multiple tipping points may interact, creating compound effects that exceed the sum of individual changes.",questions:[{type:"mcq",q:"What makes tipping points particularly dangerous?",options:["They are very common","Their linear and predictable nature","Their non-linear nature — gradual change can trigger rapid consequences","They can be easily reversed"],answer:2,explanation:"'What makes tipping points particularly dangerous is their non-linear nature: gradual change can suddenly trigger rapid, cascading consequences.'"},{type:"mcq",q:"What would the loss of Greenland's ice sheet cause?",options:["A new ice age","Sea level rise of approximately seven metres","Collapse of the Amazon","Global cooling"],answer:1,explanation:"'The loss of Greenland's ice sheet would raise sea levels by approximately seven metres over centuries.'"},{type:"qa",q:"Why might multiple tipping points interacting be especially concerning?",keywords:["compound","cascading","exceed","interact","sum"],explanation:"'multiple tipping points may interact, creating compound effects that exceed the sum of individual changes.'"}]},
  {id:"c1_9",level:"C1",title:"Post-Colonial Identity",topic:"History",passage:"Post-colonial theory examines the lasting cultural, psychological, and political legacies of colonialism. Frantz Fanon argued that colonial rule damaged not only the material conditions of colonised peoples but their sense of self — a process he termed 'psychic alienation.' The colonised were compelled to internalise the coloniser's language, values, and history, effectively erasing indigenous identity. Homi Bhabha introduced the concept of 'hybridity' — the idea that colonised subjects do not simply replicate or reject colonial culture, but produce something new at the border between cultures. This hybrid space, he argued, is a site of both ambivalence and creative resistance.",questions:[{type:"mcq",q:"What did Fanon mean by 'psychic alienation'?",options:["Physical displacement","Economic poverty caused by colonialism","The psychological damage of internalising the coloniser's values","Political exile"],answer:2,explanation:"'colonial rule damaged...their sense of self — a process he termed psychic alienation.'"},{type:"mcq",q:"What is Bhabha's concept of 'hybridity'?",options:["The mixing of languages only","The complete adoption of colonial culture","A new cultural form produced at the border between cultures","The rejection of all colonial influence"],answer:2,explanation:"'colonised subjects...produce something new at the border between cultures.'  This is hybridity."},{type:"qa",q:"What does Bhabha argue about the hybrid space between cultures?",keywords:["ambivalence","creative","resistance","border","site"],explanation:"'This hybrid space...is a site of both ambivalence and creative resistance.'"}]},
  {id:"c1_10",level:"C1",title:"The Microbiome",topic:"Biology",passage:"The human microbiome — the trillions of microorganisms inhabiting the body, particularly the gut — is increasingly recognised as a critical component of health. Far from being passive residents, gut bacteria actively participate in digestion, synthesise vitamins, regulate the immune system, and even influence mood via the gut-brain axis. Disruptions to the microbiome, known as dysbiosis, have been associated with conditions ranging from inflammatory bowel disease to obesity and depression. Modern lifestyles — including antibiotic overuse, highly processed diets, and reduced exposure to natural environments — are thought to impoverish microbial diversity. Researchers are investigating probiotics, prebiotics, and faecal transplants as therapeutic interventions.",questions:[{type:"mcq",q:"What is the gut-brain axis?",options:["A surgical procedure","The pathway through which gut bacteria influence mood","A type of probiotic treatment","The connection between diet and intelligence"],answer:1,explanation:"'gut bacteria...influence mood via the gut-brain axis.'"},{type:"mcq",q:"What is dysbiosis?",options:["A vitamin deficiency","Over-production of gut bacteria","Disruption to the microbiome","A form of probiotic"],answer:2,explanation:"'Disruptions to the microbiome, known as dysbiosis, have been associated with conditions...'"},{type:"qa",q:"What aspects of modern lifestyles are thought to harm the microbiome?",keywords:["antibiotic","processed","diversity","natural","impoverish"],explanation:"'antibiotic overuse, highly processed diets, and reduced exposure to natural environments are thought to impoverish microbial diversity.'"}]},

  // ── C2 extra ──
  {id:"c2_5",level:"C2",title:"The Anthropocene",topic:"Science",passage:"Geologists have proposed designating the current epoch the Anthropocene — a term acknowledging that human activity has become the dominant force shaping Earth's geology and ecosystems. Stratigraphic evidence includes novel radioisotopes from nuclear testing, a ubiquitous layer of microplastics, altered nitrogen and phosphorus cycles, and accelerating species extinction. The designation, while not yet formally ratified, carries profound philosophical weight: it compels humanity to confront its status as a geological actor responsible for consequences extending across millennia. Critics of the term argue that it risks naturalising environmental destruction by framing it as an epoch rather than a crisis demanding urgent political response.",questions:[{type:"mcq",q:"What stratigraphic evidence supports the Anthropocene designation?",options:["Volcanic activity increases","Radioisotopes, microplastics, and altered biogeochemical cycles","Shifts in tectonic plates","Variations in solar output"],answer:1,explanation:"'Stratigraphic evidence includes novel radioisotopes...microplastics, altered nitrogen and phosphorus cycles, and accelerating species extinction.'"},{type:"mcq",q:"What risk do critics identify in using the term Anthropocene?",options:["It exaggerates human power","It naturalises environmental destruction by framing it as an epoch","It ignores geological evidence","It places blame on individual humans"],answer:1,explanation:"'it risks naturalising environmental destruction by framing it as an epoch rather than a crisis.'"},{type:"qa",q:"What philosophical implication does the Anthropocene designation carry?",keywords:["geological actor","responsibility","millennia","confront","consequences"],explanation:"'It compels humanity to confront its status as a geological actor responsible for consequences extending across millennia.'"}]},
  {id:"c2_6",level:"C2",title:"Moral Relativism",topic:"Philosophy",passage:"Moral relativism is the metaethical position that moral judgements are true or false only relative to a particular cultural or individual framework, with no universal standards to adjudicate between them. Descriptive relativism merely observes that moral beliefs vary across cultures; normative relativism goes further, claiming that this diversity is itself morally significant and that external moral critique is unwarranted. Philosophers such as James Rachels have challenged relativism by noting that it entails paralysing consequences: if morality is purely relative, we cannot condemn historical atrocities or argue for human rights. Proponents counter that universalism masks culturally specific values as objective truths, serving ideological ends.",questions:[{type:"mcq",q:"What distinguishes normative from descriptive relativism?",options:["Descriptive relativism denies moral variation","Normative relativism merely observes moral diversity","Normative relativism claims external moral critique is unwarranted","They are identical positions"],answer:2,explanation:"'Descriptive relativism merely observes that moral beliefs vary...normative relativism goes further, claiming...external moral critique is unwarranted.'"},{type:"mcq",q:"What paralysing consequence of relativism does Rachels identify?",options:["It makes ethical debate impossible","We cannot condemn historical atrocities or argue for human rights","It leads to moral nihilism only","It collapses all moral distinctions"],answer:1,explanation:"'if morality is purely relative, we cannot condemn historical atrocities or argue for human rights.'"},{type:"qa",q:"How do proponents of relativism respond to universalist arguments?",keywords:["universalism","masks","culturally specific","ideological","objective"],explanation:"'universalism masks culturally specific values as objective truths, serving ideological ends.'"}]},
  {id:"c2_7",level:"C2",title:"Dark Matter and Cosmology",topic:"Science",passage:"Approximately 27 percent of the universe is believed to consist of dark matter — a substance that interacts gravitationally but emits, absorbs, or reflects no electromagnetic radiation, rendering it invisible to current instruments. Its existence is inferred from the anomalous rotation curves of galaxies, gravitational lensing observations, and the large-scale structure of the cosmos. Despite decades of research, dark matter has not been directly detected; its constituent particle — whether an axion, a weakly interacting massive particle (WIMP), or something entirely novel — remains unknown. The failure to detect WIMPs at particle accelerators has prompted cosmologists to broaden theoretical frameworks substantially.",questions:[{type:"mcq",q:"How do scientists infer the existence of dark matter?",options:["By observing its light emissions","Through direct laboratory experiments","From gravitational effects, galaxy rotation curves, and lensing","By measuring its radioactive decay"],answer:2,explanation:"'Its existence is inferred from the anomalous rotation curves of galaxies, gravitational lensing observations, and the large-scale structure of the cosmos.'"},{type:"mcq",q:"What has prompted cosmologists to broaden their theoretical frameworks?",options:["Discovery of a new particle","Dark matter emitting unexpected radiation","Failure to detect WIMPs at accelerators","Confirmation of the axion model"],answer:2,explanation:"'The failure to detect WIMPs at particle accelerators has prompted cosmologists to broaden theoretical frameworks substantially.'"},{type:"qa",q:"What is the fundamental challenge that dark matter presents to physics?",keywords:["invisible","detect","particle","unknown","electromagnetic"],explanation:"Dark matter 'emits, absorbs, or reflects no electromagnetic radiation,' making it undetectable with current instruments, and its constituent particle 'remains unknown.'"}]},
  {id:"c2_8",level:"C2",title:"The Limits of Language",topic:"Linguistics",passage:"Wittgenstein's later philosophy introduced the concept of language games — the idea that words acquire meaning not from picturing facts but from their use within specific forms of life. This fundamentally challenged the representationalist view that language is a mirror of reality. The Sapir-Whorf hypothesis, in its strong form, proposes that the language one speaks shapes — or even determines — the categories in which one thinks. Empirical evidence supports a weaker version: speakers of languages with richer spatial or temporal vocabulary do show measurable differences in cognitive tasks. Yet critics contend that the universality of certain logical concepts across languages suggests cognitive architecture independent of linguistic structures.",questions:[{type:"mcq",q:"What does Wittgenstein's concept of 'language games' argue?",options:["Language mirrors reality precisely","Words gain meaning from their use within specific forms of life","All languages are logically equivalent","Meaning is determined by grammar alone"],answer:1,explanation:"'words acquire meaning not from picturing facts but from their use within specific forms of life.'"},{type:"mcq",q:"What does evidence support regarding the Sapir-Whorf hypothesis?",options:["The strong form — language determines thought","The hypothesis is entirely false","A weaker version — richer vocabulary correlates with cognitive differences","No relation between language and cognition"],answer:2,explanation:"'Empirical evidence supports a weaker version: speakers of languages with richer...vocabulary do show measurable differences in cognitive tasks.'"},{type:"qa",q:"What evidence do critics use to challenge the strong Sapir-Whorf hypothesis?",keywords:["universality","logical","cognitive architecture","independent","languages"],explanation:"'the universality of certain logical concepts across languages suggests cognitive architecture independent of linguistic structures.'"}]},
  {id:"c2_9",level:"C2",title:"Free Will and Determinism",topic:"Philosophy",passage:"The problem of free will asks whether human choices are genuinely self-originated or merely the inevitable product of prior causes — neural states, genetics, upbringing, and physical laws. Hard determinists argue that every event, including mental states, is causally necessitated; free will is thus an illusion. Libertarians (in the metaphysical sense) maintain that at least some actions escape causal determination, perhaps via quantum indeterminacy or irreducible agency. Compatibilists offer a middle path: free will and determinism are not mutually exclusive; genuine freedom consists in acting according to one's own desires and reasons unimpeded by external coercion, regardless of whether those desires are causally determined.",questions:[{type:"mcq",q:"What is the compatibilist position on free will?",options:["Free will is a complete illusion","Quantum mechanics makes all actions free","Free will and determinism can coexist — freedom means acting on one's own desires uncoerced","Only libertarianism preserves genuine freedom"],answer:2,explanation:"'Compatibilists offer a middle path: free will and determinism are not mutually exclusive; genuine freedom consists in acting according to one's own desires...unimpeded by external coercion.'"},{type:"mcq",q:"How do libertarians (metaphysical) argue against hard determinism?",options:["By denying causality altogether","By claiming quantum indeterminacy or irreducible agency allows some actions to escape causal determination","By accepting determinism but denying its moral implications","By arguing consciousness is non-physical"],answer:1,explanation:"'Libertarians...maintain that at least some actions escape causal determination, perhaps via quantum indeterminacy or irreducible agency.'"},{type:"qa",q:"What does hard determinism conclude about the nature of free will?",keywords:["illusion","causally necessitated","prior causes","mental states"],explanation:"'Hard determinists argue that every event, including mental states, is causally necessitated; free will is thus an illusion.'"}]},
  {id:"c2_10",level:"C2",title:"Tragedy and Catharsis",topic:"Literature",passage:"Aristotle defined tragedy as an imitation of a serious, complete action of sufficient magnitude, effecting through pity and fear the catharsis of such emotions. The notion of catharsis — typically translated as purging or purification — has generated centuries of scholarly debate. Some interpret it medically: tragedy evacuates pent-up emotions, restoring psychological equilibrium. Others read it cognitively: through engaging with fictional suffering, audiences refine their emotional intelligence and moral understanding. Nietzsche challenged the Aristotelian account entirely, arguing that tragedy's power lies not in purging suffering but in affirming it — confronting the Dionysian chaos of existence without retreating into comforting illusions. Contemporary theorists draw on both traditions to analyse how narrative art mediates human responses to mortality and injustice.",questions:[{type:"mcq",q:"What is the medical interpretation of catharsis?",options:["Tragedy teaches moral lessons","Tragedy evacuates pent-up emotions, restoring psychological equilibrium","Tragedy reinforces social norms","Tragedy provides intellectual pleasure only"],answer:1,explanation:"'Some interpret it medically: tragedy evacuates pent-up emotions, restoring psychological equilibrium.'"},{type:"mcq",q:"How does Nietzsche's view of tragedy differ from Aristotle's?",options:["He agreed catharsis purges suffering","He argued tragedy's power lies in affirming rather than purging suffering","He claimed tragedy was morally harmful","He rejected all emotional responses to art"],answer:1,explanation:"'Nietzsche...arguing that tragedy's power lies not in purging suffering but in affirming it.'"},{type:"qa",q:"What do contemporary theorists examine, drawing on both Aristotelian and Nietzschean traditions?",keywords:["narrative","mediates","mortality","injustice","responses"],explanation:"'Contemporary theorists...analyse how narrative art mediates human responses to mortality and injustice.'"}]},
];

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
    var r=await fetch("/.netlify/functions/storage?key="+encodeURIComponent(key));
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
async function getSessionToken(name,hash){
  try{
    var r=await fetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name,hash:hash})});
    if(r.ok){var d=await r.json();if(d.token){_sessionToken=d.token;}}
  }catch(e){}
}
async function apiSet(key,val){
  var str=JSON.stringify(val);
  try{localStorage.setItem(key,str);}catch(e){}  // always write locally first
  try{
    var hdrs={"Content-Type":"application/json"};
    if(_sessionToken)hdrs["Authorization"]="Bearer "+_sessionToken;
    var r=await fetch("/.netlify/functions/storage",{method:"POST",headers:hdrs,body:JSON.stringify({key:key,value:str})});
    if(!r.ok&&r.status!==401){console.warn("Firebase write failed for key "+key+": status "+r.status);}
    if(r.status===401&&_sessionToken){
      var creds=null;try{creds=JSON.parse(localStorage.getItem(CREDS_KEY));}catch(e2){}
      if(creds&&creds.name&&creds.hash){
        await getSessionToken(creds.name,creds.hash);
        if(_sessionToken){
          hdrs["Authorization"]="Bearer "+_sessionToken;
          var r2=await fetch("/.netlify/functions/storage",{method:"POST",headers:hdrs,body:JSON.stringify({key:key,value:str})});
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
  var profiles=trimmed.map(function(usr){return {name:usr.name,games:usr.games,joined:usr.joined};});
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
async function loadSocial(){var v=await apiGet(SOCIAL_KEY);return v||{};}
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
function loadQuotes(){try{var v=localStorage.getItem(QUOTES_KEY);return v?JSON.parse(v):[];}catch(e){return[];}}
function saveQuotesLocal(v){try{localStorage.setItem(QUOTES_KEY,JSON.stringify(v));}catch(e){}}
function generateClassCode(){var c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",r="";for(var i=0;i<6;i++)r+=c[Math.floor(Math.random()*c.length)];return r;}
async function loadClasses(){try{var v=await apiGet(CLASSES_KEY);if(v&&Array.isArray(v))return v;}catch(e){}try{var lv=localStorage.getItem(CLASSES_KEY);return lv?JSON.parse(lv):[];}catch(e){return[];}}
async function saveClassesRemote(v){try{localStorage.setItem(CLASSES_KEY,JSON.stringify(v));}catch(e){}try{await apiSet(CLASSES_KEY,v);}catch(e){}}
async function loadAssignments(){try{var v=await apiGet(ASSIGNMENTS_KEY);if(v&&Array.isArray(v))return v;}catch(e){}try{var lv=localStorage.getItem(ASSIGNMENTS_KEY);return lv?JSON.parse(lv):[];}catch(e){return[];}}
async function saveAssignmentsRemote(v){try{localStorage.setItem(ASSIGNMENTS_KEY,JSON.stringify(v));}catch(e){}try{await apiSet(ASSIGNMENTS_KEY,v);}catch(e){}}

// ── social helpers ────────────────────────────────────────────
function getSocial(social,name){return social[name]||{friends:[],requests:[],likes:0,challenges:[]};}

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

function doLikeProfile(social,liker,target){
  var n=JSON.parse(JSON.stringify(social));
  if(!n._likes)n._likes={};
  var key=liker+"->"+target;
  if(n._likes[key])return{ok:false,social:n,err:"Already liked"};
  n._likes[key]=true;
  if(!n[target])n[target]={friends:[],requests:[],likes:0,challenges:[]};
  n[target].likes=(n[target].likes||0)+1;
  return{ok:true,social:n};
}

function hasLiked(social,liker,target){return!!(social._likes&&social._likes[liker+"->"+target]);}

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
  var raw=text.match(/[^.!?]+[.!?]*/g)||[text];
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
  var maxXp=Math.max.apply(null,games.map(function(g){return g.xp;}));
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
        <path d={pathData} stroke="#818cf8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

        {/* data points */}
        {points.map(function(p,i){
          return(
            <g key={"point-"+i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#818cf8" opacity="0.6"/>
              <circle cx={p.x} cy={p.y} r="5.5" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.3"/>
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
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
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
      {parts[0]}<span style={{display:"inline-block",minWidth:70,borderBottom:"2px solid #818cf8",textAlign:"center",padding:"0 4px",color:conf?(sel===q.answer?"#34d399":"#ef4444"):"#818cf8",fontWeight:700}}>{sel!==null?q.options[sel]:"_____"}</span>{parts[1]}
    </div>
    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
      {q.options.map(function(opt,i){
        var isOk=i===q.answer,isSel=i===sel;
        var bg="rgba(255,255,255,0.05)",bd="1px solid rgba(255,255,255,0.1)",col="#e5e7eb";
        if(conf){if(isOk){bg="rgba(52,211,153,0.15)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.15)";bd="1px solid #ef4444";col="#ef4444";}}
        else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
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
      {parts[0]}<span style={{display:"inline-block",background:conf?(sel===q.answer?"rgba(52,211,153,0.2)":"rgba(239,68,68,0.2)"):"rgba(99,102,241,0.15)",border:"1px dashed "+(conf?(sel===q.answer?"#34d399":"#ef4444"):"#818cf8"),borderRadius:6,padding:"1px 6px",color:conf?(sel===q.answer?"#34d399":"#ef4444"):"#818cf8",fontWeight:700,margin:"0 4px"}}>{sel!==null?q.options[sel]:"[ select ]"}</span>{parts[1]}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {q.options.map(function(opt,i){
        var isOk=i===q.answer,isSel=i===sel;
        var bg="rgba(255,255,255,0.04)",bd="1px solid rgba(255,255,255,0.1)",col="#9ca3af";
        if(conf){if(isOk){bg="rgba(52,211,153,0.1)";bd="1px solid #34d399";col="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";bd="1px solid #ef4444";col="#ef4444";}}
        else if(isSel){bg="rgba(99,102,241,0.15)";bd="1px solid #818cf8";col="#c7d2fe";}
        return(<button key={i} onClick={function(){if(!conf)onSel(i);}} style={{background:bg,border:bd,borderRadius:8,padding:"9px 10px",color:col,fontSize:12,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left"}}>
          <span style={{color:"#6366f1",fontWeight:700,marginRight:6}}>{["A","B","C","D"][i]}.</span>{opt}
        </button>);
      })}
    </div>
  </div>);
}

function MatchingQ(props){
  var q=props.q,matches=props.matches,conf=props.conf,onMatch=props.onMatch,shuffled=props.shuffled;
  var [activeLeft,setActiveLeft]=useState(null);
  function clickLeft(i){if(conf)return;setActiveLeft(i===activeLeft?null:i);}
  function clickRight(ri){if(conf||activeLeft===null)return;onMatch(activeLeft,ri);setActiveLeft(null);}
  return(<div>
    <p style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>Tap a left item then tap its match on the right.</p>
    <div style={{display:"flex",gap:8}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        {q.lefts.map(function(l,i){
          var matched=matches&&matches[i]!==undefined;
          var ok=conf&&matched&&matches[i]===q.correctPairs[i];
          var bad=conf&&matched&&matches[i]!==q.correctPairs[i];
          return(<button key={i} onClick={function(){clickLeft(i);}} style={{background:activeLeft===i?"rgba(99,102,241,0.3)":matched?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)",border:"1px solid "+(activeLeft===i?"#818cf8":ok?"#34d399":bad?"#ef4444":"rgba(255,255,255,0.1)"),borderRadius:8,padding:"9px 10px",color:ok?"#34d399":bad?"#ef4444":activeLeft===i?"#c7d2fe":"#e5e7eb",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
            {l}{matched&&<span style={{float:"right",opacity:0.5,fontSize:9}}>{q.rights[matches[i]]}</span>}
          </button>);
        })}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
        {shuffled.map(function(r,ri){
          var origIdx=q.rights?q.rights.indexOf(r):ri;var used=matches&&Object.values(matches).indexOf(origIdx)!==-1;
          return(<button key={ri} onClick={function(){clickRight(ri);}} style={{background:used?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)",border:"1px solid "+(activeLeft!==null&&!conf?"rgba(99,102,241,0.4)":"rgba(255,255,255,0.1)"),borderRadius:8,padding:"9px 10px",color:used?"#6b7280":"#e5e7eb",fontSize:12,cursor:conf?"default":"pointer",fontFamily:"inherit",textAlign:"left"}}>
            {r}
          </button>);
        })}
      </div>
    </div>
    {conf&&(<div style={{marginTop:8,fontSize:11,color:"#d1fae5"}}>
      {q.lefts.map(function(l,i){var ok=matches&&matches[i]===q.correctPairs[i];return<div key={i}>{ok?"✓":"✕"} {l} = {q.rights[q.correctPairs[i]]}</div>;})}
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
            else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
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
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
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
      else if(isSel){bg="rgba(99,102,241,0.2)";bd="1px solid #818cf8";col="#818cf8";}
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
    iv.current=setInterval(function(){setSecs(function(s){if(s<=1){clearInterval(iv.current);props.onExpire();return 0;}return s-1;});},1000);
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
  var [selectedTypes,setSelectedTypes]=useState(["mcq","gap_word","gap_sentence","matching","heading","qa"]);
  var [appTheme,setAppTheme]=useState(function(){try{return JSON.parse(localStorage.getItem("rq-theme")||"null")||null;}catch{return null;}});
  var [passage,setPassage]=useState("");
  var [topic,setTopic]=useState("");
  var [customTopic,setCustomTopic]=useState("");
  var [passageLang,setPassageLang]=useState("English");
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
  var [totalXpSoFar,setTotalXpSoFar]=useState(0);
  var [showPassage,setShowPassage]=useState(false);
  var [timerRunning,setTimerRunning]=useState(false);
  var startTimeRef=useRef(null);
  var [timeExpired,setTimeExpired]=useState(false);
  var [challengeMode,setChallengeMode]=useState(false);
  var [genLoading,setGenLoading]=useState(false);
  var [result,setResult]=useState(null);
  var [reviewQueue,setReviewQueue]=useState([]);
  var [reviewIdx,setReviewIdx]=useState(0);
  var [reviewAns,setReviewAns]=useState(null);
  var [reviewConfirmed,setReviewConfirmed]=useState(false);
  // ui
  var [stage,setStage]=useState("auth");
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
  // Feature 2 - Placement Test
  var [showPlacement,setShowPlacement]=useState(false);
  var [placementAnswers,setPlacementAnswers]=useState({});
  var [placementResult,setPlacementResult]=useState(null);
  // Feature 3 - Sentence Saver / Quote Book
  var [quotes,setQuotes]=useState(function(){return loadQuotes();});
  var [quotesSaved,setQuotesSaved]=useState(false);
  // Feature 4 - Notifications
  var [notifPermission,setNotifPermission]=useState(typeof Notification!=="undefined"?Notification.permission:"denied");
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
  var [onboardClassCode,setOnboardClassCode]=useState("");
  var [libSubjectFilter,setLibSubjectFilter]=useState("");
  var [reportData,setReportData]=useState(null);
  var [shareLink,setShareLink]=useState("");
  var [shareLinkCopied,setShareLinkCopied]=useState(false);
  var [milestoneSeen,setMilestoneSeen]=useState(false);
  var [portfolioShareData,setPortfolioShareData]=useState(null);
  var [portfolioLink,setPortfolioLink]=useState("");
  var [portfolioLinkCopied,setPortfolioLinkCopied]=useState(false);

  useEffect(function(){
    try{var params=new URLSearchParams(window.location.search);var rep=params.get("report");if(rep){var rd=JSON.parse(decodeURIComponent(escape(atob(rep))));setReportData(rd);setStage("report");setAppReady(true);return;}var pf=params.get("portfolio");if(pf){var pd=JSON.parse(decodeURIComponent(escape(atob(pf))));setPortfolioShareData(pd);setStage("portfolioShare");setAppReady(true);return;}}catch(e){}
    var saved=localStorage.getItem("rq-session");
    var savedCreds=null;
    try{savedCreds=JSON.parse(localStorage.getItem(CREDS_KEY));}catch(e){}
    Promise.all([loadUsers(),loadBoards(),loadSocial(),loadClasses(),loadAssignments()]).then(function(v){
      setAllUsers(v[0]);setBoards(v[1]);setSocial(v[2]);setClasses(v[3]||[]);setAssignments(v[4]||[]);
      var sessionName=saved||(savedCreds&&savedCreds.name);
      if(sessionName){var found=null;for(var i=0;i<v[0].length;i++){if(v[0][i].name===sessionName){found=v[0][i];break;}}if(found){var sh=savedCreds&&savedCreds.hash?savedCreds.hash:null;if(sh){getSessionToken(sessionName,sh);found=Object.assign({},found,{hash:sh});}setCurrentUser(found);var role=localStorage.getItem("rq-role-"+found.name);if(role==="teacher"&&!localStorage.getItem("rq-onboarded-"+found.name))setOnboardStep(1);setStage(role==="teacher"?"teacherDashboard":"home");}}
      setAppReady(true);
    });
  },[]);

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
    var today=new Date().toLocaleDateString();
    loadVocab().then(function(v){setAllVocab(v||{});setVocab((v&&v[currentUser.name])||[]);});
    loadDaily().then(function(d){if(d&&d.date===today)setDailyChallenge(d);});
    var doneRaw=null;try{doneRaw=JSON.parse(localStorage.getItem("rq-daily-done-"+currentUser.name));}catch(e){}
    setDailyDone(doneRaw&&doneRaw.date===today?doneRaw:null);
    loadDailyLb().then(function(lb){setDailyLb((lb&&lb[today])||[]);});
    var todayQuests=getDayQuests(today);setDailyQuests(todayQuests);
    var qDoneRaw=null;try{qDoneRaw=JSON.parse(localStorage.getItem("rq-quests-"+currentUser.name+"-"+today));}catch(e){}
    setQuestsDone(qDoneRaw||{});
    loadFavs().then(function(f){setAllFavs(f||{});setFavs((f&&f[currentUser.name])||[]);});
    loadWeeklyLb().then(function(w){var wk=getWeekId();setWeeklyLb((w&&w[wk])||[]);});
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
    setReviewQueue(rqd||[]);
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

  var lv=getLv(level);
  var q=questions&&questions.length>current?questions[current]:null;

  // ── auth ──────────────────────────────────────────────────
  async function doRegister(){
    setAuthErr("");
    if(!nameInput.trim()||!passInput.trim()){setAuthErr("Name and password required.");return;}
    if(!/^[a-zA-Z0-9_]{2,30}$/.test(nameInput.trim())){setAuthErr("Username must be 2–30 characters: letters, numbers, underscores only.");return;}
    if(passInput.length<4){setAuthErr("Password must be at least 4 characters.");return;}
    var hash=await enc(passInput);
    var r=await fetch(REGISTER,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nameInput.trim(),hash:hash})});
    var d=await r.json();
    if(!d){setAuthErr("Server error: invalid response.");return;}
    if(r.status===429){setAuthErr("Too many attempts. Please wait 15 minutes.");return;}
    if(!r.ok){setAuthErr(d.error==="Username taken"?"Username taken.":(d.error||"Registration failed. Try again."));return;}
    _sessionToken=d.token;
    var user={name:nameInput.trim(),hash:hash,games:[],joined:new Date().toLocaleDateString()};
    var fresh=await loadUsers();setAllUsers(fresh);
    localStorage.setItem("rq-session",user.name);
    localStorage.setItem(CREDS_KEY,JSON.stringify({name:user.name,hash:hash}));
    if(isTeacherReg)localStorage.setItem("rq-role-"+user.name,"teacher");
    setCurrentUser(user);setStage(isTeacherReg?"teacherDashboard":"home");
    if(isTeacherReg)setOnboardStep(1);
  }

  async function doLogin(){
    setAuthErr("");
    if(!nameInput.trim()||!passInput.trim()){setAuthErr("Please enter name and password.");return;}
    var sha256=await enc(passInput);
    var r=await fetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nameInput.trim(),hash:sha256})});
    var d=await r.json();
    if(!d){setAuthErr("Server error: invalid response.");return;}
    if(r.status===429){setAuthErr("Too many login attempts. Please wait 15 minutes.");return;}
    if(!r.ok){setAuthErr("User not found or wrong password.");return;}
    _sessionToken=d.token;
    var fresh=await loadUsers();setAllUsers(fresh);
    var found=null;for(var i=0;i<fresh.length;i++){if(fresh[i].name.toLowerCase()===nameInput.trim().toLowerCase()){found=fresh[i];break;}}
    if(!found){setAuthErr("Account error. Please try again.");return;}
    found=Object.assign({},found,{hash:sha256});
    localStorage.setItem("rq-session",found.name);
    localStorage.setItem(CREDS_KEY,JSON.stringify({name:found.name,hash:sha256}));
    var role=localStorage.getItem("rq-role-"+found.name);
    setCurrentUser(found);setStage(role==="teacher"?"teacherDashboard":"home");
  }

  // ── teacher class actions ───────────────────────────────────
  async function doCreateClass(){
    if(!currentUser||!newClassName.trim())return;
    var code=generateClassCode();
    var cls={id:code,name:newClassName.trim(),teacherName:currentUser.name,students:[],created:new Date().toLocaleDateString(),targetLevel:"B1"};
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
    if(cls.students.indexOf(currentUser.name)!==-1){setJoinClassMsg("You are already in "+cls.name+"!");return;}
    var updated=classes.map(function(c){
      if(c.id!==code)return c;
      return Object.assign({},c,{students:c.students.concat([currentUser.name])});
    });
    setClasses(updated);
    setJoinClassCode("");
    setJoinClassMsg("✓ Joined "+cls.name+"!");
    await saveClassesRemote(updated);
  }

  // ── assignment actions ──────────────────────────────────────
  async function doCreateAssignment(){
    if(!currentUser||!currentClass)return;
    setAssignMsg("");
    if(assignType==="library"&&!assignStoryId){setAssignMsg("Select a story first.");return;}
    if(assignType==="ai_topic"&&!assignTopic.trim()){setAssignMsg("Enter a topic first.");return;}
    if(assignType==="custom_text"&&assignCustomText.trim().length<30){setAssignMsg("Paste at least 30 characters of text.");return;}
    setAssignLoading(true);
    var id="asgn-"+Date.now();
    var base={id:id,classId:currentClass.id,teacherName:currentUser.name,type:assignType,dueDate:assignDue||null,createdAt:new Date().toISOString(),completions:{}};
    var asgn;
    if(assignType==="library"){
      var story=STORY_LIBRARY.find(function(s){return s.id===assignStoryId;});
      asgn=Object.assign({},base,{storyId:assignStoryId,topic:story?story.title:"Library Story",level:story?story.level:assignLevel,passage:null,questions:null});
    } else if(assignType==="custom_text"){
      try{
        var rc=await fetch("/.netlify/functions/quiz-from-text",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({passage:assignCustomText.trim(),level:assignLevel,types:["mcq","gap_word","qa","tfnm"]})});
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
    // update currentClass ref so UI refreshes
    setCurrentClass(Object.assign({},currentClass));
    await saveAssignmentsRemote(updated);
  }

  function doCompleteAssignment(asgnId,pct,xp,timeSecs){
    if(!currentUser)return;
    setAssignments(function(prev){
      var updated=prev.map(function(a){
        if(a.id!==asgnId)return a;
        var comps=Object.assign({},a.completions);
        comps[currentUser.name]={pct:pct,xp:xp,timeSecs:timeSecs,completedAt:new Date().toISOString()};
        return Object.assign({},a,{completions:comps});
      });
      saveAssignmentsRemote(updated);
      return updated;
    });
  }

  function doExportClassCSV(){
    if(!currentClass||!allUsers)return;
    var Q_TYPES=["mcq","gap_word","gap_sentence","matching","heading","qa","tfnm","ynng"];
    var headers=["Student","Best Level","Games","Avg Score %","Avg WPM"].concat(Q_TYPES.map(function(t){return Q_LABELS[t]+" %";})).concat(["Vocab Words","Last Active"]);
    var rows=currentClass.students.map(function(sName){
      var u=allUsers.find(function(u){return u.name===sName;});
      var games=u&&u.games?u.games:[];
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
      var vocabCount=0;try{var vd=JSON.parse(localStorage.getItem(VOCAB_KEY)||"[]");if(Array.isArray(vd))vocabCount=vd.length;}catch(e){}
      return[sName,bestLv,games.length,avgPct,avgWpm].concat(typeScores).concat([vocabCount,lastDate]);
    });
    var csv=[headers].concat(rows).map(function(r){return r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"';}).join(",");}).join("\n");
    var blob=new Blob([csv],{type:"text/csv"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");a.href=url;a.download=currentClass.name.replace(/\s+/g,"_")+"_analytics.csv";a.click();
    URL.revokeObjectURL(url);
  }

  async function doPostAnnouncement(){
    if(!currentClass||!currentUser||!announcementText.trim())return;
    var updated=classes.map(function(c){
      if(c.id!==currentClass.id)return c;
      return Object.assign({},c,{announcement:{text:announcementText.trim(),date:new Date().toLocaleDateString(),teacherName:currentUser.name}});
    });
    setClasses(updated);
    setCurrentClass(updated.find(function(c){return c.id===currentClass.id;}));
    setAnnouncementText("");
    setAnnouncementMsg("✓ Posted!");
    setTimeout(function(){setAnnouncementMsg("");},3000);
    await saveClassesRemote(updated);
  }

  async function doClearAnnouncement(){
    var updated=classes.map(function(c){
      if(c.id!==currentClass.id)return c;
      var n=Object.assign({},c);delete n.announcement;return n;
    });
    setClasses(updated);
    setCurrentClass(updated.find(function(c){return c.id===currentClass.id;}));
    await saveClassesRemote(updated);
  }

  function doFinishOnboarding(){
    if(currentUser)localStorage.setItem("rq-onboarded-"+currentUser.name,"true");
    setOnboardStep(null);setOnboardClassCode("");
  }

  function doOnboardCreateClass(){
    if(!currentUser||!newClassName.trim())return;
    var code=generateClassCode();
    var cls={id:code,name:newClassName.trim(),teacherName:currentUser.name,students:[],created:new Date().toLocaleDateString(),announcement:null};
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
    var report={n:sName,t:currentClass?currentClass.teacherName:"",c:currentClass?currentClass.name:"",d:new Date().toLocaleDateString(),l:getBestLevel(pg),g:pg.length,s:avgPct,w:avgWpm,tr:trend,q:qBreakdown,r:pg.slice(-5).map(function(g){return{d:g.date,p:g.pct,l:g.level};})};
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
    var data={n:currentUser.name,g:pg.length,xp:currentUser.totalXp||0,bs:bestPct,bw:bestWpm,ls:longestStreak,lv:getBestLevel(pg),fs:favSubj,lb:lvBreak,d:new Date().toLocaleDateString()};
    var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    return window.location.origin+window.location.pathname+"?portfolio="+encoded;
  }

  // ── social actions ─────────────────────────────────────────
  async function sendRequest(to){
    if(!currentUser||to===currentUser.name)return;
    var r=doSendRequest(social,currentUser.name,to);
    if(!r.ok){setSocialMsg(r.err);return;}
    await saveSocial(r.social);setSocial(r.social);setSocialMsg("Request sent to "+to+"!");
  }

  async function acceptRequest(from){
    var n=doAcceptRequest(social,currentUser.name,from);
    await saveSocial(n);setSocial(n);setSocialMsg("You and "+from+" are now friends!");
  }

  async function declineRequest(from){
    var n=doDeclineRequest(social,currentUser.name,from);
    await saveSocial(n);setSocial(n);setSocialMsg("Request declined.");
  }

  async function removeFriend(friend){
    var n=doRemoveFriend(social,currentUser.name,friend);
    await saveSocial(n);setSocial(n);setSocialMsg(friend+" removed from friends.");
  }

  async function likeProfile(target){
    if(!currentUser||target===currentUser.name)return;
    var r=doLikeProfile(social,currentUser.name,target);
    if(!r.ok){setSocialMsg(r.err);return;}
    await saveSocial(r.social);setSocial(r.social);setSocialMsg("Liked "+target+"'s profile!");
  }

  async function sendChallenge(){
    if(!challengeTarget||!currentUser)return;
    var n=doSendChallenge(social,currentUser.name,challengeTarget,challengeLevel,challengeTypes);
    await saveSocial(n);setSocial(n);
    setSocialMsg("Challenge sent to "+challengeTarget+"!");
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
      var r=await fetch(url);
      var d=await r.json();
      setTranslation(d.responseData&&d.responseData.translatedText?d.responseData.translatedText:"Translation unavailable.");
    }catch(e){setTranslation("Translation unavailable.");}
    setTranslating(false);
  }

  async function toggleFav(storyId,storyTitle,storyLevel){
    if(!currentUser||!storyId)return;
    var existed=favs.some(function(f){return f.id===storyId;});
    var nFavs=existed?favs.filter(function(f){return f.id!==storyId;}):favs.concat([{id:storyId,title:storyTitle,level:storyLevel,date:new Date().toLocaleDateString()}]);
    var nAll={};for(var k in allFavs)nAll[k]=allFavs[k];nAll[currentUser.name]=nFavs;
    setFavs(nFavs);setAllFavs(nAll);saveFavs(nAll);
  }

  async function lookupWord(word){
    if(selectedWord===word){setSelectedWord(null);setWordDef(null);return;}
    setSelectedWord(word);setWordDef(null);setWordDefLoading(true);
    try{
      var r=await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+encodeURIComponent(word));
      if(!r.ok)throw new Error("not found");
      var data=await r.json();
      var entry=data[0];
      var phonetic=entry.phonetic||(entry.phonetics&&entry.phonetics[0]&&entry.phonetics[0].text)||"";
      var audio=(entry.phonetics&&entry.phonetics.find(function(p){return p.audio;})||{}).audio||"";
      var meaning=entry.meanings&&entry.meanings[0]&&entry.meanings[0].definitions&&entry.meanings[0].definitions[0];
      setWordDef({phonetic:phonetic,audio:audio,def:meaning?meaning.definition:"",example:meaning&&meaning.example?meaning.example:""});
    }catch(e){
      setWordDef({phonetic:"",audio:"",def:"No definition found for this word.",example:""});
    }
    setWordDefLoading(false);
  }

  // ── game ──────────────────────────────────────────────────
  function shuffleArr(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

  async function generate(){
    if(!level){setError("Pick a level first!");return;}
    setError("");

    if(customTopic.trim()){
      // AI path: call Claude to generate a passage on the custom topic
      setGenLoading(true);
      try{
        // matching/heading require complex formats Claude can't reliably produce — exclude from AI generation
        var AI_TYPES=["mcq","gap_word","gap_sentence","qa","tfnm","ynng"];
        var types=selectedTypes.filter(function(t){return AI_TYPES.indexOf(t)!==-1;});
        if(!types.length)types=["mcq","gap_word","qa","tfnm"];
        var r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({level:level,topic:customTopic.trim(),types:types,language:passageLang})});
        var d=await r.json();
        if(!r.ok||d.error)throw new Error(d.error||"Generation failed");
        if(!d.passage||!d.questions)throw new Error("Invalid response from AI");
        setPassage(d.passage);setTopic(customTopic.trim());setQuestions(d.questions);setCurrentStoryId(null);
        var mq=null;for(var i=0;i<d.questions.length;i++){if(d.questions[i].type==="matching"){mq=d.questions[i];break;}}
        setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights):[]);
        setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
        setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
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
    var played=new Set((currentUser&&currentUser.games||[]).map(function(g){return g.storyId;}));
    var unplayed=levelStories.filter(function(s){return !played.has(s.id);});
    var pool=unplayed.length>0?unplayed:levelStories;
    var randomIdx=Math.floor(Math.random()*pool.length);
    var story=pool[randomIdx];
    setPassage(story.passage);setTopic(story.title);setQuestions(story.questions);setCurrentStoryId(story.id);
    var mq=null;for(var i=0;i<story.questions.length;i++){if(story.questions[i].type==="matching"){mq=story.questions[i];break;}}
    setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights):[]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
    setActiveSentence(null);setTranslation(null);setHeatmapOn(false);setIsDailyGame(false);
    setStage("reading");
  }

  function startStoryFromLibrary(story){
    setLevel(story.level);
    setPassage(story.passage);setTopic(story.title);setQuestions(story.questions);
    var mq=null;for(var i=0;i<story.questions.length;i++){if(story.questions[i].type==="matching"){mq=story.questions[i];break;}}
    setShuffledRights(mq&&mq.rights?shuffleArr(mq.rights):[]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
    setIsDailyGame(false);setCurrentStoryId(story.id);
    setActiveSentence(null);setTranslation(null);setHeatmapOn(false);
    setStage("reading");
  }

  function startQuiz(){
    if(window.speechSynthesis){window.speechSynthesis.cancel();setIsSpeaking(false);}
    setFocusMode(false);setSelectedWord(null);setWordDef(null);
    if(currentUser&&savedWords.size>0){
      var today=new Date().toLocaleDateString();
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
    if(q.type==="matching")return Object.keys(matchState).length===q.lefts.length;
    if(q.type==="heading")return Object.keys(headingState).length===q.paragraphs.length;
    if(q.type==="qa")return userAnswers[current]&&userAnswers[current].trim().length>=3;
    return false;
  }

  function doConfirm(){
    if(!canConfirm())return;
    var ans=getCurrentAnswer(),pts=scoreQuestion(q,ans),mxp=maxPoints(q);
    var isGood=pts>=Math.ceil(mxp/2),ns=isGood?streak+1:0;
    setStreak(ns);
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
      var finalXp=Math.round(totalEarned*lvObj.mult*100)+tb+(streak>=3?50:0);
      var wasChallenge=challengeMode&&!timeExpired;
      if(wasChallenge)finalXp=Math.round(finalXp*1.5);
      var today=new Date().toLocaleDateString();

      var badgesBefore=checkBadges(currentUser,vocab,calcStreakWithShields(currentUser.games,shieldDates));
      var tempTodayGames=currentUser.games.filter(function(g){return g.date===today;}).concat([{level:lvObj.key,pct:pct,timeSecs:timeSecs,xp:finalXp,isDaily:isDailyGame}]);
      var newQuestItems=[];
      for(var qi=0;qi<dailyQuests.length;qi++){
        var qt=dailyQuests[qi];
        if(questsDone[qt.id])continue;
        if(checkQuest(qt.id,tempTodayGames,vocab.length,{dailyDone:isDailyGame,streak:calcStreakWithShields(currentUser.games.concat([{date:today}]),shieldDates)})){
          newQuestItems.push(qt);finalXp+=qt.xp;
        }
      }
      var wpm=getWpmFromSecs(passage.split(/\s+/).length,readingTimerSecs);
      var gameEntry={level:lvObj.key,score:totalEarned,total:totalMax,xp:finalXp,pct:pct,timeSecs:timeSecs,timeBonus:tb,topic:topic,date:today,typeStats:typeStats,isDaily:isDailyGame||false,storyId:currentStoryId||null,wpm:wpm};
      var updatedUser={name:currentUser.name,hash:currentUser.hash,games:currentUser.games.concat([gameEntry]),joined:currentUser.joined};
      var newUsers=[];for(var j=0;j<allUsers.length;j++){newUsers.push(allUsers[j].name===currentUser.name?updatedUser:allUsers[j]);}
      try{await saveUsers(newUsers);}catch(e){console.warn("saveUsers failed:",e);}
      setAllUsers(newUsers);setCurrentUser(updatedUser);
      var prevStreakVal=calcStreakWithShields(updatedUser.games,shieldDates);
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
      var myAsgClass=classes.find(function(c){return c.students.indexOf(currentUser.name)!==-1;});
      if(myAsgClass){
        var matchingAsgn=assignments.find(function(a){
          if(a.classId!==myAsgClass.id||!a.completions||a.completions[currentUser.name])return false;
          if(activeAssignmentId)return a.id===activeAssignmentId;
          return a.storyId&&a.storyId===currentStoryId;
        });
        if(matchingAsgn){doCompleteAssignment(matchingAsgn.id,pct,finalXp,timeSecs);setActiveAssignmentId(null);}
      }
      // save missed questions to SRS review queue
      var REVIEW_TYPES=["mcq","gap_word","gap_sentence","tfnm","ynng","qa"];
      var missed=[];var todayLoc=new Date().toLocaleDateString();
      for(var ri=0;ri<questions.length;ri++){if(!ansArr[ri]&&REVIEW_TYPES.indexOf(questions[ri].type)!==-1){missed.push({id:todayLoc+"-"+ri+"-"+Math.random().toString(36).slice(2),q:questions[ri],topic:topic,level:lvObj.key,date:todayLoc,nextReview:todayLoc,srInterval:0});}}
      if(missed.length>0&&currentUser){
        var rqExist=[];try{rqExist=JSON.parse(localStorage.getItem("rq-review-"+currentUser.name)||"[]");}catch(e){}
        var rqTexts=new Set(rqExist.map(function(r){return r.q.q||r.q.sentence||r.q.instruction||"";}));
        var rqNew=missed.filter(function(r){return !rqTexts.has(r.q.q||r.q.sentence||r.q.instruction||"");});
        var rqUpdated=rqExist.concat(rqNew).slice(-60);
        localStorage.setItem("rq-review-"+currentUser.name,JSON.stringify(rqUpdated));
        setReviewQueue(rqUpdated);
      }
      setResult({xp:finalXp,score:totalEarned,maxScore:totalMax,pct:pct,stars:stars,timeBonus:tb,timeSecs:timeSecs,rank:rank,answers:ansArr,typeStats:typeStats,wasDaily:wasDaily,newBadges:newBadgeIds,newQuests:newQuestItems,questBonus:questBonus,wpm:wpm,storyId:currentStoryId||null,earnedShield:newShields>shields,newStreakVal:newStreakVal,completedGoals:completedGoalIds,wasChallenge:wasChallenge});
      stopMusic();playSfx("complete");
      setStage("result");
    }catch(e){console.error("doFinish error:",e);setResult({xp:0,score:0,maxScore:0,pct:0,stars:0,timeBonus:0,timeSecs:0,rank:0,answers:[],typeStats:{},wasDaily:false,newBadges:[],newQuests:[],questBonus:0,wpm:0,storyId:null,earnedShield:false,newStreakVal:0,completedGoals:[]});setStage("result");}
  }

  function doRestart(){
    setLevel("");setPassage("");setTopic("");setQuestions([]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setTotalXpSoFar(0);
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
  }

  function useShield(){
    if(shields<=0||!currentUser)return;
    var yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
    var yDate=yesterday.toLocaleDateString();
    var newSDs=shieldDates.indexOf(yDate)===-1?shieldDates.concat([yDate]):shieldDates;
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
    var passageWords=text.toLowerCase().split(/\W+/).filter(Boolean);
    var summaryWords=summary.toLowerCase().split(/\W+/).filter(Boolean);
    var passageSet=new Set(passageWords);

    var hits=summaryWords.filter(function(w){return passageSet.has(w)&&w.length>3;}).length;
    var contentScore=Math.min(100,Math.round((hits/Math.max(summaryWords.length,1))*200));

    var uniqueRatio=new Set(summaryWords).size/Math.max(summaryWords.length,1);
    var vocabScore=Math.min(100,Math.round(uniqueRatio*150));

    var minWords={A1:20,A2:25,B1:35,B2:45,C1:55,C2:70}[lvl]||30;
    var structureScore=summaryWords.length>=minWords?80:Math.round((summaryWords.length/minWords)*80);

    var grammarScore=(summary[0]===summary[0].toUpperCase()&&/[.!?]$/.test(summary.trim()))?75:55;

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

  function startDailyChallenge(){
    var today=new Date().toLocaleDateString();
    var dc=dailyChallenge;
    if(dc&&dc.date===today){
      var mq2=null;for(var j2=0;j2<dc.questions.length;j2++){if(dc.questions[j2].type==="matching"){mq2=dc.questions[j2];break;}}
      setLevel(dc.level||"B1");setPassage(dc.passage);setTopic(dc.topic);setQuestions(dc.questions);
      setShuffledRights(mq2&&mq2.rights?shuffleArr(mq2.rights):[]);
      setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
      setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;setSavedWords(new Set());setHlMode(false);setHlWords(new Set());
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
    setShuffledRights(mq3&&mq3.rights?shuffleArr(mq3.rights):[]);
    setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
    setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;setSavedWords(new Set());setHlMode(false);setHlWords(new Set());
    setCurrentStoryId(dStory.id);setIsDailyGame(true);setStage("reading");
  }

  // ── style helpers ─────────────────────────────────────────
  var _accent=appTheme?appTheme.accent:"#6366f1";
  var _secondary=appTheme?appTheme.secondary:"#34d399";
  var BG="linear-gradient(160deg,#0d0d1a 0%,#111827 55%,#0d1f12 100%)";
  var CARD={background:"rgba(255,255,255,0.05)",border:"1px solid var(--rq-accent-border)",borderRadius:18,padding:20,backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",boxShadow:"0 8px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.07),0 0 0 1px rgba(255,255,255,0.03)"};
  var GHOST={background:"transparent",border:"1px solid rgba(255,255,255,0.10)",color:"#9ca3af",borderRadius:12,padding:"8px 16px",fontFamily:"inherit",fontSize:13,cursor:"pointer",fontWeight:700,transition:"all 0.15s ease"};
  var INP={width:"100%",background:"rgba(0,0,0,0.30)",border:"1px solid rgba(255,255,255,0.10)",borderRadius:12,color:"#f3f4f6",fontSize:14,padding:"12px 16px",outline:"none",fontFamily:"inherit",boxSizing:"border-box",boxShadow:"inset 0 2px 4px rgba(0,0,0,0.2)",transition:"border-color 0.2s,box-shadow 0.2s"};
  function mkBtn(bg,fg,size){var pad=size==="sm"?"7px 14px":size==="lg"?"15px 28px":"13px 22px";var fs=size==="sm"?12:size==="lg"?17:15;var glow=bg&&bg.startsWith("#")?bg+"55":"var(--rq-accent-glow)";return{background:bg,color:fg||"#fff",border:"none",borderRadius:12,padding:pad,fontWeight:700,fontSize:fs,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 0 22px "+glow,transition:"all 0.15s ease,box-shadow 0.15s ease,filter 0.15s ease"};}
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
  function startMusic(genre){
    if(musicStopRef.current){musicStopRef.current();}
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
    try{
      var canvas=document.createElement("canvas");
      canvas.width=800;canvas.height=420;
      var c=canvas.getContext("2d");
      // bg gradient
      var grd=c.createLinearGradient(0,0,800,420);grd.addColorStop(0,"#0d0d1a");grd.addColorStop(1,"#111827");
      c.fillStyle=grd;c.fillRect(0,0,800,420);
      // accent stripe
      var lv=getLv(result.level||level);
      c.fillStyle=lv?lv.color:"#34d399";c.fillRect(0,0,6,420);
      // app name
      c.font="700 15px 'Trebuchet MS',sans-serif";c.fillStyle="rgba(255,255,255,0.4)";
      c.fillText("READING QUEST",30,40);
      // level badge
      c.font="900 13px 'Trebuchet MS',sans-serif";c.fillStyle=lv?lv.color:"#34d399";
      c.fillText((result.level||level)+" QUEST",30,68);
      // big score
      c.font="900 110px 'Trebuchet MS',sans-serif";
      c.fillStyle=result.pct>=80?"#22c55e":result.pct>=60?"#f59e0b":"#ef4444";
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
        c.fillText("@"+currentUser.name,30,380);
      }
      // verdict
      var verdict=result.pct>=80?"Excellent!":result.pct>=60?"Good job!":"Keep going!";
      c.font="900 52px 'Trebuchet MS',sans-serif";c.fillStyle="rgba(255,255,255,0.08)";
      c.textAlign="right";c.fillText(verdict,780,190);c.textAlign="left";
      // share
      canvas.toBlob(function(blob){
        if(navigator.share&&navigator.canShare&&navigator.canShare({files:[new File([blob],"result.png",{type:"image/png"})]})){
          navigator.share({title:"Reading Quest Result",text:"I scored "+result.pct+"% on a "+( result.level||level)+" quest! 📖",files:[new File([blob],"result.png",{type:"image/png"})]}).catch(function(){});
        } else {
          var url=URL.createObjectURL(blob);
          var a=document.createElement("a");a.href=url;a.download="reading-quest-result.png";a.click();
          setTimeout(function(){URL.revokeObjectURL(url);},2000);
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
    var entry={text:sentence.trim(),topic:topic||"",level:level||"",date:new Date().toLocaleDateString(),storyId:currentStoryId||null};
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
    if(!customText.trim()||customText.trim().length<30){setCustomTextError("Please paste at least 30 characters of text.");return;}
    setCustomTextError("");setCustomTextLoading(true);
    try{
      var r=await fetch("/.netlify/functions/quiz-from-text",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({passage:customText.trim(),level:level||"B1",types:selectedTypes.slice(0,3)})});
      var d=await r.json();
      if(!r.ok||d.error)throw new Error(d.error||"Failed to generate quiz");
      // reset all quiz state before launching
      setPassage(customText.trim());setTopic(d.topic||"Custom Passage");
      setQuestions(d.questions||[]);setCurrentStoryId(null);setShuffledRights([]);
      setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
      setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setTimeExpired(false);setResult(null);
      setCustomTextOpen(false);setCustomText("");setCustomTextLoading(false);
      setAutoVocabWords([]);setAutoVocabDismissed(false);
      startTimeRef.current=Date.now();setTimerRunning(true);setStage("quiz");
    }catch(e){
      setCustomTextError(e.message||"Failed — try again.");setCustomTextLoading(false);
    }
  }

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
  var todayStr=new Date().toLocaleDateString();
  var playedToday=currentUser?currentUser.games.some(function(g){return g.date===todayStr;}):false;
  var weekDots=(function(){var dots=[];for(var di=6;di>=0;di--){var d=new Date();d.setDate(d.getDate()-di);d.setHours(0,0,0,0);var ds=d.toLocaleDateString();var dn=["S","M","T","W","T","F","S"][d.getDay()];dots.push({played:currentUser?currentUser.games.some(function(g){return g.date===ds;}):false,day:dn,today:di===0});}return dots;})();
  var STREAK_MILESTONES={3:"Three days in a row! Keep going 💪",7:"One whole week! You're building a real habit 🔥",14:"Two weeks strong! Incredible consistency 🏆",30:"30-day legend! You're unstoppable 🌟"};
  var milestoneToShow=currentUser&&[3,7,14,30].indexOf(myStreak)!==-1&&!milestoneSeen&&!localStorage.getItem("rq-ms-"+currentUser.name+"-"+myStreak)?STREAK_MILESTONES[myStreak]:null;

  return(
    <>
    <style>{`
      :root{
        --rq-accent:${_accent};
        --rq-secondary:${_secondary};
        --rq-accent-rgb:${appTheme?hex2rgb(_accent):"99,102,241"};
        --rq-secondary-rgb:${appTheme?hex2rgb(_secondary):"52,211,153"};
        --rq-accent-border:rgba(${appTheme?hex2rgb(_accent):"99,102,241"},0.22);
        --rq-accent-glow:rgba(${appTheme?hex2rgb(_accent):"99,102,241"},0.35);
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
        from{opacity:0;transform:translateY(10px)}
        to{opacity:1;transform:translateY(0)}
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
      .rq-home-nav{display:flex;gap:6px;flex-shrink:0}
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
                    <button onClick={function(){try{navigator.clipboard.writeText(onboardClassCode);setCopyMsg("Copied!");}catch(e){setCopyMsg(onboardClassCode);}setTimeout(function(){setCopyMsg("");},2000);}} style={{...GHOST,fontSize:12,padding:"5px 14px"}}>{copyMsg||"📋 Copy Code"}</button>
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
                    {[["library","📚 Library"],["ai_topic","🤖 AI Topic"],["custom_text","✍️ Custom Text"]].map(function(opt){return(
                      <button key={opt[0]} onClick={function(){setAssignType(opt[0]);}} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"2px solid "+(assignType===opt[0]?"#6366f1":"rgba(255,255,255,0.1)"),background:assignType===opt[0]?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.04)",color:assignType===opt[0]?"#a78bfa":"#9ca3af",fontFamily:"inherit",fontWeight:700,fontSize:11,cursor:"pointer"}}>{opt[1]}</button>
                    );})}
                  </div>
                  {assignType==="library"?(
                    <select value={assignStoryId} onChange={function(e){setAssignStoryId(e.target.value);}} style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:10}}>
                      <option value="">— Select a story —</option>
                      {["A1","A2","B1","B2","C1","C2"].map(function(lv){return(
                        <optgroup key={lv} label={lv}>{STORY_LIBRARY.filter(function(s){return s.level===lv;}).map(function(s){return(<option key={s.id} value={s.id}>{s.title} · {SUBJECT_LABELS[getSubjectKey(s)]}</option>);})}</optgroup>
                      );})}
                    </select>
                  ):assignType==="custom_text"?(
                    <div>
                      <textarea value={assignCustomText} onChange={function(e){setAssignCustomText(e.target.value.slice(0,3000));}} placeholder="Paste your passage here… (30–3000 characters)" style={{...INP,width:"100%",boxSizing:"border-box",minHeight:90,resize:"vertical",marginBottom:4,fontFamily:"inherit",fontSize:12}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:10,color:"#6b7280"}}>{assignCustomText.length}/3000</span>
                        <select value={assignLevel} onChange={function(e){setAssignLevel(e.target.value);}} style={{...INP,margin:0,width:72}}>
                          {["A1","A2","B1","B2","C1","C2"].map(function(lv){return(<option key={lv} value={lv}>{lv}</option>);})}
                        </select>
                      </div>
                    </div>
                  ):(
                    <div>
                      <input value={assignTopic} onChange={function(e){setAssignTopic(e.target.value);}} placeholder="Topic (e.g. Climate Change)" style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:8}}/>
                      <select value={assignLevel} onChange={function(e){setAssignLevel(e.target.value);}} style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:8}}>
                        {["A1","A2","B1","B2","C1","C2"].map(function(lv){return(<option key={lv} value={lv}>{lv}</option>);})}
                      </select>
                    </div>
                  )}
                  <input type="date" value={assignDue} onChange={function(e){setAssignDue(e.target.value);}} style={{...INP,width:"100%",boxSizing:"border-box",marginBottom:12,color:assignDue?"#f3f4f6":"#6b7280"}} placeholder="Due date (optional)"/>
                  {assignMsg&&<p style={{fontSize:12,color:assignMsg.startsWith("✓")?"#34d399":"#f87171",margin:"0 0 10px",textAlign:"center"}}>{assignMsg}</p>}
                  <button onClick={doCreateAssignment} disabled={assignLoading} style={{...mkBtn("#6366f1"),width:"100%",padding:"12px",fontSize:14,fontWeight:800,marginBottom:8}}>{assignLoading?"Generating…":"Create Assignment"}</button>
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
          <div style={{paddingTop:46,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:8}}>📖</div>
            <h1 style={{fontSize:32,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#34d399",margin:"0 0 6px"}}>Reading Quest</h1>
            <p style={{color:"#6b7280",marginBottom:26,fontSize:15}}>6 question types · Friends · Compete</p>
            <div style={CARD}>
              <div style={{display:"flex",gap:4,marginBottom:18,background:"rgba(0,0,0,0.2)",borderRadius:10,padding:4}}>
                {["register","login"].map(function(m){return<button key={m} onClick={function(){setAuthMode(m);setAuthErr("");}} style={{...GHOST,flex:1,padding:"10px 0",borderRadius:8,fontSize:15,...(authMode===m?{background:"#34d399",color:"#0d0d1a",borderColor:"#34d399"}:{})}}>{m==="login"?"Log In":"Register"}</button>;})}
              </div>
              {authMode==="register"&&(
                <div style={{display:"flex",gap:6,marginBottom:4}}>
                  {[{v:false,label:"👨‍🎓 Student"},{v:true,label:"👩‍🏫 Teacher"}].map(function(r){return(
                    <button key={String(r.v)} onClick={function(){setIsTeacherReg(r.v);}} style={{flex:1,padding:"8px 0",borderRadius:10,border:"2px solid "+(isTeacherReg===r.v?"#6366f1":"rgba(255,255,255,0.1)"),background:isTeacherReg===r.v?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.03)",color:isTeacherReg===r.v?"#a78bfa":"#9ca3af",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{r.label}</button>
                  );})}
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <input style={INP} placeholder="Username" value={nameInput} onChange={function(e){setNameInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
                <div className="rq-pass-wrap">
                  <input style={INP} type={showPass?"text":"password"} placeholder="Password (min 4 chars)" value={passInput} onChange={function(e){setPassInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")authMode==="login"?doLogin():doRegister();}}/>
                  <button type="button" className="rq-eye-btn" onClick={function(){setShowPass(function(p){return!p;});}} title={showPass?"Hide password":"Show password"}>
                    {showPass
                      ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              {authErr&&<ErrorBanner message={authErr} marginBottom={10}/>}
              <button onClick={authMode==="login"?doLogin:doRegister} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:14}}>{authMode==="login"?"Log In":"Create Account"}</button>
            </div>
          </div>
        )}

        {/* ── TEACHER DASHBOARD ────────────────────────────── */}
        {stage==="teacherDashboard"&&currentUser&&(function(){
          var myClasses=classes.filter(function(c){return c.teacherName===currentUser.name;});
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <h2 style={{margin:"0 0 4px",fontSize:22,fontWeight:900,color:"#a78bfa"}}>👩‍🏫 Teacher Dashboard</h2>
                  <p style={{margin:0,fontSize:13,color:"#6b7280"}}>Welcome back, {currentUser.name}</p>
                </div>
                <button onClick={function(){localStorage.removeItem("rq-session");localStorage.removeItem(CREDS_KEY);setCurrentUser(null);setNameInput("");setPassInput("");setStage("auth");}} style={{...GHOST,fontSize:12,padding:"6px 12px"}}>Log Out</button>
              </div>

              <div style={{...CARD,marginBottom:14}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:10}}>CREATE NEW CLASS</p>
                <div style={{display:"flex",gap:8}}>
                  <input value={newClassName} onChange={function(e){setNewClassName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")doCreateClass();}} placeholder="Class name (e.g. B1 Morning Group)" style={{...INP,flex:1,margin:0}}/>
                  <button onClick={doCreateClass} disabled={!newClassName.trim()} style={{...mkBtn("#6366f1"),padding:"10px 16px",fontSize:13,whiteSpace:"nowrap"}}>+ Create</button>
                </div>
              </div>

              {myClasses.length===0?(
                <div style={{textAlign:"center",padding:"40px 0",color:"#4b5563"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🏫</div>
                  <p style={{fontSize:14}}>No classes yet. Create your first class above.</p>
                </div>
              ):myClasses.map(function(cls){
                var stuData=cls.students.map(function(n){var u=allUsers.find(function(u){return u.name===n;});return u&&u.games?u.games:[];});
                var allGames=stuData.reduce(function(a,g){return a.concat(g);},[]);
                var avgPct=allGames.length?Math.round(allGames.reduce(function(s,g){return s+g.pct;},0)/allGames.length):0;
                return(
                  <button key={cls.id} onClick={function(){setCurrentClass(cls);setStage("classView");}} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.04)",border:"2px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px 16px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:10,transition:"border-color 0.15s"}}
                    onMouseEnter={function(e){e.currentTarget.style.borderColor="rgba(99,102,241,0.5)";}}
                    onMouseLeave={function(e){e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,color:"#f3f4f6",marginBottom:3}}>{cls.name}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{cls.students.length} student{cls.students.length!==1?"s":""} · created {cls.created}</div>
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
          var stuData=cls.students.map(function(sName){
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
            var isStruggling=recentAvg!==null&&recentAvg<50;
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
                {cls.students.length>0&&<button onClick={function(){setStage("classAnalytics");}} style={{...GHOST,fontSize:12,padding:"6px 10px",whiteSpace:"nowrap"}}>📊 Analytics</button>}
                {cls.students.length>0&&<button onClick={doExportClassCSV} style={{...GHOST,fontSize:12,padding:"6px 10px",whiteSpace:"nowrap"}}>⬇ CSV</button>}
              </div>

              <div style={{...CARD,textAlign:"center",marginBottom:12}}>
                <p style={{fontSize:11,color:"#6b7280",margin:"0 0 6px",letterSpacing:0.6}}>SHARE THIS CODE WITH STUDENTS</p>
                <div style={{fontSize:36,fontWeight:900,letterSpacing:10,color:"#34d399",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>{cls.id}</div>
                <button onClick={function(){try{navigator.clipboard.writeText(cls.id);setCopyMsg("Copied!");}catch(e){setCopyMsg(cls.id);}setTimeout(function(){setCopyMsg("");},2000);}} style={{...GHOST,fontSize:12,padding:"5px 14px"}}>{copyMsg||"📋 Copy Code"}</button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                {[{label:"Students",val:cls.students.length,color:"#a78bfa"},{label:"Class Avg",val:classAvg>0?classAvg+"%":"–",color:"#34d399"},{label:"Avg WPM",val:classWpm>0?classWpm:"–",color:"#f59e0b"}].map(function(s){return(
                  <div key={s.label} style={{...CARD,textAlign:"center",padding:"12px 8px"}}>
                    <div style={{fontSize:22,fontWeight:900,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.label}</div>
                  </div>
                );})}
              </div>

              {/* Announcement board */}
              <div style={{...CARD,marginBottom:14}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:10}}>📢 ANNOUNCEMENT</p>
                {cls.announcement?(
                  <div>
                    <div style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                      <p style={{margin:"0 0 4px",fontSize:13,color:"#e9d5ff",lineHeight:1.5}}>{cls.announcement.text}</p>
                      <p style={{margin:0,fontSize:10,color:"#6b7280"}}>Posted {cls.announcement.date}</p>
                    </div>
                    <button onClick={doClearAnnouncement} style={{...GHOST,fontSize:11,padding:"4px 10px"}}>✕ Remove</button>
                  </div>
                ):(
                  <div style={{display:"flex",gap:8}}>
                    <input value={announcementText} onChange={function(e){setAnnouncementText(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")doPostAnnouncement();}} placeholder="Post a message to your class…" style={{...INP,flex:1,margin:0}}/>
                    <button onClick={doPostAnnouncement} disabled={!announcementText.trim()} style={{...mkBtn(announcementText.trim()?"#a78bfa":"#374151","#0d0d1a"),padding:"10px 14px",fontSize:12,whiteSpace:"nowrap"}}>Post</button>
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
                  return{type:t,avg:avg,label:Q_LABELS[t]};
                }).filter(function(x){return x!==null;});
                if(!typeAvgs.length)return null;
                typeAvgs.sort(function(a,b){return a.avg-b.avg;});
                return(
                  <div style={{...CARD,marginBottom:14}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:10}}>CLASS WEAK AREAS</p>
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
              <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:8}}>STUDENTS</p>
              {cls.students.length===0?(
                <div style={{textAlign:"center",padding:"24px 0",color:"#4b5563",marginBottom:16}}>
                  <p style={{margin:0}}>No students yet. Share the code above!</p>
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
                          {d.isStruggling&&<span style={{fontSize:10,fontWeight:700,color:"#f87171",background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:6,padding:"1px 6px"}}>⚠ Needs help</span>}
                        </div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{d.gameCount} game{d.gameCount!==1?"s":""} · last active {d.lastDate}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0,paddingLeft:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",marginBottom:2}}>
                          {d.gameCount>=3&&<span style={{fontSize:14}} title={d.trend==="up"?"Improving":d.trend==="down"?"Declining":"Stable"}>{trendIcon}</span>}
                          <span style={{fontSize:15,fontWeight:900,color:lvMeta?lvMeta.color:"#4b5563"}}>{d.bestLv!=="none"?d.bestLv:"–"}</span>
                        </div>
                        <div style={{fontSize:12,color:"#9ca3af"}}>{d.gameCount>0?d.avgPct+"%":"No games"}</div>
                      </div>
                    </div>
                    {d.gameCount>0&&(
                      <div style={{display:"flex",gap:16,marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.05)",alignItems:"center"}}>
                        <span style={{fontSize:11,color:"#6b7280"}}>Avg: <b style={{color:d.isStruggling?"#f87171":"#f3f4f6"}}>{d.avgPct}%</b></span>
                        {d.avgWpm>0&&<span style={{fontSize:11,color:"#6b7280"}}>WPM: <b style={{color:"#f3f4f6"}}>{d.avgWpm}</b></span>}
                        {d.gameCount>=3&&<span style={{fontSize:11,color:trendColor,fontWeight:700}}>{trendIcon} {d.trend==="up"?"Improving":d.trend==="down"?"Declining":"Stable"}</span>}
                        <button onClick={function(){setPrintStudent(d.name);}} style={{...GHOST,fontSize:10,padding:"3px 8px",marginLeft:"auto"}}>🖨 Report</button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Assignments */}
              <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:"20px 0 10px"}}>ASSIGNMENTS</p>
              <div style={{...CARD,marginBottom:14}}>
                <div style={{display:"flex",gap:6,marginBottom:12}}>
                  {[{v:"library",label:"📚 Library"},{v:"ai_topic",label:"🤖 AI Topic"},{v:"custom_text",label:"✍️ Custom Text"}].map(function(t){return(
                    <button key={t.v} onClick={function(){setAssignType(t.v);setAssignMsg("");}} style={{flex:1,padding:"7px 0",borderRadius:10,border:"2px solid "+(assignType===t.v?"#f59e0b":"rgba(255,255,255,0.1)"),background:assignType===t.v?"rgba(245,158,11,0.15)":"rgba(255,255,255,0.03)",color:assignType===t.v?"#fcd34d":"#6b7280",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t.label}</button>
                  );})}
                </div>

                {assignType==="library"?(
                  <select value={assignStoryId} onChange={function(e){setAssignStoryId(e.target.value);}} style={{...INP,margin:"0 0 8px",width:"100%",boxSizing:"border-box"}}>
                    <option value="">— Select a story —</option>
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
                    <input value={assignTopic} onChange={function(e){setAssignTopic(e.target.value);}} placeholder="Topic (e.g. Climate Change)" style={{...INP,flex:1,margin:0}}/>
                    <select value={assignLevel} onChange={function(e){setAssignLevel(e.target.value);}} style={{...INP,margin:0,width:72}}>
                      {LEVELS.map(function(l){return<option key={l.key} value={l.key}>{l.key}</option>;})}
                    </select>
                  </div>
                )}

                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="date" value={assignDue} onChange={function(e){setAssignDue(e.target.value);}} style={{...INP,margin:0,flex:1,colorScheme:"dark"}} title="Due date (optional)"/>
                  <button onClick={doCreateAssignment} disabled={assignLoading||(assignType==="library"&&!assignStoryId)||(assignType==="ai_topic"&&!assignTopic.trim())||(assignType==="custom_text"&&assignCustomText.trim().length<30)} style={{...mkBtn(assignLoading?"#374151":"#f59e0b","#0d0d1a"),padding:"10px 14px",fontSize:12,whiteSpace:"nowrap"}}>{assignLoading?"Generating…":"+ Assign"}</button>
                </div>
                {assignMsg&&<p style={{fontSize:12,color:assignMsg.startsWith("✓")?"#34d399":"#f87171",margin:"8px 0 0"}}>{assignMsg}</p>}
              </div>

              {/* Existing assignments for this class */}
              {assignments.filter(function(a){return a.classId===cls.id;}).map(function(asgn){
                var total=cls.students.length;
                var done=Object.keys(asgn.completions||{}).length;
                var pct=total>0?Math.round((done/total)*100):0;
                var avgScore=done>0?Math.round(Object.values(asgn.completions).reduce(function(s,c){return s+c.pct;},0)/done):0;
                return(
                  <div key={asgn.id} style={{...CARD,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{flex:1,paddingRight:8}}>
                        <div style={{fontSize:13,fontWeight:800,color:"#f3f4f6"}}>{asgn.topic}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{asgn.level} · {asgn.type==="ai_topic"?"🤖 AI generated":asgn.type==="custom_text"?"✍️ Custom text":"📚 Library"}{asgn.dueDate?" · due "+asgn.dueDate:""}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:900,color:pct===100?"#34d399":"#f59e0b"}}>{done}/{total}</div>
                        <div style={{fontSize:10,color:"#6b7280"}}>completed</div>
                      </div>
                    </div>
                    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:4,height:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:pct===100?"#34d399":"#f59e0b",transition:"width 0.3s"}}/>
                    </div>
                    {done>0&&<div style={{fontSize:11,color:"#6b7280",marginTop:6}}>Class avg: <b style={{color:"#f3f4f6"}}>{avgScore}%</b></div>}
                  </div>
                );
              })}
              {assignments.filter(function(a){return a.classId===cls.id;}).length===0&&(
                <p style={{fontSize:12,color:"#4b5563",textAlign:"center",padding:"16px 0"}}>No assignments yet. Create one above.</p>
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
                  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={function(){setPrintStudent(null);}}>
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
                                <span style={{color:"#d1d5db"}}>{Q_LABELS[t]}</span>
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
                      <p style={{fontSize:11,color:"#4b5563",textAlign:"center",margin:0}}>Generated {new Date().toLocaleDateString()}</p>
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
          var clsAssignments=assignments.filter(function(a){return a.classId===cls.id;});
          var today=new Date();today.setHours(0,0,0,0);
          var stuData=cls.students.map(function(sName){
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
          var typeList=Object.keys(classTypeAgg).map(function(t){return{t:t,pct:classTypeAgg[t].m>0?Math.round(classTypeAgg[t].e/classTypeAgg[t].m*100):0,label:Q_LABELS[t]||t};}).sort(function(a,b){return a.pct-b.pct;});
          return(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingTop:8}}>
                <button onClick={function(){setStage("classView");}} style={GHOST}>← Back</button>
                <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#06b6d4",flex:1}}>📊 {cls.name} Analytics</h2>
              </div>

              {/* top stats row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                {[
                  {label:"Students",val:cls.students.length,col:"#a78bfa"},
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
                      {cls.students.map(function(sName){
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
                          {d.weakType&&d.weakPct<70?" · weak: "+(Q_LABELS[d.weakType]||d.weakType)+" ("+d.weakPct+"%)":""}
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
                <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#a78bfa"}}>🏆 My Portfolio</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
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
                      <span style={{...pill(lvObj2.color+"26",lvObj2.color),fontSize:11,fontWeight:700}}>{bestLvl!=="none"?bestLvl+" · "+lvObj2.desc:"No games yet"}</span>
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
                  {icon:"📖",label:"Sessions",val:pg.length+"",col:"#818cf8"},
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

        {/* ── HOME ──────────────────────────────────────────── */}
        {stage==="home"&&(
          <div>
            <div className="rq-home-hdr">
              <div>
                <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#34d399"}}>Hey, {currentUser?currentUser.name:""}!</h2>
                <div className="rq-pills">
                  <span style={pill(streakAtRisk?"rgba(239,68,68,0.2)":"rgba(251,191,36,0.15)",streakAtRisk?"#f87171":"#fbbf24")}>{streakAtRisk?"⚠️":"🔥"} {myStreak} day streak{shields>0?" · "+"🛡️".repeat(shields):""}</span>
                  <span style={pill("rgba(167,139,250,0.15)","#a78bfa")}>Friends: {myData.friends.length}</span>
                  {myData.likes>0&&<span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes: {myData.likes}</span>}
                  {pendingChallenges.length>0&&<span style={pill("rgba(239,68,68,0.2)","#f87171")}>!{pendingChallenges.length} challenge</span>}
                </div>
              </div>
              <div className="rq-home-nav">
                <button onClick={function(){setStage("friends");}} style={GHOST}>Friends</button>
                <button onClick={function(){setStage("analytics");}} style={GHOST}>Stats</button>
                <button onClick={function(){setVocabCard(0);setVocabFlipped(false);setVocabFilter("all");setStage("vocab");}} style={GHOST}>Vocab</button>
                <button onClick={function(){setHistoryLevel("");setStage("history");}} style={GHOST}>History</button>
                <button onClick={function(){setStage("goals");}} style={GHOST}>Goals</button>
                <button onClick={function(){setStage("library");}} style={GHOST}>Library</button>
                <button onClick={function(){setPortfolioLink("");setPortfolioLinkCopied(false);setStage("portfolio");}} style={GHOST}>Portfolio</button>
                <button onClick={function(){setStage("weekly");}} style={GHOST}>Weekly</button>
                <button onClick={function(){setStage("profile");}} style={GHOST}>Profile</button>
                <button onClick={function(){setLbLevel("A1");setStage("leaderboard");}} style={GHOST}>Board</button>
                {quotes.length>0&&<button onClick={function(){setStage("quotes");}} style={GHOST}>Quotes</button>}
              </div>
            </div>

            {/* streak card */}
            {currentUser&&(myStreak>=1||streakAtRisk)&&(
              <div style={{...CARD,marginBottom:12,padding:14,borderColor:streakAtRisk?"rgba(239,68,68,0.35)":"rgba(251,191,36,0.3)",background:streakAtRisk?"rgba(239,68,68,0.06)":"rgba(251,191,36,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:36,lineHeight:1}}>{streakAtRisk?"🛡️":"🔥"}</div>
                    <div>
                      <div className={streakAtRisk?"rq-glow-red":"rq-glow-amber"} style={{fontSize:22,fontWeight:900,color:streakAtRisk?"#f87171":"#fbbf24",lineHeight:1}}>{myStreak} <span style={{fontSize:13,fontWeight:600}}>day streak</span></div>
                      {longestStreak>0&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Best: {longestStreak} days</div>}
                      {streakAtRisk&&<div style={{fontSize:11,color:"#f87171",marginTop:2,fontWeight:600}}>You missed yesterday — use a shield to save it!</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    {shields>0&&<div style={{fontSize:13,color:"#a78bfa",fontWeight:700}}>{"🛡️".repeat(shields)}</div>}
                    {streakAtRisk&&shields>0&&<button onClick={useShield} style={{...mkBtn("#6366f1"),padding:"8px 14px",fontSize:12}}>Use Shield</button>}
                  </div>
                </div>
                {!streakAtRisk&&shields<3&&myStreak>0&&myStreak%7!==0&&<div style={{fontSize:11,color:"#6b7280",marginTop:8}}>🛡️ Earn a shield at {Math.ceil(myStreak/7)*7}-day streak milestone</div>}
                {!streakAtRisk&&shields===3&&<div style={{fontSize:11,color:"#6b7280",marginTop:8}}>🛡️ Max shields (3) — keep going!</div>}
                {/* weekly activity dots */}
                <div style={{display:"flex",gap:4,marginTop:10,justifyContent:"space-between"}}>
                  {weekDots.map(function(dot,i){return(
                    <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:dot.played?"#fbbf24":dot.today?"rgba(251,191,36,0.2)":"rgba(255,255,255,0.07)",border:dot.today?"2px solid #fbbf24":"2px solid transparent",transition:"all 0.2s"}}/>
                      <div style={{fontSize:9,color:dot.today?"#fbbf24":"#6b7280",fontWeight:dot.today?700:400}}>{dot.day}</div>
                    </div>
                  );})}
                </div>
              </div>
            )}

            {/* milestone celebration banner */}
            {milestoneToShow&&(
              <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(251,191,36,0.5)",background:"linear-gradient(135deg,rgba(251,191,36,0.12),rgba(251,191,36,0.04))",textAlign:"center",position:"relative"}}>
                <button onClick={function(){localStorage.setItem("rq-ms-"+currentUser.name+"-"+myStreak,"1");setMilestoneSeen(true);}} style={{position:"absolute",top:8,right:8,background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
                <div style={{fontSize:32,marginBottom:4}}>🎉</div>
                <div style={{fontSize:15,fontWeight:800,color:"#fbbf24",marginBottom:4}}>{myStreak}-Day Streak!</div>
                <div style={{fontSize:12,color:"#d1d5db"}}>{milestoneToShow}</div>
              </div>
            )}

            {/* play today nudge */}
            {currentUser&&!playedToday&&(
              <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.05)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:28}}>📖</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#818cf8"}}>Play today!</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{myStreak>0?"Keep your "+myStreak+"-day streak alive":"Start your streak today"}</div>
                    </div>
                  </div>
                  <button onClick={function(){setStage("library");}} style={{...mkBtn("#6366f1"),padding:"8px 14px",fontSize:12,flexShrink:0}}>Read Now</button>
                </div>
              </div>
            )}

            {/* missed-question review nudge */}
            {currentUser&&(function(){
              var todayL=new Date().toLocaleDateString();
              var due=reviewQueue.filter(function(r){return r.nextReview<=todayL;});
              if(!due.length)return null;
              return(
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(168,85,247,0.35)",background:"rgba(168,85,247,0.05)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:26}}>🔁</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#c084fc"}}>Review due</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{due.length} missed question{due.length!==1?"s":""} from past quizzes</div>
                      </div>
                    </div>
                    <button onClick={function(){setReviewIdx(0);setReviewAns(null);setReviewConfirmed(false);setStage("review");}} style={{...mkBtn("#a855f7","#0d0d1a"),padding:"8px 14px",fontSize:12,flexShrink:0}}>Review</button>
                  </div>
                </div>
              );
            })()}

            {/* vocab SRS nudge */}
            {currentUser&&(function(){
              var due=vocab.filter(srsDueToday);
              if(!due.length)return null;
              return(
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(6,182,212,0.35)",background:"rgba(6,182,212,0.05)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:26}}>📚</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#06b6d4"}}>Vocab review due</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{due.length} word{due.length!==1?"s":""} ready for review today</div>
                      </div>
                    </div>
                    <button onClick={function(){setVocabFilter("due");setVocabCard(0);setVocabFlipped(false);setStage("vocab");}} style={{...mkBtn("#06b6d4","#0d0d1a"),padding:"8px 14px",fontSize:12,flexShrink:0}}>Review</button>
                  </div>
                </div>
              );
            })()}

            {/* reading goals summary */}
            {currentUser&&Object.keys(goals).length>0&&(function(){
              var activeGoals=GOAL_DEFS.filter(function(d){return goals[d.id];});
              return(
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#818cf8",margin:0}}>🎯 READING GOALS</p>
                    <button onClick={function(){setStage("goals");}} style={{background:"none",border:"none",color:"#6366f1",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Manage →</button>
                  </div>
                  {activeGoals.map(function(def){
                    var g=goals[def.id];
                    var prog=getGoalProgress(def.id,g,currentUser.games,myStreak);
                    return(
                      <div key={def.id} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                          <span style={{color:"#9ca3af"}}>{def.icon} {def.label}</span>
                          <span style={{color:prog.done?"#34d399":"#a78bfa",fontWeight:700}}>{prog.done?"✓ Done!":prog.current+(def.id==="avg_score"?" avg":"")+"/"+prog.target+" "+def.unit}</span>
                        </div>
                        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,overflow:"hidden"}}>
                          <div style={{height:"100%",width:prog.pct+"%",background:prog.done?"#34d399":"#6366f1",borderRadius:999,transition:"width 0.4s ease"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* pending challenges */}
            {currentUser&&(function(){
              var live=pendingChallenges.filter(function(c){return!c.expiresAt||c.expiresAt>Date.now();});
              var completedSent=(myData.sent||[]).filter(function(s){return s.status==="completed";});
              if(!live.length&&!completedSent.length)return null;
              return(
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(245,158,11,0.35)",background:"rgba(245,158,11,0.04)"}}>
                  {live.length>0&&(
                    <>
                      <p style={{fontSize:11,color:"#f59e0b",fontWeight:700,marginBottom:8}}>⚔️ CHALLENGES RECEIVED</p>
                      {live.map(function(c,idx){
                        var realIdx=myData.challenges.indexOf(c);
                        var tl=challengeTimeLeft(c.expiresAt);
                        var lvC=getLv(c.level);
                        return(<div key={idx} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid "+(c.storyId?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.07)")}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,color:"#f3f4f6",fontWeight:600}}><strong>{c.from}</strong> → <span style={{color:lvC.color}}>{c.level}</span>{c.storyId&&<span style={{color:"#f87171",marginLeft:5}}>⚔️ story</span>}</div>
                            {c.storyTitle&&<div style={{fontSize:11,color:"#e9d5ff",marginTop:1}}>"{c.storyTitle}"</div>}
                            {c.senderPct!=null&&<div style={{fontSize:10,color:"#fbbf24",marginTop:1}}>Their score: {c.senderPct}% — can you beat it?</div>}
                            {tl&&<div style={{fontSize:10,color:tl==="expired"?"#f87171":"#6b7280",marginTop:1}}>⏱ {tl}</div>}
                          </div>
                          <button onClick={function(){respondChallenge(realIdx,"accepted",c);}} style={{...mkBtn("#22c55e","#0d0d1a"),padding:"5px 10px",fontSize:11}}>Accept</button>
                          <button onClick={function(){respondChallenge(realIdx,"declined",null);}} style={{...mkBtn("#374151"),padding:"5px 10px",fontSize:11}}>✕</button>
                        </div>);
                      })}
                    </>
                  )}
                  {completedSent.length>0&&(
                    <>
                      <p style={{fontSize:11,color:"#34d399",fontWeight:700,marginBottom:8,marginTop:live.length?10:0}}>✅ CHALLENGE RESULTS</p>
                      {completedSent.map(function(s,i){
                        var isStory=!!s.storyId;
                        var theirPct=s.result.pct;
                        var myPct=s.result.senderPct!=null?s.result.senderPct:(s.senderPct!=null?s.senderPct:null);
                        var won=myPct!=null&&theirPct<myPct;
                        var tied=myPct!=null&&theirPct===myPct;
                        return(<div key={i} style={{marginBottom:8,padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid "+(won?"rgba(34,197,94,0.25)":tied?"rgba(251,191,36,0.2)":"rgba(239,68,68,0.2)")}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:myPct!=null?5:0}}>
                            <span style={{fontSize:12,color:"#f3f4f6",flex:1}}><strong>{s.to}</strong> scored <strong style={{color:pctColor(theirPct)}}>{theirPct}%</strong>{isStory&&s.storyTitle?<span style={{color:"#9ca3af",fontSize:11}}> · "{s.storyTitle}"</span>:" on your "+s.level+" challenge"}</span>
                            <span style={{color:"#fbbf24",fontWeight:700,fontSize:11}}>{s.result.xp} XP</span>
                          </div>
                          {myPct!=null&&(
                            <div style={{display:"flex",gap:12,fontSize:11}}>
                              <span style={{color:"#a78bfa"}}>You: <strong style={{color:"#e9d5ff"}}>{myPct}%</strong></span>
                              <span style={{color:"#9ca3af"}}>vs</span>
                              <span style={{color:"#f87171"}}>{s.to}: <strong style={{color:pctColor(theirPct)}}>{theirPct}%</strong></span>
                              <span style={{fontWeight:700,color:won?"#22c55e":tied?"#fbbf24":"#f87171"}}>{won?"🏆 You won!":tied?"🤝 Tie!":"😤 They beat you"}</span>
                            </div>
                          )}
                        </div>);
                      })}
                    </>
                  )}
                </div>
              );
            })()}

            {/* word of the day card */}
            {(function(){
              var doy=Math.floor((new Date()-new Date(new Date().getFullYear(),0,0))/(864e5));
              var wotd=WORD_OF_DAY[doy%WORD_OF_DAY.length];
              var myClass3=currentUser?classes.find(function(c){return c.students.indexOf(currentUser.name)!==-1;})||null:null;
              var pendingAssignments=myClass3?assignments.filter(function(a){return a.classId===myClass3.id&&(!a.completions||!a.completions[currentUser.name])&&(!a.dueDate||a.dueDate>=new Date().toISOString().slice(0,10));}):[];
              return(
                <div>
                {myClass3&&myClass3.announcement&&(
                  <div style={{...CARD,marginBottom:12,padding:12,borderColor:"rgba(167,139,250,0.4)",background:"rgba(99,102,241,0.07)"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                      <div style={{fontSize:20,flexShrink:0}}>📢</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#a78bfa",marginBottom:3}}>{myClass3.name} · {myClass3.announcement.teacherName}</div>
                        <div style={{fontSize:13,color:"#e9d5ff",lineHeight:1.5}}>{myClass3.announcement.text}</div>
                      </div>
                    </div>
                  </div>
                )}
                {pendingAssignments.length>0&&(
                  <div style={{...CARD,marginBottom:12,padding:12,borderColor:"rgba(245,158,11,0.5)",background:"rgba(245,158,11,0.07)"}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#fcd34d",letterSpacing:0.6,margin:"0 0 10px"}}>📋 ASSIGNMENTS FROM {(myClass3.teacherName||"").toUpperCase()}</p>
                    {pendingAssignments.map(function(asgn){
                      var story=asgn.storyId?STORY_LIBRARY.find(function(s){return s.id===asgn.storyId;}):null;
                      return(
                        <div key={asgn.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid rgba(245,158,11,0.15)"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:"#f3f4f6",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{asgn.topic}</div>
                            <div style={{fontSize:11,color:"#9ca3af"}}>{asgn.level}{asgn.dueDate?" · due "+asgn.dueDate:""}</div>
                          </div>
                          <button onClick={function(){
                            setActiveAssignmentId(asgn.id);
                            if(story){startStoryFromLibrary(story);}
                            else if(asgn.passage&&asgn.questions){
                              setLevel(asgn.level);setPassage(asgn.passage);setTopic(asgn.topic);setQuestions(asgn.questions);
                              var mq2=null;for(var qi2=0;qi2<asgn.questions.length;qi2++){if(asgn.questions[qi2].type==="matching"){mq2=asgn.questions[qi2];break;}}
                              setShuffledRights(mq2&&mq2.rights?shuffleArr(mq2.rights):[]);
                              setCurrent(0);setUserAnswers({});setMatchState({});setHeadingState({});
                              setConfirmed(false);setStreak(0);setTotalXpSoFar(0);setShowPassage(false);setTimeExpired(false);startTimeRef.current=null;
                              setIsDailyGame(false);setCurrentStoryId(null);setActiveSentence(null);setTranslation(null);setHeatmapOn(false);
                              setStage("reading");
                            }
                          }} style={{...mkBtn("#f59e0b","#0d0d1a"),fontSize:12,padding:"6px 14px",whiteSpace:"nowrap",flexShrink:0}}>Start →</button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(167,139,250,0.3)",background:"rgba(167,139,250,0.05)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <p style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:0.6,margin:0}}>📖 WORD OF THE DAY</p>
                    <span style={{fontSize:10,color:"#6b7280",background:"rgba(255,255,255,0.06)",borderRadius:999,padding:"2px 8px",fontWeight:700,textTransform:"uppercase"}}>{wotd.type}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                    <span style={{fontSize:20,fontWeight:900,color:"#e9d5ff"}}>{wotd.word}</span>
                    <span style={{fontSize:12,color:"#7c3aed",fontFamily:"'JetBrains Mono',monospace"}}>{wotd.phonetic}</span>
                  </div>
                  <p style={{fontSize:13,color:"#d1d5db",margin:"0 0 4px",lineHeight:1.5}}>{wotd.def}</p>
                  <p style={{fontSize:12,color:"#6b7280",margin:0,fontStyle:"italic"}}>"{wotd.ex}"</p>
                </div>
                </div>
              );
            })()}

            {/* sound & music controls */}
            <div style={{...CARD,marginBottom:12,padding:14}}>
              <p style={{fontSize:11,color:"#06b6d4",fontWeight:700,letterSpacing:0.6,margin:"0 0 10px"}}>🎵 AUDIO SETTINGS</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                <button onClick={function(){setSfxOn(function(v){var n=!v;try{localStorage.setItem("rq-sfx",n?"on":"off");}catch(e){}return n;});}} style={{background:sfxOn?"rgba(52,211,153,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(sfxOn?"rgba(52,211,153,0.4)":"rgba(255,255,255,0.1)"),color:sfxOn?"#34d399":"#9ca3af",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,transition:"all 0.15s ease"}}>
                  {sfxOn?"🔊 SFX On":"🔇 SFX Off"}
                </button>
                <button onClick={function(){setMusicOn(function(v){return!v;});}} style={{background:musicOn?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(musicOn?"rgba(6,182,212,0.4)":"rgba(255,255,255,0.1)"),color:musicOn?"#22d3ee":"#9ca3af",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700,transition:"all 0.15s ease"}}>
                  {musicOn?"🎵 Music On":"🎵 Music Off"}
                </button>
                {musicOn&&(
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {[["classical","🎻 Classical"],["lofi","☕ Lo-fi"],["jazz","🎷 Jazz"],["nature","🌿 Nature"]].map(function(opt){
                      var active=musicGenre===opt[0];
                      return<button key={opt[0]} onClick={function(){setMusicGenre(opt[0]);try{localStorage.setItem("rq-music-genre",opt[0]);}catch(e){}}} style={{background:active?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(active?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.08)"),color:active?"#c4b5fd":"#6b7280",borderRadius:999,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400,transition:"all 0.15s ease"}}>{opt[1]}</button>;
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* daily challenge card */}
            {currentUser&&(function(){
              var today=new Date().toLocaleDateString();
              var done=dailyDone&&dailyDone.date===today;
              return(
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:done?"rgba(251,191,36,0.3)":"rgba(6,182,212,0.3)",background:done?"rgba(251,191,36,0.05)":"rgba(6,182,212,0.05)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <p style={{fontSize:11,color:done?"#fbbf24":"#06b6d4",fontWeight:700,letterSpacing:0.6,margin:"0 0 2px"}}>TODAY'S DAILY CHALLENGE</p>
                      <p style={{fontSize:12,color:"#9ca3af",margin:0}}>{done?"Completed! "+dailyDone.xp+" XP · "+dailyDone.pct+"%":dailyChallenge&&dailyChallenge.date===today?dailyChallenge.topic+" (B1)":"B1 · All question types"}</p>
                    </div>
                    <button onClick={done?function(){setStage("dailyleaderboard");}:startDailyChallenge} disabled={dailyLoading} style={{...mkBtn(done?"#fbbf24":"#06b6d4","#0d0d1a"),padding:"9px 16px",fontSize:13,flexShrink:0}}>{dailyLoading?"Loading...":done?"Leaderboard":"Play"}</button>
                  </div>
                </div>
              );
            })()}

            {/* recommendations card */}
            {currentUser&&(function(){
              var recs=getRecommendations(currentUser.games||[],3);
              if(!recs.length)return null;
              return(
                <div style={{...CARD,marginBottom:12,padding:14}}>
                  <p style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:0.6,margin:"0 0 10px"}}>RECOMMENDED FOR YOU</p>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {recs.map(function(s){
                      var lo=getLv(s.level);
                      return(
                        <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}} onClick={function(){startStoryFromLibrary(s);}}>
                          <span style={{fontSize:20}}>{({A1:"📗",A2:"📘",B1:"📙",B2:"📒",C1:"📕",C2:"📓"})[s.level]||"📖"}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:"#f3f4f6",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</div>
                            <div style={{fontSize:11,color:"#6b7280"}}>{s.topic}</div>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:lo.color,flexShrink:0}}>{s.level}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* daily quests card */}
            {currentUser&&dailyQuests.length>0&&(function(){
              var today=new Date().toLocaleDateString();
              var todayGames=(currentUser.games||[]).filter(function(g){return g.date===today;});
              var doneToday=dailyDone&&dailyDone.date===today;
              var allDone=dailyQuests.every(function(q){return questsDone[q.id]||checkQuest(q.id,todayGames,vocab.length,{dailyDone:doneToday,streak:myStreak});});
              var doneCount=dailyQuests.filter(function(q){return questsDone[q.id];}).length;
              return(
                <div style={{...CARD,marginBottom:12,padding:14,borderColor:allDone?"rgba(52,211,153,0.3)":"rgba(255,255,255,0.1)",background:allDone?"rgba(52,211,153,0.04)":"rgba(255,255,255,0.02)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <p style={{fontSize:11,color:allDone?"#34d399":"#9ca3af",fontWeight:700,letterSpacing:0.6,margin:0}}>TODAY'S QUESTS</p>
                    <span style={{fontSize:11,color:"#6b7280"}}>{doneCount}/{dailyQuests.length} done</span>
                  </div>
                  {dailyQuests.map(function(q){
                    var done=!!questsDone[q.id];
                    return(<div key={q.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <div style={{width:20,height:20,borderRadius:"50%",border:"2px solid "+(done?"#34d399":"rgba(255,255,255,0.15)"),background:done?"#34d399":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {done&&<span style={{fontSize:10,color:"#0d0d1a",fontWeight:900}}>✓</span>}
                      </div>
                      <div style={{flex:1}}>
                        <span style={{fontSize:13,fontWeight:600,color:done?"#6b7280":"#f3f4f6",textDecoration:done?"line-through":"none"}}>{q.title}</span>
                        <span style={{fontSize:11,color:"#4b5563",marginLeft:6}}>{q.desc}</span>
                      </div>
                      <span style={{fontSize:12,fontWeight:700,color:done?"#6b7280":"#34d399",flexShrink:0}}>+{q.xp} XP</span>
                    </div>);
                  })}
                  {allDone&&<div style={{marginTop:4,padding:"6px 10px",borderRadius:8,background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.3)",fontSize:12,color:"#34d399",textAlign:"center",fontWeight:700}}>All quests complete! Come back tomorrow for new ones.</div>}
                </div>
              );
            })()}

            {/* question type selector */}
            <div style={{...CARD,marginBottom:12,padding:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:0.6,margin:0}}>QUESTION TYPES (min 1)</p>
                <span style={{fontSize:10,color:"#6b7280"}}>{selectedTypes.length} selected</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {Object.keys(Q_LABELS).map(function(t){
                  var active=selectedTypes.indexOf(t)!==-1;
                  function toggle(){setSelectedTypes(function(prev){var isAct=prev.indexOf(t)!==-1;if(isAct&&prev.length===1)return prev;if(isAct)return prev.filter(function(x){return x!==t;});return prev.concat([t]);});}
                  return(<button key={t} onClick={toggle} style={{background:active?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(active?"#818cf8":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 11px",fontSize:11,color:active?"#c7d2fe":"#6b7280",cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400}}>{active?"✓ ":""}{Q_LABELS[t]}</button>);
                })}
              </div>
            </div>

            {/* custom topic input */}
            <div style={{...CARD,marginBottom:12,padding:14}}>
              <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:0.6,margin:"0 0 8px"}}>TOPIC <span style={{color:"#4b5563",fontWeight:400,letterSpacing:0}}>(optional — leave blank for random)</span></p>
              <div style={{display:"flex",gap:8}}>
                <input
                  style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid "+(customTopic.trim()?"#818cf8":"rgba(255,255,255,0.12)"),borderRadius:10,padding:"9px 12px",fontSize:13,color:"#f3f4f6",fontFamily:"inherit",outline:"none"}}
                  placeholder="e.g. climate change, football, the Moon..."
                  value={customTopic}
                  onChange={function(e){setCustomTopic(e.target.value);}}
                  onKeyDown={function(e){if(e.key==="Enter"&&level)generate();}}
                  maxLength={80}
                />
                {customTopic.trim()&&<button onClick={function(){setCustomTopic("");}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"9px 12px",fontSize:13,color:"#6b7280",cursor:"pointer",fontFamily:"inherit"}}>✕</button>}
              </div>
              {customTopic.trim()&&<p style={{fontSize:11,color:"#818cf8",margin:"6px 0 0"}}>AI will write a passage about: <strong>{customTopic.trim()}</strong></p>}
              {/* personalised passage toggle */}
              {(function(){
                var activeVocab=vocab.filter(function(w){return w.status!=="known";});
                activeVocab.sort(function(a,b){return (a.srInterval||0)-(b.srInterval||0);});
                var previewWords=activeVocab.slice(0,5).map(function(w){return w.word;});
                return(<div style={{marginTop:10,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={function(){setUseWeakVocab(function(v){return !v;});}} style={{background:useWeakVocab?"rgba(16,185,129,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(useWeakVocab?"#10b981":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:11,color:useWeakVocab?"#34d399":"#6b7280",cursor:"pointer",fontFamily:"inherit",fontWeight:700,transition:"all 0.15s"}}>
                        {useWeakVocab?"✓ Vocab-Personalised":"📚 Personalise with my vocab"}
                      </button>
                      {activeVocab.length===0&&<span style={{fontSize:10,color:"#4b5563"}}>(add words to vocab first)</span>}
                    </div>
                    {useWeakVocab&&previewWords.length>0&&<p style={{fontSize:11,color:"#34d399",margin:"5px 0 0"}}>Passage will include: {previewWords.map(function(w,i){return<span key={w} style={{background:"rgba(16,185,129,0.15)",borderRadius:4,padding:"1px 5px",marginRight:4,display:"inline-block"}}>{w}</span>;})}</p>}
                    {useWeakVocab&&previewWords.length===0&&<p style={{fontSize:11,color:"#6b7280",margin:"5px 0 0"}}>No active vocab words — add some from the Vocab screen.</p>}
                  </div>
                </div>);
              })()}
            </div>

            {/* passage language selector — only shown when a custom topic is entered */}
            {customTopic.trim()&&(function(){
              var PASS_LANGS=[{flag:"🇬🇧",name:"English"},{flag:"🇪🇸",name:"Spanish"},{flag:"🇫🇷",name:"French"},{flag:"🇩🇪",name:"German"},{flag:"🇮🇹",name:"Italian"},{flag:"🇵🇹",name:"Portuguese"},{flag:"🇷🇺",name:"Russian"},{flag:"🇹🇷",name:"Turkish"},{flag:"🇦🇪",name:"Arabic"},{flag:"🇺🇿",name:"Uzbek"}];
              return(<div style={{...CARD,marginBottom:12,padding:14}}>
                <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:0.6,margin:"0 0 8px"}}>PASSAGE LANGUAGE</p>
                <div style={{display:"flex",overflowX:"auto",gap:6,paddingBottom:4}}>
                  {PASS_LANGS.map(function(l){
                    var active=passageLang===l.name;
                    return(<button key={l.name} onClick={function(){setPassageLang(l.name);}} style={{background:active?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(active?"#818cf8":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 11px",fontSize:11,color:active?"#c7d2fe":"#6b7280",cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400,whiteSpace:"nowrap",flexShrink:0}}>{l.flag} {l.name}</button>);
                  })}
                </div>
              </div>);
            })()}

            {/* theme presets */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,margin:0}}>THEME</p>
                {appTheme&&<span style={{fontSize:12,fontWeight:700,color:appTheme.accent}}>{appTheme.emoji} {appTheme.name}</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:6,marginBottom:10}}>
                {PRESET_THEMES.map(function(t){
                  var isActive=appTheme&&appTheme.id===t.id;
                  return(
                    <button key={t.id} title={t.name} onClick={function(){applyTheme(t);}} style={{background:isActive?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)",border:"2px solid "+(isActive?t.accent:"rgba(255,255,255,0.1)"),borderRadius:12,padding:"8px 4px",cursor:"pointer",textAlign:"center",boxShadow:isActive?"0 0 14px "+t.accent+"55":"none",transition:"all 0.15s ease",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,"+t.accent+" 50%,"+t.secondary+" 50%)"}}/>
                      <span style={{fontSize:13,lineHeight:1}}>{t.emoji}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={selectRandomTheme} style={{...GHOST,fontSize:11,padding:"6px 10px",width:"100%",textAlign:"center"}}>🎲 Random Theme</button>
            </div>

            {/* level selector */}
            <p style={{fontWeight:700,color:"#d1fae5",fontSize:11,letterSpacing:0.8,marginBottom:8}}>CHOOSE LEVEL</p>
            <div className="rq-lvgrid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {LEVELS.map(function(l){
                var active=level===l.key;
                var badgeId=l.key.toLowerCase();
                return(<button key={l.key} className="rq-card-3d" onClick={function(){setLevel(l.key);setError("");}} style={{background:active?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.03)",border:"2px solid "+(active?l.color:"rgba(255,255,255,0.08)"),borderRadius:14,padding:"12px 13px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",boxShadow:active?"0 0 22px "+l.glow+",0 0 40px "+l.glow+"44,inset 0 1px 0 rgba(255,255,255,0.08)":"none",display:"flex",alignItems:"center",gap:10}}>
                  <img src={"/assets/badges/badge-"+badgeId+".svg"} alt={l.key} style={{width:48,height:48,flexShrink:0}} onError={function(e){e.target.style.display="none";}}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:15,fontWeight:900,color:active?l.color:"#f3f4f6"}}>{l.key}</span>
                      <span style={{background:active?l.color:"rgba(255,255,255,0.12)",color:active?"#0d0d1a":"#d1d5db",borderRadius:999,padding:"2px 7px",fontSize:10,fontWeight:700}}>x{l.mult}</span>
                    </div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>{l.desc}</div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{formatTime(l.timeLimit)} limit</div>
                  </div>
                </button>);
              })}
            </div>
            {error&&<ErrorBanner message={error}/>}
            {error&&error.includes("Daily AI quota")&&<button onClick={function(){setStage("library");}} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",fontSize:14,marginBottom:10}}>📚 Browse Library Stories</button>}
            <button onClick={generate} disabled={!level||genLoading} style={{...mkBtn(level&&!genLoading?lv.color:"#374151",level&&!genLoading?"#0d0d1a":"#6b7280"),width:"100%",fontSize:15}}>
              {genLoading?"✨ Writing your passage...":level?"Start "+level+" Quest!":"Select a level to begin"}
            </button>

            {/* Custom Text Quiz */}
            <div style={{marginTop:10}}>
              {!customTextOpen?(
                <button onClick={function(){setCustomTextOpen(true);setCustomTextError("");}} style={{...GHOST,width:"100%",fontSize:13}}>✍️ Quiz me on my own text</button>
              ):(
                <div style={{...CARD,padding:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:700,color:"#f3f4f6"}}>✍️ Custom Text Quiz</span>
                    <button onClick={function(){setCustomTextOpen(false);setCustomText("");setCustomTextError("");}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer"}}>×</button>
                  </div>
                  <p style={{fontSize:11,color:"#6b7280",marginBottom:8}}>Paste any English text (30–3000 chars) and we'll generate questions about it.</p>
                  <textarea value={customText} onChange={function(e){setCustomText(e.target.value.slice(0,3000));}} placeholder="Paste your text here..." style={{width:"100%",minHeight:80,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f3f4f6",fontSize:12,padding:"8px 10px",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                    <span style={{fontSize:10,color:"#6b7280"}}>{customText.length}/3000</span>
                    <button onClick={doCustomTextQuiz} disabled={customTextLoading||customText.trim().length<30} style={{...mkBtn(customText.trim().length>=30?"#f59e0b":"#374151","#0d0d1a"),padding:"7px 16px",fontSize:12}}>{customTextLoading?"Generating...":"Generate Quiz"}</button>
                  </div>
                  {customTextError&&<p style={{color:"#f87171",fontSize:12,marginTop:6}}>{customTextError}</p>}
                </div>
              )}
            </div>

            {/* Notifications + Quotes quick links */}
            <div style={{display:"flex",gap:7,marginTop:8,flexWrap:"wrap"}}>
              {notifPermission!=="granted"&&<button onClick={requestNotifPermission} style={{...GHOST,flex:1,fontSize:12}}>🔔 Enable Reminders</button>}
              {notifPermission==="granted"&&<button onClick={sendTestNotification} style={{...GHOST,flex:1,fontSize:12}}>🔔 Test Notification</button>}
              {quotes.length>0&&<button onClick={function(){setStage("quotes");}} style={{...GHOST,flex:1,fontSize:12}}>🔖 Quote Book ({quotes.length})</button>}
            </div>

            {/* Join a Class */}
            {(function(){
              var myClass=currentUser?classes.find(function(c){return c.students.indexOf(currentUser.name)!==-1;})||null:null;
              return myClass?(
                <div style={{...CARD,marginTop:10,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:28}}>🏫</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#f3f4f6"}}>{myClass.name}</div>
                    <div style={{fontSize:11,color:"#6b7280"}}>Class by {myClass.teacherName}</div>
                  </div>
                </div>
              ):(
                <div style={{...CARD,marginTop:10}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",letterSpacing:0.6,marginBottom:10}}>🏫 JOIN A CLASS</p>
                  <div style={{display:"flex",gap:8}}>
                    <input value={joinClassCode} onChange={function(e){setJoinClassCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""));}} onKeyDown={function(e){if(e.key==="Enter")doJoinClass();}} placeholder="Enter class code" maxLength={6} style={{...INP,flex:1,margin:0,letterSpacing:3,fontFamily:"'JetBrains Mono',monospace",fontSize:15,textTransform:"uppercase"}}/>
                    <button onClick={doJoinClass} disabled={joinClassCode.length!==6} style={{...mkBtn(joinClassCode.length===6?"#6366f1":"#374151"),padding:"10px 16px",fontSize:13}}>Join</button>
                  </div>
                  {joinClassMsg&&<p style={{fontSize:12,color:joinClassMsg.startsWith("✓")?"#34d399":"#f87171",marginTop:8,marginBottom:0}}>{joinClassMsg}</p>}
                </div>
              );
            })()}
          </div>
        )}

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

          // Split passage into sentences for sentence TTS
          var sentences=passage.match(/[^.!?]+[.!?]+/g)||[passage];

          function WordTokens(){
            return passage.split(/(\s+)/).map(function(token,i){
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
          }

          function SentencePassage(){
            return sentences.map(function(sent,si){
              var isActive=activeSentence===sent.trim();
              return<span key={si} onClick={function(){speakSentence(sent.trim());}} style={{cursor:"pointer",borderRadius:4,padding:"1px 2px",background:isActive?"rgba(99,102,241,0.2)":"transparent",borderBottom:isActive?"2px solid #818cf8":"none",transition:"background 0.15s"}}>{sent}</span>;
            });
          }

          if(focusMode)return(
            <div>
              <button onClick={function(){setFocusMode(false);}} style={{position:"fixed",top:14,right:14,background:"rgba(13,13,26,0.85)",border:"1px solid rgba(255,255,255,0.15)",color:"#9ca3af",borderRadius:8,padding:"6px 13px",fontSize:12,cursor:"pointer",fontFamily:"inherit",zIndex:100,backdropFilter:"blur(8px)"}}>✕ Exit Focus</button>
              <div style={{paddingTop:10,paddingBottom:100}}>
                <h2 style={{margin:"0 0 18px",fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#f9fafb"}}>{topic}</h2>
                <p style={{lineHeight:1.85,fontSize:17,color:"#e5e7eb",margin:0,letterSpacing:0.2,fontFamily:"'Inter','Trebuchet MS',sans-serif"}}><WordTokens/></p>
                {activeSentence&&(
                  <div style={{...CARD,marginTop:12,padding:12,background:"rgba(99,102,241,0.08)",borderColor:"rgba(99,102,241,0.3)"}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:12,color:"#9ca3af",flex:1}}>{activeSentence}</span>
                      <button onClick={function(){translateSentence(activeSentence);}} style={{background:"rgba(99,102,241,0.15)",border:"1px solid #818cf8",color:"#a78bfa",borderRadius:7,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{translating?"...":"Translate"}</button>
                      <select value={translateLang} onChange={function(e){setTranslateLang(e.target.value);try{localStorage.setItem("rq-translate-lang",e.target.value);}catch(ex){}}} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.15)",color:"#9ca3af",borderRadius:6,padding:"3px 6px",fontSize:11,fontFamily:"inherit"}}>
                        <option value="uz">Uzbek</option><option value="ru">Russian</option><option value="tr">Turkish</option><option value="ar">Arabic</option><option value="de">German</option>
                      </select>
                    </div>
                    {translation&&<p style={{fontSize:13,color:"#c7d2fe",margin:"8px 0 0",fontStyle:"italic"}}>{translation}</p>}
                  </div>
                )}
                {selectedWord&&(
                  <div style={{...CARD,marginTop:12,background:"rgba(251,191,36,0.08)",borderColor:"rgba(251,191,36,0.3)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:17,fontWeight:900,color:"#fbbf24"}}>{selectedWord}</span>
                      <div style={{display:"flex",gap:6}}>
                        {wordDef&&wordDef.audio&&<button onClick={function(){new Audio(wordDef.audio).play().catch(function(){});}} style={{background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",borderRadius:7,padding:"4px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔊</button>}
                        <button onClick={function(){toggleWord(selectedWord);}} style={{background:savedWords.has(selectedWord)?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:savedWords.has(selectedWord)?"#06b6d4":"#9ca3af",borderRadius:7,padding:"4px 9px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{savedWords.has(selectedWord)?"⭐ Saved":"⭐ Save"}</button>
                        <button onClick={function(){setSelectedWord(null);setWordDef(null);}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:18,cursor:"pointer",lineHeight:1}}>×</button>
                      </div>
                    </div>
                    {wordDefLoading&&<><Skeleton h={12} mb={6}/><Skeleton h={12} w="70%"/></>}
                    {wordDef&&!wordDefLoading&&<><p style={{fontSize:13,color:"#d1d5db",margin:0,lineHeight:1.6}}>{wordDef.def}</p>{wordDef.example&&<p style={{fontSize:12,color:"#6b7280",margin:"4px 0 0",fontStyle:"italic"}}>"{wordDef.example}"</p>}</>}
                  </div>
                )}
              </div>
              <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(13,13,26,0.95)",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"10px 16px",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",zIndex:99,backdropFilter:"blur(10px)"}}>
                <span style={{fontSize:12,color:"#6b7280"}}>⏱ {formatTime(readingTimerSecs)}{liveWpm>0&&" · "+liveWpm+" WPM"}</span>
                <button onClick={speakPassage} style={{background:isSpeaking?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.06)",border:"1px solid "+(isSpeaking?"#818cf8":"rgba(255,255,255,0.1)"),color:isSpeaking?"#818cf8":"#9ca3af",borderRadius:8,padding:"6px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{isSpeaking?"⏹":"🔊"}</button>
                <div style={{display:"flex",gap:3}}>{[0.75,1,1.25,1.5].map(function(r){return<button key={r} onClick={function(){setSpeechRate(r);}} style={{background:speechRate===r?"rgba(99,102,241,0.3)":"rgba(255,255,255,0.04)",border:"1px solid "+(speechRate===r?"#818cf8":"rgba(255,255,255,0.08)"),color:speechRate===r?"#c7d2fe":"#6b7280",borderRadius:6,padding:"4px 7px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{r}×</button>;})}
                </div>
                {savedWords.size>0&&<span style={{fontSize:11,color:"#06b6d4",fontWeight:700}}>⭐ {savedWords.size}</span>}
                <button onClick={function(){
                  if(rsvpActive){setRsvpActive(false);setRsvpPaused(false);setRsvpIdx(0);setRsvpDone(false);}
                  else{rsvpWordsRef.current=passage.split(/\s+/).filter(Boolean);setRsvpIdx(0);setRsvpPaused(false);setRsvpDone(false);setRsvpActive(true);}
                }} style={{background:rsvpActive?"rgba(167,139,250,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(rsvpActive?"#a78bfa":"rgba(255,255,255,0.1)"),color:rsvpActive?"#a78bfa":"#9ca3af",borderRadius:8,padding:"6px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>⚡ RSVP</button>
                <button onClick={startQuiz} style={{...mkBtn(lv?lv.color:"#34d399","#0d0d1a"),marginLeft:"auto",padding:"9px 18px",fontSize:13}}>Begin Quiz →</button>
              </div>
            </div>
          );

          return(
            <div>
              {/* header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingTop:6}}>
                <span style={{...pill(lv?lv.color:"#34d399","#0d0d1a"),fontSize:12,fontWeight:900}}>{level} · {selectedTypes.length} questions</span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={function(){if(currentStoryId)toggleFav(currentStoryId,topic,level);}} style={{background:favs.some(function(f){return f.id===currentStoryId;})?"rgba(236,72,153,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(favs.some(function(f){return f.id===currentStoryId;})?"#f472b6":"rgba(255,255,255,0.12)"),color:favs.some(function(f){return f.id===currentStoryId;})?"#f472b6":"#9ca3af",borderRadius:8,padding:"5px 8px",fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6,transition:"all 0.15s ease"}}>
                    <img src="/assets/icons/icon-favorite.svg" alt="Favorite" style={{width:24,height:24}} onError={function(e){e.target.style.display="none";}}/>
                  </button>
                  <button onClick={function(){setFocusMode(true);}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"#9ca3af",borderRadius:8,padding:"6px 13px",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s ease"}}>📖 Focus</button>
                </div>
              </div>

              {/* personalised vocab banner */}
              {personalizedWords.length>0&&<div style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:10,padding:"8px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#34d399",fontWeight:700}}>📚 Personalised passage</span>
                <span style={{fontSize:11,color:"#6b7280"}}>includes your vocab words:</span>
                {personalizedWords.map(function(w){return<span key={w} style={{background:"rgba(16,185,129,0.2)",borderRadius:4,padding:"1px 6px",fontSize:11,color:"#34d399"}}>{w}</span>;})}
              </div>}

              {/* difficulty analyzer card */}
              <div style={{...CARD,padding:"10px 14px",marginBottom:10,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                <div>
                  <span style={{fontSize:10,color:"#6b7280",fontWeight:700,letterSpacing:0.5}}>DIFFICULTY </span>
                  <span style={{fontSize:13,color:"#fbbf24"}}>{"⭐".repeat(difficulty.stars)+"☆".repeat(5-difficulty.stars)}</span>
                </div>
                <div style={{fontSize:11,color:"#6b7280"}}>📖 {difficulty.wordCount} words · ~{difficulty.estReadMins} min</div>
                <div style={{fontSize:11,color:"#a78bfa"}}>🆕 ~{difficulty.newWords} new words</div>
                {liveWpm>0&&<div style={{fontSize:11,color:"#34d399",marginLeft:"auto"}}>⚡ {liveWpm} WPM · {getWpmLabel(liveWpm)}</div>}
              </div>

              {/* title + progress */}
              <h2 style={{margin:"0 0 10px",fontSize:21,fontWeight:900,color:"#f9fafb",lineHeight:1.3}}>{topic}</h2>
              <div style={{marginBottom:12}}>
                <div style={{background:"rgba(255,255,255,0.07)",borderRadius:999,height:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:readPct+"%",background:lv?lv.color:"#34d399",borderRadius:999,transition:"width 1s linear"}}/>
                </div>
              </div>

              {/* RSVP speed reader */}
              {rsvpActive&&(function(){
                var words=rsvpWordsRef.current;
                var pct=words.length>0?Math.round((rsvpIdx/(words.length-1))*100):0;
                var cur=words[rsvpIdx]||"";
                var prev=rsvpIdx>0?words[rsvpIdx-1]:"";
                var nxt=rsvpIdx<words.length-1?words[rsvpIdx+1]:"";
                // highlight the optimal recognition point (about 30% into word)
                var midIdx=Math.max(0,Math.round(cur.replace(/[^a-zA-Z]/g,"").length*0.3)-1);
                var pre=cur.slice(0,midIdx),highlight=cur.slice(midIdx,midIdx+1),post=cur.slice(midIdx+1);
                return(
                  <div style={{...CARD,marginBottom:12,padding:20}}>
                    {/* wpm selector */}
                    <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:"#6b7280",alignSelf:"center",marginRight:4}}>WPM:</span>
                      {[150,200,250,300,400,500].map(function(w){return(
                        <button key={w} onClick={function(){setRsvpWpm(w);}} style={{background:rsvpWpm===w?"rgba(167,139,250,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(rsvpWpm===w?"#a78bfa":"rgba(255,255,255,0.1)"),color:rsvpWpm===w?"#c4b5fd":"#6b7280",borderRadius:6,padding:"3px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:rsvpWpm===w?700:400}}>{w}</button>
                      );})}
                    </div>
                    {/* progress */}
                    <div style={{background:"rgba(255,255,255,0.07)",borderRadius:999,height:4,overflow:"hidden",marginBottom:20}}>
                      <div style={{height:"100%",width:pct+"%",background:"#a78bfa",borderRadius:999,transition:"width 0.1s linear"}}/>
                    </div>
                    {/* word display */}
                    {!rsvpDone?(
                      <div style={{textAlign:"center",minHeight:120,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:10}}>
                        <div style={{fontSize:13,color:"#4b5563",minHeight:20}}>{prev}</div>
                        <div style={{fontSize:42,fontWeight:900,letterSpacing:1,lineHeight:1,fontFamily:"monospace",userSelect:"none"}}>
                          <span style={{color:"#9ca3af"}}>{pre}</span>
                          <span style={{color:"#f9a8d4"}}>{highlight}</span>
                          <span style={{color:"#f9fafb"}}>{post}</span>
                        </div>
                        <div style={{fontSize:13,color:"#4b5563",minHeight:20}}>{nxt}</div>
                        <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{rsvpIdx+1} / {words.length}</div>
                      </div>
                    ):(
                      <div style={{textAlign:"center",padding:"20px 0"}}>
                        <div style={{fontSize:32,marginBottom:8}}>✓</div>
                        <div style={{fontSize:16,fontWeight:700,color:"#a78bfa",marginBottom:4}}>Speed read complete!</div>
                        <div style={{fontSize:12,color:"#9ca3af",marginBottom:16}}>{words.length} words at {rsvpWpm} WPM</div>
                        <button onClick={startQuiz} style={{...mkBtn("#a78bfa","#0d0d1a"),padding:"10px 24px",fontSize:14}}>Take the Quiz →</button>
                      </div>
                    )}
                    {/* controls */}
                    {!rsvpDone&&<div style={{display:"flex",justifyContent:"center",gap:10,marginTop:16}}>
                      <button onClick={function(){setRsvpIdx(function(i){return Math.max(0,i-10);});}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#9ca3af",borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>−10</button>
                      <button onClick={function(){setRsvpPaused(function(p){return !p;});}} style={{background:rsvpPaused?"rgba(167,139,250,0.2)":"rgba(255,255,255,0.06)",border:"1px solid "+(rsvpPaused?"#a78bfa":"rgba(255,255,255,0.1)"),color:rsvpPaused?"#c4b5fd":"#9ca3af",borderRadius:8,padding:"7px 20px",fontSize:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>{rsvpPaused?"▶ Play":"⏸ Pause"}</button>
                      <button onClick={function(){setRsvpIdx(function(i){return Math.min(Math.max(0,words.length-1),i+10);});}} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"#9ca3af",borderRadius:8,padding:"7px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>+10</button>
                    </div>}
                  </div>
                );
              })()}

              {/* passage — sentence TTS mode or word mode (hidden during RSVP) */}
              {!rsvpActive&&<div style={{...CARD,marginBottom:12}}>
                <p style={{lineHeight:2.1,fontSize:17,color:"#e5e7eb",margin:0}}>
                  {activeSentence!==null?<SentencePassage/>:<WordTokens/>}
                </p>
                <p style={{fontSize:11,color:"#4b5563",margin:"10px 0 0",textAlign:"center"}}>{activeSentence!==null?"Tap a sentence to listen":"Tap any word to look it up"}</p>
              </div>}

              {/* active sentence panel (translation) */}
              {activeSentence&&(
                <div style={{...CARD,marginBottom:12,padding:12,background:"rgba(99,102,241,0.07)",borderColor:"rgba(99,102,241,0.3)"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
                    <span style={{fontSize:12,color:"#c7d2fe",flex:1,lineHeight:1.5}}>{activeSentence}</span>
                    <button onClick={function(){translateSentence(activeSentence);}} style={{background:"rgba(99,102,241,0.15)",border:"1px solid #818cf8",color:"#a78bfa",borderRadius:7,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{translating?"...":"🌐 Translate"}</button>
                    <button onClick={function(){saveSentenceQuote(activeSentence);}} title="Save to Quote Book" style={{background:quotesSaved?"rgba(251,191,36,0.25)":"rgba(255,255,255,0.06)",border:"1px solid "+(quotesSaved?"#fbbf24":"rgba(255,255,255,0.12)"),color:quotesSaved?"#fbbf24":"#9ca3af",borderRadius:7,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>{quotesSaved?"✓ Saved":"🔖 Save"}</button>
                    <select value={translateLang} onChange={function(e){setTranslateLang(e.target.value);try{localStorage.setItem("rq-translate-lang",e.target.value);}catch(ex){}}} style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.15)",color:"#9ca3af",borderRadius:6,padding:"3px 6px",fontSize:11,fontFamily:"inherit"}}>
                      <option value="uz">Uzbek</option><option value="ru">Russian</option><option value="tr">Turkish</option><option value="ar">Arabic</option><option value="de">German</option>
                    </select>
                    <button onClick={function(){setActiveSentence(null);setTranslation(null);}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>
                  </div>
                  {translation&&<p style={{fontSize:13,color:"#c7d2fe",margin:0,fontStyle:"italic"}}>{translation}</p>}
                </div>
              )}

              {/* vocab popup */}
              {selectedWord&&!activeSentence&&(
                <div style={{...CARD,marginBottom:12,background:"rgba(251,191,36,0.07)",borderColor:"rgba(251,191,36,0.3)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <span style={{fontSize:19,fontWeight:900,color:"#fbbf24"}}>{selectedWord}</span>
                      {wordDef&&wordDef.phonetic&&<span style={{fontSize:12,color:"#9ca3af",marginLeft:9}}>{wordDef.phonetic}</span>}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                      {wordDef&&wordDef.audio&&<button onClick={function(){new Audio(wordDef.audio).play().catch(function(){});}} style={{background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",borderRadius:7,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔊</button>}
                      <button onClick={function(){toggleWord(selectedWord);}} style={{background:savedWords.has(selectedWord)?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:savedWords.has(selectedWord)?"#06b6d4":"#9ca3af",borderRadius:7,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{savedWords.has(selectedWord)?"⭐ Saved":"⭐ Save"}</button>
                      <button onClick={function(){setSelectedWord(null);setWordDef(null);}} style={{background:"transparent",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer",lineHeight:1,padding:"0 2px"}}>×</button>
                    </div>
                  </div>
                  {wordDefLoading&&<><Skeleton h={12} mb={6}/><Skeleton h={12} w="70%"/></>}
                  {wordDef&&!wordDefLoading&&(
                    <>
                      <p style={{fontSize:14,color:"#d1d5db",margin:0,lineHeight:1.7}}>{wordDef.def}</p>
                      {wordDef.example&&<p style={{fontSize:12,color:"#6b7280",margin:"5px 0 0",fontStyle:"italic"}}>e.g. "{wordDef.example}"</p>}
                    </>
                  )}
                </div>
              )}

              {/* bottom action bar */}
              <div style={{...CARD,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:"#9ca3af"}}>⏱ {formatTime(readingTimerSecs)}</span>
                <button onClick={speakPassage} style={{background:isSpeaking&&!activeSentence?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:isSpeaking&&!activeSentence?"#818cf8":"#9ca3af",borderRadius:8,padding:"5px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,minWidth:40,justifyContent:"center",transition:"all 0.15s ease"}}>
                  <img src="/assets/icons/icon-audio.svg" alt="Audio" style={{width:20,height:20}} onError={function(e){e.target.style.display="none";}}/>
                </button>
                <button onClick={function(){setActiveSentence(activeSentence!==null?null:"");setTranslation(null);}} style={{background:activeSentence!==null?"rgba(99,102,241,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(activeSentence!==null?"#818cf8":"rgba(255,255,255,0.1)"),color:activeSentence!==null?"#a78bfa":"#9ca3af",borderRadius:8,padding:"5px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,minWidth:40,justifyContent:"center",transition:"all 0.15s ease"}}>
                  <img src="/assets/icons/icon-translate.svg" alt="Translate" style={{width:20,height:20}} onError={function(e){e.target.style.display="none";}}/>
                </button>
                <button onClick={function(){setHeatmapOn(function(h){return!h;});}} style={{background:heatmapOn?"rgba(245,158,11,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(heatmapOn?"#f59e0b":"rgba(255,255,255,0.1)"),color:heatmapOn?"#fbbf24":"#9ca3af",borderRadius:8,padding:"5px 8px",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,minWidth:40,justifyContent:"center",transition:"all 0.15s ease"}}>
                  <img src="/assets/icons/icon-heatmap.svg" alt="Heatmap" style={{width:20,height:20}} onError={function(e){e.target.style.display="none";}}/>
                </button>
                <button onClick={function(){setHlMode(function(m){return!m;});}} title="Highlight mode: tap words to mark them" style={{background:hlMode?"rgba(251,191,36,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(hlMode?"#fbbf24":"rgba(255,255,255,0.1)"),color:hlMode?"#fde68a":"#9ca3af",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s ease",display:"flex",alignItems:"center",gap:4}}>
                  ✏️{hlMode?" On":" Off"}
                  {hlWords.size>0&&<span style={{background:"rgba(251,191,36,0.3)",borderRadius:999,padding:"0 5px",fontSize:10,fontWeight:700,color:"#fde68a"}}>{hlWords.size}</span>}
                </button>
                <button onClick={function(){setPronMode(function(p){return!p;});setPronSentence("");setPronResult(null);setPronRecording(false);}} style={{background:pronMode?"rgba(236,72,153,0.2)":"rgba(255,255,255,0.05)",border:"1px solid "+(pronMode?"#ec4899":"rgba(255,255,255,0.1)"),color:pronMode?"#f472b6":"#9ca3af",borderRadius:8,padding:"5px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s ease"}}>🎤 {pronMode?"Exit":"Pronounce"}</button>
                <div style={{display:"flex",gap:3,marginLeft:"auto"}}>{[0.75,1,1.25,1.5].map(function(r){return<button key={r} onClick={function(){setSpeechRate(r);}} style={{background:speechRate===r?"rgba(99,102,241,0.3)":"rgba(255,255,255,0.04)",border:"1px solid "+(speechRate===r?"#818cf8":"rgba(255,255,255,0.06)"),color:speechRate===r?"#c7d2fe":"#6b7280",borderRadius:6,padding:"3px 7px",fontSize:10,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s ease"}}>{r}×</button>;})}
                </div>
              </div>

              {/* pronunciation check panel */}
              {pronMode&&(function(){
                var sentences=splitSentences(passage);
                return(
                  <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(236,72,153,0.3)",background:"rgba(236,72,153,0.04)"}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#f472b6",marginBottom:10}}>🎤 PRONUNCIATION CHECK</p>
                    {!pronSentence?(
                      <>
                        <p style={{fontSize:12,color:"#9ca3af",marginBottom:8}}>Tap a sentence to practise:</p>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {sentences.map(function(s,i){
                            return<button key={i} onClick={function(){setPronSentence(s);setPronResult(null);}} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"8px 12px",color:"#d1d5db",fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left",lineHeight:1.6}}>{s}</button>;
                          })}
                        </div>
                      </>
                    ):(
                      <>
                        <div style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:14,color:"#e5e7eb",lineHeight:1.7,fontStyle:"italic"}}>"{pronSentence}"</div>
                        <div style={{display:"flex",gap:8,marginBottom:10}}>
                          <button onClick={function(){startPronCheck(pronSentence);}} disabled={pronRecording} style={{...mkBtn(pronRecording?"#ef4444":"#ec4899"),flex:1,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                            {pronRecording?<><span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"#fff",animation:"rqFloat 0.6s ease-in-out infinite"}}/>Recording…</>:"🎤 Record"}
                          </button>
                          {pronRecording&&<button onClick={function(){if(pronRecRef.current)pronRecRef.current.stop();}} style={{...mkBtn("#374151"),fontSize:13}}>⏹ Stop</button>}
                          <button onClick={function(){setPronSentence("");setPronResult(null);}} style={{...GHOST,fontSize:12}}>← Back</button>
                        </div>
                        {pronResult&&pronResult.error&&<ErrorBanner message={pronResult.error} marginBottom={8}/>}
                        {pronResult&&!pronResult.error&&(
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                              <div style={{fontSize:26,fontWeight:900,color:pronResult.accuracy>=80?"#22c55e":pronResult.accuracy>=60?"#f59e0b":"#ef4444"}}>{pronResult.accuracy}%</div>
                              <div>
                                <div style={{fontSize:12,fontWeight:700,color:"#f3f4f6"}}>{pronResult.accuracy>=80?"Excellent!":pronResult.accuracy>=60?"Good effort!":"Keep practising!"}</div>
                                <div style={{fontSize:11,color:"#6b7280"}}>Heard: "{pronResult.transcript}"</div>
                              </div>
                            </div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                              {pronResult.words.map(function(w,i){
                                var bg=w.status==="correct"?"rgba(34,197,94,0.2)":w.status==="close"?"rgba(245,158,11,0.2)":"rgba(239,68,68,0.2)";
                                var col=w.status==="correct"?"#4ade80":w.status==="close"?"#fbbf24":"#f87171";
                                return<span key={i} title={w.heard?("heard: "+w.heard):""} style={{background:bg,color:col,borderRadius:6,padding:"3px 8px",fontSize:13,fontWeight:600,cursor:w.heard?"help":"default"}}>{w.word}</span>;
                              })}
                            </div>
                            <div style={{display:"flex",gap:6,fontSize:10,color:"#6b7280",flexWrap:"wrap",marginBottom:8}}>
                              {[["rgba(34,197,94,0.2)","#4ade80","Correct"],["rgba(245,158,11,0.2)","#fbbf24","Close (hover to see)"],["rgba(239,68,68,0.2)","#f87171","Missed"]].map(function(p){return<span key={p[2]} style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:10,height:10,borderRadius:3,background:p[0],border:"1px solid "+p[1],display:"inline-block"}}/>{p[2]}</span>;})}
                            </div>
                            <button onClick={function(){setPronResult(null);}} style={{...mkBtn("#374151"),fontSize:12,width:"100%"}}>Try again</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              <div style={{...CARD,marginBottom:10,padding:"10px 14px",borderColor:challengeMode?"rgba(245,158,11,0.5)":"rgba(255,255,255,0.08)",background:challengeMode?"rgba(245,158,11,0.06)":"rgba(255,255,255,0.02)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:challengeMode?"#fbbf24":"#9ca3af"}}>⚡ Challenge Mode</div>
                    <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Half the time · 1.5× XP if you finish</div>
                  </div>
                  <button onClick={function(){setChallengeMode(function(v){return !v;});}} style={{background:challengeMode?"#f59e0b":"rgba(255,255,255,0.08)",border:"none",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:700,color:challengeMode?"#0d0d1a":"#6b7280",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{challengeMode?"ON":"OFF"}</button>
                </div>
              </div>
              <button onClick={startQuiz} style={{...mkBtn(lv?lv.color:"#f59e0b","#0d0d1a"),width:"100%",fontSize:15,padding:"14px 0"}}>Begin Quiz →</button>
            </div>
          );
        })()}

        {/* ── QUIZ ──────────────────────────────────────────── */}
        {stage==="quiz"&&q&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",gap:5}}>
                <span style={pill("#7c3aed")}>Q{current+1}/{questions.length}</span>
                <span style={pill("rgba(255,255,255,0.07)","#c7d2fe")}>{Q_LABELS[q.type]||q.type}</span>
                {streak>=3&&<span style={pill("#dc2626")}>Streak {streak}</span>}
              </div>
              <span style={{background:"rgba(255,255,255,0.07)",borderRadius:999,padding:"4px 11px",fontSize:12,color:lv?lv.color:"#34d399",fontWeight:700}}>{totalXpSoFar} XP</span>
            </div>
            <div style={{...CARD,padding:"11px 14px",marginBottom:9,borderColor:challengeMode?"rgba(245,158,11,0.4)":"rgba(255,255,255,0.08)",background:challengeMode?"rgba(245,158,11,0.05)":"transparent"}}>
              {challengeMode&&<div style={{fontSize:10,fontWeight:700,color:"#f59e0b",letterSpacing:0.8,marginBottom:6}}>⚡ CHALLENGE MODE · 1.5× XP</div>}
              <Timer limit={challengeMode?Math.floor((lv?lv.timeLimit:180)/2):(lv?lv.timeLimit:180)} running={timerRunning} onExpire={handleExpire}/>
            </div>
            {/* ── hint banner ── */}
            {Q_HINTS[q.type]&&!dismissedHints.has(q.type)&&(
              <div style={{marginBottom:9,background:"rgba(99,102,241,0.08)",border:"1px solid rgba(99,102,241,0.28)",borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"flex-start",gap:9,animation:"rqFadeIn 0.3s ease both"}}>
                <span style={{fontSize:16,flexShrink:0}}>💡</span>
                <p style={{margin:0,fontSize:12,color:"#c7d2fe",lineHeight:1.55,flex:1}}>{Q_HINTS[q.type]}</p>
                <button onClick={function(){setDismissedHints(function(s){var n=new Set(s);n.add(q.type);return n;});}} style={{background:"none",border:"none",color:"#6b7280",cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0,padding:0}} title="Got it">✕</button>
              </div>
            )}
            <div style={{marginBottom:9}}>
              <button onClick={function(){setShowPassage(function(p){return!p;});}} style={{width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px 12px",color:"#9ca3af",fontFamily:"inherit",fontWeight:600,fontSize:12,cursor:"pointer",textAlign:"left"}}>{showPassage?"Hide passage":"Show passage"}</button>
              {showPassage&&(<div style={{background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.1)",borderTop:"none",borderRadius:"0 0 10px 10px",padding:"12px 14px"}}><p style={{lineHeight:1.9,fontSize:15,color:"#d1d5db",margin:0}}>{passage}</p></div>)}
            </div>
            <div style={CARD}>
              {(q.q)&&<p style={{fontSize:17,fontWeight:700,lineHeight:1.6,marginBottom:14,color:"#f9fafb"}}>{q.q}</p>}
              {(q.instruction)&&<p style={{fontSize:16,fontWeight:700,marginBottom:12,color:"#f9fafb"}}>{q.instruction}</p>}
              {q.type==="gap_word"&&!q.q&&<p style={{fontSize:16,fontWeight:700,marginBottom:10,color:"#f9fafb"}}>Fill in the blank:</p>}
              {q.type==="mcq"&&<McqQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="gap_word"&&<GapWordQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="gap_sentence"&&<GapSentQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="matching"&&<MatchingQ q={q} matches={matchState} conf={confirmed} shuffled={shuffledRights} onMatch={function(li,ri){var origIdx=q.rights?q.rights.indexOf(shuffledRights[ri]):ri;setMatchState(function(m){var n={};for(var k in m)n[k]=m[k];n[li]=origIdx;return n;});}}/>}
              {q.type==="heading"&&<HeadingQ q={q} userMap={headingState} conf={confirmed} onMatch={function(pi,hi){setHeadingState(function(m){var n={};for(var k in m)n[k]=m[k];n[pi]=hi;return n;});}}/>}
              {q.type==="qa"&&<QAQ q={q} val={userAnswers[current]||""} conf={confirmed} onChange={function(v){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=v;return n;});}}/>}
              {q.type==="tfnm"&&<TfnmQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {q.type==="ynng"&&<YnngQ q={q} sel={userAnswers[current]!==undefined?userAnswers[current]:null} conf={confirmed} onSel={function(i){setUserAnswers(function(a){var n={};for(var k in a)n[k]=a[k];n[current]=i;return n;});}}/>}
              {confirmed&&q.explanation&&q.type!=="qa"&&(<div style={{marginTop:10,padding:"9px 11px",borderRadius:10,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.3)",fontSize:12,color:"#d1fae5"}}>{q.explanation}</div>)}
              <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
                {!confirmed?<button onClick={doConfirm} disabled={!canConfirm()} style={mkBtn(canConfirm()?"#6366f1":"#374151")}>Check Answer</button>
                :<button onClick={doNext} style={mkBtn(lv?lv.color:"#34d399","#0d0d1a")}>{current+1>=questions.length?"See Results":"Next Question"}</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ────────────────────────────────────────── */}
        {stage==="result"&&result&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:50,marginBottom:5}}>{result.pct>=80?"★":"○"}</div>
            <h2 style={{fontSize:22,fontWeight:900,margin:"0 0 4px",color:lv?lv.color:"#34d399"}}>{result.pct>=80?"Excellent!":result.pct>=60?"Good job!":"Keep going!"}</h2>
            <p style={{color:"#9ca3af",marginBottom:14,fontSize:13}}>{level} - {topic}</p>
            <div className="rq-floating" style={{...CARD,marginBottom:10,position:"relative"}}>
              <div className="rq-glow-green" style={{fontSize:38,fontWeight:900,color:"#f9fafb",marginBottom:3}}>{result.score}/{result.maxScore} pts</div>
              <div style={{marginBottom:10,fontSize:18}}>{"★".repeat(result.stars)+"☆".repeat(5-result.stars)}</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                {[{v:result.xp+" XP",l:"earned",c:lv?lv.color:"#34d399"},{v:result.pct+"%",l:"score",c:pctColor(result.pct)},{v:formatTime(result.timeSecs),l:"time",c:"#a78bfa"},{v:"#"+(result.rank+1),l:"rank",c:"#fbbf24"},(result.wpm>0?{v:result.wpm+" WPM",l:getWpmLabel(result.wpm),c:"#34d399"}:null)].filter(Boolean).map(function(s){return<div key={s.l} style={{textAlign:"center",flex:1,minWidth:60,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:13,fontWeight:900,fontFamily:"'JetBrains Mono',monospace",color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;})}
              </div>
              <div className="rq-float-up" style={{color:lv?lv.color:"#34d399",fontSize:22,fontFamily:"'JetBrains Mono',monospace",fontWeight:900,left:"50%",transform:"translateX(-50%)",top:"50%"}} key="xp-float">+{result.xp} XP</div>
              {result.timeBonus>0&&<div style={{marginTop:9,padding:"6px 11px",borderRadius:8,background:"rgba(251,191,36,0.1)",border:"1px solid #fbbf24",fontSize:12,color:"#fbbf24"}}>Speed bonus: +{result.timeBonus} XP!</div>}
            </div>
            {result.wasChallenge&&(
              <div style={{...CARD,marginBottom:10,padding:14,background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))",borderColor:"rgba(245,158,11,0.5)",textAlign:"center"}}>
                <div style={{fontSize:28,marginBottom:4}}>⚡</div>
                <div style={{fontSize:15,fontWeight:900,color:"#fbbf24",marginBottom:2}}>Challenge Complete!</div>
                <div style={{fontSize:12,color:"#9ca3af"}}>You beat the clock — 1.5× XP applied</div>
              </div>
            )}
            {result.newBadges&&result.newBadges.length>0&&(
              <div style={{...CARD,marginBottom:10,background:"rgba(251,191,36,0.08)",borderColor:"rgba(251,191,36,0.4)"}}>
                <p style={{fontWeight:700,fontSize:12,color:"#fbbf24",marginBottom:10,textAlign:"left"}}>🏅 NEW BADGE{result.newBadges.length>1?"S":""} UNLOCKED!</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {result.newBadges.map(function(id,i){
                    var b=BADGES.find(function(x){return x.id===id;});
                    if(!b)return null;
                    return(<div key={id} className="rq-pop" style={{display:"flex",alignItems:"center",gap:8,background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:10,padding:"8px 12px",flex:"1 1 auto",animationDelay:i*0.12+"s"}}>
                      <span style={{fontSize:22}}>{b.icon}</span>
                      <div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>{b.name}</div><div style={{fontSize:11,color:"#9ca3af"}}>{b.desc}</div></div>
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
                  </div>
                </div>
              </div>
            )}
            {result.completedGoals&&result.completedGoals.length>0&&(
              <div style={{...CARD,marginBottom:10,background:"rgba(99,102,241,0.08)",borderColor:"rgba(99,102,241,0.4)"}}>
                <p style={{fontWeight:700,fontSize:12,color:"#818cf8",marginBottom:8,textAlign:"left"}}>🎯 GOAL{result.completedGoals.length>1?"S":""} ACHIEVED!</p>
                {result.completedGoals.map(function(id){
                  var def=GOAL_DEFS.find(function(d){return d.id===id;});
                  return def?(
                    <div key={id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontSize:16}}>{def.icon}</span>
                      <span style={{fontSize:13,color:"#c7d2fe",fontWeight:600}}>{def.label}</span>
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
              <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>BREAKDOWN</p>
              {result.answers&&result.answers.map?result.answers.map(function(ok,i){return<div key={i} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:6}}><span style={{fontSize:13,color:ok?"#34d399":"#ef4444"}}>{ok?"✓":"✕"}</span><span style={{fontSize:12,color:"#d1d5db",flex:1}}>{questions[i]?questions[i].q||questions[i].instruction||questions[i].sentence||("Q "+(i+1)):""}</span></div>;}):null}
            </div>
            {result.typeStats&&Object.keys(result.typeStats).length>1&&(
              <div style={{...CARD,marginBottom:10,textAlign:"left"}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:10}}>BY QUESTION TYPE</p>
                {Object.keys(result.typeStats).map(function(t){
                  var ts=result.typeStats[t];var tp=ts.max>0?Math.round(ts.earned/ts.max*100):0;
                  return(<div key={t} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                      <span style={{color:"#9ca3af"}}>{Q_LABELS[t]||t}</span>
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
                  <div style={{fontSize:13,fontWeight:700,color:"#fbbf24",marginBottom:2}}>✍️ Writing Challenge</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>Write a short summary of the passage and get AI feedback on your writing.</div>
                </div>
                <button onClick={function(){setWriteSummary("");setWriteFeedback(null);setWriteError("");setStage("writefeedback");}} style={{...mkBtn("#f59e0b","#0d0d1a"),padding:"8px 16px",fontSize:12,flexShrink:0}}>Start →</button>
              </div>
            </div>
            <div style={{...CARD,marginBottom:10,padding:14,background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.3)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#f87171",marginBottom:2}}>🔍 Error Hunt</div>
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
                  var today=new Date().toLocaleDateString();
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
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              <button onClick={function(){setLbLevel(level);setStage("leaderboard");}} style={{...mkBtn("#6366f1"),flex:1,fontSize:12}}>Leaderboard</button>
              {result.storyId&&<button onClick={function(){setDiscussStoryId(result.storyId);setStage("discuss");}} style={{...mkBtn("#ec4899"),flex:1,fontSize:12}}>💬 Discuss</button>}
              <button onClick={function(){setTutorChat([]);setStage("tutor");}} style={{...mkBtn("#0891b2"),flex:1,fontSize:12}}>🤖 Tutor</button>
              <button onClick={doShare} style={{...mkBtn("#a78bfa"),flex:1,fontSize:12}} title="Share your result">📤 Share</button>
              {quotes.length>0&&<button onClick={function(){setStage("quotes");}} style={{...mkBtn("#f59e0b","#0d0d1a"),flex:1,fontSize:12}}>🔖 Quotes</button>}
              <button onClick={function(){setStage("profile");}} style={{...mkBtn("#7c3aed"),flex:1,fontSize:12}}>Profile</button>
              <button onClick={doRestart} style={{...mkBtn(lv?lv.color:"#34d399","#0d0d1a"),flex:1,fontSize:12}}>Play Again</button>
            </div>
          </div>
        )}

        {/* ── MISSED-QUESTION REVIEW ────────────────────────── */}
        {stage==="review"&&currentUser&&(function(){
          var todayL=new Date().toLocaleDateString();
          var due=reviewQueue.filter(function(r){return r.nextReview<=todayL;});
          if(!due.length)return(
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{fontSize:40,marginBottom:12}}>✅</div>
              <div style={{fontSize:16,fontWeight:700,color:"#34d399",marginBottom:8}}>All caught up!</div>
              <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>No reviews due today.</div>
              <button onClick={function(){setStage("home");}} style={{...mkBtn("#6366f1"),padding:"10px 24px"}}>Back to Home</button>
            </div>
          );
          if(reviewIdx>=due.length){
            return(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:40,marginBottom:12}}>🎉</div>
                <div style={{fontSize:16,fontWeight:700,color:"#34d399",marginBottom:8}}>Review complete!</div>
                <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>You reviewed {due.length} question{due.length!==1?"s":""}.</div>
                <button onClick={function(){setStage("home");}} style={{...mkBtn("#6366f1"),padding:"10px 24px"}}>Back to Home</button>
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
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:16}}>
                <button onClick={function(){setStage("home");}} style={GHOST}>← Home</button>
                <h2 style={{margin:0,fontSize:17,fontWeight:900,color:"#c084fc"}}>🔁 Review</h2>
                <span style={{fontSize:12,color:"#6b7280"}}>{reviewIdx+1}/{due.length}</span>
              </div>
              {/* progress bar */}
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,marginBottom:16,overflow:"hidden"}}>
                <div style={{height:"100%",width:(reviewIdx/due.length*100)+"%",background:"#a855f7",borderRadius:999,transition:"width 0.3s"}}/>
              </div>
              <div style={{...CARD,marginBottom:12,padding:14}}>
                <div style={{fontSize:10,color:"#6b7280",letterSpacing:0.6,marginBottom:6}}>{item.topic} · {item.level} · {Q_LABELS[rq2.type]||rq2.type}</div>
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
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#06b6d4"}}>Vocabulary</h2>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {vocab.length>=2&&<button onClick={function(){setVocabGameMode(null);setVocabGameIdx(0);setVocabGameScore(0);setVocabGameAnswered(null);setStage("vocabgame");}} style={{...mkBtn("#a78bfa","#0d0d1a"),padding:"7px 14px",fontSize:12}}>🎮 Practice</button>}
                  {vocab.length>0&&<button onClick={function(){doExportVocab("csv");}} style={{...GHOST,padding:"7px 12px",fontSize:12}} title="Export as CSV">⬇ CSV</button>}
                  {vocab.length>0&&<button onClick={function(){doExportVocab("anki");}} style={{...GHOST,padding:"7px 12px",fontSize:12}} title="Export for Anki">🃏 Anki</button>}
                  <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
                </div>
              </div>
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
                  <button onClick={doRestart} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:14}}>Start Reading</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── DAILY LEADERBOARD ─────────────────────────────── */}
        {stage==="dailyleaderboard"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#fbbf24"}}>Daily Board</h2>
              <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
            </div>
            <p style={{color:"#6b7280",fontSize:12,marginBottom:12}}>Today · {new Date().toLocaleDateString()} · B1</p>
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
            {!(dailyDone&&dailyDone.date===new Date().toLocaleDateString())&&<button onClick={startDailyChallenge} style={{...mkBtn("#06b6d4","#0d0d1a"),width:"100%",marginTop:12}}>Play Today's Challenge</button>}
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
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#34d399"}}>Reading History</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
              </div>

              {/* level filter pills */}
              <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
                <button onClick={function(){setHistoryLevel("");}} style={{background:historyLevel===""?"#34d399":"rgba(255,255,255,0.05)",color:historyLevel===""?"#0d0d1a":"#9ca3af",border:"1px solid "+(historyLevel===""?"#34d399":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>All</button>
                {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setHistoryLevel(l.key);}} style={{background:historyLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:historyLevel===l.key?"#0d0d1a":"#9ca3af",border:"1px solid "+(historyLevel===l.key?l.color:"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
              </div>

              {/* summary bar */}
              {filtered.length>0&&(
                <div style={{display:"flex",gap:7,marginBottom:12}}>
                  {[{v:filtered.length,l:"Sessions",c:"#34d399"},{v:totalXp,l:"Total XP",c:"#fbbf24"},{v:avgPct+"%",l:"Avg Score",c:pctColor(avgPct)}].map(function(s){
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
                  <button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),marginTop:14}}>Start Reading</button>
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
                          {g.topic&&g.level&&<button onClick={function(){setLevel(g.level);setCustomTopic(g.topic);doRestart();}} title="Retry this topic" style={{background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399",borderRadius:7,padding:"4px 8px",fontSize:11,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>↩ Retry</button>}
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
        {stage==="leaderboard"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#fbbf24"}}>Leaderboard</h2>
              <button onClick={function(){setStage(currentUser?"home":"auth");}} style={GHOST}>Back</button>
            </div>
            <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
              {LEVELS.map(function(l){return<button key={l.key} onClick={function(){setLbLevel(l.key);}} style={{background:lbLevel===l.key?l.color:"rgba(255,255,255,0.05)",color:lbLevel===l.key?"#0d0d1a":"#9ca3af",border:"1px solid "+(lbLevel===l.key?l.color:"rgba(255,255,255,0.1)"),borderRadius:999,padding:"4px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l.key}</button>;})}
            </div>
            {(function(){
              var bd=boards[lbLevel]||[];var lvd=getLv(lbLevel);
              if(!bd.length)return<div style={{...CARD,textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>🏆</div><div style={{fontSize:16,fontWeight:800,color:"#f3f4f6",marginBottom:4}}>No scores yet</div><div style={{fontSize:13,color:"#6b7280",marginBottom:14}}>Be the first to complete a {lbLevel} quiz!</div><button onClick={function(){setLevel(lbLevel);doRestart();}} style={{...mkBtn(lvd?lvd.color:"#34d399","#0d0d1a"),marginTop:8}}>Play {lbLevel} Quiz</button></div>;
              return(<div style={CARD}>
                <div style={{display:"flex",padding:"0 0 7px",borderBottom:"1px solid rgba(255,255,255,0.06)",marginBottom:5}}>
                  {["#","PLAYER","XP","%","TIME"].map(function(h,i){return<span key={h} style={{fontSize:10,color:"#4b5563",width:i===0?28:i===1?"1fr":i===2?55:i===3?36:46,flex:i===1?1:0,textAlign:i>1?"right":"left"}}>{h}</span>;})}
                </div>
                {bd.map(function(e,i){
                  var isMe=currentUser&&e.name===currentUser.name;
                  return(<div key={i} className="rq-lb-row" onClick={function(){if(currentUser&&e.name===currentUser.name){setStage("profile");}else{setViewingUser(e.name);setStage("friendProfile");}}} style={{display:"flex",alignItems:"center",padding:"8px "+(isMe?"5px":"0"),borderBottom:i<bd.length-1?"1px solid rgba(255,255,255,0.05)":"none",background:isMe?"rgba(52,211,153,0.06)":"transparent",borderRadius:7,marginBottom:2,cursor:"pointer",userSelect:"none"}}>
                    {i<3?(<img src={"/assets/icons/medal-"+(i+1)+".svg"} alt={"Rank "+(i+1)} style={{width:28,height:28,flexShrink:0}} onError={function(e){e.target.style.display="none";e.target.parentElement.insertBefore(document.createElement("span"),e.target.nextSibling).textContent=i===0?"1st":i===1?"2nd":"3rd";}}/>):(<span style={{width:28,fontSize:11,color:"#6b7280",fontWeight:700}}>{i+1}</span>)}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:isMe?lvd.color:"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</div>
                      <div style={{fontSize:10,color:"#4b5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.topic}</div>
                    </div>
                    <span style={{width:55,textAlign:"right",fontWeight:800,color:"#fbbf24",fontSize:12}}>{e.xp}</span>
                    <span style={{width:36,textAlign:"right",fontSize:12,color:pctColor(e.pct)}}>{e.pct}%</span>
                    <span style={{width:46,textAlign:"right",fontSize:11,color:"#6b7280"}}>{formatTime(e.timeSecs)}</span>
                  </div>);
                })}
              </div>);
            })()}
            {currentUser&&<button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:12}}>Play and Climb!</button>}
          </div>
        )}

        {/* ── FRIENDS ───────────────────────────────────────── */}
        {stage==="friends"&&currentUser&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#a78bfa"}}>Friends</h2>
              <button onClick={function(){setStage("home");setSocialMsg("");}} style={GHOST}>Back</button>
            </div>
            {socialMsg&&<div style={{background:"rgba(52,211,153,0.1)",border:"1px solid #34d399",borderRadius:10,padding:"8px 12px",fontSize:13,color:"#34d399",marginBottom:10}}>{socialMsg}</div>}

            {/* tabs */}
            <div style={{display:"flex",gap:5,marginBottom:14}}>
              {[["search","Search"],["requests","Requests ("+(myData.requests.length)+")"],["list","My Friends ("+myData.friends.length+")"]].map(function(t){
                return<button key={t[0]} onClick={function(){setFriendStage(t[0]);setSocialMsg("");}} style={{background:friendStage===t[0]?"#a78bfa":"rgba(255,255,255,0.05)",color:friendStage===t[0]?"#0d0d1a":"#9ca3af",border:"none",borderRadius:999,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t[1]}</button>;
              })}
            </div>

            {/* SEARCH */}
            {friendStage==="search"&&(
              <div>
                <div style={{position:"relative",marginBottom:8}}>
                  <input style={{...INP,paddingLeft:36}} placeholder="Search by username (min 2 chars)..." value={searchQuery} onChange={function(e){setSearchQuery(e.target.value);}}/>
                  <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:0.5}}>🔍</span>
                </div>
                <button onClick={function(){loadUsers().then(function(u){setAllUsers(u);setSocialMsg("User list refreshed!");});}} style={{...mkBtn("#374151"),width:"100%",marginBottom:12,fontSize:13,padding:"9px 0"}}>Refresh User List</button>
                {getSearchResults().map(function(u){
                  var isFriend=myData.friends.indexOf(u.name)!==-1;
                  var requested=(getSocial(social,u.name).requests||[]).indexOf(currentUser.name)!==-1;
                  var uData=getSocial(social,u.name);
                  var uTotalXp=u.games?u.games.reduce(function(s,g){return s+g.xp;},0):0;
                  var uLevel=getUserLevel(uTotalXp);
                  return(<div key={u.name} className="rq-raised" style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",flexShrink:0}}>{u.name[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{u.name}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>Lvl {uLevel} | Games: {u.games?u.games.length:0} | {uTotalXp} XP | Likes: {uData.likes||0}</div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={function(){setViewingUser(u.name);setStage("friendProfile");}} style={{...mkBtn("#374151"),padding:"5px 9px",fontSize:11}}>View</button>
                      {!isFriend&&!requested&&<button onClick={function(){sendRequest(u.name);}} style={{...mkBtn("#6366f1"),padding:"5px 9px",fontSize:11}}>+ Add</button>}
                      {requested&&<span style={{background:"rgba(99,102,241,0.2)",border:"1px solid rgba(99,102,241,0.5)",color:"#a78bfa",borderRadius:999,padding:"4px 9px",fontSize:11,fontWeight:700}}>📨 Sent</span>}
                      {isFriend&&<span style={{background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.4)",color:"#34d399",borderRadius:999,padding:"4px 9px",fontSize:11,fontWeight:700}}>✓ Friends</span>}
                    </div>
                  </div>);
                })}
                {searchQuery.length>=2&&getSearchResults().length===0&&<p style={{color:"#6b7280",textAlign:"center",padding:20}}>No users found for "{searchQuery}"</p>}
              </div>
            )}

            {/* REQUESTS */}
            {friendStage==="requests"&&(
              <div>
                {myData.requests.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>📬</div><div style={{fontSize:16,fontWeight:800,color:"#f3f4f6",marginBottom:4}}>No pending requests</div><div style={{fontSize:13,color:"#6b7280"}}>Your friend requests are all set!</div></div>}
                {myData.requests.map(function(from){
                  return(<div key={from} style={{...CARD,marginBottom:8,padding:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{from[0].toUpperCase()}</div>
                    <span style={{flex:1,fontSize:14,fontWeight:600,color:"#f3f4f6"}}>{from} wants to be friends</span>
                    <button onClick={function(){acceptRequest(from);}} style={{...mkBtn("#22c55e","#0d0d1a"),padding:"6px 11px",fontSize:12}}>Accept</button>
                    <button onClick={function(){declineRequest(from);}} style={{...mkBtn("#374151"),padding:"6px 11px",fontSize:12}}>Decline</button>
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
                  var fTotalXp=fuGames.reduce(function(s,g){return s+g.xp;},0);
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
                          {Object.keys(Q_LABELS).map(function(t){var on=challengeTypes.indexOf(t)!==-1;return<button key={t} onClick={function(){setChallengeTypes(function(prev){var on2=prev.indexOf(t)!==-1;if(on2&&prev.length===1)return prev;if(on2)return prev.filter(function(x){return x!==t;});return prev.concat([t]);});}} style={{background:on?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.04)",border:"1px solid "+(on?"#818cf8":"rgba(255,255,255,0.1)"),borderRadius:999,padding:"3px 9px",fontSize:10,color:on?"#c7d2fe":"#6b7280",cursor:"pointer",fontFamily:"inherit"}}>{Q_LABELS[t]}</button>;})}
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
          if(!fu)return<div style={{textAlign:"center",padding:40}}><p style={{color:"#6b7280"}}>User not found.</p><button onClick={function(){setStage("friends");}} style={GHOST}>Back</button></div>;
          var fData=getSocial(social,viewingUser);
          fData=fData||{friends:[],requests:[],likes:0,challenges:[]};
          var isFriend=myData.friends.indexOf(viewingUser)!==-1;
          var requested=(fData.requests||[]).indexOf(currentUser.name)!==-1;
          var alreadyLiked=hasLiked(social,currentUser.name,viewingUser);
          var fuGames=fu&&fu.games?fu.games:[];
          var fStreak=calcStreak(fuGames);
          var fBest=getBestLevel(fuGames);
          var totalXp=fuGames.reduce(function(s,g){return s+g.xp;},0);
          var avgPct=fuGames.length?Math.round(fuGames.reduce(function(s,g){return s+(g.pct||0);},0)/fuGames.length):0;
          var fLvlInfo=getLevelProgress(totalXp);
          // comparison with current user
          var curGames=currentUser&&currentUser.games?currentUser.games:[];
          var myTotalXp=curGames.reduce(function(s,g){return s+g.xp;},0);
          var myAvgPct=curGames.length?Math.round(curGames.reduce(function(s,g){return s+g.pct;},0)/curGames.length):0;
          return(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>{viewingUser}'s Profile</h2>
              <button onClick={function(){setStage("friends");setSocialMsg("");}} style={GHOST}>Back</button>
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
                      <div style={{height:"100%",width:myPct+"%",background:"#34d399",borderRadius:myPct>50?"999 0 0 999":"999"}}/>
                      <div style={{height:"100%",width:(100-myPct)+"%",background:"#f472b6",borderRadius:myPct<50?"999 0 0 999":"999"}}/>
                    </div>
                  </div>);
                })}
              </div>
            )}

            {/* game history chart */}
            {fuGames.length>0&&(
              <div style={{marginBottom:12}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>XP HISTORY</p>
                <GameChart games={fuGames}/>
              </div>
            )}

            {/* recent games */}
            {fuGames.length>0&&(
              <div style={{...CARD,marginBottom:12}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>RECENT GAMES</p>
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

        {/* ── MY PROFILE ────────────────────────────────────── */}
        {stage==="profile"&&currentUser&&(function(){
          var games=(currentUser&&currentUser.games)?currentUser.games:[];
          var totalXp=games.reduce(function(s,g){return s+g.xp;},0);
          var avgPct=games.length?Math.round(games.reduce(function(s,g){return s+g.pct;},0)/games.length):0;
          var avgTime=games.length?Math.round(games.reduce(function(s,g){return s+g.timeSecs;},0)/games.length):0;
          var lvlInfo=getLevelProgress(totalXp);
          return(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,color:"#a78bfa"}}>My Profile</h2>
              <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
            </div>
            <div style={{...CARD,marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",flexShrink:0}}>{currentUser.name[0].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#f9fafb"}}>{currentUser.name}</div>
                  <div style={{background:"linear-gradient(135deg,#fbbf24,#f59e0b)",padding:"2px 8px",borderRadius:999,fontSize:12,fontWeight:900,color:"#0d0d1a"}}>⭐ Lvl {lvlInfo.level}</div>
                </div>
                <div style={{fontSize:11,color:"#6b7280"}}>Joined {currentUser.joined}</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:4}}>
                  <span style={pill("rgba(251,191,36,0.15)","#fbbf24")}>🔥 {myStreak} day streak</span>
                  <span style={pill("rgba(167,139,250,0.15)","#a78bfa")}>Friends: {myData.friends.length}</span>
                  <span style={pill("rgba(236,72,153,0.15)","#f472b6")}>Likes: {myData.likes||0}</span>
                  <span style={pill("rgba(99,102,241,0.15)","#818cf8")}>Best: {myBestLevel}</span>
                </div>
              </div>
            </div>
            <div style={{...CARD,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:"#9ca3af"}}>LEVEL {lvlInfo.level} PROGRESS</span>
                <span style={{fontSize:10,color:"#6b7280"}}>{lvlInfo.xpNeeded} XP to next</span>
              </div>
              <div style={{height:8,background:"rgba(255,255,255,0.05)",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:lvlInfo.progress+"%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",transition:"width 0.3s ease"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:7,marginBottom:10}}>
              {[{v:games.length,l:"Games",c:"#34d399"},{v:totalXp,l:"Total XP",c:"#fbbf24"},{v:avgPct+"%",l:"Avg Score",c:pctColor(avgPct)},{v:formatTime(avgTime),l:"Avg Time",c:"#a78bfa"}].map(function(s){
                return<div key={s.l} style={{textAlign:"center",flex:1,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 4px"}}><div style={{fontSize:14,fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{s.l}</div></div>;
              })}
            </div>
            {games.length>0&&(
              <div style={{marginBottom:10}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>XP HISTORY</p>
                <GameChart games={games}/>
              </div>
            )}
            {(function(){
              var typeAgg={};
              games.forEach(function(g){if(!g.typeStats)return;Object.keys(g.typeStats).forEach(function(t){if(!typeAgg[t])typeAgg[t]={earned:0,max:0};typeAgg[t].earned+=g.typeStats[t].earned;typeAgg[t].max+=g.typeStats[t].max;});});
              var types=Object.keys(typeAgg);
              if(!types.length)return null;
              return(<div style={{...CARD,marginBottom:10}}>
                <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:10}}>ACCURACY BY TYPE</p>
                {types.map(function(t){
                  var ts=typeAgg[t];var tp=ts.max>0?Math.round(ts.earned/ts.max*100):0;
                  return(<div key={t} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                      <span style={{color:"#9ca3af"}}>{Q_LABELS[t]||t}</span>
                      <span style={{color:pctColor(tp),fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{tp}%</span>
                    </div>
                    <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:tp+"%",background:pctColor(tp),borderRadius:999}}/>
                    </div>
                  </div>);
                })}
              </div>);
            })()}
            {games.length>0&&(<div style={{...CARD,marginBottom:10}}>
              <p style={{fontWeight:700,fontSize:11,color:"#9ca3af",marginBottom:8}}>RECENT GAMES</p>
              {games.slice().reverse().slice(0,8).map(function(g,i){
                var glv=getLv(g.level);
                return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:i<7?"1px solid rgba(255,255,255,0.05)":"none"}}>
                  <img src={"/assets/badges/badge-"+g.level.toLowerCase()+".svg"} alt={g.level} style={{width:28,height:28,flexShrink:0}} onError={function(e){e.target.style.display="none";}}/>
                  <div style={{flex:1}}><div style={{fontSize:12,color:"#f3f4f6"}}>{g.topic}</div><div style={{fontSize:10,color:"#6b7280"}}>{g.date} - {formatTime(g.timeSecs)}</div></div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:800,color:"#fbbf24"}}>{g.xp} XP</div><div style={{fontSize:10,color:pctColor(g.pct)}}>{g.pct}%</div></div>
                </div>);
              })}
            </div>)}
            {games.length===0&&<div style={{...CARD,textAlign:"center",padding:36}}><div style={{fontSize:48,marginBottom:12}}>🎮</div><div style={{fontSize:16,fontWeight:800,color:"#f3f4f6",marginBottom:4}}>No games yet</div><div style={{fontSize:13,color:"#6b7280",marginBottom:14}}>Start your learning journey</div><button onClick={doRestart} style={{...mkBtn("#06b6d4","#0d0d1a"),marginTop:8}}>Play Now</button></div>}
            {(function(){
              var myBadges=checkBadges(currentUser,vocab,myStreak);
              var earnedCount=BADGES.filter(function(b){return myBadges[b.id];}).length;
              return(<div style={{...CARD,marginBottom:10,cursor:"pointer"}} onClick={function(){setStage("badges");}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>🏅 My Badges</span>
                  <span style={{fontSize:12,color:"#6b7280"}}>{earnedCount} / {BADGES.length} earned →</span>
                </div>
                <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                  {BADGES.map(function(b){return<span key={b.id} style={{fontSize:18,opacity:myBadges[b.id]?1:0.2,filter:myBadges[b.id]?"none":"grayscale(1)"}}>{b.icon}</span>;})}
                </div>
              </div>);
            })()}
            <div style={{display:"flex",gap:7}}>
              <button onClick={doRestart} style={{...mkBtn("#34d399","#0d0d1a"),flex:1}}>Play Now</button>
              <button onClick={function(){localStorage.removeItem("rq-session");localStorage.removeItem(CREDS_KEY);setCurrentUser(null);setNameInput("");setPassInput("");setStage("auth");}} style={{...mkBtn("#374151"),flex:1}}>Log Out</button>
            </div>
          </div>);
        })()}

        {/* ── READING GOALS ─────────────────────────────────── */}
        {stage==="goals"&&currentUser&&(function(){
          var games=currentUser.games||[];
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#818cf8"}}>🎯 Reading Goals</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
              </div>

              {/* active goals */}
              {GOAL_DEFS.filter(function(d){return goals[d.id];}).length>0&&(
                <div style={{...CARD,marginBottom:14,padding:16}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:12}}>ACTIVE GOALS</p>
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
                            <div style={{fontSize:14,fontWeight:700,color:"#f3f4f6"}}>{def.icon} {def.label}</div>
                            {detail&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{detail}</div>}
                          </div>
                          <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                            <div style={{fontSize:15,fontWeight:900,color:prog.done?"#34d399":"#a78bfa"}}>{prog.done?"✓ Done!":prog.current+(def.id==="avg_score"?" avg%":"")+"/"+prog.target+" "+def.unit}</div>
                          </div>
                        </div>
                        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:999,height:7,overflow:"hidden",marginBottom:8}}>
                          <div style={{height:"100%",width:prog.pct+"%",background:prog.done?"#34d399":"linear-gradient(90deg,#6366f1,#a78bfa)",borderRadius:999,transition:"width 0.4s ease"}}/>
                        </div>
                        <button onClick={function(){removeGoal(def.id);}} style={{background:"none",border:"1px solid rgba(239,68,68,0.25)",color:"#f87171",borderRadius:8,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* add new goals */}
              <div style={{...CARD,padding:16}}>
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:12}}>SET A GOAL</p>
                {GOAL_DEFS.filter(function(d){return!goals[d.id];}).map(function(def){
                  return(
                    <div key={def.id} style={{marginBottom:14}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#f3f4f6",marginBottom:7}}>{def.icon} {def.label}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {def.opts.map(function(opt){
                          return<button key={opt} onClick={function(){setGoal(def.id,opt);}} style={{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",color:"#c7d2fe",borderRadius:999,padding:"5px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{opt} {def.unit}</button>;
                        })}
                      </div>
                    </div>
                  );
                })}
                {GOAL_DEFS.every(function(d){return goals[d.id];})&&(
                  <p style={{color:"#6b7280",fontSize:13,textAlign:"center"}}>All goal types are active!</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── ANALYTICS ─────────────────────────────────────── */}
        {stage==="analytics"&&currentUser&&(function(){
          var games=currentUser.games||[];
          var today=new Date().toLocaleDateString();
          var totalXp=games.reduce(function(s,g){return s+g.xp;},0);
          var totalTimeSecs=games.reduce(function(s,g){return s+g.timeSecs;},0);
          var avgPct=games.length?Math.round(games.reduce(function(s,g){return s+g.pct;},0)/games.length):0;
          var lvlInfo=getLevelProgress(totalXp);

          // weekly activity (last 7 days)
          var week=[];
          for(var wd=6;wd>=0;wd--){
            var wdt=new Date();wdt.setDate(wdt.getDate()-wd);var wds=wdt.toLocaleDateString();
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
          for(var xi=29;xi>=0;xi--){var xd=new Date();xd.setDate(xd.getDate()-xi);var xds=xd.toLocaleDateString();xpDays.push({date:xds,xp:xpByDay[xds]||0});}
          var cumXp=0;var cumXpDays=xpDays.map(function(d){cumXp+=d.xp;return{date:d.date,cum:cumXp};});
          var maxCumXp=Math.max(1,cumXpDays[cumXpDays.length-1].cum);

          // weak types — sorted ascending by accuracy
          var typeList=Object.keys(typeAgg).map(function(t){var ts=typeAgg[t];return{t:t,pct:ts.max>0?Math.round(ts.earned/ts.max*100):0};}).sort(function(a,b){return a.pct-b.pct;});
          var weakTypes=typeList.slice(0,2).filter(function(x){return x.pct<70;});

          // 30-day activity calendar
          var cal30=[];
          for(var ci=29;ci>=0;ci--){var cd=new Date();cd.setDate(cd.getDate()-ci);var cds=cd.toLocaleDateString();var cg=games.filter(function(g){return g.date===cds;});cal30.push({date:cds,count:cg.length,avg:cg.length?Math.round(cg.reduce(function(s,g){return s+g.pct;},0)/cg.length):0});}

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
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#06b6d4"}}>My Analytics</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
              </div>

              {/* top stats */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {v:games.length,     l:"Sessions",      c:"#34d399"},
                  {v:totalXp,          l:"Total XP",      c:"#fbbf24"},
                  {v:avgPct+"%",       l:"Avg Score",     c:pctColor(avgPct)},
                  {v:vocab.length,     l:"Words Saved",   c:"#06b6d4"},
                  {v:Math.floor(totalTimeSecs/60)+"m", l:"Time Reading", c:"#a78bfa"},
                  {v:badgeCount+"/"+BADGES.length, l:"Badges",   c:"#f472b6"},
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
                  <span style={{fontSize:13,fontWeight:700,color:"#fbbf24"}}>⭐ Player Level {lvlInfo.level}</span>
                  <span style={{fontSize:11,color:"#6b7280"}}>{lvlInfo.xpNeeded>0?lvlInfo.xpNeeded+" XP to next":"Max level!"}</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.05)",borderRadius:999,height:8,overflow:"hidden"}}>
                  <div style={{height:"100%",width:lvlInfo.progress+"%",background:"linear-gradient(90deg,#fbbf24,#f59e0b)",borderRadius:999,transition:"width 0.4s ease"}}/>
                </div>
              </div>

              {/* score accuracy trend */}
              {scoreTrend.length>=2&&(
                <div style={{...CARD,marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:0}}>SCORE TREND (LAST {scoreTrend.length} GAMES)</p>
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
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:0}}>READING SPEED TREND (WPM)</p>
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
                    <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",margin:0}}>XP GROWTH (30 DAYS)</p>
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
                <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10}}>ACTIVITY — LAST 30 DAYS</p>
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
                  <p style={{fontSize:11,fontWeight:700,color:"#f87171",marginBottom:10}}>⚠️ FOCUS AREAS</p>
                  {weakTypes.map(function(w){
                    var tips={matching:"Try matching pairs step-by-step — eliminate confident ones first.",heading:"Read paragraph topic sentences carefully before matching headings.",qa:"Write 1-2 key words from the passage in your answer.",mcq:"Re-read the relevant sentence before choosing.",gap_word:"Think about grammar (noun/verb/adj) before guessing.",gap_sentence:"Check the sentence before and after the gap for context.",tfnm:"For 'Not Mentioned' — only choose if the passage has zero reference.",ynng:"'Not Given' means the passage doesn't confirm OR deny."};
                    return(<div key={w.t} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:8,padding:"10px 12px",background:"rgba(239,68,68,0.07)",borderRadius:10}}>
                      <div style={{width:36,height:36,borderRadius:8,background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:13,fontWeight:900,color:"#f87171"}}>{w.pct}%</div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:"#f3f4f6",marginBottom:2}}>{Q_LABELS[w.t]||w.t}</div>
                        <div style={{fontSize:11,color:"#9ca3af"}}>{tips[w.t]||"Practice this type more!"}</div>
                      </div>
                    </div>);
                  })}
                </div>
              )}

              {/* per-level breakdown */}
              {Object.keys(byLevel).length>0&&(
                <div style={{...CARD,marginBottom:12}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#9ca3af",marginBottom:10}}>BY CEFR LEVEL</p>
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
                        <span style={{color:"#9ca3af"}}>{Q_LABELS[item.t]||item.t}</span>
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
              <button onClick={doRestart} style={{...mkBtn("#06b6d4","#0d0d1a"),width:"100%",marginTop:4}}>Start Reading</button>
            </div>
          );
        })()}

        {/* ── STORY LIBRARY ─────────────────────────────────── */}
        {stage==="library"&&currentUser&&(function(){
          var unlockedMap=getUnlockedStories(currentUser.games||[]);
          var levelOrder=["A1","A2","B1","B2","C1","C2"];
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#34d399"}}>Story Library</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
              </div>
              <p style={{color:"#6b7280",fontSize:12,marginBottom:10,lineHeight:1.5}}>Pre-written stories — instant play. Unlock more by completing quizzes.</p>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                {["","life","science","tech","mind","humanities"].map(function(key){
                  var label=key?SUBJECT_LABELS[key]:"All Topics";
                  var col=key?SUBJECT_COLORS[key]:"#9ca3af";
                  var active=libSubjectFilter===key;
                  return(<button key={key} onClick={function(){setLibSubjectFilter(key);}} style={{padding:"5px 12px",borderRadius:99,border:"1.5px solid "+(active?col:"rgba(255,255,255,0.1)"),background:active?col+"22":"transparent",color:active?col:"#6b7280",fontFamily:"inherit",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>{label}</button>);
                })}
              </div>
              {favs.length>0&&(
                <div style={{marginBottom:16}}>
                  <p style={{fontSize:11,fontWeight:700,color:"#f472b6",letterSpacing:0.5,margin:"0 0 8px"}}>❤️ MY FAVORITES</p>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {favs.map(function(f){
                      var story=STORY_LIBRARY.find(function(s){return s.id===f.id;});
                      if(!story)return null;
                      var lo=getLv(story.level);
                      return(
                        <div key={f.id} style={{...CARD,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",flex:"1 1 auto",minWidth:140,border:"1px solid rgba(236,72,153,0.3)",background:"rgba(236,72,153,0.05)"}} onClick={function(){startStoryFromLibrary(story);}}>
                          <span style={{fontSize:20}}>{({A1:"📗",A2:"📘",B1:"📙",B2:"📒",C1:"📕",C2:"📓"})[story.level]||"📖"}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:"#f3f4f6",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{story.title}</div>
                            <div style={{fontSize:11,color:lo.color}}>{story.level} · {story.topic}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {levelOrder.map(function(lk){
                var lObj=getLv(lk);
                var stories=STORY_LIBRARY.filter(function(s){return s.level===lk&&(libSubjectFilter===""||getSubjectKey(s)===libSubjectFilter);});
                if(stories.length===0)return null;
                return(
                  <div key={lk} style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <img src={"/assets/badges/badge-"+lk.toLowerCase()+".svg"} alt={lk} style={{width:32,height:32}} onError={function(e){e.target.style.display="none";}}/>
                      <span style={{fontSize:13,fontWeight:900,color:lObj.color}}>{lk}</span>
                      <span style={{fontSize:11,color:"#4b5563"}}>{lObj.desc}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {stories.map(function(story){
                        var isUnlocked=!!unlockedMap[story.id];
                        var myClass2=currentUser?classes.find(function(c){return c.students.indexOf(currentUser.name)!==-1;})||null:null;
                        var isAssigned=myClass2?assignments.some(function(a){return a.classId===myClass2.id&&a.storyId===story.id&&(!a.completions||!a.completions[currentUser.name]);}):false;
                        return(
                          <div key={story.id} className="rq-raised" style={{...CARD,padding:0,display:"flex",alignItems:"stretch",gap:0,opacity:isUnlocked?1:0.45,border:"1px solid "+(isAssigned?"rgba(245,158,11,0.6)":isUnlocked?lObj.glow.replace("0.25","0.5"):"rgba(255,255,255,0.07)"),cursor:isUnlocked?"pointer":"default",background:isUnlocked?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",overflow:"hidden"}} onClick={isUnlocked?function(){startStoryFromLibrary(story);}:undefined}>
                            <div style={{width:120,height:80,flexShrink:0,background:"rgba(0,0,0,0.3)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                              <img src={"/assets/covers/"+story.id+".svg"} alt={story.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={function(e){e.target.style.display="none";e.target.parentElement.style.fontSize="28px";e.target.parentElement.textContent=isUnlocked?({A1:"📗",A2:"📘",B1:"📙",B2:"📒",C1:"📕",C2:"📓"}[lk]||"📖"):"🔒";}}/>
                            </div>
                            <div style={{flex:1,minWidth:0,padding:12,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:700,color:isUnlocked?"#f3f4f6":"#6b7280",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{story.title}</div>
                                <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>{story.topic} · {story.questions.length} Qs</div>
                                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                                  <span style={{fontSize:9,fontWeight:700,color:SUBJECT_COLORS[getSubjectKey(story)],background:SUBJECT_COLORS[getSubjectKey(story)]+"22",borderRadius:5,padding:"1px 6px"}}>{SUBJECT_LABELS[getSubjectKey(story)]}</span>
                                  <span style={{fontSize:9,fontWeight:700,color:"#818cf8",background:"rgba(99,102,241,0.15)",borderRadius:5,padding:"1px 6px"}}>{SKILL_LEVEL[lk]}</span>
                                  {isAssigned&&<span style={{fontSize:9,fontWeight:700,color:"#fcd34d",background:"rgba(245,158,11,0.15)",borderRadius:5,padding:"1px 6px"}}>📋 Assigned</span>}
                                </div>
                              </div>
                              {!isUnlocked&&<div style={{fontSize:10,color:"#4b5563"}}>Unlock by completing {lk} quizzes</div>}
                            </div>
                            {isUnlocked&&<div style={{padding:12,display:"flex",alignItems:"center",fontSize:11,fontWeight:700,color:isAssigned?"#fcd34d":lObj.color,flexShrink:0}}>{isAssigned?"📋":"→"}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <button onClick={function(){setStage("home");}} style={{...mkBtn("#34d399","#0d0d1a"),width:"100%",marginTop:4}}>Back to Home</button>
            </div>
          );
        })()}

        {/* ── BADGES ────────────────────────────────────────── */}
        {stage==="badges"&&currentUser&&(function(){
          var myBadges=checkBadges(currentUser,vocab,myStreak);
          var earnedCount=BADGES.filter(function(b){return myBadges[b.id];}).length;
          return(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:6}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#fbbf24"}}>Badges</h2>
                <button onClick={function(){setStage("profile");}} style={GHOST}>Back</button>
              </div>
              <p style={{color:"#6b7280",fontSize:13,marginBottom:14}}>{earnedCount} of {BADGES.length} earned</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {BADGES.map(function(b){
                  var earned=!!myBadges[b.id];
                  return(
                    <div key={b.id} style={{...CARD,padding:14,display:"flex",gap:10,alignItems:"flex-start",opacity:earned?1:0.45,border:"1px solid "+(earned?"rgba(251,191,36,0.35)":"rgba(255,255,255,0.08)"),background:earned?"rgba(251,191,36,0.06)":"rgba(255,255,255,0.03)"}}>
                      <span style={{fontSize:26,flexShrink:0,filter:earned?"none":"grayscale(1)"}}>{b.icon}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:earned?"#fbbf24":"#6b7280",marginBottom:2}}>{b.name}</div>
                        <div style={{fontSize:11,color:"#4b5563",lineHeight:1.4}}>{b.desc}</div>
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
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#a78bfa"}}>Vocab Practice</h2>
                <button onClick={function(){setStage("vocab");}} style={GHOST}>Back</button>
              </div>
              <p style={{color:"#6b7280",fontSize:13,marginBottom:16}}>{gameWords.length} words to practice</p>
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

          var shuffled=gameWords.slice().sort(function(){return Math.random()-0.5;});
          var curW=shuffled[vocabGameIdx%shuffled.length];
          var isDone=vocabGameIdx>=shuffled.length;
          if(isDone)return(
            <div style={{textAlign:"center",paddingTop:40}}>
              <div style={{fontSize:50,marginBottom:10}}>🎉</div>
              <h2 style={{fontSize:22,fontWeight:900,color:"#a78bfa",marginBottom:6}}>Practice Complete!</h2>
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
            var distractors=gameWords.filter(function(w){return w.word!==curW.word;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
            var options=[curW].concat(distractors).sort(function(){return Math.random()-0.5;});
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
            var bDistractors=gameWords.filter(function(w){return w.word!==curW.word;}).sort(function(){return Math.random()-0.5;}).slice(0,3);
            var bOptions=[curW].concat(bDistractors).sort(function(){return Math.random()-0.5;});
            var bCorrect=bOptions.indexOf(curW);
            return(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                  <h2 style={{margin:0,fontSize:18,fontWeight:900,color:"#a78bfa"}}>Fill the Blank</h2>
                  <span style={{fontSize:12,color:"#6b7280"}}>{vocabGameIdx+1}/{shuffled.length} · {vocabGameScore} pts</span>
                </div>
                <div style={{...CARD,marginBottom:14,padding:16}}>
                  <p style={{fontSize:16,color:"#e5e7eb",lineHeight:1.9,margin:0}}>{sentence.split("___")[0]}<span style={{display:"inline-block",minWidth:80,borderBottom:"2px solid #818cf8",textAlign:"center",color:"#818cf8",fontWeight:700}}>{vocabGameAnswered!==null?bOptions[vocabGameAnswered].word:"_____"}</span>{sentence.split("___")[1]||""}</p>
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
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:14}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#818cf8"}}>Weekly Board</h2>
                <button onClick={function(){setStage("home");}} style={GHOST}>Back</button>
              </div>
              <div style={{...CARD,marginBottom:12,padding:14,borderColor:"rgba(129,140,248,0.3)",background:"rgba(129,140,248,0.05)"}}>
                <p style={{fontSize:11,color:"#818cf8",fontWeight:700,letterSpacing:0.5,margin:"0 0 8px"}}>THIS WEEK</p>
                <div style={{display:"flex",gap:10}}>
                  <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 6px"}}>
                    <div style={{fontSize:18,fontWeight:900,color:"#818cf8"}}>{weekXp}</div>
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
              <p style={{fontSize:11,color:"#9ca3af",fontWeight:700,letterSpacing:0.5,marginBottom:8}}>LEADERBOARD</p>
              {weeklyLb.length===0&&<p style={{color:"#6b7280",fontSize:13,textAlign:"center",padding:20}}>No data yet — play some stories!</p>}
              {weeklyLb.slice(0,20).map(function(e,i){
                var isMe=e.name===currentUser.name;
                var medals=["🥇","🥈","🥉"];
                return(
                  <div key={i} className="rq-lb-row" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,marginBottom:5,background:isMe?"rgba(129,140,248,0.1)":"rgba(255,255,255,0.03)",border:isMe?"1px solid rgba(129,140,248,0.3)":"1px solid transparent"}}>
                    <span style={{width:24,fontSize:i<3?16:12,textAlign:"center",color:"#fbbf24",fontWeight:700}}>{i<3?medals[i]:i+1}</span>
                    <span style={{flex:1,fontSize:13,fontWeight:isMe?700:400,color:isMe?"#818cf8":"#f3f4f6"}}>{e.name}{isMe?" (you)":""}</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#818cf8"}}>{e.xp} XP</span>
                    <span style={{fontSize:11,color:"#6b7280"}}>{e.games} {e.games===1?"story":"stories"}</span>
                  </div>
                );
              })}
              <button onClick={doRestart} style={{...mkBtn("#818cf8","#0d0d1a"),width:"100%",marginTop:10}}>Read a Story</button>
            </div>
          );
        })()}

        {/* ── AI TUTOR ──────────────────────────────────────── */}
        {stage==="tutor"&&currentUser&&(
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 80px)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:10,flexShrink:0}}>
              <div>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#0891b2"}}>🤖 AI Tutor</h2>
                <p style={{margin:0,fontSize:11,color:"#6b7280"}}>{level} · {topic}</p>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={function(){setStage("result");}} style={GHOST}>Back</button>
                <button onClick={doRestart} style={{...GHOST,color:"#34d399",borderColor:"rgba(52,211,153,0.3)"}}>Home</button>
              </div>
            </div>

            {/* passage peek */}
            {passage&&(
              <div style={{...CARD,padding:"10px 14px",marginBottom:10,flexShrink:0}}>
                <button onClick={function(){setPassagePeekOpen(function(o){return!o;});}} style={{background:"none",border:"none",color:"#9ca3af",fontFamily:"inherit",fontSize:12,cursor:"pointer",fontWeight:600,padding:0,width:"100%",textAlign:"left"}}>
                  {passagePeekOpen?"▲ Hide passage":"▼ Show passage"}
                </button>
                {passagePeekOpen&&<p style={{margin:"8px 0 0",fontSize:13,color:"#d1d5db",lineHeight:1.8}}>{passage}</p>}
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
              <button onClick={function(){sendTutorMessage(tutorInput);}} disabled={!tutorInput.trim()} style={{...mkBtn(!tutorInput.trim()?"#374151":"#0891b2"),padding:"11px 18px",fontSize:14,flexShrink:0}}>Send</button>
            </div>
          </div>
        )}

        {/* ── WRITING FEEDBACK ──────────────────────────────── */}
        {stage==="writefeedback"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingTop:6}}>
              <button onClick={function(){setStage("result");}} style={GHOST}>← Back</button>
              <h2 style={{fontSize:18,fontWeight:900,color:"#fbbf24",margin:0}}>✍️ Writing Challenge</h2>
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
                    >Get Feedback →</button>
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
                    <div style={{fontSize:14,fontWeight:700,color:"#fbbf24",marginBottom:8}}>Overall Writing Score</div>
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
          var today=new Date().toLocaleDateString();
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
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:10}}>
                <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#ec4899"}}>Discussion</h2>
                <button onClick={function(){setStage("result");}} style={GHOST}>Back</button>
              </div>
              {story&&<div style={{...CARD,marginBottom:12,padding:12,background:"rgba(236,72,153,0.06)",borderColor:"rgba(236,72,153,0.25)"}}>
                <p style={{fontSize:11,color:"#f472b6",fontWeight:700,margin:"0 0 4px"}}>📖 {story.title} · {story.level}</p>
                <p style={{fontSize:13,color:"#9ca3af",margin:0,lineHeight:1.5}}>{story.prompt||"What did you find most interesting about this passage?"}</p>
              </div>}
              {!alreadyPosted?(
                <div style={{...CARD,marginBottom:12,padding:14}}>
                  <textarea value={discussInput} onChange={function(e){setDiscussInput(e.target.value.slice(0,200));}} placeholder="Share your thoughts..." style={{width:"100%",minHeight:70,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"#f3f4f6",fontSize:13,padding:"9px 11px",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                    <span style={{fontSize:11,color:"#6b7280"}}>{discussInput.length}/200</span>
                    <button onClick={submitPost} disabled={discussInput.trim().length<3} style={{...mkBtn(discussInput.trim().length>=3?"#ec4899":"#374151","#0d0d1a"),padding:"8px 18px",fontSize:13}}>Post</button>
                  </div>
                </div>
              ):(
                <div style={{...CARD,marginBottom:12,padding:12,background:"rgba(52,211,153,0.05)",borderColor:"rgba(52,211,153,0.3)"}}>
                  <p style={{fontSize:12,color:"#34d399",margin:0}}>✓ You've posted today. Come back tomorrow to share more!</p>
                </div>
              )}
              {posts.length===0&&<p style={{color:"#6b7280",fontSize:13,textAlign:"center",padding:20}}>Be the first to share your thoughts!</p>}
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
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,marginBottom:12}}>
              <h2 style={{margin:0,fontSize:20,fontWeight:900,fontFamily:"'Outfit',sans-serif",color:"#f59e0b"}}>🔖 Quote Book</h2>
              <button onClick={function(){setStage(result?"result":"home");}} style={GHOST}>Back</button>
            </div>
            {quotes.length===0?(
              <div style={{...CARD,textAlign:"center",padding:40}}>
                <div style={{fontSize:36,marginBottom:10}}>🔖</div>
                <p style={{color:"#6b7280",fontSize:14}}>No saved sentences yet. In the reading screen, tap a sentence then click "🔖 Save" to add it here.</p>
                <button onClick={function(){setStage("home");}} style={{...mkBtn("#f59e0b","#0d0d1a"),marginTop:14}}>Start Reading</button>
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
