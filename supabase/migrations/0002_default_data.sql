-- Dados padrão reais (não é seed de desenvolvimento) — tipos de encontro e
-- configurações iniciais que a coordenação pode editar em /configuracoes.

insert into public.meeting_types (nome, cor, duracao_padrao_minutos) values
  ('GAT', '#3D6E8F', 120),
  ('Área', '#2F6B4F', 120),
  ('Estudos', '#7A5C99', 120),
  ('Atividade externa', '#A0643A', 120),
  ('Formação bimestral', '#8A7A2E', 120)
on conflict (nome) do nothing;

insert into public.settings (key, value) values
  ('programa', jsonb_build_object(
    'nome_programa', 'PET',
    'nome_grupo', 'Saúde/Clima – Eixo III',
    'fuso_horario', 'America/Fortaleza',
    'logo_pet_url', null,
    'logo_instituicao_url', null
  )),
  ('perfis_nomes', jsonb_build_object(
    'coordenacao', 'Coordenação',
    'participante', 'Participante',
    'relator', 'Relator(a)'
  )),
  ('metas', jsonb_build_object(
    'encontros_por_semana', 2,
    'horas_por_semana', 8,
    'tipos_obrigatorios_por_mes', jsonb_build_array()
  )),
  ('ata_pdf', jsonb_build_object(
    'coluna_assinatura', false
  ))
on conflict (key) do nothing;
