import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AvatarPlaceholder from './AvatarPlaceholder';
import { COLORES } from '../theme';
import { supabase } from '../supabase';

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

export default function TarjetaPost({ item, listaRanking, onPressUser, currentUserId }: TarjetaPostProps) {
  const username = item.perfiles?.username || 'Anónimo';
  const avatar = item.perfiles?.avatar_url;

  const indice = listaRanking.findIndex(user => user.id === item.perfil_id);
  const puesto = indice !== -1 ? `#${indice + 1}` : '#-';

  const [isLiked, setIsLiked] = useState<boolean>(item.user_has_liked ?? false);
  const [likesCount, setLikesCount] = useState<number>(item.likes_count ?? 0);

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (prevLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ publicacion_id: item.id, perfil_id: currentUserId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ publicacion_id: item.id, perfil_id: currentUserId });
        if (error) throw error;
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  return (
    <View style={styles.tarjetaPost}>

      {/* HEADER */}
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

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>

          {/* LIKE BUTTON */}
          <TouchableOpacity style={styles.accion} onPress={handleLike}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              {isLiked ? (
                <Path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="#FF5B37"
                />
              ) : (
                <Path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="none"
                  stroke="#FF5B37"
                  strokeWidth="2"
                />
              )}
            </Svg>
            {likesCount > 0 && <Text style={styles.countAccion}>{likesCount}</Text>}
          </TouchableOpacity>

          {/* COMMENT ICON (static) */}
          <View style={styles.accion}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                fill="none"
                stroke="#666"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
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
  countAccion: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  timeAgo: {
    color: '#555',
    fontSize: 12,
  },
});
