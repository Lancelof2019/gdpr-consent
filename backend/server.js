// backend/server.js
const express = require("express");
const cors    = require("cors");
const mysql   = require("mysql2/promise");
const path    = require("path");
const crypto  = require("crypto");

//////
const fs      = require("fs");                 // 新增
const puppeteer = require("puppeteer-core");  // 新增

// —— Chrome 路径探测 —— //
function pickChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates = ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/snap/bin/chromium"];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return "/usr/bin/google-chrome";
}
const CHROME_PATH = pickChromePath();

// —— 创建 app（只能有一次）—— //
const app = express();

// —— 中间件（一次即可，顺序：CORS -> JSON -> 静态）—— //
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static("/var/www/html/gdpr-consent/public"));

// —— 签名图片目录 & 静态暴露 —— //
const SIGN_DIR = "/var/www/html/gdpr-consent/public/sig_pictures";
if (!fs.existsSync(SIGN_DIR)) fs.mkdirSync(SIGN_DIR, { recursive: true });
app.use("/sig_pictures", express.static(SIGN_DIR));

// —— 公共工具函数 —— //
function toMySQLDateTime(iso) {
  const d = iso ? new Date(iso) : new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}



//////
// MySQL 配置
const pool = mysql.createPool({
  host:     "115.29.41.53",
  port:     3306,
  user:     "demoast",
  password: "Passw0rd@123!",
  database: "resume_candidate",
  waitForConnections: true,
  connectionLimit:    10
});

const ADMIN_SECRET = "xxxxx"; // 管理员密钥
const BASE_URL = "https://www.dl-futurehr.com/gdpr-consent";  // 外部访问地址
/////////////////////////
/*function buildAgreementHTML({ token, company, person_name, signed_name, signed_date, signatureBase64 }) {
  const now = new Date().toLocaleString();
  // 安全转义
  const safe = v => (v || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<title>GDPR Consent - Snapshot</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;margin:0;background:#fff}
  .page{width:1000px;margin:24px auto;padding:24px;border:1px solid #ddd;border-radius:10px}
  h2{margin:0 0 10px}.meta{font-size:12px;color:#666;margin-bottom:12px}
  .hr{height:1px;background:#ddd;margin:16px 0}.kv{margin:8px 0}
  .kv b{display:inline-block;width:160px}ol,ul{margin:6px 0 10px 20px}
  .sigrow{display:flex;gap:24px;align-items:center;margin-top:12px;flex-wrap:wrap}
  .sigbox{width:520px;height:160px;border:1px solid #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#fff}
  .sigbox img{max-width:95%;max-height:95%}
  .foot{font-size:12px;color:#777;margin-top:12px}
</style></head>
<body><div class="page">
  <h2>Employee Data Storage Consent Form</h2>
  <div class="meta">Token: ${safe(token)} &nbsp; | &nbsp; Rendered at: ${safe(now)}</div>
  <div class="kv"><b>To (Company):</b> ${safe(company)}</div>
  <div class="kv"><b>Name:</b> ${safe(person_name)}</div>
  <div class="hr"></div>
  <h4>1. Data Storage Scope</h4>
  <p>I consent to your company legally storing and processing the following data during the employment relationship and within the statutory retention period:</p>
  <ol type="a">
    <li>Personal Identification Data (such as name, identification documents, contact details)</li>
    <li>Employee Data (such as contract, salary records, attendance data)</li>
    <li>Recruitment Process Data (such as interview notes, screening results, employee referrals)</li>
    <li>Other Necessary Employment-related Documents (such as health certificates, training records)</li>
  </ol>
  <p>The data will be processed solely for employment-related purposes...</p>
  <h4>2. Privacy Security</h4>
  <p><b>Storage Specifications</b> …</p>
  <p><b>Duration of data storage</b> …</p>
  <h4>3. My legal rights to data processing</h4>
  <ul>
    <li>Access, copy, or transfer personal data (GDPR Articles 15, 20)</li>
    <li>Request correction … (GDPR Article 16)</li>
    <li>Request deletion … (GDPR Articles 17, 18)</li>
  </ul>
  <h4>4. Declaration of consent</h4>
  <p>I have read and …</p>

  <div class="sigrow"><div><b>Signed Name:</b> ${safe(signed_name || person_name)}</div><div><b>Date:</b> ${safe(signed_date)}</div></div>
  <div class="sigrow" style="margin-top:8px"><div class="sigbox">
    ${signatureBase64 ? `<img alt="Signature" src="data:image/png;base64,${signatureBase64}" />` : "No signature"}
  </div></div>

  <div class="foot">System-rendered snapshot for archival; original consent was signed online.</div>
</div></body></html>`;
}
////////////////////////////////////////
async function renderAgreementToPNG({ token, company, person_name, signed_name, signed_date, signatureBase64, outputPath }) {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 1600, deviceScaleFactor: 2 });
    const html = buildAgreementHTML({ token, company, person_name, signed_name, signed_date, signatureBase64 });
    await page.setContent(html, { waitUntil: "load" });
    await page.screenshot({ path: outputPath, fullPage: true });
  } finally {
    await browser.close();
  }
}
*/

