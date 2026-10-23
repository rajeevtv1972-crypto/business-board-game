export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/health") return Response.json({ ok: true, service: "Desi Tycoon rooms" });
    const match = url.pathname.match(/^\/api\/room\/([A-Z0-9]{4,8})$/);
    if (match) {
      const room = env.GAME_ROOMS.get(env.GAME_ROOMS.idFromName(match[1]));
      return room.fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};

export class GameRoom {
  constructor(state) {
    this.state = state;
    this.sessions = new Map();
    this.snapshot = null;
    this.loaded = false;
  }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return Response.json({ error: "WebSocket upgrade required" }, { status: 426 });
    }
    if (!this.loaded) {
      this.snapshot = await this.state.storage.get("snapshot") || null;
      this.loaded = true;
    }
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    const used = new Set([...this.sessions.values()].map(s => s.seatIndex));
    let seatIndex = [0, 1, 2, 3].find(i => !used.has(i));
    if (seatIndex === undefined) {
      server.close(1013, "Room is full");
      return new Response(null, { status: 101, webSocket: client });
    }
    server.accept();
    const seat = crypto.randomUUID();
    this.sessions.set(server, { seat, seatIndex, name: "Player" });
    server.send(JSON.stringify({ type: "welcome", seat, seatIndex, snapshot: this.snapshot, players: this.sessions.size }));
    this.broadcast({ type: "presence", players: this.sessions.size, names: [...this.sessions.values()].map(s => s.name) });
    server.addEventListener("message", async event => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (!msg || typeof msg !== "object") return;
      if (msg.type === "hello") {
        const session = this.sessions.get(server);
        if (session) session.name = String(msg.name || "Player").slice(0, 24);
        this.broadcast({ type: "presence", players: this.sessions.size, names: [...this.sessions.values()].map(s => s.name) });
      } else if (msg.type === "state" && msg.snapshot && typeof msg.snapshot === "object") {
        const session = this.sessions.get(server);
        // Only seat 0 (the host) can initialize a new match; active clients can publish turn changes.
        if (!session) return;
        this.snapshot = msg.snapshot;
        await this.state.storage.put("snapshot", this.snapshot);
        this.broadcast({ type: "state", snapshot: this.snapshot, from: seat, seat: session.seatIndex }, server);
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
