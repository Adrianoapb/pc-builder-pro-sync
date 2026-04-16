async function ensureTable(DB) {
  await DB.prepare(`CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    version TEXT,
    updated_at TEXT NOT NULL
  );`).run();
}

export async function onRequestGet(context) {
  const { DB } = context.env;

  if (!DB) {
    return Response.json({ ok: false, error: 'Binding D1 ausente. Configure o binding DB no Pages.' }, { status: 500 });
  }

  try {
    await ensureTable(DB);
    const { results } = await DB.prepare('SELECT key, payload, version, updated_at FROM app_state').all();
    const items = {};

    for (const row of results || []) {
      try {
        items[row.key] = JSON.parse(row.payload);
      } catch {
        items[row.key] = row.payload;
      }
    }

    return Response.json({ ok: true, items, rows: results || [] });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || String(error) }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { DB } = context.env;

  if (!DB) {
    return Response.json({ ok: false, error: 'Binding D1 ausente. Configure o binding DB no Pages.' }, { status: 500 });
  }

  try {
    await ensureTable(DB);
    const body = await context.request.json();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return Response.json({ ok: false, error: 'Nenhum item para sincronizar.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const statements = items.map((item) => DB.prepare(`
      INSERT INTO app_state (key, payload, version, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        payload = excluded.payload,
        version = excluded.version,
        updated_at = excluded.updated_at
    `).bind(
      item.key,
      JSON.stringify(item.payload ?? null),
      item.version || '1.0.0',
      timestamp
    ));

    await DB.batch(statements);

    return Response.json({ ok: true, message: 'Sincronização concluída com sucesso.', count: items.length, updated_at: timestamp });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || String(error) }, { status: 500 });
  }
}
