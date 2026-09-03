import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Fós',
  description: 'Como o Fós trata dados pessoais de clínicas e pacientes.',
};

const ATUALIZADO_EM = '2 de setembro de 2026';

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 'var(--space-6)' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 19,
          fontWeight: 500,
          marginBottom: 'var(--space-3)',
        }}
      >
        {titulo}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--text-secondary)' }}>{children}</p>;
}

function Lista({ itens }: { itens: React.ReactNode[] }) {
  return (
    <ul
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingLeft: 20,
        fontSize: 14.5,
        lineHeight: 1.6,
        color: 'var(--text-secondary)',
      }}
    >
      {itens.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PoliticaDePrivacidadePage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'var(--space-7) var(--space-5) var(--space-8)',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500 }}>
        Política de Privacidade
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
        Fós — sistema de gestão para clínicas de estética avançada · Atualizada em {ATUALIZADO_EM}
      </p>

      <Secao titulo="Quem trata os dados">
        <P>
          O Fós é o software usado por clínicas de estética para gerir seus atendimentos. Nessa
          relação, <strong>a clínica é a controladora</strong> dos dados dos seus pacientes: é ela
          quem decide quais dados coleta e por quê. O Fós atua como <strong>operador</strong>,
          tratando esses dados exclusivamente para prestar o serviço contratado pela clínica.
        </P>
        <P>
          Se você é paciente e quer exercer direitos sobre os seus dados, o caminho mais direto é
          falar com a clínica que o atende. A clínica pode acionar o Fós quando precisar da nossa
          ajuda técnica para atender ao pedido.
        </P>
      </Secao>

      <Secao titulo="Quais dados são tratados">
        <Lista
          itens={[
            <>
              <strong>Cadastrais:</strong> nome, apelido, CPF, telefone, e-mail, data de nascimento,
              endereço e foto.
            </>,
            <>
              <strong>De saúde:</strong> anamnese, alertas de segurança (alergias, uso de
              anticoagulante, gestação), procedimentos realizados, fotos de antes e depois e termos
              de consentimento. São dados pessoais sensíveis e recebem proteção reforçada.
            </>,
            <>
              <strong>Financeiros:</strong> vendas, pacotes adquiridos, formas de pagamento e
              recebimentos. O Fós <strong>não</strong> armazena números de cartão.
            </>,
            <>
              <strong>De atendimento por mensagem:</strong> quando a clínica conecta seu WhatsApp ou
              Instagram, o Fós recebe as mensagens enviadas a ela, com o identificador do remetente e
              o nome de perfil, para registrar o contato e organizar o atendimento.
            </>,
            <>
              <strong>De uso do sistema:</strong> registros de auditoria com quem acessou ou alterou
              dados de saúde, financeiros e exclusões, com data e hora.
            </>,
          ]}
        />
      </Secao>

      <Secao titulo="Para que os dados são usados">
        <P>
          Exclusivamente para operar a clínica: agendar e registrar atendimentos, controlar saldo de
          sessões e pacotes, emitir e acompanhar cobranças, manter histórico clínico, garantir
          rastreabilidade de lotes de insumos e responder ao contato de quem procura a clínica.
        </P>
        <P>
          O Fós <strong>não vende dados</strong>, não os usa para publicidade de terceiros e não os
          compartilha com outras clínicas. Cada clínica enxerga apenas os próprios dados, e esse
          isolamento é aplicado no banco de dados, não só na interface.
        </P>
      </Secao>

      <Secao titulo="Bases legais">
        <P>
          O tratamento se apoia na execução do contrato com a clínica, no cumprimento de obrigações
          legais e regulatórias e no legítimo interesse de operar o serviço. Dados de saúde são
          tratados para a tutela da saúde, em procedimento realizado por profissionais de saúde, e
          mediante consentimento específico quando a lei o exigir — por exemplo, para o uso de fotos
          com finalidade distinta do prontuário.
        </P>
      </Secao>

      <Secao titulo="Com quem os dados são compartilhados">
        <Lista
          itens={[
            <>
              <strong>Supabase</strong> — infraestrutura de banco de dados e armazenamento de
              arquivos.
            </>,
            <>
              <strong>Vercel</strong> — hospedagem da aplicação.
            </>,
            <>
              <strong>Meta (WhatsApp e Instagram)</strong> — quando a clínica opta por conectar esses
              canais, as mensagens trafegam pela infraestrutura da Meta, sujeitas também às políticas
              dela.
            </>,
          ]}
        />
        <P>
          Esses fornecedores atuam sob instrução do Fós e da clínica. Também podemos compartilhar
          dados quando houver ordem judicial ou obrigação legal.
        </P>
      </Secao>

      <Secao titulo="Por quanto tempo os dados são guardados">
        <P>
          Prontuários e registros de atendimento são mantidos pelo prazo exigido pela regulamentação
          aplicável à atividade da clínica. Registros financeiros seguem os prazos fiscais. Encerrado
          o contrato, a clínica pode solicitar a exportação e a eliminação dos dados, ressalvado o
          que a lei obrigue a preservar.
        </P>
      </Secao>

      <Secao titulo="Direitos do titular">
        <P>
          A LGPD garante a você confirmação da existência de tratamento, acesso, correção,
          anonimização, portabilidade, informação sobre compartilhamentos e, quando cabível,
          eliminação dos dados.
        </P>
        <P>
          O Fós oferece à clínica três níveis de remoção: <strong>inativação</strong> (reversível, o
          paciente some das buscas e da agenda mas o histórico é preservado);{' '}
          <strong>anonimização</strong> (irreversível, apaga nome, CPF, contato e fotos, mantendo
          apenas os registros contábeis e a rastreabilidade de lote que a lei exige); e{' '}
          <strong>exclusão física</strong>, disponível apenas para cadastros sem nenhum histórico.
        </P>
      </Secao>

      <Secao titulo="Segurança">
        <P>
          O acesso exige autenticação individual. O isolamento entre clínicas e as permissões por
          perfil são impostos pelo próprio banco de dados, de modo que uma falha na interface não
          expõe dados de outra clínica. Alterações em dados de saúde, financeiros e exclusões geram
          registro de auditoria que não pode ser apagado nem editado, nem por administradores.
        </P>
        <P>
          Nenhum sistema é imune a incidentes. Havendo incidente de segurança com risco relevante,
          comunicaremos as clínicas afetadas e a autoridade competente, conforme a LGPD.
        </P>
      </Secao>

      <Secao titulo="Contato">
        <P>
          Dúvidas sobre esta política ou sobre o tratamento de dados podem ser enviadas para{' '}
          <a href="mailto:matheus@somosatlas.com" style={{ color: 'var(--sage-dark)' }}>
            matheus@somosatlas.com
          </a>
          .
        </P>
      </Secao>

      <p
        style={{
          marginTop: 'var(--space-7)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border-default)',
          fontSize: 12.5,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        Esta política acompanha a evolução do produto. Alterações relevantes serão comunicadas às
        clínicas contratantes antes de entrarem em vigor.
      </p>
    </main>
  );
}
