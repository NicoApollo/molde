document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. BANCO DE DADOS (LocalStorage)
    // ==========================================
    const DB = {
        getUsers: () => JSON.parse(localStorage.getItem('eb_users')) || [],
        saveUser: (users) => localStorage.setItem('eb_users', JSON.stringify(users)),
        
        getAppointments: () => JSON.parse(localStorage.getItem('eb_appointments')) || [],
        saveAppointments: (apps) => localStorage.setItem('eb_appointments', JSON.stringify(apps)),
        
        getCurrentUser: () => JSON.parse(localStorage.getItem('eb_current_user')),
        setCurrentUser: (user) => localStorage.setItem('eb_current_user', JSON.stringify(user)),
        logout: () => localStorage.removeItem('eb_current_user'),

        getProfessionals: () => {
            let pros = JSON.parse(localStorage.getItem('eb_pros'));
            if (!pros || pros.length === 0) {
                // Popula profissionais iniciais se o banco estiver vazio
                pros = [
                    { id: 1, nome: "Mariana Silva", servicos: ["Corte Feminino", "Coloração / Mechas", "Penteado"] },
                    { id: 2, nome: "Julia Torres", servicos: ["Maquiagem Profissional", "Design de Sobrancelhas"] },
                    { id: 3, nome: "Carla Mendes", servicos: ["Manicure e Pedicure"] }
                ];
                localStorage.setItem('eb_pros', JSON.stringify(pros));
            }
            return pros;
        },
        saveProfessionals: (pros) => localStorage.setItem('eb_pros', JSON.stringify(pros)),
    };

    let isAdminBooking = false;

    // ==========================================
    // 2. TROCA DE CORES 
    // ==========================================
    window.mudarCor = function(corClass) {
        localStorage.setItem('eb_color', corClass);
        document.body.className = '';
        if (corClass !== 'light-pink') {
            document.body.classList.add(`color-${corClass}`);
        }

        const user = DB.getCurrentUser();
        if (user) {
            const colorHexMap = { 'light-pink': 'f7708e', 'gold': 'd4af37', 'beige': 'dcbfa6', 'aqua': '48d1cc', 'light-purple': 'b39ddb', 'light-blue': '87cefa' };
            const avatarHex = colorHexMap[corClass] || 'f7708e';
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${user.nome}&background=${avatarHex}&color=fff`;
        }
    };

    // ==========================================
    // 3. UI E LOGIN
    // ==========================================
    const views = { auth: document.getElementById('auth-view'), app: document.getElementById('app-view'), loginForm: document.getElementById('login-form'), cadForm: document.getElementById('cadastro-form') };
    
    document.getElementById('link-cadastro').addEventListener('click', (e) => { e.preventDefault(); views.loginForm.classList.add('hidden'); views.cadForm.classList.remove('hidden'); });
    document.getElementById('link-login').addEventListener('click', (e) => { e.preventDefault(); views.cadForm.classList.add('hidden'); views.loginForm.classList.remove('hidden'); });

    views.cadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('cad-nome').value;
        const email = document.getElementById('cad-email').value;
        const senha = document.getElementById('cad-senha').value;
        const users = DB.getUsers();
        if (users.find(u => u.email === email)) return alert('E-mail já cadastrado!');
        const newUser = { id: Date.now(), nome, email, senha };
        users.push(newUser); DB.saveUser(users); DB.setCurrentUser(newUser); initApp();
    });

    views.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const senha = document.getElementById('login-senha').value;
        const user = DB.getUsers().find(u => u.email === email && u.senha === senha);
        if (user) { DB.setCurrentUser(user); initApp(); } else { alert('E-mail ou senha incorretos.'); }
    });

    document.getElementById('btn-logout').addEventListener('click', () => { DB.logout(); checkSession(); });

    // Navegação entre Abas
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });

    // ==========================================
    // 4. AGENDAMENTO E CASCATA DE FILTROS
    // ==========================================
    const modal = document.getElementById('modal-agendamento');
    const formAgendamento = document.getElementById('form-agendamento');
    const selectServico = document.getElementById('select-servico');
    const selectProfissional = document.getElementById('select-profissional');
    const inputData = document.getElementById('input-data');
    const selectHorario = document.getElementById('select-horario');
    const inputClienteNome = document.getElementById('input-cliente-nome');
    const inputTelefone = document.getElementById('input-telefone'); // Elemento Telefone

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    inputData.setAttribute('min', todayStr);

    function abrirModalAgendamento(titulo) {
        document.getElementById('modal-agendamento-titulo').textContent = titulo;
        formAgendamento.reset();
        
        if(isAdminBooking) {
            inputClienteNome.classList.remove('hidden'); inputClienteNome.setAttribute('required', 'true');
        } else {
            inputClienteNome.classList.add('hidden'); inputClienteNome.removeAttribute('required');
        }
        
        selectProfissional.innerHTML = '<option value="">2. Selecione o Profissional...</option>';
        selectProfissional.disabled = true;
        inputData.disabled = true;
        selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>';
        selectHorario.disabled = true;

        modal.classList.add('active');
    }

    document.getElementById('btn-agendar').addEventListener('click', () => { isAdminBooking = false; abrirModalAgendamento("Novo Horário"); });
    document.getElementById('btn-agendar-admin').addEventListener('click', () => { isAdminBooking = true; abrirModalAgendamento("Agendar para Cliente"); });
    document.getElementById('btn-close').addEventListener('click', () => modal.classList.remove('active'));

    // Filtros em Cascata
    selectServico.addEventListener('change', (e) => {
        const servico = e.target.value;
        selectProfissional.innerHTML = '<option value="">2. Selecione o Profissional...</option>';
        if(servico) {
            const pros = DB.getProfessionals().filter(p => p.servicos.includes(servico));
            if(pros.length > 0) {
                pros.forEach(p => selectProfissional.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
                selectProfissional.disabled = false;
            } else {
                selectProfissional.innerHTML = '<option value="">Nenhum profissional para este serviço</option>';
                selectProfissional.disabled = true;
            }
        } else { selectProfissional.disabled = true; }
        inputData.disabled = true; selectHorario.disabled = true; inputData.value = ''; selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>';
    });

    selectProfissional.addEventListener('change', () => {
        inputData.disabled = !selectProfissional.value;
        selectHorario.disabled = true; inputData.value = ''; selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>';
    });

    inputData.addEventListener('change', () => {
        const dateVal = inputData.value;
        const proId = selectProfissional.value;
        selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>';
        
        if (!dateVal || !proId) { selectHorario.disabled = true; return; }
        selectHorario.disabled = false;
        
        const horariosBase = ["09:00", "10:30", "14:00", "16:30"];
        const apps = DB.getAppointments().filter(a => a.data === dateVal && a.profissionalId == proId);
        const bookedTimes = apps.map(a => a.horario);
        
        const isToday = dateVal === todayStr;
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        horariosBase.forEach(h => {
            let [hHora, hMin] = h.split(':').map(Number);
            let isPast = isToday && (hHora < currentHour || (hHora === currentHour && hMin <= currentMin));
            let isBooked = bookedTimes.includes(h);

            if (!isPast) {
                if (isBooked) { selectHorario.innerHTML += `<option value="${h}" disabled>${h} - Indisponível</option>`; } 
                else { selectHorario.innerHTML += `<option value="${h}">${h}</option>`; }
            }
        });
    });

    formAgendamento.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentUser = DB.getCurrentUser();
        const nomeClienteFinal = isAdminBooking ? inputClienteNome.value : currentUser.nome;

        const novoApp = {
            id: Date.now(), userId: currentUser.id, clienteNome: nomeClienteFinal, 
            telefone: inputTelefone.value, // Registra o telefone preenchido
            servico: selectServico.value, profissionalId: selectProfissional.value,
            profissionalNome: selectProfissional.options[selectProfissional.selectedIndex].text,
            data: inputData.value, horario: selectHorario.value, status: 'Confirmado'
        };

        const apps = DB.getAppointments(); apps.push(novoApp); DB.saveAppointments(apps);
        modal.classList.remove('active'); formAgendamento.reset();
        alert('Agendamento realizado!'); renderAgendamentos();
    });

    // ==========================================
    // 5. RENDERIZANDO DADOS E EQUIPE
    // ==========================================
    function renderAgendamentos() {
        const currentUser = DB.getCurrentUser();
        const todosApps = DB.getAppointments();
        
        // Render Cliente (Aba Início)
        const meusApps = todosApps.filter(app => app.clienteNome === currentUser.nome || app.userId === currentUser.id);
        const section = document.getElementById('lista-agendamentos-section');
        const container = document.getElementById('lista-agendamentos');
        
        if (meusApps.length > 0) {
            section.style.display = 'block';
            container.innerHTML = meusApps.map(app => `
                <div class="service-card" style="border-left: 4px solid var(--primary-color);">
                    <div class="service-info">
                        <h4>${app.servico}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 5px;">Com: <strong>${app.profissionalNome}</strong></p>
                        <p><i class="fa-regular fa-calendar"></i> ${app.data.split('-').reverse().join('/')} às ${app.horario}</p>
                        <p style="color: green; font-size: 0.8rem; margin-top: 5px;">${app.status}</p>
                    </div>
                    <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Cancelar">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } else { section.style.display = 'none'; }

        // Render Admin (Aba Admin)
        const adminContainer = document.getElementById('lista-admin-agendamentos');
        if (adminContainer) {
            if (todosApps.length > 0) {
                adminContainer.innerHTML = todosApps.map(app => `
                    <div class="service-card" style="border-left: 4px solid #333; margin-bottom: 10px;">
                        <div class="service-info">
                            <h4>${app.servico}</h4>
                            <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Cliente:</strong> ${app.clienteNome}</p>
                            <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Telefone:</strong> ${app.telefone || 'Não informado'}</p>
                            <p style="color: var(--text-light); font-size:0.85rem; margin-bottom: 5px;"><strong>Profissional:</strong> ${app.profissionalNome}</p>
                            <p><i class="fa-regular fa-calendar"></i> ${app.data.split('-').reverse().join('/')} às ${app.horario}</p>
                        </div>
                        <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Excluir">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            } else { adminContainer.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">Nenhum agendamento no sistema.</p>'; }
        }

        renderEquipes();
    }

    function renderEquipes() {
        const pros = DB.getProfessionals();
        
        // Equipe na visão do Admin
        const adminEquipe = document.getElementById('lista-admin-equipe');
        if(adminEquipe) {
            if(pros.length > 0) {
                adminEquipe.innerHTML = pros.map(p => `
                    <div class="pro-card" style="margin-top: 10px; border: 1px solid rgba(0,0,0,0.1); box-shadow:none;">
                        <div class="pro-info" style="flex: 1;">
                            <h4 style="color: var(--primary-color);">${p.nome}</h4>
                            <p style="font-size: 0.75rem; color: var(--text-dark);"><strong>Faz:</strong> ${p.servicos.join(', ')}</p>
                        </div>
                        <button onclick="removerProfissional(${p.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Demitir Profissional">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            } else { adminEquipe.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">Nenhum profissional cadastrado.</p>'; }
        }

        // Equipe na visão Pública (Aba Equipe)
        const publicEquipe = document.getElementById('lista-profissionais');
        if(publicEquipe) {
            if(pros.length > 0) {
                publicEquipe.innerHTML = pros.map(p => `
                    <div class="pro-card">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.nome)}&background=dcbfa6&color=fff" alt="${p.nome}">
                        <div class="pro-info">
                            <h4>${p.nome}</h4>
                            <p style="font-size: 0.85rem; color: var(--text-light);">${p.servicos.join(' • ')}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                publicEquipe.innerHTML = '<p style="text-align:center; color: var(--text-light);">A equipe está sendo formada.</p>';
            }
        }
    }

    // Formulário do Admin para adicionar Profissionais
    const formAdminPro = document.getElementById('form-admin-pro');
    if (formAdminPro) {
        formAdminPro.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('pro-nome').value;
            const checkboxes = document.querySelectorAll('input[name="pro-service"]:checked');
            let servicosSelecionados = [];
            checkboxes.forEach((cb) => servicosSelecionados.push(cb.value));

            if(servicosSelecionados.length === 0) return alert('Selecione pelo menos um serviço!');

            const pros = DB.getProfessionals();
            pros.push({ id: Date.now(), nome: nome, servicos: servicosSelecionados });
            DB.saveProfessionals(pros);

            formAdminPro.reset();
            alert('Profissional cadastrado com sucesso!');
            renderEquipes();
        });
    }

    window.cancelarAgendamento = function(id) {
        if(confirm('Tem certeza que deseja remover este agendamento?')) {
            DB.saveAppointments(DB.getAppointments().filter(app => app.id !== id));
            renderAgendamentos();
        }
    };

    window.removerProfissional = function(id) {
        if(confirm('Deseja excluir este profissional da equipe? Isso não afetará os agendamentos antigos dele.')) {
            DB.saveProfessionals(DB.getProfessionals().filter(p => p.id !== id));
            renderEquipes();
        }
    };

    // ==========================================
    // 6. CONTROLE DO MODAL DE VÍDEO
    // ==========================================
    const modalVideo = document.getElementById('modal-video');
    const videoFrame = document.getElementById('video-frame');
    window.abrirVideo = function(url, titulo) { document.getElementById('video-title').textContent = titulo; videoFrame.src = url; modalVideo.classList.add('active'); };
    document.getElementById('btn-close-video').addEventListener('click', () => { modalVideo.classList.remove('active'); videoFrame.src = ""; });
    window.addEventListener('click', (e) => { if (e.target === modalVideo) { modalVideo.classList.remove('active'); videoFrame.src = ""; } });

    // ==========================================
    // 7. INICIALIZAÇÃO
    // ==========================================
    function checkSession() { 
        if (DB.getCurrentUser()) { initApp(); } else { views.app.classList.add('hidden'); views.auth.classList.remove('hidden'); } 
    } 

    function initApp() { 
        views.auth.classList.add('hidden'); views.app.classList.remove('hidden'); 
        document.getElementById('user-greeting').textContent = `Olá, ${DB.getCurrentUser().nome.split(' ')[0]}!`; 
        
        const savedColor = localStorage.getItem('eb_color') || 'beige';
        mudarCor(savedColor);
        renderAgendamentos(); 
    } 

    checkSession();
});
