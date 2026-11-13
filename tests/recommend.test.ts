import test from "node:test";
import assert from "node:assert/strict";
import { recommend } from "../api/recommend";
test("returns at most three real properties",()=>{const r=recommend("3 bed Dallas home under $400k");assert.ok(r.properties.length<=3);assert.equal(new Set(r.properties.map(p=>p.id)).size,r.properties.length)});
test("excludes previous results",()=>{const first=recommend("Dallas home");const next=recommend("Dallas home",first.properties.map(p=>p.id));assert.ok(next.properties.every(p=>!first.properties.some(x=>x.id===p.id)))});
test("rejects unrelated questions",()=>{assert.equal(recommend("explain quantum physics").properties.length,0)});
