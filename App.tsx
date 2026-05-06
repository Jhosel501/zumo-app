import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { supabase } from './supabase';
import { COLORES } from './theme';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


// Importamos tus componentes y pantallas
import Footer from './components/Footer';
import RankingScreen from './screens/RankingScreen';
import CameraScreen from './screens/CameraScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileScreen from './screens/ProfileScreen';
import FeedScreen from './screens/FeedScreen';
import PublicProfileScreen from './screens/PublicProfileScreen';
import SinglePostScreen from './screens/SinglePostScreen';
import SearchScreen from './screens/SearchScreen';
import CommentsScreen from './screens/CommentsScreen';


export default function App() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [vistaActual, setVistaActual] = useState<'feed' | 'ranking' | 'camara' | 'search' | 'perfil' | 'perfilPublico' | 'fotoDetalle' | 'comentarios'>('feed'); //Cambiar si se añade nueva vista accesible desde el footer
  
  // Variables para recordar a quién visitamos y de dónde venimos
  const [usuarioVisitado, setUsuarioVisitado] = useState<string | null>(null);
  const [vistaAnterior, setVistaAnterior] = useState<'feed' | 'ranking'>('feed');

  // Variables para el detalle de la foto
  const [fotoSeleccionada, setFotoSeleccionada] = useState<any>(null);
  const [vistaAnteriorFoto, setVistaAnteriorFoto] = useState<'perfil' | 'perfilPublico'>('perfil');
  const [postComentarios, setPostComentarios] = useState<string | null>(null);

  const irAComentarios = (publicacionId: string) => {
    setPostComentarios(publicacionId);
    setVistaActual('comentarios');
  };

  // Función inteligente para navegar a los perfiles
  const irAPerfil = (userId: string) => {
    if (userId === session.user.id) {
      setVistaActual('perfil'); // Si haces clic en tu propia foto, vas a tu perfil editable
    } else {
      // Guardamos si veníamos del feed o del ranking para el botón de volver
      setVistaAnterior(vistaActual === 'ranking' ? 'ranking' : 'feed');
      setUsuarioVisitado(userId);
      setVistaActual('perfilPublico');
    }
  };

  // Función que ejecuta el clic
  const abrirDetalleFoto = (foto: any, origen: 'perfil' | 'perfilPublico') => {
    setFotoSeleccionada(foto);
    setVistaAnteriorFoto(origen);
    setVistaActual('fotoDetalle');
  };
  

  // --- Cargador de Fuentes ---
  const [fuentesCargadas] = useFonts({
    // El nombre de la izquierda es como la llamarás en tu código.
    // La ruta de la derecha es donde guardaste el archivo físico.
    'FuentePrincipal': require('./assets/fonts/Satoshi-Regular.otf'),
    'FuentePrincipal-Italic': require('./assets/fonts/Satoshi-VariableItalic.ttf'),
  });

  // Estados para el feed (si decides mostrarlo en la app)
  const [listaFeed, setListaFeed] = useState<any[]>([]);
  const [cargandoFeed, setCargandoFeed] = useState(false);
  // Estados para la paginación del feed
  const [cargandoMas, setCargandoMas] = useState(false);
  const [hayMasFotos, setHayMasFotos] = useState(true);
  const [paginaActual, setPaginaActual] = useState(0);
  const FOTOS_POR_PAGINA = 5; // cantidad de fotos que cargamos cada vez que pedimos más (ajustable)

  // Estado para controlar si el usuario está logueado
  const [session, setSession] = useState<any>(null);
  const [cargandoSession, setCargandoSession] = useState(true);
  
  // Estado global de los datos
  const [listaRanking, setListaRanking] = useState<any[]>([]);
  const [cargandoRanking, setCargandoRanking] = useState(false);

  // Comprobar la sesión al abrir la app y escuchar cambios de autenticación
  useEffect(() => {
    // Miramos si ya estaba logueado de antes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargandoSession(false);
      cargarFeed(true); // Cargamos el feed desde el principio (resetear=true) para mostrar algo aunque no haya sesión, y que no se quede en blanco
    });

    // Nos quedamos escuchando por si inicia sesión o se sale
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // Si detectamos el evento de Inicio o Cierre de sesión, 
      // forzamos el enrutador para que vuelva a la casilla de salida (Ranking)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setVistaActual('ranking');
      }
    });

    // Buena práctica de React: Limpiar el escuchador si la app se cierra
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const cargarRanking = async () => {
    setCargandoRanking(true);
    try {
      // Ahora leemos directamente de la tabla virtual que hace las sumas
      const { data, error } = await supabase
        .from('vista_ranking') 
        .select('*');

      if (error) throw error;
      setListaRanking(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoRanking(false);
    }
  };

  const cargarFeed = async (resetear = false) => {

    // Si no hay sesión todavía, no intentes cargar nada
    if (!session || !session.user) return;

    // Si ya estamos buscando datos, o si ya no quedan más fotos en el servidor, no hacemos nada
    if (!resetear && (!hayMasFotos || cargandoMas)) return;

    // Calculamos el rango de fotos que queremos pedir (Ej: de la 0 a la 4, de la 5 a la 9...)
    const offset = resetear ? 0 : (paginaActual + 1) * FOTOS_POR_PAGINA;
    const limit = offset + FOTOS_POR_PAGINA - 1;

    if (resetear) {
      setCargandoFeed(true);
      setHayMasFotos(true);
      setPaginaActual(0);
    } else {
      setCargandoMas(true);
    }

    try {
      // --- EL NUEVO MOTOR HÍBRIDO (WATERFALL) ---
      const { data, error } = await supabase
        .rpc('obtener_feed_hibrido', {
          p_usuario_id: session.user.id,
          offset_num: offset,
          limit_num: FOTOS_POR_PAGINA
        })

      if (error) throw error;

      // Enrich feed items with likes data (user_has_liked + likes_count)
      let feedData: any[] = data ?? [];
      if (feedData.length > 0) {
        const postIds = feedData.map((p: any) => p.id);
        const { data: allLikes } = await supabase
          .from('likes')
          .select('publicacion_id, perfil_id')
          .in('publicacion_id', postIds);

        const likedSet = new Set(
          (allLikes || [])
            .filter((l: any) => l.perfil_id === session.user.id)
            .map((l: any) => l.publicacion_id)
        );
        const countMap: Record<string, number> = {};
        (allLikes || []).forEach((l: any) => {
          countMap[l.publicacion_id] = (countMap[l.publicacion_id] || 0) + 1;
        });
        const { data: allComments } = await supabase
          .from('comentarios')
          .select('publicacion_id')
          .in('publicacion_id', postIds)
          .is('deleted_at', null);

        const commentCountMap: Record<string, number> = {};
        (allComments || []).forEach((c: any) => {
          commentCountMap[c.publicacion_id] = (commentCountMap[c.publicacion_id] || 0) + 1;
        });

        feedData = feedData.map((item: any) => ({
          ...item,
          user_has_liked: likedSet.has(item.id),
          likes_count: countMap[item.id] ?? 0,
          comments_count: commentCountMap[item.id] ?? 0,
        }));
      }

      // Mark posts as seen in the background
      if (feedData.length > 0) {
        const registrosVistas = feedData.map((foto: any) => ({
          usuario_id: session.user.id,
          publicacion_id: foto.id
        }));
        supabase.from('vistas_feed')
          .upsert(registrosVistas, { onConflict: 'usuario_id, publicacion_id' })
          .then();
      }

      if (feedData.length < FOTOS_POR_PAGINA) {
        setHayMasFotos(false);
      }

      if (resetear) {
        setListaFeed(feedData);
      } else {
        setListaFeed(prev => {
          const listaCombinada = [...prev, ...feedData];
          const listaPurificada = Array.from(
            new Map(listaCombinada.map(item => [item.id, item])).values()
          );
          return listaPurificada;
        });
        setPaginaActual(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoFeed(false);
      setCargandoMas(false);
    }
  };

  // Solo cargamos el ranking si hay sesión iniciada
  useEffect(() => {
    if (session) {
      cargarRanking();
      cargarFeed();
    }
  }, [session]);

  // Pantalla de carga mientras comprobamos si está logueado
  if (cargandoSession) {
    return (
      <View style={[styles.contenedorCentro, { backgroundColor: COLORES.fondo }]}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  // Si no hay sesión, le mostramos la puerta (Login)
  if (!session) {
    return <AuthScreen />;
  }

  // Si las fuentes aún no han cargado en la memoria, mostramos pantalla de carga
  if (!fuentesCargadas) {
    return (
      <View style={[styles.contenedorCentro, { backgroundColor: COLORES.fondo }]}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  // --- SEGURIDAD DE PERMISOS ---
  if (!permiso) return <View style={styles.contenedorCentro} />;
  if (!permiso.granted) {
    return (
      <View style={styles.contenedorCentro}>
        <Text style={styles.textoPermiso}>Necesitamos tu cámara para el ranking.</Text>
        <TouchableOpacity style={styles.botonPermiso} onPress={pedirPermiso}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- EL ESQUELETO (Para usuarios logueados) ---
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: vistaActual === 'camara' ? 'black' : COLORES.fondo }}>

        <StatusBar barStyle="light-content" backgroundColor={COLORES.fondo} />
        
        {vistaActual === 'camara' ? (
          <CameraScreen 
            volverAlRanking={() => setVistaActual('feed')} // Al hacer foto, volvemos al inicio
            alTerminarSubida={() => {
              setVistaActual('feed');
              cargarRanking(); 
              cargarFeed(); // Recargamos para que vea su foto recién subida
            }}
            userId={session.user.id} 
          />

        ) : vistaActual === 'fotoDetalle' && fotoSeleccionada ? (
          <View style={{ flex: 1 }}>
            <SinglePostScreen 
              foto={fotoSeleccionada}
              listaRanking={listaRanking}
              onVolver={() => setVistaActual(vistaAnteriorFoto)}
              onPressUser={irAPerfil}
            />
          </View>

        ) : vistaActual === 'perfil' ? (
          <View style={{ flex: 1 }}>
            <ProfileScreen 
              session={session} 
              // Conectamos el clic de tu cuadrícula
              onPressFoto={(foto) => abrirDetalleFoto(foto, 'perfil')} 
            />
            <Footer vistaActual={vistaActual} setVistaActual={setVistaActual} />
          </View>

        ) : vistaActual === 'ranking' ? ( 
          <View style={{ flex: 1 }}>
            <RankingScreen 
              listaRanking={listaRanking} 
              cargandoRanking={cargandoRanking} 
              // Opcional: Si quieres que desde el ranking también se pueda ir al perfil
              // onPressUser={irAPerfil} 
            />
            <Footer vistaActual={vistaActual} setVistaActual={setVistaActual} />
          </View>

        ) : vistaActual === 'perfilPublico' ? (
          <View style={{ flex: 1 }}>
            <PublicProfileScreen 
              userId={usuarioVisitado || ''} 
              onVolver={() => setVistaActual(vistaAnterior)}
              // Conectamos el clic de la cuadrícula de tu amigo
              onPressFoto={(foto) => abrirDetalleFoto(foto, 'perfilPublico')} 
            />
            <Footer vistaActual={vistaAnterior} setVistaActual={setVistaActual} />
          </View>

        ) : vistaActual === 'search' ? (
          <View style={{ flex: 1 }}>
            {/* Ojo: asegúrate de tener importado SearchScreen arriba */}
            <SearchScreen onPressUser={(userId) => irAPerfil(userId)}/> 
            <Footer vistaActual={vistaActual} setVistaActual={setVistaActual} />
          </View>

        ) : vistaActual === 'comentarios' && postComentarios ? (
          <View style={{ flex: 1 }}>
            <CommentsScreen
              publicacionId={postComentarios}
              currentUserId={session.user.id}
              onVolver={() => setVistaActual('feed')}
            />
          </View>

        ) : ( // RUTA POR DEFECTO (FEED)
          <View style={{ flex: 1 }}>
            <FeedScreen
              listaFeed={listaFeed}
              listaRanking={listaRanking}
              cargandoFeed={cargandoFeed}
              cargarMas={(reset) => cargarFeed(reset)}
              cargandoMas={cargandoMas}
              hayMasFotos={hayMasFotos}
              onPressUser={irAPerfil}
              currentUserId={session.user.id}
              onPressComment={irAComentarios}
            />
            <Footer vistaActual={vistaActual} setVistaActual={setVistaActual} />
          </View>
        )}

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  contenedorCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORES.fondo },
  textoPermiso: { textAlign: 'center', marginBottom: 20, color: COLORES.textoBlanco, fontSize: 16 },
  botonPermiso: { backgroundColor: COLORES.primario, padding: 15, borderRadius: 10 }
});