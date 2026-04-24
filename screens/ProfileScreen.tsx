import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, RefreshControl, Share } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { COLORES } from '../theme';

// Importamos el molde
import PerfilMolde from '../components/PerfilMolde';

interface ProfileProps {
  session: any;
  onPressFoto: (foto: any) => void;
}

export default function ProfileScreen({ session, onPressFoto }: ProfileProps) {
  const [vistaInterna, setVistaInterna] = useState<'perfil' | 'ajustes'>('perfil');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  
  const [username, setUsername] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [totalZumos, setTotalZumos] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [invitacion, setInvitacion] = useState<{codigo: string, usos: number} | null>(null);

  // --- NUEVOS ESTADOS PARA SEGUIDORES ---
  const [numSeguidores, setNumSeguidores] = useState(0);
  const [numSeguidos, setNumSeguidos] = useState(0);

  const [misFotos, setMisFotos] = useState<any[]>([]);
  const [cargandoFotos, setCargandoFotos] = useState(false);

  const cargarInvitacion = async () => {
    try {
      const { data, error } = await supabase
        .from('invitaciones')
        .select('codigo, usos_restantes')
        .eq('creador_id', session?.user?.id)
        .single();
        
      if (data) {
        console.log("¡Invitación encontrada!", data); // 👈 EL CHIVATO
        setInvitacion({ codigo: data.codigo, usos: data.usos_restantes });
      } else {
        console.log("No encontró nada. Error:", error); // 👈 EL CHIVATO
      }
    } catch (error) {
      console.log("Error en la consulta:", error);
    }
  };

  useEffect(() => {
    if (session) {
      cargarPerfil();
      cargarMisFotos();
      cargarInvitacion();
    }
  }, [session]);

  // Función nativa para abrir el menú de compartir de iOS/Android
  const compartirInvitacion = async () => {
    if (!invitacion) return;
    try {
      await Share.share({
        message: `¡Me han dado acceso a Zumo! Tengo ${invitacion.usos} invitaciones. Pilla la tuya antes de que vuelen: https://zumoapp.es/?code=${invitacion.codigo}`,
      });
    } catch (error) {
      console.log("Error al compartir", error);
    }
  };

  // Función para refrescar datos al tirar hacia abajo en el perfil
  const onRefresh = async () => {
    setRefreshing(true);
    await cargarPerfil();
    await cargarInvitacion(); // 👈 Añade esto
    setRefreshing(false);
  };

  

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      const { data: perfilData } = await supabase.from('perfiles').select(`username, telefono, avatar_url`).eq('id', session.user.id).single();
      const { data: rankingData } = await supabase.from('vista_ranking').select('total_zumos').eq('id', session.user.id).maybeSingle();

      // --- CONTAMOS SEGUIDORES Y SEGUIDOS ---
      // 1. Gente que me sigue a mí
      const { count: seguidoresCount } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguido_id', session.user.id);

      // 2. Gente a la que yo sigo
      const { count: seguidosCount } = await supabase
        .from('seguidores')
        .select('*', { count: 'exact', head: true })
        .eq('seguidor_id', session.user.id);

      if (perfilData) {
        setUsername(perfilData.username || '');
        setTelefono(perfilData.telefono || '');
        setAvatarUrl(perfilData.avatar_url || null);
      }
      if (rankingData) setTotalZumos(rankingData.total_zumos || 0);
      
      // Guardamos los contadores
      setNumSeguidores(seguidoresCount || 0);
      setNumSeguidos(seguidosCount || 0);

    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  const cargarMisFotos = async () => {
    setCargandoFotos(true);
    try {
      const { data, error } = await supabase
        .from('publicaciones')
        .select('*, perfiles (username, avatar_url)')
        .eq('perfil_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMisFotos(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoFotos(false);
    }
  };

  const seleccionarFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso denegado', 'Necesitamos acceso.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) subirAvatar(result.assets[0].uri);
  };

  const subirAvatar = async (uri: string) => {
    setGuardando(true);
    try {
      const fileExt = uri.split('.').pop();
      const fileName = `${session.user.id}_${Date.now()}.${fileExt}`;
      const formData = new FormData();
      formData.append('file', { uri: uri, name: fileName, type: `image/${fileExt === 'png' ? 'png' : 'jpeg'}` } as any);
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, formData);
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('perfiles').update({ avatar_url: publicUrlData.publicUrl }).eq('id', session.user.id);
      
      setAvatarUrl(publicUrlData.publicUrl);
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la foto.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await supabase.from('perfiles').update({ username: username.toLowerCase().trim(), telefono: telefono }).eq('id', session.user.id);
      Alert.alert('Éxito', 'Perfil actualizado.');
      setVistaInterna('perfil');
    } catch (error: any) {
      Alert.alert('Error al guardar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <View style={styles.contenedorCentro}><ActivityIndicator size="large" color={COLORES.primario} /></View>;

  if (vistaInterna === 'ajustes') {
    return (
      <KeyboardAvoidingView style={styles.contenedor} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.headerAjustes}>
          <TouchableOpacity onPress={() => setVistaInterna('perfil')}><Text style={styles.textoVolver}>{'< Volver'}</Text></TouchableOpacity>
          <Text style={styles.tituloHeaderAjustes}>Ajustes</Text>
          <View style={{ width: 60 }} /> 
        </View>
        <ScrollView style={styles.contenidoAjustes}>
          <View style={styles.zonaAvatar}>
            <TouchableOpacity onPress={seleccionarFoto} disabled={guardando}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarGrande} /> : <View style={styles.avatarGrandeVacio}><Text style={{fontSize: 40}}>👤</Text></View>}
              <View style={styles.botonEditarFoto}><Text style={{ color: 'white', fontSize: 12 }}>✏️</Text></View>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Email</Text>
          <TextInput style={[styles.input, styles.inputBloqueado]} value={email} editable={false} />
          <Text style={styles.label}>Usuario</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
          <Text style={styles.label}>Teléfono</Text>
          <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.botonGuardar} onPress={guardarCambios} disabled={guardando}>
            {guardando ? <ActivityIndicator color="white" /> : <Text style={styles.textoBotonGuardar}>Guardar Cambios</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonSalir} onPress={() => supabase.auth.signOut()}>
            <Text style={styles.textoBotonSalir}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <PerfilMolde 
      username={username}
      avatarUrl={avatarUrl}
      totalZumos={totalZumos}
      fotos={misFotos}
      cargandoFotos={cargandoFotos}
      numSeguidores={numSeguidores}
      numSeguidos={numSeguidos}
      esMiPerfil={true} 
      onPressAjustes={() => setVistaInterna('ajustes')}
      onPressFoto={onPressFoto}
      refreshing={refreshing}
      onRefresh={onRefresh}
      invitacion={invitacion}
      onPressInvitar={compartirInvitacion}
    />
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  contenedorCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORES.fondo },
  headerAjustes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta },
  textoVolver: { color: COLORES.acento, fontSize: 16, fontWeight: 'bold' },
  tituloHeaderAjustes: { fontSize: 18, fontWeight: 'bold', color: COLORES.textoBlanco },
  contenidoAjustes: { flex: 1, padding: 20 },
  zonaAvatar: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarGrande: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORES.primario },
  avatarGrandeVacio: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORES.tarjeta, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORES.secundario },
  botonEditarFoto: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORES.primario, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORES.fondo },
  label: { color: COLORES.secundario, fontSize: 14, marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: COLORES.tarjeta, color: COLORES.textoBlanco, padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
  inputBloqueado: { opacity: 0.6, backgroundColor: '#22272e' },
  botonGuardar: { backgroundColor: COLORES.primario, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  textoBotonGuardar: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  botonSalir: { backgroundColor: 'transparent', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: COLORES.secundario },
  textoBotonSalir: { color: COLORES.secundario, fontSize: 16, fontWeight: 'bold' }
});