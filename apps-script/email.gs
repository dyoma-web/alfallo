/**
 * email.gs — Plantillas y envío de emails transaccionales.
 *
 * Usa MailApp.sendEmail (cuota: 100 emails/día en cuenta gratuita,
 * 1500/día en Workspace). El remitente es la cuenta dueña del script.
 *
 * Si el envío falla (ej. cuota agotada), se loguea pero NO se relanza —
 * los flujos de auth no deben caerse por un email.
 */

// ──────────────────────────────────────────────────────────────────────────
// API pública
// ──────────────────────────────────────────────────────────────────────────

/**
 * Envía link de reset de password.
 * @param {Object} user — fila de la hoja `usuarios`
 * @param {string} token — del registro en tokens_temporales
 */
function emailSendPasswordReset(user, token) {
  if (!email_isEnabled_()) return;

  const link = 'https://dyoma-web.github.io/alfallo/#/reset-password?token=' + encodeURIComponent(token);
  const greetingName = user.nombres ? user.nombres : 'tú';

  email_send_({
    to: user.email,
    subject: 'Restablece tu contraseña — Al Fallo',
    plainBody:
      'Hola ' + greetingName + ',\n\n' +
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Al Fallo.\n\n' +
      'Si fuiste tú, abre este enlace en la próxima hora:\n' +
      link + '\n\n' +
      'Si no fuiste tú, ignora este correo. Tu cuenta sigue protegida.\n\n' +
      '— El equipo de administración\n' +
      '\n— — —\n' +
      'Al Fallo · Operado bajo Ley 1581/2012\n',
    htmlBody: email_renderHtml_({
      title: 'Restablece tu contraseña',
      greeting: 'Hola ' + greetingName + ',',
      paragraphs: [
        'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Al Fallo.',
        'Si fuiste tú, abre el enlace en la próxima hora.',
      ],
      cta: { label: 'Restablecer contraseña', url: link },
      footnote: 'Este enlace vence en 1 hora. Si no solicitaste el cambio, ignora este correo.',
    }),
  });
}

/**
 * Envía link de activación de cuenta.
 * Útil cuando un Admin crea un nuevo usuario en Iter 7.
 */
function emailSendActivationLink(user, token) {
  if (!email_isEnabled_()) return;

  const link = 'https://dyoma-web.github.io/alfallo/#/activate?token=' + encodeURIComponent(token);
  const greetingName = user.nombres ? user.nombres : 'tú';

  email_send_({
    to: user.email,
    subject: 'Activa tu cuenta — Al Fallo',
    plainBody:
      'Hola ' + greetingName + ',\n\n' +
      'Tu cuenta en Al Fallo fue creada por el equipo de administración.\n\n' +
      'Para activarla y establecer tu contraseña, abre este enlace en las próximas 24 horas:\n' +
      link + '\n\n' +
      'Si no esperabas este correo, escríbenos y lo verificamos.\n\n' +
      '— El equipo de administración\n' +
      '\n— — —\n' +
      'Al Fallo · Operado bajo Ley 1581/2012\n',
    htmlBody: email_renderHtml_({
      title: 'Activa tu cuenta',
      greeting: 'Hola ' + greetingName + ',',
      paragraphs: [
        'Tu cuenta en Al Fallo fue creada por el equipo de administración.',
        'Activa tu cuenta y establece tu contraseña con el enlace de abajo.',
      ],
      cta: { label: 'Activar cuenta', url: link },
      footnote: 'Este enlace vence en 24 horas.',
    }),
  });
}

// ──────────────────────────────────────────────────────────────────────────
// Diagnóstico — ejecutar desde el editor de Apps Script
// ──────────────────────────────────────────────────────────────────────────

/**
 * EJECUTAR UNA SOLA VEZ desde el editor (dropdown → authorizeMailScope → Run).
 *
 * Después de pegar código nuevo que usa MailApp, Apps Script detecta el
 * scope `script.send_mail` pero NO lo autoriza automáticamente al hacer
 * deploy. Si nadie corre ninguna función que use MailApp desde el editor,
 * la Web App deployada intenta enviar emails y falla silenciosamente
 * (porque el wrapper email_send_ traga los errores para no romper el flujo
 * de password reset).
 *
 * Esta función envía un correo de prueba a la cuenta dueña del script:
 *   1. Apps Script pide autorización del scope de envío de emails.
 *   2. Aceptas → queda autorizado para todo el proyecto.
 *   3. Recibes el email en tu inbox → confirmación de que funciona.
 *   4. La Web App deployada también puede enviar emails desde ese momento.
 */
