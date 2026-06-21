/**
 * Jerarquía de roles administrativos.
 * Un rango mayor implica acceso a todo lo que requiera un rango menor o igual,
 * y acceso automático a cualquier endpoint restringido a roles operativos
 * (roles que NO aparecen en este mapa, como FACTURADOR, CONTADOR, etc.)
 *
 * Para agregar un nuevo nivel administrativo en el futuro
 * (ej: un rol "SUPERVISOR" entre ADMINISTRADOR y SUPERADMIN),
 * solo se agrega aquí con el rango correspondiente:
 *   SUPERVISOR: 1.5  // o reordenar los números si se prefiere
 */
export const ADMIN_ROLE_RANK: Record<string, number> = {
    ADMINISTRADOR: 1,
    SUPERADMIN: 2,
};