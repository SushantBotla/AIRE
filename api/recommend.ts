import type { VercelRequest, VercelResponse } from "@vercel/node";
import listings from "../listings.json";
type Raw = (typeof listings)[number];
const catalog: Raw[] = listings;
export function recommend(query: string, excludeIds: string[] = []) {
  const q = query.toLowerCase();
  const excluded = new Set(excludeIds);
  const budgetMatch = q.match(/(?:under|below|budget|max|up to)\s*\$?([\d,.]+)\s*(k)?/i);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) * (budgetMatch[2] ? 1000 : 1) : null;
  const bedMatch = q.match(/(\d+)\s*(?:bed|br)/i);
  const beds = bedMatch ? Number(bedMatch[1]) : null;
  const keywords = ["home","house","property","properties","real estate","dallas","bed","bath","budget","price","listing","find","show","more","buy","recommend","looking","condo","apartment"];
  if(q && !keywords.some(k=>q.includes(k)) && !budgetMatch && !bedMatch) return {message:"I can help you explore real estate listings. Try a budget or bedroom preference.",properties:[]};
  const ranked = catalog.filter(p=>!excluded.has(String(p.id))).map(p=>{
    let score=0;
    if(budget!==null) score += Number(p.price)<=budget ? 5 : -5;
    if(beds!==null) score += Number(p.beds ?? 0)>=beds ? 4 : -4;
    return {p,score};
  }).sort((a,b)=>b.score-a.score || Number(a.p.price)-Number(b.p.price));
  const properties=ranked.slice(0,3).map(({p,score})=>({
    id:String(p.id),url:String(p.url),price:String(p.price??"N/A"),bed:String(p.beds??"N/A"),bath:String(p.baths??"N/A"),
    address:String(p.fullAddress),city:String(p.city),state:String(p.state),zip:String(p.zipcode),mainImg:String(p.image??""),
    rating:score>=5?"Excellent":score>=0?"Good":"Limited match",
    explanation:"Recommendation based on the sample listing data; confirm current pricing and availability with the listing provider."
  }));
  return {message:properties.length?"Here are matches from the AIRE sample dataset (not live listings).":"No more listings to show.",properties};
}
function send(res:VercelResponse,status:number,payload:unknown){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(payload));}
export default function handler(req:VercelRequest,res:VercelResponse){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST")return send(res,405,{error:"Method not allowed"});
  let body:unknown=req.body;
  if(typeof body==="string"){try{body=JSON.parse(body)}catch{return send(res,400,{error:"Malformed JSON"})}}
  if(!body || typeof body!=="object")return send(res,400,{error:"Invalid body"});
  const input=body as Record<string,unknown>;
  if(typeof input.query!=="string" || input.query.length>500 || !Array.isArray(input.excludeIds) || input.excludeIds.length>100 || !input.excludeIds.every(x=>typeof x==="string"))return send(res,400,{error:"Invalid query or exclusions"});
  return send(res,200,recommend(input.query,input.excludeIds));
}
