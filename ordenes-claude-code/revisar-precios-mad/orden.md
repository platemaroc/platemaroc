# Orden: revisar precios (solo MAD)

## Objetivo

Verificar que los precios de los menús digitales cumplen `docs/12-especificacion-precios-mad.md`.

## Antes de empezar

- Lee `docs/12-especificacion-precios-mad.md`, la orden de gestión del menú digital y el Documento Maestro.
- No inventes precios.

## Pasos

1. Verificar que `menu_items` almacena el precio en `price_mad` y que no existe ningún campo de moneda.
2. Verificar que los precios se muestran únicamente en MAD, con el formato `120 MAD`.
3. Buscar y registrar cualquier resto de conversión EUR/USD u otra moneda: tipos de cambio, selectores de moneda, precios aproximados ("~") o código relacionado.
4. Verificar que un precio ausente o no verificado se muestra como "Precio pendiente".
5. Registrar discrepancias con ejemplos concretos.
6. No alterar precios sin aprobación.

## Entregable

Informe en `resultados/` con menús revisados, incumplimientos, datos no comprobables y acciones propuestas.
