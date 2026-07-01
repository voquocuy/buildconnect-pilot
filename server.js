const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4180);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const REQUESTED_DB_PATH = process.env.DB_PATH || path.join(ROOT, "data", "db.json");
let activeDbPath = REQUESTED_DB_PATH;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function readDb() {
  ensureDbFile();
  return JSON.parse(fs.readFileSync(activeDbPath, "utf8"));
}

function writeDb(db) {
  ensureDbFile();
  db.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(activeDbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

function ensureDbFile() {
  try {
    ensureDbFileAt(activeDbPath);
  } catch (error) {
    if (activeDbPath !== path.join(ROOT, "data", "db.runtime.json")) {
      activeDbPath = path.join(ROOT, "data", "db.runtime.json");
      ensureDbFileAt(activeDbPath);
      return;
    }
    throw error;
  }
}

function ensureDbFileAt(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.copyFileSync(path.join(ROOT, "data", "db.json"), dbPath);
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function paymentCode(db) {
  const nextNumber = String(db.payments.length + 1).padStart(6, "0");
  return `PAY-2026-${nextNumber}`;
}

function addLog(db, actor, action) {
  db.adminLogs.unshift({
    id: id("log"),
    actor: actor || "System",
    action,
    createdAt: new Date().toISOString()
  });
}

function publicState(db) {
  return {
    meta: db.meta,
    plans: db.plans,
    serviceCommitments: db.serviceCommitments,
    jobs: db.jobs.map((job) => ({
      ...job,
      company: db.companies.find((company) => company.id === job.companyId)?.name || "Doanh nghiệp"
    })),
    companies: db.companies,
    candidates: db.candidates,
    payments: db.payments,
    applications: db.applications,
    adminLogs: db.adminLogs.slice(0, 20)
  };
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream"
    });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/state") {
    sendJson(res, 200, publicState(db));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    const body = await readBody(req);
    const user = db.users.find((item) => item.email === body.email && item.password === body.password);
    if (!user) {
      sendJson(res, 401, { error: "Email hoặc mật khẩu không đúng." });
      return;
    }
    sendJson(res, 200, { id: user.id, name: user.name, email: user.email, role: user.role });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/candidates") {
    const body = await readBody(req);
    const candidate = {
      id: id("can"),
      userId: null,
      name: body.name,
      phone: body.phone,
      email: body.email,
      desiredRole: body.desiredRole,
      skills: body.skills,
      salaryExpectation: body.salaryExpectation,
      status: "ready"
    };
    db.candidates.unshift(candidate);
    addLog(db, body.actor, `Tạo hồ sơ ứng viên ${candidate.name}`);
    writeDb(db);
    sendJson(res, 201, { candidate, state: publicState(db) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/job-requests") {
    const body = await readBody(req);
    const plan = db.plans.find((item) => item.id === body.planId) || db.plans[0];
    const company = {
      id: id("cmp"),
      userId: null,
      name: body.companyName,
      taxCode: body.taxCode || "",
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      address: body.address || "",
      status: "pending_review"
    };
    const job = {
      id: id("job"),
      companyId: company.id,
      title: body.title,
      location: body.location,
      category: body.category,
      salary: body.salary,
      description: body.description,
      status: "pending_payment",
      paymentId: null,
      createdAt: new Date().toISOString()
    };
    const payment = {
      id: id("pay"),
      code: paymentCode(db),
      planId: plan.id,
      amount: plan.price,
      customerName: company.name,
      relatedType: "job",
      relatedId: job.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      confirmedAt: null
    };
    job.paymentId = payment.id;
    db.companies.unshift(company);
    db.jobs.unshift(job);
    db.payments.unshift(payment);
    addLog(db, body.actor, `Tạo yêu cầu đăng tin ${job.title} với mã ${payment.code}`);
    writeDb(db);
    sendJson(res, 201, { company, job, payment, state: publicState(db) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/applications") {
    const body = await readBody(req);
    const application = {
      id: id("app"),
      jobId: body.jobId,
      candidateId: body.candidateId,
      status: "submitted",
      createdAt: new Date().toISOString()
    };
    db.applications.unshift(application);
    addLog(db, body.actor, "Ứng viên gửi hồ sơ ứng tuyển");
    writeDb(db);
    sendJson(res, 201, { application, state: publicState(db) });
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/payments/") && url.pathname.endsWith("/confirm")) {
    const paymentId = url.pathname.split("/")[3];
    const body = await readBody(req);
    const payment = db.payments.find((item) => item.id === paymentId);
    if (!payment) {
      notFound(res);
      return;
    }
    payment.status = "confirmed";
    payment.confirmedAt = new Date().toISOString();
    const job = db.jobs.find((item) => item.id === payment.relatedId);
    if (job) {
      job.status = "pending_review";
    }
    addLog(db, body.actor, `Xác nhận thanh toán ${payment.code}`);
    writeDb(db);
    sendJson(res, 200, { payment, state: publicState(db) });
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/jobs/")) {
    const parts = url.pathname.split("/");
    const jobId = parts[3];
    const action = parts[4];
    const body = await readBody(req);
    const job = db.jobs.find((item) => item.id === jobId);
    if (!job) {
      notFound(res);
      return;
    }
    if (action === "publish") {
      job.status = "published";
      addLog(db, body.actor, `Duyệt đăng tin ${job.title}`);
    } else if (action === "reject") {
      job.status = "rejected";
      addLog(db, body.actor, `Từ chối tin ${job.title}`);
    } else {
      notFound(res);
      return;
    }
    writeDb(db);
    sendJson(res, 200, { job, state: publicState(db) });
    return;
  }

  notFound(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`BuildConnect Pilot is running on ${HOST}:${PORT}`);
});
