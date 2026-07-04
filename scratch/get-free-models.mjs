async function run() {
  const response = await fetch("https://openrouter.ai/api/v1/models");
  const data = await response.json();
  const freeModels = data.data
    .filter(m => m.id.endsWith(":free") || m.name.toLowerCase().includes("free"))
    .map(m => m.id);
  console.log("Free Models available:", freeModels);
}
run().catch(console.error);
