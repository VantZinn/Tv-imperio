import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeBible,normalizeProject,verifyReviewEvidence} from '../server.mjs';
test('Bíblia recebida é limitada, normalizada e muda a identidade do projeto',()=>{
 const raw={id:1,title:'A Ponte',kind:'film',genre:'Drama',duration:90,concept:'Ana procura uma prova.',story:{},bible:{characters:[{name:'Ana',goal:'Salvar o irmão'}],facts:[{key:'Ana',value:'sem acesso'}],rules:['A ponte fecha'],timeline:[{title:'A prova',week:5,facts:[{key:'Ana',value:'acesso permitido'}]}]}};
 const p=normalizeProject(raw);assert.equal(p.bible.characters[0].name,'Ana');assert.equal(p.bible.timeline[0].week,5);assert.equal(normalizeBible({characters:Array(100).fill({name:'a'})}).characters.length,16);
 assert.notDeepEqual(p,normalizeProject({...raw,bible:{...raw.bible,facts:[{key:'Ana',value:'com acesso'}]}}));
});
test('Evidência entre aspas deve existir no texto; paráfrase é identificada como interpretação',()=>{
 const p={concept:'Ana procura uma prova.'};
 assert(verifyReviewEvidence({risks:[{evidence:'Trecho: “Ana procura uma prova.”'}]},p));
 assert.throws(()=>verifyReviewEvidence({risks:[{evidence:'Trecho: “Ana explodiu a ponte da cidade.”'}]},p),e=>e.code==='AI_INVALID_EVIDENCE');
 assert(verifyReviewEvidence({risks:[{evidence:'A busca ainda precisa mostrar sua oposição.'}]},p));
});
