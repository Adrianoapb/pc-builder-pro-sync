export async function onRequestGet(context) {
  const { DB } = context.env;

  if (!DB) {
    return Response.json({ ok: false, error: 'Binding D1 ausente. Configure o binding DB no Pages.' }, { status: 500 });
  }

  try {
    await DB.prepare(`CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      version TEXT,
      updated_at TEXT NOT NULL
    );`).run();

    return Response.json({ ok: true, message: 'API e D1 conectados com sucesso.' });
  } catch (error) {
    return Response.json({ ok: false, error: error.message || String(error) }, { status: 500 });
  }
}
