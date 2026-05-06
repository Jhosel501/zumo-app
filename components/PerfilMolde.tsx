import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORES } from '../theme';
import AvatarPlaceholder from './AvatarPlaceholder';

const anchoPantalla = Dimensions.get('window').width;
const tamanoFotoGrid = anchoPantalla / 3;

interface PerfilMoldeProps {
  username: string;
  avatarUrl: string | null;
  totalZumos: number;
  numSeguidores: number;
  numSeguidos: number;
  fotos: any[];
  cargandoFotos: boolean;
  esMiPerfil: boolean;
  onPressAjustes?: () => void;
  onPressFoto?: (foto: any) => void;
  loSigo?: boolean;
  onPressSeguimiento?: () => void;
  cargandoSeguimiento?: boolean; // Añadido para el indicador de carga del botón
  refreshing?: boolean;
  onRefresh?: () => void;
  invitacion?: { codigo: string, usos: number } | null;
  onPressInvitar?: () => void;
}

export default function PerfilMolde({ 
  username, 
  avatarUrl, 
  totalZumos, 
  numSeguidores,
  numSeguidos,
  fotos, 
  cargandoFotos, 
  esMiPerfil, 
  onPressAjustes,
  onPressFoto,
  loSigo,
  onPressSeguimiento,
  cargandoSeguimiento,
  refreshing = false, // Lo inicializamos en false por defecto
  onRefresh,
  invitacion,      
  onPressInvitar, 
}: PerfilMoldeProps) {
  
  const [tabActiva, setTabActiva] = useState<'fotos' | 'trofeos' | 'etiquetadas'>('fotos');

  return (
    <View style={styles.contenedor}>
      {/* CABECERA */}
      <View style={styles.headerPerfil}>
        <Text style={styles.usernameHeader}>{username || 'usuario'}</Text>
        
        {esMiPerfil ? (
          <TouchableOpacity onPress={onPressAjustes} style={styles.botonAjustes}>
            <Text style={{ fontSize: 24, color: COLORES.textoBlanco }}>⚙️</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 34 }} /> 
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        // IMPLEMENTACIÓN DEL PULL TO REFRESH
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORES.primario}
              colors={[COLORES.primario]}
            />
          ) : undefined
        }
      >
        {/* ZONA DE ESTADÍSTICAS */}
        <View style={styles.zonaStats}>
          <View style={styles.contenedorAvatarStats}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarPerfil} />
            ) : (
              <AvatarPlaceholder size={86} />
            )}
          </View>

          {/* BLOQUE DE CONTADORES REORDENADO */}
          <View style={styles.bloqueContadores}>
            {/* 1. Total Zumos */}
            <View style={styles.contadorInfo}>
              <Text style={styles.numeroStat}>{totalZumos}</Text>
              <Text style={styles.textoStat}>Total Zumos</Text>
            </View>

            {/* 2. Seguidores */}
            <View style={styles.contadorInfo}>
              <Text style={styles.numeroStat}>{numSeguidores}</Text>
              <Text style={styles.textoStat}>Seguidores</Text>
            </View>

            {/* 3. Seguidos */}
            <View style={styles.contadorInfo}>
              <Text style={styles.numeroStat}>{numSeguidos}</Text>
              <Text style={styles.textoStat}>Seguidos</Text>
            </View>
          </View>
        </View>

        {/* --- ZONA DE ACCIÓN (SEGUIR O INVITAR) --- */}
        <View style={styles.contenedorBotonSeguir}>
          
          {!esMiPerfil && onPressSeguimiento ? (
            /* CASO 1: PERFILES AJENOS (BOTÓN DE SEGUIR) */
            <TouchableOpacity 
              style={[styles.botonSeguir, loSigo && styles.botonSiguiendo]}
              onPress={onPressSeguimiento}
              disabled={cargandoSeguimiento}
            >
              {cargandoSeguimiento ? (
                <ActivityIndicator color={loSigo ? COLORES.textoBlanco : 'black'} size="small" />
              ) : (
                <Text style={loSigo ? styles.textoBotonSiguiendo : styles.textoBotonSeguir}>
                  {loSigo ? 'Siguiendo' : 'Seguir'}
                </Text>
              )}
            </TouchableOpacity>

          ) : esMiPerfil && invitacion ? (
            /* CASO 2: MI PERFIL (BOTÓN VIP DE INVITACIÓN) */
            <TouchableOpacity 
              style={[
                styles.botonSeguir, 
                { backgroundColor: '#FF8C00', opacity: invitacion.usos > 0 ? 1 : 0.5 } 
              ]}
              onPress={onPressInvitar}
              disabled={invitacion.usos === 0}
            >
              <Text style={[styles.textoBotonSeguir, { color: 'white' }]}>
                {invitacion.usos > 0 
                  ? `🎟️ Enviar invitación (${invitacion.usos} restantes)` 
                  : 'Has agotado tus invitaciones'}
              </Text>
            </TouchableOpacity>

          ) : null}
          
        </View>

        {/* MENÚ DE PESTAÑAS */}
        <View style={styles.zonaTabs}>
          <TouchableOpacity 
            style={[styles.tab, tabActiva === 'fotos' && styles.tabActiva]} 
            onPress={() => setTabActiva('fotos')}
          >
            <Text style={[styles.textoTab, tabActiva === 'fotos' && styles.textoTabActivo]}>Fotos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tabActiva === 'trofeos' && styles.tabActiva]} 
            onPress={() => setTabActiva('trofeos')}
          >
            <Text style={[styles.textoTab, tabActiva === 'trofeos' && styles.textoTabActivo]}>Trofeos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tabActiva === 'etiquetadas' && styles.tabActiva]} 
            onPress={() => setTabActiva('etiquetadas')}
          >
            <Text style={[styles.textoTab, tabActiva === 'etiquetadas' && styles.textoTabActivo]}>Etiquetadas</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENIDO DEL GRID */}
        <View style={styles.zonaContenidoGrid}>
          {tabActiva === 'fotos' ? (
            cargandoFotos ? (
              <ActivityIndicator size="large" color={COLORES.primario} style={{ marginTop: 50 }} />
            ) : fotos.length === 0 ? (
              <View style={styles.estadoVacio}>
                <Text style={styles.iconoVacio}>📸</Text>
                <Text style={styles.textoVacio}>{esMiPerfil ? 'Aún no has subido fotos' : 'Aún no hay fotos'}</Text>
              </View>
            ) : (
              <View style={styles.cuadriculaFotos}>
                {fotos.map((foto) => (
                  <TouchableOpacity key={foto.id} onPress={() => onPressFoto && onPressFoto(foto)}>
                    <Image source={{ uri: foto.image_url }} style={styles.fotoGrid} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            )
          ) : tabActiva === 'trofeos' ? (
            <View style={styles.estadoVacio}>
              <Text style={styles.iconoVacio}>🏆</Text>
              <Text style={styles.textoVacio}>Los trofeos llegarán pronto</Text>
            </View>
          ) : (
            <View style={styles.estadoVacio}>
              <Text style={styles.iconoVacio}>🏷️</Text>
              <Text style={styles.textoVacio}>No hay etiquetas aún</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  headerPerfil: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  usernameHeader: { fontSize: 22, fontWeight: 'bold', color: COLORES.textoBlanco },
  botonAjustes: { padding: 5 },
  zonaStats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  contenedorAvatarStats: { marginRight: 20 },
  avatarPerfil: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: COLORES.primario },
  bloqueContadores: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  contadorInfo: { alignItems: 'center' },
  numeroStat: { color: COLORES.textoBlanco, fontSize: 22, fontWeight: 'bold' },
  textoStat: { color: COLORES.secundario, fontSize: 13, marginTop: 2 },
  
  // --- ESTILOS DEL BOTÓN DE SEGUIR ---
  contenedorBotonSeguir: { paddingHorizontal: 20, marginBottom: 20 },
  botonSeguir: { backgroundColor: COLORES.primario, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  botonSiguiendo: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORES.secundario },
  textoBotonSeguir: { color: 'black', fontWeight: 'bold', fontSize: 15 },
  textoBotonSiguiendo: { color: COLORES.textoBlanco, fontWeight: 'bold', fontSize: 15 },
  // -----------------------------------

  zonaTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORES.tarjeta },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabActiva: { borderBottomWidth: 2, borderBottomColor: COLORES.textoBlanco },
  textoTab: { color: COLORES.secundario, fontSize: 14, fontWeight: '600' },
  textoTabActivo: { color: COLORES.textoBlanco, fontWeight: 'bold' },
  zonaContenidoGrid: { flex: 1, minHeight: 300 },
  cuadriculaFotos: { flexDirection: 'row', flexWrap: 'wrap' },
  fotoGrid: { width: tamanoFotoGrid, height: tamanoFotoGrid, borderWidth: 1, borderColor: COLORES.fondo },
  estadoVacio: { alignItems: 'center', marginTop: 50 },
  iconoVacio: { fontSize: 50, marginBottom: 15 },
  textoVacio: { color: COLORES.secundario, fontSize: 16 }
});