# Relatório Técnico

## 🏗️ Arquitetura

O sistema segue uma arquitetura cliente-servidor com as seguintes camadas:

1. Frontend (Cliente)
   - HTML/CSS/JS puro
   - Comunicação via Fetch API
   - Validações client-side
   - Acessibilidade nativa

2. Backend (Servidor)
   - FastAPI (framework Python)
   - Pydantic (validação de dados)
   - SQLite (banco de dados)
   - CORS middleware

Fluxo de dados:
```
Request → FastAPI → Pydantic → SQLite → JSON Response
```

## 🛠️ Tecnologias Utilizadas

### Backend
- FastAPI v0.68.0
- Pydantic v1.8.2
- SQLite3 (built-in)
- Python 3.9+

### Frontend
- HTML5
- CSS3
- JavaScript ES6+
- Fontes: Inter/Roboto

## 💡 Prompts Copilot Utilizados

1. Estrutura inicial do projeto:
```
Crie uma estrutura de projeto para um sistema de gestão escolar com FastAPI e frontend vanilla
```

2. Validações de formulário:
```
Implemente validações de formulário para idade mínima e formato de email
```

3. Filtros combinados:
```
Como implementar filtros combinados (turma + status + busca) sem reload da página?
```

4. Acessibilidade:
```
Adicione recursos de acessibilidade para navegação por teclado e leitores de tela
```

5. Exportação CSV:
```
Implemente função para exportar dados dos alunos em formato CSV
```

6. Regras de matrícula:
```
Adicione validações para capacidade de turma na matrícula de alunos
```

## ✨ Peculiaridades Implementadas

1. **Validações Customizadas**
   - Frontend: idade mínima, email regex
   - Backend: Pydantic validators

2. **Filtro Avançado**
   - Combinação de múltiplos filtros
   - Busca em tempo real
   - Sem reload da página

3. **Exportação CSV/JSON**
   - Download da lista atual
   - Preserva filtros aplicados
   - Formato compatível com Excel

## ⚡ Validações

### Frontend
```javascript
const validateAge = (birthDate) => {
    const age = calculateAge(birthDate);
    return age >= 5;
};

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
```

### Backend
```python
@validator('data_nascimento')
def validate_age(cls, v):
    min_age = 5
    if v > (date.today() - timedelta(days=min_age*365)):
        raise ValueError(f'O aluno deve ter pelo menos {min_age} anos')
    return v
```

## ♿ Acessibilidade Aplicada

1. **Navegação**
   - Focus visible
   - Ordem de tabulação lógica
   - Skip links

2. **Formulários**
   - Labels associativos
   - Mensagens de erro
   - Validação inline

3. **Conteúdo Dinâmico**
   - ARIA live regions
   - Status updates
   - Loading states

## 🚀 Como Executar

1. Clone o repositório
2. Configure o backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

3. Configure o frontend:
```bash
cd frontend
python -m http.server 8080
```

4. Acesse: http://localhost:8080

## 🔄 Limitações e Melhorias Futuras

1. **Limitações Atuais**
   - Sem autenticação
   - Dados em memória
   - UI básica

2. **Melhorias Planejadas**
   - Sistema de login
   - Persistência em PostgreSQL
   - UI/UX aprimorada
   - Testes automatizados
   - CI/CD pipeline
