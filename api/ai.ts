import listings from "../listings.json";
export async function aiRank(query:string, excludeIds:string[]):Promise<string[] | null>{
 const key=process.env.GEMINI_API_KEY;
 if(!key)return null;
 const candidates=listings.filter(p=>!excludeIds.includes(String(p.id)));
 const message="Choose up to 3 listing IDs that best match this user preference. Return only JSON of the form {\"ids\":[\"id1\",\"id2\"]}. Only choose IDs from supplied listings.\nUser preference: "+query+"\nListings: "+JSON.stringify(candidates.map(p=>({id:p.id,price:p.price,beds:p.beds??null,city:p.city,address:p.fullAddress})));
 const response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(process.env.GEMINI_MODEL||"gemini-2.5-flash")+":generateContent",{
   method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},
   body:JSON.stringify({contents:[{parts:[{text:message}]}],generationConfig:{responseMimeType:"application/json"}}),
   signal:AbortSignal.timeout(12000)
 });
 if(!response.ok)throw new Error("AI API unavailable: HTTP "+response.status);
 const result=await response.json() as {candidates?:Array<{content?:{parts?:Array<{text?:string}>}}>};
 const raw=result.candidates?.[0]?.content?.parts?.[0]?.text;
 if(!raw)return null;
 const parsed:unknown=JSON.parse(raw);
 if(!parsed||typeof parsed!=="object"||!("ids" in parsed)||!Array.isArray(parsed.ids))return null;
 const valid=new Set(candidates.map(p=>String(p.id)));
 return [...new Set(parsed.ids.filter((id:unknown):id is string=>typeof id==="string" && valid.has(id)))].slice(0,3);
}
