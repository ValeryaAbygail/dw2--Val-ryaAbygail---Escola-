import sqlite3

def setup_test_data():
    conn = sqlite3.connect('escola.db')
    c = conn.cursor()
    
    # Criar uma turma com capacidade maior
    c.execute('''
        INSERT INTO turmas (nome, capacidade)
        VALUES (?, ?)
    ''', ('Turma A', 30))
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    setup_test_data()
    print("Dados de teste criados com sucesso!")
