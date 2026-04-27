import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../supabase';
import { COLORES } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthScreen() {
  const [cargando, setCargando] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- LÓGICA INTACTA ---
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
    } catch (error: any) {
      Alert.alert('Error al entrar', 'Credenciales incorrectas o usuario no encontrado.');
    } finally {
      setCargando(false);
    }
  };

  // --- VISTA ACTUALIZADA (ESTILO ZUMO) ---
  return (
    <KeyboardAvoidingView 
      style={styles.contenedor} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.cajaFormulario}>
        <Text style={styles.titulo}>ZUMO</Text>
        
        <TextInput
          style={styles.inputInmersivo}
          placeholder="Correo electrónico"
          placeholderTextColor={COLORES.secundario}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.inputInmersivo}
          placeholder="Contraseña"
          placeholderTextColor={COLORES.secundario}
          value={password}
          onChangeText={setPassword}
          secureTextEntry 
        />

        {/* Botón Principal con Degradado Zumo */}
        <TouchableOpacity 
          onPress={iniciarSesion}
          disabled={cargando}
          style={{ marginTop: 15, marginBottom: 25 }}
        >
          <LinearGradient
            colors={[COLORES.primario, COLORES.secundario]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.botonDegradado}
          >
            {cargando ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.textoBotonPrincipal}>ENTRAR EN ZUMO</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Mensaje de exclusividad */}
        <Text style={styles.textoExclusivo}>
          Acceso exclusivo por invitación. Si no tienes cuenta, pide un enlace a un miembro activo de tu universidad.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- ESTILOS ACTUALIZADOS ---
const styles = StyleSheet.create({
  contenedor: { 
    flex: 1, 
    backgroundColor: COLORES.fondo, 
    justifyContent: 'center', 
    padding: 20 
  },
  cajaFormulario: { 
    // Quitamos el color de tarjeta para que se funda con el fondo, estilo inmersivo
    padding: 20, 
    width: '100%', 
  },
  titulo: { 
    fontSize: 40, 
    fontWeight: '900', 
    color: COLORES.textoBlanco, 
    marginBottom: 40, 
    textAlign: 'center',
    letterSpacing: 4
  },
  inputInmersivo: { 
    backgroundColor: COLORES.tarjeta, // Fondo gris oscuro
    color: COLORES.textoBlanco, 
    padding: 18, 
    borderRadius: 20, // Bordes muy redondeados (juvenil)
    marginBottom: 15, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: COLORES.borde 
  },
  botonDegradado: { 
    padding: 18, 
    borderRadius: 30, // Botón en forma de píldora
    alignItems: 'center', 
  },
  textoBotonPrincipal: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '900', // Letra gordita
    letterSpacing: 1
  },
  textoExclusivo: { 
    color: COLORES.secundario, 
    textAlign: 'center', 
    fontSize: 13, 
    lineHeight: 20,
    marginTop: 10 
  }
});