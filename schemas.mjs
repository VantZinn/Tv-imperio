const text={type:'string',maxLength:2400};
const stringList={type:'array',items:text,maxItems:8};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const integer=(min,max)=>({type:'integer',minimum:min,maximum:max});
export const commentSchema=object({
 name:{type:'string',maxLength:60},
 ageGroup:{type:'string',enum:['Jovem','Adulto','Senhor']},
 platform:{type:'string',enum:['tuiter','istagram','facibuk']},
 text,
 role:{type:'string',enum:['Fã','Crítico']},
 replyTo:integer(-1,23),
 mood:{type:'string',enum:['euforia','elogio','curiosidade','debate','crítica']}
});
export const reviewSchema=object({
 summary:text,verdict:text,hook:text,
 scores:object({originality:integer(0,100),coherence:integer(0,100),characters:integer(0,100),impact:integer(0,100),execution:integer(0,100)}),
 strengths:stringList,
 risks:{type:'array',maxItems:8,items:object({aspect:text,evidence:text,impact:text,advice:text})},
 productionWeeks:integer(1,6),
 comments:{type:'array',minItems:6,maxItems:18,items:commentSchema}
});
export const socialSchema=object({comments:{type:'array',minItems:6,maxItems:18,items:object({...commentSchema.properties,projectId:{type:'string',maxLength:80},episodeId:{type:'string',maxLength:80},title:{type:'string',maxLength:100}})}});
export function worldSchema(catalog){return object({works:{type:'array',minItems:1,maxItems:3,items:object({
 title:{type:'string',maxLength:80},kind:{type:'string',enum:['film','series']},genre:{type:'string',enum:catalog.genres},premise:text,
 story:object({motivation:text,conflict:text,payoff:text}),intent:text,studio:{type:'string',maxLength:80},
 networkId:{type:'string',enum:catalog.networks.map(n=>n.id)},quality:integer(5,100),productionWeeks:integer(1,6)
})}});}
export function validateSchema(value,schema){
 if(schema.type==='object'){
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  if(schema.required?.some(k=>!Object.hasOwn(value,k)))return false;
  if(schema.additionalProperties===false&&Object.keys(value).some(k=>!Object.hasOwn(schema.properties,k)))return false;
  return Object.entries(schema.properties).every(([key,sub])=>validateSchema(value[key],sub));
 }
 if(schema.type==='array')return Array.isArray(value)&&value.length>=(schema.minItems||0)&&value.length<=(schema.maxItems||1000)&&value.every(v=>validateSchema(v,schema.items));
 if(schema.type==='string')return typeof value==='string'&&value.length<=(schema.maxLength||100000)&&(!schema.enum||schema.enum.includes(value));
 if(schema.type==='integer')return Number.isSafeInteger(value)&&value>=schema.minimum&&value<=schema.maximum;
 return false;
}
