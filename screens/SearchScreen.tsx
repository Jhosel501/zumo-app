import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES, FUENTES } from '../theme';
import { supabase } from '../supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvatarPlaceholder from '../components/AvatarPlaceholder';

type Perfil = { id: string; username: string; avatar_url: string | null };

export default function SearchScreen({ onPressUser }: { onPressUser: (id: string) => void }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const buscarUsuarios = async () => {
      if (busqueda.trim().length === 0) {
        setResultados([]);
        return;
      }

      setCargando(true);
      const queryLimpia = busqueda.startsWith('@') ? busqueda.slice(1) : busqueda;

      try {
        const { data, error } = await supabase
          .from('perfiles')
          .select('id, username, avatar_url')
          .ilike('username', `%${queryLimpia}%`)
          .is('deleted_at', null)
          .limit(20);

        if (error) throw error;
        setResultados(data || []);
      } catch (error) {
        console.error("Error en la búsqueda:", error);
      } finally {
        setCargando(false);
      }
    };

    const timeoutId = setTimeout(buscarUsuarios, 300);
    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  return (
    <SafeAreaView style={styles.contenedorSafeArea}>
      <View style={styles.contenedor}>
        <View style={styles.header}>
          <View style={styles.cajaBuscador}>
            <Ionicons name="search" size={18} color={COLORES.secundario} style={styles.iconoLupa} />
            <TextInput
              style={styles.input}
              placeholder="Buscar por @usuario..."
              placeholderTextColor={COLORES.secundario}
              value={busqueda}
              onChangeText={setBusqueda}
              autoCapitalize="none"
              autoFocus={true}
            />
            {cargando && <ActivityIndicator size="small" color={COLORES.primario} />}
          </View>
        </View>

        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tarjetaUsuario}
              onPress={() => onPressUser(item.id)}
            >
              {item.avatar_url ? (
                <View style={styles.avatarCircular}>
                  <Image source={{ uri: item.avatar_url }} style={styles.imagenAvatar} />
                </View>
              ) : (
                <AvatarPlaceholder size={50} style={{ marginRight: 15 }} />
              )}

              <View style={styles.infoUsuario}>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            !cargando && busqueda.length > 0 ? (
              <Text style={styles.textoVacio}>No hemos encontrado a nadie con ese nombre</Text>
            ) : null
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorSafeArea: { flex: 1, backgroundColor: '#000000', paddingTop: Platform.OS === 'android' ? 40 : 0 },
  contenedor: { flex: 1 },
  header: { paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta },
  cajaBuscador: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.tarjeta, borderRadius: 12, paddingHorizontal: 15, height: 45 },
  iconoLupa: { marginRight: 10 },
  input: { flex: 1, color: COLORES.textoBlanco, fontSize: 16 },
  tarjetaUsuario: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarCircular: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: COLORES.borde,
    overflow: 'hidden',
  },
  imagenAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  letraAvatar: { color: COLORES.primario, fontSize: 20, fontWeight: '900' },
  infoUsuario: { justifyContent: 'center' },
  username: { color: COLORES.textoBlanco, fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  nombreReal: { color: COLORES.secundario, fontSize: 14 },
  textoVacio: { color: COLORES.secundario, textAlign: 'center', marginTop: 40, fontSize: 16 },
});
