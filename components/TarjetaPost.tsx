import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORES } from '../theme';


interface TarjetaPostProps {
  item: any;
  listaRanking: any[];
  onPressUser: (user: string) => void; // función para manejar el click en el usuario (opcional, por si quieres llevar a un perfil al hacer click)
}

export default function TarjetaPost({ item, listaRanking, onPressUser }: TarjetaPostProps) {
  // Extraemos los datos
  const username = item.perfiles?.username || 'Anónimo'; // Si no hay username, mostramos "Anónimo"
  const avatar = item.perfiles?.avatar_url;
  
  // La calculadora de puesto ahora vive dentro de su propio molde
  const indice = listaRanking.findIndex(user => user.id === item.perfil_id);
  const puesto = indice !== -1 ? `#${indice + 1}` : '#-';

  return (
    <View style={styles.tarjetaPost}>
      <View style={styles.cabeceraPost}>
        {/* ENVOLVEMOS ESTO PARA QUE SEA CLICABLE */}
        <TouchableOpacity style={styles.usuarioPost} onPress={() => onPressUser(item.perfil_id)}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarPequeno} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 14 }}>👤</Text>
            </View>
          )}
          <Text style={styles.nombreUsuario}>{username}</Text>
        </TouchableOpacity>
        <Text style={styles.puestoTexto}>{puesto}</Text>
      </View>
      <Image source={{ uri: item.image_url }} style={styles.fotoPost} resizeMode="cover"/>
    </View>
  );
}

// Nos traemos solo los estilos que necesita la tarjeta
const styles = StyleSheet.create({
  tarjetaPost: { 
    backgroundColor: COLORES.tarjeta, 
    marginBottom: 20, 
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#3d4653' 
  },
  cabeceraPost: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  usuarioPost: { flexDirection: 'row', alignItems: 'center' },
  avatarPequeno: { width: 34, height: 34, borderRadius: 17, marginRight: 10, borderWidth: 1, borderColor: COLORES.primario },
  avatarPlaceholder: { width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: '#22272e', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORES.secundario },
  nombreUsuario: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: 'bold' },
  puestoTexto: { color: COLORES.acento, fontSize: 18, fontWeight: '900' },
  fotoPost: { width: '100%', aspectRatio: 4/5, backgroundColor: 'black' },
});