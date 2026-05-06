import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORES } from '../theme';
import AvatarPlaceholder from './AvatarPlaceholder';

interface PodioProps {
  listaRanking: any[];
}

export default function PodioFeed({ listaRanking }: PodioProps) {
  // Cortamos la lista para quedarnos solo con los 3 primeros
  const top3 = listaRanking.slice(0, 3);
  
  // Si no hay nadie en el ranking aún, no mostramos el podio
  if (top3.length === 0) return null;

  // Asignamos las posiciones (si no hay #2 o #3, se quedarán vacíos y no darán error)
  const oro = top3[0];
  const plata = top3[1];
  const bronce = top3[2];

  // Una pequeña función interna para dibujar cada "escalón" del podio y no repetir código
  const renderEscalon = (usuario: any, puesto: number, colorBorde: string, size: number) => {
    // Si la app acaba de empezar y solo hay 1 persona, dejamos el hueco del 2 y 3 vacío
    if (!usuario) return <View style={{ width: size + 20, marginHorizontal: 5 }} />;

    const avatar = usuario.avatar_url;
    const username = usuario.username || 'Anónimo';

    return (
      <View style={[styles.escalon, { width: size + 30 }]}>
        <View style={[styles.contenedorAvatar, { width: size, height: size, borderColor: colorBorde }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <AvatarPlaceholder size={size} />
          )}
          {/* El circulito con el número de posición */}
          <View style={[styles.medalla, { backgroundColor: colorBorde }]}>
            <Text style={styles.textoMedalla}>{puesto}</Text>
          </View>
        </View>
        <Text style={styles.nick} numberOfLines={1}>{username}</Text>
        <Text style={styles.zumos}>{usuario.total_zumos || 0} Zumos</Text>
      </View>
    );
  };

  return (
    <View style={styles.contenedorPodio}>
      {/* <Text style={styles.tituloPodio}>👑 Top</Text> */}
      <View style={styles.basePodio}>
        {/* El orden visual del podio: Izquierda(2), Centro(1), Derecha(3) */}
        {renderEscalon(plata, 2, '#c0c0c0', 65)}
        {renderEscalon(oro, 1, '#ffd700', 85)}
        {renderEscalon(bronce, 3, '#cd7f32', 65)}
      </View>
      <View style={styles.lineaSeparadora} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorPodio: {
    paddingTop: 20,
    backgroundColor: COLORES.fondo,
    alignItems: 'center',
  },
  tituloPodio: {
    color: COLORES.textoBlanco,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  basePodio: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Alineamos los avatares por la base para que el #1 sobresalga por arriba
    justifyContent: 'center',
    marginBottom: 20,
  },
  escalon: {
    alignItems: 'center',
    marginHorizontal: 5,
  },
  contenedorAvatar: {
    borderWidth: 3,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalla: {
    position: 'absolute',
    bottom: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORES.fondo,
  },
  textoMedalla: {
    color: 'black',
    fontWeight: '900',
    fontSize: 12,
  },
  nick: {
    color: COLORES.textoBlanco,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  zumos: {
    color: COLORES.primario,
    fontSize: 11,
    fontWeight: 'bold',
  },
  lineaSeparadora: {
    width: '100%',
    height: 1,
    backgroundColor: COLORES.tarjeta,
    marginTop: 10,
  }
});