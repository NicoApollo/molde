document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. BANCO DE DADOS E ESTADOS LOCAIS
    // ==========================================
    const DB = {
        getUsers: () => JSON.parse(localStorage.getItem('eb_users')) || [],
        saveUser: (users) => localStorage.setItem('eb_users', JSON.stringify(users)),
        
        getAppointments: () => JSON.parse(localStorage.getItem('eb_appointments')) || [],
        saveAppointments: (apps) => localStorage.setItem('eb_appointments', JSON.stringify(apps)),
        
        getCurrentUser: () => JSON.parse(localStorage.getItem('eb_current_user')),
        setCurrentUser: (user) => localStorage.setItem('eb_current_user', JSON.stringify(user)),
        logout: () => localStorage.removeItem('eb_current_user'),
        
        // Memória do tema escolhido (Salva se é Clínica ou Barbearia)
        getTheme: () => localStorage.getItem('eb_theme') || 'clinic',
        setTheme: (theme) => localStorage.setItem('eb_theme', theme)
    };

    // ==========================================
    // 2. DADOS MULTITENANT (Clínica vs Barbearia)
    // ==========================================
    const themeData = {
        clinic: {
            appName: "Clínica Estética",
            welcomeDesc: "Bem-vinda(o) à clínica!",
            btnAgendar: "Agendar Avaliação",
            titulos: { servicos: "Tratamentos Populares", videos: "Conteúdo Educativo", produtos: "Nossos Produtos", equipe: "Corpo Clínico" },
            servicosOptions: `
                <option value="">Selecione um Serviço...</option>
                <option value="Harmonização Facial">Harmonização Facial</option>
                <option value="Limpeza de Pele">Limpeza de Pele</option>
                <option value="Peeling Químico">Peeling Químico</option>
                <option value="Microagulhamento">Microagulhamento</option>
                <option value="Drenagem Linfática">Drenagem Linfática</option>
                <option value="Preenchimento Labial">Preenchimento Labial</option>`,
            servicos: [
                { nome: "Harmonização Facial", desc: "Avaliação personalizada", img: "https://images.unsplash.com/photo-1598214470830-a8a25c6f6629?w=100&h=100&fit=crop" },
                { nome: "Limpeza de Pele Profunda", desc: "a partir de R$ 120,00", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=100&h=100&fit=crop" },
                { nome: "Peeling Químico", desc: "a partir de R$ 150,00", img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=100&h=100&fit=crop" },
                { nome: "Microagulhamento", desc: "a partir de R$ 250,00", img: "https://images.unsplash.com/photo-1576267423445-6617a20c3866?w=100&h=100&fit=crop" },
                { nome: "Drenagem Linfática Facial", desc: "Sessão por R$ 90,00", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=100&h=100&fit=crop" },
                { nome: "Preenchimento Labial", desc: "Avaliação personalizada", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=100&h=100&fit=crop" }
            ],
            videos: [
                { titulo: "Rotina de Skincare", thumb: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/zpOULjyy-n8" },
                { titulo: "Cuidados Pós-Peeling", thumb: "https://images.unsplash.com/photo-1598214470830-a8a25c6f6629?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/tgbNymZ7vqY" },
                { titulo: "Como aplicar o Sérum", thumb: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
                { titulo: "Botox: Mitos e Verdades", thumb: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/zpOULjyy-n8" },
                { titulo: "Importância da Hidratação", thumb: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/tgbNymZ7vqY" },
                { titulo: "Prevenção do Envelhecimento", thumb: "https://images.unsplash.com/photo-1576267423445-6617a20c3866?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
            ],
            produtos: [
                { nome: "Sérum Vitamina C 15%", preco: "R$ 180,00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop" },
                { nome: "Protetor Solar FPS 70", preco: "R$ 95,00", img: "https://images.unsplash.com/photo-1556228720-192a6af4e661?w=200&h=200&fit=crop" },
                { nome: "Gel de Limpeza", preco: "R$ 65,00", img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop" },
                { nome: "Tônico Facial Revitalizante", preco: "R$ 75,00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=200&h=200&fit=crop" },
                { nome: "Ácido Hialurônico", preco: "R$ 210,00", img: "https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=200&h=200&fit=crop" },
                { nome: "Máscara de Argila Rosa", preco: "R$ 55,00", img: "https://images.unsplash.com/photo-1596755389378-f29e1f57e0bb?w=200&h=200&fit=crop" }
            ],
            profissionais: [
                { nome: "Dra. Helena Costa", especialidade: "Dermatologista", img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop" },
                { nome: "Dra. Camila Alves", especialidade: "Esteticista Cosmetóloga", img: "https://images.unsplash.com/photo-1594824436998-05e923c18ebf?w=150&h=150&fit=crop" },
                { nome: "Dr. Rafael Mendes", especialidade: "Cirurgião Plástico Facial", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop" },
                { nome: "Dra. Beatriz Souza", especialidade: "Biomédica Esteta", img: "https://images.unsplash.com/photo-1614608681987-3c99aeb6999a?w=150&h=150&fit=crop" }
            ]
        },
        barber: {
            appName: "Barbearia Premium",
            welcomeDesc: "Bem-vindo(a) à barbearia!",
            btnAgendar: "Agendar Corte",
            titulos: { servicos: "Serviços Populares", videos: "Dicas de Estilo", produtos: "Linha Masculina", equipe: "Nossos Barbeiros" },
            servicosOptions: `
                <option value="">Selecione um Serviço...</option>
                <option value="Corte Clássico">Corte Clássico</option>
                <option value="Corte Degradê (Fade)">Corte Degradê (Fade)</option>
                <option value="Barboterapia">Barboterapia com Toalha Quente</option>
                <option value="Combo Corte + Barba">Combo Corte + Barba</option>
                <option value="Sobrancelha">Alinhamento de Sobrancelha</option>
                <option value="Platinado">Platinado / Luzes</option>`,
            servicos: [
                { nome: "Corte Degradê (Fade)", desc: "a partir de R$ 45,00", img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=100&h=100&fit=crop" },
                { nome: "Barboterapia", desc: "Toalha quente - R$ 35,00", img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=100&h=100&fit=crop" },
                { nome: "Corte Clássico", desc: "Tesoura - R$ 50,00", img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&h=100&fit=crop" },
                { nome: "Combo Completo", desc: "Corte + Barba - R$ 70,00", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=100&h=100&fit=crop" },
                { nome: "Alinhamento", desc: "Sobrancelha - R$ 15,00", img: "https://images.unsplash.com/photo-1532710093739-9470ac1bf081?w=100&h=100&fit=crop" },
                { nome: "Química Capilar", desc: "Luzes/Platinado - R$ 120,00", img: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=100&h=100&fit=crop" }
            ],
            videos: [
                { titulo: "Estilizando com pomada", thumb: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/zpOULjyy-n8" },
                { titulo: "Cuidando da Barba", thumb: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/tgbNymZ7vqY" },
                { titulo: "Tipos de Fade", thumb: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&h=200&fit=crop", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
            ],
            produtos: [
                { nome: "Pomada Efeito Matte", preco: "R$ 65,00", img: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=200&h=200&fit=crop" },
                { nome: "Óleo Hidratante para Barba", preco: "R$ 45,00", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop" },
                { nome: "Balm Pós Barba", preco: "R$ 55,00", img: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop" },
                { nome: "Shampoo Refrescante", preco: "R$ 40,00", img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=200&h=200&fit=crop" }
            ],
            profissionais: [
                { nome: "Marcos Silva", especialidade: "Master Barber", img: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=150&h=150&fit=crop" },
                { nome: "Tiago Freitas", especialidade: "Especialista em Fade", img: "https://images.unsplash.com/photo-1584043720379-b56cb076d51f?w=150&h=150&fit=crop" },
                { nome: "João Pedro", especialidade: "Barbeiro Clássico", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop" }
            ]
        }
    };

    // ==========================================
    // 3. ALTERNADOR DE TEMAS (O Motor Dinâmico)
    // ==========================================
    window.mudarTema = function(temaSelecionado) {
        DB.setTheme(temaSelecionado);
        const isBarber = temaSelecionado === 'barber';
        
        // Aplica ou remove a classe CSS do modo escuro
        document.body.classList.toggle('theme-barber', isBarber);

        // Puxa os dados do tema atual
        const data = themeData[temaSelecionado];
        
        // Atualiza textos estáticos na tela
        document.getElementById('logo-auth').textContent = data.appName;
        document.getElementById('logo-app').textContent = data.appName;
        document.getElementById('welcome-desc').textContent = data.welcomeDesc;
        document.getElementById('btn-agendar').querySelector('span').textContent = data.btnAgendar;
        
        document.getElementById('servicos-title').textContent = data.titulos.servicos;
        document.getElementById('videos-title').textContent = data.titulos.videos;
        document.getElementById('produtos-title').textContent = data.titulos.produtos;
        document.getElementById('equipe-title').textContent = data.titulos.equipe;

        // Atualiza as opções do modal de agendamento
        document.getElementById('select-servico').innerHTML = data.servicosOptions;

        // Renderiza os cards
        renderizarConteudoEstatico(data);

        // Atualiza a cor do Avatar do usuário
        const user = DB.getCurrentUser();
        if (user) {
            const avatarColor = isBarber ? '444444' : 'f7708e';
            document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${user.nome}&background=${avatarColor}&color=fff`;
        }
    };

    function renderizarConteudoEstatico(data) {
        // Serviços
        document.getElementById('grid-servicos').innerHTML = data.servicos.map(s => `
            <div class="service-card">
                <img src="${s.img}" alt="${s.nome}">
                <div class="service-info"><h4>${s.nome}</h4><p>${s.desc}</p></div>
            </div>
        `).join('');

        // Vídeos
        document.getElementById('grid-videos').innerHTML = data.videos.map(v => `
            <div class="item-card" onclick="abrirVideo('${v.url}', '${v.titulo}')">
                <div style="position:relative;">
                    <img src="${v.thumb}" alt="${v.titulo}">
                    <i class="fa-solid fa-play" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:white; font-size:2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);"></i>
                </div>
                <div class="item-card-body"><h4>${v.titulo}</h4></div>
            </div>
        `).join('');

        // Produtos
        document.getElementById('grid-produtos').innerHTML = data.produtos.map(p => `
            <div class="item-card">
                <img src="${p.img}" alt="${p.nome}">
                <div class="item-card-body"><h4>${p.nome}</h4><p>${p.preco}</p></div>
            </div>
        `).join('');

        // Profissionais
        document.getElementById('lista-profissionais').innerHTML = data.profissionais.map(pro => `
            <div class="pro-card">
                <img src="${pro.img}" alt="${pro.nome}">
                <div class="pro-info"><h4>${pro.nome}</h4><p>${pro.especialidade}</p></div>
            </div>
        `).join('');
    }

    // ==========================================
    // 4. ELEMENTOS DA UI & AUTENTICAÇÃO
    // ==========================================
    const views = {
        auth: document.getElementById('auth-view'),
        app: document.getElementById('app-view'),
        loginForm: document.getElementById('login-form'),
        cadForm: document.getElementById('cadastro-form')
    };

    document.getElementById('link-cadastro').addEventListener('click', (e) => {
        e.preventDefault();
        views.loginForm.classList.add('hidden');
        views.cadForm.classList.remove('hidden');
    });

    document.getElementById('link-login').addEventListener('click', (e) => {
        e.preventDefault();
        views.cadForm.classList.add('hidden');
        views.loginForm.classList.remove('hidden');
    });

    views.cadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value;
        const email = document.getElementById('cad-email').value;
        const senha = document.getElementById('cad-senha').value;

        const users = DB.getUsers();
        if (users.find(u => u.email === email)) return alert('E-mail já cadastrado!');

        const newUser = { id: Date.now(), nome, email, senha };
        users.push(newUser);
        DB.saveUser(users);
        
        DB.setCurrentUser(newUser);
        initApp();
    });

    views.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;

        const user = DB.getUsers().find(u => u.email === email && u.senha === senha);
        if (user) {
            DB.setCurrentUser(user);
            initApp();
        } else {
            alert('E-mail ou senha incorretos.');
        }
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        DB.logout();
        checkSession();
    });

    // ==========================================
    // 5. SISTEMA DE NAVEGAÇÃO DE ABAS
    // ==========================================
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // ==========================================
    // 6. AGENDAMENTOS
    // ==========================================
    const modal = document.getElementById('modal-agendamento');
    const formAgendamento = document.getElementById('form-agendamento');

    document.getElementById('btn-agendar').addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('btn-close').addEventListener('click', () => modal.classList.remove('active'));

    formAgendamento.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = DB.getCurrentUser();
        
        const novoApp = {
            id: Date.now(),
            userId: currentUser.id,
            servico: document.getElementById('select-servico').value,
            data: document.getElementById('input-data').value,
            horario: document.getElementById('select-horario').value,
            status: 'Confirmado'
        };

        const apps = DB.getAppointments();
        apps.push(novoApp);
        DB.saveAppointments(apps);

        modal.classList.remove('active');
        formAgendamento.reset();
        alert('Agendamento realizado!');
        renderAgendamentos();
    });

    function renderAgendamentos() {
        const currentUser = DB.getCurrentUser();
        const meusApps = DB.getAppointments().filter(app => app.userId === currentUser.id);

        const section = document.getElementById('lista-agendamentos-section');
        const container = document.getElementById('lista-agendamentos');
        
        if (meusApps.length > 0) {
            section.style.display = 'block';
            container.innerHTML = meusApps.map(app => `
                <div class="service-card" style="border-left: 4px solid var(--primary-pink);">
                    <div class="service-info">
                        <h4>${app.servico}</h4>
                        <p><i class="fa-regular fa-calendar"></i> ${app.data.split('-').reverse().join('/')} às ${app.horario}</p>
                        <p style="color: green; font-size: 0.8rem; margin-top: 5px;">${app.status}</p>
                    </div>
                    <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } else {
            section.style.display = 'none';
        }
    }

    window.cancelarAgendamento = function(id) {
        if(confirm('Cancelar agendamento?')) {
            let apps = DB.getAppointments().filter(app => app.id !== id);
            DB.saveAppointments(apps);
            renderAgendamentos();
        }
    };

    // ==========================================
    // 7. CONTROLE DO MODAL DE VÍDEO
    // ==========================================
    const modalVideo = document.getElementById('modal-video');
    const videoFrame = document.getElementById('video-frame');
    const videoTitle = document.getElementById('video-title');
    const btnCloseVideo = document.getElementById('btn-close-video');

    window.abrirVideo = function(url, titulo) {
        videoTitle.textContent = titulo;
        videoFrame.src = url; 
        modalVideo.classList.add('active');
    };

    btnCloseVideo.addEventListener('click', () => {
        modalVideo.classList.remove('active');
        videoFrame.src = ""; 
    });

    window.addEventListener('click', (e) => {
        if (e.target === modalVideo) {
            modalVideo.classList.remove('active');
            videoFrame.src = "";
        }
    });

    // ==========================================
    // 8. INICIALIZAÇÃO DO SISTEMA
    // ==========================================
    function checkSession() {
        const user = DB.getCurrentUser();
        if (user) {
            initApp();
        } else {
            views.app.classList.add('hidden');
            views.auth.classList.remove('hidden');
        }
    }

    function initApp() {
        const user = DB.getCurrentUser();
        views.auth.classList.add('hidden');
        views.app.classList.remove('hidden');
        
        document.getElementById('user-greeting').textContent = `Olá, ${user.nome.split(' ')[0]}!`;
        
        renderAgendamentos();
        
        // Puxa o tema salvo no localStorage para renderizar a interface
        mudarTema(DB.getTheme());
    }

    // Carrega o tema na tela de login também
    mudarTema(DB.getTheme());
    checkSession();
});