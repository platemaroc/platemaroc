# Encargo para Claude Design · Carpeta 1 de 14: Login (acceso)

**Proyecto:** Platemaroc, guía de restaurantes de Marruecos para turistas europeos (es · en · fr; el español es el idioma base).
**Autoridad:** `docs/01-documento-maestro-operacion.md` (§18) y `docs/16-encargo-claude-design.md` (reglas generales).
**Bocetos adjuntos:** `movil/` (900 × 2000 px) y `ordenador/` (1280 × 760 px). Son esquemas de estructura en grises con
datos ficticios: diseña el aspecto final respetando la estructura, los textos y el orden de los elementos.

---

## 1. Qué hay que diseñar

El acceso a la web (usuarios) y al panel (propietarios, empleados y administración). **Sin contraseñas, sin SMS y sin Apple.**
Tres formas de entrar, del mismo nivel visual:

1. **Continuar con Google**
2. **✉️ Continuar con email** (se recibe un código de 6 cifras)
3. **🔑 Continuar con huella o cara** (passkey del dispositivo)

## 2. Pantallas (10, en móvil y ordenador)

| # | Archivo | Pantalla | Contenido |
|---|---|---|---|
| 01 | `01-entrar` | Entrar | Título «Entrar», texto «Sin contraseñas. Elige cómo quieres entrar:», los 3 botones y, debajo, «¿No tienes cuenta?» con el botón principal **«Crear cuenta»** |
| 02 | `02-continuar-con-email` | Continuar con email | Campo email, botón «Enviarme un código», aviso «Te enviamos un código de 6 cifras a tu email», campo código, botón «Entrar», enlace «‹ Otras opciones» |
| 03 | `03-continuar-con-google` | Continuar con Google | Elegir la cuenta de Google o «Usar otra cuenta de Google», botón «Entrar», aviso de que Google comparte nombre y email y que nunca vemos la contraseña de Google, «‹ Otras opciones» |
| 04 | `04-continuar-con-huella-o-cara` | Continuar con huella o cara | Icono de llave, botón «Usar huella o cara», aviso «Tu huella o tu cara nunca salen de tu dispositivo», cómo activarlo si aún no lo tiene, «‹ Otras opciones» |
| 05 | `05-crear-cuenta` | Crear cuenta | Campo «Nombre visible», «Elige cómo quieres crearla:», botones «Crear con Google», «Crear con email», «Crear con huella o cara», casilla de condiciones y privacidad, enlace «‹ Ya tengo cuenta: entrar» |
| 06 | `06-crear-con-google-1` | Crear con Google · elegir cuenta | Ventana de Google sobre la pantalla «Crear cuenta» (fondo atenuado): cuentas y «Usar otra cuenta», aviso de datos compartidos |
| 07 | `07-crear-con-google-2` | Crear con Google · último paso | «Has entrado con Google como …», campo «Nombre visible», casilla de condiciones, botón «Crear cuenta» |
| 08 | `08-crear-con-huella-o-cara-1` | Crear con huella o cara · datos | Campos «Nombre visible» y «Email (para recuperar la cuenta)», casilla de condiciones, botón «Activar huella o cara», aviso de que la huella o la cara se quedan en el dispositivo |
| 09 | `09-crear-con-huella-o-cara-2` | Crear con huella o cara · confirmación | Ventana del sistema del dispositivo (fondo atenuado): «¿Usar tu huella o tu cara para platemaroc.com?», botones «Cancelar» y «Continuar». Es una ventana del sistema operativo: solo hay que representarla, no rediseñarla |
| 10 | `10-panel-acceso` | Acceso al panel | Título «Platemaroc · Panel», los 3 botones y la explicación: propietarios y empleados entran con Google, email o huella/cara; administración entra con Google + código de la app de autenticación, o con huella/cara |

## 3. Reglas de esta carpeta

- Los tres métodos de acceso tienen **el mismo peso visual**; el único botón principal (relleno) de «Entrar» es **«Crear cuenta»**,
  y en los formularios lo es la acción final («Entrar», «Crear cuenta», «Enviarme un código»).
- **Una sola pantalla**, sin scroll, en móvil y en ordenador. En ordenador, el formulario va centrado y con ancho limitado.
- Siempre visibles la cabecera de la web (logo, buscar, idioma, cuenta) y, en móvil, la barra inferior con «Cuenta» activa.
  El acceso al panel no lleva la cabecera ni la barra de la web.
- Campos preparados para que el navegador y el gestor del móvil autocompleten el email y el código.
- Mensajes de error necesarios (diseñar su aspecto): código incorrecto, código caducado, demasiados intentos, email no válido,
  huella o cara cancelada.
- Textos en español; los tres idiomas deben caber (el francés ocupa un 20–30 % más).
- Accesibilidad: contraste mínimo WCAG AA, foco visible, áreas táctiles de 44 × 44 px, etiquetas en todos los campos.

## 4. Fuera de esta carpeta (no diseñar aquí)

Contraseñas, «recuperar contraseña», SMS, teléfono y login con Apple **no existen**.

## 5. Entregables

Las 10 pantallas en móvil y ordenador con el diseño final, los estados de error y los componentes que usan
(botón principal, botón secundario, campo de texto, campo de código, casilla, enlace, aviso).
