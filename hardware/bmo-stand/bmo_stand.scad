// ============================================================
// BMO STAND — variante ESTETICA BMO (personaje).
// Esquinas muy redondeadas y marco decorativo hundido alrededor
// de la pantalla, para recordar al contorno de cara de BMO. Mismos
// detalles funcionales que la variante estandar: pantalla en
// vertical, ojo de camara, ventana de modulo de voz, rejillas de
// altavoz y del active cooler, salida de cables, pie inclinado.
//
// Los parametros/medidas se editan en common.scad (compartido con
// standard_stand.scad) para no tener que actualizar dos archivos
// cuando midas las piezas reales.
// ============================================================
include <common.scad>

corner_r_bmo = 14;

exploded = true;
gap_z = exploded ? 40 : 0;

front_bezel(corner_r_bmo, rim_groove = true);

translate([0, 0, wall + gap_z])
    rear_shell(corner_r_bmo);

translate([0, -body_h/2 - 20, 0])
    stand_foot(corner_r_bmo);
