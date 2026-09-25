'use strict';
// Conteúdo inicial das páginas legais (editável depois em /admin → Páginas legais).
// Modelo base alinhado à LGPD (Lei 13.709/2018) — recomenda-se revisão por um advogado.

module.exports = ({ siteName, contactEmail, siteUrl }) => ({
  privacidade: {
    title: 'Política de Privacidade',
    description: `Como a ${siteName} coleta, usa, armazena e protege seus dados pessoais, em conformidade com a LGPD.`,
    content: `
<p>A <strong>${siteName}</strong> leva a sua privacidade a sério. Esta Política explica, de forma clara, quais dados pessoais coletamos, para que os usamos, com quem compartilhamos e quais são os seus direitos, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
<h2>1. Quem somos</h2>
<p>A ${siteName} oferece uma plataforma de inteligência comercial para laboratórios. Para os fins da LGPD, somos a <strong>controladora</strong> dos dados pessoais coletados por meio deste site.</p>
<h2>2. Quais dados coletamos</h2>
<ul>
<li><strong>Dados que você nos informa:</strong> nome, e-mail, telefone/WhatsApp, nome do laboratório e a mensagem enviada pelo formulário de contato.</li>
<li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas, data e horário de acesso, coletados automaticamente para segurança e funcionamento do site.</li>
<li><strong>Dados de clientes da plataforma:</strong> quando você contrata nossos serviços, tratamos os dados necessários à execução do contrato, conforme instrumento próprio.</li>
</ul>
<h2>3. Para que usamos os dados</h2>
<ul>
<li>Responder a solicitações de contato e agendar demonstrações;</li>
<li>Prestar, manter e melhorar nossos serviços;</li>
<li>Enviar comunicações relacionadas ao seu interesse, sempre com opção de descadastro;</li>
<li>Garantir a segurança do site e prevenir fraudes;</li>
<li>Cumprir obrigações legais e regulatórias.</li>
</ul>
<h2>4. Bases legais</h2>
<p>Tratamos dados pessoais com fundamento nas hipóteses do art. 7º da LGPD, em especial: <strong>consentimento</strong>, <strong>execução de contrato</strong> ou de procedimentos preliminares, <strong>legítimo interesse</strong> e <strong>cumprimento de obrigação legal</strong>.</p>
<h2>5. Compartilhamento</h2>
<p>Não vendemos seus dados. Podemos compartilhá-los apenas com fornecedores que nos ajudam a operar (hospedagem, e-mail, ferramentas de atendimento), sob obrigação de confidencialidade, ou com autoridades, quando exigido por lei.</p>
<h2>6. Cookies</h2>
<p>Utilizamos cookies em três categorias:</p>
<ul>
<li><strong>Essenciais:</strong> necessários para a segurança e o funcionamento do site (sempre ativos);</li>
<li><strong>Desempenho:</strong> estatísticas anônimas de visitas, usadas para melhorar o site;</li>
<li><strong>Marketing:</strong> personalização de conteúdos e anúncios.</li>
</ul>
<p>Cookies de desempenho e marketing só são usados com o seu consentimento, dado no aviso exibido na primeira visita. Você pode mudar sua escolha a qualquer momento pelo link <strong>Cookies</strong> no rodapé do site ou pelas configurações do seu navegador.</p>
<h2>7. Armazenamento e segurança</h2>
<p>Adotamos medidas técnicas e administrativas para proteger seus dados, como criptografia de senhas, conexões seguras (HTTPS), controle de acesso e monitoramento. Os dados são mantidos apenas pelo tempo necessário às finalidades descritas ou exigido por lei.</p>
<h2>8. Seus direitos</h2>
<p>Nos termos do art. 18 da LGPD, você pode, a qualquer momento:</p>
<ul>
<li>Confirmar a existência de tratamento e acessar seus dados;</li>
<li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
<li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
<li>Solicitar a portabilidade dos dados;</li>
<li>Revogar o consentimento e ser informado sobre as consequências;</li>
<li>Obter informação sobre com quem compartilhamos seus dados.</li>
</ul>
<p>Para exercer seus direitos, escreva para <a href="mailto:${contactEmail}">${contactEmail}</a>. Responderemos em até 15 dias.</p>
<h2>9. Encarregado (DPO)</h2>
<p>O contato do encarregado pelo tratamento de dados pessoais é <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
<h2>10. Alterações</h2>
<p>Esta Política pode ser atualizada periodicamente. A data da última atualização aparece no topo desta página. Recomendamos a consulta regular.</p>`,
  },

  termos: {
    title: 'Termos de Uso',
    description: `Regras e condições para utilização do site e dos serviços da ${siteName}.`,
    content: `
<p>Bem-vindo à <strong>${siteName}</strong>. Ao acessar e utilizar este site, você concorda com estes Termos de Uso. Se não concordar, recomendamos que não utilize o site.</p>
<h2>1. Objeto</h2>
<p>Este site apresenta a plataforma de inteligência comercial da ${siteName} para laboratórios, disponibiliza conteúdos informativos (blog) e canais de contato. O uso da plataforma contratada é regido também pelo contrato comercial firmado com cada cliente.</p>
<h2>2. Cadastro e acesso</h2>
<ul>
<li>O acesso à plataforma é restrito a clientes com contrato ativo, e os usuários são criados pelo administrador do laboratório;</li>
<li>Você é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas com elas;</li>
<li>Informe-nos imediatamente sobre qualquer uso não autorizado da sua conta.</li>
</ul>
<h2>3. Uso adequado</h2>
<p>Ao utilizar o site e a plataforma, você se compromete a não:</p>
<ul>
<li>Violar leis, direitos de terceiros ou estes Termos;</li>
<li>Tentar acessar áreas restritas, sistemas ou dados sem autorização;</li>
<li>Enviar vírus, códigos maliciosos ou realizar ataques que prejudiquem o funcionamento do serviço;</li>
<li>Copiar, revender ou explorar comercialmente o serviço sem autorização.</li>
</ul>
<h2>4. Propriedade intelectual</h2>
<p>Marcas, logotipos, textos, layouts, softwares e demais conteúdos deste site pertencem à ${siteName} ou a seus licenciadores e são protegidos por lei. É proibida a reprodução sem autorização prévia e por escrito.</p>
<h2>5. Dados do cliente</h2>
<p>Os dados inseridos pelos clientes na plataforma pertencem aos próprios clientes. A ${siteName} os trata exclusivamente para prestar o serviço, conforme a nossa <a href="/privacidade">Política de Privacidade</a> e o contrato aplicável.</p>
<h2>6. Disponibilidade</h2>
<p>Empenhamo-nos para manter o site e a plataforma disponíveis e seguros, mas podem ocorrer interrupções para manutenção, atualizações ou por motivos alheios ao nosso controle.</p>
<h2>7. Limitação de responsabilidade</h2>
<p>Os conteúdos do blog têm caráter informativo e não substituem consultoria especializada. A ${siteName} não se responsabiliza por decisões tomadas exclusivamente com base nesses conteúdos, nem por danos decorrentes de uso indevido do site.</p>
<h2>8. Links de terceiros</h2>
<p>O site pode conter links para sites de terceiros (como WhatsApp, LinkedIn e Instagram). Não nos responsabilizamos pelo conteúdo ou pelas práticas de privacidade desses sites.</p>
<h2>9. Alterações dos Termos</h2>
<p>Estes Termos podem ser atualizados a qualquer momento. A versão vigente estará sempre publicada nesta página, com a data da última atualização.</p>
<h2>10. Legislação e foro</h2>
<p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da ${siteName} para dirimir eventuais controvérsias.</p>
<h2>11. Contato</h2>
<p>Dúvidas sobre estes Termos? Fale com a gente em <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>`,
  },
});