function authorizeMailScope() {
  Logger.log('=== ALFALLO — AUTORIZAR ENVÍO DE EMAILS ===');

  const me = Session.getActiveUser().getEmail();
  Logger.log('Cuenta ejecutando: ' + (me || '(no disponible)'));

  // getRemainingDailyQuota requiere el mismo scope — dispara el prompt si falta
  const quota = MailApp.getRemainingDailyQuota();
  Logger.log('Cuota restante hoy: ' + quota + ' emails');

  // Email de prueba al admin semilla (declarado en bootstrap.gs)
  const targetEmail = me || BOOTSTRAP_SUPER_ADMIN.email;

  MailApp.sendEmail({
    to: targetEmail,
    subject: '✓ Al Fallo — autorización de envío OK',
    body:
      'Si lees este correo, MailApp está autorizado correctamente.\n\n' +
      'Los emails de "olvidé mi contraseña" ya van a salir desde la Web App.\n\n' +
      '— Al Fallo · Equipo de administración',
    htmlBody: email_renderHtml_({
      title: 'Autorización de envío OK',
      greeting: 'Hola,',
      paragraphs: [
        'Si lees este correo, MailApp está autorizado correctamente.',
        'Los emails de password reset ya van a salir desde la Web App deployada.',
      ],
      cta: { label: 'Ir a Al Fallo', url: 'https://dyoma-web.github.io/alfallo/' },
      footnote: 'Email de prueba — puedes ignorarlo.',
    }),
    name: 'Al Fallo',
    noReply: true,
  });

  Logger.log('');
  Logger.log('✓ Email de prueba enviado a ' + targetEmail);
  Logger.log('  Revisa tu inbox (puede tardar 30s).');
  Logger.log('  Si no llega, revisa spam/promociones.');
  Logger.log('=== FIN ===');
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function email_isEnabled_() {
  const cfg = dbFindById('config', 'notif.email_enabled');
  if (!cfg) return true;  // default ON
  return String(cfg.value).toLowerCase() !== 'false';
}

function email_send_(opts) {
  try {
    MailApp.sendEmail({
      to: opts.to,
      subject: opts.subject,
      body: opts.plainBody,
      htmlBody: opts.htmlBody,
      name: 'Al Fallo',
      noReply: true,
    });
  } catch (e) {
    Logger.log('email_send_ FAILED to=' + opts.to + ' subject="' + opts.subject + '" — ' + e.message);
    // No re-throw — el flujo de auth no debe fallar por un email.
  }
}

/**
 * Renderiza HTML con la marca dark de Al Fallo (lime sobre fondo casi-negro).
 * Inline styles porque la mayoría de clientes de email NO soportan CSS externo.
 */
function email_renderHtml_(opts) {
  const paragraphsHtml = opts.paragraphs
    .map(function (p) {
      return '<p style="color:#A8B0A4;line-height:1.6;margin:0 0 12px;font-size:15px">' + p + '</p>';
    })
    .join('');

  return [
    '<!DOCTYPE html>',
    '<html lang="es"><head><meta charset="utf-8"><title>' + opts.title + '</title></head>',
    '<body style="margin:0;padding:0;background:#0F1410;color:#F2F4EF;',
    '       font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Inter,sans-serif">',
    '<table role="presentation" style="width:100%;border-collapse:collapse;background:#0F1410">',
    '  <tr><td align="center" style="padding:32px 16px">',
    '    <table role="presentation" style="max-width:480px;width:100%;background:#171D17;',
    '           border-radius:16px;border:1px solid rgba(255,255,255,0.08)">',
    '      <tr><td style="padding:32px">',
    '        <div style="font-size:22px;font-weight:700;letter-spacing:-0.04em;margin-bottom:24px;color:#F2F4EF">',
    '          al<span style="color:#C8FF3D">/</span>fallo',
    '        </div>',
    '        <h1 style="font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#F2F4EF;margin:0 0 16px">',
    '          ' + opts.title,
    '        </h1>',
    '        <p style="color:#A8B0A4;line-height:1.6;margin:0 0 12px;font-size:15px">' + opts.greeting + '</p>',
    '        ' + paragraphsHtml,
    '        <div style="margin:24px 0;text-align:left">',
    '          <a href="' + opts.cta.url + '" style="display:inline-block;background:#C8FF3D;color:#0B1208;',
    '             padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;',
    '             letter-spacing:-0.01em">' + opts.cta.label + '</a>',
    '        </div>',
    '        <p style="color:#6B746A;font-size:13px;line-height:1.6;margin:0">' + opts.footnote + '</p>',
    '      </td></tr>',
    '    </table>',
    '    <p style="color:#6B746A;font-size:11px;margin:20px 0 0;text-align:center;line-height:1.6">',
    '      Al Fallo · Operado bajo Ley 1581/2012<br>',
    '      ¿Preguntas? Escribe a <a href="mailto:david.yomayusa@innovahub.org" style="color:#A8B0A4">david.yomayusa@innovahub.org</a>',
    '    </p>',
    '  </td></tr>',
    '</table></body></html>',
  ].join('\n');
}
