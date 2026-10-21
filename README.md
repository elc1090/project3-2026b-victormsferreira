# Projeto: Aplicação com cadastro e autenticação de usuários integrando frontend, backend e persistência

![Substitua a imagem ao lado por um GIF/WEBP animado mostrando seu projeto](./moho_follow_through2.gif "GIF animado do projeto. Imagem temporária de Moho Animation https://moho.lostmarble.com/products/moho-pro-special-halls-head-college")



## Acesso

Substitua este texto pela URL para acesso ao seu app publicado. Adicione a URL também na seção "About" do seu repositório no GitHub.


## Desenvolvedor(a) / Desenvolvedor(es/as)
Victor Mateus Severo Ferreira


## Proposta
- Ferramenta de modelagem 3D utilizando WebGPU/WebGL? para renderização. Usuários podem salvar e compartilhar publicamente o modelo no site.



## Desenvolvimento

### Processo

Substitua este texto (toda a seção) por uma descrição do processo de desenvolvimento **em primeira pessoa, sem ajuda de IA**.

Para trabalhos em dupla, explicar primeiramente como a dupla se organizou para realizar o trabalho: se houve ou não uma divisão, quem fez o quê, etc.

Cada pessoa deve explicar e justificar suas escolhas, destacando o que já sabia ou não, como lidou com dúvidas ou dificuldades específicas, que adaptações foram necessárias, etc. Evitar comentários genéricos como "pedi ajuda para IA e resolvi", dando preferência para expor detalhes específicos de um problema e sua solução.

### Trechos de código

Substitua este texto por uma indicação de pelo menos 3 trechos de código que você(s) queira(m) destacar para a turma (por exemplo, para explicar algo que aprendeu, para alertar sobre alguma dificuldade de compreensão, para mostrar uma curiosidade, etc).


## Tecnologias

### Linguagens e afins

Substitua este texto por uma lista detalhada de tecnologias utilizadas:
- HTML
- CSS
- JavaScript
- WebGPU
- PocketBase

### Autenticação e autorização

A autenticação foi feita através da API de autenticação do PocketBase. Essa API possibilita a autenticação de várias formas, como email/senha, oauth, MFA, mas nesse projeto utilizei apenas email/senha. Ela armazena um token no navegador até que esse token seja limpado do armazenamento. Para a autorização, utilizei as regras de coleção do PocketBase. Essas regras permitem definir condições nas quais os bancos de dados podem ser acessados pelos usuários. Por exemplo, nesse projeto criei uma regra na coleção de modelos que permite que apenas o dono do modelo seja capaz de edita-lo, e uma regra que permite que apenas o dono possa listar o modelo, a menos que o modelo tenha sido marcado como público.

### Ambiente de desenvolvimento

- VSCode


## Referências e créditos

Substitua este trecho por uma lista bem detalhada de todo material consultado para ajudar no projeto, por exemplo:  URLs de vídeos ou outro material consultado, créditos para colegas que colaboraram, geradores de código, etc.
- [Documentação Web Mozilla](https://developer.mozilla.org/en-US/docs/Web/)
- [Documentação do PocketBase](https://pocketbase.io/docs/)
- [Descrição de Funções SDF por Inigo Quilez](https://iquilezles.org/articles/distfunctions/)
- [Tour da Linguagem WGSL](https://google.github.io/tour-of-wgsl/)




---
Projeto entregue para a disciplina de [Desenvolvimento de Software para a Web](http://github.com/andreainfufsm/elc1090-2026b) em 2026b
