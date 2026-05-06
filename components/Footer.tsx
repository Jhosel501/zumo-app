import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Importamos la librería
import { COLORES } from '../theme';

interface FooterProps {
  vistaActual: string;
  setVistaActual: (vista: any) => void;
}

export default function Footer({ vistaActual, setVistaActual }: FooterProps) {
  
  // Función para decidir el color (Naranja Zumo si está activo, Gris si no)
  const colorIcono = (nombreVista: string) => 
    vistaActual === nombreVista ? COLORES.primario : COLORES.secundario;

  return (
    <View style={styles.footer}>
      
      {/* BOTÓN FEED (INICIO) */}
      <TouchableOpacity onPress={() => setVistaActual('feed')}>
        <Ionicons 
          name={vistaActual === 'feed' ? 'home' : 'home-outline'} 
          size={26} 
          color={colorIcono('feed')} 
        />
      </TouchableOpacity>

      {/* BOTÓN BÚSQUEDA (EL NUEVO) */}
      <TouchableOpacity onPress={() => setVistaActual('search')}>
        <Ionicons 
          name={vistaActual === 'search' ? 'search' : 'search-outline'} 
          size={26} 
          color={colorIcono('search')} 
        />
      </TouchableOpacity>

      {/* BOTÓN CÁMARA */}
      <TouchableOpacity onPress={() => setVistaActual('camara')}>
        <Ionicons 
          name={vistaActual === 'camara' ? 'camera' : 'camera-outline'} 
          size={28} // Un pelín más grande por ser la acción principal
          color={colorIcono('camara')} 
        />
      </TouchableOpacity>

      {/* BOTÓN RANKING */}
      <TouchableOpacity onPress={() => setVistaActual('ranking')}>
        <Ionicons 
          name={vistaActual === 'ranking' ? 'trophy' : 'trophy-outline'} 
          size={26} 
          color={colorIcono('ranking')} 
        />
      </TouchableOpacity>

      {/* BOTÓN PERFIL */}
      <TouchableOpacity onPress={() => setVistaActual('perfil')}>
        <Ionicons 
          name={vistaActual === 'perfil' ? 'person' : 'person-outline'} 
          size={26} 
          color={colorIcono('perfil')} 
        />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000000',
    height: 55,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingBottom: 4,
  },
});