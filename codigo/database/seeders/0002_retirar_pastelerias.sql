-- Tipo de lugar retirado por decisión del titular (30-10-2026). Es un archivo aparte porque 0001 ya está aplicado y no se edita.
-- Va entre los datos de referencia para ejecutarse siempre después de 0001. No había ningún lugar de este tipo.
delete from place_types where slug = 'pastelerias-y-panaderias';
