document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const searchInput = document.querySelector('.search-container input');
    const turmaFilter = document.getElementById('turma-filter');
    const statusFilter = document.getElementById('status-filter');
    const newStudentBtn = document.getElementById('new-student-btn');
    const exportBtn = document.getElementById('export-btn');
    const studentForm = document.getElementById('student-form');
    const modal = document.getElementById('new-student-modal');

    // State
    let students = [];
    let turmas = [];

    // Validation functions
    const validateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= 5;
    };

    const validateEmail = (email) => {
        if (!email) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Initialize
    const init = async () => {
        try {
            await loadTurmas();
            await loadStudents();
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    };

    // Load data
    const loadStudents = async (filters = {}) => {
        try {
            students = await api.fetchAlunos(filters);
            renderStudents();
            updateStatistics();
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadTurmas = async () => {
        try {
            turmas = await api.fetchTurmas();
            populateTurmaSelects();
        } catch (error) {
            console.error('Error loading turmas:', error);
        }
    };

    // Render functions
    const renderStudents = () => {
        const tbody = document.getElementById('students-table-body');
        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.nome}</td>
                <td>${new Date(student.data_nascimento).toLocaleDateString()}</td>
                <td>${student.email || '-'}</td>
                <td>${student.status}</td>
                <td>${student.turma_id ? getTurmaName(student.turma_id) : '-'}</td>
                <td>
                    <button class="btn btn-edit" data-action="edit" data-id="${student.id ?? ''}" aria-label="Editar aluno ${student.nome}">Editar</button>
                    <button class="btn btn-delete" data-action="delete" data-id="${student.id ?? ''}" aria-label="Excluir aluno ${student.nome}">Excluir</button>
                </td>
            </tr>
        `).join('');
    };

    const populateTurmaSelects = () => {
        const turmaOptions = turmas.map(turma => 
            `<option value="${turma.id}">${turma.nome} (${turma.capacidade} vagas)</option>`
        ).join('');
        
        turmaFilter.innerHTML = '<option value="">Todas as turmas</option>' + turmaOptions;
        document.getElementById('turma').innerHTML = '<option value="">Selecione uma turma</option>' + turmaOptions;
    };

    const updateStatistics = () => {
        const total = students.length;
        const ativos = students.filter(s => s.status === 'ativo').length;
        const inativos = total - ativos;

        document.getElementById('total-alunos').textContent = total;
        document.getElementById('alunos-ativos').textContent = ativos;
        document.getElementById('alunos-inativos').textContent = inativos;
    };

    // Event handlers
    const setupEventListeners = () => {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        turmaFilter.addEventListener('change', handleFilters);
        statusFilter.addEventListener('change', handleFilters);
    newStudentBtn.addEventListener('click', (e) => {
        console.log('Novo Aluno button clicked');
        showNotification('Abrindo formulário de novo aluno');
        showModal();
    });
    exportBtn.addEventListener('click', exportData);
        document.querySelectorAll('[data-close-modal]').forEach(btn => 
            btn.addEventListener('click', hideModal)
        );
        // Delegate clicks on edit/delete buttons inside the students table
        const tbody = document.getElementById('students-table-body');
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.dataset.action;
            // Read dataset id safely. Treat empty string or undefined as missing.
            const rawId = btn.dataset.id;
            const id = (rawId === undefined || rawId === '') ? null : Number(rawId);
            if (!action || id === null || Number.isNaN(id)) return;
            if (action === 'edit') {
                editStudent(id);
            } else if (action === 'delete') {
                deleteStudent(id);
            }
        });
    };

    const handleSearch = () => {
        handleFilters();
    };

    const handleFilters = () => {
        const filters = {
            search: searchInput.value,
            turma_id: turmaFilter.value,
            status: statusFilter.value,
        };
        loadStudents(filters);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Validations
        if (!validateAge(data.data_nascimento)) {
            alert('O aluno deve ter pelo menos 5 anos de idade.');
            return;
        }

        if (data.email && !validateEmail(data.email)) {
            alert('Email inválido.');
            return;
        }

        try {
            await api.createAluno(data);
            hideModal();
            await loadStudents();
            e.target.reset();
        } catch (error) {
            console.error('Error creating student:', error);
            alert(error.message || 'Erro ao criar aluno');
        }
    };

    // Utility functions
    const getTurmaName = (turmaId) => {
        const turma = turmas.find(t => t.id === turmaId);
        return turma ? turma.nome : '-';
    };

    const showModal = () => {
        modal.classList.add('open');
        // focus first input for accessibility and to make clear the modal is open
        const nomeInput = document.getElementById('nome');
        if (nomeInput) nomeInput.focus();
    };

    const hideModal = () => {
        modal.classList.remove('open');
        studentForm.reset();
    };

    const exportData = () => {
        const csv = [
            ['Nome', 'Data de Nascimento', 'Email', 'Status', 'Turma'],
            ...students.map(s => [
                s.nome,
                s.data_nascimento,
                s.email || '',
                s.status,
                getTurmaName(s.turma_id)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'alunos.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    };

    // Simple visual notification (toast) for debugging and feedback
    const showNotification = (message, type = 'info') => {
        const n = document.createElement('div');
        n.className = 'notification';
        if (type === 'success') n.classList.add('success');
        n.textContent = message;
        document.body.appendChild(n);
        setTimeout(() => {
            n.style.opacity = '0';
            setTimeout(() => n.remove(), 300);
        }, 1800);
    };

    // Expose edit and delete functions globally so buttons with inline onclick can call them
    window.editStudent = async (id) => {
        // Normalize id for display and lookup
        const idNum = (id === undefined || id === null) ? null : Number(id);
        const idDisplay = (idNum === null || Number.isNaN(idNum)) ? '—' : String(idNum);
        console.log(`[EDIT] requested id=${idDisplay}`);
        showNotification(`Abrindo edição: ${idDisplay}`);
        try {
            const student = students.find(s => s.id === idNum || String(s.id) === String(id));
            if (!student) return alert('Aluno não encontrado');

            // Preenche o formulário com os dados do aluno
            document.getElementById('student-id').value = student.id ?? '';
            document.getElementById('nome').value = student.nome ?? '';
            // data_nascimento pode vir em formato ISO ou já como date string
            const dt = new Date(student.data_nascimento);
            // form expects yyyy-mm-dd
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            document.getElementById('data_nascimento').value = `${yyyy}-${mm}-${dd}`;
            document.getElementById('email').value = student.email ?? '';
            document.getElementById('status').value = student.status ?? 'ativo';
            document.getElementById('turma').value = student.turma_id ?? '';

            // Show modal
            showModal();
        } catch (error) {
            console.error('Error editing student:', error);
            alert('Erro ao abrir formulário de edição');
        }
    };

    window.deleteStudent = async (id) => {
        const idNum = (id === undefined || id === null) ? null : Number(id);
        const idDisplay = (idNum === null || Number.isNaN(idNum)) ? '—' : String(idNum);
        showNotification(`Excluir chamado: ${idDisplay}`);
        if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
        try {
            await api.deleteAluno(idNum);
            await loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert(error.message || 'Erro ao excluir aluno');
        }
    };

    // Override form submit to handle edit vs create
    const handleFormSubmitOverride = async (e) => {
        console.log('handleFormSubmitOverride triggered');
        showNotification('Salvando aluno...');
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // If has id -> update
        if (data.id) {
            const id = data.id;
            delete data.id; // remove id from payload

            // validations similar to create
            if (!validateAge(data.data_nascimento)) {
                alert('O aluno deve ter pelo menos 5 anos de idade.');
                return;
            }
            if (data.email && !validateEmail(data.email)) {
                alert('Email inválido.');
                return;
            }

            try {
                await api.updateAluno(id, data);
                hideModal();
                await loadStudents();
                e.target.reset();
            } catch (error) {
                console.error('Error updating student:', error);
                alert(error.message || 'Erro ao atualizar aluno');
            }
            return;
        }

        // Fallback to create behavior
        return await handleFormSubmit(e);
    };

    // attach override listener
    studentForm.addEventListener('submit', handleFormSubmitOverride);

    // Start the app
    init();
});
