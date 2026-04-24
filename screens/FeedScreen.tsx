import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { COLORES } from '../theme';
import TarjetaPost from '../components/TarjetaPost';
import PodioFeed from '../components/PodioFeed';

interface FeedProps {
  listaFeed: any[];
  listaRanking: any[];
  cargandoFeed: boolean;
  cargarMas: (reset: boolean) => void;
  cargandoMas: boolean;
  hayMasFotos: boolean;
  onPressUser: (userId: string) => void; // función para manejar el click en el usuario desde la tarjeta del feed
}

export default function FeedScreen({ 
  listaFeed, 
  listaRanking, 
  cargandoFeed, 
  cargarMas, 
  cargandoMas, 
  hayMasFotos ,
  onPressUser
}: FeedProps) {

  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Zaragoza</Text>
      </View>

      {cargandoFeed ? (
        <ActivityIndicator size="large" color={COLORES.primario} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={listaFeed}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
            refreshing={cargandoFeed} // La rueda gira mientras esto sea true
            onRefresh={() => cargarMas(true)} // Al tirar, ejecutamos carga con reset
            tintColor={COLORES.primario} // Color para iOS
            colors={[COLORES.primario]} // Color para Android
            />
          }
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (!cargandoFeed && !cargandoMas && hayMasFotos) {
              cargarMas(false);
            }
          }}
          onEndReachedThreshold={0.5}
          // Ahora el podio del feed es un header, para que siempre esté visible al principio
          ListHeaderComponent={() => (
            <PodioFeed listaRanking={listaRanking} />
          )}
          // Y el footer se encarga de mostrar el indicador de carga o el mensaje de "no hay más fotos"
          ListFooterComponent={() => (
            <View style={{ padding: 30, alignItems: 'center' }}>
              {cargandoMas ? (
                <ActivityIndicator size="small" color={COLORES.primario} />
              ) : !hayMasFotos && listaFeed.length > 0 ? (
                <Text style={{ color: COLORES.secundario, fontSize: 12 }}>No hay más fotos por ahora 🌙</Text>
              ) : null}
            </View>
          )}

          // Pasamos la función onPressUser a cada tarjeta del feed para que puedan manejar el click en el usuario
          renderItem={({ item }) => (
            <TarjetaPost item={item} listaRanking={listaRanking} onPressUser={onPressUser}/>
          )}
        />
      )}
    </View>
  );
}

// Solo dejamos los estilos generales de la pantalla
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  header: { height: 60, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta },
  tituloHeader: { fontSize: 22, fontWeight: 'bold', color: COLORES.textoBlanco },
});