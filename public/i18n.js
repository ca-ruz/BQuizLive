// i18n.js — shared translations for host and player screens

const i18n = {
  es: {
    // ── Shared ────────────────────────────────────────────────────────────────
    'you':                   '(tú)',
    'question-counter':      'Pregunta {0} de {1}',
    'question-label':        'Pregunta',
    'leaderboard':           'Marcador',
    'final-standings':       'Clasificación Final',
    'points':                'puntos',

    // ── Player — static labels ────────────────────────────────────────────────
    'tagline':               'Aprende Bitcoin. Gana Sats.',
    'your-nickname':         'Tu apodo',
    'room-code':             'Código de sala',
    'btn-join':              'Unirse al Quiz',
    'payment-title':         'Entrada al Quiz',
    'payment-subtitle':      'Escanea el QR para pagar la entrada',
    'waiting-payment':       'Esperando confirmación del pago…',
    'waiting-title':         '¡Ya estás dentro!',
    'waiting-subtitle':      'Esperando que el presentador inicie el quiz…',
    'waiting-stay':          'Quédate en esta página — el quiz iniciará automáticamente',
    'answer-sent':           '¡Respuesta enviada!',
    'waiting-others':        'Esperando a los demás…',
    'you-won':               '¡GANASTE!',
    'winner-sub':            'El presentador te enviará los sats.<br>¡Bien jugado!',
    'winner-pool-sub':       '¡Felicidades! Ganaste el pozo de {0} sats.',
    'btn-claim-prize':       'Cobrar Premio',
    'payout-title':          '¡RECLAMA TU PREMIO!',
    'payout-subtitle':       'Ingresa tu dirección Lightning o factura',
    'payout-dest-label':     'Lightning Address / Invoice / BOLT12',
    'btn-claim':             'Cobrar Premio',
    'payout-processing':     'Procesando pago…',
    'thanks':                '¡Gracias por participar!',
    'tip':                   'Tip: ¡corre tu propio nodo Bitcoin y únete a la Red Lightning!',

    // ── Player — dynamic strings ──────────────────────────────────────────────
    'room-prefix':           'Sala: ',
    'err-no-nickname':       'Por favor ingresa un apodo.',
    'err-nickname-long':     'El apodo debe tener máximo 20 caracteres.',
    'err-no-room':           'Por favor ingresa el código de sala.',
    'err-no-payout-dest':    'Ingresa una dirección Lightning válida.',
    'no-answer':             'Sin respuesta',
    'correct':               '¡Correcto!',
    'incorrect':             '¡Incorrecto!',
    'points-earned':         '+{0} puntos',
    'total-score':           'Total: {0} puntos',
    'finish-position':       'Terminaste en el lugar {0} con {1} puntos',
    'winner-announce':       'Ganador/a: {0} — ¡felicidades!',
    'payout-success':        '¡Pago enviado con éxito! Revisa tu wallet, {0}.',
    'host-disconnected':     'El presentador se desconectó. El quiz podría reanudarse en breve.',

    // ── Host — static labels ──────────────────────────────────────────────────
    'host-role':             'Presentador',
    'host-tagline':          'Quiz de Bitcoin para tu meetup',
    'ready-title':           '¿Listo para presentar?',
    'ready-desc':            'Crea una sala, comparte el código con los participantes y conduce el quiz pregunta por pregunta.',
    'btn-create-room':       'Crear Sala',
    'room-code-label':       'Código de Sala',
    'join-from-browser':     'O entra desde tu navegador en',
    'players-connected':     'Jugadores conectados:',
    'btn-start-quiz':        'Iniciar Quiz',
    'force-end':             'Terminar Pregunta Ahora',
    'current-leaderboard':   'Marcador actual',
    'correct-answer':        '✓ Respuesta correcta',
    'next-in':               'Siguiente pregunta en',
    'btn-end-quiz':          'Terminar Quiz',
    'lightning-invoice':     'Factura Lightning',
    'manual-payment-label':  'Lightning no configurado — paga manualmente:',
    'copy-invoice':          'Copiar Factura',
    'copied':                '¡Copiado!',
    'btn-restart':           'Nuevo Quiz',

    // ── Host — dynamic strings ────────────────────────────────────────────────
    'lightning-nwc':         '⚡ NWC conectado — ¡el ganador recibe sats reales!',
    'lightning-lnd':         '⚡ LND conectado — ¡el ganador recibe sats reales!',
    'lightning-phoenixd':    '⚡ Phoenixd activo — ¡Pozo de sats habilitado!',
    'lightning-breez-liquid':'⚡ Breez Liquid activo — ¡Pozo de sats habilitado!',
    'lightning-mdk':         '⚡ MDK activo — ¡Pozo de sats habilitado!',
    'lightning-manual':      'Lightning no configurado — modo de pago manual',
    'waiting-players':       'Esperando participantes…',
    'need-one-player':       'Se necesita al menos 1 jugador',
    'players-ready':         '{0} jugador listo',
    'players-ready-plural':  '{0} jugadores listos',
    'answered':              '{0} / {1} respondieron',
    'no-players':            'Sin jugadores',
    'send-sats-manually':    'Enviar {0} sats manualmente',
    'sats-to-pay':           'sats a pagar',
  },

  en: {
    // ── Shared ────────────────────────────────────────────────────────────────
    'you':                   '(you)',
    'question-counter':      'Question {0} of {1}',
    'question-label':        'Question',
    'leaderboard':           'Leaderboard',
    'final-standings':       'Final Standings',
    'points':                'pts',

    // ── Player — static labels ────────────────────────────────────────────────
    'tagline':               'Learn Bitcoin. Earn Sats.',
    'your-nickname':         'Your nickname',
    'room-code':             'Room code',
    'btn-join':              'Join the Quiz',
    'payment-title':         'Quiz Entry Fee',
    'payment-subtitle':      'Scan the QR to pay the entry fee',
    'waiting-payment':       'Waiting for payment confirmation…',
    'waiting-title':         "You're in!",
    'waiting-subtitle':      'Waiting for the host to start the quiz…',
    'waiting-stay':          'Stay on this page — the quiz will start automatically',
    'answer-sent':           'Answer submitted!',
    'waiting-others':        'Waiting for others…',
    'you-won':               'YOU WON!',
    'winner-sub':            'The host will send you the sats.<br>Well played!',
    'winner-pool-sub':       'Congratulations! You won the {0} sats pool.',
    'btn-claim-prize':       'Claim Prize',
    'payout-title':          'CLAIM YOUR PRIZE!',
    'payout-subtitle':       'Enter your Lightning Address or Invoice',
    'payout-dest-label':     'Lightning Address / Invoice / BOLT12',
    'btn-claim':             'Claim Prize',
    'payout-processing':     'Processing payment…',
    'thanks':                'Thanks for playing!',
    'tip':                   'Tip: run your own Bitcoin node and join the Lightning Network!',

    // ── Player — dynamic strings ──────────────────────────────────────────────
    'room-prefix':           'Room: ',
    'err-no-nickname':       'Please enter a nickname.',
    'err-nickname-long':     'Nickname must be 20 characters or less.',
    'err-no-room':           'Please enter the room code.',
    'err-no-payout-dest':    'Please enter a valid Lightning destination.',
    'no-answer':             'No answer',
    'correct':               'Correct!',
    'incorrect':             'Incorrect!',
    'points-earned':         '+{0} pts',
    'total-score':           'Total: {0} pts',
    'finish-position':       'You finished {0} with {1} pts',
    'winner-announce':       'Winner: {0} — congratulations!',
    'payout-success':        'Payment sent successfully! Check your wallet, {0}.',
    'host-disconnected':     'The host disconnected. The quiz might resume shortly.',

    // ── Host — static labels ──────────────────────────────────────────────────
    'host-role':             'Host',
    'host-tagline':          'Bitcoin Quiz for your meetup',
    'ready-title':           'Ready to host?',
    'ready-desc':            'Create a room, share the code with players and run the quiz question by question.',
    'btn-create-room':       'Create Room',
    'room-code-label':       'Room Code',
    'join-from-browser':     'Or join from your browser at',
    'players-connected':     'Connected players:',
    'btn-start-quiz':        'Start Quiz',
    'force-end':             'End Question Now',
    'current-leaderboard':   'Current leaderboard',
    'correct-answer':        '✓ Correct answer',
    'next-in':               'Next question in',
    'btn-end-quiz':          'End Quiz',
    'lightning-invoice':     'Lightning Invoice',
    'manual-payment-label':  'Lightning not configured — pay manually:',
    'copy-invoice':          'Copy Invoice',
    'copied':                'Copied!',
    'btn-restart':           'New Quiz',

    // ── Host — dynamic strings ────────────────────────────────────────────────
    'lightning-nwc':         '⚡ NWC connected — the winner gets real sats!',
    'lightning-lnd':         '⚡ LND connected — the winner gets real sats!',
    'lightning-phoenixd':    '⚡ Phoenixd active — Prize Pool enabled!',
    'lightning-breez-liquid':'⚡ Breez Liquid active — Prize Pool enabled!',
    'lightning-mdk':         '⚡ MDK active — Prize Pool enabled!',
    'lightning-manual':      'Lightning not configured — manual payment mode',
    'waiting-players':       'Waiting for players…',
    'need-one-player':       'Need at least 1 player',
    'players-ready':         '{0} player ready',
    'players-ready-plural':  '{0} players ready',
    'answered':              '{0} / {1} answered',
    'no-players':            'No players',
    'send-sats-manually':    'Send {0} sats manually',
    'sats-to-pay':           'sats to pay',
  }
};

let currentLang = localStorage.getItem('bquiz-lang') || 'es';

/** Translate a key, substituting {0}, {1}, ... with extra arguments. */
function t(key, ...args) {
  const str = (i18n[currentLang] || i18n.es)[key] || key;
  return args.length ? str.replace(/\{(\d+)\}/g, (_, i) => args[+i] ?? '') : str;
}

/** Swap all data-i18n elements and update button labels. */
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('bquiz-lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.textContent = lang === 'es' ? 'EN' : 'ES';
  });
}

/** Call once after DOM is ready to apply saved preference and wire the button. */
function initLang() {
  applyLang(currentLang);
  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.addEventListener('click', () => applyLang(currentLang === 'es' ? 'en' : 'es'));
  });
}
