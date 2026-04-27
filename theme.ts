// theme.ts

export const COLORES = {
  // Colores principales de fondo
  fondo: '#121212',      // El negro profundo de tu web (antes era azulado)
  tarjeta: '#1A1A1A',    // Un gris muy oscuro elegante para las tarjetas
  
  // Colores de acento y marca
  primario: '#FF7E00',   // Naranja Zumo oficial (reemplaza al rojo)
  secundario: '#999999', // Gris apagado para textos secundarios
  acento: '#E02C73',     // El rosa/fucsia del degradado (para el #1, éxitos, etc.)
  
  // Textos y nuevos colores para los inputs
  textoBlanco: '#ffffff',
  textoOscuro: '#000000',
  inputFondo: '#1A1A1A', // Fondo inmersivo para los campos de texto
  borde: '#333333',      // Bordes sutiles para las tarjetas
  error: '#FF4444',
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

// Añadimos una nueva constante para los bordes súper redondeados
export const BORDES = {
  radio: 20, // Para usarlo en borderRadius de botones y tarjetas
};