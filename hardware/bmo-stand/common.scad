// ============================================================
// BMO STAND — parametros y piezas compartidas entre las dos
// variantes (standard_stand.scad y bmo_stand.scad). No se incluye
// solo/a para previsualizar: usa uno de esos dos archivos.
//
// Pantalla montada en VERTICAL (portrait), igual que la pantalla
// real de BMO OS (panel nativo 1024x600 apaisado, rotado 90 grados
// para mostrar 600x1024). Las medidas de aqui abajo ya vienen en
// las cotas ROTADAS (ancho = eje corto del panel, alto = eje largo).
//
// Todo lo marcado "MEDIR" es una estimacion (Amazon no publica
// planos de estas piezas). Donde no hay dato oficial se ha anadido
// +1mm de margen de seguridad sobre la estimacion, para pecar de
// holgado antes que de justo.
//
// La pantalla va "a ras": el hueco del bisel es del tamano del area
// VISIBLE (no de la placa completa), asi que la placa del modulo
// queda oculta detras y solo se ve el cristal, sin marco propio del
// modulo asomando. Retenida con 4 pestanas de presion, no pegada.
// ============================================================

/* [Pantalla GeeekPi 7" 1024x600 IPS — MONTADA EN VERTICAL] */
// Placa: wiki oficial de 52Pi (marca hermana de GeeekPi) para su
// EP-0085, una pantalla 7" 1024x600 capacitiva de la misma familia:
// 177.06 x 113.09 x 15.2mm. No es 100% seguro que sea el SKU EXACTO
// que compraste (esa variante trae 2 USB host extra, la tuya trae
// altavoces en su lugar), pero es un dato real de fabricante, mucho
// mejor que una estimacion a ciegas — se usa como base, redondeado
// hacia arriba por seguridad.
// Viewport: el area activa de estos paneles 7" 1024x600 es un dato
// bastante estandar en la industria (~154 x 86mm), independiente del
// tamano de la placa driver, así que se mantiene como ya estaba.
// Rotado 90 grados para portrait, el eje corto pasa a ser el ancho
// del hueco y el largo la altura:
screen_w         = 114;   // ancho placa ya rotada (eje corto del panel) — 52Pi EP-0085 + margen
screen_h         = 178;   // alto placa ya rotada (eje largo del panel) — 52Pi EP-0085 + margen
screen_thick     = 16;    // grosor apilado (panel + driver board) — 52Pi EP-0085 + margen
screen_visible_w = 86;    // viewport ancho (rotado) — area activa estandar 7" 1024x600
screen_visible_h = 155;   // viewport alto (rotado) — area activa estandar 7" 1024x600

/* [Raspberry Pi 5] — patron de taladros y placa oficiales, fiable */
pi5_hole_dx      = 58;
pi5_hole_dy      = 49;
pi5_hole_d       = 2.9;   // M2.5 autorroscante
pi5_standoff_h   = 6;     // profundidad de rosca util en cada pilar
pi5_board_w      = 85;    // eje largo de la placa (el del patron de 58mm)
pi5_board_h      = 56;    // eje corto de la placa (el del patron de 49mm)

/* [Active Cooler Pi 5] — dato OFICIAL (mechanical drawing Raspberry Pi) */
cooler_w         = 63.5;
cooler_h         = 42.5;
cooler_clear     = 30;    // espacio entre la placa y la pared trasera

/* [Camara AZDelivery OV5647] — talla estandar "mini OV5647" +1mm de
   margen en la placa. El espaciado de taladros NO lleva margen para
   no descuadrar los tornillos. */
cam_board_w      = 26;
cam_board_h      = 25;
cam_hole_dx      = 21;
cam_hole_dy      = 12.5;
cam_lens_d       = 8;
cam_standoff_h   = 4;

/* [Modulo de voz Yahboom AI Voice Interaction, YB-MAE01-V1.0] — ficha
   real del fabricante: 48.1 x 24.1 x 14.3mm (no es cuadrado, es
   alargado), +1mm de margen de seguridad. Se monta como una ventana
   completa en el biselo frontal: el modulo entero queda a ras de la
   cara exterior para que su microfono y su altavoz propios no queden
   amortiguados detras de plastico. */
voice_w          = 49;
voice_h          = 25;
voice_thick      = 15;
module_gap       = 1.5;   // holgura de encaje de la ventana del modulo
module_lip       = 1.2;   // reborde interior que retiene el modulo

/* [Generales] */
wall             = 3;
gap              = 1.2;
top_margin       = 32;              // hueco superior para la camara ("ojo")
                                     // + la salida de cables (confirmado:
                                     // los conectores de la pantalla van
                                     // hacia arriba, comparten esta franja)
bottom_margin    = voice_h + 14;    // hueco inferior para el modulo de voz
side_margin      = 3;               // minimo estructural: pantalla "a ras",
                                     // el marco visible que queda es solo el
                                     // borde propio de la placa + esta pared

