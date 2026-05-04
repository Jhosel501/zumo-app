import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, PanResponder } from 'react-native';
import { supabase } from '../supabase';
import { COLORES } from '../theme';
import PerfilMolde from '../components/PerfilMolde';


interface PublicProfileProps {
  userId: string;
  onVolver: () => void;
  onPressFoto: (foto: any) => void;
}

export default function PublicProfileScreen({ userId, onVolver, onPressFoto }: PublicProfileProps) {
  const [cargando, setCargando] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalZumos, setTotalZumos] = useState(0);
  const [numSeguidores, setNumSeguidores] = useState(0);
  const [numSeguidos, setNumSeguidos] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const [fotosUsuario, setFotosUsuario] = useState<any[]>([]);
  const [cargandoFotos, setCargandoFotos] = useState(false);

  // --- ESTADOS PARA EL SISTEMA DE SEGUIDORES ---
  const [loSigo, setLoSigo] = useState(false);
  const [cargandoSeguimiento, setCargandoSeguimiento] = useState(false);
  const [miUserId, setMiUserId] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      // 1. ¿Debe React Native hacerle caso a este movimiento?
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Solo activamos si el gesto va hacia la derecha (dx > 20) 
        // y empezó en el borde izquierdo de la pantalla (x0 < 50)
        return gestureState.dx > 20 && gestureState.x0 < 50;
      },
      // 2. ¿Qué pasa cuando el usuario levanta el dedo?
      onPanResponderRelease: (evt, gestureState) => {
        // Si ha arrastrado más de 80 píxeles, disparamos la función de volver
        if (gestureState.dx > 80) {
          onVolver();
        }
      },
    })
  ).current;

  useEffect(() => {
    cargarDatosAmigo();
  }, [userId]);

  // Función para refrescar los datos al tirar del RefreshControl en el perfil
  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatosAmigo();
    setRefreshing(false);
  };

  const cargarDatosAmigo = async () => {
    setCargando(true);
    setCargandoFotos(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setMiUserId(currentUserId);

      // 1. Cargamos datos básicos y fotos del usuario
      const { data: perfilData } = await supabase.from('perfiles').select('username, avatar_url').eq('id', userId).single();
      const { data: rankingData } = await supabase.from('vista_ranking').select('total_zumos').eq('id', userId).maybeSingle();
      const { data: fotosData } = await supabase.from('publicaciones').select('*, perfiles (username, avatar_url)').eq('perfil_id', userId).order('created_at', { ascending: false });

      // 2. CONTAMOS SEGUIDORES (Gente que le sigue a él)
      const { count: seguidoresCount } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguido_id', userId);

      // 3. CONTAMOS SEGUIDOS (Gente a la que él sigue)
      const { count: seguidosCount } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguidor_id', userId);

      // 4. Comprobamos si yo lo sigo (para el botón)
      if (currentUserId) {
        const { data: seguimientoData } = await supabase
          .from('seguidores')
          .select('id')
          .eq('seguidor_id', currentUserId)
          .eq('seguido_id', userId)
          .maybeSingle();
        
        if (seguimientoData) setLoSigo(true);
      }

      if (perfilData) {
        setUsername(perfilData.username || '');
        setAvatarUrl(perfilData.avatar_url || null);
      }
      setTotalZumos(rankingData?.total_zumos || 0);
      setNumSeguidores(seguidoresCount || 0);
      setNumSeguidos(seguidosCount || 0);
      if (fotosData) setFotosUsuario(fotosData);

    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
      setCargandoFotos(false);
    }
  };

  // --- FUNCIÓN PARA EL BOTÓN DE SEGUIR ---
  const manejarPresionarSeguimiento = async () => {
    if (!miUserId) return;
    setCargandoSeguimiento(true);

    try {
      if (loSigo) {
        // Dejar de seguir
        const { error } = await supabase
          .from('seguidores')
          .delete()
          .eq('seguidor_id', miUserId)
          .eq('seguido_id', userId);

        if (error) throw error;
        setLoSigo(false);
      } else {
        // Seguir
        const { error } = await supabase
          .from('seguidores')
          .insert({ seguidor_id: miUserId, seguido_id: userId });

        if (error) throw error;
        setLoSigo(true);
      }
    } catch (error) {
      console.error("Error al cambiar estado de seguimiento:", error);
    } finally {
      setCargandoSeguimiento(false);
    }
  };

  if (cargando) return <View style={styles.contenedorCentro}><ActivityIndicator size="large" color={COLORES.primario} /></View>;

  return (
    <View style={styles.contenedor}{...panResponder.panHandlers}>
      {/* BOTÓN DE VOLVER */}
      <View style={styles.headerNavegacion}>
        <TouchableOpacity onPress={onVolver} style={styles.botonVolver}>
          <Text style={styles.textoVolver}>{'< Volver'}</Text>
        </TouchableOpacity>
      </View>

      <PerfilMolde 
        username={username}
        avatarUrl={avatarUrl}
        totalZumos={totalZumos}
        numSeguidores={numSeguidores}
        numSeguidos={numSeguidos}
        fotos={fotosUsuario}
        cargandoFotos={cargandoFotos}
        esMiPerfil={false}
        onPressFoto={onPressFoto}
        loSigo={loSigo}
        onPressSeguimiento={manejarPresionarSeguimiento}
        cargandoSeguimiento={cargandoSeguimiento}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  contenedorCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORES.fondo },
  headerNavegacion: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5, backgroundColor: COLORES.fondo },
  botonVolver: { paddingVertical: 10 },
  textoVolver: { color: COLORES.acento, fontSize: 16, fontWeight: 'bold' },
});