// ============================================================
// BMO STAND — variante ESTANDAR (sin estetica de personaje).
// Caja funcional, esquinas poco redondeadas, sin marco decorativo.
// Mismos detalles funcionales que la variante BMO: pantalla en
// vertical, ojo de camara, ventana de modulo de voz, rejillas de
// altavoz y del active cooler, salida de cables, pie inclinado.
//
// Los parametros/medidas se editan en common.scad (compartido con
// bmo_stand.scad) para no tener que actualizar dos archivos cuando
// midas las piezas reales.
// ============================================================
include <common.scad>

corner_r_standard = 6;

exploded = true;
gap_z = exploded ? 40 : 0;

front_bezel(corner_r_standard, rim_groove = false);

translate([0, 0, wall + gap_z])
    rear_shell(corner_r_standard);

translate([0, -body_h/2 - 20, 0])
    stand_foot(corner_r_standard);
