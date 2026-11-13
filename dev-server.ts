import { createServer } from "node:http";
import handler from "./api/recommend";
import type { VercelRequest, VercelResponse } from "@vercel/node";
createServer(async(req,res)=>{
 if(req.url!=="/api/recommend"){res.writeHead(404);res.end("Not found");return;}
 let body="";for await(const chunk of req){body+=chunk;if(body.length>100000){res.writeHead(413);res.end("Too large");return;}}
 try{(req as VercelRequest).body=JSON.parse(body||"{}");handler(req as VercelRequest,res as VercelResponse)}
 catch{if(!res.headersSent){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({error:"Malformed JSON"}));}}
}).listen(3001,"127.0.0.1",()=>console.log("AIRE API on http://127.0.0.1:3001"));
