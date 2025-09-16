from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import date, datetime, timedelta
import sqlite3
import json

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with actual frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initialization
def init_db():
    try:
        # Remove o banco de dados se existir
        import os
        if os.path.exists('escola.db'):
            os.remove('escola.db')
            print("Banco de dados anterior removido.")
    except:
        print("Erro ao tentar remover banco de dados anterior.")

    conn = sqlite3.connect('escola.db')
    c = conn.cursor()
    
    # Create tables
    c.execute('''
        CREATE TABLE IF NOT EXISTS turmas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            capacidade INTEGER NOT NULL
        )
    ''')
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS alunos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            data_nascimento DATE NOT NULL,
            email TEXT,
            status TEXT NOT NULL,
            turma_id INTEGER,
            FOREIGN KEY (turma_id) REFERENCES turmas (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Banco de dados inicializado com sucesso.")

# Models
class TurmaBase(BaseModel):
    nome: str
    capacidade: int

class Turma(TurmaBase):
    id: int

class AlunoBase(BaseModel):
    nome: str
    data_nascimento: date
    email: Optional[EmailStr] = None
    status: str
    turma_id: Optional[int] = None

    @validator('data_nascimento')
    def validate_age(cls, v):
        min_age = 5
        if v > (date.today() - timedelta(days=min_age*365)):
            raise ValueError(f'O aluno deve ter pelo menos {min_age} anos')
        return v

    @validator('nome')
    def validate_nome(cls, v):
        if len(v) < 3 or len(v) > 80:
            raise ValueError('Nome deve ter entre 3 e 80 caracteres')
        return v

    @validator('status')
    def validate_status(cls, v):
        if v not in ['ativo', 'inativo']:
            raise ValueError('Status deve ser ativo ou inativo')
        return v

class Aluno(AlunoBase):
    id: int

# Routes
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/alunos", response_model=List[Aluno])
async def get_alunos(search: Optional[str] = None, turma_id: Optional[int] = None, status: Optional[str] = None):
    conn = sqlite3.connect('escola.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    query = "SELECT * FROM alunos WHERE 1=1"
    params = []
    
    if search:
        query += " AND nome LIKE ?"
        params.append(f"%{search}%")
    
    if turma_id:
        query += " AND turma_id = ?"
        params.append(turma_id)
    
    if status:
        query += " AND status = ?"
        params.append(status)
    
    c.execute(query, params)
    alunos = [dict(row) for row in c.fetchall()]
    conn.close()
    return alunos

@app.post("/alunos", response_model=Aluno)
async def create_aluno(aluno: AlunoBase):
    try:
        conn = sqlite3.connect('escola.db')
        c = conn.cursor()
        
        # Validações adicionais
        if len(aluno.nome) < 3 or len(aluno.nome) > 80:
            raise HTTPException(status_code=400, detail="Nome deve ter entre 3 e 80 caracteres")
        
        if aluno.data_nascimento > (date.today() - timedelta(days=5*365)):
            raise HTTPException(status_code=400, detail="O aluno deve ter pelo menos 5 anos")
        
        if aluno.status not in ['ativo', 'inativo']:
            raise HTTPException(status_code=400, detail="Status deve ser 'ativo' ou 'inativo'")
        
        if aluno.turma_id:
            # Check if turma exists and has capacity
            c.execute("SELECT id, nome, capacidade FROM turmas WHERE id = ?", (aluno.turma_id,))
            turma = c.fetchone()
            if not turma:
                raise HTTPException(status_code=404, detail="Turma não encontrada")
            
            # Contar apenas alunos ativos na turma
            c.execute("""
                SELECT COUNT(*) 
                FROM alunos 
                WHERE turma_id = ? AND status = 'ativo'
            """, (aluno.turma_id,))
            current_students = c.fetchone()[0]
            
            print(f"DEBUG - Turma {turma[1]}: Capacidade={turma[2]}, Alunos ativos={current_students}")
            
            if current_students >= turma[2]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Turma {turma[1]} está cheia. Capacidade: {turma[2]}, Alunos ativos: {current_students}"
                )
        
        c.execute('''
            INSERT INTO alunos (nome, data_nascimento, email, status, turma_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (aluno.nome, aluno.data_nascimento, aluno.email, aluno.status, aluno.turma_id))
        
        aluno_id = c.lastrowid
        conn.commit()
        conn.close()
        
        return {**aluno.dict(), "id": aluno_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar aluno: {str(e)}")

@app.put("/alunos/{aluno_id}", response_model=Aluno)
async def update_aluno(aluno_id: int, aluno: AlunoBase):
    conn = sqlite3.connect('escola.db')
    c = conn.cursor()
    
    if aluno.turma_id:
        # Check if turma exists and has capacity
        c.execute("SELECT capacidade FROM turmas WHERE id = ?", (aluno.turma_id,))
        turma = c.fetchone()
        if not turma:
            raise HTTPException(status_code=404, detail="Turma não encontrada")
        
        c.execute("""
            SELECT COUNT(*) FROM alunos 
            WHERE turma_id = ? AND id != ?
        """, (aluno.turma_id, aluno_id))
        current_students = c.fetchone()[0]
        if current_students >= turma[0]:
            raise HTTPException(status_code=400, detail="Turma está cheia")
    
    c.execute('''
        UPDATE alunos 
        SET nome = ?, data_nascimento = ?, email = ?, status = ?, turma_id = ?
        WHERE id = ?
    ''', (aluno.nome, aluno.data_nascimento, aluno.email, aluno.status, aluno.turma_id, aluno_id))
    
    if c.rowcount == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    conn.commit()
    conn.close()
    
    return {**aluno.dict(), "id": aluno_id}

@app.delete("/alunos/{aluno_id}")
async def delete_aluno(aluno_id: int):
    conn = sqlite3.connect('escola.db')
    c = conn.cursor()
    
    c.execute("DELETE FROM alunos WHERE id = ?", (aluno_id,))
    
    if c.rowcount == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    conn.commit()
    conn.close()
    return {"message": "Aluno removido com sucesso"}

@app.get("/turmas", response_model=List[Turma])
async def get_turmas():
    conn = sqlite3.connect('escola.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM turmas")
    turmas = [dict(row) for row in c.fetchall()]
    conn.close()
    
    return turmas

@app.post("/turmas", response_model=Turma)
async def create_turma(turma: TurmaBase):
    conn = sqlite3.connect('escola.db')
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO turmas (nome, capacidade)
        VALUES (?, ?)
    ''', (turma.nome, turma.capacidade))
    
    turma_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return {**turma.dict(), "id": turma_id}

@app.post("/matriculas")
async def create_matricula(aluno_id: int, turma_id: int):
    conn = sqlite3.connect('escola.db')
    c = conn.cursor()
    
    # Check if turma exists and has capacity
    c.execute("SELECT capacidade FROM turmas WHERE id = ?", (turma_id,))
    turma = c.fetchone()
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    c.execute("SELECT COUNT(*) FROM alunos WHERE turma_id = ?", (turma_id,))
    current_students = c.fetchone()[0]
    if current_students >= turma[0]:
        raise HTTPException(status_code=400, detail="Turma está cheia")
    
    # Update aluno
    c.execute('''
        UPDATE alunos 
        SET turma_id = ?, status = 'ativo'
        WHERE id = ?
    ''', (turma_id, aluno_id))
    
    if c.rowcount == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    conn.commit()
    conn.close()
    
    return {"message": "Matrícula realizada com sucesso"}

# Initialize database on startup
init_db()
