// Local dev launcher — loads .env then starts Express
require('dotenv').config();
const app  = require('./api/index.js');
const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`\n🚀 Dashboard API → http://localhost:${PORT}`);
  console.log('   GET  /api/leads');
  console.log('   GET  /api/projects');
  console.log('   GET  /api/users');
  console.log('   GET  /health\n');
});
