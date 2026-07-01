let state = null;
let currentUser = JSON.parse(localStorage.getItem("bc_user") || "null");
let lastPayment = null;

const statusLabels = {
  pending_payment: "Chờ thanh toán",
  pending_review: "Chờ duyệt",
  published: "Đã đăng",
  rejected: "Từ chối",
  pending: "Chờ thanh toán",
  confirmed: "Đã xác nhận",
  ready: "Sẵn sàng",
  verified: "Đã xác minh"
};

const money = new Intl.NumberFormat("vi-VN");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Có lỗi xảy ra.");
  }
  return payload;
}

function actor() {
  return currentUser?.name || "Khách truy cập";
}

function statusBadge(value) {
  return `<span class="status ${value}">${statusLabels[value] || value}</span>`;
}

function canAdmin() {
  return currentUser && ["super_admin", "operator"].includes(currentUser.role);
}

function canConfirmPayment() {
  return currentUser?.role === "super_admin";
}

function setText(selector, text) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = text;
  });
}

function renderUser() {
  const name = currentUser ? currentUser.name : "Chưa đăng nhập";
  const role = currentUser ? `Vai trò: ${currentUser.role}` : "Chọn tài khoản demo để xem đúng vai trò.";
  setText("[data-current-user]", name);
  setText("[data-current-role]", role);
}

function renderMeta() {
  setText("[data-hotline]", state.meta.hotline);
  setText("[data-hotline-2]", state.meta.hotline);
  setText("[data-hotline-3]", state.meta.hotline);
  setText("[data-bank-account]", state.meta.bankAccount);
}

function renderPlans() {
  const select = document.querySelector("[data-plan-select]");
  select.innerHTML = state.plans
    .filter((plan) => plan.audience === "company")
    .map((plan) => `<option value="${plan.id}">${plan.name} - ${money.format(plan.price)}đ/${plan.unit}</option>`)
    .join("");
}

function renderCommitment() {
  const item = state.serviceCommitments[0];
  document.querySelector("[data-commitment]").innerHTML = `
    <strong>${item.title}</strong>
    <span>Phiên bản: ${item.version}</span>
    <ol>${item.items.map((text) => `<li>${text}</li>`).join("")}</ol>
  `;
}

function renderStats() {
  setText("[data-stat-published]", state.jobs.filter((job) => job.status === "published").length);
  setText("[data-stat-pending-pay]", state.jobs.filter((job) => job.status === "pending_payment").length);
  setText("[data-stat-review]", state.jobs.filter((job) => job.status === "pending_review").length);
}

function renderJobs() {
  const published = state.jobs.filter((job) => job.status === "published");
  const container = document.querySelector("[data-jobs]");
  if (!published.length) {
    container.innerHTML = `<article class="job-card"><p>Chưa có tin tuyển dụng đã duyệt.</p></article>`;
    return;
  }
  container.innerHTML = published.map((job) => `
    <article class="job-card">
      <div>
        <h3>${job.title}</h3>
        <p><strong>${job.company}</strong> · ${job.location} · ${job.salary || "Thỏa thuận"}</p>
        <p>${job.description}</p>
        ${statusBadge(job.status)}
      </div>
      <button class="button secondary" type="button" data-apply="${job.id}">Ứng tuyển</button>
    </article>
  `).join("");
}

function renderPaymentPreview() {
  const payment = lastPayment || state.payments[0];
  if (!payment) return;
  setText("[data-last-payment-code]", payment.code);
  setText("[data-last-payment-detail]", `${payment.customerName} cần thanh toán ${money.format(payment.amount)}đ.`);
}

function renderPayments() {
  document.querySelector("[data-payments]").innerHTML = state.payments.map((payment) => `
    <tr>
      <td>${payment.code}</td>
      <td>${payment.customerName}</td>
      <td>${money.format(payment.amount)}đ</td>
      <td>${statusBadge(payment.status)}</td>
      <td>
        <button class="button small secondary" type="button" data-confirm-payment="${payment.id}" ${payment.status === "confirmed" || !canConfirmPayment() ? "disabled" : ""}>
          Xác nhận
        </button>
      </td>
    </tr>
  `).join("");
}

