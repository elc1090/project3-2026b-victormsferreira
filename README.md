# Projeto: Aplicação com cadastro e autenticação de usuários integrando frontend, backend e persistência

![gifprojeto](./gif.gif")


## Acesso

https://elc1090.github.io/project3-2026b-victormsferreira/

## Desenvolvedor(a) / Desenvolvedor(es/as)
Victor Mateus Severo Ferreira


## Proposta
- Ferramenta de modelagem 3D utilizando WebGPU/WebGL? para renderização. Usuários podem salvar e compartilhar publicamente o modelo no site.

## Desenvolvimento

### Processo
Iniciei o projeto através da criação de um sistema de autenticação utilizando o PocketBase como backend. Após instalar e inicia-lo, li a documentação e criei uma página HTML simples para a realização de cadastro e login. Essa página contém dois divs, um para o cadastro e o outro para login, e mostra e esconde o div apropriado para a ação sendo realizada. O PocketBase, assim como o Supabase, que havia utilizado no projeto anterior, tornou esse processo bem simples. Uma instância PB já inicia contendo uma coleção de usuários, e para criar um novo usuário, é necessário simplesmente utilizar a API (nesse caso, através do SDK para JavaScript) para criar um novo registro nessa coleção. Uma mudança que fiz na coleção de usuários foi adicionar um constraint de unicidade para o nome de usuário, já que esse nome seria usado para acessar o perfil de usuário.

Após finalizar o sistema de login, comecei a trabalhar no editor e renderizador de modelos, utilizando WebGPU. Para isso, o primeiro passo foi criar um canvas com contexto webgpu e renderizar um triângulo nele. A introdução a WebGPU da documentação web mozilla possuí um trecho de código demonstrando esse processo. Utilizei esse trecho para testar esse canvas, e após isso fiz várias modificações. O processo de inicialização do renderizador consiste de:

1. Fazer uma requisição ao navegador para um dispositivo WebGPU, que é uma abstração sobre a GPU nativa do sistema.
2. Criar um módulo de shader, que é compilado de um script embutido no html da página.
3. Configurar o contexto do canvas para utilizar o dispositivo
4. Criar uma RenderPipeline que utiliza o módulo de shader carregado.
5. Criar um descritor de RenderPass, que configura a textura alvo da renderização, assim como o fato de que antes do passe, essa textura é limpa para a cor preta.
6. Criar os buffers utilizados pelo shader. Um buffer que armazena dados númericos uniformes para o shader, um buffer que armazena todos os objetos a serem renderizados, e um buffer que armazena as matrizes de câmera
7. Criar o bindgroup que conecta todos esses buffers a seus bind slots no shader.

Uma diferença notável do exemplo dado na introdução a WebGPU é o fato de que não há criado nenhuma geometria. O único triângulo rasterizado pelo renderizador é um triângulo que cobre a tela inteira, com suas posições e coordenadas de texturas geradas diretamente no shader, não sendo necessário defini-las em um buffer.

A renderização utiliza uma técnica chamada Ray Marching, especificamente Sphere Tracing, na qual objetos são definidos matematicamente através de funções que calculam a distância de qualquer ponto a superfície do objeto, possibilitando que raios traçados a partir da câmera calculem a sua intersecção com os objetos. Portanto, é necessário apenas que, a cada frame, sejam enviados para os buffers da GPU a as informações da câmera e uma lista de objetos. 

Como o WebGPU no JavaScript utiliza a linguagem WGSL para a escrita de shaders e tinha familiaridade apenas com GLSL no domínio de linguagens de shading, tive que pesquisar alguma introdução a WGSL e encontrei o Tour of WGSL, publicado pelo Google. Após em familiarizar com a sintaxe, escrevi uma implementação simples do Sphere Tracing no WGSL, utilizando o artigo escrito por Inigo Quilez como referência ao implementar as funções de distâncias.

Após realizar a implementação simples desse renderizador, percebi que necessitaria de funções de algebra linear mais complexas para o cálculo da câmera, e após uma pesquisa curta encontrei a biblioteca glMatrix para JavaScript. Utilizei essa biblioteca para implementar a classe Camera no código editor.

Devo notar que nesse ponto acabei desviando um pouco da proposta como feita no quadro. Havia incluído a intenção de utilizar C com WebAssembly para a escrita desse renderizador na proposta, porém após considerar o fato de que, ultimamente, a vasta maioria do renderizador é implementado em um shader WGSL, e não na CPU, o uso de C se tornaria simplesmente uma "cola" entre a interface escrita em HTML e JS e o renderizador, e portanto fiz a decisão de escrever o renderizador diretamente em JS.

Após escrever o renderizador, criei a interface do editor de modelos utilizando HTML. Essa interface permite adicionar, remover, mover e modificar as propriedades de objetos que são então carregados na GPU para renderização. A interface ficou funcional porém bem ruim, porém como ainda tinha que trabalhar no resto do frontend e backend, decidi deixa-la assim.

Quando o editor de modelos estava pronto, criei uma nova coleção no PocketBase para salvar os modelos criados pelos usuários, e adicionei ao editor o botão para salvar o modelo. Essa coleção contém o nome do modelo e o criador, um arquivo .json contendo os objetos que compoem esse modelo, um arquivo .png contendo uma imagem que serve de thumbnail para o modelo quando ele é exibido na galeria, e um valor booleano que declara se esse modelo é público ou não. Adicionei então a essa coleção regras de API que fazem com que apenas o usuário criador do modelo possa edita-lo, e que, se o modelo não for público, apenas o criador também pode vê-lo.

Após isso, utilizei a feature de extensões do PocketBase, que permitem utiliza-lo como um framework de backend JavaScript, para adicionar duas novas rotas ao backend. A rota `/frontpage`, que seleciona os últimos 25 modelos salvados publicamente no site, e rota `users/{name}/models`, que retorna todos os modelos criados por um usuário (o PocketBase automaticamente utiliza as regras de API de coleções como filtros de query, fazendo com que apenas os modelos públicos de usuário sejam retornados caso o usuário fazendo o pedido esteja vendo o perfil de outro usuário, ou todos os modelos, caso o usuário esteja vendo seu próprio perfil). Essas rotas são usadas na página principal do site, que mostra uma galeria de modelos, e na página de perfil de usuário, acessível a clicar o nome de usuário em algum modelo da galeria.

### Trechos de código

Função principal do shader de fragmento, demonstrando o princípio básico do ray marching e a síntaxe da linguagem WGSL
```
@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4f{
    var ro : vec3f = rayOrigin(matrices.view);
    var rd : vec3f = rayDir(matrices.projection, matrices.view, fragData.uv);
    var rayDist : f32 = 0.0;
    const maxDist : f32 = 100.0;
    const epsilon : f32 = 0.001;
    var skyCol : vec3f = mix(vec3f(18, 36, 63) / 255.0, vec3f(184, 233, 212) / 255.0, ((rd.y + 1.0) / 2.0));
    var col : vec3f = skyCol;
    var lightDir : vec3f = normalize((matrices.view * vec4f(1.0, 1.0, 1.0, 0.0)).xyz);
    while (rayDist < maxDist) {
        var scene : vec4f = map(ro);
        if (scene.w <= epsilon) {
            col = scene.xyz;
            var normal : vec3f = mapNormal(ro);
            var ambient = vec3(0.1, 0.1, 0.1) * col;
            var hlf : f32 = ((dot(normal, lightDir) / 2.0) + 0.5);
            hlf *= hlf;
            var l : vec3f = col * hlf;
            col = l + ambient;
            col = mix(col, skyCol, rayDist / maxDist);
            break;
        }
        ro += rd * scene.w;
        rayDist += scene.w;
    }
    return vec4f(col, 1.0);
}
```

A rota `/frontpage` do backend PocketBase
```
routerAdd("GET", "/user/{username}/models", (e) => {
    let user = e.request.pathValue("username");
    let userRecord = $app.findFirstRecordByData("users", "name", user);
    let models = $app.findRecordsByFilter(
        "models",                                    // collection
        "creator = \"" + userRecord.id + "\"",       // filter
        "-updated",                                  // sort
        25,                                          // limit
        0,                                           // offset
    );
    var res = [];
    for (var model of models) {
        var m = {
            id: model.id,
            creator: $app.findRecordById("users", model.get("creator")).get("name"),
            thumbnail: model.get("thumbnail"),
            name: model.get("name"),
        };
        res.push(m);
    }
    return e.json(200, res);
});
```

Cadastro e Autenticação com o PocketBase
```
loginBtn.addEventListener("click", ((e) => {
    pb.collection("users").authWithPassword(
        document.getElementById("loginemail").value,
        document.getElementById("loginpassword").value).then((e) => {
            window.location.replace("/index.html");
        });
}));

signupBtn.addEventListener("click", ((e) => {
    const signupRequest = {
        "email": document.getElementById("signupemail").value,
        "emailVisibility": false,
        "name": document.getElementById("signupname").value,
        "password": document.getElementById("signuppassword").value,
        "passwordConfirm": document.getElementById("signuppasswordconfirm").value
    };
    pb.collection('users').create(signupRequest).then((record) => {
        pb.collection("users").authWithPassword(
            document.getElementById("signupemail").value,
            document.getElementById("signuppassword").value).then((e) => {
                window.location.replace("/index.html");
            });
    });
}));
```

Inicialização do renderizador WebGPU
```
async function init() {
  if (!navigator.gpu) {
    throw Error('WebGPU not supported.');
  }

  adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw Error('Couldn\'t request WebGPU adapter.');
  }

  device = await adapter.requestDevice();

  const shaderModule = device.createShaderModule({
    code: document.getElementById("shader").textContent
  });

  canvas = document.getElementById("wgpu-canvas");
  context = canvas.getContext('webgpu');
  let bounding = canvas.getBoundingClientRect();
  context.canvas.width = bounding.width;
  context.canvas.height = bounding.height;

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied'
  });


  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
      buffers: []
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat()
      }]
    },
    primitive: {
      topology: 'triangle-list'
    },
    layout: 'auto'
  };

  renderPipeline = device.createRenderPipeline(pipelineDescriptor);
    
  descriptor = {
    colorAttachments: [{
      clearValue: {r:0, g:0, b:0, a:1.0},
      loadOp: 'clear',
      storeOp: 'store',
      view: context.getCurrentTexture().createView()
    }]
  };


    const uniformBufferSize = 8;
    uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const shapesBufferSize = 4 * 12 * 128;
    shapesBuffer = device.createBuffer({
        size: shapesBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    const matricesBufferSize = 4 * 16 * 2;
    matricesBuffer = device.createBuffer({
        size: matricesBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });


    bindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
        { 
            binding: 0, 
            resource: uniformBuffer
         },
        { 
            binding: 1, 
            resource: shapesBuffer
         },
        { 
            binding: 2, 
            resource: matricesBuffer
         },
        
        ],
    });

    await getShapes();
}

```

## Tecnologias

### Linguagens e afins

- HTML
- CSS
- JavaScript
- WebGPU
- PocketBase
- glMatrix

### Autenticação e autorização

A autenticação foi feita através da API de autenticação do PocketBase. Essa API possibilita a autenticação de várias formas, como email/senha, oauth, MFA, mas nesse projeto utilizei apenas email/senha. Ela armazena um token no navegador até que esse token seja limpado do armazenamento. Para a autorização, utilizei as regras de coleção do PocketBase. Essas regras permitem definir condições nas quais os bancos de dados podem ser acessados pelos usuários. Por exemplo, nesse projeto criei uma regra na coleção de modelos que permite que apenas o dono do modelo seja capaz de edita-lo, e uma regra que permite que apenas o dono possa listar o modelo, a menos que o modelo tenha sido marcado como público.

### Ambiente de desenvolvimento

- VSCode


## Referências e créditos

- [Documentação Web Mozilla](https://developer.mozilla.org/en-US/docs/Web/)
- [Documentação do PocketBase](https://pocketbase.io/docs/)
- [Descrição de Funções SDF por Inigo Quilez](https://iquilezles.org/articles/distfunctions/)
- [Tour da Linguagem WGSL](https://google.github.io/tour-of-wgsl/)
- [Vídeo de Sebastian Lague sobre Raymarching](https://youtu.be/Cp5WWtMoeKg)
- [Documentação do glMatrix](https://glmatrix.net/docs/)
- [Artigo sobre a renderização de um triângulo em tela cheia sem buffers](https://rauwendaal.net/posts/2014_06_14%20-%20Rendering%20a%20Screen%20Covering%20Triangle%20in%20OpenGL%20(with%20no%C2%A0buffers)/)

---
Projeto entregue para a disciplina de [Desenvolvimento de Software para a Web](http://github.com/andreainfufsm/elc1090-2026b) em 2026b
