import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, RefreshControl, Share, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import { COLORES } from '../theme';

// Importamos el molde
import PerfilMolde from '../components/PerfilMolde';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

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

  const [telefonoOriginal, setTelefonoOriginal] = useState('');
  const [telefonoParaVerificar, setTelefonoParaVerificar] = useState('');
  const [mostrarModalOTP, setMostrarModalOTP] = useState(false);
  const [codigoOTP, setCodigoOTP] = useState('');
  const [verificando, setVerificando] = useState(false);

  const cargarInvitacion = async () => {
    try {
      const { data, error } = await supabase
        .from('invitaciones')
        .select('codigo, usos_restantes')
        .eq('creador_id', session?.user?.id)
        .single();
        
      if (data) {
        setInvitacion({ codigo: data.codigo, usos: data.usos_restantes });
      } else {
        console.log("No encontró nada. Error:", error);
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
    await cargarInvitacion();
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
        setTelefonoOriginal(perfilData.telefono || '');
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

  const normalizarTelefono = (tel: string): string => {
    const limpio = tel.replace(/[\s\-().]/g, '');
    if (limpio.startsWith('+')) return limpio;
    if (limpio.startsWith('0034')) return '+34' + limpio.slice(4);
    if (/^[679]/.test(limpio)) return '+34' + limpio;
    return limpio;
  };

  const guardarCambios = async () => {
    setGuardando(true);
    try {
      await supabase.from('perfiles')
        .update({ username: username.toLowerCase().trim() })
        .eq('id', session.user.id);

      const telefonoNormalizado = normalizarTelefono(telefono.trim());
      const telefonoNormalizadoOriginal = normalizarTelefono(telefonoOriginal.trim());

      if (telefono.trim() && telefonoNormalizado !== telefonoNormalizadoOriginal) {
        const { error } = await supabase.auth.updateUser({ phone: telefonoNormalizado });
        if (error) throw error;
        setTelefonoParaVerificar(telefonoNormalizado);
        setMostrarModalOTP(true);
      } else {
        Alert.alert('Éxito', 'Perfil actualizado.');
        setVistaInterna('perfil');
      }
    } catch (error: any) {
      Alert.alert('Error al guardar', error.message);
    } finally {
      setGuardando(false);
    }
  };

  const verificarOTP = async () => {
    setVerificando(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: telefonoParaVerificar,
        token: codigoOTP,
        type: 'phone_change',
      });
      if (error) throw error;

      await supabase.from('perfiles')
        .update({ telefono: telefonoParaVerificar })
        .eq('id', session.user.id);

      setTelefonoOriginal(telefonoParaVerificar);
      setMostrarModalOTP(false);
      setCodigoOTP('');
      Alert.alert('Éxito', 'Teléfono verificado correctamente.');
      setVistaInterna('perfil');
    } catch (error: any) {
      Alert.alert('Código incorrecto', error.message);
    } finally {
      setVerificando(false);
    }
  };

  if (cargando) return <View style={styles.contenedorCentro}><ActivityIndicator size="large" color={COLORES.primario} /></View>;

  if (vistaInterna === 'ajustes') {
    return (
      <KeyboardAvoidingView style={styles.contenedor} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.headerAjustes}>
          <TouchableOpacity onPress={() => setVistaInterna('perfil')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18l-6-6 6-6" stroke="#FF5B37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </TouchableOpacity>
          <Text style={styles.tituloHeaderAjustes}>Ajustes</Text>
          <View style={{ width: 60 }} /> 
        </View>
        <ScrollView style={styles.contenidoAjustes}>
          <View style={styles.zonaAvatar}>
            <TouchableOpacity onPress={seleccionarFoto} disabled={guardando}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarGrande} /> : <AvatarPlaceholder size={100} />}
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

        <Modal visible={mostrarModalOTP} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitulo}>Verificar teléfono</Text>
              <Text style={styles.modalSubtitulo}>
                Hemos enviado un código SMS a {telefonoParaVerificar}
              </Text>
              <TextInput
                style={styles.inputOTP}
                value={codigoOTP}
                onChangeText={setCodigoOTP}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={COLORES.secundario}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.botonVerificar, codigoOTP.length < 6 && { opacity: 0.5 }]}
                onPress={verificarOTP}
                disabled={verificando || codigoOTP.length < 6}
              >
                {verificando
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.textoBotonGuardar}>Verificar</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setMostrarModalOTP(false); setCodigoOTP(''); }}>
                <Text style={styles.textoCancelarModal}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  contenedor: { flex: 1, backgroundColor: '#000000' },
  contenedorCentro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  headerAjustes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta, backgroundColor: '#000000' },
  textoVolver: { color: COLORES.acento, fontSize: 16, fontWeight: 'bold' },
  tituloHeaderAjustes: { fontSize: 18, fontWeight: 'bold', color: COLORES.textoBlanco },
  contenidoAjustes: { flex: 1, padding: 20, backgroundColor: '#000000' },
  zonaAvatar: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarGrande: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORES.primario },
  botonEditarFoto: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORES.primario, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORES.fondo },
  label: { color: COLORES.secundario, fontSize: 14, marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: COLORES.tarjeta, color: COLORES.textoBlanco, padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
  inputBloqueado: { opacity: 0.6, backgroundColor: '#22272e' },
  botonGuardar: { backgroundColor: COLORES.primario, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  textoBotonGuardar: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  botonSalir: { backgroundColor: 'transparent', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: COLORES.secundario },
  textoBotonSalir: { color: COLORES.secundario, fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalCard: { backgroundColor: COLORES.tarjeta, borderRadius: 16, padding: 25, width: '100%' },
  modalTitulo: { color: COLORES.textoBlanco, fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSubtitulo: { color: COLORES.secundario, fontSize: 14, marginBottom: 25, textAlign: 'center' },
  inputOTP: { backgroundColor: '#000000', color: COLORES.textoBlanco, padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 28, textAlign: 'center', letterSpacing: 10 },
  botonVerificar: { backgroundColor: COLORES.primario, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  textoCancelarModal: { color: COLORES.secundario, textAlign: 'center', fontSize: 15 },
});