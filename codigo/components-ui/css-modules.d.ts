// Tipos de los CSS Modules para el código fuera de codigo/frontend (dentro, los declara Next.js).
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
