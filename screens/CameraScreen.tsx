import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../supabase'; 
import { COLORES } from '../theme';

// --- MATEMÁTICAS EXACTAS PARA EL FORMATO 4:5 ---
const ANCHO_PANTALLA = Dimensions.get('window').width;
const ALTO_PANTALLA = Dimensions.get('window').height;

// La zona donde se ve la imagen real debe ser 4:5
const ALTO_ZONA_CLARA = ANCHO_PANTALLA * 1.25; 
// El resto de la pantalla se reparte equitativamente para las sombras
const ALTURA_SOMBRA = (ALTO_PANTALLA - ALTO_ZONA_CLARA) / 2;

interface CameraProps {
  volverAlRanking: () => void;
  alTerminarSubida: () => void;
  userId: string; 
}

export default function CameraScreen({ volverAlRanking, alTerminarSubida, userId }: CameraProps) {
  const camaraRef = useRef<CameraView>(null);
  const [fotoTomada, setFotoTomada] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [tipoCamara, setTipoCamara] = useState<'front' | 'back'>('front');

  const alternarCamara = () => {
    setTipoCamara(actual => (actual === 'back' ? 'front' : 'back'));
  };

  const tomarFoto = async () => {
    if (camaraRef.current && !procesando) {
      setProcesando(true);
      try {
        const photo = await camaraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: false,
        });

        // RECORTE MATEMÁTICO SINCRONIZADO
        // Obtenemos las dimensiones reales del sensor de la cámara del iPhone
        const anchoOriginal = photo.width;
        const altoOriginal = photo.height;

        // Calculamos cuánto debe medir el alto para que el archivo sea 4:5
        const altoDeseado = anchoOriginal * 1.25;
        // Calculamos el punto de inicio para que el recorte sea perfectamente central
        const inicioY = (altoOriginal - altoDeseado) / 2;

        const fotoOptimizada = await manipulateAsync(
          photo.uri,
          [
            { crop: { originX: 0, originY: inicioY, width: anchoOriginal, height: altoDeseado } },
            { resize: { width: 1080 } }
          ],
          { compress: 0.85, format: SaveFormat.JPEG }
        );

        setFotoTomada(fotoOptimizada.uri);
      } catch (error) {
        Alert.alert('Error', 'No se pudo capturar la imagen.');
      } finally {
        setProcesando(false);
      }
    }
  };

  const subirFotoASupabase = async () => {
    if (!fotoTomada) return;
    setSubiendo(true);
    try {
      const fileName = `foto_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', { uri: fotoTomada, name: fileName, type: 'image/jpeg' } as any);

      const { error: storageError } = await supabase.storage.from('fotos_ranking').upload(fileName, formData);
      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage.from('fotos_ranking').getPublicUrl(fileName);

      const { data: ciudadData, error: ciudadError } = await supabase.from('ciudades').select('id').eq('nombre', 'Zaragoza').single();
      if (ciudadError) throw new Error("Ciudad no encontrada.");

      const { error: dbError } = await supabase.from('publicaciones').insert([
        { 
          perfil_id: userId,         
          ciudad_id: ciudadData.id,  
          image_url: publicUrlData.publicUrl, 
          puntos_otorgados: 1.0      
        }
      ]);
      
      if (dbError) throw dbError;
      alTerminarSubida(); 

    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la publicación.");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <View style={styles.contenedorBase}>
      {fotoTomada ? (
        <View style={styles.contenedorCentro}>
          {/* En la previsualización usamos 'contain' para que el usuario vea el resultado final recortado */}
          <Image source={{ uri: fotoTomada }} style={styles.previewFinal} resizeMode="contain" />
          <View style={styles.controlesPost}>
            <TouchableOpacity style={styles.botonSecundario} onPress={() => setFotoTomada(null)} disabled={subiendo}>
              <Text style={styles.textoBoton}>Repetir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botonPrincipal} onPress={subirFotoASupabase} disabled={subiendo}>
              {subiendo ? <ActivityIndicator color="white" /> : <Text style={styles.textoBoton}>Publicar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <CameraView style={StyleSheet.absoluteFillObject} facing={tipoCamara} ref={camaraRef} />
          
          {/* MARCO VISUAL DE TRES BLOQUES (Garantiza sincronización 4:5) */}
          <View style={styles.capaMascara} pointerEvents="none">
            <View style={styles.bloqueSombra} />
            <View style={styles.huecoTransparente} />
            <View style={styles.bloqueSombra} />
          </View>

          {/* CONTROLES FRONTALES */}
          <View style={styles.capaInterfaz}>
            <TouchableOpacity style={styles.botonLateral} onPress={volverAlRanking}>
              <Text style={styles.iconoBoton}>✕</Text>
            </TouchableOpacity>
            
            {procesando ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <TouchableOpacity style={styles.disparador} onPress={tomarFoto} />
            )}
            
            <TouchableOpacity style={styles.botonLateral} onPress={alternarCamara}>
              <Text style={styles.iconoBoton}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedorBase: { flex: 1, backgroundColor: 'black' },
  contenedorCentro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Estilo de la Máscara
  capaMascara: { ...StyleSheet.absoluteFillObject, justifyContent: 'center' },
  bloqueSombra: { height: ALTURA_SOMBRA, backgroundColor: 'rgba(0,0,0,0.6)' },
  huecoTransparente: { height: ALTO_ZONA_CLARA, backgroundColor: 'transparent' },

  // Interfaz de Cámara
  capaInterfaz: { 
    position: 'absolute', 
    bottom: 0, 
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 30, 
    paddingBottom: 60,
    zIndex: 10 
  },
  disparador: { width: 74, height: 74, borderRadius: 37, backgroundColor: 'white', borderWidth: 5, borderColor: 'rgba(255,255,255,0.3)' },
  botonLateral: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  iconoBoton: { color: 'white', fontSize: 22, fontWeight: 'bold' },

  // Previsualización Post-Captura
  previewFinal: { width: ANCHO_PANTALLA, height: ALTO_ZONA_CLARA, backgroundColor: 'black' },
  controlesPost: { flexDirection: 'row', padding: 25, width: '100%', justifyContent: 'space-between' },
  botonPrincipal: { backgroundColor: COLORES.primario, padding: 18, borderRadius: 30, flex: 1, marginLeft: 10, alignItems: 'center' },
  botonSecundario: { backgroundColor: COLORES.tarjeta, padding: 18, borderRadius: 30, flex: 1, marginRight: 10, alignItems: 'center' },
  textoBoton: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});