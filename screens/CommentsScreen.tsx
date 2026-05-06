import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../supabase';
import { COLORES } from '../theme';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

interface CommentsScreenProps {
  publicacionId: string;
  currentUserId: string;
  onVolver: () => void;
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

export default function CommentsScreen({ publicacionId, currentUserId, onVolver }: CommentsScreenProps) {
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    cargarComentarios();
  }, [publicacionId]);

  const cargarComentarios = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('comentarios')
      .select('id, texto, created_at, perfiles(username, avatar_url)')
      .eq('publicacion_id', publicacionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    setComentarios(data ?? []);
    setCargando(false);
  };

  const enviarComentario = async () => {
    const trimmed = texto.trim();
    if (!trimmed || enviando) return;
    setEnviando(true);
    const { error } = await supabase
      .from('comentarios')
      .insert({ publicacion_id: publicacionId, perfil_id: currentUserId, texto: trimmed });
    if (!error) {
      setTexto('');
      await cargarComentarios();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setEnviando(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVolver} style={styles.botonVolver}>
          <Text style={styles.textoVolver}>{'< Volver'}</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Comentarios</Text>
        <View style={{ width: 70 }} />
      </View>

      {/* COMMENT LIST */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator color={COLORES.primario} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={comentarios}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centrado}>
              <Text style={styles.textoVacio}>Sé el primero en comentar</Text>
            </View>
          }
          renderItem={({ item }) => {
            const perfil = item.perfiles ?? {};
            return (
              <View style={styles.filaComentario}>
                {perfil.avatar_url ? (
                  <Image source={{ uri: perfil.avatar_url }} style={styles.avatar} />
                ) : (
                  <AvatarPlaceholder size={36} style={styles.avatarMargen} />
                )}
                <View style={styles.contenidoComentario}>
                  <Text style={styles.usernameComentario}>{perfil.username || 'usuario'}</Text>
                  <Text style={styles.textoComentario}>{item.texto}</Text>
                </View>
                <Text style={styles.tiempoComentario}>
                  {item.created_at ? formatTimeAgo(item.created_at) : ''}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* INPUT ROW */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Añade un comentario..."
          placeholderTextColor={COLORES.secundario}
          value={texto}
          onChangeText={setTexto}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.botonEnviar, (!texto.trim() || enviando) && styles.botonEnviarDisabled]}
          onPress={enviarComentario}
          disabled={!texto.trim() || enviando}
        >
          {enviando ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.textoEnviar}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.tarjeta,
  },
  botonVolver: { padding: 5 },
  textoVolver: { color: COLORES.acento, fontSize: 16, fontWeight: 'bold' },
  titulo: { color: COLORES.textoBlanco, fontSize: 17, fontWeight: 'bold' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  textoVacio: { color: COLORES.secundario, fontSize: 15 },
  lista: { padding: 15, paddingBottom: 10 },
  filaComentario: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarMargen: { marginRight: 10 },
  contenidoComentario: { flex: 1, marginRight: 10 },
  usernameComentario: {
    color: COLORES.textoBlanco,
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 3,
  },
  textoComentario: { color: '#cccccc', fontSize: 14, lineHeight: 19 },
  tiempoComentario: { color: COLORES.secundario, fontSize: 11, marginTop: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: COLORES.tarjeta,
    backgroundColor: COLORES.fondo,
  },
  input: {
    flex: 1,
    backgroundColor: COLORES.tarjeta,
    color: COLORES.textoBlanco,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 9,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 10,
  },
  botonEnviar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORES.primario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonEnviarDisabled: { opacity: 0.4 },
  textoEnviar: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});
