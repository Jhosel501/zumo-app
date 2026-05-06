import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { COLORES } from '../theme';
import TarjetaPost from '../components/TarjetaPost';
import PodioFeed from '../components/PodioFeed';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface FeedProps {
  listaFeed: any[];
  listaRanking: any[];
  cargandoFeed: boolean;
  cargarMas: (reset: boolean) => void;
  cargandoMas: boolean;
  hayMasFotos: boolean;
  onPressUser: (userId: string) => void;
  currentUserId: string;
  onPressComment: (publicacionId: string) => void;
}

export default function FeedScreen({
  listaFeed,
  listaRanking,
  cargandoFeed,
  cargarMas,
  cargandoMas,
  hayMasFotos,
  currentUserId,
  onPressUser,
  onPressComment,
}: FeedProps) {

  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <MaskedView
          style={styles.contenedorTitulo}
          maskElement={<Text style={styles.tituloHeader}>ZUMO</Text>}
        >
          <LinearGradient
            colors={['#FF5B37', '#E93E71']} // Tus dos pantones exactos
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </MaskedView>
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
            <TarjetaPost
              item={item}
              listaRanking={listaRanking}
              onPressUser={onPressUser}
              currentUserId={currentUserId}
              onPressComment={onPressComment}
            />
          )}
        />
      )}
    </View>
  );
}

// Solo dejamos los estilos generales de la pantalla
const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.tarjeta,
    backgroundColor: '#000000',
  },
  // Le damos un ancho y alto fijos al contenedor para que el degradado se pinte bien
  contenedorTitulo: {
    height: 28, 
    width: 100, 
  },
  tituloHeader: { 
    fontSize: 22, 
    fontWeight: '900', // Letra extra gruesa para que luzca el color
    color: 'black',    // Obligatorio para que la máscara funcione bien
    letterSpacing: 2,  // Un poco de espacio entre letras para darle toque moderno
    textAlign: 'center',
    backgroundColor: 'transparent'
  },
});