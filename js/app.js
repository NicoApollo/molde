document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. BANCO DE DADOS (LocalStorage do Salão)
    // ==========================================
    const DB = {
        getUsers: () => JSON.parse(localStorage.getItem('eb_users')) || [],
        saveUser: (users) => localStorage.setItem('eb_users', JSON.stringify(users)),
        
        getAppointments: () => JSON.parse(localStorage.getItem('eb_appointments')) || [],
        saveAppointments: (apps) => localStorage.setItem('eb_appointments', JSON.stringify(apps)),
        
        getCurrentUser: () => JSON.parse(localStorage.getItem('eb_current_user')),
        setCurrentUser: (user) => localStorage.setItem('eb_current_user', JSON.stringify(user)),
        logout: () => localStorage.removeItem('eb_current_user'),

        // RESTAURANDO OS 6 SERVIÇOS ORIGINAIS (Imagens e Textos Exatos)
        getServices: () => {
            let servs = JSON.parse(localStorage.getItem('eb_servs_v3')); // v3 força o navegador a atualizar
            if (!servs || servs.length === 0) {
                servs = [
                    { id: 1, nome: "Corte Feminino", desc: "Lavagem e finalização inclusos", preco: "R$ 120,00", img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=100&h=100&fit=crop" },
                    { id: 2, nome: "Coloração / Mechas", desc: "a partir de R$ 250,00", preco: "R$ 250,00", img: "./img/mechas.jpg" },
                    { id: 3, nome: "Manicure e Pedicure", desc: "Tradicional ou Gel", preco: "R$ 60,00", img: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=100&h=100&fit=crop" },
                    { id: 4, nome: "Maquiagem Profissional", desc: "Social e para Eventos", preco: "R$ 180,00", img: "./img/maquiagem.jpg" },
                    { id: 5, nome: "Penteados", desc: "Tranças, Coques e Escova", preco: "R$ 150,00", img: "./img/penteados.jpg" },
                    { id: 6, nome: "Design de Sobrancelhas", desc: "Com ou sem Henna", preco: "R$ 45,00", img: "./img/sobra.jpg" }
                ];
                localStorage.setItem('eb_servs_v3', JSON.stringify(servs));
            }
            return servs;
        },
        saveServices: (servs) => localStorage.setItem('eb_servs_v3', JSON.stringify(servs)),

        getProfessionals: () => {
            let pros = JSON.parse(localStorage.getItem('eb_pros_v2'));
            if (!pros || pros.length === 0) {
                pros = [
                    { id: 1, nome: "Mariana Silva", email: "mariana@salao.com", isGestor: true, servicos: ["Corte Feminino", "Coloração / Mechas", "Penteados"] },
                    { id: 2, nome: "Julia Torres", email: "julia@salao.com", isGestor: false, servicos: ["Maquiagem Profissional", "Design de Sobrancelhas"] },
                    { id: 3, nome: "Carla Mendes", email: "carla@salao.com", isGestor: false, servicos: ["Manicure e Pedicure"] }
                ];
                localStorage.setItem('eb_pros_v2', JSON.stringify(pros));
            }
            return pros;
        },
        saveProfessionals: (pros) => localStorage.setItem('eb_pros_v2', JSON.stringify(pros)),
    };

    let isAdminBooking = false;
    let currentCalDate = new Date();
    let selectedDateString = null;
    let isCalendarView = false;

    // ==========================================
    // 2. TROCA DE CORES 
    // ==========================================
    window.mudarCor = function(corClass) {
        localStorage.setItem('eb_color', corClass);
        document.body.className = '';
        if (corClass !== 'light-pink') document.body.classList.add(`color-${corClass}`);

        const user = DB.getCurrentUser();
        if (user) {
            const colorHexMap = { 'light-pink': 'f7708e', 'gold': 'd4af37', 'beige': 'dcbfa6', 'aqua': '48d1cc', 'light-purple': 'b39ddb', 'light-blue': '87cefa' };
            const avatarHex = colorHexMap[corClass] || 'f7708e';
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=${avatarHex}&color=fff`;
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
    // 4. LÓGICA DO CALENDÁRIO ADMIN E SERVIÇOS
    // ==========================================
    const btnToggleView = document.getElementById('btn-toggle-view');
    const viewLista = document.getElementById('view-lista');
    const viewCalendario = document.getElementById('view-calendario');

    if(btnToggleView) {
        btnToggleView.addEventListener('click', () => {
            isCalendarView = !isCalendarView;
            if(isCalendarView) {
                viewLista.classList.add('hidden'); viewCalendario.classList.remove('hidden');
                btnToggleView.innerHTML = '<i class="fa-solid fa-list"></i> Lista'; renderCalendar();
            } else {
                viewCalendario.classList.add('hidden'); viewLista.classList.remove('hidden');
                btnToggleView.innerHTML = '<i class="fa-regular fa-calendar-days"></i> Calendário';
            }
        });
    }

    function renderCalendar() {
        const monthYearEl = document.getElementById('cal-month-year');
        const gridEl = document.getElementById('calendar-grid');
        if(!gridEl) return;
        const year = currentCalDate.getFullYear(); const month = currentCalDate.getMonth();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        monthYearEl.textContent = `${monthNames[month]} ${year}`;
        gridEl.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todosApps = DB.getAppointments();

        for(let i = 0; i < firstDay; i++) gridEl.innerHTML += `<div class="cal-day empty"></div>`;

        for(let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const hasAppts = todosApps.some(app => app.data === dateStr);
            const isSelected = selectedDateString === dateStr;
            let classes = 'cal-day';
            if(hasAppts) classes += ' has-appts';
            if(isSelected) classes += ' active';
            gridEl.innerHTML += `<div class="${classes}" onclick="selectCalendarDate('${dateStr}')">${i}</div>`;
        }
    }

    window.selectCalendarDate = function(dateStr) { selectedDateString = dateStr; renderCalendar(); renderCalendarAppointments(); }

    function renderCalendarAppointments() {
        const container = document.getElementById('lista-admin-calendario');
        const title = document.getElementById('cal-selected-date-text');
        if(!container) return;
        if(!selectedDateString) { title.style.display = 'none'; container.innerHTML = ''; return; }

        const apps = DB.getAppointments().filter(app => app.data === selectedDateString);
        title.style.display = 'block';
        title.textContent = `Agendamentos do dia ${selectedDateString.split('-').reverse().join('/')}:`;

        if(apps.length > 0) {
            container.innerHTML = apps.map(app => `
                <div class="service-card" style="border-left: 4px solid var(--primary-color); margin-bottom: 10px;">
                    <div class="service-info">
                        <h4>${app.servico}</h4>
                        <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Cliente:</strong> ${app.clienteNome}</p>
                        <p style="color: var(--text-light); font-size:0.85rem; margin-bottom: 5px;"><strong>Profissional:</strong> ${app.profissionalNome}</p>
                        <p><i class="fa-regular fa-clock"></i> ${app.horario}</p>
                    </div>
                    <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } else { container.innerHTML = '<p style="color: var(--text-light); font-size: 0.9rem;">Livre. Nenhum agendamento neste dia.</p>'; }
    }

    document.getElementById('cal-prev')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('cal-next')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() + 1); renderCalendar(); });

    // ==========================================
    // 5. GESTÃO DE SERVIÇOS DINÂMICOS
    // ==========================================
    function renderServicos() {
        const servicos = DB.getServices();
        
        // 1. Renderiza na Aba Início
        const listaInicio = document.getElementById('lista-servicos-inicio');
        if(listaInicio) {
            if(servicos.length > 0) {
                listaInicio.innerHTML = servicos.map(s => `
                    <div class="service-card">
                        <img src="${s.img}" alt="${s.nome}">
                        <div class="service-info">
                            <h4>${s.nome}</h4>
                            <p>${s.desc}</p>
                        </div>
                        ${s.preco ? `<div class="service-price">${s.preco}</div>` : ''}
                    </div>
                `).join('');
            } else {
                listaInicio.innerHTML = '<p style="color: var(--text-light);">Nenhum serviço cadastrado.</p>';
            }
        }

        // 2. Renderiza na Aba Admin (Lista de Edição)
        const adminServicos = document.getElementById('lista-admin-servicos');
        if(adminServicos) {
            adminServicos.innerHTML = servicos.map(s => `
                <div class="pro-card" style="margin-top: 10px; border: 1px solid rgba(0,0,0,0.1); box-shadow:none;">
                    <img src="${s.img}" style="border-radius: 8px;">
                    <div class="pro-info" style="flex: 1;">
                        <h4 style="color: var(--primary-color);">${s.nome}</h4>
                        <p style="font-size: 0.75rem; color: var(--text-dark);">${s.preco}</p>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="editarServico(${s.id})" style="background:none; border:none; color: var(--primary-color); cursor:pointer;" data-tooltip="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="removerServico(${s.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Remover"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `).join('');
        }

        // 3. Atualiza as Caixinhas do Cadastro de Equipe
        const checkboxesContainer = document.getElementById('checkboxes-servicos-pro');
        if(checkboxesContainer) {
            checkboxesContainer.innerHTML = servicos.map(s => `
                <label><input type="checkbox" name="pro-service" value="${s.nome}"> ${s.nome}</label>
            `).join('');
        }

        // 4. Atualiza o Select do Agendamento
        const selectServico = document.getElementById('select-servico');
        if(selectServico) {
            selectServico.innerHTML = '<option value="">1. Selecione o Serviço...</option>' + 
                servicos.map(s => `<option value="${s.nome}">${s.nome}</option>`).join('');
        }
    }

    const formAdminServico = document.getElementById('form-admin-servico');
    if (formAdminServico) {
        formAdminServico.addEventListener('submit', (e) => {
            e.preventDefault();
            const idEdit = document.getElementById('edit-servico-id').value;
            const nome = document.getElementById('servico-nome').value;
            const desc = document.getElementById('servico-desc').value;
            const preco = document.getElementById('servico-preco').value;
            const img = document.getElementById('servico-img').value;
            
            let servs = DB.getServices();
            if(idEdit) {
                const index = servs.findIndex(s => s.id == idEdit);
                if(index > -1) servs[index] = { id: servs[index].id, nome, desc, preco, img };
                alert('Serviço atualizado com sucesso!');
            } else {
                servs.push({ id: Date.now(), nome, desc, preco, img });
                alert('Serviço adicionado com sucesso!');
            }
            DB.saveServices(servs);
            resetFormServico();
            renderServicos();
            renderEquipes(); 
        });
    }

    window.editarServico = function(id) {
        const s = DB.getServices().find(x => x.id == id);
        if(!s) return;
        document.getElementById('edit-servico-id').value = s.id;
        document.getElementById('servico-nome').value = s.nome;
        document.getElementById('servico-desc').value = s.desc;
        document.getElementById('servico-preco').value = s.preco;
        document.getElementById('servico-img').value = s.img;
        document.getElementById('btn-submit-servico').textContent = 'Salvar Alterações';
        document.getElementById('btn-cancel-edit-servico').classList.remove('hidden');
        document.getElementById('form-admin-servico').scrollIntoView({behavior: 'smooth'});
    };

    window.removerServico = function(id) {
        if(confirm('Atenção: Deletar este serviço removerá ele do catálogo. Continuar?')) {
            DB.saveServices(DB.getServices().filter(s => s.id !== id));
            renderServicos();
        }
    };

    document.getElementById('btn-cancel-edit-servico')?.addEventListener('click', resetFormServico);
    function resetFormServico() {
        if(formAdminServico) formAdminServico.reset();
        document.getElementById('edit-servico-id').value = '';
        document.getElementById('btn-submit-servico').textContent = 'Salvar Serviço';
        document.getElementById('btn-cancel-edit-servico').classList.add('hidden');
    }

    // ==========================================
    // 6. AGENDAMENTO EM CASCATA
    // ==========================================
    const modal = document.getElementById('modal-agendamento');
    const formAgendamento = document.getElementById('form-agendamento');
    const selectServico = document.getElementById('select-servico');
    const selectProfissional = document.getElementById('select-profissional');
    const inputData = document.getElementById('input-data');
    const selectHorario = document.getElementById('select-horario');
    const inputClienteNome = document.getElementById('input-cliente-nome');
    const inputTelefone = document.getElementById('input-telefone');

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
        selectProfissional.disabled = true; inputData.disabled = true;
        selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>'; selectHorario.disabled = true;
        modal.classList.add('active');
    }

    document.getElementById('btn-agendar').addEventListener('click', () => { isAdminBooking = false; abrirModalAgendamento("Novo Horário"); });
    document.getElementById('btn-agendar-admin')?.addEventListener('click', () => { isAdminBooking = true; abrirModalAgendamento("Agendar Cliente"); });
    document.getElementById('btn-close').addEventListener('click', () => modal.classList.remove('active'));

    selectServico.addEventListener('change', (e) => {
        const servico = e.target.value;
        selectProfissional.innerHTML = '<option value="">2. Selecione o Profissional...</option>';
        if(servico) {
            const pros = DB.getProfessionals().filter(p => p.servicos.includes(servico));
            if(pros.length > 0) {
                pros.forEach(p => selectProfissional.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
                selectProfissional.disabled = false;
            } else {
                selectProfissional.innerHTML = '<option value="">Nenhum profissional para este serviço</option>'; selectProfissional.disabled = true;
            }
        } else { selectProfissional.disabled = true; }
        inputData.disabled = true; selectHorario.disabled = true; inputData.value = ''; selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>';
    });

    selectProfissional.addEventListener('change', () => { inputData.disabled = !selectProfissional.value; selectHorario.disabled = true; inputData.value = ''; selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>'; });

    inputData.addEventListener('change', () => {
        const dateVal = inputData.value; const proId = selectProfissional.value;
        selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>';
        if (!dateVal || !proId) { selectHorario.disabled = true; return; }
        selectHorario.disabled = false;
        
        const horariosBase = ["09:00", "10:30", "14:00", "16:30"];
        const apps = DB.getAppointments().filter(a => a.data === dateVal && a.profissionalId == proId);
        const bookedTimes = apps.map(a => a.horario);
        
        const isToday = dateVal === todayStr;
        const currentHour = now.getHours(); const currentMin = now.getMinutes();

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
            telefone: inputTelefone.value, servico: selectServico.value, profissionalId: selectProfissional.value,
            profissionalNome: selectProfissional.options[selectProfissional.selectedIndex].text,
            data: inputData.value, horario: selectHorario.value, status: 'Confirmado'
        };

        const apps = DB.getAppointments(); apps.push(novoApp); DB.saveAppointments(apps);
        modal.classList.remove('active'); formAgendamento.reset();
        alert('Agendamento realizado com sucesso!'); renderAgendamentos();
    });

    // ==========================================
    // 7. RENDERIZAÇÃO DA TELA
    // ==========================================
    function renderAgendamentos() {
        const currentUser = DB.getCurrentUser();
        const todosApps = DB.getAppointments();
        const currentPro = DB.getProfessionals().find(p => p.email === currentUser.email);
        const isGestor = currentPro ? currentPro.isGestor : false;

        const sectionEquipe = document.getElementById('section-gerenciar-equipe');
        const sectionServicos = document.getElementById('section-gerenciar-servicos');
        if(sectionEquipe) sectionEquipe.style.display = isGestor || !currentPro ? 'block' : 'none';
        if(sectionServicos) sectionServicos.style.display = isGestor || !currentPro ? 'block' : 'none';

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
                    <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');
        } else { section.style.display = 'none'; }

        const adminContainer = document.getElementById('lista-admin-agendamentos');
        if (adminContainer) {
            if (todosApps.length > 0) {
                adminContainer.innerHTML = todosApps.map(app => `
                    <div class="service-card" style="border-left: 4px solid #333; margin-bottom: 10px;">
                        <div class="service-info">
                            <h4>${app.servico}</h4>
                            <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Cliente:</strong> ${app.clienteNome}</p>
                            <p style="color: var(--text-light); font-size:0.85rem; margin-bottom: 5px;"><strong>Profissional:</strong> ${app.profissionalNome}</p>
                            <p><i class="fa-regular fa-calendar"></i> ${app.data.split('-').reverse().join('/')} às ${app.horario}</p>
                        </div>
                        <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `).join('');
            } else { adminContainer.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">Nenhum agendamento no sistema.</p>'; }
        }

        if (isCalendarView) { renderCalendar(); renderCalendarAppointments(); }
        renderEquipes();
    }

    // ==========================================
    // 8. GESTÃO E EDIÇÃO DE EQUIPE
    // ==========================================
    function renderEquipes() {
        const pros = DB.getProfessionals();
        const adminEquipe = document.getElementById('lista-admin-equipe');
        if(adminEquipe) {
            if(pros.length > 0) {
                adminEquipe.innerHTML = pros.map(p => `
                    <div class="pro-card" style="margin-top: 10px; border: 1px solid rgba(0,0,0,0.1); box-shadow:none;">
                        <div class="pro-info" style="flex: 1;">
                            <h4 style="color: var(--primary-color);">${p.nome} ${p.isGestor ? '<span style="font-size:0.7rem; background:#333; color:white; padding:2px 6px; border-radius:10px;">Gestor</span>' : ''}</h4>
                            <p style="font-size: 0.75rem; color: var(--text-dark);"><strong>E-mail:</strong> ${p.email || 'N/A'}</p>
                            <p style="font-size: 0.75rem; color: var(--text-light);"><strong>Faz:</strong> ${p.servicos.join(', ')}</p>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="editarProfissional(${p.id})" style="background:none; border:none; color: var(--primary-color); cursor:pointer;"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="removerProfissional(${p.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            } else { adminEquipe.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">Nenhum profissional cadastrado.</p>'; }
        }

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
            } else { publicEquipe.innerHTML = '<p style="text-align:center; color: var(--text-light);">A equipe está sendo formada.</p>'; }
        }
    }

    const formAdminPro = document.getElementById('form-admin-pro');
    if (formAdminPro) {
        formAdminPro.addEventListener('submit', (e) => {
            e.preventDefault();
            const idEdit = document.getElementById('edit-pro-id').value;
            const nome = document.getElementById('pro-nome').value;
            const email = document.getElementById('pro-email') ? document.getElementById('pro-email').value : '';
            const isGestor = document.getElementById('pro-gestor') ? document.getElementById('pro-gestor').checked : false;
            
            const checkboxes = document.querySelectorAll('input[name="pro-service"]:checked');
            let servicosSelecionados = [];
            checkboxes.forEach((cb) => servicosSelecionados.push(cb.value));

            if(servicosSelecionados.length === 0) return alert('Selecione pelo menos um serviço para o profissional!');

            let pros = DB.getProfessionals();
            
            if(idEdit) {
                const index = pros.findIndex(p => p.id == idEdit);
                if(index > -1) {
                    pros[index] = { ...pros[index], nome, email, isGestor, servicos: servicosSelecionados };
                    alert('Profissional atualizado com sucesso!');
                }
            } else {
                pros.push({ id: Date.now(), nome, email, isGestor, servicos: servicosSelecionados });
                alert('Profissional cadastrado com sucesso!');
            }
            
            DB.saveProfessionals(pros);
            resetFormPro();
            renderAgendamentos();
        });
    }

    window.editarProfissional = function(id) {
        const pro = DB.getProfessionals().find(p => p.id == id);
        if(!pro) return;
        
        document.getElementById('edit-pro-id').value = pro.id;
        document.getElementById('pro-nome').value = pro.nome;
        if(document.getElementById('pro-email')) document.getElementById('pro-email').value = pro.email || '';
        if(document.getElementById('pro-gestor')) document.getElementById('pro-gestor').checked = !!pro.isGestor;
        
        document.querySelectorAll('input[name="pro-service"]').forEach(cb => {
            cb.checked = pro.servicos.includes(cb.value);
        });

        document.getElementById('btn-submit-pro').textContent = 'Salvar Alterações';
        const btnCancel = document.getElementById('btn-cancel-edit');
        if(btnCancel) btnCancel.classList.remove('hidden');
        document.getElementById('form-admin-pro').scrollIntoView({behavior: 'smooth'});
    };

    document.getElementById('btn-cancel-edit')?.addEventListener('click', resetFormPro);
    function resetFormPro() {
        if(formAdminPro) formAdminPro.reset();
        document.getElementById('edit-pro-id').value = '';
        document.getElementById('btn-submit-pro').textContent = 'Salvar Profissional';
        const btnCancel = document.getElementById('btn-cancel-edit');
        if(btnCancel) btnCancel.classList.add('hidden');
    }

    window.cancelarAgendamento = function(id) {
        if(confirm('Tem certeza que deseja remover este agendamento?')) {
            DB.saveAppointments(DB.getAppointments().filter(app => app.id !== id));
            renderAgendamentos();
        }
    };

    window.removerProfissional = function(id) {
        if(confirm('Deseja excluir este profissional da equipe?')) {
            DB.saveProfessionals(DB.getProfessionals().filter(p => p.id !== id));
            renderAgendamentos();
        }
    };

    // ==========================================
    // 9. CONTROLE DO MODAL DE VÍDEO
    // ==========================================
    const modalVideo = document.getElementById('modal-video');
    const videoFrame = document.getElementById('video-frame');
    window.abrirVideo = function(url, titulo) { document.getElementById('video-title').textContent = titulo; videoFrame.src = url; modalVideo.classList.add('active'); };
    document.getElementById('btn-close-video').addEventListener('click', () => { modalVideo.classList.remove('active'); videoFrame.src = ""; });
    window.addEventListener('click', (e) => { if (e.target === modalVideo) { modalVideo.classList.remove('active'); videoFrame.src = ""; } });

    const carousel = document.querySelector('.reviews-carousel');
    if (carousel) {
        let isDown = false; let startX; let scrollLeft;
        carousel.addEventListener('mousedown', (e) => { isDown = true; carousel.style.scrollSnapType = 'none'; startX = e.pageX - carousel.offsetLeft; scrollLeft = carousel.scrollLeft; });
        carousel.addEventListener('mouseleave', () => { isDown = false; carousel.style.scrollSnapType = 'x mandatory'; });
        carousel.addEventListener('mouseup', () => { isDown = false; carousel.style.scrollSnapType = 'x mandatory'; });
        carousel.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - carousel.offsetLeft; const walk = (x - startX) * 1.5; carousel.scrollLeft = scrollLeft - walk; });
    }

// ==========================================
    // 10. INICIALIZAÇÃO
    // ==========================================
    function checkSession() { 
        // ----------------------------------------------------
        // MODO DEMONSTRAÇÃO (SEM LOGIN)
        // Cria um usuário falso automaticamente para pular a tela
        let currentUser = DB.getCurrentUser();
        if (!currentUser) {
            currentUser = { id: 9999, nome: "Visitante", email: "demo@demo.com", senha: "123" };
            DB.setCurrentUser(currentUser);
        }
        initApp();
        // ----------------------------------------------------

        /* ====================================================
           QUANDO QUISER VOLTAR O LOGIN, APAGUE O BLOCO ACIMA 
           E DESCOMENTE (TIRE AS BARRAS) DO CÓDIGO ABAIXO:
        ====================================================
        if (DB.getCurrentUser()) { 
            initApp(); 
        } else { 
            views.app.classList.add('hidden'); 
            views.auth.classList.remove('hidden'); 
        } 
        */
    } 

    function initApp() { 
        views.auth.classList.add('hidden'); views.app.classList.remove('hidden'); 
        document.getElementById('user-greeting').textContent = `Olá, ${DB.getCurrentUser().nome.split(' ')[0]}!`; 
        
        const savedColor = localStorage.getItem('eb_color') || 'beige';
        mudarCor(savedColor);
        
        // Renderiza os serviços primeiro, depois o resto
        renderServicos();
        renderAgendamentos(); 
        
        document.querySelector('.nav-btn[data-target="tab-inicio"]').click();
    } 

    checkSession();
});