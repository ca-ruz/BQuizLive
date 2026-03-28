# Bitcoin Quiz Live

Quiz multijugador estilo Kahoot para meetups de Bitcoin.
Los participantes se unen desde su teléfono, compiten en tiempo real y
el ganador recibe sats a través de Lightning Network.

---

## Características

- Panel del presentador con marcador en vivo y flujo automático
- Participantes se unen desde su celular con un código de sala o escaneando un QR
- ~100 preguntas en 9 categorías: `bitcoin`, `blockchain`, `mining`, `lightning`, `wallets`, `transactions`, `channels`, `lsp`, `dev`
- Configura las categorías por evento con la variable `CATEGORIES` (ej: `lightning,channels,lsp`)
- Temporizador de cuenta regresiva con puntuación por velocidad (50–100 pts)
- La pregunta termina automáticamente cuando alguien responde correctamente, todos han contestado, o se acaba el tiempo
- Avance automático entre preguntas (o terminar manualmente) — el presentador sólo inicia y observa
- Marcador en tiempo real después de cada pregunta
- Pago Lightning al ganador: NWC, LND REST o modo manual
- QR en pantalla del presentador para que los participantes se unan fácilmente
- URL de sala mostrada en pantalla del presentador (para participantes con laptop)
- UI mobile-first — botones grandes, legible en cualquier pantalla

---

## Inicio rápido

### 1. Clonar e Instalar dependencias

```bash
git clone https://github.com/ca-ruz/bitcoin-quiz-live
cd bitcoin-quiz-live
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
# edita .env según necesites
```

Para correr sin Lightning (modo manual), no necesitas cambiar nada.

### 3. Correr el servidor

```bash
# Producción
npm start

# Desarrollo (reinicia automáticamente al guardar cambios)
npm run dev
```

El servidor detecta automáticamente tu IP local y la muestra en consola y en la pantalla del host.

### 4. Abrir el panel del presentador

```
http://localhost:3000/host.html
```

Haz clic en **Crear Sala**. Verás el código de 4 letras, el código QR y la URL de sala.

### 5. Los participantes se unen

Escanean el QR en la pantalla del presentador o abren la URL que aparece en la pantalla del host.
Ingresan su apodo y el código de sala.

> **Tip para meetups:** conecta la laptop a un proyector y comparte tu IP local
> (`ip addr` en Linux / `ipconfig` en Windows). El QR también funciona si todos
> están en la misma red WiFi.

### 6. Flujo del quiz

1. Espera a que los participantes se unan (aparecen en vivo en tu pantalla).
2. Haz clic en **Iniciar Quiz**.
3. La primera pregunta lanza automáticamente con un temporizador de 21 segundos.
4. La pregunta termina en cuanto alguien responde correctamente, todos han contestado, o se acaba el tiempo.
5. Se muestran los resultados durante unos segundos (respuesta correcta + explicación + marcador).
6. La siguiente pregunta inicia sola — no necesitas hacer nada.
7. Al terminar todas las preguntas (o si haces clic en **Terminar Quiz**) aparecen los resultados finales. Si Lightning está configurado, se genera automáticamente una factura por los sats del ganador; de lo contrario se muestra el monto a pagar en modo manual.

---

## Puntuación

| Resultado | Puntos |
|-----------|--------|
| Respuesta incorrecta | 0 |
| Correcto (último segundo) | 50 |
| Correcto (instantáneo) | 100 |

La bonificación por velocidad es lineal entre esos límites.
Los participantes que no responden a tiempo reciben 0 puntos.

**Recompensa en sats** = `puntos_ganador × SAT_PER_POINT` (por defecto 1 sat/punto).

---

## Integración Lightning Network

Hay tres modos, en orden de facilidad:

---

### Opción A — NWC (Nostr Wallet Connect) ⭐ Recomendado

La opción más fácil. Solo necesitas una URL de conexión desde tu wallet.

**Wallets compatibles:** Alby · Zeus · Bitkit · Mutiny · cualquier wallet con soporte NWC

**Pasos:**

