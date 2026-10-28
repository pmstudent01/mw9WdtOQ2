const http = require("http");

const vehicles = [
  {
    id: 1,
    nickName: "The Lisa Marie",
    vin: "4M2DV11W4RDJ53329",
    make: "Mercury",
    model: "Villager",
    year: "1994",
    miles: 159864
  },
  {
    id: 2,
    nickName: "Dolly",
    vin: "JN8AZ2KR1AT169594",
    make: "Nissan",
    model: "Cube",
    year: "2010",
    miles: 59000
  }
];

let nextId = 3;

function getIdFromPath(url) {
  const match = url.match(/^\/vehicles\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function sendJson(res, statusCode, data) {
  const body = data !== undefined ? JSON.stringify(data) : "";
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const method = req.method;
  const url = req.url.split("?")[0];

  // @endpoint GET /vehicles
  if (method === "GET" && url === "/vehicles") {
    sendJson(res, 200, vehicles);
    return;
  }

  // @endpoint POST /vehicles
  if (method === "POST" && url === "/vehicles") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      let data;
      try { data = JSON.parse(body); } catch (e) {
        sendJson(res, 400, { error: "Invalid JSON body" });
        return;
      }
      if (!data.nickName || !data.vin || !data.make || !data.model || !data.year) {
        sendJson(res, 400, { error: "Missing required attribute" });
        return;
      }
      const existing = vehicles.find(v => v.vin === data.vin);
      if (existing) {
        sendJson(res, 409, { error: "Vehicle already exists" });
        return;
      }
      const newVehicle = { id: nextId++, ...data };
      vehicles.push(newVehicle);
      sendJson(res, 201, newVehicle);
    });
    return;
  }

  // @endpoint GET /vehicles/:id
  if (method === "GET" && /^\/vehicles\/\d+$/.test(url)) {
    const id = getIdFromPath(url);
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    sendJson(res, 200, vehicle);
    return;
  }

  // @endpoint PATCH /vehicles/:id
  if (method === "PATCH" && /^\/vehicles\/\d+$/.test(url)) {
    const id = getIdFromPath(url);
    const index = vehicles.findIndex(v => v.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      let data;
      try { data = JSON.parse(body); } catch (e) {
        sendJson(res, 400, { error: "Bad request body" });
        return;
      }
      vehicles[index] = { ...vehicles[index], ...data };
      sendJson(res, 200, vehicles[index]);
    });
    return;
  }

  // @endpoint DELETE /vehicles/:id
  if (method === "DELETE" && /^\/vehicles\/\d+$/.test(url)) {
    const id = getIdFromPath(url);
    const index = vehicles.findIndex(v => v.id === id);
    if (index === -1) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }
    vehicles.splice(index, 1);
    res.writeHead(204);
    res.end();
    return;
  }

  // 404 fallback
  sendJson(res, 404, { error: "Route not found" });
});

server.listen(process.env.PORT || 4500);
