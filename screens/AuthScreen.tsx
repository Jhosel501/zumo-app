import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../supabase';
import { COLORES } from '../theme';

export default function AuthScreen() {
  const [cargando, setCargando] = useState(false);

  // Solo necesitamos el email y la contraseña para entrar
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- FUNCIÓN ÚNICA: INICIAR SESIÓN ---
  const iniciarSesion = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor, introduce tu email y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) throw error;
      // Si va bien, App.tsx lo detectará automáticamente y cambiará la pantalla
    } catch (error: any) {
      Alert.alert('Error al entrar', 'Credenciales incorrectas o usuario no encontrado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.contenedor} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.cajaFormulario}>
        <Text style={styles.titulo}>ZUMO</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={COLORES.secundario}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={COLORES.secundario}
          value={password}
          onChangeText={setPassword}
          secureTextEntry // Oculta la contraseña con puntitos
        />

        {/* Botón Principal */}
        <TouchableOpacity 
          style={styles.botonPrincipal} 
          onPress={iniciarSesion}
          disabled={cargando}
        >
          {cargando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.textoBotonPrincipal}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* Mensaje de exclusividad */}
        <Text style={styles.textoExclusivo}>
          Acceso exclusivo por invitación. Si no tienes cuenta, pide un enlace a un miembro activo de tu universidad.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: { 
    flex: 1, 
    backgroundColor: COLORES.fondo, 
    justifyContent: 'center', 
    padding: 20 
  },
  cajaFormulario: { 
    backgroundColor: COLORES.tarjeta, 
    padding: 25, 
    borderRadius: 20, 
    width: '100%', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5 
  },
  titulo: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: COLORES.textoBlanco, 
    marginBottom: 30, 
    textAlign: 'center',
    letterSpacing: 2
  },
  input: { 
    backgroundColor: COLORES.fondo, 
    color: COLORES.textoBlanco, 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#3d4653' 
  },
  botonPrincipal: { 
    backgroundColor: COLORES.primario, 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10,
    marginBottom: 20 
  },
  textoBotonPrincipal: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  textoExclusivo: { 
    color: COLORES.secundario, 
    textAlign: 'center', 
    fontSize: 13, 
    lineHeight: 20,
    marginTop: 10 
  }
});