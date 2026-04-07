// Categoría: Lightning Network — pagos, nodos y protocolo

const questions = [
  {
    text: {
      es: "¿Qué es una factura (invoice) de Lightning?",
      en: "What is a Lightning invoice?"
    },
    options: {
      es: [
        "Un contrato legal entre dos partes que usan canales de pago",
        "Un comprobante de pago emitido y registrado en la blockchain",
        "Una solicitud de pago con importe, destino y tiempo de expiración",
        "Un registro permanente de todos los pagos de un nodo Lightning"
      ],
      en: [
        "A legal contract between two parties using payment channels",
        "A payment receipt issued and recorded on the blockchain",
        "A payment request with amount, destination, and expiry time",
        "A permanent record of all payments made by a Lightning node"
      ]
    },
    correct: 2,
    explanation: {
      es: "Una invoice Lightning (formato BOLT 11) codifica el importe, el nodo destino, un hash de pago secreto y un tiempo de expiración. El pagador usa estos datos para encontrar una ruta y enviar el pago de forma atómica.",
      en: "A Lightning invoice (BOLT 11 format) encodes the amount, destination node, a secret payment hash, and an expiry time. The payer uses this data to find a route and send the payment atomically."
    }
  },
  {
    text: {
      es: "¿Qué permite hacer el enrutamiento de pagos en Lightning?",
      en: "What does payment routing in Lightning enable?"
    },
    options: {
      es: [
        "Abrir canales con cualquier nodo sin necesidad de depósito previo",
        "Pagar a un nodo con el que no tienes un canal directo",
        "Confirmar transacciones en la blockchain en menos de un segundo",
        "Recuperar fondos de un canal cerrado de forma forzada"
      ],
      en: [
        "Opening channels with any node without a prior deposit",
        "Paying a node without having a direct channel with it",
        "Confirming blockchain transactions in under one second",
        "Recovering funds from a force-closed channel"
      ]
    },
    correct: 1,
    explanation: {
      es: "No necesitas un canal directo con el destinatario. El pago viaja por una ruta de nodos intermedios, cada uno con canales hacia el siguiente. Gracias a los HTLCs, el proceso es atómico: o el pago llega completo o no sale nada.",
      en: "You don't need a direct channel with the recipient. The payment travels through a route of intermediate nodes, each with channels to the next. Thanks to HTLCs, the process is atomic: either the payment arrives in full or nothing leaves."
    }
  },
  {
    text: {
      es: "¿Qué es un HTLC (Hash Time-Locked Contract)?",
      en: "What is an HTLC (Hash Time-Locked Contract)?"
    },
    options: {
      es: [
        "Un tipo de billetera multifirma para fondos bloqueados en Lightning",
        "Un contrato inteligente que garantiza pagos atómicos entre nodos",
        "Un protocolo para cerrar canales de forma cooperativa y segura",
        "Un acuerdo entre LSPs para compartir liquidez en la red"
      ],
      en: [
        "A type of multisig wallet for funds locked in Lightning",
        "A smart contract that guarantees atomic payments between nodes",
        "A protocol for closing channels cooperatively and safely",
        "An agreement among LSPs to share liquidity on the network"
      ]
    },
    correct: 1,
    explanation: {
      es: "Un HTLC garantiza que el pago se entregue de forma atómica: el receptor revela un secreto (preimage) para cobrar, y ese secreto se propaga hacia atrás por toda la ruta, desbloqueando cada salto. Si algo falla, los fondos regresan al emisor.",
      en: "An HTLC guarantees atomic delivery: the receiver reveals a secret (preimage) to claim the payment, and that secret propagates back through the route, unlocking each hop. If anything fails, funds return to the sender."
    }
  },
  {
    text: {
      es: "¿Qué determina la capacidad máxima de envío en un canal Lightning?",
      en: "What determines the maximum sending capacity of a Lightning channel?"
    },
    options: {
      es: [
        "La velocidad de conexión a internet del nodo emisor",
        "El número de nodos conectados a la red Lightning global",
        "La cantidad de Bitcoin bloqueados al abrir el canal",
        "El número de transacciones procesadas anteriormente por el canal"
      ],
      en: [
        "The internet connection speed of the sending node",
        "The number of nodes connected to the global Lightning network",
        "The amount of Bitcoin locked when the channel was opened",
        "The number of transactions previously processed by the channel"
      ]
    },
    correct: 2,
    explanation: {
      es: "La capacidad total del canal es fija desde su apertura: es el Bitcoin bloqueado en la transacción on-chain. Dentro de ese total, el saldo se redistribuye entre local y remoto con cada pago, pero nunca puede superarse el total.",
      en: "The channel's total capacity is fixed at opening: it's the Bitcoin locked in the on-chain transaction. Within that total, balance shifts between local and remote with each payment, but the total can never be exceeded."
    }
  },
  {
    text: {
      es: "¿Qué es un watchtower en Lightning Network?",
      en: "What is a watchtower in Lightning Network?"
    },
    options: {
      es: [
        "Un nodo que vigila canales y actúa si detecta una transacción de fraude",
        "Un servicio de análisis que mide la actividad global de la red Lightning",
        "Un tipo de canal con mayor capacidad y menor tarifa de enrutamiento",
        "Un protocolo que garantiza la apertura automática de canales nuevos"
      ],
      en: [
        "A node that watches channels and acts if it detects a fraud transaction",
        "An analytics service that measures global Lightning network activity",
        "A channel type with higher capacity and lower routing fees",
        "A protocol that guarantees automatic opening of new channels"
      ]
    },
    correct: 0,
    explanation: {
      es: "Si tu nodo está offline, un contraparte deshonesta podría publicar un estado antiguo del canal para robar fondos. Un watchtower monitorea la blockchain en tu nombre y publica automáticamente la transacción de penalización si detecta fraude.",
      en: "If your node is offline, a dishonest counterparty could publish an old channel state to steal funds. A watchtower monitors the blockchain on your behalf and automatically publishes the penalty transaction if fraud is detected."
    }
  },
  {
    text: {
      es: "¿Qué ocurre en un cierre cooperativo de canal Lightning?",
      en: "What happens in a cooperative Lightning channel close?"
    },
    options: {
      es: [
        "Los fondos quedan bloqueados durante un período de resolución de disputas",
        "Ambas partes acuerdan y los fondos regresan a la blockchain sin demoras",
        "Solo el nodo que cierra primero recupera sus fondos de inmediato",
        "La transacción de cierre requiere aprobación de mineros especializados"
      ],
      en: [
        "Funds remain locked during a dispute resolution period",
        "Both parties agree and funds return to the blockchain without delays",
        "Only the node that closes first recovers its funds immediately",
        "The closing transaction requires approval from specialized miners"
      ]
    },
    correct: 1,
    explanation: {
      es: "En un cierre cooperativo, ambos nodos firman juntos la transacción de cierre final con los saldos actualizados. Los fondos llegan a la blockchain sin períodos de espera adicionales. Es la forma preferida de cerrar un canal.",
      en: "In a cooperative close, both nodes jointly sign a final closing transaction with updated balances. Funds land on the blockchain with no additional waiting periods. This is the preferred way to close a channel."
    }
  },
  {
    text: {
      es: "¿Qué es un swap submarino (submarine swap)?",
      en: "What is a submarine swap?"
    },
    options: {
      es: [
        "Un intercambio entre Bitcoin on-chain y Bitcoin en Lightning",
        "Una transferencia de fondos entre dos blockchains completamente distintas",
        "Una forma de minar Bitcoin usando nodos Lightning como validadores",
        "Un tipo de canal privado sin ningún anuncio público en la red"
      ],
      en: [
        "An exchange between on-chain Bitcoin and Lightning Bitcoin",
        "A transfer of funds between two completely different blockchains",
        "A way to mine Bitcoin using Lightning nodes as validators",
        "A type of private channel with no public announcement on the network"
      ]
    },
    correct: 0,
    explanation: {
      es: "Un swap submarino usa HTLCs para intercambiar Bitcoin on-chain por Bitcoin en Lightning (o viceversa) sin necesidad de confiar en un tercero. Son útiles para rebalancear canales o mover fondos entre la capa base y Lightning.",
      en: "A submarine swap uses HTLCs to exchange on-chain Bitcoin for Lightning Bitcoin (or vice versa) without trusting a third party. They are useful for rebalancing channels or moving funds between the base layer and Lightning."
    }
  },
  {
    text: {
      es: "¿Qué son las tarifas de enrutamiento en Lightning?",
      en: "What are routing fees in Lightning?"
    },
    options: {
      es: [
        "Los costos que cobran los mineros por confirmar transacciones de Lightning",
        "Las comisiones que cobra un nodo intermediario por reenviar pagos",
        "Los impuestos gubernamentales aplicados a los pagos en Lightning",
        "Los cargos del exchange al convertir sats de Lightning a Bitcoin on-chain"
      ],
      en: [
        "The fees miners charge for confirming Lightning transactions",
        "The fees an intermediate node charges for forwarding payments",
        "Government taxes applied to Lightning payments",
        "Exchange fees for converting Lightning sats to on-chain Bitcoin"
      ]
    },
    correct: 1,
    explanation: {
      es: "Cada nodo que enruta un pago puede cobrar una pequeña tarifa: generalmente una base fija más un porcentaje del monto (ppm, partes por millón). Las tarifas suelen ser fracciones de satoshi, haciendo los micropagos viables.",
      en: "Each node that routes a payment can charge a small fee: typically a fixed base fee plus a percentage of the amount (ppm, parts per million). Fees are often fractions of a satoshi, making micropayments viable."
    }
  },
  {
    text: {
      es: "¿Qué significa que un canal Lightning sea privado (no anunciado)?",
      en: "What does it mean for a Lightning channel to be private (unannounced)?"
    },
    options: {
      es: [
        "Solo permite recibir pagos propios, sin poder enviar ni enrutar",
        "Sus datos no se publican en el grafo de la red Lightning",
        "Tiene un límite de capacidad menor que los canales anunciados",
        "Requiere autenticación adicional para cada pago que enruta"
      ],
      en: [
        "It only allows receiving your own payments, not sending or routing",
        "Its data is not published in the Lightning network graph",
        "It has a lower capacity limit than announced channels",
        "It requires additional authentication for each payment it routes"
      ]
    },
    correct: 1,
    explanation: {
      es: "Un canal privado no se anuncia al resto de la red, por lo que no aparece en el grafo de canales que usan otros nodos para encontrar rutas. Solo los dos nodos del canal lo conocen. Es útil para usuarios finales que solo quieren enviar/recibir.",
      en: "A private channel is not announced to the rest of the network, so it doesn't appear in the channel graph other nodes use to find routes. Only its two nodes know about it. It's useful for end users who just want to send and receive."
    }
  },
  {
    text: {
      es: "¿Cuántos participantes conecta directamente un canal Lightning básico?",
      en: "How many participants does a basic Lightning channel directly connect?"
    },
    options: {
      es: [
        "Uno solo, para pagos circulares dentro del mismo nodo",
        "Exactamente dos nodos, uno en cada extremo del canal",
        "Tres o más, según el tipo de canal y la implementación del nodo",
        "Ilimitados, dependiendo de la versión del protocolo Lightning"
      ],
      en: [
        "Just one, for circular payments within the same node",
        "Exactly two nodes, one at each end of the channel",
        "Three or more, depending on channel type and node implementation",
        "Unlimited, depending on the Lightning protocol version"
      ]
    },
    correct: 1,
    explanation: {
      es: "Un canal Lightning básico es siempre entre exactamente dos nodos. Para pagar a nodos sin canal directo se usa enrutamiento a través de nodos intermedios. Los canales multiparte (como en fábricas de canales) son investigación aún experimental.",
      en: "A basic Lightning channel is always between exactly two nodes. Paying nodes without a direct channel requires routing through intermediate nodes. Multi-party channels (like channel factories) are still experimental research."
    }
  },
  {
    text: {
      es: "¿Qué es el grafo de canales en Lightning Network?",
      en: "What is the channel graph in Lightning Network?"
    },
    options: {
      es: [
        "Un mapa visual de las transacciones confirmadas en la blockchain",
        "La estructura de datos que describe todos los canales públicos de la red",
        "El registro histórico de todos los pagos que pasaron por un nodo",
        "El conjunto de nodos que un LSP mantiene como respaldo de liquidez"
      ],
      en: [
        "A visual map of confirmed transactions on the blockchain",
        "The data structure describing all public channels in the network",
        "The historical record of all payments routed through a node",
        "The set of nodes an LSP maintains as liquidity backup"
      ]
    },
    correct: 1,
    explanation: {
      es: "El grafo de canales es la 'hoja de ruta' de Lightning: cada nodo anuncia sus canales públicos al resto de la red usando el protocolo gossip. Con este mapa, los nodos calculan rutas de pago usando algoritmos como Dijkstra o pathfinding personalizado.",
      en: "The channel graph is Lightning's 'road map': each node announces its public channels to the rest of the network using the gossip protocol. With this map, nodes compute payment routes using algorithms like Dijkstra or custom pathfinding."
    }
  }
];

module.exports = questions;
