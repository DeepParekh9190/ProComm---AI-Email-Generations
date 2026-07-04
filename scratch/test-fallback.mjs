import { getImprovements } from "../lib/fallback-engine.js";

const draft = `Hello,
I am extremely disappointed with the service I have received. Nobody seems to know what is going on, and nobody is taking responsibility.`;

console.log("Testing fallback improvements for draft with 'disappointed'...");
const improvements = getImprovements(draft, "Aggressive", "Professional");
console.log("Generated improvements:", improvements);
