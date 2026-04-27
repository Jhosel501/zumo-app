import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../theme';

export default function SearchScreen({ navigation }: any) {
  const [busqueda, setBusqueda] = useState('');

  // Datos falsos para probar el diseño (hasta que lo conectes a Supabase)
  const usuariosDummy = [
    { id: '1', username: 'jhosel501', nombre: 'Jhosel' },
    { id: '2', username: 'zumo_oficial', nombre: 'Zumo App' },
    { id: '3', username: 'marcos_unizar', nombre: 'Marcos' },
    { id: '4', username: 'maria_z', nombre: 'María' },
  ];

  // Lógica de filtrado en tiempo real
  const resultados = usuariosDummy.filter(user => 
    user.username.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.contenedorSafeArea}>
      <View style={styles.contenedor}>
        
        {/* HEADER: Buscador Inmersivo */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botonAtras}>
            <Ionicons name="arrow-back" size={26} color={COLORES.textoBlanco} />
          </TouchableOpacity>
          
          <View style={styles.cajaBuscador}>
            <Ionicons name="search" size={18} color={COLORES.secundario} style={styles.iconoLupa} />
            <TextInput
              style={styles.input}
              placeholder="Buscar por @usuario..."
              placeholderTextColor={COLORES.secundario}
              value={busqueda}
              onChangeText={setBusqueda}
              autoCapitalize="none"
              autoFocus={true} // El teclado se abre nada más entrar a la pantalla
            />
          </View>
        </View>

        {/* LISTA DE PERFILES */}
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.tarjetaUsuario}
              onPress={() => navigation.navigate('PublicProfileScreen', { userId: item.id })}
            >
              {/* Avatar circular estilo Instagram */}
              <View style={styles.avatarCircular}>
                <Text style={styles.letraAvatar}>{item.username.charAt(0).toUpperCase()}</Text>
              </View>
              
              <View style={styles.infoUsuario}>
                <Text style={styles.username}>@{item.username}</Text>
                <Text style={styles.nombreReal}>{item.nombre}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={styles.textoVacio}>No se han encontrado perfiles.</Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorSafeArea: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    paddingTop: Platform.OS === 'android' ? 40 : 0, // Evita que se solape con el reloj en Android
  },
  contenedor: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.tarjeta,
  },
  botonAtras: {
    marginRight: 15,
  },
  cajaBuscador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.tarjeta, // Mismo gris oscuro de tus inputs
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
  },
  iconoLupa: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORES.textoBlanco,
    fontSize: 16,
  },
  tarjetaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircular: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORES.tarjeta,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  letraAvatar: {
    color: COLORES.primario, // Letra en color naranja Zumo
    fontSize: 20,
    fontWeight: '900',
  },
  infoUsuario: {
    justifyContent: 'center',
  },
  username: {
    color: COLORES.textoBlanco,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  nombreReal: {
    color: COLORES.secundario,
    fontSize: 14,
  },
  textoVacio: {
    color: COLORES.secundario,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});