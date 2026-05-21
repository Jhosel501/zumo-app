import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Dimensions, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AvatarPlaceholder from './AvatarPlaceholder';
import { COLORES } from '../theme';
import { supabase } from '../supabase';

interface TarjetaPostProps {
  item: any;
  listaRanking: any[];
  onPressUser: (user: string) => void;
  currentUserId: string;
  onPressComment?: (publicacionId: string) => void;
}

function formatTimeAgo(dateString: string): string {
  try {
    const normalized = dateString.replace(' ', 'T').replace(/(\+\d{2}:\d{2}|Z)?$/, 'Z');
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '';
    const diffMs = new Date().getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${days}d`;
  } catch {
    return '';
  }
}

export default function TarjetaPost({ item, listaRanking, onPressUser, currentUserId, onPressComment }: TarjetaPostProps) {
  const username = item.perfiles?.username || 'Anónimo';
  const avatar = item.perfiles?.avatar_url;

  const indice = listaRanking.findIndex(user => user.id === item.perfil_id);
  const puesto = indice !== -1 ? `#${indice + 1}` : '#-';

  const menuButtonRef = useRef<View>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [denunciarVisible, setDenunciarVisible] = useState(false);

  const handleMenuPress = () => {
    menuButtonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setMenuPos({
        top: pageY + height + 4,
        right: Dimensions.get('window').width - pageX - width,
      });
      setMenuVisible(true);
    });
  };
  const enviarReporte = async (motivo: string) => {
    console.log('[Reporte] Iniciando reporte:', { reportador_id: currentUserId, publicacion_id: item.id, motivo });

    const { data: existente, error: errorExistente } = await supabase
      .from('reportes')
      .select('id')
      .match({ reportador_id: currentUserId, publicacion_id: item.id })
      .eq('estado', 'pendiente')
      .maybeSingle();

    if (errorExistente) {
      console.error('[Reporte] Error comprobando duplicado:', errorExistente);
    }

    if (existente) {
      console.log('[Reporte] Ya existe un reporte previo:', existente);
      Alert.alert('Ya reportaste esta publicación');
      return;
    }

    const { data, error } = await supabase.from('reportes').insert({
      reportador_id: currentUserId,
      publicacion_id: item.id,
      motivo,
      estado: 'pendiente',
      tipo: 'publicacion',
    });

    if (error) {
      console.error('[Reporte] Error insertando reporte:', error);
    } else {
      console.log('[Reporte] Reporte insertado correctamente:', data);
      Alert.alert('Reporte enviado', 'Revisaremos el contenido en breve.');
    }
  };

  const handleDenunciar = () => {
    setMenuVisible(false);
    setDenunciarVisible(true);
  };

  const [isLiked, setIsLiked] = useState<boolean>(item.user_has_liked ?? false);
  const [likesCount, setLikesCount] = useState<number>(item.likes_count ?? 0);
  const commentsCount: number = item.comments_count ?? 0;

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
          <Text style={styles.puestoTexto}>{puesto}</Text>
        </TouchableOpacity>

        <View ref={menuButtonRef} collapsable={false}>
          <TouchableOpacity onPress={handleMenuPress} style={styles.menuBoton}>
            <Text style={styles.menuPuntos}>⋯</Text>
          </TouchableOpacity>
        </View>

        <Modal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.menuOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.menuDropdown, { top: menuPos.top, right: menuPos.right }]}>
                  <TouchableOpacity onPress={handleDenunciar} style={styles.menuOpcion}>
                    <Text style={styles.menuDenunciar}>Denunciar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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

          {/* COMMENT ICON */}
          <TouchableOpacity style={styles.accion} onPress={() => onPressComment?.(item.id)}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                fill="none"
                stroke="#666"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </Svg>
            {commentsCount > 0 && <Text style={styles.countAccion}>{commentsCount}</Text>}
          </TouchableOpacity>

        </View>
        <Text style={styles.timeAgo}>
          {item.created_at ? formatTimeAgo(item.created_at) : ''}
        </Text>
      </View>

      {/* DENUNCIAR MODAL */}
      <Modal transparent visible={denunciarVisible} animationType="fade" onRequestClose={() => setDenunciarVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setDenunciarVisible(false)}>
          <View style={styles.denunciarOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.denunciarCard}>
                <Text style={styles.denunciarTitulo}>Denunciar publicación</Text>
                <Text style={styles.denunciarSubtitulo}>¿Por qué quieres denunciar?</Text>

                {(['Contenido inapropiado', 'Spam', 'Acoso', 'Otro'] as const).map((motivo) => (
                  <TouchableOpacity
                    key={motivo}
                    style={styles.denunciarOpcion}
                    onPress={() => { setDenunciarVisible(false); enviarReporte(motivo); }}
                  >
                    <Text style={styles.denunciarOpcionTexto}>{motivo}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.denunciarCancelar} onPress={() => setDenunciarVisible(false)}>
                  <Text style={styles.denunciarCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  puestoTexto: { color: COLORES.acento, fontSize: 13, fontWeight: '900', marginLeft: 6 },
  menuBoton: { paddingHorizontal: 8, paddingVertical: 4 },
  menuPuntos: { color: '#888', fontSize: 20, letterSpacing: 2 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  menuDropdown: {
    position: 'absolute',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 12,
  },
  menuOpcion: { paddingVertical: 13, paddingHorizontal: 18 },
  menuDenunciar: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },
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
  denunciarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  denunciarCard: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },
  denunciarTitulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  denunciarSubtitulo: {
    color: '#555',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  denunciarOpcion: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  denunciarOpcionTexto: {
    color: '#FF5B37',
    fontSize: 15,
  },
  denunciarCancelar: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 2,
    borderTopColor: '#222',
    alignItems: 'center',
  },
  denunciarCancelarTexto: {
    color: '#555',
    fontSize: 15,
  },
});