body_w           = screen_w + wall*2 + side_margin;
body_h           = screen_h + top_margin + bottom_margin + wall*2;
body_depth       = screen_thick + cooler_clear + wall*2 + 8;

// Salida de cables (HDMI de la pantalla + alimentacion + USB-C de la
// Pi/Yahboom), por ARRIBA — confirmado: los conectores de la pantalla,
// tal y como esta montada, quedan hacia arriba. Sale por el canto
// superior de la carcasa (no por el frontal), en la misma franja
// donde esta el ojo de la camara pero en la cara de arriba, no la
// delantera, asi que no chocan entre si.
cable_top_w      = 30;   // ancho de la ranura (eje X)
cable_top_d      = 16;   // profundidad de la ranura (eje Z)

// posiciones verticales clave, relativas al centro del cuerpo
voice_center_y   = -body_h/2 + wall + bottom_margin/2;
screen_center_y  = voice_center_y + bottom_margin/2 + screen_h/2;
cam_center_y     = body_h/2 - wall - top_margin/2;

// Posicion de la Pi5 dentro del hueco de electronica: pegada a la
// esquina inferior-derecha, para que sus dos bordes de conectores
// (USB x4 + Ethernet en el borde LARGO, USB-C alimentacion + 2x
// microHDMI en el borde CORTO adyacente) queden cada uno junto a
// una pared real y se les pueda abrir una ventana — el lateral
// derecho para USB+Ethernet, el canto inferior para USB-C+HDMI.
// SUPOSICION a confirmar con la placa real: el patron de taladros
// es simetrico pero los puertos no, no puedo saber sin la placa en
// que esquina exacta cae cada conector — si no coincide al montar,
// es cuestion de reflejar pi5_cx/pi5_cy (cambiar el signo).
pi5_edge_clear   = 5;
pi5_cx           = (body_w/2 - wall - pi5_edge_clear) - pi5_board_h/2;
pi5_cy           = -(body_h/2 - wall - pi5_edge_clear) + pi5_board_w/2;
pi5_usb_slot_h   = 70;   // alto de la ventana USB+Ethernet (eje Y)
pi5_usb_slot_d   = 20;   // profundidad (eje Z)
pi5_pwr_slot_w   = 45;   // ancho de la ventana USB-C+HDMI (eje X)
pi5_pwr_slot_d   = 16;   // profundidad (eje Z)

/* [Pie / soporte] */
foot_angle       = 20;
foot_depth       = 70;
foot_w           = body_w * 0.55;

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
module rounded_rect(w, h, r) {
    hull() {
        for (x = [-1, 1], y = [-1, 1])
            translate([x*(w/2 - r), y*(h/2 - r)])
                circle(r = r, $fn = 48);
    }
}

module rounded_box(w, h, d, r) {
    linear_extrude(height = d)
        rounded_rect(w, h, r);
}

// ventana pasante con reborde interior de retencion: el hueco es
// mas ancho que la pieza en la cara exterior (para que entre) y se
// estrecha en el ultimo tramo (module_lip) para que la pieza no se
// caiga hacia dentro. La pieza queda ligeramente rehundida.
module retained_window(w, h, depth, gap, lip, r = 3) {
    translate([0, 0, -0.5])
        linear_extrude(height = depth - lip + 0.5)
            rounded_rect(w + gap, h + gap, r);
    translate([0, 0, depth - lip])
        linear_extrude(height = lip + 0.5)
            rounded_rect(w + gap - 4, h + gap - 4, r);
}

// ------------------------------------------------------------
// Bisel frontal: recorte de pantalla (vertical), ojo de la camara
// arriba centrado, ventana del modulo de voz abajo centrada.
// corner_r y rim_groove cambian segun la estetica (standard/bmo).
// Imprimir boca abajo (cara vista hacia la cama, sin soportes).
// ------------------------------------------------------------
module front_bezel(corner_r, rim_groove = false) {
    difference() {
        rounded_box(body_w, body_h, wall, corner_r);

        // viewport de la pantalla, vertical — el hueco es del tamano
        // del area visible (no de la placa completa), asi que la placa
        // queda oculta detras del bisel y la pantalla se ve "a ras",
        // sin marco propio del modulo asomando
        translate([0, screen_center_y, -1])
            linear_extrude(height = wall + 2)
                rounded_rect(screen_visible_w, screen_visible_h, 4);

        // marco decorativo hundido alrededor del viewport (solo BMO)
        if (rim_groove)
            translate([0, screen_center_y, wall - 1])
                linear_extrude(height = 1.2)
                    difference() {
                        rounded_rect(screen_visible_w + 8, screen_visible_h + 8, 6);
                        rounded_rect(screen_visible_w + 2, screen_visible_h + 2, 5);
                    }

        // ojo de la camara, arriba centrado
        translate([0, cam_center_y, -1])
            cylinder(d = cam_lens_d, h = wall + 2, $fn = 48);

        // ventana del modulo de voz, abajo centrada — el modulo
        // completo (con su propio microfono y altavoz) queda a ras
        translate([0, voice_center_y, 0])
            retained_window(voice_w, voice_h, wall, module_gap, module_lip);
    }

