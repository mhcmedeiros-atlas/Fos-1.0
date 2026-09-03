// Gerado automaticamente pelo Supabase a partir do schema real (projeto Fos1.0).
// NAO editar a mao -- rodar de novo via generate_typescript_types apos cada migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamento: {
        Row: {
          atualizado_em: string
          clinica_id: string
          criado_em: string
          equipamento_id: string | null
          fim: string
          id: string
          inicio: string
          paciente_id: string
          pacote_paciente_item_id: string | null
          procedimento_id: string
          profissional_id: string
          sala_id: string | null
          status: Database["public"]["Enums"]["status_agenda"]
          tipo: Database["public"]["Enums"]["tipo_atendimento"]
        }
        Insert: {
          atualizado_em?: string
          clinica_id: string
          criado_em?: string
          equipamento_id?: string | null
          fim: string
          id?: string
          inicio: string
          paciente_id: string
          pacote_paciente_item_id?: string | null
          procedimento_id: string
          profissional_id: string
          sala_id?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo: Database["public"]["Enums"]["tipo_atendimento"]
        }
        Update: {
          atualizado_em?: string
          clinica_id?: string
          criado_em?: string
          equipamento_id?: string | null
          fim?: string
          id?: string
          inicio?: string
          paciente_id?: string
          pacote_paciente_item_id?: string | null
          procedimento_id?: string
          profissional_id?: string
          sala_id?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo?: Database["public"]["Enums"]["tipo_atendimento"]
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_pacote_paciente_item_id_fkey"
            columns: ["pacote_paciente_item_id"]
            isOneToOne: false
            referencedRelation: "pacote_paciente_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "sala"
            referencedColumns: ["id"]
          },
        ]
      }
      alerta_seguranca: {
        Row: {
          ativo: boolean
          clinica_id: string
          criado_em: string
          criado_por: string | null
          descricao: string
          id: string
          paciente_id: string
          tipo: Database["public"]["Enums"]["tipo_alerta_seguranca"]
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          criado_em?: string
          criado_por?: string | null
          descricao: string
          id?: string
          paciente_id: string
          tipo: Database["public"]["Enums"]["tipo_alerta_seguranca"]
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string
          id?: string
          paciente_id?: string
          tipo?: Database["public"]["Enums"]["tipo_alerta_seguranca"]
        }
        Relationships: [
          {
            foreignKeyName: "alerta_seguranca_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerta_seguranca_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerta_seguranca_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_pergunta: {
        Row: {
          ativo: boolean
          clinica_id: string
          id: string
          ordem: number
          texto: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          id?: string
          ordem?: number
          texto: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          id?: string
          ordem?: number
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_pergunta_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_resposta: {
        Row: {
          clinica_id: string
          id: string
          paciente_id: string
          pergunta_id: string
          respondido_em: string
          resposta: string | null
        }
        Insert: {
          clinica_id: string
          id?: string
          paciente_id: string
          pergunta_id: string
          respondido_em?: string
          resposta?: string | null
        }
        Update: {
          clinica_id?: string
          id?: string
          paciente_id?: string
          pergunta_id?: string
          respondido_em?: string
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_resposta_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_resposta_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_resposta_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "anamnese_pergunta"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento: {
        Row: {
          agendamento_id: string
          clinica_id: string
          comissao_status: string
          comissao_valor: number | null
          concluido_em: string | null
          criado_em: string
          id: string
          iniciado_em: string
          paciente_id: string
          pacote_paciente_item_id: string | null
          profissional_id: string
          protocolo: string | null
          status: Database["public"]["Enums"]["status_agenda"]
          tipo: Database["public"]["Enums"]["tipo_atendimento"]
        }
        Insert: {
          agendamento_id: string
          clinica_id: string
          comissao_status?: string
          comissao_valor?: number | null
          concluido_em?: string | null
          criado_em?: string
          id?: string
          iniciado_em?: string
          paciente_id: string
          pacote_paciente_item_id?: string | null
          profissional_id: string
          protocolo?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo: Database["public"]["Enums"]["tipo_atendimento"]
        }
        Update: {
          agendamento_id?: string
          clinica_id?: string
          comissao_status?: string
          comissao_valor?: number | null
          concluido_em?: string | null
          criado_em?: string
          id?: string
          iniciado_em?: string
          paciente_id?: string
          pacote_paciente_item_id?: string | null
          profissional_id?: string
          protocolo?: string | null
          status?: Database["public"]["Enums"]["status_agenda"]
          tipo?: Database["public"]["Enums"]["tipo_atendimento"]
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_pacote_paciente_item_id_fkey"
            columns: ["pacote_paciente_item_id"]
            isOneToOne: false
            referencedRelation: "pacote_paciente_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_foto: {
        Row: {
          atendimento_id: string
          criado_em: string
          id: string
          tipo: string
          url: string
        }
        Insert: {
          atendimento_id: string
          criado_em?: string
          id?: string
          tipo: string
          url: string
        }
        Update: {
          atendimento_id?: string
          criado_em?: string
          id?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_foto_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimento"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimento_insumo: {
        Row: {
          atendimento_id: string
          criado_em: string
          id: string
          insumo_lote_id: string
          quantidade: number
        }
        Insert: {
          atendimento_id: string
          criado_em?: string
          id?: string
          insumo_lote_id: string
          quantidade: number
        }
        Update: {
          atendimento_id?: string
          criado_em?: string
          id?: string
          insumo_lote_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "atendimento_insumo_atendimento_id_fkey"
            columns: ["atendimento_id"]
            isOneToOne: false
            referencedRelation: "atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimento_insumo_insumo_lote_id_fkey"
            columns: ["insumo_lote_id"]
            isOneToOne: false
            referencedRelation: "insumo_lote"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          categoria: string
          clinica_id: string
          id: number
          ocorrido_em: string
          registro_id: string | null
          tabela: string
          usuario_id: string | null
          valor_anterior: Json | null
          valor_novo: Json | null
        }
        Insert: {
          acao: string
          categoria: string
          clinica_id: string
          id?: never
          ocorrido_em?: string
          registro_id?: string | null
          tabela: string
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Update: {
          acao?: string
          categoria?: string
          clinica_id?: string
          id?: never
          ocorrido_em?: string
          registro_id?: string | null
          tabela?: string
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_novo?: Json | null
        }
        Relationships: []
      }
      clinica: {
        Row: {
          ativo: boolean
          cnpj: string | null
          criado_em: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          criado_em?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          criado_em?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      equipamento: {
        Row: {
          ativo: boolean
          clinica_id: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo: {
        Row: {
          ativo: boolean
          clinica_id: string
          criado_em: string
          estoque_minimo: number | null
          id: string
          nome: string
          unidade_consumo: Database["public"]["Enums"]["unidade_consumo"]
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          criado_em?: string
          estoque_minimo?: number | null
          id?: string
          nome: string
          unidade_consumo: Database["public"]["Enums"]["unidade_consumo"]
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          criado_em?: string
          estoque_minimo?: number | null
          id?: string
          nome?: string
          unidade_consumo?: Database["public"]["Enums"]["unidade_consumo"]
        }
        Relationships: [
          {
            foreignKeyName: "insumo_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo_lote: {
        Row: {
          aberto_em: string | null
          ativo: boolean
          clinica_id: string
          custo: number | null
          fornecedor: string | null
          id: string
          insumo_id: string
          numero_lote: string
          quantidade_recebida: number
          quantidade_restante: number
          recebido_em: string
          validade: string | null
          validade_pos_abertura: string | null
        }
        Insert: {
          aberto_em?: string | null
          ativo?: boolean
          clinica_id: string
          custo?: number | null
          fornecedor?: string | null
          id?: string
          insumo_id: string
          numero_lote: string
          quantidade_recebida: number
          quantidade_restante: number
          recebido_em?: string
          validade?: string | null
          validade_pos_abertura?: string | null
        }
        Update: {
          aberto_em?: string | null
          ativo?: boolean
          clinica_id?: string
          custo?: number | null
          fornecedor?: string | null
          id?: string
          insumo_id?: string
          numero_lote?: string
          quantidade_recebida?: number
          quantidade_restante?: number
          recebido_em?: string
          validade?: string | null
          validade_pos_abertura?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insumo_lote_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumo_lote_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumo"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          atualizado_em: string
          clinica_id: string
          criado_em: string
          estagio: Database["public"]["Enums"]["estagio_funil"]
          id: string
          origem: Database["public"]["Enums"]["origem_lead"]
          pessoa_id: string
          possivel_duplicata_de: string | null
          proxima_acao: string | null
          proxima_acao_em: string | null
          venda_id: string | null
        }
        Insert: {
          atualizado_em?: string
          clinica_id: string
          criado_em?: string
          estagio?: Database["public"]["Enums"]["estagio_funil"]
          id?: string
          origem: Database["public"]["Enums"]["origem_lead"]
          pessoa_id: string
          possivel_duplicata_de?: string | null
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          venda_id?: string | null
        }
        Update: {
          atualizado_em?: string
          clinica_id?: string
          criado_em?: string
          estagio?: Database["public"]["Enums"]["estagio_funil"]
          id?: string
          origem?: Database["public"]["Enums"]["origem_lead"]
          pessoa_id?: string
          possivel_duplicata_de?: string | null
          proxima_acao?: string | null
          proxima_acao_em?: string | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_possivel_duplicata_de_fkey"
            columns: ["possivel_duplicata_de"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "venda"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote: {
        Row: {
          ativo: boolean
          atualizado_em: string
          clinica_id: string
          condicao_parcelamento: string | null
          criado_em: string
          foto_url: string | null
          id: string
          nome: string
          validade_dias: number
          valor_total: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          clinica_id: string
          condicao_parcelamento?: string | null
          criado_em?: string
          foto_url?: string | null
          id?: string
          nome: string
          validade_dias: number
          valor_total: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          clinica_id?: string
          condicao_parcelamento?: string | null
          criado_em?: string
          foto_url?: string | null
          id?: string
          nome?: string
          validade_dias?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pacote_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_item: {
        Row: {
          pacote_id: string
          procedimento_id: string
          quantidade_sessoes: number
        }
        Insert: {
          pacote_id: string
          procedimento_id: string
          quantidade_sessoes: number
        }
        Update: {
          pacote_id?: string
          procedimento_id?: string
          quantidade_sessoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "pacote_item_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacote"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_item_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimento"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_paciente: {
        Row: {
          atualizado_em: string
          clinica_id: string
          comprado_em: string
          criado_em: string
          id: string
          nome: string
          paciente_id: string
          pacote_id: string | null
          status: Database["public"]["Enums"]["status_pacote_paciente"]
          validade_em: string
          valor_pago: number
        }
        Insert: {
          atualizado_em?: string
          clinica_id: string
          comprado_em?: string
          criado_em?: string
          id?: string
          nome: string
          paciente_id: string
          pacote_id?: string | null
          status?: Database["public"]["Enums"]["status_pacote_paciente"]
          validade_em: string
          valor_pago: number
        }
        Update: {
          atualizado_em?: string
          clinica_id?: string
          comprado_em?: string
          criado_em?: string
          id?: string
          nome?: string
          paciente_id?: string
          pacote_id?: string | null
          status?: Database["public"]["Enums"]["status_pacote_paciente"]
          validade_em?: string
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "pacote_paciente_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_paciente_pacote_id_fkey"
            columns: ["pacote_id"]
            isOneToOne: false
            referencedRelation: "pacote"
            referencedColumns: ["id"]
          },
        ]
      }
      pacote_paciente_item: {
        Row: {
          id: string
          pacote_paciente_id: string
          procedimento_id: string
          procedimento_nome: string
          sessoes_total: number
          sessoes_usadas: number
        }
        Insert: {
          id?: string
          pacote_paciente_id: string
          procedimento_id: string
          procedimento_nome: string
          sessoes_total: number
          sessoes_usadas?: number
        }
        Update: {
          id?: string
          pacote_paciente_id?: string
          procedimento_id?: string
          procedimento_nome?: string
          sessoes_total?: number
          sessoes_usadas?: number
        }
        Relationships: [
          {
            foreignKeyName: "pacote_paciente_item_pacote_paciente_id_fkey"
            columns: ["pacote_paciente_id"]
            isOneToOne: false
            referencedRelation: "pacote_paciente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacote_paciente_item_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimento"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoa: {
        Row: {
          anonimizada_em: string | null
          apelido: string | null
          ativo: boolean
          atualizado_em: string
          clinica_id: string
          cpf: string | null
          criado_em: string
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          foto_url: string | null
          id: string
          indicado_por_id: string | null
          nome: string
          origem: string | null
          responsavel_financeiro_id: string | null
          telefone: string | null
        }
        Insert: {
          anonimizada_em?: string | null
          apelido?: string | null
          ativo?: boolean
          atualizado_em?: string
          clinica_id: string
          cpf?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          indicado_por_id?: string | null
          nome: string
          origem?: string | null
          responsavel_financeiro_id?: string | null
          telefone?: string | null
        }
        Update: {
          anonimizada_em?: string | null
          apelido?: string | null
          ativo?: boolean
          atualizado_em?: string
          clinica_id?: string
          cpf?: string | null
          criado_em?: string
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          foto_url?: string | null
          id?: string
          indicado_por_id?: string | null
          nome?: string
          origem?: string | null
          responsavel_financeiro_id?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoa_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_indicado_por_id_fkey"
            columns: ["indicado_por_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_responsavel_financeiro_id_fkey"
            columns: ["responsavel_financeiro_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimento: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: string | null
          clinica_id: string
          criado_em: string
          duracao_min: number
          equipamento_id: string | null
          foto_url: string | null
          id: string
          intervalo_recall_dias: number | null
          intervalo_retorno_dias: number | null
          nome: string
          sala_id: string | null
          valor_tabela: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          clinica_id: string
          criado_em?: string
          duracao_min: number
          equipamento_id?: string | null
          foto_url?: string | null
          id?: string
          intervalo_recall_dias?: number | null
          intervalo_retorno_dias?: number | null
          nome: string
          sala_id?: string | null
          valor_tabela: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          clinica_id?: string
          criado_em?: string
          duracao_min?: number
          equipamento_id?: string | null
          foto_url?: string | null
          id?: string
          intervalo_recall_dias?: number | null
          intervalo_retorno_dias?: number | null
          nome?: string
          sala_id?: string | null
          valor_tabela?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedimento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimento_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimento_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "sala"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimento_insumo: {
        Row: {
          insumo_id: string
          procedimento_id: string
          quantidade_padrao: number
        }
        Insert: {
          insumo_id: string
          procedimento_id: string
          quantidade_padrao: number
        }
        Update: {
          insumo_id?: string
          procedimento_id?: string
          quantidade_padrao?: number
        }
        Relationships: [
          {
            foreignKeyName: "procedimento_insumo_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimento_insumo_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimento"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimento_profissional: {
        Row: {
          comissao_percentual: number | null
          procedimento_id: string
          profissional_id: string
        }
        Insert: {
          comissao_percentual?: number | null
          procedimento_id: string
          profissional_id: string
        }
        Update: {
          comissao_percentual?: number | null
          procedimento_id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedimento_profissional_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "procedimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimento_profissional_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissional"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional: {
        Row: {
          ativo: boolean
          clinica_id: string
          comissao_padrao: number | null
          conselho: string | null
          criado_em: string
          funcao: string | null
          id: string
          pessoa_id: string
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          comissao_padrao?: number | null
          conselho?: string | null
          criado_em?: string
          funcao?: string | null
          id?: string
          pessoa_id: string
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          comissao_padrao?: number | null
          conselho?: string | null
          criado_em?: string
          funcao?: string | null
          id?: string
          pessoa_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissional_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento: {
        Row: {
          clinica_id: string
          forma: string
          id: string
          recebido_em: string
          taxa: number
          valor_bruto: number
          valor_liquido: number | null
          venda_id: string
        }
        Insert: {
          clinica_id: string
          forma: string
          id?: string
          recebido_em?: string
          taxa?: number
          valor_bruto: number
          valor_liquido?: number | null
          venda_id: string
        }
        Update: {
          clinica_id?: string
          forma?: string
          id?: string
          recebido_em?: string
          taxa?: number
          valor_bruto?: number
          valor_liquido?: number | null
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "venda"
            referencedColumns: ["id"]
          },
        ]
      }
      sala: {
        Row: {
          ativo: boolean
          clinica_id: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "sala_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
        ]
      }
      parcela: {
        Row: {
          clinica_id: string
          id: string
          numero: number
          quitado_em: string | null
          recebimento_id: string | null
          valor: number
          vencimento: string
          venda_id: string
        }
        Insert: {
          clinica_id: string
          id?: string
          numero: number
          quitado_em?: string | null
          recebimento_id?: string | null
          valor: number
          vencimento: string
          venda_id: string
        }
        Update: {
          clinica_id?: string
          id?: string
          numero?: number
          quitado_em?: string | null
          recebimento_id?: string | null
          valor?: number
          vencimento?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcela_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcela_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "venda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcela_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimento"
            referencedColumns: ["id"]
          },
        ]
      }
      termo_consentimento: {
        Row: {
          assinado_em: string
          clinica_id: string
          evidencia_url: string | null
          id: string
          paciente_id: string
          versao: string
        }
        Insert: {
          assinado_em?: string
          clinica_id: string
          evidencia_url?: string | null
          id?: string
          paciente_id: string
          versao?: string
        }
        Update: {
          assinado_em?: string
          clinica_id?: string
          evidencia_url?: string | null
          id?: string
          paciente_id?: string
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "termo_consentimento_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termo_consentimento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencia_sessao: {
        Row: {
          clinica_id: string
          id: number
          item_destino_id: string
          item_origem_id: string
          motivo: string | null
          quantidade: number
          transferido_em: string
          transferido_por: string | null
        }
        Insert: {
          clinica_id: string
          id?: never
          item_destino_id: string
          item_origem_id: string
          motivo?: string | null
          quantidade: number
          transferido_em?: string
          transferido_por?: string | null
        }
        Update: {
          clinica_id?: string
          id?: never
          item_destino_id?: string
          item_origem_id?: string
          motivo?: string | null
          quantidade?: number
          transferido_em?: string
          transferido_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencia_sessao_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencia_sessao_item_destino_id_fkey"
            columns: ["item_destino_id"]
            isOneToOne: false
            referencedRelation: "pacote_paciente_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencia_sessao_item_origem_id_fkey"
            columns: ["item_origem_id"]
            isOneToOne: false
            referencedRelation: "pacote_paciente_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencia_sessao_transferido_por_fkey"
            columns: ["transferido_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          ativo: boolean
          clinica_id: string
          criado_em: string
          id: string
          perfil: Database["public"]["Enums"]["perfil_acesso"]
          pessoa_id: string | null
        }
        Insert: {
          ativo?: boolean
          clinica_id: string
          criado_em?: string
          id: string
          perfil: Database["public"]["Enums"]["perfil_acesso"]
          pessoa_id?: string | null
        }
        Update: {
          ativo?: boolean
          clinica_id?: string
          criado_em?: string
          id?: string
          perfil?: Database["public"]["Enums"]["perfil_acesso"]
          pessoa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
        ]
      }
      venda: {
        Row: {
          clinica_id: string
          criado_em: string
          criado_por: string | null
          descricao: string | null
          forma_pagamento: string
          id: string
          paciente_id: string
          pacote_paciente_id: string | null
          parcelas: number
          taxa_maquininha: number
          valor_total: number
        }
        Insert: {
          clinica_id: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          forma_pagamento: string
          id?: string
          paciente_id: string
          pacote_paciente_id?: string | null
          parcelas?: number
          taxa_maquininha?: number
          valor_total: number
        }
        Update: {
          clinica_id?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          forma_pagamento?: string
          id?: string
          paciente_id?: string
          pacote_paciente_id?: string | null
          parcelas?: number
          taxa_maquininha?: number
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "venda_clinica_id_fkey"
            columns: ["clinica_id"]
            isOneToOne: false
            referencedRelation: "clinica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pessoa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_pacote_paciente_id_fkey"
            columns: ["pacote_paciente_id"]
            isOneToOne: false
            referencedRelation: "pacote_paciente"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonimizar_paciente: { Args: { p_pessoa_id: string }; Returns: undefined }
      criar_pacote: {
        Args: {
          p_condicao_parcelamento: string
          p_itens: Json
          p_nome: string
          p_validade_dias: number
          p_valor_total: number
        }
        Returns: string
      }
      registrar_procedimento_extra: {
        Args: {
          p_agendamento_origem_id: string
          p_forma_pagamento: string | null
          p_pacote_paciente_item_id: string | null
          p_procedimento_id: string
          p_taxa: number
          p_tipo: Database["public"]["Enums"]["tipo_atendimento"]
          p_valor: number | null
        }
        Returns: string
      }
      registrar_contato_recebido: {
        Args: {
          p_canal: string
          p_identificador_externo: string
          p_nome: string | null
          p_payload: Json
          p_remetente: string
        }
        Returns: string
      }
      vender_pacote: {
        Args: {
          p_forma_pagamento: string
          p_paciente_id: string
          p_pacote_id: string
          p_parcelas?: number
          p_taxa_maquininha?: number
        }
        Returns: string
      }
    }
    Enums: {
      estagio_funil:
        | "novo"
        | "em_contato"
        | "avaliacao_agendada"
        | "avaliacao_realizada"
        | "orcamento_enviado"
        | "ganho"
        | "perdido"
      origem_lead: "whatsapp" | "instagram" | "formulario"
      perfil_acesso: "admin" | "recepcao" | "profissional" | "financeiro"
      status_agenda:
        | "agendado"
        | "confirmado"
        | "em_atendimento"
        | "realizado"
        | "faltou"
        | "cancelado"
      status_pacote_paciente: "ativo" | "vencido" | "cancelado"
      tipo_alerta_seguranca:
        | "alergia"
        | "anticoagulante"
        | "gestacao"
        | "procedimento_anterior_outro_local"
      tipo_atendimento:
        | "avaliacao"
        | "sessao_pacote"
        | "sessao_avulsa"
        | "retorno"
      unidade_consumo: "unidade" | "ml" | "seringa" | "frasco" | "disparo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estagio_funil: [
        "novo",
        "em_contato",
        "avaliacao_agendada",
        "avaliacao_realizada",
        "orcamento_enviado",
        "ganho",
        "perdido",
      ],
      origem_lead: ["whatsapp", "instagram", "formulario"],
      perfil_acesso: ["admin", "recepcao", "profissional", "financeiro"],
      status_agenda: [
        "agendado",
        "confirmado",
        "em_atendimento",
        "realizado",
        "faltou",
        "cancelado",
      ],
      status_pacote_paciente: ["ativo", "vencido", "cancelado"],
      tipo_alerta_seguranca: [
        "alergia",
        "anticoagulante",
        "gestacao",
        "procedimento_anterior_outro_local",
      ],
      tipo_atendimento: [
        "avaliacao",
        "sessao_pacote",
        "sessao_avulsa",
        "retorno",
      ],
      unidade_consumo: ["unidade", "ml", "seringa", "frasco", "disparo"],
    },
  },
} as const
