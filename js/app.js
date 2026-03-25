document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. BANCO DE DADOS (LocalStorage da Barbearia)
    // Prefixo trocado para bb_ para resetar o cache do salão antigo!
    // ==========================================
    const DB = {
        getUsers: () => JSON.parse(localStorage.getItem('bb_users')) || [],
        saveUser: (users) => localStorage.setItem('bb_users', JSON.stringify(users)),
        
        getAppointments: () => JSON.parse(localStorage.getItem('bb_appointments')) || [],
        saveAppointments: (apps) => localStorage.setItem('bb_appointments', JSON.stringify(apps)),
        
        getCurrentUser: () => JSON.parse(localStorage.getItem('bb_current_user')),
        setCurrentUser: (user) => localStorage.setItem('bb_current_user', JSON.stringify(user)),
        logout: () => localStorage.removeItem('bb_current_user'),

        getProfessionals: () => {
            let pros = JSON.parse(localStorage.getItem('bb_pros'));
            if (!pros || pros.length === 0) {
                pros = [
                    { id: 1, nome: "Rafael Silva", email: "rafael@barber.com", isGestor: true, servicos: ["Corte Degradê / Social", "Barba Terapia", "Combo: Cabelo + Barba"] },
                    { id: 2, nome: "Diego Torres", email: "diego@barber.com", isGestor: false, servicos: ["Corte Degradê / Social", "Luzes / Platinado", "Sobrancelha na Navalha"] },
                    { id: 3, nome: "Lucas Mendes", email: "lucas@barber.com", isGestor: false, servicos: ["Barba Terapia", "Pigmentação de Barba", "Combo: Cabelo + Barba"] }
                ];
                localStorage.setItem('bb_pros', JSON.stringify(pros));
            }
            return pros;
        },
        saveProfessionals: (pros) => localStorage.setItem('bb_pros', JSON.stringify(pros)),
    };

    let isAdminBooking = false;
    let currentCalDate = new Date();
    let selectedDateString = null;
    let isCalendarView = false;

    // ==========================================
    // 2. TROCA DE CORES 
    // ==========================================
    window.mudarCor = function(corClass) {
        localStorage.setItem('bb_color', corClass);
        document.body.className = '';
        if (corClass !== 'dark') document.body.classList.add(`color-${corClass}`); // Barbearia padrão dark

        const user = DB.getCurrentUser();
        if (user) {
            const colorHexMap = { 'dark': '444444', 'gold': 'd4af37', 'beige': 'dcbfa6', 'aqua': '48d1cc', 'light-purple': 'b39ddb', 'light-blue': '87cefa' };
            const avatarHex = colorHexMap[corClass] || '444444';
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
    // 4. LÓGICA DO CALENDÁRIO ADMIN
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
        title.textContent = `Cortes do dia ${selectedDateString.split('-').reverse().join('/')}:`;

        if(apps.length > 0) {
            container.innerHTML = apps.map(app => `
                <div class="service-card" style="border-left: 4px solid var(--primary-color); margin-bottom: 10px;">
                    <div class="service-info">
                        <h4>${app.servico}</h4>
                        <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Cliente:</strong> ${app.clienteNome}</p>
                        <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Contato:</strong> ${app.telefone || 'N/A'}</p>
                        <p style="color: var(--text-light); font-size:0.85rem; margin-bottom: 5px;"><strong>Barbeiro:</strong> ${app.profissionalNome}</p>
                        <p><i class="fa-regular fa-clock"></i> ${app.horario}</p>
                    </div>
                    <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Excluir">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `).join('');
        } else { container.innerHTML = '<p style="color: var(--text-light); font-size: 0.9rem;">Agenda limpa por enquanto.</p>'; }
    }

    document.getElementById('cal-prev')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() - 1); renderCalendar(); });
    document.getElementById('cal-next')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() + 1); renderCalendar(); });

    // ==========================================
    // 5. AGENDAMENTO EM CASCATA
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
        
        selectProfissional.innerHTML = '<option value="">2. Escolha o Barbeiro...</option>';
        selectProfissional.disabled = true; inputData.disabled = true;
        selectHorario.innerHTML = '<option value="">4. Selecione o Horário...</option>'; selectHorario.disabled = true;
        modal.classList.add('active');
    }

    document.getElementById('btn-agendar').addEventListener('click', () => { isAdminBooking = false; abrirModalAgendamento("Marcar Horário"); });
    document.getElementById('btn-agendar-admin')?.addEventListener('click', () => { isAdminBooking = true; abrirModalAgendamento("Lançar Cliente"); });
    document.getElementById('btn-close').addEventListener('click', () => modal.classList.remove('active'));

    selectServico.addEventListener('change', (e) => {
        const servico = e.target.value;
        selectProfissional.innerHTML = '<option value="">2. Escolha o Barbeiro...</option>';
        if(servico) {
            const pros = DB.getProfessionals().filter(p => p.servicos.includes(servico));
            if(pros.length > 0) {
                pros.forEach(p => selectProfissional.innerHTML += `<option value="${p.id}">${p.nome}</option>`);
                selectProfissional.disabled = false;
            } else {
                selectProfissional.innerHTML = '<option value="">Ninguém faz esse trampo</option>'; selectProfissional.disabled = true;
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
                if (isBooked) { selectHorario.innerHTML += `<option value="${h}" disabled>${h} - Ocupado</option>`; } 
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
        alert('Horário marcado com sucesso!'); renderAgendamentos();
    });

    // ==========================================
    // 6. RENDERIZAÇÃO E DEMO
    // ==========================================
    function renderAgendamentos() {
        const currentUser = DB.getCurrentUser();
        const todosApps = DB.getAppointments();
        
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

        const adminContainer = document.getElementById('lista-admin-agendamentos');
        if (adminContainer) {
            if (todosApps.length > 0) {
                adminContainer.innerHTML = todosApps.map(app => `
                    <div class="service-card" style="border-left: 4px solid #333; margin-bottom: 10px;">
                        <div class="service-info">
                            <h4>${app.servico}</h4>
                            <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Cliente:</strong> ${app.clienteNome}</p>
                            <p style="color: var(--text-dark); margin-bottom: 2px;"><strong>Contato:</strong> ${app.telefone || 'N/A'}</p>
                            <p style="color: var(--text-light); font-size:0.85rem; margin-bottom: 5px;"><strong>Barbeiro:</strong> ${app.profissionalNome}</p>
                            <p><i class="fa-regular fa-calendar"></i> ${app.data.split('-').reverse().join('/')} às ${app.horario}</p>
                        </div>
                        <button onclick="cancelarAgendamento(${app.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Excluir">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            } else { adminContainer.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">Agenda limpa por enquanto.</p>'; }
        }

        if (isCalendarView) { renderCalendar(); renderCalendarAppointments(); }
        renderEquipes();
    }

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
                            <button onclick="editarProfissional(${p.id})" style="background:none; border:none; color: var(--primary-color); cursor:pointer;" data-tooltip="Editar">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="removerProfissional(${p.id})" style="background:none; border:none; color: #cc0000; cursor:pointer;" data-tooltip="Demitir">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else { adminEquipe.innerHTML = '<p style="text-align:center; color: var(--text-light); margin-top: 20px;">Nenhum barbeiro cadastrado.</p>'; }
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
            } else { publicEquipe.innerHTML = '<p style="text-align:center; color: var(--text-light);">A tropa está sendo montada.</p>'; }
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

            if(servicosSelecionados.length === 0) return alert('Selecione pelo menos um serviço!');

            let pros = DB.getProfessionals();
            
            if(idEdit) {
                const index = pros.findIndex(p => p.id == idEdit);
                if(index > -1) {
                    pros[index] = { ...pros[index], nome, email, isGestor, servicos: servicosSelecionados };
                    alert('Barbeiro atualizado!');
                }
            } else {
                pros.push({ id: Date.now(), nome, email, isGestor, servicos: servicosSelecionados });
                alert('Barbeiro cadastrado!');
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
        document.getElementById('btn-submit-pro').textContent = 'Salvar Barbeiro';
        const btnCancel = document.getElementById('btn-cancel-edit');
        if(btnCancel) btnCancel.classList.add('hidden');
    }

    window.cancelarAgendamento = function(id) {
        if(confirm('Certeza que deseja remover esse agendamento?')) {
            DB.saveAppointments(DB.getAppointments().filter(app => app.id !== id));
            renderAgendamentos();
        }
    };

    window.removerProfissional = function(id) {
        if(confirm('Tem certeza que deseja demitir este barbeiro?')) {
            DB.saveProfessionals(DB.getProfessionals().filter(p => p.id !== id));
            renderAgendamentos();
        }
    };

    // ==========================================
    // 8. CONTROLE DO MODAL DE VÍDEO E CARROSSEL
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
    // 9. INICIALIZAÇÃO
    // ==========================================
    function checkSession() { 
        if (DB.getCurrentUser()) { initApp(); } else { views.app.classList.add('hidden'); views.auth.classList.remove('hidden'); } 
    } 

    function initApp() { 
        views.auth.classList.add('hidden'); views.app.classList.remove('hidden'); 
        document.getElementById('user-greeting').textContent = `Fala, ${DB.getCurrentUser().nome.split(' ')[0]}!`; 
        
        const savedColor = localStorage.getItem('bb_color') || 'dark'; // Inicia Escuro
        mudarCor(savedColor);
        renderAgendamentos(); 
        
        document.querySelector('.nav-btn[data-target="tab-inicio"]').click();
        
        if (!sessionStorage.getItem('demo_aviso')) {
            setTimeout(() => {
                alert("Bem-vindo ao Modelo de Barbearia!\n\nEste é o modo de Demonstração, sinta-se à vontade para navegar, agendar horários ou demitir os barbeiros na aba Admin!");
                sessionStorage.setItem('demo_aviso', 'true');
            }, 500);
        }
    } 

    checkSession();
});