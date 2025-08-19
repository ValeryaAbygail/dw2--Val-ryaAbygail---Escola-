// Função para mostrar notificações
function showNotification(message, type = 'error') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    document.body.appendChild(notification);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Função para validar a conexão com o backend
async function checkBackendConnection() {
    try {
        const response = await fetch('http://localhost:8000/health');
        if (!response.ok) {
            throw new Error('Backend não está respondendo corretamente');
        }
        return true;
    } catch (error) {
        showNotification('Erro de conexão com o servidor. Verifique se o backend está rodando.');
        return false;
    }
}

// Função para fazer requisições com tratamento de erro
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                detail: 'Erro desconhecido no servidor'
            }));
            throw new Error(errorData.detail || 'Erro na requisição');
        }

        return await response.json();
    } catch (error) {
        showNotification(error.message);
        throw error;
    }
}
