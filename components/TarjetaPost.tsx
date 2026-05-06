import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AvatarPlaceholder from './AvatarPlaceholder';
import { COLORES } from '../theme';

interface TarjetaPostProps {
  item: any;
  listaRanking: any[];
  onPressUser: (user: string) => void;
  currentUserId: string;
}

function formatTimeAgo(dateString: string): string {
  const diffMs = new Date().getTime() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 60) return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

export default function TarjetaPost({ item, listaRanking, onPressUser }: TarjetaPostProps) {
  const username = item.perfiles?.username || 'Anónimo';
  const avatar = item.perfiles?.avatar_url;

  const indice = listaRanking.findIndex(user => user.id === item.perfil_id);
  const puesto = indice !== -1 ? `#${indice + 1}` : '#-';

  return (
    <View style={styles.tarjetaPost}>

      {/* HEADER: avatar + username | ranking position */}
      <View style={styles.cabeceraPost}>
        <TouchableOpacity style={styles.usuarioPost} onPress={() => onPressUser(item.perfil_id)}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarPequeno} />
          ) : (
            <AvatarPlaceholder size={28} style={{ marginRight: 10 }} />
          )}
          <Text style={styles.nombreUsuario}>{username}</Text>
        </TouchableOpacity>
        <Text style={styles.puestoTexto}>{puesto}</Text>
      </View>

      {/* PHOTO */}
      <Image source={{ uri: item.image_url }} style={styles.fotoPost} resizeMode="cover" />

      {/* FOOTER: likes + comments | time ago */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.accion}>
            <Text style={styles.iconoAccion}>❤️</Text>
            <Text style={styles.countAccion}>0</Text>
          </View>
          <View style={styles.accion}>
            <Text style={styles.iconoAccion}>💬</Text>
            <Text style={styles.countAccion}>0</Text>
          </View>
        </View>
        <Text style={styles.timeAgo}>
          {item.created_at ? formatTimeAgo(item.created_at) : ''}
        </Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  tarjetaPost: {
    backgroundColor: '#000000',
    marginBottom: 2,
  },
  cabeceraPost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  usuarioPost: { flexDirection: 'row', alignItems: 'center' },
  avatarPequeno: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORES.primario,
  },
  nombreUsuario: { color: COLORES.textoBlanco, fontSize: 14, fontWeight: 'bold' },
  puestoTexto: { color: COLORES.acento, fontSize: 15, fontWeight: '900' },
  fotoPost: { width: '100%', aspectRatio: 4 / 5, backgroundColor: 'black' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 14,
  },
  iconoAccion: {
    fontSize: 15,
    marginRight: 4,
  },
  countAccion: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeAgo: {
    color: '#555',
    fontSize: 12,
  },
});
