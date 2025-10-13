import { db, emailHistory } from '../db';
import { desc } from 'drizzle-orm';
import { EmailService } from '../services/email';

export interface WebServerConfig {
  port: number;
  emailService: EmailService;
}

export function createWebServer(config: WebServerConfig) {
  return Bun.serve({
    port: config.port,
    async fetch(req) {
      const url = new URL(req.url);

      // Serve the main page
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new Response(renderHomePage(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // API: Get email history
      if (url.pathname === '/api/emails') {
        const limit = parseInt(url.searchParams.get('limit') || '100');
        const emails = await db
          .select()
          .from(emailHistory)
          .orderBy(desc(emailHistory.sentAt))
          .limit(limit);

        return new Response(JSON.stringify(emails), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // API: Resend email
      if (url.pathname === '/api/resend' && req.method === 'POST') {
        try {
          const body = await req.json();
          const { id } = body;

          if (!id) {
            return new Response(JSON.stringify({ error: 'Email ID required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          await config.emailService.resendEmail(id);

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response('Not Found', { status: 404 });
    },
  });
}

function renderHomePage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Tools - Email History</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        h1 {
            color: #333;
            margin-bottom: 20px;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-card h3 {
            color: #666;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
        }

        .stat-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }

        .email-table {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background: #f8f9fa;
        }

        th {
            text-align: left;
            padding: 15px;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e9ecef;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .badge.sent {
            background: #d4edda;
            color: #155724;
        }

        .badge.failed {
            background: #f8d7da;
            color: #721c24;
        }

        .badge.admin {
            background: #cce5ff;
            color: #004085;
        }

        .badge.late {
            background: #fff3cd;
            color: #856404;
        }

        .badge.checkout {
            background: #e7f3ff;
            color: #0056b3;
        }

        .badge.reservation {
            background: #f0e6ff;
            color: #6f42c1;
        }

        .badge.repair {
            background: #ffe6e6;
            color: #c82333;
        }

        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        button:hover {
            background: #0056b3;
        }

        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Asset Tools - Email History</h1>

        <div class="stats">
            <div class="stat-card">
                <h3>Total Emails</h3>
                <div class="value" id="total-emails">0</div>
            </div>
            <div class="stat-card">
                <h3>Sent Successfully</h3>
                <div class="value" id="sent-emails">0</div>
            </div>
            <div class="stat-card">
                <h3>Failed</h3>
                <div class="value" id="failed-emails">0</div>
            </div>
            <div class="stat-card">
                <h3>Late Notifications</h3>
                <div class="value" id="late-emails">0</div>
            </div>
        </div>

        <div id="error-container"></div>

        <div class="email-table">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Recipient</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="email-list">
                    <tr>
                        <td colspan="6" class="loading">Loading...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let emails = [];

        function formatDate(date) {
            return new Date(date).toLocaleString();
        }

        function updateStats() {
            const total = emails.length;
            const sent = emails.filter(e => e.status === 'sent').length;
            const failed = emails.filter(e => e.status === 'failed').length;
            const late = emails.filter(e => e.is_late).length;

            document.getElementById('total-emails').textContent = total;
            document.getElementById('sent-emails').textContent = sent;
            document.getElementById('failed-emails').textContent = failed;
            document.getElementById('late-emails').textContent = late;
        }

        function renderEmails() {
            const tbody = document.getElementById('email-list');

            if (emails.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="loading">No emails found</td></tr>';
                return;
            }

            tbody.innerHTML = emails.map(email => {
                const badges = [];
                badges.push(\`<span class="badge \${email.item_type}">\${email.item_type}</span>\`);
                badges.push(\`<span class="badge \${email.status}">\${email.status}</span>\`);
                if (email.is_admin) badges.push('<span class="badge admin">Admin</span>');
                if (email.is_late) badges.push('<span class="badge late">Late</span>');

                const showResend = email.status === 'failed' || email.needs_manual_send;

                return \`
                    <tr>
                        <td>\${formatDate(email.sent_at)}</td>
                        <td>\${badges.join(' ')}</td>
                        <td>\${email.recipient}</td>
                        <td>\${email.subject}</td>
                        <td>
                            \${email.error_message ?
                                \`<span title="\${email.error_message}" style="color: #dc3545;">⚠️ \${email.status}</span>\` :
                                email.status
                            }
                        </td>
                        <td>
                            \${showResend ?
                                \`<button onclick="resendEmail(\${email.id})">Resend</button>\` :
                                '-'
                            }
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        async function loadEmails() {
            try {
                const response = await fetch('/api/emails');
                emails = await response.json();
                updateStats();
                renderEmails();
            } catch (error) {
                showError('Failed to load emails: ' + error.message);
            }
        }

        async function resendEmail(id) {
            if (!confirm('Are you sure you want to resend this email?')) {
                return;
            }

            try {
                const response = await fetch('/api/resend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id }),
                });

                const result = await response.json();

                if (result.error) {
                    showError('Failed to resend: ' + result.error);
                } else {
                    showSuccess('Email resent successfully!');
                    setTimeout(() => loadEmails(), 1000);
                }
            } catch (error) {
                showError('Failed to resend: ' + error.message);
            }
        }

        function showError(message) {
            const container = document.getElementById('error-container');
            container.innerHTML = \`<div class="error">\${message}</div>\`;
            setTimeout(() => container.innerHTML = '', 5000);
        }

        function showSuccess(message) {
            const container = document.getElementById('error-container');
            container.innerHTML = \`<div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin-bottom: 20px;">\${message}</div>\`;
            setTimeout(() => container.innerHTML = '', 5000);
        }

        // Load emails on page load
        loadEmails();

        // Refresh every 30 seconds
        setInterval(loadEmails, 30000);
    </script>
</body>
</html>
  `.trim();
}
