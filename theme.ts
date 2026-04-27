// theme.ts

export const COLORES = {
  // Colores principales de fondo
  fondo: '#08080A',      // El negro profundo extraído de tu --fondo
  tarjeta: '#1A1A1A',    // Mantenemos el gris oscuro para las tarjetas (.tarjeta-descarga)
  
  // Colores de acento y marca (Extraídos de tu --zumo-gradient)
  primario: '#FF5B37',   // El color principal de tu degradado y botones
  secundario: '#666670', // Extraído de tu --texto-dim para textos secundarios
  acento: '#E93E71',     // El color central de tu degradado (rosa/fucsia)
  
  // Textos y nuevos colores para los inputs
  textoBlanco: '#FFFFFF', // Extraído de tu --texto
  textoOscuro: '#000000',
  inputFondo: 'transparent', // En tu CSS .input-inmersivo usa background: transparent
  borde: '#222222',      // Extraído del border-bottom de tus inputs en la web
  error: '#FF5B37',      // Extraído de tu --error
};

export const FUENTES = {
  // Usamos tus fuentes Satoshi reales que tienes en la carpeta assets
  regular: 'Satoshi-Regular',
  bold: 'Satoshi-Variable',
  italic: 'Satoshi-VariableItalic', 
};

// Mantenemos tus espaciados globales intactos para que no se desconfigure nada
export const ESPACIADOS = {
  pequeno: 10,
  medio: 15,
  grande: 20,
  gigante: 30,
};

// Ajustado al CSS de la web
export const BORDES = {
  radio: 16, // Cambiado a 16 para igualar el border-radius de tu .boton-join en la web
};