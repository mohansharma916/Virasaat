const fs = require('fs');
const path = require('path');

// Ensure dist exists
const distServicePath = path.join(
  __dirname,
  '../dist/notification/email/email-template.service.js',
);

if (!fs.existsSync(distServicePath)) {
  console.error('Please run "npm run build" first to compile TypeScript files.');
  process.exit(1);
}

const { EmailTemplateService } = require(distServicePath);
const service = new EmailTemplateService();

const outDir = path.join(__dirname, '../previews/email-templates');
fs.mkdirSync(outDir, { recursive: true });

const types = service.getAllTemplateTypes();
const manifest = [];

const fileMap = {
  OTP_VERIFICATION: '01-otp-verification',
  WELCOME: '02-welcome',
  CHECK_IN_REMINDER: '03-check-in-reminder',
  CHECK_IN_MISSED: '04-check-in-missed',
  CHECK_IN_CONFIRMED: '05-check-in-confirmed',
  TRUSTED_PERSON_INVITATION: '06-trusted-person-invitation',
  RELEASE_CASE_OPENED: '07-release-case-opened',
  RELEASE_AUTHORIZED: '08-release-authorized',
  PASSWORD_RESET: '09-password-reset',
  SECURITY_ALERT: '10-security-alert',
  SUBSCRIPTION_RECEIPT: '11-subscription-receipt',
};

const titleMap = {
  OTP_VERIFICATION: 'OTP Verification (Signup & Security)',
  WELCOME: 'Welcome to Virasat (After Signup)',
  CHECK_IN_REMINDER: 'Check-In Routine Reminder',
  CHECK_IN_MISSED: 'Check-In Missed (Grace Period Alert)',
  CHECK_IN_CONFIRMED: 'Check-In Confirmed Success',
  TRUSTED_PERSON_INVITATION: 'Trusted Contact / Nominee Invitation',
  RELEASE_CASE_OPENED: 'Release Case Opened (Verifier Notice)',
  RELEASE_AUTHORIZED: 'Release Authorized (Legacy Delivery)',
  PASSWORD_RESET: 'Password Reset Code & Link',
  SECURITY_ALERT: 'Account Security Sentinel Alert',
  SUBSCRIPTION_RECEIPT: 'Subscription Upgrade & Receipt',
};

console.log('Generating email preview files...');

types.forEach((type, index) => {
  const rendered = service.renderSample(type);
  const baseName = fileMap[type] || `template-${index + 1}`;
  const htmlFile = `${baseName}.html`;
  const txtFile = `${baseName}.txt`;

  fs.writeFileSync(path.join(outDir, htmlFile), rendered.html, 'utf-8');
  fs.writeFileSync(path.join(outDir, txtFile), rendered.text, 'utf-8');

  manifest.push({
    id: type,
    number: String(index + 1).padStart(2, '0'),
    title: titleMap[type] || type,
    subject: rendered.subject,
    htmlFile,
    txtFile,
  });

  console.log(`✓ [${index + 1}/${types.length}] Generated ${htmlFile}`);
});

