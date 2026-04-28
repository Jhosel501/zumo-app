-- ============================================
-- ZUMO APP - DATABASE FIXES & IMPROVEMENTS
-- Run each section separately in Supabase SQL Editor
-- ============================================

-- SECTION 1: CRITICAL FIXES
-- 1.1 Add UNIQUE constraint to username
ALTER TABLE perfiles ADD CONSTRAINT unique_username UNIQUE(username);

-- 1.2 Add indexes on critical foreign keys
CREATE INDEX IF NOT EXISTS idx_publicaciones_perfil_id ON publicaciones(perfil_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_ciudad_id ON publicaciones(ciudad_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_created_at ON publicaciones(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seguidores_seguidor_id ON seguidores(seguidor_id);
CREATE INDEX IF NOT EXISTS idx_seguidores_seguido_id ON seguidores(seguido_id);
CREATE INDEX IF NOT EXISTS idx_vistas_feed_usuario_id ON vistas_feed(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vistas_feed_publicacion_id ON vistas_feed(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_vistas_feed_usuario_publicacion ON vistas_feed(usuario_id, publicacion_id);

-- 1.3 Soft delete columns
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_publicaciones_deleted_at ON publicaciones(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_perfiles_deleted_at ON perfiles(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- SECTION 2: INVITATIONS SYSTEM
-- ============================================

-- 2.1 Add invitado_por field to perfiles
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS invitado_por UUID REFERENCES perfiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_perfiles_invitado_por ON perfiles(invitado_por);

-- 2.2 Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generar_codigo_invitacion(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  nuevo_codigo TEXT;
  codigo_existe BOOLEAN;
BEGIN
  LOOP
    nuevo_codigo := 'ZUMO-' || upper(substring(md5(random()::text || user_id::text) from 1 for 2)) || '-' || upper(substring(md5(random()::text) from 1 for 4));
    SELECT EXISTS(SELECT 1 FROM invitaciones WHERE codigo = nuevo_codigo) INTO codigo_existe;
    EXIT WHEN NOT codigo_existe;
  END LOOP;
  RETURN nuevo_codigo;
END;
$$ LANGUAGE plpgsql;

-- 2.3 Trigger to auto-create 5 invitations when a new profile is created
CREATE OR REPLACE FUNCTION auto_crear_invitaciones()
RETURNS TRIGGER AS $$
DECLARE
  nuevo_codigo TEXT;
  i INTEGER;
BEGIN
  FOR i IN 1..5 LOOP
    nuevo_codigo := generar_codigo_invitacion(NEW.id);
    INSERT INTO invitaciones (codigo, creador_id, usos_restantes)
    VALUES (nuevo_codigo, NEW.id, 1);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_crear_invitaciones ON perfiles;
CREATE TRIGGER trigger_auto_crear_invitaciones
  AFTER INSERT ON perfiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_crear_invitaciones();

-- 2.4 RPC function to use an invitation code during registration
CREATE OR REPLACE FUNCTION usar_codigo_invitacion(p_codigo TEXT, p_nuevo_usuario_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_creador_id UUID;
BEGIN
  SELECT creador_id INTO v_creador_id
  FROM invitaciones
  WHERE codigo = p_codigo AND usos_restantes > 0
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE invitaciones SET usos_restantes = 0 WHERE codigo = p_codigo;
  UPDATE perfiles SET invitado_por = v_creador_id WHERE id = p_nuevo_usuario_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECTION 3: NEW TABLES
-- ============================================

-- 3.1 Likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publicacion_id UUID REFERENCES publicaciones(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(publicacion_id, perfil_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_publicacion_id ON likes(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_likes_perfil_id ON likes(perfil_id);

-- 3.2 Comments
CREATE TABLE IF NOT EXISTS comentarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publicacion_id UUID REFERENCES publicaciones(id) ON DELETE CASCADE,
  perfil_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion_id ON comentarios(publicacion_id);

-- 3.3 Notifications
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'like', 'comment', 'follow', 'trophy'
  origen_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  publicacion_id UUID REFERENCES publicaciones(id) ON DELETE SET NULL,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_id ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(usuario_id, leida);

-- 3.4 Trophies
CREATE TABLE IF NOT EXISTS trofeos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT,
  condicion_zumos INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuario_trofeos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  trofeo_id UUID REFERENCES trofeos(id) ON DELETE CASCADE,
  desbloqueado_en TIMESTAMPTZ DEFAULT now(),
  UNIQUE(perfil_id, trofeo_id)
);

-- 3.5 Reports and blocks
CREATE TABLE IF NOT EXISTS reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reportador_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  publicacion_id UUID REFERENCES publicaciones(id) ON DELETE CASCADE,
  motivo TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios_bloqueados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bloqueador_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  bloqueado_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bloqueador_id, bloqueado_id)
);

-- ============================================
-- SECTION 4: AUTO-CREATE PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
