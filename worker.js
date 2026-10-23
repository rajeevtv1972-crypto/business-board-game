export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return Response.json({ ok: true, service: "Desi Tycoon rooms" });
    const match = url.pathname.match(/^\/api\/room\/([A-Z0-9]{4,8})$/);
    if (!match) return new Response("Desi Tycoon multiplayer server", { status: 200 });
    const room = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(match[1]));
    return room.fetch(request);
  }
};

export class GameRoom {
  constructor(state) {
    this.state = state;
    this.sessions = new Map();
    this.snapshot = null;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") !== "websocket") {
      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });
      return Response.json({ error: "WebSocket upgrade required" }, { status: 426, headers: corsHeaders() });
    }
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    const seat = crypto.randomUUID();
    this.sessions.set(server, { seat, name: "Player" });
    server.send(JSON.stringify({ type: "welcome", seat, snapshot: this.snapshot, players: this.sessions.size }));
    this.broadcast({ type: "presence", players: this.sessions.size });
    server.addEventListener("message", event => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "hello") {
        const session = this.sessions.get(server);
        if (session) session.name = String(msg.name || "Player").slice(0, 24);
        this.broadcast({ type: "presence", players: this.sessions.size, names: [...this.sessions.values()].map(s => s.name) });
      } else if (msg.type === "state" && msg.snapshot && typeof msg.snapshot === "object") {
        // A connected client may publish the latest game snapshot; clients apply updates without re-broadcasting.
        this.snapshot = msg.snapshot;
        this.broadcast({ type: "state", snapshot: this.snapshot, from: seat }, server);
      } else if (msg.type === "ping") {
        try { server.send(JSON.stringify({ type: "pong", at: Date.now() })); } catch {}
      }
    });
    const cleanup = () => {
      this.sessions.delete(server);
      this.broadcast({ type: "presence", players: this.sessions.size, names: [...this.sessions.values()].map(s => s.name) });
    };
    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);
    return new Response(null, { status: 101, webSocket: client });
  }
  broadcast(message, except = null) {
    const data = JSON.stringify(message);
    for (const ws of this.sessions.keys()) {
      if (ws === except) continue;
      try { ws.send(data); } catch { this.sessions.delete(ws); }
    }
  }
}
function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
}
