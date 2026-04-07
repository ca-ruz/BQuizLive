// Categoría: Minería — hardware, dificultad, pools y recompensas

const questions = [
  {
    text: {
      es: "¿Qué mide el hash rate de un minero?",
      en: "What does a miner's hash rate measure?"
    },
    options: {
      es: [
        "Su velocidad para calcular hashes por segundo",
        "La temperatura máxima de operación del equipo de minería",
        "El consumo total de electricidad en vatios del hardware",
        "El número acumulado de bloques encontrados a lo largo del tiempo"
      ],
      en: [
        "Its speed at computing hashes per second",
        "The maximum operating temperature of the mining hardware",
        "The total electricity consumption in watts of the hardware",
        "The total number of blocks found over time"
      ]
    },
    correct: 0,
    explanation: {
      es: "El hash rate mide cuántos hashes por segundo puede calcular un minero. Más hash rate significa más intentos por segundo de encontrar el hash válido que permite minar el siguiente bloque.",
      en: "Hash rate measures how many hashes per second a miner can compute. Higher hash rate means more attempts per second at finding the valid hash needed to mine the next block."
    }
  },
  {
    text: {
      es: "¿Qué es un ASIC en el contexto de la minería de Bitcoin?",
      en: "What is an ASIC in the context of Bitcoin mining?"
    },
    options: {
      es: [
        "Un protocolo de comunicación entre nodos mineros de la red",
        "Un hardware especializado diseñado exclusivamente para minar Bitcoin",
        "Un algoritmo de consenso alternativo a la Prueba de Trabajo",
        "Un pool de minería de gran escala operado en Europa"
      ],
      en: [
        "A communication protocol between mining nodes on the network",
        "Specialized hardware designed exclusively to mine Bitcoin",
        "An alternative consensus algorithm to Proof of Work",
        "A large-scale mining pool operated in Europe"
      ]
    },
    correct: 1,
    explanation: {
      es: "ASIC significa Application-Specific Integrated Circuit. A diferencia de las GPUs o CPUs, un ASIC minero está diseñado para hacer una sola cosa: calcular SHA-256 lo más rápido posible. Son órdenes de magnitud más eficientes que el hardware genérico.",
      en: "ASIC stands for Application-Specific Integrated Circuit. Unlike GPUs or CPUs, a mining ASIC is designed to do one thing: compute SHA-256 as fast as possible. They are orders of magnitude more efficient than general-purpose hardware."
    }
  },
  {
    text: {
      es: "¿Qué función hash utiliza Bitcoin en su Prueba de Trabajo?",
      en: "Which hash function does Bitcoin use in its Proof of Work?"
    },
    options: {
      es: [
        "MD5",
        "Keccak-256",
        "SHA-256",
        "RIPEMD-160"
      ],
      en: [
        "MD5",
        "Keccak-256",
        "SHA-256",
        "RIPEMD-160"
      ]
    },
    correct: 2,
    explanation: {
      es: "Bitcoin usa doble SHA-256 (SHA-256 aplicado dos veces) en su Prueba de Trabajo. Los mineros buscan un hash cuyo resultado sea menor que el objetivo de dificultad actual.",
      en: "Bitcoin uses double SHA-256 (SHA-256 applied twice) in its Proof of Work. Miners search for a hash whose output is lower than the current difficulty target."
    }
  },
  {
    text: {
      es: "¿Cuánto vale la recompensa de bloque actual de Bitcoin (desde el halving de abril 2024)?",
      en: "What is the current Bitcoin block reward (since the April 2024 halving)?"
    },
    options: {
      es: [
        "6.25 BTC por bloque",
        "12.5 BTC por bloque",
        "3.125 BTC por bloque",
        "1.5625 BTC por bloque"
      ],
      en: [
        "6.25 BTC per block",
        "12.5 BTC per block",
        "3.125 BTC per block",
        "1.5625 BTC per block"
      ]
    },
    correct: 2,
    explanation: {
      es: "El cuarto halving ocurrió en abril de 2024, reduciendo la recompensa de 6.25 BTC a 3.125 BTC por bloque. Cada halving reduce a la mitad el ritmo de emisión de nuevo Bitcoin.",
      en: "The fourth halving occurred in April 2024, reducing the reward from 6.25 BTC to 3.125 BTC per block. Each halving cuts the rate of new Bitcoin issuance in half."
    }
  },
  {
    text: {
      es: "¿Qué es un bloque huérfano (stale block)?",
      en: "What is a stale (orphan) block?"
    },
    options: {
      es: [
        "Un bloque con transacciones inválidas rechazado por la red completa",
        "Un bloque válido que queda fuera al superarlo otra cadena más larga",
        "Un bloque vacío sin ninguna transacción, minado involuntariamente",
        "Un bloque especial que señala el inicio de un período de halving"
      ],
      en: [
        "A block with invalid transactions rejected by the whole network",
        "A valid block left behind when a longer chain overtakes it",
        "An empty block with no transactions, mined unintentionally",
        "A special block that signals the start of a halving period"
      ]
    },
    correct: 1,
    explanation: {
      es: "Cuando dos mineros encuentran un bloque válido casi simultáneamente, la red temporalmente tiene dos cadenas. La más corta queda huérfana: el minero que la encontró pierde la recompensa. Por eso los pools usan latencia mínima.",
      en: "When two miners find a valid block nearly simultaneously, the network temporarily has two chains. The shorter one becomes orphaned: the miner who found it loses the reward. That's why pools minimize latency."
    }
  },
  {
    text: {
      es: "¿Qué es un pool de minería?",
      en: "What is a mining pool?"
    },
    options: {
      es: [
        "Un grupo de mineros que comparten poder de cómputo y recompensas",
        "Una plataforma de comercio para comprar y vender equipos de minería",
        "El software que usan los nodos completos para validar bloques nuevos",
        "Un fondo de inversión especializado en empresas de minería de criptomonedas"
      ],
      en: [
        "A group of miners that shares computing power and rewards",
        "A marketplace for buying and selling mining hardware",
        "The software full nodes use to validate new blocks",
        "An investment fund focused on cryptocurrency mining companies"
      ]
    },
    correct: 0,
    explanation: {
      es: "En un pool de minería, muchos mineros combinan su hash rate. Aunque cada uno tiene poca probabilidad de encontrar un bloque solo, al cooperar reciben pagos pequeños y frecuentes proporcionales a su contribución.",
      en: "In a mining pool, many miners combine their hash rate. Though each has a low chance of finding a block alone, by cooperating they receive small, frequent payouts proportional to their contribution."
    }
  },
  {
    text: {
      es: "¿Qué consume principalmente la minería de Bitcoin?",
      en: "What does Bitcoin mining primarily consume?"
    },
    options: {
      es: [
        "Grandes cantidades de ancho de banda de internet",
        "Enormes volúmenes de agua para enfriar los equipos",
        "Mucho almacenamiento en disco para guardar la blockchain",
        "Grandes cantidades de electricidad para alimentar los ASIC"
      ],
      en: [
        "Large amounts of internet bandwidth",
        "Enormous volumes of water to cool the hardware",
        "A large amount of disk space to store the blockchain",
        "Large amounts of electricity to power the ASICs"
      ]
    },
    correct: 3,
    explanation: {
      es: "Los ASIC de minería requieren cantidades significativas de electricidad. Este costo energético es intencional: es lo que hace que atacar la red sea económicamente inviable. La Prueba de Trabajo ancla la seguridad de Bitcoin a energía real.",
      en: "Mining ASICs require significant amounts of electricity. This energy cost is intentional: it's what makes attacking the network economically infeasible. Proof of Work anchors Bitcoin's security to real-world energy."
    }
  },
  {
    text: {
      es: "¿Qué es el nonce en un bloque de Bitcoin?",
      en: "What is the nonce in a Bitcoin block?"
    },
    options: {
      es: [
        "La dirección pública del minero que encontró y publicó el bloque",
        "El número exacto de transacciones incluidas dentro del bloque",
        "Un número que el minero varía hasta encontrar un hash válido",
        "El identificador único de la versión del software de minería usada"
      ],
      en: [
        "The public address of the miner who found and published the block",
        "The exact number of transactions included inside the block",
        "A number miners change until they find a valid hash",
        "The unique identifier of the mining software version used"
      ]
    },
    correct: 2,
    explanation: {
      es: "El nonce (Number used Once) es un campo de 32 bits en la cabecera del bloque. Los mineros lo incrementan millones de veces por segundo buscando un hash que cumpla el objetivo de dificultad. Si se agota, cambian otros campos como el timestamp.",
      en: "The nonce (Number used Once) is a 32-bit field in the block header. Miners increment it millions of times per second searching for a hash that meets the difficulty target. If exhausted, they change other fields like the timestamp."
    }
  },
  {
    text: {
      es: "¿Qué ocurre cuando dos mineros encuentran un bloque válido al mismo tiempo?",
      en: "What happens when two miners find a valid block at the same time?"
    },
    options: {
      es: [
        "La red se detiene completamente hasta que los desarrolladores decidan cuál es válido",
        "Se crea una bifurcación temporal y la red elige la cadena más larga",
        "Ambos bloques se fusionan automáticamente y las recompensas se dividen por igual",
        "El bloque con el mayor número de transacciones incluidas gana automáticamente"
      ],
      en: [
        "The network halts completely until developers decide which block is valid",
        "A temporary fork is created and the network follows the longest chain",
        "Both blocks are merged automatically and rewards are split equally",
        "The block with the most transactions included wins automatically"
      ]
    },
    correct: 1,
    explanation: {
      es: "Se produce una bifurcación temporal. Los nodos siguen trabajando sobre el bloque que recibieron primero. Cuando uno de los dos bloques consigue el siguiente bloque encima, la otra cadena queda huérfana y todos los nodos convergen.",
      en: "A temporary fork occurs. Nodes keep building on whichever block they received first. When one of the two blocks gets the next block on top of it, the other chain becomes orphaned and all nodes converge."
    }
  },
  {
    text: {
      es: "¿Qué es el subsidio de bloque (block subsidy)?",
      en: "What is the block subsidy?"
    },
    options: {
      es: [
        "Las comisiones que los usuarios pagan por incluir sus transacciones",
        "Bitcoin nuevo creado y entregado al minero por encontrar un bloque",
        "El porcentaje que cobra el pool de minería sobre la recompensa total",
        "El bono extra que recibe el primer nodo en validar el nuevo bloque"
      ],
      en: [
        "The fees users pay to have their transactions included",
        "Newly created Bitcoin awarded to the miner who finds a block",
        "The percentage a mining pool charges from the total reward",
        "The extra bonus the first node to validate the new block receives"
      ]
    },
    correct: 1,
    explanation: {
      es: "El subsidio de bloque es Bitcoin creado de la nada y entregado al minero ganador. Es la única forma en que existen nuevos Bitcoin. Se reduce a la mitad en cada halving y desaparecerá alrededor del año 2140.",
      en: "The block subsidy is Bitcoin created out of thin air and given to the winning miner. It is the only way new Bitcoin comes into existence. It halves with each halving event and will disappear around the year 2140."
    }
  },
  {
    text: {
      es: "¿Qué es el coinbase en el contexto de la minería (no el exchange)?",
      en: "What is the coinbase in the context of mining (not the exchange)?"
    },
    options: {
      es: [
        "La plataforma más popular para comprar Bitcoin en Estados Unidos",
        "La primera transacción de cada bloque que crea el Bitcoin nuevo",
        "El hash de referencia que conecta un bloque con el anterior",
        "El campo de datos libre que el minero puede incluir en el bloque"
      ],
      en: [
        "The most popular platform for buying Bitcoin in the United States",
        "The first transaction of every block that creates new Bitcoin",
        "The reference hash connecting a block to the previous one",
        "The free data field that the miner can include in the block"
      ]
    },
    correct: 1,
    explanation: {
      es: "La transacción coinbase es especial: no tiene entradas reales (crea Bitcoin de la nada) y entrega al minero el subsidio de bloque más las comisiones de todas las transacciones del bloque. También puede incluir datos arbitrarios en su campo de entrada.",
      en: "The coinbase transaction is special: it has no real inputs (it creates Bitcoin from nothing) and delivers to the miner the block subsidy plus all transaction fees in the block. It can also include arbitrary data in its input field."
    }
  }
];

module.exports = questions;
