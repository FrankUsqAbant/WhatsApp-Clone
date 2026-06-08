import { execSync } from 'child_process';
import fs from 'fs';

try {
  let sql = fs.readFileSync('create_statuses.sql', 'utf8');
  // strip comments and newlines
  sql = sql.replace(/--.*$/gm, '').replace(/\n/g, ' ').replace(/"/g, '\\"');
  execSync(`npx @insforge/cli@latest db query "${sql}"`, { stdio: 'inherit' });
} catch (e) {
  console.error(e.message);
}
