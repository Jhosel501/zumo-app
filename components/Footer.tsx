import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORES } from '../theme';

// Este componente es el menú inferior que te permite navegar entre las vistas principales de la app
interface FooterProps {
  vistaActual: 'feed' | 'ranking' | 'camara' | 'perfil' | 'perfilPublico' | 'fotoDetalle' | string;
  setVistaActual: (vista: any) => void;
}

export default function Footer({ vistaActual, setVistaActual }: FooterProps) {
  return (
    <View style={styles.footer}>
        <TouchableOpacity style={styles.botonFooter} onPress={() => setVistaActual('feed')}>
        <Text style={[styles.textoFooter, vistaActual === 'feed' && styles.textoFooterActivo]}>
          🏠
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonFooter} onPress={() => setVistaActual('ranking')}>
        <Text style={[styles.textoFooter, vistaActual === 'ranking' && styles.textoFooterActivo]}>
          🏆
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonFooter} onPress={() => setVistaActual('camara')}>
        <Text style={[styles.textoFooter, vistaActual === 'camara' && styles.textoFooterActivo]}>
          📸
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonFooter} onPress={() => setVistaActual('perfil')}>
        <Text style={[styles.textoFooter, vistaActual === 'perfil' && styles.textoFooterActivo]}>
          👤
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { 
    height: 80, 
    flexDirection: 'row', 
    backgroundColor: COLORES.fondo,
    borderTopWidth: 1, 
    borderTopColor: COLORES.tarjeta, 
    paddingBottom: 20 
  },
  botonFooter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  textoFooter: { color: COLORES.secundario, fontSize: 16, fontWeight: '600' },
  textoFooterActivo: { color: COLORES.textoBlanco, fontWeight: 'bold' }
});