1. En [getalby.com](https://getalby.com) (u otra wallet NWC), crea una conexión NWC.
2. Copia la cadena de conexión (empieza con `nostr+walletconnect://`).
3. En tu `.env`:

```env
NWC_URL=nostr+walletconnect://clave-publica?relay=wss://relay.example.com&secret=tu-secreto
```

4. Reinicia el servidor. El estado en la pantalla del presentador mostrará "⚡ NWC conectado".

---

### Opción B — LND REST API (nodo propio)

Para quienes operan su propio nodo Bitcoin/Lightning.

**Obtener el macaroon (en el servidor LND):**

```bash
# Macaroon de administrador (o usa invoice.macaroon para permisos mínimos)
xxd -p -c 10000 ~/.lnd/data/chain/bitcoin/mainnet/invoice.macaroon
```

**Obtener el certificado TLS (opcional pero recomendado):**

```bash
base64 -w 0 ~/.lnd/tls.cert
```

**En tu `.env`:**

```env
LND_REST_URL=https://tu-nodo-lnd:8080
LND_MACAROON=hex-del-macaroon-aqui
LND_CERT=base64-del-certificado-aqui   # omitir desactiva verificación TLS
```

> Si tu nodo LND está en la misma máquina: `LND_REST_URL=https://localhost:8080`
> Sin `LND_CERT` el servidor desactiva la verificación TLS — aceptable para uso local.

---

### Opción C — Modo manual (sin configuración)

Si no configuras ninguna opción Lightning, el servidor corre en **modo manual**:

- Al terminar el quiz, la pantalla del presentador muestra el nombre del ganador
  y el número exacto de sats a pagar.
- El presentador paga desde su wallet directamente al ganador.

---

## Estructura del proyecto

```
bitcoin-quiz-live/
├── server/
│   ├── server.js        Servidor Express + Socket.io
│   ├── quizEngine.js    Estado de salas y jugadores en memoria
│   └── lightning.js     Integración NWC / LND REST
├── public/
│   ├── host.html        Panel del presentador (todas las pantallas)
│   ├── index.html       App del jugador (unirse → quiz → resultados)
│   ├── styles.css       Estilos compartidos (tema synthwave verde/naranja/azul/púrpura)
│   └── client.js        Utilidades JS compartidas
├── data/
│   ├── categories/      Banco de preguntas (~100 preguntas en 9 archivos)
│   │   ├── bitcoin.js   30 preguntas generales (default)
│   │   ├── lightning.js, wallets.js, mining.js, blockchain.js ...
│   └── questions.js     Legacy — mantener como referencia
├── docs/
│   ├── index.html       Landing page (GitHub Pages) — solo markup
│   ├── styles.css       Estilos del sitio web
│   ├── script.js        JS del sitio web (modales, copiar al portapapeles)
│   └── STYLE_GUIDE.md   Referencia de colores y componentes
├── tests/
│   ├── quizEngine.test.js  77 tests de lógica de sala y puntuación
│   ├── questions.test.js   54 tests del banco de preguntas
│   └── lightning.test.js   16 tests de integración Lightning
├── .env.example         Plantilla de configuración
├── LICENSE              GNU General Public License v3
└── package.json
```

---

## Personalizar preguntas

Las preguntas viven en `data/categories/` — un archivo por categoría (`bitcoin.js`, `lightning.js`, etc.).
Cada pregunta tiene esta forma:

```js
{
  text: "¿Tu pregunta aquí?",
  options: ["Opción A", "Opción B", "Opción C", "Opción D"],
  correct: 1,          // índice base 0 de la respuesta correcta
  explanation: "Explicación que se muestra a todos al revelar la respuesta."
}
```

Puedes tener 3 o 4 opciones por pregunta. Usa la variable `CATEGORIES` en `.env` para elegir qué categorías cargar en cada evento.

---

## Variables de entorno

```env
PORT=3000                      # Puerto del servidor (default: 3000)
BASE_URL=http://<tu-ip-local>:3000  # URL pública para el QR; se auto-detecta si se omite
QUESTION_TIME_LIMIT=21         # Segundos por pregunta (default: 21)
QUESTION_COUNT=21              # Preguntas por sesión, subconjunto aleatorio (default: 21)
RESULTS_DELAY=7                # Segundos que se muestra la respuesta correcta (default: 7)
CATEGORIES=bitcoin             # Categorías a cargar, separadas por coma (default: bitcoin)
SAT_PER_POINT=1                # Sats por punto para la recompensa (default: 1)

# Lightning (elige UNA opción):
NWC_URL=nostr+walletconnect://...   # Opción A: NWC
LND_REST_URL=https://nodo:8080      # Opción B: LND
LND_MACAROON=hex...
LND_CERT=base64...
```

---

## Seguridad

- Los apodos tienen límite de 20 caracteres y se escapan antes de renderizarse.
- Cada jugador sólo puede responder una vez por pregunta (validado en el servidor).
- Las salas viven en memoria y se borran al reiniciar el servidor.

---

## Pendientes / Hoja de ruta

### Conectividad Lightning (prioridad alta)

- [ ] **Pagos automáticos vía NWC** — el servidor paga directamente a la Lightning address del ganador usando `pay_invoice`, sin intervención del presentador. El jugador ingresa su Lightning address al unirse.
- [ ] **Pagos automáticos vía LND REST** — equivalente para quienes corren su propio nodo, usando el endpoint `/v1/channels/transactions` o `payinvoice`.
- [ ] **Validación de Lightning address** — verificar en el momento del join que la dirección tiene formato válido (`usuario@dominio.com`) y que el dominio responde LNURL-pay antes de iniciar el quiz.
- [ ] **Notificación de pago en pantalla** — mostrar al ganador y al presentador confirmación del pago (preimage) o error con motivo legible.

### Fondeo del premio y donaciones

- [ ] **Pool de sats para premios** — mecanismo para que la comunidad o el organizador fondee el premio antes del quiz: Lightning address de depósito, QR en la pantalla de espera, o un invoice generado automáticamente al crear la sala.
- [ ] **Zaps de Nostr** — integrar un perfil Nostr del quiz para que cualquier persona pueda zapear y los sats vayan directamente al pool de premios.
- [ ] **Donaciones al creador** — mostrar una Lightning address / QR de donación en la pantalla final del host y en el README para quienes quieran contribuir al desarrollo del proyecto.
- [ ] **Transparencia del pool** — mostrar al presentador el saldo disponible en la wallet antes de iniciar, para saber si hay fondos suficientes para el premio.

### Modo online / sin presentador (visión a futuro)

Actualmente el proyecto está pensado para **meetups y eventos presenciales** donde hay un presentador controlando el flujo desde una laptop. La visión a largo plazo es poder desplegarlo en un servidor público para que cualquier persona en el mundo pueda participar sin necesidad de un host activo:

- [ ] **Sala permanente o autogestionada** — que el quiz pueda iniciarse automáticamente cuando haya suficientes jugadores conectados, sin requerir que alguien abra `host.html`.
- [ ] **Despliegue en servidor remoto** — documentar cómo publicarlo en un VPS (con `nginx` + `pm2` o similar) con `BASE_URL` apuntando al dominio público.
- [ ] **Wallet configurada en el servidor** — con NWC o LND ya configurado en el servidor remoto, los pagos ocurren automáticamente sin que el organizador esté presente.
- [ ] **Múltiples salas simultáneas** — que distintos grupos puedan jugar al mismo tiempo en el mismo servidor público.
- [ ] **Protección anti-spam** — rate limiting en joins y creación de salas para uso en internet abierto.
- [x] **Preguntas por categoría** — 9 categorías disponibles, seleccionables con la variable `CATEGORIES` en `.env`.
- [ ] **Más idiomas** — internacionalización para llegar a comunidades Bitcoin de habla no española.

---

## Licencia

GNU General Public License v3.0 — ver [LICENSE](./LICENSE).

Este proyecto es software libre. Puedes usarlo, modificarlo y distribuirlo
siempre que mantengas la misma licencia en cualquier trabajo derivado.
Ningún fork puede volverse privativo. Las contribuciones son bienvenidas.