function renderAdminJobs() {
  document.querySelector("[data-admin-jobs]").innerHTML = state.jobs.map((job) => `
    <tr>
      <td>${job.title}</td>
      <td>${job.company}</td>
      <td>${statusBadge(job.status)}</td>
      <td>
        <button class="button small secondary" type="button" data-publish-job="${job.id}" ${job.status !== "pending_review" || !canAdmin() ? "disabled" : ""}>Duyệt</button>
        <button class="button small danger" type="button" data-reject-job="${job.id}" ${job.status === "published" || job.status === "rejected" || !canAdmin() ? "disabled" : ""}>Từ chối</button>
      </td>
    </tr>
  `).join("");
}

function renderLogs() {
  document.querySelector("[data-logs]").innerHTML = state.adminLogs
    .map((log) => `<li><strong>${log.actor}</strong>: ${log.action}</li>`)
    .join("");
}

function renderAll() {
  renderUser();
  renderMeta();
  renderPlans();
  renderCommitment();
  renderStats();
  renderJobs();
  renderPaymentPreview();
  renderPayments();
  renderAdminJobs();
  renderLogs();
}

async function refresh() {
  state = await api("/api/state");
  renderAll();
}

document.querySelector("[data-login-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const [email, password] = new FormData(event.currentTarget).get("account").split("|");
  currentUser = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  localStorage.setItem("bc_user", JSON.stringify(currentUser));
  renderAll();
});

document.querySelector("[data-candidate-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  const result = await api("/api/candidates", {
    method: "POST",
    body: JSON.stringify({ ...body, actor: actor() })
  });
  state = result.state;
  event.currentTarget.reset();
  setText("[data-candidate-note]", `Đã lưu hồ sơ ${result.candidate.name}.`);
  renderAll();
});

document.querySelector("[data-job-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.currentTarget));
  if (!body.commitment) {
    setText("[data-job-note]", "Cần đồng ý cam kết dịch vụ trước khi tạo mã thanh toán.");
    return;
  }
  const result = await api("/api/job-requests", {
    method: "POST",
    body: JSON.stringify({ ...body, actor: actor() })
  });
  state = result.state;
  lastPayment = result.payment;
  event.currentTarget.reset();
  setText("[data-job-note]", `Đã tạo ${result.payment.code}. Doanh nghiệp chuyển khoản ${money.format(result.payment.amount)}đ để kích hoạt.`);
  renderAll();
  document.querySelector("#payment").scrollIntoView({ behavior: "smooth" });
});

document.body.addEventListener("click", async (event) => {
  const confirmId = event.target.getAttribute("data-confirm-payment");
  const publishId = event.target.getAttribute("data-publish-job");
  const rejectId = event.target.getAttribute("data-reject-job");
  const applyJobId = event.target.getAttribute("data-apply");

  if (confirmId) {
    const result = await api(`/api/payments/${confirmId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ actor: actor() })
    });
    state = result.state;
    renderAll();
  }

  if (publishId) {
    const result = await api(`/api/jobs/${publishId}/publish`, {
      method: "POST",
      body: JSON.stringify({ actor: actor() })
    });
    state = result.state;
    renderAll();
  }

  if (rejectId) {
    const result = await api(`/api/jobs/${rejectId}/reject`, {
      method: "POST",
      body: JSON.stringify({ actor: actor() })
    });
    state = result.state;
    renderAll();
  }

  if (applyJobId) {
    const candidate = state.candidates[0];
    const result = await api("/api/applications", {
      method: "POST",
      body: JSON.stringify({ jobId: applyJobId, candidateId: candidate.id, actor: actor() })
    });
    state = result.state;
    renderAll();
    alert("Đã gửi hồ sơ ứng tuyển demo.");
  }
});

document.querySelector("[data-menu]").addEventListener("click", () => {
  document.querySelector("[data-nav]").classList.toggle("open");
});

document.querySelectorAll("[data-nav] a").forEach((link) => {
  link.addEventListener("click", () => document.querySelector("[data-nav]").classList.remove("open"));
});

refresh().catch((error) => {
  document.body.insertAdjacentHTML("afterbegin", `<p style="padding:16px;background:#f8ddd7">${error.message}</p>`);
});
