// Categoría: Blockchain — estructura, bloques y consenso

const questions = [
  {
    text: {
      es: "¿Qué es el hash de un bloque de Bitcoin?",
      en: "What is a Bitcoin block hash?"
    },
    options: {
      es: [
        "La firma digital del minero que procesó ese bloque",
        "Un identificador único del bloque generado por su contenido",
        "El número exacto de transacciones incluidas en el bloque",
        "La fecha y hora exacta en que el bloque fue minado"
      ],
      en: [
        "The digital signature of the miner who processed the block",
        "A unique identifier for the block generated from its contents",
        "The exact number of transactions included in the block",
        "The exact date and time the block was mined"
      ]
    },
    correct: 1,
    explanation: {
      es: "Cada bloque tiene un hash único calculado a partir de todos sus datos. Si cualquier dato cambia, el hash cambia completamente, lo que garantiza la integridad del bloque.",
      en: "Every block has a unique hash computed from all its data. If any data changes, the hash changes completely, guaranteeing the block's integrity."
    }
  },
  {
    text: {
      es: "¿Qué vincula cada bloque con el anterior en la blockchain?",
      en: "What links each block to the previous one in the blockchain?"
    },
    options: {
      es: [
        "El nombre del minero que encontró y publicó el bloque",
        "Una firma digital emitida por un servidor central",
        "El hash del bloque anterior incluido en su cabecera",
        "La fecha y hora exacta de creación del bloque"
      ],
      en: [
        "The name of the miner who found and published the block",
        "A digital signature issued by a central server",
        "The previous block's hash included in the header",
        "The exact date and time the block was created"
      ]
    },
    correct: 2,
    explanation: {
      es: "Cada bloque incluye el hash del bloque anterior en su cabecera. Esto crea una cadena criptográfica: si modificas un bloque, su hash cambia y rompe el enlace con todos los bloques siguientes.",
      en: "Each block includes the previous block's hash in its header. This creates a cryptographic chain: if you modify a block, its hash changes and breaks the link with every subsequent block."
    }
  },
  {
    text: {
      es: "¿Qué es el Árbol de Merkle en un bloque de Bitcoin?",
      en: "What is the Merkle Tree in a Bitcoin block?"
    },
    options: {
      es: [
        "Una lista cronológica de todos los nodos conectados a la red",
        "Una estructura que condensa todas las transacciones en un solo hash",
        "El árbol de decisiones que usan los mineros al seleccionar transacciones",
        "Un registro histórico comprimido de todos los bloques anteriores"
      ],
      en: [
        "A chronological list of all nodes connected to the network",
        "A structure that condenses all transactions into a single hash",
        "The decision tree miners use when selecting transactions",
        "A compressed historical record of all previous blocks"
      ]
    },
    correct: 1,
    explanation: {
      es: "El Árbol de Merkle combina los hashes de todas las transacciones del bloque en un único hash raíz (Merkle root). Permite verificar eficientemente si una transacción está en un bloque sin descargarlo completo.",
      en: "The Merkle Tree combines the hashes of all transactions in a block into a single root hash (Merkle root). It allows efficient verification of whether a transaction is in a block without downloading the whole block."
    }
  },
  {
    text: {
      es: "¿Qué es un UTXO (Unspent Transaction Output)?",
      en: "What is a UTXO (Unspent Transaction Output)?"
    },
    options: {
      es: [
        "Un bloque especial que agrupa y cierra un ciclo de transacciones",
        "Una recompensa pendiente de recibir por los mineros de la red",
        "Una salida no gastada que actúa como entrada en futuras transacciones",
        "Un error de validación detectado y rechazado por los nodos"
      ],
      en: [
        "A special block that groups and closes a transaction cycle",
        "A pending reward that network miners are yet to receive",
        "An unspent output that serves as input in future transactions",
        "A validation error detected and rejected by nodes"
      ]
    },
    correct: 2,
    explanation: {
      es: "Bitcoin no tiene 'saldos' como un banco. En cambio, rastrea UTXOs: salidas de transacciones anteriores aún no gastadas. Cuando envías Bitcoin, consumes UTXOs como entradas y creas nuevos como salidas.",
      en: "Bitcoin has no 'balances' like a bank. Instead, it tracks UTXOs: outputs from previous transactions that haven't been spent yet. When you send Bitcoin, you consume UTXOs as inputs and create new ones as outputs."
    }
  },
  {
    text: {
      es: "¿Qué es un soft fork en Bitcoin?",
      en: "What is a soft fork in Bitcoin?"
    },
    options: {
      es: [
        "Un cambio de reglas compatible con versiones anteriores del protocolo",
        "Una actualización que divide la blockchain en dos cadenas permanentes",
        "Un error de software que provoca una bifurcación temporal de la red",
        "Un acuerdo entre mineros para cambiar el algoritmo de minería"
      ],
      en: [
        "A rule change that is backward-compatible with older nodes",
        "An upgrade that splits the blockchain into two permanent chains",
        "A software bug that causes a temporary network split",
        "A miner agreement to change the mining algorithm"
      ]
    },
    correct: 0,
    explanation: {
      es: "Un soft fork endurece las reglas del protocolo de forma que los nodos antiguos aún aceptan los nuevos bloques como válidos. SegWit y Taproot se implementaron como soft forks en Bitcoin.",
      en: "A soft fork tightens the protocol rules so that old nodes still accept new blocks as valid. SegWit and Taproot were both implemented as soft forks in Bitcoin."
    }
  },
  {
    text: {
      es: "¿Qué es un hard fork en Bitcoin?",
      en: "What is a hard fork in Bitcoin?"
    },
    options: {
      es: [
        "Una simple actualización de software sin cambios en las reglas",
        "Un cambio incompatible de reglas que puede generar una nueva cadena",
        "Una mejora en la velocidad de validación de los nodos completos",
        "Un acuerdo informal entre desarrolladores para corregir un error"
      ],
      en: [
        "A simple software update with no rule changes",
        "An incompatible rule change that can create a new chain",
        "A speed improvement in how full nodes validate blocks",
        "An informal developer agreement to fix a bug"
      ]
    },
    correct: 1,
    explanation: {
      es: "Un hard fork relaja o cambia las reglas de forma incompatible: los nodos que no actualizan rechazan los nuevos bloques. Si parte de la red no actualiza, pueden coexistir dos cadenas separadas (como ocurrió con Bitcoin Cash).",
      en: "A hard fork loosens or changes the rules in an incompatible way: nodes that don't upgrade reject new blocks. If part of the network doesn't update, two separate chains can coexist (as happened with Bitcoin Cash)."
    }
  },
  {
    text: {
      es: "¿Cada cuánto tiempo se mina un nuevo bloque de Bitcoin en promedio?",
      en: "How often is a new Bitcoin block mined on average?"
    },
    options: {
      es: [
        "Cada 10 minutos",
        "Cada 1 hora",
        "Cada 2.5 minutos",
        "Cada 10 segundos"
      ],
      en: [
        "Every 10 minutes",
        "Every 1 hour",
        "Every 2.5 minutes",
        "Every 10 seconds"
      ]
    },
    correct: 0,
    explanation: {
      es: "El protocolo de Bitcoin apunta a un bloque cada 10 minutos. La dificultad de minería se ajusta automáticamente cada 2,016 bloques para mantener ese ritmo independientemente de cuántos mineros haya.",
      en: "The Bitcoin protocol targets one block every 10 minutes. Mining difficulty adjusts automatically every 2,016 blocks to maintain that rate regardless of how many miners are active."
    }
  },
  {
    text: {
      es: "¿Cada cuántos bloques se ajusta la dificultad de minería en Bitcoin?",
      en: "How often does Bitcoin's mining difficulty adjust?"
    },
    options: {
      es: [
        "Cada 100 bloques (~1 día)",
        "Cada 2,016 bloques (~2 semanas)",
        "Cada 210,000 bloques (~4 años)",
        "Cada 1,000 bloques (~1 semana)"
      ],
      en: [
        "Every 100 blocks (~1 day)",
        "Every 2,016 blocks (~2 weeks)",
        "Every 210,000 blocks (~4 years)",
        "Every 1,000 blocks (~1 week)"
      ]
    },
    correct: 1,
    explanation: {
      es: "Cada 2,016 bloques (~2 semanas), todos los nodos recalculan la dificultad comparando el tiempo real con el objetivo de 10 minutos por bloque. Si los bloques llegaron más rápido, la dificultad sube; si más lento, baja.",
      en: "Every 2,016 blocks (~2 weeks), all nodes recalculate the difficulty by comparing actual elapsed time against the 10-minute-per-block target. If blocks came faster, difficulty rises; if slower, it falls."
    }
  },
  {
    text: {
      es: "¿Qué es el mempool (memory pool)?",
      en: "What is the mempool (memory pool)?"
    },
    options: {
      es: [
        "El espacio de almacenamiento que usa un nodo para guardar la blockchain",
        "La memoria RAM que utiliza el software de minería ASIC",
        "El área de espera donde viven las transacciones no confirmadas",
        "El conjunto de nodos que forman el núcleo de la red Bitcoin"
      ],
      en: [
        "The storage space a node uses to save the blockchain",
        "The RAM used by ASIC mining software",
        "The waiting area where unconfirmed transactions live",
        "The set of nodes that form the core of the Bitcoin network"
      ]
    },
    correct: 2,
    explanation: {
      es: "El mempool es la sala de espera de transacciones: cuando envías Bitcoin, tu transacción entra al mempool de los nodos hasta que un minero la incluye en un bloque. Con alta demanda, el mempool se llena y las comisiones suben.",
      en: "The mempool is the transaction waiting room: when you send Bitcoin, your transaction enters nodes' mempools until a miner includes it in a block. When demand is high, the mempool fills up and fees rise."
    }
  },
  {
    text: {
      es: "¿Qué garantiza que la blockchain sea inmutable?",
      en: "What makes the blockchain immutable?"
    },
    options: {
      es: [
        "Una normativa internacional que prohíbe modificar los registros históricos",
        "El cifrado de los bloques con la clave privada del creador del protocolo",
        "El encadenamiento de hashes que invalida toda la cadena al alterar un bloque",
        "Las copias de seguridad automáticas en miles de servidores descentralizados"
      ],
      en: [
        "An international regulation prohibiting modification of historical records",
        "Encryption of blocks with the protocol creator's private key",
        "The hash chaining that invalidates the entire chain if a block is altered",
        "Automatic backups on thousands of decentralized servers"
      ]
    },
    correct: 2,
    explanation: {
      es: "Alterar un bloque cambia su hash, lo que rompe el enlace con el siguiente bloque, y así sucesivamente. Para reescribir la historia, un atacante necesitaría rehacer la Prueba de Trabajo de todos los bloques posteriores más rápido que el resto de la red.",
      en: "Altering a block changes its hash, breaking the link to the next block, and so on. To rewrite history, an attacker would need to redo the Proof of Work for every subsequent block faster than the rest of the network."
    }
  },
  {
    text: {
      es: "¿Qué contiene la cabecera (header) de un bloque de Bitcoin?",
      en: "What does a Bitcoin block header contain?"
    },
    options: {
      es: [
        "El hash del bloque anterior, la raíz de Merkle y el nonce",
        "Los nombres de todos los mineros que participaron en el bloque",
        "Las claves privadas de las transacciones incluidas en el bloque",
        "El saldo actualizado de cada dirección afectada por el bloque"
      ],
      en: [
        "The previous block hash, the Merkle root, and the nonce",
        "The names of all miners who participated in the block",
        "The private keys of transactions included in the block",
        "The updated balance of every address affected by the block"
      ]
    },
    correct: 0,
    explanation: {
      es: "La cabecera del bloque contiene: el hash del bloque anterior, la raíz de Merkle de las transacciones, el timestamp, la dificultad objetivo, y el nonce. Es sobre estos 80 bytes que los mineros calculan su hash repetidamente.",
      en: "The block header contains: the previous block hash, the Merkle root of transactions, the timestamp, the difficulty target, and the nonce. It is these 80 bytes that miners hash repeatedly in their search for a valid block."
    }
  }
];

module.exports = questions;
