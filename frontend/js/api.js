const API_BASE_URL = 'http://localhost:8000';

const api = {
    async fetchAlunos(filters = {}) {
        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE_URL}/alunos?${queryParams}`);
        if (!response.ok) throw new Error('Erro ao buscar alunos');
        return response.json();
    },

    async createAluno(data) {
        const response = await fetch(`${API_BASE_URL}/alunos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao criar aluno');
        return response.json();
    },

    async updateAluno(id, data) {
        const response = await fetch(`${API_BASE_URL}/alunos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao atualizar aluno');
        return response.json();
    },

    async deleteAluno(id) {
        const response = await fetch(`${API_BASE_URL}/alunos/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erro ao deletar aluno');
        return response.json();
    },

    async fetchTurmas() {
        const response = await fetch(`${API_BASE_URL}/turmas`);
        if (!response.ok) throw new Error('Erro ao buscar turmas');
        return response.json();
    },

    async createTurma(data) {
        const response = await fetch(`${API_BASE_URL}/turmas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao criar turma');
        return response.json();
    },

    async createMatricula(data) {
        const response = await fetch(`${API_BASE_URL}/matriculas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Erro ao criar matrícula');
        return response.json();
    },
};