    // pilares para atornillar la placa de la camara por dentro,
    // justo detras del ojo
    for (x = [-1, 1], y = [-1, 1])
        translate([x*cam_hole_dx/2, cam_center_y + y*cam_hole_dy/2, wall])
            difference() {
                cylinder(d = 5, h = cam_standoff_h, $fn = 20);
                cylinder(d = 2, h = cam_standoff_h + 1, $fn = 20);
            }

    // pestanas de retencion de la pantalla: topes en las 4 esquinas
    // del viewport que se apoyan en el canto interior de la placa,
    // para sujetarla a presion sin pegamento permanente (hasta tener
    // agujeros de tornillo reales, un punto de cinta doble cara
    // removible entre placa y tope es suficiente para un prototipo)
    for (x = [-1, 1], y = [-1, 1])
        translate([x*(screen_visible_w/2 + 2), screen_center_y + y*(screen_visible_h/2 + 2), wall])
            cube([4, 4, 2.5], center = true);
}

// ------------------------------------------------------------
// Cuerpo trasero: aloja Pi5 + active cooler, con rejillas para el
// cooler y para los altavoces (integrados en la parte trasera de
// la propia pantalla) y salida de cables. Imprimir con la abertura
// hacia arriba, sin soportes en los pilares internos.
// ------------------------------------------------------------
module rear_shell(corner_r) {
    pi5_z = body_depth - wall - cooler_clear;

    difference() {
        rounded_box(body_w, body_h, body_depth, corner_r);

        translate([0, 0, wall])
            rounded_box(body_w - wall*2, body_h - wall*2, body_depth, corner_r - wall/2);

        // salida de cables por el canto SUPERIOR (confirmado: los
        // conectores de la pantalla van hacia arriba). Y = wall*3
        // perfora la pared, X = cable_top_w (ancho), Z = cable_top_d
        translate([0, body_h/2 - wall*1.5, wall + (body_depth - wall*2)/2])
            cube([cable_top_w, wall*3, cable_top_d], center = true);

        // rejilla del active cooler, alineada con la Pi5 (el cooler
        // va justo encima, en el mismo X/Y)
        translate([pi5_cx, pi5_cy, body_depth - wall - 0.1])
            for (x = [-2:2], y = [-1:1])
                translate([x*9, y*10, 0])
                    cylinder(d = 4, h = wall + 1, $fn = 20);

        // rejillas para los altavoces traseros de la pantalla,
        // banda alineada con la zona del viewport
        for (side = [-1, 1])
            translate([side*(body_w/2 - wall - 6), screen_center_y + screen_h*0.2, body_depth - wall - 0.1])
                for (i = [0:4])
                    translate([0, i*8 - 16, 0])
                        cylinder(d = 3, h = wall + 1, $fn = 16);

        // ventana USB x4 + Ethernet (borde largo de la Pi5), pegada
        // a la pared lateral derecha
        translate([body_w/2 - wall*1.5, pi5_cy, pi5_z + pi5_usb_slot_d/2])
            cube([wall*3, pi5_usb_slot_h, pi5_usb_slot_d], center = true);

        // ventana USB-C (alimentacion) + 2x microHDMI (borde corto de
        // la Pi5), pegada al canto inferior
        translate([pi5_cx, -body_h/2 + wall*1.5, pi5_z + pi5_pwr_slot_d/2])
            cube([pi5_pwr_slot_w, wall*3, pi5_pwr_slot_d], center = true);
    }

    // pilares de montaje de la Raspberry Pi 5 (taladros oficiales),
    // suben desde la pared trasera hasta el plano donde apoya la
    // placa, dejando cooler_clear libre hacia atras para el disipador.
    // Ejes X/Y intercambiados a proposito (dy en X, dx en Y) para que
    // el borde largo de la placa (85mm, USB+Ethernet) quede vertical,
    // mirando al lateral, en vez de horizontal mirando arriba/abajo.
    for (x = [-1, 1], y = [-1, 1])
        translate([pi5_cx + x*pi5_hole_dy/2, pi5_cy + y*pi5_hole_dx/2, pi5_z])
            difference() {
                cylinder(d = pi5_hole_d + 4, h = cooler_clear, $fn = 24);
                translate([0, 0, cooler_clear - pi5_standoff_h])
                    cylinder(d = pi5_hole_d, h = pi5_standoff_h + 1, $fn = 24);
            }
}

// ------------------------------------------------------------
// Pie / soporte trasero, a presion, inclina el conjunto foot_angle
// grados. Igual para las dos esteticas (pieza puramente funcional).
// ------------------------------------------------------------
module stand_foot(corner_r) {
    union() {
        translate([0, -foot_depth/2, wall/2])
            rounded_box(foot_w, foot_depth, wall, min(corner_r, 4));
        rotate([90 - foot_angle, 0, 0])
            translate([0, 0, -wall/2])
                rounded_box(foot_w, body_depth * 0.7, wall, min(corner_r, 4));
    }
}
