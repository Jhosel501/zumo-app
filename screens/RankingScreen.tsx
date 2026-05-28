import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORES, FUENTES } from '../theme';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

interface RankingProps {
  listaRanking: any[];
  cargandoRanking: boolean;
  onPressUser: (userId: string) => void;
}

export default function RankingScreen({ listaRanking, cargandoRanking, onPressUser }: RankingProps) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>🏆 Top Zaragoza</Text>
      </View>

      <View style={styles.feed}>
        {cargandoRanking ? (
          <ActivityIndicator size="large" color={COLORES.primario} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={listaRanking}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item, index }) => {
              
              // Como leemos de la vista, los datos vienen limpios y directos
              const username = item.username || 'Anónimo';
              const avatar = item.avatar_url;
              const puntos = item.total_zumos || 0;
              
              // Destacamos el Top 3 con colores especiales para la posición
              const colorPosicion = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : COLORES.secundario;
              
              return (
                <TouchableOpacity style={styles.tarjeta} onPress={() => onPressUser(item.id)} activeOpacity={0.7}>

                  <View style={styles.ladoIzquierdo}>
                    <Text style={[styles.posicion, { color: colorPosicion }]}>#{index + 1}</Text>

                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                      <AvatarPlaceholder size={40} style={{ marginRight: 12 }} />
                    )}

                    <Text style={styles.nombreTarjeta}>{username}</Text>
                  </View>

                  <View style={styles.ladoDerecho}>
                    <Text style={styles.numeroZumos}>{puntos}</Text>
                    <Text style={styles.textoZumos}>{puntos === 1 ? 'Zumo' : 'Zumos'}</Text>
                  </View>

                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000000' },
  header: { height: 60, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta, backgroundColor: '#000000' },
  tituloHeader: { fontSize: 22, fontWeight: 'bold', color: COLORES.textoBlanco },
  feed: { flex: 1 },
  
  // Diseño de la tarjeta en formato "Fila"
  tarjeta: { flexDirection: 'row', backgroundColor: COLORES.tarjeta, borderRadius: 15, padding: 15, marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' },
  
  ladoIzquierdo: { flexDirection: 'row', alignItems: 'center' },
  posicion: { fontSize: 20, fontWeight: '900', width: 45 },
  
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: COLORES.fondo },
  
  nombreTarjeta: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: 'bold' },
  
  ladoDerecho: { alignItems: 'flex-end', justifyContent: 'center' },
  numeroZumos: { color: COLORES.primario, fontSize: 20, fontWeight: '900', lineHeight: 22 },
  textoZumos: { color: COLORES.secundario, fontSize: 12, fontWeight: 'bold', fontFamily: FUENTES.italic },
});