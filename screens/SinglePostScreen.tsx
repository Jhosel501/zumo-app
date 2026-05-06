import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../supabase';
import { COLORES } from '../theme';
import TarjetaPost from '../components/TarjetaPost';

interface SinglePostProps {
  foto: any;
  listaRanking: any[];
  onVolver: () => void;
  onPressUser: (userId: string) => void;
  currentUserId: string;
  onPressComment?: (publicacionId: string) => void;
}

export default function SinglePostScreen({ foto, listaRanking, onVolver, onPressUser, currentUserId, onPressComment }: SinglePostProps) {
  const [item, setItem] = useState<any>(foto);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const enrichPost = async () => {
      setCargando(true);
      try {
        const { data: allLikes } = await supabase
          .from('likes')
          .select('publicacion_id, perfil_id')
          .eq('publicacion_id', foto.id);

        const likes = allLikes || [];
        const user_has_liked = likes.some((l: any) => l.perfil_id === currentUserId);
        const likes_count = likes.length;

        const { data: allComments } = await supabase
          .from('comentarios')
          .select('publicacion_id')
          .eq('publicacion_id', foto.id)
          .is('deleted_at', null);

        const comments_count = (allComments || []).length;

        setItem({ ...foto, user_has_liked, likes_count, comments_count });
      } catch {
        setItem(foto);
      } finally {
        setCargando(false);
      }
    };

    enrichPost();
  }, [foto.id]);

  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVolver} style={styles.botonVolver}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke="#FF5B37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.titulo}>Publicación</Text>
        <View style={{ width: 32 }} />
      </View>

      {cargando ? (
        <ActivityIndicator color={COLORES.primario} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingVertical: 15 }}>
          <TarjetaPost
            item={item}
            listaRanking={listaRanking}
            onPressUser={onPressUser}
            currentUserId={currentUserId}
            onPressComment={onPressComment}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta },
  botonVolver: { padding: 5 },
  titulo: { color: COLORES.textoBlanco, fontSize: 18, fontWeight: 'bold' },
});
