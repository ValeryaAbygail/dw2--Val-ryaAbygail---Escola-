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
        const age = today.getFullYear() - birth.getFullYear();
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
                    <button class="btn" onclick="editStudent(${student.id})">Editar</button>
                    <button class="btn" onclick="deleteStudent(${student.id})">Excluir</button>
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
        newStudentBtn.addEventListener('click', showModal);
        exportBtn.addEventListener('click', exportData);
        studentForm.addEventListener('submit', handleFormSubmit);
        document.querySelectorAll('[data-close-modal]').forEach(btn => 
            btn.addEventListener('click', hideModal)
        );
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

        if (!validateEmail(data.email)) {
            alert('Email inválido.');
            return;
        }

        try {
            await api.createAluno(data);
            hideModal();
            loadStudents();
            e.target.reset();
        } catch (error) {
            console.error('Error creating student:', error);
            alert('Erro ao criar aluno');
        }
    };

    // Utility functions
    const getTurmaName = (turmaId) => {
        const turma = turmas.find(t => t.id === turmaId);
        return turma ? turma.nome : '-';
    };

    const showModal = () => {
        modal.style.display = 'block';
    };

    const hideModal = () => {
        modal.style.display = 'none';
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

    // Start the app
    init();
});
