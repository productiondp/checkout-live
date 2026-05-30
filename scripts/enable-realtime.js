const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function enableRealtime() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:51214/template1'
  });

  try {
    await client.connect();
    console.log("Connected to DB.");

    // Check publication
    const res = await client.query(`
      SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
    `);
    console.log("Current realtime tables:", res.rows.map(r => r.tablename));

    // Enable for connections
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE connections;`).catch(e => console.log("Connections already in realtime"));
    // Enable for messages
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE messages;`).catch(e => console.log("Messages already in realtime"));

    const res2 = await client.query(`
      SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
    `);
    console.log("Updated realtime tables:", res2.rows.map(r => r.tablename));

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

enableRealtime();