function buildAgreementHTML({ token, company, person_name, signed_name, signed_date, signatureBase64,retention_choice}) {
  const now = new Date().toLocaleString();
  const safe = v => (v || "").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  // NEW: 根据 rc 生成 [x]/[ ] 标记
  //const rc = (retention_choice === 'c' || retention_choice === 'e' || retention_choice === 'b') ? retention_choice : 'b';
  const rcIn = (retention_choice || '').toString().trim().toLowerCase();
  const rc   = ['b','c','e'].includes(rcIn) ? rcIn : 'b';
  const m = on => on ? "[x]" : "";
  const mB = m(rc === 'b');
  const mC = m(rc === 'c');
  const mE = m(rc === 'e');
  const rcDesc =
    rc === 'c' ? "Option C · Keep 24 months for future contact"
  : rc === 'e' ? "Option E · No retention (immediate delete)"
               : "Option B · Delete in 6 months (default)";
 /* return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>GDPR Consent - Snapshot</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;margin:0;background:#fff}
  .page{width:1000px;margin:24px auto;padding:24px;border:1px solid #ddd;border-radius:10px}
  h2{margin:0 0 10px}
  .meta{font-size:12px;color:#666;margin-bottom:12px}
  .hr{height:1px;background:#ddd;margin:16px 0}
  .kv{margin:8px 0}
  .kv b{display:inline-block;width:160px}
  ol,ul{margin:6px 0 10px 20px}
  .sigrow{display:flex;gap:24px;align-items:center;margin-top:12px;flex-wrap:wrap}
  .sigbox{width:520px;height:160px;border:1px solid #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#fff}
  .sigbox img{max-width:95%;max-height:95%}
  .foot{font-size:12px;color:#777;margin-top:12px}
</style>
</head>
<body>
  <div class="page">
    <h2>Employee Data Storage Consent Form</h2>
    <div class="meta">Token: ${safe(token)} &nbsp; | &nbsp; Rendered at: ${safe(now)}</div>

    <div class="kv"><b>To (Company):</b> ${safe(company)}</div>
    <div class="kv"><b>Name:</b> ${safe(person_name)}</div>
    <div class="hr"></div>

    <p>
      I, <strong>${safe(person_name)}</strong>, understand and acknowledge the data processing requirements under
      the General Data Protection Regulation (GDPR) for the personal data I provide to your company.
    </p>

    <h4>1. Data Storage Scope</h4>
    <p>I consent to your company legally storing and processing the following data during the employment relationship and within the statutory retention period:</p>
    <ol type="a">
      <li>Personal Identification Data (such as name, identification documents, contact details)</li>
      <li>Employee Data (such as contract, salary records, attendance data)</li>
      <li>Recruitment Process Data (such as interview notes, screening results, employee referrals)</li>
      <li>Other Necessary Employment-related Documents (such as health certificates, training records)</li>
    </ol>
    <p>The data will be processed solely for employment-related purposes, including fulfilling the employment contract, processing salary payments, managing social security contributions, conducting compliance audits, meeting legal obligations, and supporting recruitment activities.</p>

    <h4>2. Privacy Security</h4>
    <p><b>Storage Specifications</b><br/>The company ensures data security in compliance with GDPR Article 32, implementing measures such as encryption, role-based access control, and regular security audits.</p>

    <p><b>Duration of data storage</b></p>
    <ol type="a">
      <li>If your application is accepted and you are hired, the personal data processed during the recruitment process will be included in the HR records and processed for the duration required by applicable employment laws.</li>
      <li>If your application is rejected and you do not consent to further processing, we will delete your personal data within 6 months after the position is filled.</li>
      <li>If your application is rejected but you consent to retaining your data for future contact, we will process your personal data for 24 months after the position is filled, after which it will be deleted immediately.</li>
      <li>If your personal data is processed based on your consent, you may request to withdraw your consent at any time, and we will delete your data within 8 working days of receiving the withdrawal request.</li>
    </ol>
    <p>Your company will not provide my data to third parties without my further written consent, except where legally required or necessary to fulfill a contract.</p>

    <h4>3. My legal rights to data processing</h4>
    <p><b>My Data Protection Rights:</b><br/>I acknowledge and retain the following rights:</p>
    <ul>
      <li>Access, copy, or transfer personal data (GDPR Articles 15, 20)</li>
      <li>Request correction or completion of incomplete data (GDPR Article 16)</li>
      <li>Request deletion or restriction of data processing under statutory conditions (GDPR Articles 17, 18)</li>
    </ul>

    <h4>4. Declaration of consent</h4>
    <p>I have read and have understood this consent form and voluntarily authorize your company to store and process my data in accordance with GDPR and internal policies.</p>

    <div class="sigrow">
      <div><b>Signed Name:</b> ${safe(signed_name || person_name)}</div>
      <div><b>Date:</b> ${safe(signed_date)}</div>
    </div>

    <div class="sigrow" style="margin-top:8px">
      <div class="sigbox">
        ${signatureBase64 ? `<img alt="Signature" src="data:image/png;base64,${signatureBase64}" />` : "No signature"}
      </div>
    </div>

    <div class="foot">System-rendered snapshot for archival; original consent was signed online.</div>
  </div>
</body>
</html>`;*/

return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>GDPR Consent - Snapshot</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;margin:0;background:#fff}
  .page{width:1000px;margin:24px auto;padding:24px;border:1px solid #ddd;border-radius:10px}
  h2{margin:0 0 10px}
  .meta{font-size:12px;color:#666;margin-bottom:12px}
  .hr{height:1px;background:#ddd;margin:16px 0}
  .kv{margin:8px 0}
  .kv b{display:inline-block;width:200px}
  ol,ul{margin:6px 0 10px 20px}
  .sigrow{display:flex;gap:24px;align-items:center;margin-top:12px;flex-wrap:wrap}
  .sigbox{width:520px;height:160px;border:1px solid #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#fff}
  .sigbox img{max-width:95%;max-height:95%}
  .foot{font-size:12px;color:#777;margin-top:12px}
  .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace}
  .check{display:inline-block; margin-right:6px; white-space:nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;}
</style>
</head>
<body>
  <div class="page">
    <h2>Employee Data Storage Consent Form</h2>
    <div class="meta">Token: ${safe(token)} &nbsp; | &nbsp; Rendered at: ${safe(now)}</div>

    <div class="kv"><b>To (Company):</b> ${safe(company)}</div>
    <div class="kv"><b>Name:</b> ${safe(person_name)}</div>
    <div class="hr"></div>

    <p>
      I, <strong>${safe(person_name)}</strong>, understand and acknowledge the data processing
      requirements under the General Data Protection Regulation (GDPR) for the personal data
      I provide to your company.
    </p>

    <h4>1. Data Storage Scope</h4>
    <p>I consent to your company legally storing and processing the following data during the employment relationship and within the statutory retention period:</p>
    <ol type="a">
      <li>Personal Identification Data (such as name, identification documents, contact details)</li>
      <li>Employee Data (such as contract, salary records, attendance data)</li>
      <li>Recruitment Process Data (such as interview notes, screening results, employee referrals)</li>
      <li>Other Necessary Employment-related Documents (such as health certificates, training records)</li>
    </ol>
    <p>The data will be processed solely for recruitment-related purposes, including matching candidates with your client positions, assisting in fulfilling recruitment service contracts with clients, meeting legal obligations, and supporting recruitment activities.</p>

    <h4>2. Privacy Security</h4>
    <p><b>Storage Specifications</b><br/>The company ensures data security in compliance with GDPR Article 32, implementing measures such as encryption, role-based access control, and regular security audits.</p>

    <p><b>Duration of data storage</b></p>
    <ol type="a">
      <li>If your application is accepted and you are hired, the personal data processed during the recruitment process will be included in the HR records and processed for the duration required by applicable employment laws.</li>

      <li><span class="mono check">${mB}</span>If your application is rejected and you do not consent to further processing, we will delete your personal data within 6 months after the position is filled. (Default option)</li>
      <li><span class="mono check">${mC}</span>If your application is rejected but you consent to retaining your data for future contact, we will process your personal data for 24 months after the position is filled, after which it will be deleted immediately.</li>
     <li>If your personal data is processed based on your consent, you may request to withdraw your consent at any time, and we will delete your data within 8 working days of receiving the withdrawal request.</li>
     <li><span class="mono check">${mE}</span>If you do not consent to data retention, we will delete your personal data immediately after the recruitment process concludes.</li>
    </ol>
    <p class="mono">Note: If neither c nor e is selected, option b applies by default.</p>

    <p><b>Data Sharing</b><br/>I consent to my data being shared with your client employers when necessary, provided that the data is used solely for recruitment purposes. If data is transferred outside the European Union, I acknowledge that your company will comply with GDPR cross-border data transfer requirements.</p>

    <h4>3. My legal rights to data processing</h4>
    <p><b>My Data Protection Rights:</b><br/>I acknowledge and retain the following rights:</p>
    <ul>
      <li>Access, copy, or transfer personal data (GDPR Articles 15, 20)</li>
      <li>Request correction or completion of incomplete data (GDPR Article 16)</li>
      <li>Request deletion or restriction of data processing under statutory conditions (GDPR Articles 17, 18)</li>
    </ul>

    <h4>4. Declaration of consent</h4>
    <p>I have read and understood this consent form and voluntarily authorize your company to store and process my data in accordance with GDPR and internal policies. I understand that my data may be shared with your clients and that I have the right to withdraw consent at any time. If I do not provide consent, the recruitment process cannot proceed, and any data provided will be deleted immediately.</p>

    <div class="sigrow">
      <div><b>Signed Name:</b> ${safe(signed_name || person_name)}</div>
      <div><b>Date:</b> ${safe(signed_date)}</div>
    </div>

    <div class="sigrow" style="margin-top:8px">
      <div class="sigbox">
        ${signatureBase64 ? `<img alt="Signature" src="data:image/png;base64,${signatureBase64}" />` : "No signature"}
      </div>
    </div>

    <div class="foot">System-rendered snapshot for archival; original consent was signed online.</div>
  </div>
</body>
</html>`;

}
////////////////////////////////////////
async function renderAgreementToPNG({ token, company, person_name, signed_name, signed_date, signatureBase64,retention_choice,outputPath }) {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: CHROME_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 1600, deviceScaleFactor: 2 });
    const html = buildAgreementHTML({ token, company, person_name, signed_name, signed_date, signatureBase64,retention_choice });
    await page.setContent(html, { waitUntil: "load" });
    await page.screenshot({ path: outputPath, fullPage: true });
  } finally {
    await browser.close();
  }
}



/////////////////////////
// ✅ 接口：生成唯一 token（绑定用户）返回链接（不发邮件）
app.post("/api/generate-token", async (req, res) => {
  try {
    const { email, admin_secret } = req.body;
    if (!email || admin_secret !== ADMIN_SECRET) {
      return res.status(403).json({ error: "Unauthorized or missing fields" });
    }

    const [userRows] = await pool.execute(
      `SELECT id FROM candidates WHERE email = ?`,
      [email]
    );
    let candidate_id;
    if (userRows.length > 0) {
      candidate_id = userRows[0].id;
    } else {
      const [result] = await pool.execute(
        `INSERT INTO candidates (email) VALUES (?)`,
        [email]
      );
      candidate_id = result.insertId;
    }

    const [tokenRows] = await pool.execute(
      `SELECT token, expires_at FROM consent_tokens WHERE candidate_id = ? AND used = FALSE AND expires_at > NOW()`,
      [candidate_id]
    );

    let token;
    if (tokenRows.length > 0) {
      token = tokenRows[0].token;
    } else {
      token = crypto.randomBytes(16).toString("hex");
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时有效期

      await pool.execute(
        `INSERT INTO consent_tokens (candidate_id, token, expires_at) VALUES (?, ?, ?)`,
        [candidate_id, token, expires_at]
      );
    }

    const signUrl = `${BASE_URL}/sign?token=${token}`;
    res.json({ token, sign_url: signUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// ✅ 接口：用户访问签字页面验证 token
app.get("/sign", async (req, res) => {
  const token = req.query.token;
  if (!token) return res.redirect(`${BASE_URL}/invalid-token.html`);

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM consent_tokens WHERE token = ?`,
      [token]
    );
    if (!rows.length) return res.redirect(`${BASE_URL}/invalid-token.html`);

    const record = rows[0];
    if (record.used || (record.expires_at && new Date(record.expires_at) < new Date())) {
      return res.redirect(`${BASE_URL}/invalid-token.html`);
    }

    res.sendFile(path.join("/var/www/html/gdpr-consent/public", "gdpr-consent.html"));
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Internal error");
  }
});

// ✅ 接口：提交签字（token 自动识别 candidate）
/*app.post("/api/consent", async (req, res) => {
  try {
    const { token, signature, signed_at, signature_data } = req.body;

    if (!token || !signature || !signed_at || typeof signature_data === 'undefined') {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM consent_tokens WHERE token = ?`,
      [token]
    );
    if (!rows.length) return res.status(404).json({ error: "Invalid token" });
    const t = rows[0];
    if (t.used) return res.status(403).json({ error: "Token already used" });

    const imgBuffer = Buffer.from(signature, "base64");
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const hashInput = signature + JSON.stringify(signature_data) + signed_at + token;
    const signatureHash = crypto.createHash("sha256").update(hashInput).digest("hex");

    console.log("[Consent Submit]", {
      token,
      signed_at,
      ip,
      userAgent,
      signatureLength: signature.length,
      signature_data,
      signatureHash
    });

    await pool.execute(
      `INSERT INTO candidate_signatures
         (candidate_id, signature_blob, signed_at, ip_address, user_agent, signature_data, signature_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [t.candidate_id, imgBuffer, signed_at.replace("T", " ").slice(0, 19), ip, userAgent, JSON.stringify(signature_data || []), signatureHash]
    );

    await pool.execute(`UPDATE consent_tokens SET used = TRUE WHERE token = ?`, [token]);

    res.json({ success: true });
  } catch (err) {
    console.error("[Consent Submit Error]", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});*/
//////////////////////////////////////////////////
/*
app.post("/api/consent", async (req, res) => {
  try {
    const {
      token,
      company,
      person_name,   // -> candidate_information_input.candidate_name
      signed_name,   // -> candidate_information_input.signer_name
      signed_date,   // YYYY-MM-DD
      signature,     // base64 (不含 dataURL 前缀)
      signature_data,
      signed_at      // ISO
    } = req.body;


    if (!token || !company || !person_name || !signed_name || !signed_date || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(signed_date)) {
      return res.status(400).json({ error: "signed_date must be YYYY-MM-DD" });
    }


    const [rows] = await pool.execute(
      `SELECT candidate_id, used, expires_at FROM consent_tokens WHERE token = ? FOR UPDATE`,
      [token]
    );
    if (!rows.length) return res.status(404).json({ error: "Invalid token" });
    const tk = rows[0];
    if (tk.used) return res.status(403).json({ error: "Token already used" });
    if (tk.expires_at && new Date(tk.expires_at) < new Date()) {
      return res.status(403).json({ error: "Token expired" });
    }


    const signedAtDB = toMySQLDateTime(signed_at);

    const signatureHash = crypto.createHash("sha256").update(signature).digest("hex");

    const imgBuffer = Buffer.from(signature, "base64");
    const ip = (req.headers["x-forwarded-for"] || req.ip || "").toString().slice(0, 45);
    const userAgent = (req.headers["user-agent"] || "").toString();

    // 事务写库
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();


      await conn.execute(
        `INSERT INTO candidate_information_input
           (token, company, candidate_name, signer_name, signed_date, signed_at,
            signature_base64, signature_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          token,
          company,
          person_name,
          signed_name,
          signed_date,
          signedAtDB,
          signature,
          JSON.stringify(signature_data || [])
        ]
      );


      await conn.execute(
        `INSERT INTO candidate_signatures
           (candidate_id, signature_blob, signed_at, ip_address, user_agent,
            signature_data, signature_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tk.candidate_id,
          imgBuffer,
          signedAtDB,
          ip,
          userAgent,
          JSON.stringify(signature_data || []),
          signatureHash
        ]
      );


      await conn.execute(`UPDATE consent_tokens SET used = TRUE WHERE token = ?`, [token]);

      await conn.commit();
      res.json({ success: true });
    } catch (e) {
      await conn.rollback();
      console.error("[/api/consent tx error]", e);
      res.status(500).json({ error: "Internal error (tx)" });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("[/api/consent error]", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});
*/

////////////////////////////////////////////////
// === 替换你当前的 app.post("/api/consent", ...) 整段 ===
app.post("/api/consent", async (req, res) => {
  try {
    /*const {
      token,
      company,
      person_name,   // -> candidate_information_input.candidate_name
      signed_name,   // -> candidate_information_input.signer_name
      signed_date,   // YYYY-MM-DD
      signature,     // base64 (不含 dataURL 前缀)
      signature_data,
      signed_at,// ISO
      retention_choice,
      consent_future_contact,
      consent_no_retention
    } = req.body;*/
     let {
          token, company, person_name, signed_name, signed_date, signature,signature_data, signed_at, retention_choice, consent_future_contact, consent_no_retention
         } = req.body;

    if (!token || !company || !person_name || !signed_name || !signed_date || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(signed_date)) {
      return res.status(400).json({ error: "signed_date must be YYYY-MM-DD" });
    }
   //retention_choice = String(retention_choice || 'b').toLowerCase();
   //const validRC = ['b','c','e'];
   // retention_choice = validRC.includes(retention_choice) ? retention_choice : 'b';
   // consent_future_contact = !!consent_future_contact;
   //consent_no_retention   = !!consent_no_retention;
   let rc = (retention_choice || '').toString().trim().toLowerCase();
   if (!['b','c','e'].includes(rc)) {
     if (consent_future_contact)    rc = 'c';
      else if (consent_no_retention) rc = 'e';
      else                           rc = 'b';
   }
// 以 rc 为准反向同步布尔，避免冲突
    retention_choice       = rc;
    consent_future_contact = (rc === 'c');
    consent_no_retention   = (rc === 'e');

    if (consent_future_contact && consent_no_retention) {
      if (retention_choice === 'c') {
        consent_no_retention = false;
      } else if (retention_choice === 'e') {
        consent_future_contact = false;
      } else {
        return res.status(400).json({ error: "Choose either option c or e, not both." });
      }
    }
    if (retention_choice === 'c') {
      consent_future_contact = true;
      consent_no_retention = false;
    } else if (retention_choice === 'e') {
      consent_future_contact = false;
      consent_no_retention = true;
    } else {
      consent_future_contact = false;
      consent_no_retention = false;
    }
    // 1) 校验 token 并取 candidate_id（加锁保证一致性）
// ✅ 校验 token：必须存在、未过期、未使用 
    const [rows] = await pool.execute(
     `SELECT candidate_id, used, expires_at
       FROM consent_tokens
       WHERE token = ? FOR UPDATE`,
      [token]
    );
    if (!rows.length) return res.status(404).json({ error: "Invalid token" });

    const tk = rows[0];
    if (tk.used) return res.status(403).json({ error: "Token already used" });
    if (tk.expires_at && new Date(tk.expires_at) < new Date()) {
      return res.status(403).json({ error: "Token expired" });
    }

    // 2) 为截图准备一个稳定的文件名（优先用邮箱）
    const safeName = s => (s || "").trim().toLowerCase()
      .replace(/[^a-z0-9@._-]/gi, "_").replace(/_+/g, "_");
    let email = null;
    try {
      const [erows] = await pool.execute(
        `SELECT c.email
           FROM consent_tokens t
           JOIN candidates c ON c.id = t.candidate_id
          WHERE t.token = ?
          LIMIT 1`,
        [token]
      );
      if (erows.length) email = erows[0].email;
    } catch (_) {}

    const baseName   = `${safeName(email || token)}_${Date.now()}.png`;
    const fileOnDisk = path.join(SIGN_DIR, baseName);
    //const webPath    = `/sig_pictures/${baseName}`;
    const webPath    = `/gdpr-consent/sig_pictures/${baseName}`;

    // 3) 先渲染整页 PNG（失败直接抛错，避免写入半成品 DB）
    await renderAgreementToPNG({
      token,
      company,
      person_name,
      signed_name,
      signed_date,
      signatureBase64: signature,
      retention_choice,
      outputPath: fileOnDisk
    });

    // 4) 计算辅助字段
    const signedAtDB = toMySQLDateTime(signed_at);
    const signatureHash = crypto.createHash("sha256").update(signature).digest("hex");
    const imgBuffer = Buffer.from(signature, "base64");
    const ip = (req.headers["x-forwarded-for"] || req.ip || "").toString().slice(0, 45);
    const userAgent = (req.headers["user-agent"] || "").toString();

    // 5) 事务写入两张表，并标记 token used
    /*const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 把 webPath 一并写入 image_path
      await conn.execute(
        `INSERT INTO candidate_information_input
           (token, company, candidate_name, signer_name, signed_date, signed_at,
            signature_base64, signature_data, image_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          token,
          company,
          person_name,
          signed_name,
          signed_date,
          signedAtDB,
          signature,
          JSON.stringify(signature_data || []),
          webPath
        ]
      );

      await conn.execute(
        `INSERT INTO candidate_signatures
           (candidate_id, signature_blob, signed_at, ip_address, user_agent,
            signature_data, signature_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          tk.candidate_id,
          imgBuffer,
          signedAtDB,
          ip,
          userAgent,
          JSON.stringify(signature_data || []),
          signatureHash
        ]
      );

      await conn.execute(`UPDATE consent_tokens SET used = TRUE WHERE token = ?`, [token]);

      await conn.commit();
      // 返回图片相对路径，前端可直接展示
      res.json({ success: true, image_path: webPath });
    } catch (e) {
      await conn.rollback();
      console.error("[/api/consent tx error]", e);
      res.status(500).json({ error: "Internal error (tx)" });
    } finally {
      conn.release();
    }*/
  const conn = await pool.getConnection();
  try {
  await conn.beginTransaction();

  // ① 在同一连接+事务里加锁读取 token
  const [trows] = await conn.execute(
    `SELECT candidate_id, used, expires_at
       FROM consent_tokens
      WHERE token = ? FOR UPDATE`,
    [token]
  );
  if (!trows.length) { await conn.rollback(); return res.status(404).json({ error: "Invalid token" }); }
  const tk = trows[0];
  if (tk.used || (tk.expires_at && new Date(tk.expires_at) < new Date())) {
    await conn.rollback();
    return res.status(403).json({ error: "Token already used or expired" });
  }

  // ② 把 rc 等塞进 signature_data，一起存（不改表结构）
  const sigJSON = {
    ...(Array.isArray(signature_data) ? { strokes: signature_data } : (signature_data || {})),
    retention_choice,
    consent_future_contact: !!consent_future_contact,
    consent_no_retention: !!consent_no_retention,
  };

  // ③ 写入 candidate_information_input
  await conn.execute(
    `INSERT INTO candidate_information_input
       (token, company, candidate_name, signer_name, signed_date, signed_at,
        signature_base64, signature_data, image_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      token,
      company,
      person_name,
      signed_name,
      signed_date,
      signedAtDB,
      signature,
      JSON.stringify(sigJSON),   // ← 使用合并后的 JSON
      webPath
    ]
  );

  // ④ 写入 candidate_signatures
  await conn.execute(
    `INSERT INTO candidate_signatures
       (candidate_id, signature_blob, signed_at, ip_address, user_agent,
        signature_data, signature_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tk.candidate_id,
      imgBuffer,
      signedAtDB,
      ip,
      userAgent,
      JSON.stringify(sigJSON),   // ← 使用合并后的 JSON
      signatureHash
    ]
  );

  // ⑤ 标记 token 已使用
  await conn.execute(`UPDATE consent_tokens SET used = TRUE WHERE token = ?`, [token]);

  await conn.commit();
  res.json({ success: true, image_path: webPath, retention_choice }); // 可选：返回 rc
} catch (e) {
  await conn.rollback();
  console.error("[/api/consent tx error]", e);
  res.status(500).json({ error: "Internal error (tx)" });
} finally {
  conn.release();
}

  } catch (err) {
    console.error("[/api/consent error]", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});




/////////////////////////////////////////////////

// ✅ 显示签名图像与哈希
app.get("/api/signature", async (req, res) => {
  const id = parseInt(req.query.id, 10);
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const [rows] = await pool.execute(
      "SELECT signature_blob, signature_hash FROM candidate_signatures WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json({ blob: rows[0].signature_blob.toString("base64"), hash: rows[0].signature_hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 健康检查（同时兼容 /healthz 与 /api/healthz）
app.get(["/healthz", "/api/healthz"], async (req, res) => {
  try {
    // 简单 DB 探活
    await pool.query("SELECT 1");
    res.json({
      ok: true,
      db: "up",
      time: new Date().toISOString()
    });
  } catch (e) {
    console.error("[healthz] DB check failed:", e.message);
    res.status(500).json({
      ok: false,
      db: "down",
      error: e.message
    });
  }
});




// GET /api/signatures-by-email?email=test@example.com
//app.get("/api/signatures_verification", async (req, res) => {
app.get("/api/signatures_verification", async (req, res) => {
 const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    const [rows] = await pool.execute(`
      SELECT s.id, s.signed_at, s.ip_address, s.user_agent, s.signature_hash, s.signature_blob
      FROM candidate_signatures s
      JOIN candidates c ON s.candidate_id = c.id
      WHERE c.email = ?
      ORDER BY s.signed_at DESC
    `, [email]);

    if (!rows.length) return res.status(404).json({ error: "No signatures found" });

    const result = rows.map(row => ({
      id: row.id,
      signed_at: row.signed_at,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      signature_hash: row.signature_hash,
      blob: row.signature_blob.toString("base64")
    }));

    res.json({ signatures: result });
  } catch (err) {
    console.error("[signature-by-email error]", err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/consent-bundle", async (req, res) => {
  try {
    const { email, token } = req.query;
    if (!email && !token) {
      return res.status(400).json({ error: "Provide email or token" });
    }

    let rows;
    if (token) {
      // 通过 token 取最近一条
      [rows] = await pool.execute(
        `
        SELECT
          cii.company,
          cii.candidate_name,
          cii.signer_name,
          cii.signed_date,
          cii.signed_at,
          cii.image_path,
          s.signature_blob,
          s.signature_hash
        FROM consent_tokens t
        JOIN candidate_information_input cii ON cii.token = t.token
        JOIN candidate_signatures s ON s.candidate_id = t.candidate_id
        WHERE t.token = ?
        ORDER BY cii.signed_at DESC, s.signed_at DESC
        LIMIT 1
        `,
        [token]
      );
    } else {
      // 通过 email 取最近一条
      [rows] = await pool.execute(
        `
        SELECT
          cii.company,
          cii.candidate_name,
          cii.signer_name,
          cii.signed_date,
          cii.signed_at,
          cii.image_path,
          s.signature_blob,
          s.signature_hash
        FROM candidates c
        JOIN consent_tokens t ON t.candidate_id = c.id
        JOIN candidate_information_input cii ON cii.token = t.token
        JOIN candidate_signatures s ON s.candidate_id = c.id
        WHERE c.email = ?
        ORDER BY cii.signed_at DESC, s.signed_at DESC
        LIMIT 1
        `,
        [email]
      );
    }

    if (!rows.length) return res.status(404).json({ error: "No data found" });

    const r = rows[0];
    res.json({
      company: r.company,
      candidate_name: r.candidate_name,
      signer_name: r.signer_name,
      signed_date: r.signed_date,                 // 'YYYY-MM-DD'
      signed_at: r.signed_at,                     // MySQL DATETIME
      signature_hash: r.signature_hash,
      signature_png_base64: r.signature_blob.toString("base64"),
      image_path: r.image_path || null
    });
  } catch (e) {
    console.error("[/api/consent-bundle]", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 捕捉所有未命中路由，返回友好提示页面
app.use((req, res) => {
  res.status(404).sendFile(path.join("/var/www/html/gdpr-consent/public", "invalid-token.html"));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
