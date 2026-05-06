import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AvatarPlaceholder from './AvatarPlaceholder';
// Necesitarás un paquete de iconos. En Expo se suele usar este:
import { Ionicons } from '@expo/vector-icons'; 
import { COLORES } from '../theme';
import { supabase } from '../supabase'; // Asegúrate de importar tu cliente de Supabase

interface TarjetaPostProps {
  item: any;
  listaRanking: any[];
  onPressUser: (user: string) => void;
  // NUEVO: Necesitamos saber quién es el usuario que está usando la app ahora mismo
  currentUserId: string; 
}

export default function TarjetaPost({ item, listaRanking, onPressUser, currentUserId }: TarjetaPostProps) {
  const username = item.perfiles?.username || 'Anónimo'; 
  const avatar = item.perfiles?.avatar_url;
  
  const indice = listaRanking.findIndex(user => user.id === item.perfil_id);
  const puesto = indice !== -1 ? `#${indice + 1}` : '#-';

  // NUEVO: Estados locales para controlar el Like
  // Idealmente, tu item debería venir de la BD ya con estos datos calculados:
  const [isLiked, setIsLiked] = useState(item.user_has_liked || false);
  const [likeCount, setLikeCount] = useState(item.likes_count || 0);

  // NUEVO: La función mágica
  const handleLike = async () => {
    // 1. Optimistic UI: Cambiamos la interfaz AL INSTANTE
    const prevIsLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevIsLiked);
    setLikeCount(prevIsLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (prevIsLiked) {
        // Ya le había dado like -> Lo borramos de la tabla
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ publicacion_id: item.id, perfil_id: currentUserId });

        if (error) throw error;
      } else {
        // No le había dado like -> Lo insertamos en la tabla
        const { error } = await supabase
          .from('likes')
          .insert({ publicacion_id: item.id, perfil_id: currentUserId });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error al procesar el like:', error);
      // 2. Si algo falla en la BD, deshacemos el cambio visual
      setIsLiked(prevIsLiked);
      setLikeCount(prevCount);
    }
  };

  return (
    <View style={styles.tarjetaPost}>
      <View style={styles.cabeceraPost}>
        <TouchableOpacity style={styles.usuarioPost} onPress={() => onPressUser(item.perfil_id)}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarPequeno} />
          ) : (
            <AvatarPlaceholder size={34} style={{ marginRight: 10 }} />
          )}
          <Text style={styles.nombreUsuario}>{username}</Text>
        </TouchableOpacity>
        <Text style={styles.puestoTexto}>{puesto}</Text>
      </View>
      
      <Image source={{ uri: item.image_url }} style={styles.fotoPost} resizeMode="cover"/>

      {/* NUEVO: Barra de acciones debajo de la foto */}
      <View style={styles.barraAcciones}>
        <TouchableOpacity style={styles.botonAccion} onPress={handleLike}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={28} 
            color={isLiked ? "#ff3040" : COLORES.textoBlanco} 
          />
          <Text style={styles.textoAccion}>
            {likeCount > 0 ? likeCount : ''}
          </Text>
        </TouchableOpacity>
        
        {/* Aquí puedes añadir luego el botón de comentarios */}
        <TouchableOpacity style={styles.botonAccion}>
          <Ionicons name="chatbubble-outline" size={26} color={COLORES.textoBlanco} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjetaPost: { 
    backgroundColor: COLORES.tarjeta, 
    marginBottom: 20, 
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#3d4653' 
  },
  cabeceraPost: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  usuarioPost: { flexDirection: 'row', alignItems: 'center' },
  avatarPequeno: { width: 34, height: 34, borderRadius: 17, marginRight: 10, borderWidth: 1, borderColor: COLORES.primario },
  nombreUsuario: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: 'bold' },
  puestoTexto: { color: COLORES.acento, fontSize: 18, fontWeight: '900' },
  fotoPost: { width: '100%', aspectRatio: 4/5, backgroundColor: 'black' },
  // Estilos para la barra de acciones
  barraAcciones: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  botonAccion: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  textoAccion: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});