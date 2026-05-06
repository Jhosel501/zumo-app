import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORES } from '../theme';
import TarjetaPost from '../components/TarjetaPost';

interface SinglePostProps {
  foto: any;
  listaRanking: any[];
  onVolver: () => void;
  onPressUser: (userId: string) => void;
}


export default function SinglePostScreen({ foto, listaRanking, onVolver, onPressUser }: SinglePostProps) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVolver} style={styles.botonVolver}>
          <Text style={styles.textoVolver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Publicación</Text>
        <View style={{ width: 60 }} />
      </View>

        
      <ScrollView contentContainerStyle={{ paddingVertical: 15 }}>
        <TarjetaPost 
          item={foto} 
          listaRanking={listaRanking} 
          onPressUser={onPressUser} 
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta },
  botonVolver: { paddingVertical: 5 },
  textoVolver: { color: COLORES.acento, fontSize: 16, fontWeight: 'bold' },
  titulo: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: 'bold' }
});