// Generate interactive Gallery UI
const galleryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Virasat — Email Templates Preview Gallery</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary-forest: #0B5D4B;
      --deep-forest: #063F34;
      --warm-ivory: #F8F5EA;
      --mint: #EAF4F0;
      --sage: #DCEBE5;
      --border: #D7E1DD;
      --text-primary: #14231F;
      --text-secondary: #52615D;
      --text-muted: #7A8783;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #063F34;
      color: #FFFFFF;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #063F34;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      flex-shrink: 0;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .crest {
      width: 38px;
      height: 38px;
      background: #0B5D4B;
      border: 1px solid rgba(197, 155, 39, 0.4);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      font-size: 20px;
      color: #FFFFFF;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #FFFFFF;
    }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 1px;
      color: #DCEBE5;
      text-transform: uppercase;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .device-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .device-btn.active {
      background: #0B5D4B;
      border-color: #35B86B;
    }
    .device-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .main {
      display: flex;
      flex: 1;
      height: calc(100vh - 64px);
      overflow: hidden;
    }
    .sidebar {
      width: 320px;
      background: #08493D;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .sidebar-title {
      padding: 16px 20px 8px 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #DCEBE5;
      text-transform: uppercase;
    }
    .template-item {
      padding: 12px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      gap: 10px;
    }
    .template-item:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .template-item.active {
      background: #0B5D4B;
      border-left: 4px solid #35B86B;
    }
    .template-num {
      font-size: 11px;
      font-weight: 700;
      color: #35B86B;
      min-width: 20px;
      padding-top: 2px;
    }
    .template-info {
      flex: 1;
    }
    .template-name {
      font-size: 13px;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 2px;
    }
    .template-subject {
      font-size: 11px;
      color: #DCEBE5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 230px;
    }
    .preview-pane {
      flex: 1;
      background: #EAE6D8;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .info-bar {
      background: #FFFFFF;
      border-bottom: 1px solid #D7E1DD;
      padding: 10px 24px;
      color: #14231F;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .info-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .info-subject-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #7A8783;
    }
    .info-subject {
      font-size: 14px;
      font-weight: 600;
      color: #063F34;
    }
    .info-actions {
      display: flex;
      gap: 8px;
    }
    .action-link {
      font-size: 12px;
      color: #0B5D4B;
      font-weight: 600;
      text-decoration: none;
      padding: 6px 12px;
      border: 1px solid #D7E1DD;
      border-radius: 6px;
      background: #FAFBFB;
    }
    .action-link:hover {
      background: #EAF4F0;
    }
    .iframe-wrapper {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow-y: auto;
      padding: 24px;
      background: #EAE6D8;
    }
    iframe {
      border: 0;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      border-radius: 8px;
      background: #FFFFFF;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="crest">V</div>
      <div>
        <div class="brand-title">VIRASAT</div>
        <div class="brand-sub">Official Email Template Catalog</div>
      </div>
    </div>
    <div class="controls">
      <span style="font-size: 12px; color: #DCEBE5; margin-right: 8px;">Viewport:</span>
      <button class="device-btn active" onclick="setViewport('100%', this)">Desktop (Full)</button>
      <button class="device-btn" onclick="setViewport('640px', this)">Tablet / 640px</button>
      <button class="device-btn" onclick="setViewport('375px', this)">Mobile / 375px</button>
    </div>
  </header>

  <div class="main">
    <div class="sidebar">
      <div class="sidebar-title">Templates (${manifest.length})</div>
      <div id="template-list"></div>
    </div>

    <div class="preview-pane">
      <div class="info-bar">
        <div class="info-meta">
          <div class="info-subject-label">Email Subject Line</div>
          <div class="info-subject" id="current-subject">Loading...</div>
        </div>
        <div class="info-actions">
          <a id="open-new-tab" class="action-link" href="#" target="_blank">&#8599; Open Raw HTML</a>
          <a id="open-text" class="action-link" href="#" target="_blank">&#9776; Plain Text</a>
        </div>
      </div>
      <div class="iframe-wrapper">
        <iframe id="preview-frame" width="100%" height="95%"></iframe>
      </div>
    </div>
  </div>

  <script>
    const templates = ${JSON.stringify(manifest, null, 2)};
    let activeIndex = 0;

    function renderList() {
      const list = document.getElementById('template-list');
      list.innerHTML = '';
      templates.forEach((t, index) => {
        const item = document.createElement('div');
        item.className = 'template-item' + (index === activeIndex ? ' active' : '');
        item.onclick = () => selectTemplate(index);
        item.innerHTML = \`
          <div class="template-num">\${t.number}</div>
          <div class="template-info">
            <div class="template-name">\${t.title}</div>
            <div class="template-subject">\${t.subject}</div>
          </div>
        \`;
        list.appendChild(item);
      });
    }

    function selectTemplate(index) {
      activeIndex = index;
      renderList();
      const t = templates[index];
      document.getElementById('current-subject').innerText = t.subject;
      document.getElementById('open-new-tab').href = t.htmlFile;
      document.getElementById('open-text').href = t.txtFile;
      const iframe = document.getElementById('preview-frame');
      iframe.src = t.htmlFile;
    }

    function setViewport(width, btn) {
      document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const iframe = document.getElementById('preview-frame');
      iframe.style.width = width;
      if (width === '375px') {
        iframe.style.borderRadius = '24px';
        iframe.style.border = '8px solid #222222';
      } else {
        iframe.style.borderRadius = '8px';
        iframe.style.border = '0';
      }
    }

    // Init
    renderList();
    selectTemplate(0);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), galleryHtml, 'utf-8');
console.log(`\n🎉 Successfully generated Email Template Gallery at:`);
console.log(`   ${path.join(outDir, 'index.html')}`);
