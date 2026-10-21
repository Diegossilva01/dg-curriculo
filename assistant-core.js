(function(root){
'use strict';
const C=root.TrajetoriaCore||(typeof require==='function'?require('./model.js'):null);
const clean=v=>typeof v==='string'?v.trim().slice(0,5000):'';
const lines=v=>clean(v).split('\n').map(s=>s.trim()).filter(Boolean);
function summary(answers){
 if(clean(answers.about))return clean(answers.about);
 const target=clean(answers.contact?.role);
 const experience=(answers.noExperience?[]:answers.experience||[]).filter(e=>clean(e.role)||clean(e.company));
 const parts=[];
 if(answers.noExperience)parts.push(`Em busca da primeira oportunidade${target?' na área de '+target:''}.`);
 else if(experience.length){const e=experience[0];parts.push(`Experiência${clean(e.role)?' como '+clean(e.role):''}${clean(e.company)?' na empresa '+clean(e.company):''}.`);}
 else if(target)parts.push(`Objetivo profissional: ${target}.`);
 const skills=lines(answers.skills).slice(0,3);
 if(skills.length)parts.push('Competências: '+skills.join(', ')+'.');
 return parts.join(' ');
}
function makeResume(answers,appearance={}){
 const contact=answers.contact||{};
 if(!clean(contact.first)||!clean(contact.last)||!clean(contact.role))throw Error('Preencha seu nome, sobrenome e cargo ou área de interesse.');
 const experience=(answers.noExperience?[]:answers.experience||[]).filter(e=>Object.values(e).some(v=>clean(v)));
 const education=(answers.education||[]).filter(e=>clean(e.course)||clean(e.school));
 const languageItems=lines(answers.languages).map(line=>{const [language,...level]=line.split(/\s+[—–-]\s+/);return {language,level:level.join(' — ')};});
 const courses=Array.isArray(answers.courses)?answers.courses.filter(e=>clean(e.title)):lines(answers.courses).map(title=>({title,institution:'',date:'',description:''}));
 const raw={...C.blank(),...contact,experience,education,skills:lines(answers.skills).join('\n'),languageItems,courses,summary:summary(answers),additional:clean(answers.additional),template:appearance.template,color:appearance.color,format:appearance.format,photo:typeof answers.photo==='string'?answers.photo:appearance.photo||'',name:[clean(contact.first),clean(contact.last)].join(' ')+' — currículo'};
 if(answers.noExperience||appearance.template==='academico')raw.order=['summary','education','skills','experience',...raw.order.filter(id=>!['summary','education','skills','experience'].includes(id))];
 return C.normalize(raw);
}
const api={summary,makeResume};root.TrajetoriaAssistantCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
