# BMO Stand — soporte físico para la cabeza de BMO

Carcasa impresa en 3D para alojar la pantalla, la Raspberry Pi 5 y los
módulos de cámara/voz en un stand de sobremesa. Dos variantes con la
misma funcionalidad, distinta estética.

## BOM (componentes ya enlazados)

Actualizado 2026-08-20: la pantalla y la cámara originales se sustituyeron
por hardware real distinto (la GeeekPi murió/se cambió, la cámara OV5647
original se declaró muerta tras diagnóstico exhaustivo). Esta es la lista
de piezas que hay puestas ahora mismo.

| Pieza | Rol | Producto | Precio |
|---|---|---|---|
| Cerebro | Raspberry Pi 5 8GB | [amazon.es/dp/B0CK2FCG1K](https://www.amazon.es/dp/B0CK2FCG1K) | ~213€ |
| Cara | OSOYOO PiStudio — funda con pantalla táctil IPS DSI V4.0 de 7" (ventilador incluido) | [amazon.es/dp/B0D7YV7TD5](https://www.amazon.es/dp/B0D7YV7TD5) | — |
| Ojo/visión | Freenove Cámara 5MP para Raspberry Pi 5 | [amazon.es/dp/B08Q34FKFY](https://www.amazon.es/dp/B08Q34FKFY) | ~13€ |
| Voz/oídos | Yahboom AI Voice Interaction Module (USB-C) | [amazon.es/dp/B0F32NHQ6B](https://www.amazon.es/dp/B0F32NHQ6B) | 18,99€ |

**Refrigeración**: ya no es una pieza aparte — el ventilador viene
incluido en el kit de la pantalla (OSOYOO PiStudio), sustituye al Active
Cooler oficial del BOM anterior.

**Conexión**: la pantalla es DSI directa (cable plano, no HDMI), así que
el cable Micro-HDMI→HDMI del BOM anterior ya no aplica y se ha quitado.

Pendiente: fuente de alimentación (la pantalla y la Pi5 la necesitan;
no estaba en los enlaces enviados), y cable USB-C para el módulo de voz.

⚠️ **Pendiente de decidir**: el kit OSOYOO PiStudio ya es una "funda"
(trae su propia carcasa para pantalla+Pi). Las medidas de `common.scad`
de abajo (`screen_w/h/thick`, viewport) siguen siendo las de la GeeekPi
vieja — **no valen para este producto** y el diseño no debería imprimirse
tal cual hasta aclarar: (a) si este stand impreso sustituye a la funda
OSOYOO o va a montarse junto/alrededor de ella, y (b) las medidas reales
de la OSOYOO (ficha de producto no encontrada con datos suficientes;
hace falta medir la pieza física o encontrar su ficha técnica).

## Estructura de archivos

- **`common.scad`**: todos los parámetros/medidas y las 3 piezas
  (`front_bezel`, `rear_shell`, `stand_foot`) como módulos
  reutilizables. **Aquí es donde se actualizan las medidas** cuando
  midas las piezas reales — se aplica a las dos variantes a la vez,
  no hay que tocar dos archivos.
- **`standard_stand.scad`**: variante funcional, esquinas poco
  redondeadas, sin marco decorativo.
- **`bmo_stand.scad`**: variante con estética BMO — esquinas muy
  redondeadas y un marco hundido alrededor de la pantalla, como el
  contorno de cara del personaje.

Ambas variantes abren y previsualizan igual: abre el `.scad` en
[OpenSCAD](https://openscad.org/) (gratis) y pulsa F5.

## Diseño

Pantalla montada **en vertical** (portrait), igual que la pantalla
real de BMO OS: el panel se fabrica apaisado (1024×600) y se rota 90°
para mostrar 600×1024 — el hueco de la carcasa ya está pensado con
las cotas rotadas, no hay que girar nada a mano.

La pantalla va **"a ras"** (edge-to-edge, sin marco grueso visible):
el hueco del bisel es del tamaño del área visible, no de la placa
completa, así que la placa del módulo queda oculta detrás del bisel
y desde fuera solo se ve el cristal — el marco que sí se ve es
mínimo (pared estructural + el borde propio del módulo, oculto
detrás). Retenida con 4 pestañas de presión en las esquinas, no
pegada — hasta tener agujeros de tornillo reales, un punto de cinta
doble cara removible entre placa y pestaña es suficiente para un
prototipo.

- **front_bezel**: recorta el viewport de la pantalla (vertical, a
  ras) con sus pestañas de retención, el ojo de la cámara arriba
  centrado, y una **ventana completa para el módulo de voz** abajo
  centrada — el módulo entra entero a ras de la cara exterior (con
  un pequeño reborde interior que lo retiene) para que su micrófono
  y su altavoz propios no queden amortiguados detrás de plástico.
- **rear_shell**: aloja la Pi5 (patrón de taladros oficial) con el
  active cooler detrás. Rejilla de ventilación del cooler alineada
  con la Pi5, una banda de rejillas laterales para los altavoces que
  la propia pantalla lleva integrados en su cara trasera, y **salida
  de cables por el canto superior** (HDMI de la pantalla +
  alimentación + USB-C) — confirmado que los conectores de la
  pantalla, ya montada, quedan hacia arriba. Comparte la misma franja
  superior que el ojo de la cámara, pero en el canto de arriba, no en
  la cara frontal, así que no chocan entre sí (por eso `top_margin`
  se ha ampliado un poco, de 24 a 32mm, para que quepan los dos).

  **Puertos propios de la Pi5, accesibles por los laterales**: la
  Raspberry Pi 5 tiene sus conectores en dos bordes adyacentes —
  USB×4 + Ethernet en un borde largo, USB-C de alimentación + 2x
  micro-HDMI en el borde corto de al lado. La Pi5 se ha movido de
  centrada a la esquina inferior-derecha del hueco de electrónica,
  para que cada borde quede pegado a una pared real: **ventana ancha
  en el lateral derecho** (USB+Ethernet) y **ventana en el canto
  inferior** (USB-C+HDMI). El disipador y su rejilla se mueven con
  ella (`pi5_cx`/`pi5_cy` en `common.scad`).

  ⚠️ El patrón de taladros de la Pi5 es simétrico pero los puertos
  no — sin la placa física en la mano no puedo saber con certeza en
  qué esquina exacta cae cada conector. Si al montarla ves que no
  coincide, es cuestión de invertir el signo de `pi5_cx`/`pi5_cy` en
  `common.scad` (todo lo demás se recalcula solo).
- **stand_foot**: pie independiente a presión, inclina el conjunto
  ~20° — igual en las dos variantes, es una pieza puramente funcional.

Se usan **los dos sistemas de audio**: los altavoces propios de la
pantalla (rejilla trasera) y el micrófono/altavoz del Yahboom
(ventana frontal) — no hay conflicto entre ambos, están en caras
distintas de la carcasa.

No se ha diseñado ningún hueco para LED/botón frontal — se descartó
por no ser un componente confirmado en la BOM.

## Estado de las medidas (actualizado 2026-08-11)

- **Pi 5** (patrón de taladros) y **Active Cooler**: oficiales, de la
  ficha mecánica de Raspberry Pi. No hace falta medir.
- **Cámara** (AZDelivery OV5647): talla estándar "mini OV5647" del
  mercado (25×24mm, taladros 21×12,5mm) + 1mm de margen de seguridad
  en la placa (26×25mm). El espaciado de taladros NO lleva margen,
  para no descuadrar los tornillos.
- **Módulo de voz Yahboom** (YB-MAE01-V1.0): ficha real del
  fabricante — 48,1×24,1×14,3mm, **no es cuadrado, es alargado** (el
  diseño anterior asumía 42×42mm, estaba mal) + 1mm de margen
  (`voice_w=49, voice_h=25, voice_thick=15` en `common.scad`).
- **Pantalla GeeekPi**: sin ficha pública para el SKU exacto, pero sí
  encontré la de un producto **hermano**: la wiki oficial de 52Pi
  (marca hermana de GeeekPi) para su EP-0085, otra pantalla 7"
  1024×600 capacitiva de la misma familia — placa 177,06×113,09×15,2mm.
  No es seguro al 100% que sea el mismo SKU exacto (esa variante trae
  2 puertos USB host extra en vez de los altavoces de la tuya), pero
  es un dato real de fabricante y mucho más fiable que una
  estimación a ciegas, así que la placa se ha agrandado bastante
  respecto a la primera estimación: antes 166×101×15mm, ahora
  178×114×16mm (ya rotada a vertical: `screen_w=114, screen_h=178,
  screen_thick=16`). El **viewport** (`screen_visible_w=86,
  screen_visible_h=155`) no ha cambiado — el área activa de estos
  paneles 7" 1024×600 es bastante estándar en la industria (~154×86mm)
  independientemente del tamaño de la placa driver, así que ese dato
  ya estaba bien encaminado.

Ninguna de estas cifras sustituye medir la pieza física — en cuanto
puedas, comprueba sobre todo la pantalla (es la que más ha cambiado)
con una regla y ajusta si hace falta.

## Siguiente paso

1. Cuando puedas, confirma con una regla al menos el ancho y el alto
   de la pantalla y del Yahboom, y ajusta `common.scad` si difieren
   de los valores actuales.
2. Abrir cualquiera de los dos `.scad` en OpenSCAD, F5 para
   previsualizar, F6 + exportar STL por pieza.
3. Imprimir: `front_bezel` y `stand_foot` boca abajo (sin soportes),
   `rear_shell` con la abertura hacia arriba (sin soportes en los
   pilares internos).
