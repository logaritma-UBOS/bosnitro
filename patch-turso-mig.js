const fs = require("fs");
let file = fs.readFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/run_turso_mig.js", "utf8");
file = file.replace(
  "'20260927000002_crm_traffic'",
  "'20260927000002_crm_traffic',\n  '20260929000000_team_os_control_tower'"
);
fs.writeFileSync("C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/run_turso_mig.js", file, "utf8");
console.log("Updated run_turso_mig.js");
